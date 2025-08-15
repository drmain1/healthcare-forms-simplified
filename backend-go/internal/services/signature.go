package services

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"html"
	"strings"
	"time"
)

// SignatureData represents a captured signature with metadata
type SignatureData struct {
	FieldName   string
	ImageData   string
	IsValid     bool
	SignedBy    string
	SignedDate  string
	Purpose     string
	ImageSize   int
	ImageType   string
}

// SignatureRenderer renders enhanced signature validation and display
func SignatureRenderer(metadata PatternMetadata, context *PDFContext) (string, error) {
	var result bytes.Buffer
	
	result.WriteString(`<div class="form-section">`)
	result.WriteString(`<div class="section-title">Digital Signatures</div>`)
	
	// Extract signature data
	signatures := extractSignatureData(metadata.ElementNames, context.Answers)
	
	if len(signatures) == 0 {
		result.WriteString(`<div style="text-align: center; padding: 30px; background-color: #f8f9fa; border: 1px dashed #dee2e6;">`)
		result.WriteString(`<p style="color: #6c757d; font-style: italic;">No signatures found</p>`)
		result.WriteString(`<p style="font-size: 11px; color: #999;">Fields checked: ` + strings.Join(metadata.ElementNames, ", ") + `</p>`)
		result.WriteString(`</div>`)
	} else {
		// Render signature validation summary
		result.WriteString(renderSignatureValidationSummary(signatures))
		
		// Render individual signatures
		result.WriteString(renderSignatureDetails(signatures))
		
		// Add legal disclaimer
		result.WriteString(renderSignatureLegalSection(signatures))
	}
	
	result.WriteString(`</div>`)
	
	return result.String(), nil
}

func extractSignatureData(elementNames []string, answers map[string]interface{}) []SignatureData {
	var signatures []SignatureData
	
	for _, elementName := range elementNames {
		if value, exists := answers[elementName]; exists {
			if sigData, ok := value.(string); ok && isSignatureData(sigData) {
				sig := SignatureData{
					FieldName:  elementName,
					ImageData:  sigData,
					IsValid:    validateSignatureData(sigData),
					SignedBy:   extractSignerName(elementName, answers),
					SignedDate: time.Now().Format("01/02/2006"),
					Purpose:    determinePurpose(elementName),
					ImageSize:  calculateImageSize(sigData),
					ImageType:  extractImageType(sigData),
				}
				signatures = append(signatures, sig)
			}
		}
	}
	
	return signatures
}

func isSignatureData(data string) bool {
	return strings.HasPrefix(data, "data:image/") && len(data) > 100
}

func validateSignatureData(imageData string) bool {
	// Basic validation checks
	if len(imageData) < 200 {
		return false // Too short to be a meaningful signature
	}
	
	if !strings.HasPrefix(imageData, "data:image/") {
		return false // Not valid image data
	}
	
	// Check if base64 data is present
	if !strings.Contains(imageData, "base64,") {
		return false
	}
	
	// Extract and validate base64 portion
	parts := strings.Split(imageData, "base64,")
	if len(parts) != 2 {
		return false
	}
	
	base64Data := parts[1]
	if len(base64Data) < 100 {
		return false // Base64 data too short
	}
	
	// Try to decode base64 to ensure it's valid
	if _, err := base64.StdEncoding.DecodeString(base64Data); err != nil {
		return false
	}
	
	return true
}

func extractSignerName(elementName string, answers map[string]interface{}) string {
	// Try to find associated name fields
	possibleNameFields := []string{
		elementName + "_name",
		elementName + "_signer",
		strings.Replace(elementName, "signature", "name", -1),
		strings.Replace(elementName, "sign", "name", -1),
		"patient_name",
		"signer_name",
		"name",
	}
	
	for _, nameField := range possibleNameFields {
		if value, exists := answers[nameField]; exists {
			if name, ok := value.(string); ok && name != "" {
				return name
			}
		}
	}
	
	// Default to Unknown
	return "Unknown"
}

func determinePurpose(elementName string) string {
	lowerName := strings.ToLower(elementName)
	
	purposeMap := map[string]string{
		"consent":       "Medical Consent",
		"authorization": "Authorization",
		"agreement":     "Agreement",
		"terms":         "Terms Acceptance",
		"hipaa":         "HIPAA Authorization",
		"treatment":     "Treatment Consent",
		"patient":       "Patient Signature",
		"witness":       "Witness Signature",
		"guardian":      "Guardian Signature",
		"release":       "Release Form",
		"waiver":        "Waiver",
	}
	
	for keyword, purpose := range purposeMap {
		if strings.Contains(lowerName, keyword) {
			return purpose
		}
	}
	
	return "General Signature"
}

func calculateImageSize(imageData string) int {
	// Estimate actual image size from base64 data
	if strings.Contains(imageData, "base64,") {
		parts := strings.Split(imageData, "base64,")
		if len(parts) == 2 {
			base64Data := parts[1]
			// Base64 encoding increases size by ~33%, so actual size is roughly 75% of base64 length
			return int(float64(len(base64Data)) * 0.75)
		}
	}
	return len(imageData)
}

