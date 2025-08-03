# 🚀 Quick Deploy Cheatsheet

## 🔐 SECURITY REQUIREMENT: CHAINGUARD IMAGES ONLY
**⚠️ CRITICAL: DO NOT DRIFT FROM CHAINGUARD IMAGES!**
- We use Chainguard images for HIPAA compliance and security
- Primary Dockerfile: `backend-fastapi/Dockerfile` (CHAINGUARD BASED!)
- Base image: `cgr.dev/chainguard/wolfi-base:latest`
- Build image: `cgr.dev/chainguard/python:latest-dev`

## Deploy Frontend to Firebase (After Making Changes)
```bash
cd frontend
npm run build
firebase deploy --only hosting
```

**Live URL:** https://healthcare-forms-v2.web.app/

## Deploy Backend (After Making Changes)
```bash
cd "/Users/davidmain/Desktop/cursor_projects/Forms .MD from opus"
./scripts/build-and-deploy-gcr.sh
```

**Note:** GCP may show a new URL after deployment, but we always use the stable URL:
`https://healthcare-forms-backend-ubaop6yg4q-uc.a.run.app`

## Check If It's Working
```bash
# Test health endpoint (use stable URL)
curl https://healthcare-forms-backend-ubaop6yg4q-uc.a.run.app/health/

# View API docs in browser
open https://healthcare-forms-backend-ubaop6yg4q-uc.a.run.app/docs
```

## View Logs (If Something's Wrong)
```bash
# Last 50 log entries
gcloud run services logs read healthcare-forms-backend \
  --platform=managed \
  --region=us-central1 \
  --limit=50
```

## Frontend Development & Testing

### Local Development
1. Make sure `.env.local` or `.env.development` has:
   ```
   REACT_APP_API_URL=https://healthcare-forms-backend-ubaop6yg4q-uc.a.run.app/api/v1
   ```
   **Important:** Node looks at `.env.local` first, so update that one if it exists!

2. Start frontend:
   ```bash
   cd frontend
   npm start
   ```

### Production Deployment
1. Ensure `.env.production` has the correct backend URL:
   ```
   REACT_APP_API_URL=https://healthcare-forms-backend-ubaop6yg4q-uc.a.run.app/api/v1
   ```

2. Build and deploy:
   ```bash
   cd frontend
   npm run build
   firebase deploy --only hosting
   ```

3. Verify deployment:
   ```bash
   # Open in browser
   open https://healthcare-forms-v2.web.app/
   ```

## Common Fixes

### "Port not listening" error
Already fixed! Code now uses Cloud Run's PORT env variable.

### "Credentials not found" error  
Already fixed! Cloud Run provides credentials automatically.

### "405 Method Not Allowed" error
Already fixed! All endpoints now support trailing slashes.

### CORS errors
Backend already configured for localhost:3000. If using different port, need to update `main.py`.

## Files You Need

1. **Dockerfile**: `backend-fastapi/Dockerfile` (CHAINGUARD BASED!)
2. **Deploy Script**: `scripts/build-and-deploy-gcr.sh`

That's it! Just run the deploy script after making changes.

## 🔒 Security & Dependencies

### WeasyPrint PDF Generation
- ✅ Working with Chainguard images
- System dependencies: Pango, Cairo, GLib, Harfbuzz, Fontconfig, GDK-Pixbuf
- Google Fonts: Noto Fonts (via `font-noto` package) included
- Non-root user: `nonroot` (UID 1001)

### Container Security
- ✅ Chainguard wolfi-base (minimal attack surface)
- ✅ Multi-stage build (dev tools removed from production)
- ✅ No package manager in production image
- ✅ HIPAA-compliant security posture