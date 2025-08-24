
package api

import (
	"net/http"

	"backend-go/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

type PublicSubmitPayload struct {
	FormData    map[string]interface{} `json:"formData"`
	SubmitNonce string                 `json:"submitNonce"`
	ProofOfWork string                 `json:"proofOfWork"`
}

func PublicFormProtectionMiddleware(rdb *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		var payload PublicSubmitPayload
		if err := c.ShouldBindJSON(&payload); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
			c.Abort()
			return
		}

		// 1. Validate Proof of Work
		if !services.ValidateProofOfWork(payload.SubmitNonce, payload.ProofOfWork) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Invalid proof of work", "code": "POW_FAILED"})
			c.Abort()
			return
		}

		// 2. Validate and consume the nonce using Redis
		if !services.ValidateAndConsumeNonce(c.Request.Context(), rdb, payload.SubmitNonce) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Invalid or expired form session", "code": "NONCE_INVALID"})
			c.Abort()
			return
		}

		// Store the form data for the handler to use
		c.Set("formData", payload.FormData)

		// If valid, pass control
		c.Next()
	}
}
