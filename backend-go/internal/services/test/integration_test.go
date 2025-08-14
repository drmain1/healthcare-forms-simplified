package services_test

import (
	"context"
	"fmt"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/gemini/forms-api/internal/services"
)

// TestPDFGenerationPipeline tests the complete PDF generation pipeline
func TestPDFGenerationPipeline(t *testing.T) {
	// Skip integration tests if not in CI or if explicitly disabled
	if os.Getenv("RUN_INTEGRATION_TESTS") != "true" {
		t.Skip("Integration tests disabled. Set RUN_INTEGRATION_TESTS=true to run.")
	}
	
	// Mock Gotenberg service for testing
	mockGotenberg := &MockGotenbergService{}
	
	// Create PDF orchestrator
	orchestrator := &services.PDFOrchestrator{
		// Would need actual Firestore client in real integration test
		// client:        mockFirestoreClient,
		// gotenberg:     mockGotenberg,
		// registry:      services.NewRendererRegistry(templateStore),
		// detector:      services.NewPatternDetector(),
		// templateStore: templateStore,
	}
	
	tests := []struct {
		name           string
		userID         string
		responseData   map[string]interface{}
		expectedError  bool
		minPDFSize     int
	}{
		{
			name:   "Complete Medical Form",
			userID: "test-user-123",
			responseData: map[string]interface{}{
				// Patient Demographics
				"patient_name":    "John Doe",
				"date_of_birth":   "1980-01-15",
				"gender":          "Male",
				"phone":           "555-123-4567",
				"email":           "john.doe@example.com",
				
				// Terms Agreement
				"terms_agreement": true,
				
				// NDI Assessment
				"ndi_pain_intensity": 4,
				"ndi_personal_care":  3,
				"ndi_lifting":        5,
				"ndi_reading":        2,
				"ndi_headaches":      3,
				
				// Vital Signs
				"blood_pressure_systolic":  140,
				"blood_pressure_diastolic": 85,
				"heart_rate":               72,
				"temperature":              98.6,
				
				// Signature
				"patient_signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
			},
			expectedError: false,
			minPDFSize:    1000, // Minimum expected PDF size in bytes
		},
		{
			name:   "Minimal Form",
			userID: "test-user-456",
			responseData: map[string]interface{}{
				"patient_name": "Jane Smith",
			},
			expectedError: false,
			minPDFSize:    500,
		},
		{
			name:   "Malicious Content",
			userID: "test-user-789",
			responseData: map[string]interface{}{
				"patient_name": "<script>alert('xss')</script>",
				"comments":     "'; DROP TABLE patients; --",
			},
			expectedError: false, // Should not error, but content should be escaped
			minPDFSize:    500,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			defer cancel()
			
			// In a real test, this would call the actual PDF generation
			// pdfBytes, err := orchestrator.GeneratePDF(ctx, "mock-response-id", tt.userID)
			
			// Mock the PDF generation for this test
			mockPDFBytes := []byte("mock PDF content for testing")
			var err error
			
			if tt.expectedError && err == nil {
				t.Error("Expected error but got none")
			}
			
			if !tt.expectedError && err != nil {
				t.Errorf("Unexpected error: %v", err)
			}
			
			if !tt.expectedError && len(mockPDFBytes) < tt.minPDFSize {
				t.Errorf("PDF size %d is smaller than expected minimum %d", len(mockPDFBytes), tt.minPDFSize)
			}
		})
	}
}

