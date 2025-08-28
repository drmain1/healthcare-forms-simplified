
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

	"backend-go/internal/api"
	"backend-go/internal/data"
	"backend-go/internal/services"

	"cloud.google.com/go/vertexai/genai"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"time"
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

	// Initialize secure Redis Client with HIPAA compliance
	rdb := data.GetRedisClient()

	// === SERVICE INITIALIZATION ===

	vertexService := services.NewVertexAIService(vertexClient, "gemini-2.5-pro")
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
	
	// CORS must come before SecurityHeaders to properly handle preflight requests
	corsOrigins := os.Getenv("CORS_ALLOWED_ORIGINS")
	if corsOrigins == "" {
		// Default to both localhost and production URLs including custom domain
		corsOrigins = "http://localhost:3000;https://healthcare-forms-v2.web.app;https://healthcare-forms-v2.firebaseapp.com;https://form.easydocforms.com"
	}
	r.Use(cors.New(cors.Config{
		AllowOrigins:     strings.Split(corsOrigins, ";"),
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-CSRF-Token"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           300,
	}))
	
	r.Use(api.SecurityHeadersMiddleware())
	r.Use(api.ErrorHandlerMiddleware())
	r.Use(gin.Logger())

	// === STATIC FILE SERVING (BEFORE OTHER ROUTES) ===
	// Register static files early to avoid inheriting API middleware
	
	// Serve static assets (CSS, JS, images, etc.)
	r.Static("/static", "/web/build/static")
	
	// Serve other static files (favicon, manifest, etc.)
	r.StaticFile("/favicon.ico", "/web/build/favicon.ico")
	r.StaticFile("/logo192.png", "/web/build/logo192.png")
	r.StaticFile("/logo512.png", "/web/build/logo512.png")
	r.StaticFile("/manifest.json", "/web/build/manifest.json")
	r.StaticFile("/robots.txt", "/web/build/robots.txt")

	// === ROUTE DEFINITIONS ===

	// Enhanced health check with Redis security validation and emergency store status
	r.GET("/health", func(c *gin.Context) {
		ctx := context.Background()
		
		// Basic service health
		healthStatus := gin.H{
			"status": "healthy", 
			"timestamp": time.Now().Unix(),
			"version": "1.5.0", // Updated with Redis improvements and emergency CSRF
		}
		
		// Get Redis statistics from our enhanced client
		redisStats := data.GetRedisStats()
		
		// Redis connectivity and comprehensive health check
		redisClient := data.GetRedisClient()
		if redisClient == nil {
			healthStatus["status"] = "degraded"
			healthStatus["redis"] = gin.H{
				"status": "unavailable",
				"message": "Redis client initialization failed",
				"configuration": gin.H{
					"address": redisStats.Address,
					"tls_enabled": redisStats.TLSEnabled,
					"initialization_time": redisStats.InitializationTime,
				},
				"last_error": func() string {
					if redisStats.LastError != nil {
						return redisStats.LastError.Error()
					}
					return "none"
				}(),
				"emergency_mode": gin.H{
					"csrf_tokens": "active",
					"note": "CSRF tokens stored in memory while Redis is unavailable",
				},
			}
		} else {
			// Test current connection
			pingStart := time.Now()
			if err := redisClient.Ping(ctx).Err(); err != nil {
				healthStatus["status"] = "unhealthy"
				healthStatus["redis"] = gin.H{
					"status": "disconnected",
					"error": err.Error(),
					"ping_duration": time.Since(pingStart).String(),
					"configuration": gin.H{
						"address": redisStats.Address,
						"tls_enabled": redisStats.TLSEnabled,
						"initialization_time": redisStats.InitializationTime,
					},
					"emergency_mode": gin.H{
						"csrf_tokens": "active",
						"note": "CSRF tokens fallback to memory store",
					},
				}
				c.JSON(500, healthStatus)
				return
			}
			
			pingDuration := time.Since(pingStart)
			
			// Redis connection pool health
			stats := redisClient.PoolStats()
			
			// Test basic operations to ensure full functionality
			testKey := fmt.Sprintf("health-test:%d", time.Now().Unix())
			testStart := time.Now()
			testSuccess := true
			var testError error
			
			// Quick SET/GET/DEL test
			if err := redisClient.Set(ctx, testKey, "health-check", 10*time.Second).Err(); err != nil {
				testSuccess = false
				testError = fmt.Errorf("SET failed: %w", err)
			} else if val, err := redisClient.Get(ctx, testKey).Result(); err != nil {
				testSuccess = false
				testError = fmt.Errorf("GET failed: %w", err)
			} else if val != "health-check" {
				testSuccess = false
				testError = fmt.Errorf("GET returned wrong value: %s", val)
			} else if err := redisClient.Del(ctx, testKey).Err(); err != nil {
				testSuccess = false
				testError = fmt.Errorf("DEL failed: %w", err)
			}
			
			testDuration := time.Since(testStart)
			
			// Get Redis server information
			info, infoErr := redisClient.Info(ctx, "memory", "stats", "replication").Result()
			
			redisHealth := gin.H{
				"status": "connected",
				"ping_duration": pingDuration.String(),
				"operations_test": gin.H{
					"success": testSuccess,
					"duration": testDuration.String(),
				},
				"pool": gin.H{
					"total_connections": stats.TotalConns,
					"idle_connections": stats.IdleConns,
					"stale_connections": stats.StaleConns,
					"hits": stats.Hits,
					"misses": stats.Misses,
					"timeouts": stats.Timeouts,
				},
				"configuration": gin.H{
					"address": redisStats.Address,
					"tls_enabled": redisStats.TLSEnabled,
					"initialization_time": redisStats.InitializationTime,
					"connected_since": redisStats.LastConnectionTime,
				},
			}
			
			if !testSuccess && testError != nil {
				redisHealth["operations_test"].(gin.H)["error"] = testError.Error()
			}
			
			// Parse Redis INFO for key metrics
			if infoErr == nil && info != "" {
				memoryInfo := parseRedisMemoryInfo(info)
				if len(memoryInfo) > 0 {
					redisHealth["memory"] = memoryInfo
				}
				
				statsInfo := parseRedisStatsInfo(info)
				if len(statsInfo) > 0 {
					redisHealth["stats"] = statsInfo
				}
			}
			
			// Check for warning conditions
			var warnings []string
			if stats.TotalConns == 0 {
				warnings = append(warnings, "no_connections_available")
				healthStatus["status"] = "degraded"
			}
			
			if stats.Timeouts > 0 {
				warnings = append(warnings, fmt.Sprintf("connection_timeouts_detected: %d", stats.Timeouts))
			}
			
			if !testSuccess {
				warnings = append(warnings, "basic_operations_test_failed")
				healthStatus["status"] = "degraded"
			}
			
			if pingDuration > 100*time.Millisecond {
				warnings = append(warnings, fmt.Sprintf("high_ping_latency: %v", pingDuration))
			}
			
			// Check hit ratio for performance monitoring
			if stats.Hits+stats.Misses > 0 {
				hitRatio := float64(stats.Hits) / float64(stats.Hits+stats.Misses)
				redisHealth["hit_ratio"] = fmt.Sprintf("%.2f", hitRatio)
				
				if hitRatio < 0.8 {
					warnings = append(warnings, fmt.Sprintf("low_hit_ratio: %.2f", hitRatio))
				}
			}
			
			if len(warnings) > 0 {
				redisHealth["warnings"] = warnings
				if healthStatus["status"] == "healthy" {
					healthStatus["status"] = "degraded"
				}
			}
			
			healthStatus["redis"] = redisHealth
		}
		
		// Add general system information
		healthStatus["features"] = gin.H{
			"csrf_protection": "active",
			"emergency_csrf_store": "available",
			"pdf_generation": "available",
			"rate_limiting": "active",
			"vpc_connectivity": "enabled",
		}
		
		// Set appropriate HTTP status code
		if healthStatus["status"] == "healthy" {
			c.JSON(200, healthStatus)
		} else if healthStatus["status"] == "degraded" {
			c.JSON(200, healthStatus) // Still return 200 for degraded but functional
		} else {
			c.JSON(503, healthStatus) // Service unavailable for unhealthy
		}
	})

	// --- Public Routes ---
	publicRoutes := r.Group("/public")
	publicRoutes.Use(api.RateLimiterMiddleware(api.APIRateLimit)) // Apply rate limiting to public routes
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

	// Public API endpoints (no auth required)
	publicAPI := r.Group("/api")
	{
		publicAPI.GET("/forms/:id/public/:share_token", api.GetFormByShareToken(firestoreClient))
		publicAPI.POST("/responses/public", api.CreatePublicFormResponse(firestoreClient))
	}

	// --- Auth Routes (Stricter Rate Limiting) ---
	apiAuthRoutes := r.Group("/api/auth")
	apiAuthRoutes.Use(api.RateLimiterMiddleware(api.AuthRateLimit)) // Stricter limits for auth endpoints
	{
		apiAuthRoutes.POST("/session-login", api.SessionLogin(firebaseApp))
	}

	// --- Diagnostic Routes (protected by auth only, no CSRF) ---
	diagRoutes := r.Group("/api/diagnostics")
	{
		diagRoutes.Use(api.AuthMiddleware(authClient))
		diagRoutes.GET("/csrf", api.CSRFDiagnostics)
		diagRoutes.POST("/csrf-test", api.CSRFMiddleware(), api.CSRFTestEndpoint)
	}

	// CSRF token generation endpoint (requires auth)
	authTokenRoute := r.Group("/api/auth")
	{
		authTokenRoute.Use(api.AuthMiddleware(authClient))
		authTokenRoute.GET("/csrf-token", api.GenerateCSRFToken)
	}

	// --- Authenticated API Routes ---
	authRequired := r.Group("/api")
	{
		authRequired.Use(api.AuthMiddleware(authClient))
		authRequired.Use(api.CSRFMiddleware())
		authRequired.Use(api.RateLimiterMiddleware(api.APIRateLimit)) // Standard API rate limiting
		authRequired.Use(api.SecurityMiddleware(securityValidator))
		if auditLogger != nil {
			authRequired.Use(api.AuditMiddleware(auditLogger))
		}

		// Auth routes that require authentication
		authRequired.POST("/auth/logout", api.LogoutHandler)

		// Form routes with caching
		authRequired.POST("/forms", api.CreateForm(firestoreClient, rdb))
		authRequired.GET("/forms", api.ListForms(firestoreClient, rdb)) // Caching list view
		authRequired.GET("/forms/:id", api.GetForm(firestoreClient, rdb))   // Caching single view
		authRequired.PUT("/forms/:id", api.UpdateForm(firestoreClient, rdb))  // Cache invalidation
		authRequired.PATCH("/forms/:id", api.UpdateForm(firestoreClient, rdb)) // Cache invalidation
		authRequired.DELETE("/forms/:id", api.DeleteForm(firestoreClient, rdb))// Cache invalidation
		
		// PDF to Form processing route
		authRequired.POST("/forms/process-pdf-with-vertex", api.ProcessPDFWithVertex(firestoreClient, vertexService))

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

		// PDF Generation Routes (with stricter rate limiting and distributed locks)
		pdfRoutes := authRequired.Group("/responses")
		pdfRoutes.Use(api.RateLimiterMiddleware(api.PDFRateLimit)) // Stricter PDF rate limiting
		api.RegisterPDFRoutes(pdfRoutes, firestoreClient, gotenbergService)

		// Insurance Card Processing Routes
		authRequired.POST("/insurance-card/extract", insuranceCardHandler.ProcessInsuranceCard)
		authRequired.POST("/insurance-card/upload", insuranceCardHandler.ProcessInsuranceCardMultipart)
	}

	// Static files already registered above
	
	// Serve React app for all other routes (must be last - catch-all for React Router)
	r.NoRoute(func(c *gin.Context) {
		// Don't serve React app for API routes - let them 404
		if strings.HasPrefix(c.Request.URL.Path, "/api/") {
			c.JSON(http.StatusNotFound, gin.H{"error": "API endpoint not found"})
			return
		}
		
		// For all other routes, serve the React app
		c.File("/web/build/index.html")
	})

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

