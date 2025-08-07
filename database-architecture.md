# Healthcare Forms Database Architecture

## Multi-Tenant NoSQL Structure (Firestore)

```mermaid
graph TB
    subgraph "Firebase Project: healthcare-forms-v2"
        subgraph "Firestore Collections"
            
            %% Organizations Collection
            subgraph "organizations/"
                ORG1["📁 org-{userUID}<br/>━━━━━━━━━━━━━━━━<br/>• uid: 'b7vcMggxZF...'<br/>• name: 'Personal Clinic'<br/>• email: 'doctor@clinic.com'<br/>• settings: {...}<br/>• clinic_info: {<br/>  - clinic_name<br/>  - address_line1<br/>  - city, state, zip<br/>  - phone, fax<br/>  - logo_url<br/>  - primary_color<br/>}<br/>• created_at<br/>• updated_at"]
            end
            
            %% Forms Collection
            subgraph "forms/"
                FORM1["📄 {formId}<br/>━━━━━━━━━━━━━━━━<br/>• organizationId: 'b7vcMggxZF...'<br/>• title: 'Patient Intake'<br/>• description: '...'<br/>• surveyJson: {SurveyJS schema}<br/>• isPublic: false<br/>• shareLinks: []<br/>• tags: ['medical', 'intake']<br/>• created_at<br/>• updated_at"]
            end
            
            %% Form Responses Collection
            subgraph "form_responses/"
                RESP1["📝 {responseId}<br/>━━━━━━━━━━━━━━━━<br/>• organizationId: 'b7vcMggxZF...'<br/>• formId: 'form123'<br/>• data: {encrypted answers}<br/>• patientName: 'John Doe'<br/>• status: 'completed'<br/>• isReviewed: false<br/>• submittedAt<br/>• signature: 'data:image/png...'"]
            end
            
            %% Form Templates Collection
            subgraph "form_templates/"
                TEMP1["📋 {templateId}<br/>━━━━━━━━━━━━━━━━<br/>• organizationId: 'b7vcMggxZF...'<br/>• name: 'COVID Screening'<br/>• category: 'screening'<br/>• surveyJson: {template}<br/>• isGlobal: false<br/>• created_at"]
            end
            
            %% Share Links Collection
            subgraph "share_links/"
                LINK1["🔗 {linkId}<br/>━━━━━━━━━━━━━━━━<br/>• formId: 'form123'<br/>• organizationId: 'b7vcMggxZF...'<br/>• token: 'abc123xyz'<br/>• expiresAt: timestamp<br/>• maxResponses: 100<br/>• responseCount: 15<br/>• isActive: true"]
            end
        end
    end
    
    %% Relationships
    ORG1 -.->|owns| FORM1
    ORG1 -.->|owns| RESP1
    ORG1 -.->|owns| TEMP1
    FORM1 -.->|generates| RESP1
    FORM1 -.->|has| LINK1
    TEMP1 -.->|creates| FORM1
```

## Multi-Tenancy Model

```mermaid
graph LR
    subgraph "Authentication Layer"
        USER1[User: doctor@clinic.com<br/>UID: b7vcMggxZF...]
        USER2[User: nurse@hospital.org<br/>UID: x8Y9kLmN3P...]
    end
    
    subgraph "Organization Isolation"
        subgraph "Tenant 1"
            ORG1[Organization<br/>org-b7vcMggxZF...]
            F1[Forms]
            R1[Responses]
            T1[Templates]
        end
        
        subgraph "Tenant 2"
            ORG2[Organization<br/>org-x8Y9kLmN3P...]
            F2[Forms]
            R2[Responses]
            T2[Templates]
        end
    end
    
    USER1 -->|Firebase Auth| ORG1
    USER2 -->|Firebase Auth| ORG2
    
    ORG1 --> F1
    ORG1 --> R1
    ORG1 --> T1
    
    ORG2 --> F2
    ORG2 --> R2
    ORG2 --> T2
    
    style ORG1 fill:#e1f5fe
    style ORG2 fill:#fff3e0
```

