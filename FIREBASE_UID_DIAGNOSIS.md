# Firebase UID Organization Mismatch - Diagnosis & Fix

## Problem Summary
Form submissions are succeeding (201 status) but not visible in the dashboard because of organization ID mismatches caused by Firebase account recreation.

## Root Cause
When a Firebase account is deleted and recreated (even with the same email), Firebase Authentication generates a **new UID**. The system uses Firebase UID as the organization ID, but when accounts are recreated:

1. User gets a new Firebase UID
2. Forms created before deletion retain the old organization ID
3. No organization document is created for the new UID
4. Dashboard queries fail because they filter by the new UID

## Evidence
Your account `dtmain@gmail.com` has had **4 different Firebase UIDs**:
- `PDQFNz4mIN5WcUGFfjiJ` - Listed in organizations collection
- `m9SxkIbKOMWbxwmNFFVu38dos923` - Has old forms
- `8Ng9JR1aMbhXezBt9a7Wy3YgS5G3` - Has forms, but NO organization document
- `b7vcMggxZFbzJT8x8X76TZ7q3CO2` - Current UID after recreation, had NO organization document

## Immediate Fix (Completed)
Created the missing organization document for `b7vcMggxZFbzJT8x8X76TZ7q3CO2` in Firestore.

## Permanent Solution Required
Update the backend authentication middleware to automatically create an organization document on first login:

```go
// In backend-go/internal/api/middleware.go
func AuthMiddleware(authClient *auth.Client, firestoreClient *firestore.Client) gin.HandlerFunc {
    return func(c *gin.Context) {
        // ... verify token ...
        
        // Auto-create organization if it doesn't exist
        ctx := c.Request.Context()
        orgDoc := firestoreClient.Collection("organizations").Doc(token.UID)
        
        _, err := orgDoc.Get(ctx)
        if err != nil {
            // Organization doesn't exist, create it
            email := ""
            if emailClaim, ok := token.Claims["email"].(string); ok {
                email = emailClaim
            }
            
            orgData := map[string]interface{}{
                "name": "Organization",
                "email": email,
                "uid": token.UID,
                "createdAt": time.Now(),
                "updatedAt": time.Now(),
            }
            
            _, err = orgDoc.Set(ctx, orgData)
            if err != nil {
                log.Printf("Failed to create organization: %v", err)
            }
        }
        
        c.Set("userID", token.UID)
        c.Set("organizationID", token.UID)
        c.Next()
    }
}
```

## Deployment Steps
1. Update `backend-go/internal/api/middleware.go` with auto-creation logic
2. Update `cmd/server/main.go` to pass firestore client to middleware
3. Build and deploy to Cloud Run
4. Test with a new Firebase account to verify auto-creation

## Data Cleanup (Optional)
Consolidate orphaned forms from old UIDs to current UID if needed.

## Architecture Note
System correctly implements Single-User Multi-Tenant model (1 Email = 1 UID = 1 Organization), but needs organization auto-creation on first login to handle Firebase account recreation scenarios.