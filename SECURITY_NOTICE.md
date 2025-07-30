# URGENT: API Key Security Incident - July 30, 2025

## Summary
Two Firebase API keys were accidentally exposed in a public GitHub commit:
- Project: formbuilder-f4460 (Key: AIzaSyCKqdRdWPX947HPRa5D-KzQNroi8GQ-WDk)
- Project: healthcare-forms-v2 (Key: AIzaSyAyhsrOmp72l-cbeMlTWR0n-lvw6mG6Sk0)

## Actions Taken
1. ✅ Both exposed API keys have been revoked/deleted
2. ✅ Removed hardcoded keys from test-firebase-auth.html
3. ✅ Verified .env files are in .gitignore
4. ✅ Created .env.example file for safe configuration

## Next Steps Required
1. **Get New Firebase API Keys:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project
   - Navigate to Project Settings > General
   - Generate new Web API keys with restrictions

2. **Create Local .env File:**
   ```bash
   cd frontend
   cp .env.example .env
   # Edit .env with your new API keys
   ```

3. **API Key Restrictions (IMPORTANT):**
   - Restrict to specific domains (localhost, your production domain)
   - Limit to necessary APIs only
   - Never commit API keys to version control

## Prevention Guidelines
- Always use environment variables for sensitive data
- Review commits before pushing to ensure no secrets
- Use git-secrets or similar tools to prevent accidental commits
- Consider using Google Secret Manager for production deployments

## Resources
- [Firebase API Key Best Practices](https://firebase.google.com/docs/projects/api-keys)
- [Google Cloud Secret Manager](https://cloud.google.com/secret-manager)