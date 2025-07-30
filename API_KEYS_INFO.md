# API Keys Information

## New Secure API Keys (Created July 30, 2025)

### FormBuilder Project (formbuilder-f4460)
- **API Key**: AIzaSyDKGPSNIU6lqFKiIgzH-F-8W17esMJ5KTY
- **Display Name**: Healthcare Forms Frontend
- **Restrictions**: 
  - Browser referrers only (localhost, Firebase hosting domains)
  - Limited to Firebase/Auth APIs only
  - No Android/iOS app access

### Healthcare Forms V2 (healthcare-forms-v2)
- **API Key**: AIzaSyBpPx-vFvGWw2kpvbpUnsG1X2eaATWeSq8
- **Display Name**: Healthcare Forms V2 Frontend
- **Restrictions**: 
  - Browser referrers only (localhost, Firebase hosting domains)
  - Limited to Firebase/Auth APIs only
  - No Android/iOS app access

## Security Features Applied
1. **Domain Restrictions**: Keys only work from:
   - localhost (for development)
   - Official Firebase hosting domains
   - Preview channels (--*.web.app)

2. **API Restrictions**: Limited to:
   - identitytoolkit.googleapis.com (Auth)
   - firebase.googleapis.com
   - firestore.googleapis.com
   - firebaseauth.googleapis.com

3. **No Mobile Access**: These are browser-only keys

## Managing API Keys
View and manage keys at:
- FormBuilder: https://console.cloud.google.com/apis/credentials?project=formbuilder-f4460
- Healthcare V2: https://console.cloud.google.com/apis/credentials?project=healthcare-forms-v2

## Best Practices
1. Never commit .env files to version control
2. Rotate keys periodically
3. Monitor API key usage in GCP Console
4. Add production domains to restrictions before deploying