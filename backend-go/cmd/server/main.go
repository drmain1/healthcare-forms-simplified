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
		
		// New HTML to PDF endpoint using Gotenberg
		authRequired.POST("/forms/:id/export-html-to-pdf", api.ExportHTMLToPDF(firestoreClient))
		

		// Share link routes
		authRequired.POST("/forms/:id/share-links", api.CreateShareLink(firestoreClient))
		authRequired.GET("/forms/:id/share-links", api.ListShareLinks(firestoreClient))
		authRequired.DELETE("/forms/:id/share-links/:linkId", api.DeleteShareLink(firestoreClient))

		// Form response routes
		authRequired.POST("/responses", api.CreateFormResponse(firestoreClient))
		authRequired.GET("/responses/:id", api.GetFormResponse(firestoreClient))
		authRequired.GET("/responses", api.ListFormResponses(firestoreClient))
		authRequired.GET("/responses/", api.ListFormResponses(firestoreClient))

		// Organization routes
		authRequired.POST("/organizations", api.CreateOrganization(firestoreClient))
		authRequired.GET("/organizations/:id", api.GetOrganization(firestoreClient))

		// PDF Generation Route
		api.RegisterPDFRoutes(r, firestoreClient, vertexService, gotenbergService)
	}

	// Start the server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Starting server on port %s", port)
	r.Run(":" + port)
}