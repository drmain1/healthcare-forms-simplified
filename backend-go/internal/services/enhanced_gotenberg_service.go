package services

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"sync"
	"time"

	"google.golang.org/api/idtoken"
)

// CircuitBreaker implements the circuit breaker pattern
type CircuitBreaker struct {
	mu             sync.RWMutex
	maxFailures    int
	resetTimeout   time.Duration
	failureCount   int
	lastFailTime   time.Time
	state          CircuitState
}

type CircuitState int

const (
	CircuitClosed CircuitState = iota
	CircuitOpen
	CircuitHalfOpen
)

func NewCircuitBreaker(maxFailures int, resetTimeout time.Duration) *CircuitBreaker {
	return &CircuitBreaker{
		maxFailures:  maxFailures,
		resetTimeout: resetTimeout,
		state:        CircuitClosed,
	}
}

func (cb *CircuitBreaker) Execute(fn func() (interface{}, error)) (interface{}, error) {
	cb.mu.RLock()
	state := cb.state
	failureCount := cb.failureCount
	lastFailTime := cb.lastFailTime
	cb.mu.RUnlock()

	// Check if circuit should move from Open to Half-Open
	if state == CircuitOpen {
		if time.Since(lastFailTime) > cb.resetTimeout {
			cb.mu.Lock()
			cb.state = CircuitHalfOpen
			cb.mu.Unlock()
			state = CircuitHalfOpen
		} else {
			return nil, fmt.Errorf("circuit breaker is open (failures: %d)", failureCount)
		}
	}

	// Execute the function
	result, err := fn()

	cb.mu.Lock()
	defer cb.mu.Unlock()

	if err != nil {
		cb.onFailure()
		return nil, err
	}

	cb.onSuccess()
	return result, nil
}

func (cb *CircuitBreaker) onSuccess() {
	cb.failureCount = 0
	cb.state = CircuitClosed
}

func (cb *CircuitBreaker) onFailure() {
	cb.failureCount++
	cb.lastFailTime = time.Now()
	
	if cb.failureCount >= cb.maxFailures {
		cb.state = CircuitOpen
		log.Printf("Circuit breaker opened after %d failures", cb.failureCount)
	}
}

// EnhancedGotenbergService provides enhanced Gotenberg interactions with retry and circuit breaker
type EnhancedGotenbergService struct {
	baseURL        string
	httpClient     *http.Client
	maxRetries     int
	retryDelay     time.Duration
	circuitBreaker *CircuitBreaker
}

func NewEnhancedGotenbergService() *EnhancedGotenbergService {
	gotenbergURL := os.Getenv("GOTENBERG_URL")
	if gotenbergURL == "" {
		gotenbergURL = "http://localhost:3000"
	}

	return &EnhancedGotenbergService{
		baseURL: gotenbergURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		maxRetries:     3,
		retryDelay:     time.Second,
		circuitBreaker: NewCircuitBreaker(5, time.Minute),
	}
}

func (s *EnhancedGotenbergService) ConvertHTMLToPDF(htmlContent string) ([]byte, error) {
	result, err := s.circuitBreaker.Execute(func() (interface{}, error) {
		return s.convertWithRetry(htmlContent)
	})

	if err != nil {
		return nil, err
	}

	return result.([]byte), nil
}

func (s *EnhancedGotenbergService) convertWithRetry(htmlContent string) ([]byte, error) {
	var lastErr error

	for attempt := 0; attempt <= s.maxRetries; attempt++ {
		if attempt > 0 {
			// Exponential backoff
			backoffDuration := s.retryDelay * time.Duration(attempt)
			log.Printf("Gotenberg retry attempt %d after %v", attempt+1, backoffDuration)
			time.Sleep(backoffDuration)
		}

		pdfBytes, err := s.performConversion(htmlContent)
		if err == nil {
			if attempt > 0 {
				log.Printf("Gotenberg conversion succeeded on attempt %d", attempt+1)
			}
			return pdfBytes, nil
		}

		lastErr = err
		
		// Don't retry on certain errors (4xx status codes except 429)
		if httpErr, ok := err.(*HTTPError); ok {
			if httpErr.StatusCode >= 400 && httpErr.StatusCode < 500 && httpErr.StatusCode != 429 {
				log.Printf("Gotenberg conversion failed with non-retryable error: %v", err)
				break
			}
		}

		log.Printf("Gotenberg conversion attempt %d failed: %v", attempt+1, err)
	}

	return nil, fmt.Errorf("all conversion attempts failed, last error: %w", lastErr)
}

