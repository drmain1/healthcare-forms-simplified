
package pdf

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"time"

	"google.golang.org/api/idtoken"
)

// GotenbergClient is a client for the Gotenberg API.
type GotenbergClient struct {
	Endpoint string
	Client   *http.Client
}

// NewGotenbergClient creates a new Gotenberg client that is authenticated for GCP service-to-service communication.
func NewGotenbergClient(ctx context.Context) (*GotenbergClient, error) {
	endpoint := os.Getenv("GOTENBERG_URL")
	if endpoint == "" {
		return nil, fmt.Errorf("GOTENBERG_URL environment variable not set")
	}

	// Create an HTTP client that automatically adds an identity token to requests.
	// This is required for service-to-service authentication on Cloud Run.
	// The audience should be the URL of the receiving service (Gotenberg).
	idTokenClient, err := idtoken.NewClient(ctx, endpoint)
	if err != nil {
		return nil, fmt.Errorf("failed to create idtoken client: %w", err)
	}
	idTokenClient.Timeout = 60 * time.Second

	return &GotenbergClient{
		Endpoint: endpoint,
		Client:   idTokenClient,
	}, nil
}

// GeneratePDFFromHTML generates a PDF from HTML content using the Gotenberg API.
func (c *GotenbergClient) GeneratePDFFromHTML(ctx context.Context, htmlContent string) ([]byte, error) {
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Add the HTML file
	part, err := writer.CreateFormFile("files", "index.html")
	if err != nil {
		return nil, fmt.Errorf("failed to create form file: %w", err)
	}
	if _, err := io.Copy(part, bytes.NewReader([]byte(htmlContent))); err != nil {
		return nil, fmt.Errorf("failed to write HTML content to form file: %w", err)
	}

	writer.Close()

	req, err := http.NewRequestWithContext(ctx, "POST", c.Endpoint+"/forms/chromium/convert/html", body)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	// No need to manually set the Authorization header.
	// The idtoken.NewClient we used to create c.Client handles this automatically.

	resp, err := c.Client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request to Gotenberg: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		// It's helpful to read the response body for more details on the error
		errorBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("Gotenberg API returned non-200 status code: %d, body: %s", resp.StatusCode, string(errorBody))
	}

	pdf, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read PDF from response body: %w", err)
	}

	return pdf, nil
}
