package services

import (
	"fmt"
	"html"
	"regexp"
	"strings"
	"sync"
	"time"
)

// SecurityValidator provides input validation and sanitization
type SecurityValidator struct {
	maxStringLength int
	maxFieldCount   int
	rateLimiter     *RateLimiter
}

// RateLimiter implements rate limiting for PDF generation
type RateLimiter struct {
	requests map[string][]time.Time
	limit    int
	window   time.Duration
	mu       sync.Mutex
}

// ValidationResult contains the results of security validation
type ValidationResult struct {
	IsValid    bool
	Warnings   []string
	Errors     []string
	SanitizedData map[string]interface{}
}

func NewSecurityValidator() *SecurityValidator {
	return &SecurityValidator{
		maxStringLength: 7000000, // Support PDFs up to ~5MB (base64 encoding adds ~33% overhead)
		maxFieldCount:   1000,    // Maximum number of fields
		rateLimiter:     NewRateLimiter(10, time.Minute), // 10 requests per minute per user
	}
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		requests: make(map[string][]time.Time),
		limit:    limit,
		window:   window,
	}
}

func (sv *SecurityValidator) ValidateAndSanitize(userID string, responseData map[string]interface{}) (*ValidationResult, error) {
	result := &ValidationResult{
		IsValid:       true,
		Warnings:      []string{},
		Errors:        []string{},
		SanitizedData: make(map[string]interface{}),
	}
	
	// Check rate limiting
	if !sv.rateLimiter.Allow(userID) {
		result.IsValid = false
		result.Errors = append(result.Errors, "Rate limit exceeded. Please wait before generating another PDF.")
		return result, nil
	}
	
	// Check field count
	if len(responseData) > sv.maxFieldCount {
		result.IsValid = false
		result.Errors = append(result.Errors, fmt.Sprintf("Too many fields: %d (maximum: %d)", len(responseData), sv.maxFieldCount))
		return result, nil
	}
	
	// Process each field
	for key, value := range responseData {
		sanitizedKey := sv.sanitizeFieldName(key)
		sanitizedValue, warnings, err := sv.sanitizeValue(value)
		
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("Field %s: %v", key, err))
			result.IsValid = false
			continue
		}
		
		result.Warnings = append(result.Warnings, warnings...)
		result.SanitizedData[sanitizedKey] = sanitizedValue
	}
	
	return result, nil
}

func (sv *SecurityValidator) sanitizeFieldName(fieldName string) string {
	// Remove potentially dangerous characters from field names
	safe := regexp.MustCompile(`[^a-zA-Z0-9_-]`).ReplaceAllString(fieldName, "")
	
	// Limit length
	if len(safe) > 100 {
		safe = safe[:100]
	}
	
	return safe
}

func (sv *SecurityValidator) sanitizeValue(value interface{}) (interface{}, []string, error) {
	var warnings []string
	
	switch v := value.(type) {
	case string:
		return sv.sanitizeString(v)
	case []interface{}:
		return sv.sanitizeArray(v)
	case map[string]interface{}:
		return sv.sanitizeMap(v)
	case int, int32, int64, float32, float64, bool:
		// Primitive types are safe
		return v, warnings, nil
	case nil:
		return nil, warnings, nil
	default:
		// Convert unknown types to string and sanitize
		str := fmt.Sprintf("%v", v)
		sanitized, warns, err := sv.sanitizeString(str)
		warnings = append(warnings, warns...)
		if err != nil {
			return nil, warnings, err
		}
		warnings = append(warnings, fmt.Sprintf("Unknown type %T converted to string", v))
		return sanitized, warnings, nil
	}
}

func (sv *SecurityValidator) sanitizeString(str string) (string, []string, error) {
	var warnings []string
	
	// Check length
	if len(str) > sv.maxStringLength {
		warnings = append(warnings, fmt.Sprintf("String truncated from %d to %d characters", len(str), sv.maxStringLength))
		str = str[:sv.maxStringLength]
	}
	
	// Check for potential XSS attempts
	if sv.containsXSS(str) {
		warnings = append(warnings, "Potential XSS content detected and escaped")
	}
	
	// Check for potential SQL injection
	if sv.containsSQLInjection(str) {
		warnings = append(warnings, "Potential SQL injection content detected")
	}
	
	// HTML escape the string
	escaped := html.EscapeString(str)
	
	// Additional sanitization for specific patterns
	escaped = sv.sanitizeSpecialPatterns(escaped)
	
	return escaped, warnings, nil
}

func (sv *SecurityValidator) sanitizeArray(arr []interface{}) ([]interface{}, []string, error) {
	var warnings []string
	var sanitized []interface{}
	
	// Limit array size
	maxArraySize := 100
	if len(arr) > maxArraySize {
		warnings = append(warnings, fmt.Sprintf("Array truncated from %d to %d elements", len(arr), maxArraySize))
		arr = arr[:maxArraySize]
	}
	
	for i, item := range arr {
		sanitizedItem, itemWarnings, err := sv.sanitizeValue(item)
		if err != nil {
			return nil, warnings, fmt.Errorf("array element %d: %w", i, err)
		}
		warnings = append(warnings, itemWarnings...)
		sanitized = append(sanitized, sanitizedItem)
	}
	
	return sanitized, warnings, nil
}