// parseRedisMemoryInfo parses Redis memory information from INFO output
func parseRedisMemoryInfo(info string) gin.H {
	memoryInfo := make(gin.H)
	lines := strings.Split(info, "\n")
	
	for _, line := range lines {
		if strings.Contains(line, "used_memory:") {
			parts := strings.Split(line, ":")
			if len(parts) == 2 {
				if bytes, err := strconv.ParseInt(strings.TrimSpace(parts[1]), 10, 64); err == nil {
					memoryInfo["used_bytes"] = bytes
					memoryInfo["used_mb"] = fmt.Sprintf("%.2f", float64(bytes)/1024/1024)
				}
			}
		}
		if strings.Contains(line, "used_memory_human:") {
			parts := strings.Split(line, ":")
			if len(parts) == 2 {
				memoryInfo["used_human"] = strings.TrimSpace(parts[1])
			}
		}
		if strings.Contains(line, "used_memory_peak_human:") {
			parts := strings.Split(line, ":")
			if len(parts) == 2 {
				memoryInfo["peak_human"] = strings.TrimSpace(parts[1])
			}
		}
		if strings.Contains(line, "mem_fragmentation_ratio:") {
			parts := strings.Split(line, ":")
			if len(parts) == 2 {
				memoryInfo["fragmentation_ratio"] = strings.TrimSpace(parts[1])
			}
		}
	}
	
	return memoryInfo
}

