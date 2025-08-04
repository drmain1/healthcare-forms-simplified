package data

import "time"

// Form represents the main SurveyJS JSON structure
type Form struct {
	ID             string                 `json:"id" firestore:"_id"`
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

// FormResponse represents a single submission of a form
type FormResponse struct {
	ID                      string                 `json:"id,omitempty" firestore:"id,omitempty"`
	OrganizationID          string                 `json:"organizationId" firestore:"organizationId"`
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

// OrganizationSettings represents the settings for an organization
type OrganizationSettings struct {
	HIPAACompliant      bool `json:"hipaa_compliant" firestore:"hipaa_compliant"`
	DataRetentionDays int  `json:"data_retention_days" firestore:"data_retention_days"`
	Timezone          string `json:"timezone" firestore:"timezone"`
}

// Organization represents a single organization
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

// ShareLink represents a shareable link for a form
type ShareLink struct {
	ID             string    `json:"_id,omitempty" firestore:"_id,omitempty"`
	FormID         string    `json:"form_id" firestore:"form_id"`
	ShareToken     string    `json:"share_token" firestore:"share_token"`
	ExpiresAt      time.Time `json:"expires_at,omitempty" firestore:"expires_at,omitempty"`
	MaxResponses   int       `json:"max_responses,omitempty" firestore:"max_responses,omitempty"`
	IsActive       bool      `json:"is_active" firestore:"is_active"`
	ResponseCount  int       `json:"response_count" firestore:"response_count"`
	OrganizationID string    `json:"organizationId" firestore:"organizationId"`
	CreatedBy      string    `json:"created_by" firestore:"created_by"`
	CreatedAt      time.Time `json:"created_at" firestore:"created_at"`
	PasswordHash   string    `json:"-" firestore:"password_hash,omitempty"`
}

