package pdf

import (
	"context"
	"fmt"
	"time"

	"github.com/chromedp/cdproto/page"
	"github.com/chromedp/chromedp"
)

// GenerateFromHTML creates a PDF from a raw HTML string using a headless browser.
func GenerateFromHTML(ctx context.Context, htmlContent string) ([]byte, error) {
	// Create a new context from the existing one, but with a timeout
	ctx, cancel := context.WithTimeout(ctx, 60*time.Second)
	defer cancel()

	// Create a new allocator
	allocatorCtx, cancel := chromedp.NewExecAllocator(ctx, chromedp.DefaultExecAllocatorOptions[:]...)
	defer cancel()

	// Create a new browser context
	browserCtx, cancel := chromedp.NewContext(allocatorCtx)
	defer cancel()

	var pdfBuffer []byte

	// The data URL prefix is necessary to load the HTML content directly.
	dataURL := fmt.Sprintf("data:text/html,%s", htmlContent)

	err := chromedp.Run(browserCtx,
		chromedp.Navigate(dataURL),
		chromedp.ActionFunc(func(ctx context.Context) error {
			buf, _, err := page.PrintToPDF().WithPrintBackground(true).Do(ctx)
			if err != nil {
				return err
			}
			pdfBuffer = buf
			return nil
		}),
	)

	if err != nil {
		return nil, fmt.Errorf("failed to run headless browser for PDF generation: %w", err)
	}

	return pdfBuffer, nil
}
