import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth,
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'healthcare-forms-v2.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'healthcare-forms-v2',
};

console.log('Firebase Config:', {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId
});

// Initialize Firebase only if we have an API key (skip in test environment)
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (firebaseConfig.apiKey) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
} else if (process.env.NODE_ENV !== 'test') {
  console.warn('Firebase API key not configured. Authentication will not work.');
}

// Add required scopes
if (googleProvider) {
  googleProvider.addScope('openid');
  googleProvider.addScope('profile');
  googleProvider.addScope('email');
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  idToken: string;
}

class FirebaseAuthService {
  private currentUser: AuthUser | null = null;
  private authStateListeners: ((user: AuthUser | null) => void)[] = [];

  constructor() {
    // Listen to auth state changes only if auth is initialized
    if (auth) {
      onAuthStateChanged(auth, async (user: User | null) => {
        if (user) {
          const idToken = await user.getIdToken();
          this.currentUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            idToken
          };
        } else {
          this.currentUser = null;
        }
        
        // Notify all listeners
        this.authStateListeners.forEach(listener => listener(this.currentUser));
      });
    }
  }

  async signInWithGoogle(): Promise<AuthUser> {
    if (!auth || !googleProvider) {
      throw new Error('Firebase not initialized. Please configure Firebase API key.');
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();
      
      const authUser: AuthUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        idToken
      };
      
      this.currentUser = authUser;
      return authUser;
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  }

  async signOut(): Promise<void> {
    if (!auth) {
      throw new Error('Firebase not initialized');
    }
    try {
      await firebaseSignOut(auth);
      this.currentUser = null;
    } catch (error: any) {
      
      throw new Error(error.message || 'Failed to sign out');
    }
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  async getIdToken(): Promise<string | null> {
    if (!auth) {
      return null;
    }
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    this.authStateListeners.push(callback);
    // Return unsubscribe function
    return () => {
      this.authStateListeners = this.authStateListeners.filter(l => l !== callback);
    };
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }
}

export const firebaseAuth = new FirebaseAuthService();
