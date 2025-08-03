package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"cloud.google.com/go/vertexai/genai"
	"github.com/gemini/forms-api/internal/api"
	"github.com/gemini/forms-api/internal/data"
	"github.com/gin-gonic/gin"
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

	gemini := vertexClient.GenerativeModel("gemini-1.5-flash")

	r := gin.Default()

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

	// Initialize Firebase Admin SDK
	authClient, err := data.NewFirebaseAuthClient(ctx)
	if err != nil {
		log.Fatalf("Failed to create Firebase Auth client: %v", err)
	}

	// Public routes
	r.GET("/forms/fill/:token", api.GetFormByShareToken(firestoreClient))

	// Authenticated routes
	authRequired := r.Group("/api")
	authRequired.Use(api.AuthMiddleware(authClient))
	{
		// Form routes
		authRequired.POST("/forms", api.CreateForm(firestoreClient))
		authRequired.GET("/forms", api.ListForms(firestoreClient))
		authRequired.GET("/forms/:id", api.GetForm(firestoreClient))
		authRequired.PUT("/forms/:id", api.UpdateForm(firestoreClient))
		authRequired.DELETE("/forms/:id", api.DeleteForm(firestoreClient))
		authRequired.POST("/forms/process-pdf-with-vertex", api.ProcessPDFWithVertex(gemini))
		authRequired.GET("/forms/:id/pdf", api.GenerateBlankPDF(firestoreClient))
		authRequired.GET("/forms/:id/responses/:responseId/pdf", api.GeneratePDF(firestoreClient))

		// Share link routes
		authRequired.POST("/forms/:id/share-links", api.CreateShareLink(firestoreClient))
		authRequired.GET("/forms/:id/share-links", api.ListShareLinks(firestoreClient))
		authRequired.DELETE("/forms/:id/share-links/:linkId", api.DeleteShareLink(firestoreClient))

		// Form response routes
		authRequired.POST("/responses", api.CreateFormResponse(firestoreClient))
		authRequired.GET("/responses/:id", api.GetFormResponse(firestoreClient))
		authRequired.GET("/responses", api.ListFormResponses(firestoreClient))

		// Organization routes
		authRequired.POST("/organizations", api.CreateOrganization(firestoreClient))
		authRequired.GET("/organizations/:id", api.GetOrganization(firestoreClient))
	}

	// Start the server
	log.Println("Starting server on :8080")
	r.Run(":8080")
}