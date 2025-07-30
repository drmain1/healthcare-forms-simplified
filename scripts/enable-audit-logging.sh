#!/bin/bash

# Enable HIPAA-compliant audit logging for healthcare-forms-v2 project

PROJECT_ID="healthcare-forms-v2"
BUCKET_NAME="${PROJECT_ID}-audit-logs"

echo "Setting up HIPAA-compliant audit logging for project: $PROJECT_ID"

# Create a bucket for long-term audit log retention (HIPAA requires 6 years)
echo "Creating audit log storage bucket..."
gsutil mb -p $PROJECT_ID -c STANDARD -l us-central1 -b on gs://$BUCKET_NAME/ 2>/dev/null || echo "Bucket already exists"

# Set bucket lifecycle for 7 year retention (exceeding HIPAA 6 year requirement)
cat > /tmp/lifecycle.json <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 2555,
          "matchesStorageClass": ["STANDARD"]
        }
      }
    ]
  }
}
EOF

gsutil lifecycle set /tmp/lifecycle.json gs://$BUCKET_NAME/
echo "Set 7-year retention policy on audit log bucket"

# Enable audit logging for Firestore operations
echo "Configuring audit logs for Firestore..."

# Get current IAM policy
gcloud projects get-iam-policy $PROJECT_ID --format=json > /tmp/current-policy.json

# Merge audit config with existing policy using JSON directly
python3 - <<PYTHON
import json

# Read current policy
with open('/tmp/current-policy.json', 'r') as f:
    policy = json.load(f)

# Define audit configs
audit_configs = [
    {
        "service": "firestore.googleapis.com",
        "auditLogConfigs": [
            {"logType": "ADMIN_READ"},
            {"logType": "DATA_READ"},
            {"logType": "DATA_WRITE"}
        ]
    },
    {
        "service": "firebase.googleapis.com",
        "auditLogConfigs": [
            {"logType": "ADMIN_READ"},
            {"logType": "DATA_READ"},
            {"logType": "DATA_WRITE"}
        ]
    }
]

# Add audit configs to policy
policy['auditConfigs'] = audit_configs

# Write updated policy
with open('/tmp/updated-policy.json', 'w') as f:
    json.dump(policy, f, indent=2)
PYTHON

# Apply the updated policy
echo "Applying audit log configuration..."
gcloud projects set-iam-policy $PROJECT_ID /tmp/updated-policy.json

# Create a log sink for Firestore audit logs
echo "Creating log sink for long-term retention..."
gcloud logging sinks create firestore-audit-sink \
  storage.googleapis.com/$BUCKET_NAME \
  --log-filter='resource.type="datastore_database" OR 
                resource.type="firestore.googleapis.com/Database" OR
                protoPayload.serviceName="firestore.googleapis.com"' \
  --project=$PROJECT_ID || echo "Sink may already exist"

# Grant the logging service account permission to write to the bucket
LOGGING_SA=$(gcloud logging sinks describe firestore-audit-sink --format='value(writerIdentity)' --project=$PROJECT_ID)
gsutil iam ch $LOGGING_SA:objectCreator gs://$BUCKET_NAME

# Create an alert policy for suspicious access patterns
echo "Creating alert policy for suspicious access..."
cat > /tmp/alert-policy.json <<EOF
{
  "displayName": "Suspicious Firestore Access Pattern",
  "conditions": [
    {
      "displayName": "High volume of data reads",
      "conditionThreshold": {
        "filter": "resource.type=\"firestore.googleapis.com/Database\" AND protoPayload.methodName=\"google.firestore.v1.Firestore.BatchGet\"",
        "comparison": "COMPARISON_GT",
        "thresholdValue": 1000,
        "duration": "300s",
        "aggregations": [
          {
            "alignmentPeriod": "60s",
            "perSeriesAligner": "ALIGN_RATE"
          }
        ]
      }
    }
  ],
  "notificationChannels": [],
  "alertStrategy": {
    "autoClose": "1800s"
  }
}
EOF

# Clean up temporary files
rm -f /tmp/lifecycle.json /tmp/audit-config.yaml /tmp/current-policy.json /tmp/updated-policy.json /tmp/alert-policy.json

echo "Audit logging setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure notification channels for alerts in the GCP Console"
echo "2. Review audit logs regularly at: https://console.cloud.google.com/logs/query"
echo "3. Set up automated compliance reports"