## Data Flow for PDF Generation

```mermaid
sequenceDiagram
    participant UI as Frontend
    participant Auth as Firebase Auth
    participant API as Go Backend
    participant FS as Firestore
    participant AI as Vertex AI
    participant PDF as Gotenberg
    
    UI->>Auth: Get ID Token
    Auth-->>UI: ID Token
    
    UI->>API: GET /responses/{id}/generate-pdf<br/>(Bearer: ID Token)
    
    API->>API: Verify Token & Extract UID
    API->>API: Set organizationId = org-{UID}
    
    API->>FS: Get form_responses/{responseId}
    FS-->>API: Response Data
    
    API->>FS: Get forms/{formId}
    FS-->>API: Form Schema (SurveyJS)
    
    API->>FS: Get organizations/org-{UID}
    FS-->>API: Organization & clinic_info
    
    API->>AI: Generate HTML with:<br/>- Processed form data<br/>- Clinic header info
    AI-->>API: Professional HTML
    
    API->>PDF: Convert HTML to PDF
    PDF-->>API: PDF Binary
    
    API-->>UI: PDF File
```

## Security & Isolation Rules

```yaml
Firestore Security Rules:
━━━━━━━━━━━━━━━━━━━━━━━━
organizations/{orgId}:
  - Read: if orgId == 'org-' + auth.uid
  - Write: if orgId == 'org-' + auth.uid

forms/{formId}:
  - Read: if resource.organizationId == auth.uid
  - Write: if request.resource.organizationId == auth.uid
  - Public Read: if resource.isPublic == true

form_responses/{responseId}:
  - Read: if resource.organizationId == auth.uid
  - Write: if request.resource.organizationId == auth.uid
  - Public Write: if via valid share_link token

share_links/{linkId}:
  - Read: if resource.organizationId == auth.uid
  - Write: if request.resource.organizationId == auth.uid
```

## Key Design Principles

### 1. Single-Tenant Per User Model
- Each user IS their own organization (`org-{userUID}`)
- Complete data isolation at the user level
- No cross-tenant data access possible

### 2. Document Structure
- **Flat collections** (no deep nesting)
- **organizationId** field on every document for filtering
- **Denormalized data** for read performance

### 3. Client-Side Encryption
- PHI data encrypted before storage
- Encryption keys stored in browser session only
- Automatic cleanup on navigation/timeout

### 4. Backend Validation
```go
// Every authenticated request:
1. Extract UID from Firebase token
2. Set organizationId = "org-" + UID  
3. Filter ALL queries by organizationId
4. Validate ownership before mutations
```

### 5. Collection Naming Convention
- `form_responses` (not `responses`) - production collection
- Lowercase with underscores
- Plural names for collections
- Document IDs are auto-generated UUIDs

## Data Lifecycle

```mermaid
stateDiagram-v2
    [*] --> UserSignUp: Google Auth
    UserSignUp --> OrgCreation: Automatic
    OrgCreation --> FormCreation: Create Forms
    FormCreation --> ShareLink: Generate Public Link
    ShareLink --> ResponseCollection: Patients Submit
    ResponseCollection --> DataProcessing: Process & Review
    DataProcessing --> PDFGeneration: Generate Report
    PDFGeneration --> [*]: Complete
    
    note right of OrgCreation
        org-{userUID} created
        with default clinic_info
    end note
    
    note right of ResponseCollection
        Data encrypted client-side
        Stored with organizationId
    end note
    
    note right of PDFGeneration
        Includes clinic header
        from organization settings
    end note
```

## Migration Path (FastAPI → Go)
- Same Firestore structure maintained
- Collection names unchanged
- Document schemas preserved
- Only backend implementation changed

This architecture ensures:
- **HIPAA Compliance** through encryption and isolation
- **Scalability** through NoSQL document model
- **Multi-tenancy** through UID-based isolation
- **Simplicity** through single-tenant-per-user model