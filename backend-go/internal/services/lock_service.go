package services

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

// DistributedLock represents a Redis-based distributed lock
type DistributedLock struct {
	client     *redis.Client
	key        string
	value      string
	ttl        time.Duration
	acquired   bool
}

// LockManager provides centralized lock management
type LockManager struct {
	client *redis.Client
}

// NewLockManager creates a new lock manager instance
func NewLockManager(client *redis.Client) *LockManager {
	return &LockManager{
		client: client,
	}
}

// NewDistributedLock creates a new distributed lock
func NewDistributedLock(client *redis.Client, resourceID string, ttl time.Duration) *DistributedLock {
	return &DistributedLock{
		client: client,
		key:    fmt.Sprintf("lock:%s", resourceID),
		value:  uuid.New().String(), // Unique token for this lock instance
		ttl:    ttl,
	}
}

// Acquire attempts to acquire the lock with optional timeout
func (lock *DistributedLock) Acquire(ctx context.Context) (bool, error) {
	if lock.client == nil {
		return false, fmt.Errorf("redis client not available")
	}

	// Use SETNX (SET if Not eXists) with TTL for atomic lock acquisition
	success, err := lock.client.SetNX(ctx, lock.key, lock.value, lock.ttl).Result()
	if err != nil {
		return false, fmt.Errorf("failed to acquire lock: %w", err)
	}
	
	lock.acquired = success
	if success {
		log.Printf("AUDIT: Distributed lock acquired for resource %s, token %s, TTL %v", 
			lock.key, lock.value[:8], lock.ttl)
	} else {
		log.Printf("INFO: Lock acquisition failed for resource %s - already held", lock.key)
	}
	
	return success, nil
}

// AcquireWithTimeout attempts to acquire lock with retry logic
func (lock *DistributedLock) AcquireWithTimeout(ctx context.Context, timeout time.Duration) (bool, error) {
	deadline := time.Now().Add(timeout)
	retryInterval := 100 * time.Millisecond
	
	for time.Now().Before(deadline) {
		acquired, err := lock.Acquire(ctx)
		if err != nil {
			return false, err
		}
		if acquired {
			return true, nil
		}
		
		// Wait before retrying
		select {
		case <-ctx.Done():
			return false, ctx.Err()
		case <-time.After(retryInterval):
			// Continue to next iteration
		}
		
		// Exponential backoff up to 1 second
		if retryInterval < time.Second {
			retryInterval = time.Duration(float64(retryInterval) * 1.5)
		}
	}
	
	return false, fmt.Errorf("failed to acquire lock within timeout %v", timeout)
}

// Release releases the lock using Lua script for atomic operation
func (lock *DistributedLock) Release(ctx context.Context) error {
	if lock.client == nil {
		return fmt.Errorf("redis client not available")
	}
	
	if !lock.acquired {
		return nil // Already released or never acquired
	}
	
	// Lua script ensures only the lock owner can release
	// This prevents accidentally releasing someone else's lock
	releaseScript := `
		if redis.call("get", KEYS[1]) == ARGV[1] then
			return redis.call("del", KEYS[1])
		else
			return 0
		end
	`
	
	result, err := lock.client.Eval(ctx, releaseScript, []string{lock.key}, lock.value).Result()
	if err != nil {
		return fmt.Errorf("failed to release lock: %w", err)
	}
	
	if result.(int64) == 1 {
		log.Printf("AUDIT: Distributed lock released for resource %s, token %s", 
			lock.key, lock.value[:8])
		lock.acquired = false
	} else {
		log.Printf("WARNING: Lock release failed - lock not owned by this token: %s (token %s)", 
			lock.key, lock.value[:8])
	}
	
	return nil
}

// Extend extends the lock TTL (useful for long-running operations)
func (lock *DistributedLock) Extend(ctx context.Context, additionalTTL time.Duration) error {
	if lock.client == nil {
		return fmt.Errorf("redis client not available")
	}
	
	if !lock.acquired {
		return fmt.Errorf("cannot extend unacquired lock")
	}
	
	// Lua script ensures only the lock owner can extend TTL
	extendScript := `
		if redis.call("get", KEYS[1]) == ARGV[1] then
			return redis.call("expire", KEYS[1], ARGV[2])
		else
			return 0
		end
	`
	
	result, err := lock.client.Eval(ctx, extendScript, []string{lock.key}, 
		lock.value, int(additionalTTL.Seconds())).Result()
	if err != nil {
		return fmt.Errorf("failed to extend lock: %w", err)
	}
	
	if result.(int64) == 0 {
		lock.acquired = false // Lock was lost
		return fmt.Errorf("lock no longer owned by this token")
	}
	
	log.Printf("AUDIT: Lock extended for resource %s, new TTL %v", lock.key, additionalTTL)
	return nil
}