func (sv *SecurityValidator) sanitizeMap(m map[string]interface{}) (map[string]interface{}, []string, error) {
	var warnings []string
	sanitized := make(map[string]interface{})
	
	// Limit map size
	maxMapSize := 50
	count := 0
	for key, value := range m {
		if count >= maxMapSize {
			warnings = append(warnings, fmt.Sprintf("Map truncated at %d entries", maxMapSize))
			break
		}
		
		sanitizedKey := sv.sanitizeFieldName(key)
		sanitizedValue, valueWarnings, err := sv.sanitizeValue(value)
		if err != nil {
			return nil, warnings, fmt.Errorf("map key %s: %w", key, err)
		}
		
		warnings = append(warnings, valueWarnings...)
		sanitized[sanitizedKey] = sanitizedValue
		count++
	}
	
	return sanitized, warnings, nil
}

func (sv *SecurityValidator) containsXSS(content string) bool {
	lowerContent := strings.ToLower(content)
	
	xssPatterns := []string{
		"<script",
		"</script",
		"javascript:",
		"onerror=",
		"onclick=",
		"onload=",
		"onmouseover=",
		"onfocus=",
		"onblur=",
		"onchange=",
		"onsubmit=",
		"<iframe",
		"<object",
		"<embed",
		"vbscript:",
		"data:text/html",
		"eval(",
		"expression(",
	}
	
	for _, pattern := range xssPatterns {
		if strings.Contains(lowerContent, pattern) {
			return true
		}
	}
	
	return false
}

func (sv *SecurityValidator) containsSQLInjection(content string) bool {
	lowerContent := strings.ToLower(content)
	
	sqlPatterns := []string{
		"' or ",
		"\" or ",
		"' and ",
		"\" and ",
		" union ",
		" select ",
		" insert ",
		" update ",
		" delete ",
		" drop ",
		" create ",
		" alter ",
		" exec ",
		" execute ",
		"--",
		"/*",
		"*/",
		"xp_",
		"sp_",
	}
	
	for _, pattern := range sqlPatterns {
		if strings.Contains(lowerContent, pattern) {
			return true
		}
	}
	
	return false
}

func (sv *SecurityValidator) sanitizeSpecialPatterns(content string) string {
	// Remove or replace potentially dangerous patterns
	
	// Remove null bytes
	content = strings.ReplaceAll(content, "\x00", "")
	
	// Remove control characters except common ones (tab, newline, carriage return)
	result := strings.Builder{}
	for _, r := range content {
		if r >= 32 || r == '\t' || r == '\n' || r == '\r' {
			result.WriteRune(r)
		}
	}
	
	return result.String()
}

func (rl *RateLimiter) Allow(userID string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	
	now := time.Now()
	
	// Clean old requests
	if requests, exists := rl.requests[userID]; exists {
		validRequests := []time.Time{}
		for _, reqTime := range requests {
			if now.Sub(reqTime) <= rl.window {
				validRequests = append(validRequests, reqTime)
			}
		}
		rl.requests[userID] = validRequests
	}
	
	// Check if under limit
	if len(rl.requests[userID]) >= rl.limit {
		return false
	}
	
	// Add new request
	rl.requests[userID] = append(rl.requests[userID], now)
	return true
}

// PDFSecurityContext provides security context for PDF generation
type PDFSecurityContext struct {
	UserID      string
	RequestID   string
	Timestamp   time.Time
	IPAddress   string
	UserAgent   string
}

func (sv *SecurityValidator) ValidatePDFRequest(ctx *PDFSecurityContext, responseID string) error {
	// Validate user ID
	if ctx.UserID == "" {
		return fmt.Errorf("user ID is required")
	}
	
	// Validate response ID format (should be Firebase document ID format)
	if !sv.isValidDocumentID(responseID) {
		return fmt.Errorf("invalid response ID format")
	}
	
	// Check for suspicious user agent
	if sv.isSuspiciousUserAgent(ctx.UserAgent) {
		return fmt.Errorf("suspicious user agent detected")
	}
	
	return nil
}

func (sv *SecurityValidator) isValidDocumentID(id string) bool {
	// Firebase document IDs are typically alphanumeric with some special characters
	if len(id) < 5 || len(id) > 100 {
		return false
	}
	
	validPattern := regexp.MustCompile(`^[a-zA-Z0-9_-]+$`)
	return validPattern.MatchString(id)
}

func (sv *SecurityValidator) isSuspiciousUserAgent(userAgent string) bool {
	suspiciousPatterns := []string{
		"sqlmap",
		"nikto",
		"nmap",
		"masscan",
		"curl",
		"wget",
		"python-requests",
		"bot",
		"crawler",
		"scraper",
	}
	
	lowerUA := strings.ToLower(userAgent)
	for _, pattern := range suspiciousPatterns {
		if strings.Contains(lowerUA, pattern) {
			return true
		}
	}
	
	return false
}

// AuditLogger provides security audit logging
type AuditLogger struct{}

func NewAuditLogger() *AuditLogger {
	return &AuditLogger{}
}

func (al *AuditLogger) LogSecurityEvent(eventType, userID, message string, metadata map[string]interface{}) {
	timestamp := time.Now().UTC().Format(time.RFC3339)
	
	// In production, this should log to a secure audit log system
	fmt.Printf("[SECURITY_AUDIT] %s | %s | User: %s | %s | Metadata: %+v\n", 
		timestamp, eventType, userID, message, metadata)
}