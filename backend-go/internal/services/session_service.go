package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"backend-go/internal/data"
	"github.com/redis/go-redis/v9"
)

const SessionTTL = 5 * 24 * time.Hour // 5 days - HIPAA compliant

// CreateSession stores a new user session in Redis with HIPAA audit trail
func CreateSession(ctx context.Context, rdb *redis.Client, sessionID string, sessionData *data.UserSession) error {
	key := fmt.Sprintf("session:%s", sessionID)
	
	// Set expiration time
	sessionData.ExpiresAt = time.Now().Add(SessionTTL)

	jsonData, err := json.Marshal(sessionData)
	if err != nil {
		return fmt.Errorf("failed to marshal session data: %w", err)
	}

	// Store with TTL
	if err := rdb.Set(ctx, key, jsonData, SessionTTL).Err(); err != nil {
		return fmt.Errorf("failed to store session in Redis: %w", err)
	}

	// HIPAA audit log
	log.Printf("AUDIT: Session created for user %s, org %s, IP %s, expires %v", 
		sessionData.UserID, sessionData.OrganizationID, sessionData.IPAddress, sessionData.ExpiresAt)

	return nil
}

// GetSession retrieves a user session from Redis with validation
func GetSession(ctx context.Context, rdb *redis.Client, sessionID string) (*data.UserSession, error) {
	key := fmt.Sprintf("session:%s", sessionID)
	
	jsonData, err := rdb.Get(ctx, key).Result()
	if err == redis.Nil {
		return nil, nil // Session not found, not an error
	} else if err != nil {
		return nil, fmt.Errorf("failed to get session from redis: %w", err)
	}

	var sessionData data.UserSession
	if err := json.Unmarshal([]byte(jsonData), &sessionData); err != nil {
		return nil, fmt.Errorf("failed to unmarshal session data: %w", err)
	}

	// Check expiration
	if time.Now().After(sessionData.ExpiresAt) {
		// Clean up expired session
		rdb.Del(ctx, key)
		return nil, nil
	}

	return &sessionData, nil
}

// DeleteSession removes a user session from Redis (for logout) with audit
func DeleteSession(ctx context.Context, rdb *redis.Client, sessionID string) error {
	key := fmt.Sprintf("session:%s", sessionID)
	
	// Get session for audit before deletion
	sessionData, _ := GetSession(ctx, rdb, sessionID)
	if sessionData != nil {
		log.Printf("AUDIT: Session deleted for user %s, org %s", 
			sessionData.UserID, sessionData.OrganizationID)
	}
	
	return rdb.Del(ctx, key).Err()
}