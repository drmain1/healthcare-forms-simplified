# Firestore Database Documentation

## Overview
This document provides comprehensive documentation for the Firestore database structure, security rules, and operational details for the Healthcare Forms Platform. The system uses a single-user tenant model where each organization has exactly one user account.

## Database Configuration

### Project Details
- **Project ID**: `healthcare-forms-v2`
- **Database Name**: `(default)`
- **Location**: `us-central1`
- **Type**: `FIRESTORE_NATIVE`
- **Edition**: `STANDARD`
- **Concurrency Mode**: `PESSIMISTIC`
- **Point-in-Time Recovery**: `ENABLED` (7 days retention)
- **Encryption**: Google-managed encryption at rest
- **Transport Security**: TLS 1.2+ enforced

### Key Features
- Multi-tenant data isolation (single-user per tenant)
- HIPAA-compliant configuration
- Automatic audit logging
- 7-year data retention for compliance
- Immutable audit trails

## Data Model

### Core Principle: Single-User Tenant Model
- Each organization has exactly ONE user
- Organization ID = User's Firebase UID
- No role hierarchy or user management within organizations
- Complete data isolation between tenants

## Collections Structure

### 1. `organizations`
Stores tenant/organization information. Document ID matches the user's Firebase UID.

```go
type Organization struct {
	ID        string               `json:"_id,omitempty" firestore:"_id,omitempty"`
	UID       string               `json:"uid" firestore:"uid"`
	Name      string               `json:"name" firestore:"name"`
	Email     string               `json:"email,omitempty" firestore:"email,omitempty"`
	Phone     string               `json:"phone,omitempty" firestore:"phone,omitempty"`
	Address   string               `json:"address,omitempty" firestore:"address,omitempty"`
	Settings  OrganizationSettings `json:"settings" firestore:"settings"`
	CreatedAt time.Time            `json:"created_at" firestore:"created_at"`
	UpdatedAt time.Time            `json:"updated_at" firestore:"updated_at"`
}

// OrganizationSettings represents the settings for an organization
type OrganizationSettings struct {
	HIPAACompliant      bool `json:"hipaa_compliant" firestore:"hipaa_compliant"`
	DataRetentionDays int  `json:"data_retention_days" firestore:"data_retention_days"`
	Timezone          string `json:"timezone" firestore:"timezone"`
}
```

**Access Pattern**: Users can only access their own organization document where document ID equals their UID.

### 2. `forms`
Stores form definitions created by each tenant.

```go
type Form struct {
	ID             string                 `json:"_id" firestore:"_id"`
	Title          string                 `json:"title" firestore:"title"`
	Description    string                 `json:"description,omitempty" firestore:"description,omitempty"`
	SurveyJSON     map[string]interface{} `json:"surveyJson" firestore:"surveyJson"`
	CreatedAt      time.Time              `json:"createdAt" firestore:"createdAt"`
	UpdatedAt      time.Time              `json:"updatedAt" firestore:"updatedAt"`
	CreatedBy      string                 `json:"createdBy" firestore:"createdBy"`
	UpdatedBy      string                 `json:"updatedBy" firestore:"updatedBy"`
	OrganizationID string                 `json:"organizationId" firestore:"organizationId"`
	Category       string                 `json:"category,omitempty" firestore:"category,omitempty"`
	Tags           []string               `json:"tags,omitempty" firestore:"tags,omitempty"`
	IsTemplate     bool                   `json:"isTemplate" firestore:"isTemplate"`
	Version        int                    `json:"version" firestore:"version"`
}
```

**Access Pattern**: Users can only access forms where `organization_id` equals their UID.

### 3. `form_responses`
Stores submitted form responses with PHI data.

