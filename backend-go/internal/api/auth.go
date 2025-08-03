package api

import (
	"context"
	"log"
	"net/http"
	"time"

	firebase "firebase.google.com/go/v4"
	"github.com/gin-gonic/gin"
)

// SessionLogin handles the session login process.
func SessionLogin(firebaseApp *firebase.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := context.Background()
		authClient, err := firebaseApp.Auth(ctx)
		if err != nil {
			log.Printf("Error getting Auth client: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}

		var req struct {
			IDToken string `json:"idToken"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID token not provided or invalid JSON"})
			return
		}

		if req.IDToken == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID token is empty"})
			return
		}

		// Set session expiration to 5 days.
		expiresIn := time.Hour * 24 * 5
		sessionCookie, err := authClient.SessionCookie(ctx, req.IDToken, expiresIn)
		if err != nil {
			log.Printf("Error creating session cookie: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Failed to create session cookie"})
			return
		}

		// Set the session cookie in the response
		c.SetCookie("session", sessionCookie, int(expiresIn.Seconds()), "/", "localhost", false, true)
		c.JSON(http.StatusOK, gin.H{"status": "success"})
	}
}