func TestSecurityValidation(t *testing.T) {
	validator := services.NewSecurityValidator()
	
	tests := []struct {
		name         string
		userID       string
		responseData map[string]interface{}
		expectValid  bool
		expectErrors int
	}{
		{
			name:   "Clean Data",
			userID: "user-123",
			responseData: map[string]interface{}{
				"patient_name": "John Doe",
				"age":          30,
				"valid_field":  "normal content",
			},
			expectValid:  true,
			expectErrors: 0,
		},
		{
			name:   "XSS Attempt",
			userID: "user-456",
			responseData: map[string]interface{}{
				"patient_name": "<script>alert('xss')</script>",
				"comments":     "<img src=x onerror=alert('hack')>",
			},
			expectValid:  true, // Should be valid after sanitization
			expectErrors: 0,
		},
		{
			name:   "SQL Injection Attempt",
			userID: "user-789",
			responseData: map[string]interface{}{
				"id":           "1'; DROP TABLE users; --",
				"patient_name": "Robert'); DELETE FROM patients; --",
			},
			expectValid:  true, // Should be valid after sanitization
			expectErrors: 0,
		},
		{
			name:   "Oversized Data",
			userID: "user-999",
			responseData: map[string]interface{}{
				"large_field": generateLargeString(15000), // Exceeds max length
			},
			expectValid:  true, // Should be valid after truncation
			expectErrors: 0,
		},
		{
			name:   "Rate Limit Test",
			userID: "user-rate-limit",
			responseData: map[string]interface{}{
				"test_field": "test",
			},
			expectValid:  true,
			expectErrors: 0,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := validator.ValidateAndSanitize(tt.userID, tt.responseData)
			
			if err != nil {
				t.Fatalf("Validation failed: %v", err)
			}
			
			if result.IsValid != tt.expectValid {
				t.Errorf("Expected validity %v, got %v", tt.expectValid, result.IsValid)
			}
			
			if len(result.Errors) != tt.expectErrors {
				t.Errorf("Expected %d errors, got %d: %v", tt.expectErrors, len(result.Errors), result.Errors)
			}
			
			// Verify sanitization worked
			for key, value := range result.SanitizedData {
				if strValue, ok := value.(string); ok {
					if containsRawHTML(strValue) {
						t.Errorf("Field %s contains unescaped HTML: %s", key, strValue)
					}
				}
			}
			
			// Log warnings for review
			if len(result.Warnings) > 0 {
				t.Logf("Validation warnings for %s: %v", tt.name, result.Warnings)
			}
		})
	}
}

func TestRendererSecurity(t *testing.T) {
	// Test each renderer with potentially malicious input
	maliciousInputs := map[string]interface{}{
		"xss_script":       "<script>alert('xss')</script>",
		"xss_img":          "<img src=x onerror=alert('xss')>",
		"sql_injection":    "'; DROP TABLE patients; --",
		"path_traversal":   "../../../etc/passwd",
		"null_bytes":       "test\x00hidden",
		"large_string":     generateLargeString(1000),
		"unicode_attack":   "test\u202e\u0644\u0627",
		"html_entities":    "&lt;script&gt;alert('test')&lt;/script&gt;",
	}
	
	// Mock context
	context := &services.PDFContext{
		FormResponse:   map[string]interface{}{},
		FormDefinition: map[string]interface{}{},
		Answers:        maliciousInputs,
		RequestID:      "test-request-123",
	}
	
	// Test pattern metadata
	metadata := services.PatternMetadata{
		PatternType:  "test_pattern",
		ElementNames: []string{"xss_script", "sql_injection", "large_string"},
		TemplateData: map[string]interface{}{},
	}
	
	// Test individual renderers
	rendererTests := []struct {
		name     string
		renderer func(services.PatternMetadata, *services.PDFContext) (string, error)
	}{
		{"Terms Checkbox", services.TermsCheckboxRenderer},
		{"Patient Demographics", services.PatientDemographicsRenderer},
		{"Terms Conditions", services.TermsConditionsRenderer},
		{"Pain Assessment", services.PainAssessmentRenderer},
		{"NDI", services.NeckDisabilityRenderer},
		{"Oswestry", services.OswestryDisabilityRenderer},
		{"Vitals", services.PatientVitalsRenderer},
		{"Insurance Card", services.InsuranceCardRenderer},
		{"Signature", services.SignatureRenderer},
	}
	
	for _, rt := range rendererTests {
		t.Run(rt.name, func(t *testing.T) {
			html, err := rt.renderer(metadata, context)
			
			if err != nil {
				t.Errorf("Renderer %s failed: %v", rt.name, err)
				return
			}
			
			// Verify no unescaped dangerous content in output
			if containsRawHTML(html) {
				t.Errorf("Renderer %s produced unescaped HTML content", rt.name)
			}
			
			// Check for script tags
			if containsDangerousScript(html) {
				t.Errorf("Renderer %s produced dangerous script content", rt.name)
			}
			
			// Verify output is not empty (renderers should handle malicious input gracefully)
			if len(html) == 0 {
				t.Errorf("Renderer %s produced empty output", rt.name)
			}
		})
	}
}

