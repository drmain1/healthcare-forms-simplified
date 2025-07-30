# Firebase API Key Troubleshooting Guide

## The Problem
Spent 3 hours debugging "API key expired" error when trying to use Google Authentication with Firebase, even after creating new API keys.

## Root Cause
The application was using an expired API key from `.env.local` instead of the new key in `.env` file.

## Key Learning: React Environment Variable Priority
React applications load environment variables in this order:
1. `.env.local` (highest priority - always wins)
2. `.env.development` (when NODE_ENV='development')
3. `.env.production` (when NODE_ENV='production')
4. `.env` (lowest priority)

## Where the Old Keys Were Hidden

### 1. `.env.local` (THE CULPRIT)
```bash
# This file had the old expired key
REACT_APP_FIREBASE_API_KEY=AIzaSyAyhsrOmp72l-cbeMlTWR0n-lvw6mG6Sk0  # OLD EXPIRED KEY
```

### 2. `.env` (had new key but was being overridden)
```bash
# This file had the correct new key but was ignored
REACT_APP_FIREBASE_API_KEY=AIzaSyB1aeA-R3hrL-6i0szD6U_zzvLQRliW6mw  # NEW KEY
```

### 3. Hardcoded fallbacks in code
```typescript
// src/services/firebaseAuth.ts
authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'healthcare-forms-v2.firebaseapp.com',
projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'healthcare-forms-v2',
```

## The Solution
1. Updated `.env.local` with the new API key
2. Made sure all Firebase config pointed to the new project (`healthcare-forms-v2`)
3. Cleared browser cache and restarted the development server

## Lessons Learned
1. **Always check ALL .env files** - especially `.env.local` which takes precedence
2. **Use browser incognito mode** when testing authentication changes
3. **Add debug logs** to see which API key is actually being used
4. **Clear all caches** - both browser and React build cache (`rm -rf node_modules/.cache`)

## Quick Debugging Commands
```bash
# Find all env files
ls -la .env*

# Check which Firebase API key is being used
grep -r "FIREBASE_API_KEY" .env*

# Clear all caches and restart
rm -rf node_modules/.cache build
npm start
```

## Firebase Console Checklist
- [ ] Google sign-in is enabled in Authentication → Sign-in method
- [ ] Localhost is in authorized domains (Authentication → Settings)
- [ ] API key has proper restrictions in Google Cloud Console
- [ ] Using the correct Firebase project

## Time Saved for Future
If you hit "API key expired" errors again:
1. First check `.env.local` - it probably has an old key
2. Check the browser console for which key is actually being used
3. Clear everything and restart