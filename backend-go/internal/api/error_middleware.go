package api

import (
	"github.com/gin-gonic/gin"
	"os"
	"log"
)

func ErrorHandlerMiddleware() gin.HandlerFunc {
	isProd := os.Getenv("ENVIRONMENT") == "production"
	
	return func(c *gin.Context) {
		c.Next()
		
		// Handle any errors that occurred
		if len(c.Errors) > 0 {
			err := c.Errors.Last()
			
			// Always log full error internally
			log.Printf("ERROR [%s %s]: %v", c.Request.Method, c.Request.URL.Path, err)
			
			// Determine status code if not set
			status := c.Writer.Status()
			if status == 200 {
				status = 500
			}
			
			// In production, return generic message
			if isProd {
				genericMessages := map[int]string{
					400: "Invalid request",
					401: "Authentication required",
					403: "Access denied",
					404: "Resource not found",
					429: "Too many requests",
					500: "Internal server error",
				}
				
				message := genericMessages[status]
				if message == "" {
					message = "An error occurred"
				}
				
				c.JSON(status, gin.H{
					"error": message,
					"code": "ERROR",
				})
			} else {
				// In development, return actual error
				c.JSON(status, gin.H{
					"error": err.Error(),
					"code": "ERROR",
					"debug": true,
				})
			}
		}
	}
}