package services

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	
	"google.golang.org/api/idtoken"
)

// GotenbergService provides methods for interacting with a Gotenberg instance.
type GotenbergService struct {
	url string
}

// NewGotenbergService creates a new instance of GotenbergService.
func NewGotenbergService() *GotenbergService {
	gotenbergURL := os.Getenv("GOTENBERG_URL")
	if gotenbergURL == "" {
		// Fallback for local development
		gotenbergURL = "http://localhost:3000"
	}
	return &GotenbergService{url: gotenbergURL}
}

// ConvertHTMLToPDF sends an HTML string to Gotenberg and returns the resulting PDF bytes.
func (s *GotenbergService) ConvertHTMLToPDF(htmlContent string) ([]byte, error) {
	conversionURL := s.url + "/forms/chromium/convert/html"

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Add the HTML file to the request.
	part, err := writer.CreateFormFile("files", "index.html")
	if err != nil {
		return nil, fmt.Errorf("failed to create form file for index.html: %w", err)
	}
	if _, err = io.Copy(part, bytes.NewReader([]byte(htmlContent))); err != nil {
		return nil, fmt.Errorf("failed to copy html content to form: %w", err)
	}

	// Add standard PDF options
	_ = writer.WriteField("marginTop", "0.5")
	_ = writer.WriteField("marginBottom", "0.5")
	_ = writer.WriteField("marginLeft", "0.5")
	_ = writer.WriteField("marginRight", "0.5")

	// Close the writer.
	if err = writer.Close(); err != nil {
		return nil, fmt.Errorf("failed to close multipart writer: %w", err)
	}

	// Create and send the request.
	req, err := http.NewRequest("POST", conversionURL, body)
	if err != nil {
		return nil, fmt.Errorf("failed to create gotenberg request: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	// Create an authenticated client for Cloud Run service-to-service communication
	ctx := context.Background()
	client, err := idtoken.NewClient(ctx, s.url)
	if err != nil {
		// Fallback to regular HTTP client (for local development)
		client = &http.Client{}
	}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request to gotenberg: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		errorBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("gotenberg returned non-OK status %d: %s", resp.StatusCode, string(errorBody))
	}

	// Read the PDF from the response.
	pdfBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read pdf from gotenberg response: %w", err)
	}

	return pdfBytes, nil
}