```go
type FormResponse struct {
	ID                      string                 `json:"id,omitempty" firestore:"id,omitempty"`
	OrganizationID          string                 `json:"organization" firestore:"organization"`
	FormID                  string                 `json:"form" firestore:"form"`
	Data                    map[string]interface{} `json:"response_data" firestore:"data"`
	Metadata                map[string]interface{} `json:"metadata,omitempty" firestore:"metadata,omitempty"`
	SubmittedBy             string                 `json:"submitted_by" firestore:"submitted_by"`
	SubmittedAt             time.Time              `json:"submitted_at" firestore:"submitted_at"`
	FormTitle               string                 `json:"form_title,omitempty" firestore:"form_title,omitempty"`
	PatientName             string                 `json:"patient_name,omitempty" firestore:"patient_name,omitempty"`
	Status                  string                 `json:"status,omitempty" firestore:"status,omitempty"`
	StartedAt               *time.Time             `json:"started_at,omitempty" firestore:"started_at,omitempty"`
	CompletionTimeSeconds   *float64               `json:"completion_time_seconds,omitempty" firestore:"completion_time_seconds,omitempty"`
	Reviewed                bool                   `json:"reviewed,omitempty" firestore:"reviewed,omitempty"`
	ReviewedBy              string                 `json:"reviewed_by,omitempty" firestore:"reviewed_by,omitempty"`
	ReviewedAt              *time.Time             `json:"reviewed_at,omitempty" firestore:"reviewed_at,omitempty"`
	ReviewNotes             string                 `json:"review_notes,omitempty" firestore:"review_notes,omitempty"`
	UserAgent               string                 `json:"user_agent,omitempty" firestore:"user_agent,omitempty"`
	IPAddress               string                 `json:"ip_address,omitempty" firestore:"ip_address,omitempty"`
	SessionID               string                 `json:"session_id,omitempty" firestore:"session_id,omitempty"`
}
```

**Important**: Responses are immutable once created (no updates allowed) to maintain audit trail integrity.

### 4. `form_templates`
Stores reusable form templates for each organization.

```go
type Form struct {
	ID             string                 `json:"_id" firestore:"_id"`
	Title          string                 `json:"title" firestore:"title"`
	Description    string                 `json:"description,omitempty" firestore:"description,omitempty"`
	SurveyJSON     map[string]interface{} `json:"surveyJson" firestore:"surveyJson"`
	CreatedAt      time.Time              `json:"createdAt" firestore:"createdAt"`
	UpdatedAt      time.Time              `json:"updatedAt" firestore:"updatedAt"`
	CreatedBy      string                 `json:"createdBy" firestore:"createdBy"`
	UpdatedBy      string                 `json:"updatedBy" firestore:"updatedBy"`
	OrganizationID string                 `json:"organizationId" firestore:"organizationId"`
	Category       string                 `json:"category,omitempty" firestore:"category,omitempty"`
	Tags           []string               `json:"tags,omitempty" firestore:"tags,omitempty"`
	IsTemplate     bool                   `json:"isTemplate" firestore:"isTemplate"`
	Version        int                    `json:"version" firestore:"version"`
}
```

### 5. `audit_logs`
System-generated audit logs for HIPAA compliance. Write-only from backend.

```javascript
{
  // Document ID: Auto-generated
  organization_id: string,  // Organization affected
  user_id: string,         // User who performed action
  action: string,          // Action performed (e.g., "form.create", "response.view")
  resource_type: string,   // Type of resource (e.g., "form", "response")
  resource_id: string,     // ID of affected resource
  details: {               // Additional action details
    // Dynamic based on action type
  },
  ip_address: string,      // Client IP address
  user_agent: string,      // Client user agent
  timestamp: timestamp     // When action occurred
}
```

**Note**: Only backend services can write to this collection. Users can read their own audit logs.

## Security Rules