// IsHeld checks if the lock is currently held by this instance
func (lock *DistributedLock) IsHeld(ctx context.Context) (bool, error) {
	if lock.client == nil || !lock.acquired {
		return false, nil
	}
	
	currentValue, err := lock.client.Get(ctx, lock.key).Result()
	if err == redis.Nil {
		lock.acquired = false
		return false, nil
	} else if err != nil {
		return false, fmt.Errorf("failed to check lock status: %w", err)
	}
	
	isHeld := currentValue == lock.value
	if !isHeld {
		lock.acquired = false
	}
	
	return isHeld, nil
}

// GetTTL returns the remaining TTL of the lock
func (lock *DistributedLock) GetTTL(ctx context.Context) (time.Duration, error) {
	if lock.client == nil {
		return 0, fmt.Errorf("redis client not available")
	}
	
	ttl, err := lock.client.TTL(ctx, lock.key).Result()
	if err != nil {
		return 0, fmt.Errorf("failed to get lock TTL: %w", err)
	}
	
	return ttl, nil
}

// LockManager methods for centralized lock management

// AcquirePDFLock acquires a lock for PDF generation
func (lm *LockManager) AcquirePDFLock(ctx context.Context, responseID string) (*DistributedLock, error) {
	lock := NewDistributedLock(lm.client, fmt.Sprintf("pdf-gen:%s", responseID), 5*time.Minute)
	
	acquired, err := lock.Acquire(ctx)
	if err != nil {
		return nil, err
	}
	
	if !acquired {
		return nil, fmt.Errorf("PDF generation lock already held for response %s", responseID)
	}
	
	return lock, nil
}

// AcquireFormLock acquires a lock for form editing
func (lm *LockManager) AcquireFormLock(ctx context.Context, formID string) (*DistributedLock, error) {
	lock := NewDistributedLock(lm.client, fmt.Sprintf("form-edit:%s", formID), 2*time.Minute)
	
	acquired, err := lock.AcquireWithTimeout(ctx, 5*time.Second) // Wait up to 5 seconds
	if err != nil {
		return nil, err
	}
	
	if !acquired {
		return nil, fmt.Errorf("form editing lock timeout for form %s", formID)
	}
	
	return lock, nil
}

// CleanupExpiredLocks removes expired lock entries (maintenance function)
func (lm *LockManager) CleanupExpiredLocks(ctx context.Context) error {
	if lm.client == nil {
		return fmt.Errorf("redis client not available")
	}
	
	// Find all lock keys
	keys, err := lm.client.Keys(ctx, "lock:*").Result()
	if err != nil {
		return fmt.Errorf("failed to get lock keys: %w", err)
	}
	
	expiredCount := 0
	for _, key := range keys {
		ttl, err := lm.client.TTL(ctx, key).Result()
		if err != nil {
			continue
		}
		
		// Remove keys with no TTL or expired
		if ttl < 0 {
			lm.client.Del(ctx, key)
			expiredCount++
		}
	}
	
	if expiredCount > 0 {
		log.Printf("AUDIT: Cleaned up %d expired locks", expiredCount)
	}
	
	return nil
}

// GetLockStatus returns information about all active locks (for monitoring)
func (lm *LockManager) GetLockStatus(ctx context.Context) (map[string]interface{}, error) {
	if lm.client == nil {
		return nil, fmt.Errorf("redis client not available")
	}
	
	keys, err := lm.client.Keys(ctx, "lock:*").Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get lock keys: %w", err)
	}
	
	lockInfo := make(map[string]interface{})
	activeLocks := make([]map[string]interface{}, 0)
	
	for _, key := range keys {
		ttl, err := lm.client.TTL(ctx, key).Result()
		if err != nil {
			continue
		}
		
		if ttl > 0 {
			activeLocks = append(activeLocks, map[string]interface{}{
				"resource": key,
				"ttl_seconds": int(ttl.Seconds()),
			})
		}
	}
	
	lockInfo["active_locks"] = activeLocks
	lockInfo["total_active"] = len(activeLocks)
	
	return lockInfo, nil
}