import React, { createContext, useContext, useEffect, useState } from 'react';
import { firebaseAuth, AuthUser } from '../services/firebaseAuth';
import axios from 'axios';

interface FirebaseAuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export const useFirebaseAuth = () => {
  const context = useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error('useFirebaseAuth must be used within FirebaseAuthProvider');
  }
  return context;
};

export const FirebaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const syncWithBackend = async (authUser: AuthUser) => {
    try {
      // Call the Django backend to sync the Firebase user
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';
      const response = await axios.post(
        `${apiUrl}/auth/firebase-login/`,
        {
          idToken: authUser.idToken,
          displayName: authUser.displayName,
          email: authUser.email,
          photoURL: authUser.photoURL,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('Backend sync successful:', response.data);
    } catch (error) {
      console.error('Failed to sync with backend:', error);
      // Don't throw here - the user is still authenticated with Firebase
      // The backend sync can be retried on the next API call
    }
  };

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = firebaseAuth.onAuthStateChange(async (authUser) => {
      setUser(authUser);
      
      // Sync with backend when user signs in
      if (authUser) {
        await syncWithBackend(authUser);
      }
      
      setLoading(false);
    });

    // Check current auth state
    const currentUser = firebaseAuth.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      // Sync with backend for existing session
      syncWithBackend(currentUser);
    }
    setLoading(false);

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const authUser = await firebaseAuth.signInWithGoogle();
      // Sync with backend immediately after sign in
      await syncWithBackend(authUser);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await firebaseAuth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: FirebaseAuthContextType = {
    user,
    loading,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
};