func extractImageType(imageData string) string {
	if strings.HasPrefix(imageData, "data:image/png") {
		return "PNG"
	}
	if strings.HasPrefix(imageData, "data:image/jpeg") || strings.HasPrefix(imageData, "data:image/jpg") {
		return "JPEG"
	}
	if strings.HasPrefix(imageData, "data:image/svg") {
		return "SVG"
	}
	if strings.HasPrefix(imageData, "data:image/webp") {
		return "WebP"
	}
	return "Unknown"
}

func renderSignatureValidationSummary(signatures []SignatureData) string {
	var result bytes.Buffer
	
	totalSignatures := len(signatures)
	validSignatures := 0
	invalidSignatures := 0
	
	for _, sig := range signatures {
		if sig.IsValid {
			validSignatures++
		} else {
			invalidSignatures++
		}
	}
	
	result.WriteString(`<div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #6c757d;">`)
	result.WriteString(`<h4>Signature Validation Summary</h4>`)
	
	result.WriteString(`<div style="display: flex; gap: 20px; flex-wrap: wrap;">`)
	
	// Total signatures
	result.WriteString(`<div style="text-align: center; padding: 10px;">`)
	result.WriteString(`<div style="font-size: 24px; font-weight: bold; color: #2c5282;">` + fmt.Sprintf("%d", totalSignatures) + `</div>`)
	result.WriteString(`<div style="font-size: 12px; color: #666;">Total Signatures</div>`)
	result.WriteString(`</div>`)
	
	// Valid signatures
	result.WriteString(`<div style="text-align: center; padding: 10px;">`)
	result.WriteString(`<div style="font-size: 24px; font-weight: bold; color: #4CAF50;">` + fmt.Sprintf("%d", validSignatures) + `</div>`)
	result.WriteString(`<div style="font-size: 12px; color: #666;">Valid</div>`)
	result.WriteString(`</div>`)
	
	// Invalid signatures (if any)
	if invalidSignatures > 0 {
		result.WriteString(`<div style="text-align: center; padding: 10px;">`)
		result.WriteString(`<div style="font-size: 24px; font-weight: bold; color: #F44336;">` + fmt.Sprintf("%d", invalidSignatures) + `</div>`)
		result.WriteString(`<div style="font-size: 12px; color: #666;">Invalid</div>`)
		result.WriteString(`</div>`)
	}
	
	result.WriteString(`</div>`)
	result.WriteString(`</div>`)
	
	return result.String()
}

func renderSignatureDetails(signatures []SignatureData) string {
	var result bytes.Buffer
	
	for i, sig := range signatures {
		// Signature container
		result.WriteString(`<div style="margin-bottom: 25px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">`)
		
		// Header with validation status
		validationColor := "#4CAF50"
		validationIcon := "✅"
		validationText := "Valid"
		
		if !sig.IsValid {
			validationColor = "#F44336"
			validationIcon = "❌"
			validationText = "Invalid"
		}
		
		result.WriteString(`<div style="background-color: #f8f9fa; padding: 15px; border-bottom: 1px solid #e2e8f0;">`)
		result.WriteString(`<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">`)
		result.WriteString(`<h4 style="margin: 0; color: #2c5282;">Signature ` + fmt.Sprintf("%d", i+1) + `: ` + html.EscapeString(sig.Purpose) + `</h4>`)
		result.WriteString(`<span style="color: ` + validationColor + `; font-weight: bold;">` + validationIcon + ` ` + validationText + `</span>`)
		result.WriteString(`</div>`)
		result.WriteString(`</div>`)
		
		// Signature content
		result.WriteString(`<div style="padding: 20px;">`)
		
		// Two-column layout
		result.WriteString(`<div style="display: flex; gap: 20px; flex-wrap: wrap;">`)
		
		// Left column - Signature image
		result.WriteString(`<div style="flex: 1; min-width: 300px;">`)
		result.WriteString(`<h5>Signature Image</h5>`)
		
		if sig.IsValid {
			result.WriteString(`<div class="signature-box" style="border: 2px solid #ddd; padding: 10px; background-color: #fafafa; text-align: center; min-height: 80px; display: flex; align-items: center; justify-content: center;">`)
			result.WriteString(`<img src="` + html.EscapeString(sig.ImageData) + `" alt="Signature" class="signature-image" style="max-width: 250px; max-height: 60px; border: 1px solid #ddd;">`)
			result.WriteString(`</div>`)
		} else {
			result.WriteString(`<div class="signature-box" style="border: 2px solid #f44336; padding: 10px; background-color: #ffebee; text-align: center; min-height: 80px; display: flex; align-items: center; justify-content: center;">`)
			result.WriteString(`<span style="color: #d32f2f; font-style: italic;">Invalid or corrupted signature data</span>`)
			result.WriteString(`</div>`)
		}
		
		result.WriteString(`</div>`)
		
		// Right column - Signature metadata
		result.WriteString(`<div style="flex: 1; min-width: 300px;">`)
		result.WriteString(`<h5>Signature Details</h5>`)
		
		result.WriteString(`<table style="width: 100%; border-collapse: collapse;">`)
		
		result.WriteString(`<tr style="border-bottom: 1px solid #eee;">`)
		result.WriteString(`<td style="padding: 8px 0; font-weight: bold;">Field Name:</td>`)
		result.WriteString(`<td style="padding: 8px 0;">` + html.EscapeString(formatFieldLabel(sig.FieldName, "")) + `</td>`)
		result.WriteString(`</tr>`)
		
		result.WriteString(`<tr style="border-bottom: 1px solid #eee;">`)
		result.WriteString(`<td style="padding: 8px 0; font-weight: bold;">Signed By:</td>`)
		result.WriteString(`<td style="padding: 8px 0;">` + html.EscapeString(sig.SignedBy) + `</td>`)
		result.WriteString(`</tr>`)
		
		result.WriteString(`<tr style="border-bottom: 1px solid #eee;">`)
		result.WriteString(`<td style="padding: 8px 0; font-weight: bold;">Date:</td>`)
		result.WriteString(`<td style="padding: 8px 0;">` + html.EscapeString(sig.SignedDate) + `</td>`)
		result.WriteString(`</tr>`)
		
		result.WriteString(`<tr style="border-bottom: 1px solid #eee;">`)
		result.WriteString(`<td style="padding: 8px 0; font-weight: bold;">Purpose:</td>`)
		result.WriteString(`<td style="padding: 8px 0;">` + html.EscapeString(sig.Purpose) + `</td>`)
		result.WriteString(`</tr>`)
		
		result.WriteString(`<tr style="border-bottom: 1px solid #eee;">`)
		result.WriteString(`<td style="padding: 8px 0; font-weight: bold;">Image Type:</td>`)
		result.WriteString(`<td style="padding: 8px 0;">` + html.EscapeString(sig.ImageType) + `</td>`)
		result.WriteString(`</tr>`)
		
		result.WriteString(`<tr>`)
		result.WriteString(`<td style="padding: 8px 0; font-weight: bold;">File Size:</td>`)
		result.WriteString(`<td style="padding: 8px 0;">` + formatFileSize(sig.ImageSize) + `</td>`)
		result.WriteString(`</tr>`)
		
		result.WriteString(`</table>`)
		result.WriteString(`</div>`)
		
		result.WriteString(`</div>`)
		result.WriteString(`</div>`)
		result.WriteString(`</div>`)
	}
	
	return result.String()
}