### Complete Rules File
Location: `/firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null && request.auth.uid != null;
    }
    
    // Helper function to check if user owns the organization (single-user model)
    function isOrganizationOwner(orgId) {
      return isAuthenticated() && request.auth.uid == orgId;
    }
    
    // Helper function to validate PHI fields are not exposed inappropriately
    function validatePHIAccess() {
      return isAuthenticated();
    }
    
    // Organizations collection - each org ID matches the user's UID
    match /organizations/{orgId} {
      allow read: if isOrganizationOwner(orgId);
      allow update: if isOrganizationOwner(orgId) &&
        (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['created_at', 'uid']));
      allow create: if isAuthenticated() && request.auth.uid == orgId &&
        request.resource.data.keys().hasAll(['name', 'created_at', 'uid']) &&
        request.resource.data.uid == request.auth.uid &&
        request.resource.data.created_at == request.time;
      allow delete: if false;
    }
    
    // Forms collection - single-user tenant isolation
    match /forms/{formId} {
      allow read: if isOrganizationOwner(resource.data.organization_id);
      allow create: if isAuthenticated() &&
        request.resource.data.organization_id == request.auth.uid &&
        request.resource.data.keys().hasAll(['organization_id', 'created_by', 'created_at', 'name', 'definition']) &&
        request.resource.data.created_by == request.auth.uid &&
        request.resource.data.created_at == request.time;
      allow update: if isOrganizationOwner(resource.data.organization_id) &&
        request.resource.data.organization_id == resource.data.organization_id &&
        request.resource.data.keys().hasAll(['updated_by', 'updated_at']) &&
        request.resource.data.updated_by == request.auth.uid &&
        request.resource.data.updated_at == request.time;
      allow delete: if isOrganizationOwner(resource.data.organization_id);
    }
    
    // Form responses collection - strict PHI protection
    match /form_responses/{responseId} {
      allow read: if isOrganizationOwner(resource.data.organization_id) && validatePHIAccess();
      allow create: if isAuthenticated() &&
        request.resource.data.organization_id == request.auth.uid &&
        request.resource.data.keys().hasAll(['organization_id', 'form_id', 'submitted_by', 'submitted_at', 'data']) &&
        request.resource.data.submitted_by == request.auth.uid &&
        request.resource.data.submitted_at == request.time &&
        exists(/databases/$(database)/documents/forms/$(request.resource.data.form_id)) &&
        get(/databases/$(database)/documents/forms/$(request.resource.data.form_id)).data.organization_id == request.auth.uid;
      allow update: if false; // Responses are immutable
      allow delete: if isOrganizationOwner(resource.data.organization_id);
    }
    
    // Form templates collection
    match /form_templates/{templateId} {
      allow read: if isOrganizationOwner(resource.data.organization_id);
      allow create: if isAuthenticated() &&
        request.resource.data.organization_id == request.auth.uid;
      allow update: if isOrganizationOwner(resource.data.organization_id);
      allow delete: if isOrganizationOwner(resource.data.organization_id);
    }
    
    // Audit logs collection - write-only for system
    match /audit_logs/{logId} {
      allow read: if isOrganizationOwner(resource.data.organization_id);
      allow write: if false; // Only backend can write
    }
    
    // Default deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Indexes

### Configured Indexes
Location: `/firestore.indexes.json`

1. **Forms by Organization and Date**
   - Collection: `forms`
   - Fields: `organization_id` (ASC), `created_at` (DESC)
   - Use: List forms for a tenant, newest first

2. **Forms by Organization and Name**
   - Collection: `forms`
   - Fields: `organization_id` (ASC), `name` (ASC)
   - Use: Search forms by name within tenant

3. **Active Forms by Organization**
   - Collection: `forms`
   - Fields: `organization_id` (ASC), `is_active` (ASC), `created_at` (DESC)
   - Use: List only active forms

4. **Responses by Form**
   - Collection: `form_responses`
   - Fields: `organization_id` (ASC), `form_id` (ASC), `submitted_at` (DESC)
   - Use: List responses for a specific form

5. **Responses by User**
   - Collection: `form_responses`
   - Fields: `organization_id` (ASC), `submitted_by` (ASC), `submitted_at` (DESC)
   - Use: List all responses by a user

6. **Audit Logs by Organization**
   - Collection: `audit_logs`
   - Fields: `organization_id` (ASC), `timestamp` (DESC)
   - Use: View audit trail for organization

7. **Audit Logs by User**
   - Collection: `audit_logs`
   - Fields: `organization_id` (ASC), `user_id` (ASC), `timestamp` (DESC)
   - Use: Track specific user actions

8. **Audit Logs by Action**
   - Collection: `audit_logs`
   - Fields: `organization_id` (ASC), `action` (ASC), `timestamp` (DESC)
   - Use: Filter by action type

## Backend API Integration

### Key Implementation Details

1. **Authentication Flow**
   ```go
   // User authenticates with Firebase Auth
   // Backend receives Firebase ID token in Authorization: Bearer <token> header
   // Token is verified using Firebase Admin SDK
   // User UID is extracted from token and set in Gin context as "userID" and "organizationID"
   // All subsequent operations retrieve UID/organizationID from Gin context
   ```

2. **Organization Auto-Creation**
   ```python
   # When user first accesses system:
   if not organization_exists(user_uid):
       create_organization(
           id=user_uid,
           uid=user_uid,
           name=user_email,
           settings=default_hipaa_settings
       )
   ```

3. **Data Access Pattern**
   ```python
   # All queries filter by organization_id
   forms = db.collection('forms').where('organization_id', '==', user_uid)
   # User can only see their own data
   ```

## Audit Logging

### What is Logged
- All form CRUD operations
- All response submissions and views
- Organization setting changes
- Authentication events
- Data export operations

### Log Retention
- Firestore audit logs: 7 years (Cloud Storage bucket)
- Application audit logs: 7 years (in Firestore)
- Cloud Audit Logs: 7 years (GCP logging)

### Audit Log Bucket
- Name: `healthcare-forms-v2-audit-logs`
- Location: `us-central1`
- Retention: 7 years (automated lifecycle policy)
- Access: Write-only for logging service

## Debugging Guide

### Common Issues and Solutions

1. **"Permission Denied" Errors**
   - Check: Is organization document created?
   - Check: Does organization_id match user's UID?
   - Check: Are all required fields present in request?

2. **Forms Not Saving**
   - Verify: Organization exists with ID = user UID
   - Verify: All required fields (created_at, created_by, etc.)
   - Check: Firebase rules deployment status

3. **Can't Read Forms**
   - Ensure: organization_id field exists and equals user UID
   - Check: User is authenticated with valid token

4. **Missing Audit Logs**
   - Verify: Logging sink is configured
   - Check: Service account has bucket write permissions
   - Ensure: Backend is creating audit entries

### Useful Queries

**Check if user has organization:**
```javascript
db.collection('organizations').doc(userId).get()
```

**List user's forms:**
```javascript
db.collection('forms')
  .where('organization_id', '==', userId)
  .orderBy('created_at', 'desc')
  .get()
