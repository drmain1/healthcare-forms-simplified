package services

import (
	"context"
	"cloud.google.com/go/logging"
	"time"
)

type CloudAuditLogger struct {
	client *logging.Client
	logger *logging.Logger
}

type AuditEntry struct {
	Timestamp    time.Time              `json:"timestamp"`
	UserID       string                 `json:"user_id"`
	UserEmail    string                 `json:"user_email,omitempty"`
	Action       string                 `json:"action"`
	ResourceType string                 `json:"resource_type"`
	ResourceID   string                 `json:"resource_id"`
	IPAddress    string                 `json:"ip_address"`
	UserAgent    string                 `json:"user_agent"`
	Success      bool                   `json:"success"`
	ErrorMsg     string                 `json:"error,omitempty"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
}

func NewCloudAuditLogger(projectID string) (*CloudAuditLogger, error) {
	ctx := context.Background()
	client, err := logging.NewClient(ctx, projectID)
	if err != nil {
		return nil, err
	}
	
	// Create dedicated HIPAA audit logger
	logger := client.Logger("hipaa-audit-log")
	
	return &CloudAuditLogger{
		client: client,
		logger: logger,
	}, nil
}

func (cal *CloudAuditLogger) LogAccess(ctx context.Context, entry AuditEntry) {
	severity := logging.Info
	if !entry.Success {
		severity = logging.Warning
	}
	
	cal.logger.Log(logging.Entry{
		Severity:  severity,
		Timestamp: entry.Timestamp,
		Payload:   entry,
		Labels: map[string]string{
			"user_id": entry.UserID,
			"action":  entry.Action,
			"resource": entry.ResourceType,
		},
	})
}

func (cal *CloudAuditLogger) Close() error {
	return cal.client.Close()
}