type HTTPError struct {
	StatusCode int
	Body       string
}

func (e *HTTPError) Error() string {
	return fmt.Sprintf("HTTP %d: %s", e.StatusCode, e.Body)
}

func (s *EnhancedGotenbergService) performConversion(htmlContent string) ([]byte, error) {
	conversionURL := s.baseURL + "/forms/chromium/convert/html"

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Add the HTML file to the request
	part, err := writer.CreateFormFile("index.html", "index.html")
	if err != nil {
		return nil, fmt.Errorf("failed to create form file for index.html: %w", err)
	}
	
	if _, err = io.Copy(part, bytes.NewReader([]byte(htmlContent))); err != nil {
		return nil, fmt.Errorf("failed to copy html content to form: %w", err)
	}

	// Add PDF options
	err = s.addPDFOptions(writer)
	if err != nil {
		return nil, fmt.Errorf("failed to add PDF options: %w", err)
	}

	// Close the writer
	if err = writer.Close(); err != nil {
		return nil, fmt.Errorf("failed to close multipart writer: %w", err)
	}

	// Create the request
	req, err := http.NewRequest("POST", conversionURL, body)
	if err != nil {
		return nil, fmt.Errorf("failed to create gotenberg request: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	// Create authenticated client for Cloud Run service-to-service communication
	ctx := context.Background()
	client, err := idtoken.NewClient(ctx, s.baseURL)
	if err != nil {
		log.Printf("Failed to create authenticated client, falling back to regular HTTP: %v", err)
		client = s.httpClient
	}

	// Send the request
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request to gotenberg: %w", err)
	}
	defer resp.Body.Close()

	// Handle non-OK responses
	if resp.StatusCode != http.StatusOK {
		errorBody, _ := io.ReadAll(resp.Body)
		return nil, &HTTPError{
			StatusCode: resp.StatusCode,
			Body:       string(errorBody),
		}
	}

	// Read the PDF from the response
	pdfBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read pdf from gotenberg response: %w", err)
	}

	// Validate PDF size
	if len(pdfBytes) < 100 {
		return nil, fmt.Errorf("generated PDF appears to be invalid (size: %d bytes)", len(pdfBytes))
	}

	return pdfBytes, nil
}

func (s *EnhancedGotenbergService) addPDFOptions(writer *multipart.Writer) error {
	// Add PDF generation options for better output
	options := map[string]string{
		"marginTop":    "0.5in",
		"marginBottom": "0.5in",
		"marginLeft":   "0.5in",
		"marginRight":  "0.5in",
		"printBackground": "true",
		"preferCSSPageSize": "true",
		"format": "A4",
		"landscape": "false",
	}

	for key, value := range options {
		if err := writer.WriteField(key, value); err != nil {
			return fmt.Errorf("failed to write field %s: %w", key, err)
		}
	}

	return nil
}

// GetServiceHealth checks if Gotenberg service is healthy
func (s *EnhancedGotenbergService) GetServiceHealth() error {
	healthURL := s.baseURL + "/health"
	
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	req, err := http.NewRequestWithContext(ctx, "GET", healthURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create health check request: %w", err)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("health check failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("health check returned status %d", resp.StatusCode)
	}

	return nil
}

// GetMetrics returns current circuit breaker and service metrics
func (s *EnhancedGotenbergService) GetMetrics() map[string]interface{} {
	s.circuitBreaker.mu.RLock()
	defer s.circuitBreaker.mu.RUnlock()

	return map[string]interface{}{
		"circuit_state":     s.getCircuitStateName(),
		"failure_count":     s.circuitBreaker.failureCount,
		"max_failures":      s.circuitBreaker.maxFailures,
		"last_failure_time": s.circuitBreaker.lastFailTime,
		"max_retries":       s.maxRetries,
		"retry_delay_ms":    s.retryDelay.Milliseconds(),
	}
}

func (s *EnhancedGotenbergService) getCircuitStateName() string {
	switch s.circuitBreaker.state {
	case CircuitClosed:
		return "closed"
	case CircuitOpen:
		return "open"
	case CircuitHalfOpen:
		return "half-open"
	default:
		return "unknown"
	}
}