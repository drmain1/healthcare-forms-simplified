import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import googleAuthService from '../services/googleAuthService';

interface User {
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
}

interface GoogleAuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

export const useGoogleAuth = () => {
  const context = useContext(GoogleAuthContext);
  if (!context) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
  }
  return context;
};

interface GoogleAuthProviderProps {
  children: ReactNode;
}

export const GoogleAuthProvider: React.FC<GoogleAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await googleAuthService.init();
        
        // Check if user is already signed in
        const currentUser = googleAuthService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser.user);
        }

        // Listen for auth state changes
        googleAuthService.onAuthStateChanged((user) => {
          setUser(user);
        });
      } catch (error) {
        console.error('Failed to initialize Google Auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async () => {
    setLoading(true);
    try {
      const result = await googleAuthService.signIn();
      setUser(result.user);
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await googleAuthService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: GoogleAuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user
  };

  return (
    <GoogleAuthContext.Provider value={value}>
      {children}
    </GoogleAuthContext.Provider>
  );
};

export default GoogleAuthContext;