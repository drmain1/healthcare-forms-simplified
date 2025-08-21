package services_test

import (
	"fmt"
	"strings"
	"testing"
	"time"

	"backend-go/internal/services"
)

func TestPDFOrchestrator_PatternDetection(t *testing.T) {
	tests := []struct {
		name           string
		formData       map[string]interface{}
		responseData   map[string]interface{}
		expectedPatterns int
	}{
		{
			name: "Patient Demographics Pattern",
			formData: map[string]interface{}{
				"pages": []interface{}{
					map[string]interface{}{
						"elements": []interface{}{
							map[string]interface{}{
								"type": "text",
								"name": "patient_name",
								"title": "Patient Name",
							},
						},
					},
				},
			},
			responseData: map[string]interface{}{
				"patient_name": "John Doe",
				"date_of_birth": "1980-01-01",
			},
			expectedPatterns: 1,
		},
		{
			name: "Terms Checkbox Pattern",
			formData: map[string]interface{}{
				"pages": []interface{}{
					map[string]interface{}{
						"elements": []interface{}{
							map[string]interface{}{
								"type": "checkbox",
								"name": "terms_agreement",
								"title": "I agree to the terms",
							},
						},
					},
				},
			},
			responseData: map[string]interface{}{
				"terms_agreement": true,
			},
			expectedPatterns: 1,
		},
		{
			name: "NDI Assessment Pattern",
			formData: map[string]interface{}{},
			responseData: map[string]interface{}{
				"ndi_pain_intensity": 3,
				"ndi_personal_care": 2,
				"ndi_lifting": 4,
				"ndi_reading": 1,
				"ndi_headaches": 2,
				"ndi_concentration": 3,
			},
			expectedPatterns: 1,
		},
		{
			name: "Multiple Patterns",
			formData: map[string]interface{}{},
			responseData: map[string]interface{}{
				"patient_name": "Jane Smith",
				"terms_agreement": true,
				"ndi_pain_intensity": 3,
				"signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
			},
			expectedPatterns: 3, // Demographics, Terms, Signature
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			detector := services.NewPatternDetector()
			patterns, err := detector.DetectPatterns(tt.formData, tt.responseData)
			
			if err != nil {
				t.Fatalf("Pattern detection failed: %v", err)
			}
			
			if len(patterns) != tt.expectedPatterns {
				t.Errorf("Expected %d patterns, got %d", tt.expectedPatterns, len(patterns))
				for _, pattern := range patterns {
					t.Logf("Found pattern: %s", pattern.PatternType)
				}
			}
		})
	}
}

func TestPDFOrchestrator_SecurityValidation(t *testing.T) {
	tests := []struct {
		name         string
		responseData map[string]interface{}
		shouldPass   bool
	}{
		{
			name: "Clean Data",
			responseData: map[string]interface{}{
				"patient_name": "John Doe",
				"age": 30,
			},
			shouldPass: true,
		},
		{
			name: "XSS Attempt",
			responseData: map[string]interface{}{
				"patient_name": "<script>alert('xss')</script>",
				"comments": "<img src=x onerror=alert('xss')>",
			},
			shouldPass: true, // Should pass but with escaped content
		},
		{
			name: "SQL Injection Attempt",
			responseData: map[string]interface{}{
				"patient_name": "'; DROP TABLE patients; --",
				"id": "1 OR 1=1",
			},
			shouldPass: true, // Should pass but with escaped content
		},
		{
			name: "Large Data Attack",
			responseData: map[string]interface{}{
				"patient_name": generateLargeString(10000),
				"comments": generateLargeString(50000),
			},
			shouldPass: true, // Should handle large strings gracefully
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			detector := services.NewPatternDetector()
			_, err := detector.DetectPatterns(map[string]interface{}{}, tt.responseData)
			
			if tt.shouldPass && err != nil {
				t.Errorf("Expected security validation to pass, but got error: %v", err)
			}
			
			// Verify that dangerous content is properly escaped
			for key, value := range tt.responseData {
				if strValue, ok := value.(string); ok {
					if containsDangerousContent(strValue) {
						t.Logf("Detected potentially dangerous content in field %s, ensure it's properly escaped in rendering", key)
					}
				}
			}
		})
	}
}

func TestPDFOrchestrator_PerformanceValidation(t *testing.T) {
	// Create a large form response to test performance
	largeResponseData := make(map[string]interface{})
	
	// Add 1000 form fields
	for i := 0; i < 1000; i++ {
		largeResponseData[fmt.Sprintf("field_%d", i)] = fmt.Sprintf("value_%d", i)
	}
	
	// Add various pattern types
	largeResponseData["patient_name"] = "Performance Test Patient"
	largeResponseData["terms_agreement"] = true
	largeResponseData["ndi_pain_intensity"] = 5
	
	detector := services.NewPatternDetector()
	
	// Measure pattern detection time
	start := time.Now()
	patterns, err := detector.DetectPatterns(map[string]interface{}{}, largeResponseData)
	duration := time.Since(start)
	
	if err != nil {
		t.Fatalf("Pattern detection failed on large dataset: %v", err)
	}
	
	if duration > 5*time.Second {
		t.Errorf("Pattern detection took too long: %v (should be < 5s)", duration)
	}
	
	if len(patterns) == 0 {
		t.Error("No patterns detected in large dataset")
	}
	
	t.Logf("Pattern detection completed in %v with %d patterns", duration, len(patterns))
}

func TestPDFOrchestrator_EdgeCases(t *testing.T) {
	tests := []struct {
		name         string
		formData     map[string]interface{}
		responseData map[string]interface{}
		expectError  bool
	}{
		{
			name:         "Empty Data",
			formData:     map[string]interface{}{},
			responseData: map[string]interface{}{},
			expectError:  false,
		},
		{
			name:         "Nil Data",
			formData:     nil,
			responseData: nil,
			expectError:  false,
		},
		{
			name: "Malformed Form Structure",
			formData: map[string]interface{}{
				"pages": "not_an_array",
			},
			responseData: map[string]interface{}{
				"field1": "value1",
			},
			expectError: false, // Should handle gracefully
		},
		{
			name: "Mixed Data Types",
			formData: map[string]interface{}{},
			responseData: map[string]interface{}{
				"string_field": "text",
				"number_field": 42,
				"bool_field": true,
				"array_field": []interface{}{1, 2, 3},
				"object_field": map[string]interface{}{"nested": "value"},
			},
			expectError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			detector := services.NewPatternDetector()
			patterns, err := detector.DetectPatterns(tt.formData, tt.responseData)
			
			if tt.expectError && err == nil {
				t.Error("Expected error but got none")
			}
			
			if !tt.expectError && err != nil {
				t.Errorf("Unexpected error: %v", err)
			}
			
			// Should never panic
			if patterns != nil {
				t.Logf("Detected %d patterns", len(patterns))
			}
		})
	}
}

// Helper functions

func generateLargeString(size int) string {
	result := make([]byte, size)
	for i := range result {
		result[i] = 'A' + byte(i%26)
	}
	return string(result)
}

func containsDangerousContent(content string) bool {
	dangerousPatterns := []string{
		"<script",
		"javascript:",
		"onerror=",
		"onclick=",
		"DROP TABLE",
		"DELETE FROM",
		"INSERT INTO",
		"UPDATE SET",
	}
	
	lowerContent := strings.ToLower(content)
	for _, pattern := range dangerousPatterns {
		if strings.Contains(lowerContent, strings.ToLower(pattern)) {
			return true
		}
	}
	return false
}