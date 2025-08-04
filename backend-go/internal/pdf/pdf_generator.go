package pdf

import (
	"context"
	"fmt"
)

// PDF generation temporarily disabled - will be replaced with Gotenberg service

/*
import (
	"bytes"
	"context"
	"fmt"
	"html/template"
	"log"
	"time"

	"github.com/chromedp/cdproto/page"
	"github.com/chromedp/chromedp"
)

// GenerateFromTemplate creates a PDF from an HTML template and data.
func GenerateFromTemplate(ctx context.Context, templatePath string, data interface{}) ([]byte, error) {
	tmpl, err := template.ParseFiles(templatePath)
	if err != nil {
		return nil, fmt.Errorf("failed to parse template: %w", err)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return nil, fmt.Errorf("failed to execute template: %w", err)
	}

	return GenerateFromHTML(ctx, buf.String())
}

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

	log.Printf("Generating PDF from HTML content...")

	err := chromedp.Run(browserCtx,
		chromedp.Navigate("about:blank"),
		chromedp.ActionFunc(func(ctx context.Context) error {
			frameTree, err := page.GetFrameTree().Do(ctx)
			if err != nil {
				return err
			}
			return page.SetDocumentContent(frameTree.Frame.ID, htmlContent).Do(ctx)
		}),
		chromedp.WaitReady("body", chromedp.ByQuery),
		chromedp.Sleep(2*time.Second), // Give fonts time to load
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
*/

// Temporary placeholder functions until Gotenberg is implemented
func GenerateFromTemplate(ctx context.Context, templatePath string, data interface{}) ([]byte, error) {
	return nil, fmt.Errorf("PDF generation temporarily disabled - Gotenberg integration pending")
}

func GenerateFromHTML(ctx context.Context, htmlContent string) ([]byte, error) {
	return nil, fmt.Errorf("PDF generation temporarily disabled - Gotenberg integration pending")
}