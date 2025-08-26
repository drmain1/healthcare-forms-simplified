package services

import (
	"bytes"
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"time"
)

// GotenbergService provides methods for interacting with a Gotenberg instance.
type GotenbergService struct {
	url    string
	client *http.Client
}

// newSecureGotenbergClient creates an HTTP client configured to trust our private CA.
func newSecureGotenbergClient() (*http.Client, error) {
	// Path to the CA certificate file inside the container, copied via Dockerfile.
	caCertPath := "/etc/ssl/certs/ca.pem"

	caCert, err := os.ReadFile(caCertPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read CA certificate from %s: %w", caCertPath, err)
	}

	caCertPool := x509.NewCertPool()
	if ok := caCertPool.AppendCertsFromPEM(caCert); !ok {
		return nil, fmt.Errorf("failed to append CA cert to pool")
	}

	tlsConfig := &tls.Config{
		RootCAs: caCertPool,
	}

	transport := &http.Transport{
		TLSClientConfig: tlsConfig,
	}

	return &http.Client{
		Transport: transport,
		Timeout:   60 * time.Second,
	}, nil
}

// NewGotenbergService creates a new instance of GotenbergService.
func NewGotenbergService() *GotenbergService {
	gotenbergURL := os.Getenv("GOTENBERG_URL")
	if gotenbergURL == "" {
		gotenbergURL = "http://localhost:3000" // Default for local
	}

	// Try to create the secure client for production environments.
	secureClient, err := newSecureGotenbergClient()
	if err != nil {
		// If creating the secure client fails, log a warning and use a standard, insecure client.
		// This allows local development to work and prevents production from crash-looping if the cert is bad.
		log.Printf("WARNING: Could not create secure HTTP client (%v). Falling back to a standard client. This is expected for local development but is an error in production.", err)
		return &GotenbergService{
			url:    gotenbergURL,
			client: &http.Client{Timeout: 60 * time.Second},
		}
	}

	log.Println("INFO: Successfully created secure HTTP client for Gotenberg.")
	return &GotenbergService{
		url:    gotenbergURL,
		client: secureClient,
	}
}

// ConvertHTMLToPDF sends an HTML string to Gotenberg and returns the resulting PDF bytes.
func (s *GotenbergService) ConvertHTMLToPDF(htmlContent string) ([]byte, error) {
	conversionURL := s.url + "/forms/chromium/convert/html"

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	part, err := writer.CreateFormFile("files", "index.html")
	if err != nil {
		return nil, fmt.Errorf("failed to create form file for index.html: %w", err)
	}
	if _, err = io.Copy(part, bytes.NewReader([]byte(htmlContent))); err != nil {
		return nil, fmt.Errorf("failed to copy html content to form: %w", err)
	}

	_ = writer.WriteField("marginTop", "0.5")
	_ = writer.WriteField("marginBottom", "0.5")
	_ = writer.WriteField("marginLeft", "0.5")
	_ = writer.WriteField("marginRight", "0.5")

	if err = writer.Close(); err != nil {
		return nil, fmt.Errorf("failed to close multipart writer: %w", err)
	}

	req, err := http.NewRequest("POST", conversionURL, body)
	if err != nil {
		return nil, fmt.Errorf("failed to create gotenberg request: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request to gotenberg: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		errorBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("gotenberg returned non-OK status %d: %s", resp.StatusCode, string(errorBody))
	}

	pdfBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read pdf from gotenberg response: %w", err)
	}

	return pdfBytes, nil
}
