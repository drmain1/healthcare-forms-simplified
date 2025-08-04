# Critical Bug: Organization ID Mismatch

## The Problem
**You have ONE account but TWO different organization IDs are being used**

## Evidence
When you log in with your single testing account:
- **Your Firebase UID**: `PDQFNz4mIN5WcUGFfjiJ` 
- **Forms are saved with**: `m9SxkIbKOMWbxwmNFFVu38dos923`
- **Both claim to be**: The same user (you!)

## What's Happening

```
Your Login Flow:
dtmain@gmail.com → Firebase Auth → UID: PDQFNz4mIN5WcUGFfjiJ
                                    ↓
                           This becomes your Org ID
                                    ↓
                           Dashboard queries this Org ID
                                    ↓
                           Finds NO forms (they're in different org!)

Your Forms:
Created with Org ID: m9SxkIbKOMWbxwmNFFVu38dos923
```

## Root Cause Analysis

### Current Code (backend-go/internal/api/middleware.go):
```go
// Line 35-36: Sets organization ID = Firebase UID
c.Set("userID", token.UID)
c.Set("organizationID", token.UID)  // This is correct!
```

### The Bug Source - One of These:

1. **Firebase UID Changed**: Your account's Firebase UID changed (shouldn't happen normally)
   - Old UID: `m9SxkIbKOMWbxwmNFFVu38dos923`
   - New UID: `PDQFNz4mIN5WcUGFfjiJ`

2. **Forms Created Differently**: The forms were created:
   - Through a different authentication flow
   - With hardcoded organization IDs
   - Before the current auth system was implemented

3. **Multiple Firebase Projects**: Different Firebase project configs between:
   - When forms were created
   - Current authentication

## Immediate Fix

### Option 1: Update All Forms to Your Current UID
```javascript
// Update all forms from old org to new org
db.collection('forms')
  .where('organizationId', '==', 'm9SxkIbKOMWbxwmNFFVu38dos923')
  .get()
  .then(snapshot => {
    snapshot.forEach(doc => {
      doc.ref.update({ organizationId: 'PDQFNz4mIN5WcUGFfjiJ' })
    })
  })

// Same for responses
db.collection('form_responses')
  .where('organization', '==', 'm9SxkIbKOMWbxwmNFFVu38dos923')
  .get()
  .then(snapshot => {
    snapshot.forEach(doc => {
      doc.ref.update({ organization: 'PDQFNz4mIN5WcUGFfjiJ' })
    })
  })
```

### Option 2: Force Your UID to Match Existing Data
In the AuthMiddleware, temporarily hardcode for your account:
```go
if token.UID == "PDQFNz4mIN5WcUGFfjiJ" {
    // Map to the org that has your forms
    c.Set("organizationID", "m9SxkIbKOMWbxwmNFFVu38dos923")
} else {
    c.Set("organizationID", token.UID)
}
```

## Long-Term Solution

### Add Organization Lookup/Creation on First Login
```go
func AuthMiddleware(authClient *auth.Client, firestoreClient *firestore.Client) gin.HandlerFunc {
    return func(c *gin.Context) {
        // ... verify token ...
        
        // Check if organization exists for this email
        email := token.Claims["email"].(string)
        
        // Try to find existing org by email
        iter := firestoreClient.Collection("organizations").
            Where("email", "==", email).
            Limit(1).
            Documents(c.Request.Context())
        
        doc, err := iter.Next()
        if err == iterator.Done {
            // No org exists, create one with UID as ID
            orgID := token.UID
            createOrganization(orgID, email)
        } else {
            // Use existing org ID (handles UID changes)
            orgID := doc.Ref.ID
        }
        
        c.Set("organizationID", orgID)
        c.Set("userID", token.UID)
    }
}
```

## Why This Happened

In a true **Single-User Tenant Model** (1 Email = 1 User = 1 Org), the Firebase UID should NEVER change for the same email. The fact that you have two different organization IDs for one account indicates either:

1. **Development/Testing Artifact**: Forms were created during development with test IDs
2. **Firebase Project Switch**: The Firebase project configuration changed
3. **Account Recreation**: The Firebase account was deleted and recreated

## The Real Fix

Since you're the only user currently, the simplest fix is to:
1. Pick which organization ID to keep
2. Update all data to use that single ID
3. Ensure future logins use the same ID

This is a **data consistency issue**, not a code bug - the code is correctly using Firebase UID as the organization ID.