```

**Count user's responses:**
```javascript
db.collection('form_responses')
  .where('organization_id', '==', userId)
  .count()
  .get()
```

**View recent audit logs:**
```javascript
db.collection('audit_logs')
  .where('organization_id', '==', userId)
  .orderBy('timestamp', 'desc')
  .limit(100)
  .get()
```

## Maintenance Operations

### Backup Strategy
1. **Point-in-Time Recovery**: 7 days automatic
2. **Export Schedule**: Daily exports recommended
3. **Export Command**:
   ```bash
   gcloud firestore export gs://backup-bucket/$(date +%Y%m%d)
   ```

### Index Management
- Indexes are automatically created on deployment
- Monitor index usage in Firebase Console
- Add new indexes to `firestore.indexes.json`

### Security Rule Updates
1. Edit `/firestore.rules`
2. Test with emulator: `firebase emulators:start`
3. Deploy: `firebase deploy --only firestore:rules`

### Performance Monitoring
- Use Firebase Performance Monitoring
- Monitor query execution time
- Watch for missing index warnings
- Set up alerts for slow queries

## Compliance Notes

### HIPAA Requirements Met
- ✅ Access controls (authentication required)
- ✅ Audit logging (comprehensive)
- ✅ Encryption (at rest and in transit)
- ✅ Data integrity (immutable responses)
- ✅ Backup and recovery (PITR enabled)
- ✅ Minimum necessary access (tenant isolation)

### Additional Requirements
- Business Associate Agreement (BAA) with Google
- Regular security assessments
- Employee training documentation
- Incident response procedures
- Breach notification process

## Emergency Procedures

### Data Recovery
1. **From PITR**: Restore to any point within 7 days
2. **From Exports**: Restore from daily backups
3. **Contact**: Google Cloud Support for assistance

### Security Incident
1. Immediately disable affected user accounts
2. Review audit logs for unauthorized access
3. Document all findings
4. Follow breach notification procedures if PHI exposed

### System Outage
1. Check GCP status page
2. Verify Firebase Auth is operational
3. Test Firestore connectivity
4. Review error logs in Cloud Logging

## Contact Information
- **GCP Project ID**: healthcare-forms-v2
- **Firebase Console**: https://console.firebase.google.com/project/healthcare-forms-v2
- **GCP Console**: https://console.cloud.google.com/home/dashboard?project=healthcare-forms-v2
- **Support**: File issues through GCP Support Console