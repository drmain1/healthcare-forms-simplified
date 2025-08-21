package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"

	"cloud.google.com/go/vertexai/genai"
	"backend-go/internal/api"
	"backend-go/internal/data"
	"backend-go/internal/services"
	"github.com/gin-gonic/gin"

	"github.com/gin-contrib/cors" // Import the cors package
)

func main() {
	ctx := context.Background()

	// Get project ID from environment

	projectID := os.Getenv("GCP_PROJECT_ID")
	if projectID == "" {
		log.Fatal("GCP_PROJECT_ID environment variable not set")
	}

	// Initialize Firestore client

	firestoreClient, err := data.NewFirestoreClient(ctx, projectID)
	if err != nil {
		log.Fatalf("Failed to create Firestore client: %v", err)
	}
	defer firestoreClient.Close()

	// Initialize Vertex AI client

	vertexClient, err := genai.NewClient(ctx, projectID, "us-central1")
	if err != nil {
		log.Fatalf("Failed to create Vertex AI client: %v", err)
	}
	defer vertexClient.Close()

	// IMPORTANT: The model name "gemini-2.5-flash-lite" is CORRECT as of August 2025
	// Do NOT change this to older models like gemini-1.5-flash or gemini-1.0-pro
	// Gemini 2.5 Flash Lite is the latest, fastest model from Google
	// If you see errors about this model not existing, ensure:
	// 1. The GCP project has Vertex AI API enabled
	// 2. The service account has proper permissions
	// 3. The model is available in the us-central1 region
	vertexService := services.NewVertexAIService(vertexClient, "gemini-2.5-flash-lite")
	gotenbergService := services.NewGotenbergService()
	
	// Initialize insurance card service with Vertex AI
	insuranceCardService := services.NewInsuranceCardService(vertexClient)
	insuranceCardHandler := api.NewInsuranceCardHandler(insuranceCardService)

	// Initialize security components
	auditLogger, err := services.NewCloudAuditLogger(projectID)
	if err != nil {
		log.Printf("WARNING: Audit logging disabled: %v", err)
		// Don't fail startup, but log warning
	}
	defer func() {
		if auditLogger != nil {
			auditLogger.Close()
		}
	}()
	
	securityValidator := services.NewSecurityValidator()

	r := gin.New()
	// Per Gin documentation, this is required when running behind a proxy
	// to ensure correct client IP is read.
	r.SetTrustedProxies(nil)
	r.RedirectTrailingSlash = false

	// Apply middleware in correct order:
	// 1. Recovery (catch panics)
	r.Use(gin.Recovery())
	
	// 2. Security headers (apply to all responses)
	r.Use(api.SecurityHeadersMiddleware())
	
	// 3. CORS (needed before auth)
	corsOrigins := os.Getenv("CORS_ALLOWED_ORIGINS")
	if corsOrigins == "" {
		corsOrigins = "http://localhost:3000"
	}
	r.Use(cors.New(cors.Config{
		AllowOrigins:     strings.Split(corsOrigins, ";"),
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-CSRF-Token"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           300,
	}))
	
	// 4. Error handler (catch all errors)
	r.Use(api.ErrorHandlerMiddleware())
	
	// 5. Request logging (optional but recommended)
	r.Use(gin.Logger())

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

	// Initialize Firebase Admin SDK

	authClient, firebaseApp, err := data.NewFirebaseAuthClient(ctx, projectID)
	if err != nil {
		log.Fatalf("Failed to create Firebase Auth client: %v", err)
	}

	// Public routes (no auth required)
	publicRoutes := r.Group("/public")
	{
		// Endpoint to get a form, which now also returns a nonce
		publicRoutes.GET("/forms/:id", func(c *gin.Context) {
			formID := c.Param("id")
			// For now, return nonce along with any existing form data
			// In a full implementation, you'd fetch the actual form data
			c.JSON(http.StatusOK, gin.H{
				"formId":      formID,
				"submitNonce": services.GenerateNonce(),
				"message":     "Form loaded successfully",
			})
		})

		// Endpoint to submit a form, protected by our middleware
		publicRoutes.POST("/forms/submit", api.PublicFormProtectionMiddleware(), func(c *gin.Context) {
			// Get the validated form data from middleware
			formData, exists := c.Get("formData")
			if !exists {
				c.JSON(http.StatusBadRequest, gin.H{"error": "No form data provided"})
				return
			}
			
			// Process the form submission here
			c.JSON(http.StatusOK, gin.H{
				"message": "Form submitted successfully",
				"data":    formData,
			})
		})
	}
	
	// Legacy public routes (maintain backward compatibility)
	r.GET("/forms/:id/fill/:share_token", api.GetFormByShareToken(firestoreClient))
	r.GET("/forms/:id/fill/:share_token/", api.GetFormByShareToken(firestoreClient))
	r.POST("/responses/public", api.CreatePublicFormResponse(firestoreClient))

	// Authentication routes
	apiAuthRoutes := r.Group("/api/auth")
	{
		apiAuthRoutes.POST("/session-login", api.SessionLogin(firebaseApp))
		apiAuthRoutes.POST("/session-login/", api.SessionLogin(firebaseApp))
		// CSRF token endpoint for authenticated users
		apiAuthRoutes.GET("/csrf-token", api.GenerateCSRFToken)
	}

	// Authenticated routes
	authRequired := r.Group("/api")
	
	// 6. Authentication middleware
	authRequired.Use(api.AuthMiddleware(authClient))
	
	// 7. CSRF protection for state-changing operations
	authRequired.Use(api.CSRFMiddleware())
	
	// 8. Security validation (after auth so we have userID)
	authRequired.Use(api.SecurityMiddleware(securityValidator))
	
	// 9. Audit logging (after auth to capture user info)
	if auditLogger != nil {
		authRequired.Use(api.AuditMiddleware(auditLogger))
	}
	{
		// Form routes
		authRequired.POST("/forms", api.CreateForm(firestoreClient))
		authRequired.POST("/forms/", api.CreateForm(firestoreClient))
		authRequired.GET("/forms", api.ListForms(firestoreClient))
		authRequired.GET("/forms/", api.ListForms(firestoreClient))
		authRequired.GET("/forms/:id", api.GetForm(firestoreClient))
		authRequired.GET("/forms/:id/", api.GetForm(firestoreClient))
		authRequired.PUT("/forms/:id", api.UpdateForm(firestoreClient))
		authRequired.PATCH("/forms/:id", api.UpdateForm(firestoreClient))
		authRequired.PATCH("/forms/:id/", api.UpdateForm(firestoreClient))
		authRequired.DELETE("/forms/:id", api.DeleteForm(firestoreClient))
		authRequired.DELETE("/forms/:id/", api.DeleteForm(firestoreClient))
		
		
		

		// Share link routes
		authRequired.POST("/forms/:id/share-links", api.CreateShareLink(firestoreClient))
		authRequired.GET("/forms/:id/share-links", api.ListShareLinks(firestoreClient))
		authRequired.DELETE("/forms/:id/share-links/:linkId", api.DeleteShareLink(firestoreClient))

		// Form response routes
		authRequired.POST("/responses", api.CreateFormResponse(firestoreClient))
		authRequired.GET("/responses/:id", api.GetFormResponse(firestoreClient))
		authRequired.GET("/responses", api.ListFormResponses(firestoreClient))
		authRequired.GET("/responses/", api.ListFormResponses(firestoreClient))
		authRequired.DELETE("/responses/:id", api.DeleteFormResponse(firestoreClient))
		authRequired.DELETE("/responses/:id/", api.DeleteFormResponse(firestoreClient))
		authRequired.GET("/responses/:id/clinical-summary", api.GetClinicalSummary(firestoreClient, vertexService))

		// Organization routes
		authRequired.POST("/organizations", api.CreateOrganization(firestoreClient))
		authRequired.GET("/organizations/:id", api.GetOrganization(firestoreClient))
		authRequired.GET("/organizations/current", api.GetOrCreateUserOrganization(firestoreClient))
		authRequired.PUT("/organizations/:id/clinic-info", api.UpdateOrganizationClinicInfo(firestoreClient))
		authRequired.GET("/organizations/:id/clinic-info", api.GetOrganizationClinicInfo(firestoreClient))

		// PDF Generation Route
		api.RegisterPDFRoutes(authRequired, firestoreClient, gotenbergService)
		
		// Insurance Card Processing Routes
		authRequired.POST("/insurance-card/extract", insuranceCardHandler.ProcessInsuranceCard)
		authRequired.POST("/insurance-card/extract/", insuranceCardHandler.ProcessInsuranceCard)
		authRequired.POST("/insurance-card/upload", insuranceCardHandler.ProcessInsuranceCardMultipart)
		authRequired.POST("/insurance-card/upload/", insuranceCardHandler.ProcessInsuranceCardMultipart)
	}

	// Start the server

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Print all registered routes for debugging
	log.Println("Registered Routes:")
	for _, route := range r.Routes() {
		log.Printf("% -6s % -25s --> %s\n", route.Method, route.Path, route.Handler)
	}

	log.Printf("Starting server on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}