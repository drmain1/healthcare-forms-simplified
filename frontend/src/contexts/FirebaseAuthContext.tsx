import React, { createContext, useContext, useEffect, useState } from 'react';
import { firebaseAuth, AuthUser } from '../services/firebaseAuth';
import { authService } from '../services/authService';

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

  const exchangeTokenForSession = async (authUser: AuthUser) => {
    if (!authUser.idToken) {
      console.error("No ID token available for session exchange.");
      return;
    }
    try {
      await authService.sessionLogin(authUser.idToken);
      console.log('Session login successful');
    } catch (error) {
      console.error('Failed to exchange token for session:', error);
      // If session login fails, the user is still logged in via Firebase,
      // but subsequent API calls may fail.
    }
  };

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = firebaseAuth.onAuthStateChange(async (authUser) => {
      setUser(authUser);
      if (authUser) {
        await exchangeTokenForSession(authUser);
      } else {
        // Clear session when user logs out
        authService.logout();
      }
      setLoading(false);
    });

    // Check current auth state
    const currentUser = firebaseAuth.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      // Sync with backend for existing session
      exchangeTokenForSession(currentUser);
    }
    setLoading(false);

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const authUser = await firebaseAuth.signInWithGoogle();
      // Sync with backend immediately after sign in
      // The onAuthStateChange listener will handle the session exchange
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
      // The onAuthStateChange listener handles clearing the session token
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