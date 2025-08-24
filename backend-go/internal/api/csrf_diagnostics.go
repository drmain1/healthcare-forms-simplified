package api

import (
	"fmt"
	"net/http"
	"strings"

	"backend-go/internal/data"
	"github.com/gin-gonic/gin"
)

// CSRFDiagnostics provides detailed information about CSRF state
func CSRFDiagnostics(c *gin.Context) {
	diagnostics := gin.H{
		"request": gin.H{
			"method":      c.Request.Method,
			"path":        c.Request.URL.Path,
			"headers":     getRelevantHeaders(c),
			"cookies":     getCookieInfo(c),
			"client_ip":   c.ClientIP(),
		},
		"auth": gin.H{},
		"csrf": gin.H{},
		"redis": gin.H{},
	}

	// Check authentication state
	if userID, exists := c.Get("userID"); exists {
		diagnostics["auth"].(gin.H)["authenticated"] = true
		diagnostics["auth"].(gin.H)["user_id"] = userID
		diagnostics["auth"].(gin.H)["user_email"] = c.GetString("userEmail")
		diagnostics["auth"].(gin.H)["org_id"] = c.GetString("organizationID")
	} else {
		diagnostics["auth"].(gin.H)["authenticated"] = false
		diagnostics["auth"].(gin.H)["reason"] = "userID not found in context"
	}

	// Check CSRF token in header
	headerToken := c.GetHeader(CSRF_HEADER_NAME)
	diagnostics["csrf"].(gin.H)["header_token_present"] = headerToken != ""
	if headerToken != "" {
		diagnostics["csrf"].(gin.H)["header_token_length"] = len(headerToken)
		diagnostics["csrf"].(gin.H)["header_token_prefix"] = headerToken[:8] + "..."
	}

	// Check Redis connection and CSRF tokens
	redisClient := data.GetRedisClient()
	ctx := c.Request.Context()
	
	// Test Redis connection
	if err := redisClient.Ping(ctx).Err(); err != nil {
		diagnostics["redis"].(gin.H)["connected"] = false
		diagnostics["redis"].(gin.H)["error"] = err.Error()
	} else {
		diagnostics["redis"].(gin.H)["connected"] = true
		
		// If authenticated, check CSRF tokens in Redis
		if userID, exists := c.Get("userID"); exists {
			pattern := fmt.Sprintf("csrf:%s:*", userID.(string))
			keys, err := redisClient.Keys(ctx, pattern).Result()
			if err != nil {
				diagnostics["redis"].(gin.H)["csrf_lookup_error"] = err.Error()
			} else {
				diagnostics["redis"].(gin.H)["csrf_token_count"] = len(keys)
				if len(keys) > 0 {
					// Show first few token keys (sanitized)
					tokenInfo := []string{}
					for i, key := range keys {
						if i >= 3 {
							break
						}
						parts := strings.Split(key, ":")
						if len(parts) >= 3 {
							tokenInfo = append(tokenInfo, parts[2][:8]+"...")
						}
					}
					diagnostics["redis"].(gin.H)["csrf_token_samples"] = tokenInfo
				}
				
				// If header token provided, check if it exists
				if headerToken != "" {
					key := fmt.Sprintf("csrf:%s:%s", userID.(string), headerToken)
					exists, err := redisClient.Exists(ctx, key).Result()
					if err != nil {
						diagnostics["csrf"].(gin.H)["validation_error"] = err.Error()
					} else {
						diagnostics["csrf"].(gin.H)["token_valid"] = exists > 0
						if exists > 0 {
							ttl, _ := redisClient.TTL(ctx, key).Result()
							diagnostics["csrf"].(gin.H)["token_ttl_seconds"] = ttl.Seconds()
						}
					}
				}
			}

			// Check session in Redis
			sessionPattern := fmt.Sprintf("session:%s:*", userID.(string))
			sessionKeys, _ := redisClient.Keys(ctx, sessionPattern).Result()
			diagnostics["redis"].(gin.H)["session_count"] = len(sessionKeys)
		}
	}

	c.JSON(http.StatusOK, diagnostics)
}

// CSRFTestEndpoint tests CSRF validation
func CSRFTestEndpoint(c *gin.Context) {
	// This endpoint will be protected by CSRF middleware
	// If we get here, CSRF validation passed
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"message": "CSRF validation passed",
		"user_id": c.GetString("userID"),
		"method": c.Request.Method,
	})
}

func getRelevantHeaders(c *gin.Context) gin.H {
	return gin.H{
		"authorization":  maskToken(c.GetHeader("Authorization")),
		"x-csrf-token":   maskToken(c.GetHeader("X-CSRF-Token")),
		"content-type":   c.GetHeader("Content-Type"),
		"origin":         c.GetHeader("Origin"),
		"referer":        c.GetHeader("Referer"),
		"user-agent":     c.GetHeader("User-Agent"),
	}
}

func getCookieInfo(c *gin.Context) []gin.H {
	cookies := []gin.H{}
	for _, cookie := range c.Request.Cookies() {
		sameSiteStr := "None"
		switch cookie.SameSite {
		case http.SameSiteDefaultMode:
			sameSiteStr = "Default"
		case http.SameSiteLaxMode:
			sameSiteStr = "Lax"
		case http.SameSiteStrictMode:
			sameSiteStr = "Strict"
		case http.SameSiteNoneMode:
			sameSiteStr = "None"
		}
		
		cookies = append(cookies, gin.H{
			"name":      cookie.Name,
			"has_value": cookie.Value != "",
			"http_only": cookie.HttpOnly,
			"secure":    cookie.Secure,
			"same_site": sameSiteStr,
		})
	}
	return cookies
}

func maskToken(token string) string {
	if token == "" {
		return "(empty)"
	}
	if len(token) < 20 {
		return "(present but short)"
	}
	return token[:10] + "..." + token[len(token)-10:]
}