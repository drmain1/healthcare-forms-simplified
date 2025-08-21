
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"

	"backend-go/internal/api"
	"backend-go/internal/data"
	"backend-go/internal/services"

	"cloud.google.com/go/vertexai/genai"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
)

func main() {
	ctx := context.Background()

	projectID := os.Getenv("GCP_PROJECT_ID")
	if projectID == "" {
		log.Fatal("GCP_PROJECT_ID environment variable not set")
	}

	// === CLIENT INITIALIZATION ===

	firestoreClient, err := data.NewFirestoreClient(ctx, projectID)
	if err != nil {
		log.Fatalf("Failed to create Firestore client: %v", err)
	}
	defer firestoreClient.Close()

	vertexClient, err := genai.NewClient(ctx, projectID, "us-central1")
	if err != nil {
		log.Fatalf("Failed to create Vertex AI client: %v", err)
	}
	defer vertexClient.Close()

	authClient, firebaseApp, err := data.NewFirebaseAuthClient(ctx, projectID)
	if err != nil {
		log.Fatalf("Failed to create Firebase Auth client: %v", err)
	}

	// Initialize Redis Client
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		log.Fatal("REDIS_ADDR environment variable not set")
	}
	rdb := redis.NewClient(&redis.Options{
		Addr: redisAddr,
	})
	// Ping Redis to check the connection
	if _, err := rdb.Ping(ctx).Result(); err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}

	// === SERVICE INITIALIZATION ===

	vertexService := services.NewVertexAIService(vertexClient, "gemini-2.5-flash-lite")
	gotenbergService := services.NewGotenbergService()
	insuranceCardService := services.NewInsuranceCardService(vertexClient)
	insuranceCardHandler := api.NewInsuranceCardHandler(insuranceCardService)
	securityValidator := services.NewSecurityValidator()

	auditLogger, err := services.NewCloudAuditLogger(projectID)
	if err != nil {
		log.Printf("WARNING: Audit logging disabled: %v", err)
	}
	if auditLogger != nil {
		defer auditLogger.Close()
	}

	// === ROUTER AND MIDDLEWARE SETUP ===

	r := gin.New()
	r.SetTrustedProxies(nil)
	r.RedirectTrailingSlash = false

	r.Use(gin.Recovery())
	r.Use(api.SecurityHeadersMiddleware())

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

	r.Use(api.ErrorHandlerMiddleware())
	r.Use(gin.Logger())

	// === ROUTE DEFINITIONS ===

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// --- Public Routes ---
	publicRoutes := r.Group("/public")
	{
		publicRoutes.GET("/forms/:id", func(c *gin.Context) {
			formID := c.Param("id")
			nonce, err := services.GenerateNonce(c.Request.Context(), rdb)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate form session"})
				return
			}
			c.JSON(http.StatusOK, gin.H{
				"formId":      formID,
				"submitNonce": nonce,
				"message":     "Form loaded successfully",
			})
		})

		publicRoutes.POST("/forms/submit", api.PublicFormProtectionMiddleware(rdb), func(c *gin.Context) {
			formData, exists := c.Get("formData")
			if !exists {
				c.JSON(http.StatusBadRequest, gin.H{"error": "No form data provided"})
				return
			}
			c.JSON(http.StatusOK, gin.H{
				"message": "Form submitted successfully",
				"data":    formData,
			})
		})
	}

	r.GET("/forms/:id/fill/:share_token", api.GetFormByShareToken(firestoreClient))
	r.POST("/responses/public", api.CreatePublicFormResponse(firestoreClient))

	// --- Auth Routes ---
	apiAuthRoutes := r.Group("/api/auth")
	{
		apiAuthRoutes.POST("/session-login", api.SessionLogin(firebaseApp))
		apiAuthRoutes.GET("/csrf-token", api.GenerateCSRFToken)
	}

	// --- Authenticated API Routes ---
	authRequired := r.Group("/api")
	{
		authRequired.Use(api.AuthMiddleware(authClient))
		authRequired.Use(api.CSRFMiddleware())
		authRequired.Use(api.SecurityMiddleware(securityValidator))
		if auditLogger != nil {
			authRequired.Use(api.AuditMiddleware(auditLogger))
		}

		// Form routes with caching
		authRequired.POST("/forms", api.CreateForm(firestoreClient, rdb))
		authRequired.GET("/forms", api.ListForms(firestoreClient, rdb)) // Caching list view
		authRequired.GET("/forms/:id", api.GetForm(firestoreClient, rdb))   // Caching single view
		authRequired.PUT("/forms/:id", api.UpdateForm(firestoreClient, rdb))  // Cache invalidation
		authRequired.PATCH("/forms/:id", api.UpdateForm(firestoreClient, rdb)) // Cache invalidation
		authRequired.DELETE("/forms/:id", api.DeleteForm(firestoreClient, rdb))// Cache invalidation

		// Share link routes
		authRequired.POST("/forms/:id/share-links", api.CreateShareLink(firestoreClient))
		authRequired.GET("/forms/:id/share-links", api.ListShareLinks(firestoreClient))
		authRequired.DELETE("/forms/:id/share-links/:linkId", api.DeleteShareLink(firestoreClient))

		// Form response routes
		authRequired.POST("/responses", api.CreateFormResponse(firestoreClient))
		authRequired.GET("/responses/:id", api.GetFormResponse(firestoreClient))
		authRequired.GET("/responses", api.ListFormResponses(firestoreClient))
		authRequired.DELETE("/responses/:id", api.DeleteFormResponse(firestoreClient))
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
		authRequired.POST("/insurance-card/upload", insuranceCardHandler.ProcessInsuranceCardMultipart)
	}

	// === SERVER START ===

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting server on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
