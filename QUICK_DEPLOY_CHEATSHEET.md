# 🚀 Quick Deploy Cheatsheet

## Deploy Backend (After Making Changes)
```bash
cd "/Users/davidmain/Desktop/cursor_projects/Forms .MD from opus"
./scripts/build-and-deploy-gcr.sh
```

## Check If It's Working
```bash
# Test health endpoint
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

## Frontend Testing
1. Make sure `.env.development` has:
   ```
   REACT_APP_API_URL=https://healthcare-forms-backend-ubaop6yg4q-uc.a.run.app/api/v1
   ```

2. Start frontend:
   ```bash
   cd frontend
   npm start
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

1. **Dockerfile**: `backend-fastapi/Dockerfile.cloudrun`
2. **Deploy Script**: `scripts/build-and-deploy-gcr.sh`

That's it! Just run the deploy script after making changes.