// parseRedisStatsInfo parses Redis statistics from INFO output
func parseRedisStatsInfo(info string) gin.H {
	statsInfo := make(gin.H)
	lines := strings.Split(info, "\n")
	
	for _, line := range lines {
		if strings.Contains(line, "total_connections_received:") {
			parts := strings.Split(line, ":")
			if len(parts) == 2 {
				if count, err := strconv.ParseInt(strings.TrimSpace(parts[1]), 10, 64); err == nil {
					statsInfo["total_connections_received"] = count
				}
			}
		}
		if strings.Contains(line, "total_commands_processed:") {
			parts := strings.Split(line, ":")
			if len(parts) == 2 {
				if count, err := strconv.ParseInt(strings.TrimSpace(parts[1]), 10, 64); err == nil {
					statsInfo["total_commands_processed"] = count
				}
			}
		}
		if strings.Contains(line, "keyspace_hits:") {
			parts := strings.Split(line, ":")
			if len(parts) == 2 {
				if count, err := strconv.ParseInt(strings.TrimSpace(parts[1]), 10, 64); err == nil {
					statsInfo["keyspace_hits"] = count
				}
			}
		}
		if strings.Contains(line, "keyspace_misses:") {
			parts := strings.Split(line, ":")
			if len(parts) == 2 {
				if count, err := strconv.ParseInt(strings.TrimSpace(parts[1]), 10, 64); err == nil {
					statsInfo["keyspace_misses"] = count
				}
			}
		}
		if strings.Contains(line, "connected_clients:") {
			parts := strings.Split(line, ":")
			if len(parts) == 2 {
				if count, err := strconv.ParseInt(strings.TrimSpace(parts[1]), 10, 64); err == nil {
					statsInfo["connected_clients"] = count
				}
			}
		}
	}
	
	return statsInfo
}
