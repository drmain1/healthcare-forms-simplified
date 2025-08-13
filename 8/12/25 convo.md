
⏺ The issue with the relative path "templates/pain_assessment_table.html" is about runtime 
  reliability, not whether it works now. Let me explain:

  The Potential Problem:

  Where Go Looks for Files:

  When your Go binary runs, it looks for "templates/pain_assessment_table.html" relative to the
  current working directory where the binary is executed, NOT where the source code is located.

  When This Breaks:

  # Works fine during development:
  cd /project/backend-go
  go run cmd/server/main.go  # CWD is /project/backend-go
  # ✅ Finds: /project/backend-go/templates/pain_assessment_table.html

  # But in production/Docker:
  cd /
  ./server  # Binary executed from root
  # ❌ Looks for: /templates/pain_assessment_table.html (doesn't exist!)

  # Or if someone runs from different directory:
  cd /home/user
  /project/backend-go/server
  # ❌ Looks for: /home/user/templates/pain_assessment_table.html

  Why It Works Now:

  - You're probably running the server from the backend-go directory
  - Your Dockerfile might be setting the correct WORKDIR
  - But it's fragile - one deployment change could break it

  Better Approaches:

  Option 1: Embed Templates (Most Reliable)

  import "embed"

  //go:embed templates/*.html
  var templateFS embed.FS

  // Then in your function:
  templateBytes, err := templateFS.ReadFile("templates/pain_assessment_table.html")
  This compiles templates INTO the binary - works anywhere!

  Option 2: Absolute Path via Environment

  templateBasePath := os.Getenv("TEMPLATE_PATH")
  if templateBasePath == "" {
      templateBasePath = "./templates"  // fallback for local dev
  }
  templatePath := filepath.Join(templateBasePath, "pain_assessment_table.html")

  Option 3: Verify in Dockerfile

  WORKDIR /app
  COPY templates/ ./templates/
  # Ensures templates are always relative to /app

  If your current setup is working in production, it means your Docker/deployment is correctly
  managing the working directory. But using embed would make it bulletproof regardless of
  deployment changes.

> ohhhh, this brings up another question, we've been grinding on the PDF pretty hard on local 
  backend and the table logic does work locally, and i was curious about when i should build the 
  image load to GCP and test all of our fixes, these PDF functions would take hours and hours more
   if i tested each change live

⏺ You're absolutely right to develop locally first! Testing every change on GCP would be painfully
   slow. Here's when and how to efficiently test on GCP:

  When to Deploy to GCP for Testing:

  Deploy When You Have:

  1. Completed a major feature - Like finishing 5-10 renderer functions
  2. Changed infrastructure code - Auth, service accounts, Gotenberg calls
  3. Modified Docker/deployment config - New env vars, build steps
  4. Hit a "works locally" milestone - Before moving to next big chunk
  5. Need to test GCP-specific services - Firestore permissions, IAM, Cloud Run limits

  Your Current Situation:

  Since your table logic works locally, I'd suggest deploying to GCP now to verify:
  - Template paths work in container environment
  - Gotenberg service-to-service auth works
  - Firestore collection names are correct (form_responses vs responses)
  - Memory/timeout limits are sufficient for large forms

  Efficient GCP Testing Strategy:

  1. Create a Staging Service:

  # Deploy to staging first
  gcloud run deploy healthcare-forms-backend-staging \
    --source . \
    --region us-central1 \
    --set-env-vars
  "GCP_PROJECT_ID=healthcare-forms-v2,GOTENBERG_URL=https://gotenberg-ubaop6yg4q-uc.a.run.app"

  2. Speed Up Deployments:

  # Use --no-cache only when dependencies change
  docker build -t gcr.io/healthcare-forms-v2/backend-go .
  docker push gcr.io/healthcare-forms-v2/backend-go
  gcloud run deploy --image gcr.io/healthcare-forms-v2/backend-go
  # This is faster than building on Cloud Build

  3. Create Test Scripts:

  # test_pdf_generation.sh
  RESPONSE_ID="known-test-response"
  API_URL="https://healthcare-forms-backend-staging-xxx.run.app"
  curl -X POST "$API_URL/api/responses/$RESPONSE_ID/generate-pdf" \
    -H "Authorization: Bearer $TOKEN" \
    -o test-output.pdf

  4. Use Cloud Run Dev Mode (Hot Reload):

  # For rapid iteration (if you have it set up)
  gcloud run services proxy healthcare-forms-backend-go \
    --port=8080 --region=us-central1

  Local Testing Checklist Before GCP:

  ✅ Must Test Locally:
  - Individual renderer functions
  - HTML/CSS output appearance
  - Data transformation logic
  - Template rendering
  - Basic PDF generation flow

  ⚠️ Must Test on GCP:
  - IAM/Service account permissions
  - Gotenberg service-to-service calls
  - Production Firestore access
  - Memory usage with large forms
  - Container file paths
  - Environment variable loading
  - Timeout limits

  Recommended Next Steps:

  1. Deploy current working version to staging (verify the foundation)
  2. Continue developing renderers locally (fast iteration)
  3. Deploy to GCP every 5-10 renderers (batch testing)
  4. Keep a "GCP issues" list to fix in batches

  Pro Tips for Faster GCP Testing:

  1. Use Cloud Logging heavily:
  log.Printf("DEBUG: Template path: %s", templatePath)
  log.Printf("DEBUG: Working directory: %s", os.Getwd())

  2. Add a debug endpoint:
  // GET /debug/info
  {
    "workingDir": os.Getwd(),
    "templatePath": templatePath,
    "envVars": {...},
    "gotenbergURL": gotenbergURL
  }

  3. Test with same form repeatedly:
  Keep one complex test form that exercises all your renderers - use the same responseId for
  consistent testing.

  Your instinct is correct - develop locally, deploy strategically. Since you have working table
  logic, now is actually a good checkpoint to deploy and verify the production environment before
  building the next 20+ renderers.