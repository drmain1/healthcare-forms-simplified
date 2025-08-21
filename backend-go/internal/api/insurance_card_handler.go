package api

import (
	"encoding/base64"
	"io"
	"net/http"
	"strings"

	"backend-go/internal/services"
	"github.com/gin-gonic/gin"
)

// InsuranceCardHandler handles insurance card processing requests
type InsuranceCardHandler struct {
	insuranceService *services.InsuranceCardService
}

// NewInsuranceCardHandler creates a new insurance card handler
func NewInsuranceCardHandler(insuranceService *services.InsuranceCardService) *InsuranceCardHandler {
	return &InsuranceCardHandler{
		insuranceService: insuranceService,
	}
}

// InsuranceCardRequest represents the request body for insurance card processing
type InsuranceCardRequest struct {
	ImageData string `json:"imageData" binding:"required"` // Base64 encoded image or data URL
	Side      string `json:"side" binding:"required"`      // "front" or "back"
	MimeType  string `json:"mimeType"`                      // Optional, defaults to image/jpeg
}

// ProcessInsuranceCard handles the insurance card extraction endpoint
func (h *InsuranceCardHandler) ProcessInsuranceCard(c *gin.Context) {
	var req InsuranceCardRequest

	// Parse JSON request body
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	// Validate side parameter
	if req.Side != "front" && req.Side != "back" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid side parameter",
			"details": "Side must be either 'front' or 'back'",
		})
		return
	}

	// Process base64 image data
	imageData := req.ImageData
	
	// Check if it's a data URL and extract the base64 part
	if strings.HasPrefix(imageData, "data:") {
		parts := strings.SplitN(imageData, ",", 2)
		if len(parts) != 2 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid data URL format",
			})
			return
		}
		
		// Extract mime type from data URL if not provided
		if req.MimeType == "" {
			headerParts := strings.Split(parts[0], ";")
			if len(headerParts) > 0 && strings.HasPrefix(headerParts[0], "data:") {
				req.MimeType = strings.TrimPrefix(headerParts[0], "data:")
			}
		}
		
		imageData = parts[1]
	}

	// Default mime type if not provided
	if req.MimeType == "" {
		req.MimeType = "image/jpeg"
	}

	// Decode base64 image
	decodedImage, err := base64.StdEncoding.DecodeString(imageData)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to decode base64 image",
			"details": err.Error(),
		})
		return
	}

	// Process the insurance card with Vertex AI
	extractedData, err := h.insuranceService.ProcessInsuranceCard(
		c.Request.Context(),
		decodedImage,
		req.MimeType,
		req.Side,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to process insurance card",
			"details": err.Error(),
		})
		return
	}

	// Return the extracted data
	c.JSON(http.StatusOK, extractedData)
}

// ProcessInsuranceCardMultipart handles multipart form data uploads
func (h *InsuranceCardHandler) ProcessInsuranceCardMultipart(c *gin.Context) {
	// Get the uploaded file
	file, header, err := c.Request.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to get uploaded file",
			"details": err.Error(),
		})
		return
	}
	defer file.Close()

	// Get the side parameter
	side := c.PostForm("side")
	if side == "" {
		side = "front" // Default to front
	}

	// Validate side parameter
	if side != "front" && side != "back" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid side parameter",
			"details": "Side must be either 'front' or 'back'",
		})
		return
	}

	// Read the file data
	imageData, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to read uploaded file",
			"details": err.Error(),
		})
		return
	}

	// Determine MIME type from file header
	mimeType := header.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = "image/jpeg" // Default
	}

	// Process the insurance card with Vertex AI
	extractedData, err := h.insuranceService.ProcessInsuranceCard(
		c.Request.Context(),
		imageData,
		mimeType,
		side,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to process insurance card",
			"details": err.Error(),
		})
		return
	}

	// Return the extracted data
	c.JSON(http.StatusOK, extractedData)
}