
package services

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/google/uuid"
)

const nonceTTL = 30 * time.Minute

// GenerateNonce creates, stores in Redis, and returns a new nonce.
func GenerateNonce(ctx context.Context, rdb *redis.Client) (string, error) {
	nonce := uuid.NewString()
	key := fmt.Sprintf("nonce:%s", nonce)

	err := rdb.Set(ctx, key, "true", nonceTTL).Err()
	if err != nil {
		return "", err
	}
	return nonce, nil
}

// ValidateAndConsumeNonce checks if a nonce is valid in Redis and consumes it atomically.
func ValidateAndConsumeNonce(ctx context.Context, rdb *redis.Client, nonce string) bool {
	key := fmt.Sprintf("nonce:%s", nonce)

	// The GETDEL command gets the value and deletes the key in a single atomic operation.
	// If the key existed, the command returns its value. If not, it returns a nil error.
	// This is perfect for preventing race conditions and replay attacks.
	err := rdb.GetDel(ctx, key).Err()

	// If err is nil, the key existed and was deleted. If err is redis.Nil, the key did not exist.
	return err == nil
}

// ValidateProofOfWork checks if the proof is valid for the given nonce.
// This function does not need to change.
func ValidateProofOfWork(nonce string, proof string) bool {
	// Difficulty: hash must start with "00"
	hash := sha256.Sum256([]byte(nonce + proof))
	return hex.EncodeToString(hash[:])[0:2] == "00"
}
