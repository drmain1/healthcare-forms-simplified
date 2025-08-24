
package api

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"

	"backend-go/internal/data"
	"backend-go/internal/services"
)

// PDFGenerationRequest holds the data needed for generating a PDF.
// It is populated by fetching data from Firestore within the handler.
type PDFGenerationRequest struct {
	SurveyJSON   map[string]interface{} `json:"surveyJson"`
	ResponseData map[string]interface{} `json:"responseData"`
}

// GeneratePDFHandler uses the new PDFOrchestrator system for enhanced PDF generation.
// Supports all 11 medical form types with security validation and performance optimization.
func GeneratePDFHandler(client *firestore.Client, gs *services.GotenbergService) gin.HandlerFunc {
	return func(c *gin.Context) {
		responseId := c.Param("responseId")
		if responseId == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Response ID is required"})
			return
		}
		
		// Extract user ID from Firebase token for security validation
		userID := "unknown-user"
		if userClaims, exists := c.Get("user"); exists {
			if claims, ok := userClaims.(map[string]interface{}); ok {
				if uid, ok := claims["uid"].(string); ok {
					userID = uid
				}
			}
		}
		
		log.Printf("PDF_GENERATION_V2_START: user=%s, response=%s", userID, responseId)
		startTime := time.Now()
		
		// Distributed lock to prevent duplicate PDF generation
		redisClient := data.GetRedisClient()
		if redisClient != nil {
			lock := services.NewDistributedLock(redisClient, fmt.Sprintf("pdf-gen:%s", responseId), 5*time.Minute)
			
			acquired, err := lock.Acquire(c.Request.Context())
			if err != nil {
				log.Printf("PDF_GENERATION_V2_ERROR: user=%s, response=%s, error=failed to acquire lock: %v", userID, responseId, err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "Could not acquire system lock for PDF generation",
					"code": "LOCK_ERROR",
				})
				return
			}
			
			if !acquired {
				log.Printf("PDF_GENERATION_V2_CONFLICT: user=%s, response=%s, error=PDF generation already in progress", userID, responseId)
				c.JSON(http.StatusConflict, gin.H{
					"error": "PDF generation is already in progress for this response",
					"code": "GENERATION_IN_PROGRESS",
					"retry_after": 300, // 5 minutes
				})
				return
			}
			
			// Ensure lock is released even if panic occurs
			defer func() {
				if err := lock.Release(c.Request.Context()); err != nil {
					log.Printf("PDF_GENERATION_V2_WARNING: user=%s, response=%s, error=failed to release lock: %v", userID, responseId, err)
				}
			}()
			
			log.Printf("PDF_GENERATION_V2_LOCK_ACQUIRED: user=%s, response=%s", userID, responseId)
		} else {
			log.Printf("PDF_GENERATION_V2_WARNING: user=%s, response=%s, Redis unavailable - proceeding without lock", userID, responseId)
		}
		
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		// Initialize the new PDF orchestrator with all components
		orchestrator, err := services.NewPDFOrchestrator(client, gs)
		if err != nil {
			log.Printf("PDF_GENERATION_V2_ERROR: user=%s, response=%s, error=failed to initialize orchestrator: %v", userID, responseId, err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "PDF system initialization failed",
				"code": "INIT_ERROR",
			})
			return
		}
		
		// Generate PDF using the new orchestrator system
		pdfBytes, err := orchestrator.GeneratePDF(ctx, responseId, userID)
		if err != nil {
			log.Printf("PDF_GENERATION_V2_ERROR: user=%s, response=%s, error=%v", userID, responseId, err)
			
			// Enhanced error handling with specific error codes
			errorResponse := gin.H{
				"error": "PDF generation failed",
				"details": err.Error(),
				"code": "GENERATION_ERROR",
			}
			
			// Check for specific error types
			if strings.Contains(err.Error(), "not found") {
				errorResponse["code"] = "NOT_FOUND"
				c.JSON(http.StatusNotFound, errorResponse)
			} else if strings.Contains(err.Error(), "timeout") {
				errorResponse["code"] = "TIMEOUT"
				c.JSON(http.StatusRequestTimeout, errorResponse)
			} else if strings.Contains(err.Error(), "rate limit") {
				errorResponse["code"] = "RATE_LIMIT"
				c.JSON(http.StatusTooManyRequests, errorResponse)
			} else if strings.Contains(err.Error(), "security") {
				errorResponse["code"] = "SECURITY_ERROR"
				c.JSON(http.StatusBadRequest, errorResponse)
			} else {
				c.JSON(http.StatusInternalServerError, errorResponse)
			}
			return
		}
		
		totalDuration := time.Since(startTime)
		log.Printf("PDF_GENERATION_V2_SUCCESS: user=%s, response=%s, size=%d bytes, duration=%v", 
			userID, responseId, len(pdfBytes), totalDuration)
		
		// Return PDF with security headers
		c.Header("Content-Type", "application/pdf")
		c.Header("Content-Disposition", "attachment; filename=medical-form-response.pdf")
		c.Header("X-PDF-Generation-Time", totalDuration.String())
		c.Header("X-PDF-System-Version", "v2")
		c.Data(http.StatusOK, "application/pdf", pdfBytes)
	}
}

// Helper function to register this route - will be called from main.go
func RegisterPDFRoutes(router *gin.RouterGroup, client *firestore.Client, gs *services.GotenbergService) {
	router.POST("/:responseId/generate-pdf", GeneratePDFHandler(client, gs))
}