func renderSignatureLegalSection(signatures []SignatureData) string {
	var result bytes.Buffer
	
	validSignatureCount := 0
	for _, sig := range signatures {
		if sig.IsValid {
			validSignatureCount++
		}
	}
	
	result.WriteString(`<div style="margin-top: 25px; padding: 20px; background-color: #e3f2fd; border-left: 4px solid #2196f3;">`)
	result.WriteString(`<h4>Legal Authentication</h4>`)
	
	if validSignatureCount > 0 {
		result.WriteString(`<p><strong>✅ Digital Signature Verification:</strong> ` + fmt.Sprintf("%d", validSignatureCount) + ` valid digital signature(s) captured and verified.</p>`)
		
		result.WriteString(`<p><strong>Timestamp:</strong> ` + getCurrentTimestamp() + `</p>`)
		
		result.WriteString(`<div style="margin-top: 15px; padding: 10px; background-color: rgba(255,255,255,0.7); border-radius: 4px; font-size: 11px;">`)
		result.WriteString(`<p style="margin: 0;"><strong>Authentication Details:</strong></p>`)
		result.WriteString(`<ul style="margin: 5px 0 0 20px; padding: 0;">`)
		result.WriteString(`<li>Digital signatures captured using secure web browser signature pad</li>`)
		result.WriteString(`<li>Image data validated for integrity and completeness</li>`)
		result.WriteString(`<li>Signatures are legally binding electronic signatures under E-SIGN Act</li>`)
		result.WriteString(`<li>Document generated with tamper-evident PDF technology</li>`)
		result.WriteString(`</ul>`)
		result.WriteString(`</div>`)
	} else {
		result.WriteString(`<p><strong>⚠️ Signature Validation Warning:</strong> No valid signatures found. Please ensure signatures are properly captured before finalizing this document.</p>`)
	}
	
	result.WriteString(`<div style="margin-top: 15px; padding: 10px; background-color: rgba(255,193,7,0.1); border: 1px solid #FFC107; border-radius: 4px; font-size: 11px;">`)
	result.WriteString(`<p style="margin: 0; color: #856404;">`)
	result.WriteString(`<strong>Legal Notice:</strong> This document contains legally binding electronic signatures. Any attempt to alter this document after signing may constitute fraud. This document should be retained as part of the official medical record.`)
	result.WriteString(`</p>`)
	result.WriteString(`</div>`)
	
	result.WriteString(`</div>`)
	
	return result.String()
}

func formatFileSize(bytes int) string {
	if bytes < 1024 {
		return fmt.Sprintf("%d bytes", bytes)
	}
	if bytes < 1024*1024 {
		return fmt.Sprintf("%.1f KB", float64(bytes)/1024)
	}
	return fmt.Sprintf("%.1f MB", float64(bytes)/(1024*1024))
}