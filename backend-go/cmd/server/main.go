package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"

	"cloud.google.com/go/vertexai/genai"
	"github.com/gemini/forms-api/internal/api"
	"github.com/gemini/forms-api/internal/data"
	"github.com/gemini/forms-api/internal/services"
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

	r := gin.New()
	// Per Gin documentation, this is required when running behind a proxy
	// to ensure correct client IP is read.
	r.SetTrustedProxies(nil)
	r.RedirectTrailingSlash = false

	// CORS Middleware

	corsOrigins := os.Getenv("CORS_ALLOWED_ORIGINS")
	if corsOrigins == "" {
		corsOrigins = "http://localhost:3000"
	}
	r.Use(cors.New(cors.Config{
		AllowOrigins:     strings.Split(corsOrigins, ";"),
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Logger and Recovery middleware
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

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
	r.GET("/forms/:id/fill/:share_token", api.GetFormByShareToken(firestoreClient))
	r.GET("/forms/:id/fill/:share_token/", api.GetFormByShareToken(firestoreClient))
	r.POST("/responses/public", api.CreatePublicFormResponse(firestoreClient))

	// Authentication routes

	apiAuthRoutes := r.Group("/api/auth")
	{
		apiAuthRoutes.POST("/session-login", api.SessionLogin(firebaseApp))
		apiAuthRoutes.POST("/session-login/", api.SessionLogin(firebaseApp))
	}

	// Authenticated routes

	authRequired := r.Group("/api")
	authRequired.Use(api.AuthMiddleware(authClient))
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