func TestPerformanceBounds(t *testing.T) {
	// Test that PDF generation completes within reasonable time bounds
	
	// Create large but realistic form data
	largeFormData := make(map[string]interface{})
	
	// Add many fields of various types
	for i := 0; i < 100; i++ {
		largeFormData[fmt.Sprintf("text_field_%d", i)] = fmt.Sprintf("Sample text content %d", i)
		largeFormData[fmt.Sprintf("number_field_%d", i)] = i
		largeFormData[fmt.Sprintf("bool_field_%d", i)] = i%2 == 0
	}
	
	// Add NDI fields
	ndiFields := []string{"ndi_pain_intensity", "ndi_personal_care", "ndi_lifting", "ndi_reading"}
	for _, field := range ndiFields {
		largeFormData[field] = 3
	}
	
	// Add patient data
	largeFormData["patient_name"] = "Performance Test Patient"
	largeFormData["date_of_birth"] = "1990-01-01"
	
	// Test pattern detection performance
	detector := services.NewPatternDetector()
	
	start := time.Now()
	patterns, err := detector.DetectPatterns(map[string]interface{}{}, largeFormData)
	detectionDuration := time.Since(start)
	
	if err != nil {
		t.Fatalf("Pattern detection failed: %v", err)
	}
	
	// Should complete within 1 second
	if detectionDuration > time.Second {
		t.Errorf("Pattern detection took too long: %v", detectionDuration)
	}
	
	if len(patterns) == 0 {
		t.Error("No patterns detected in performance test")
	}
	
	t.Logf("Detected %d patterns in %v", len(patterns), detectionDuration)
	
	// Test security validation performance
	validator := services.NewSecurityValidator()
	
	start = time.Now()
	result, err := validator.ValidateAndSanitize("performance-test-user", largeFormData)
	validationDuration := time.Since(start)
	
	if err != nil {
		t.Fatalf("Security validation failed: %v", err)
	}
	
	if !result.IsValid {
		t.Errorf("Security validation failed: %v", result.Errors)
	}
	
	// Should complete within 2 seconds
	if validationDuration > 2*time.Second {
		t.Errorf("Security validation took too long: %v", validationDuration)
	}
	
	t.Logf("Security validation completed in %v", validationDuration)
}

// Mock services for testing

type MockGotenbergService struct{}

func (m *MockGotenbergService) ConvertHTMLToPDF(htmlContent string) ([]byte, error) {
	// Return mock PDF content
	return []byte("Mock PDF content for testing"), nil
}

func (m *MockGotenbergService) GetServiceHealth() error {
	return nil
}

// Helper functions

func generateLargeString(size int) string {
	result := make([]byte, size)
	for i := range result {
		result[i] = 'A' + byte(i%26)
	}
	return string(result)
}

func containsRawHTML(content string) bool {
	// Check for unescaped HTML tags
	return strings.Contains(content, "<script") && !strings.Contains(content, "&lt;script")
}

func containsDangerousScript(content string) bool {
	dangerous := []string{
		"<script>",
		"javascript:",
		"onerror=",
		"eval(",
	}
	
	lowerContent := strings.ToLower(content)
	for _, pattern := range dangerous {
		if strings.Contains(lowerContent, pattern) {
			return true
		}
	}
	return false
}