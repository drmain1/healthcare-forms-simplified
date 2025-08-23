import React, { createContext, useContext, useEffect, useState } from 'react';
import { firebaseAuth, AuthUser } from '../services/firebaseAuth';
import { authService } from '../services/authService';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/slices/authSlice';
import axios from 'axios';
import { fetchCSRFToken } from '../utils/csrfToken';

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
  const dispatch = useDispatch();

  const exchangeTokenForSession = async (authUser: AuthUser) => {
    if (!authUser.idToken) {
      console.error("No ID token available for session exchange.");
      return;
    }
    try {
      await authService.sessionLogin(authUser.idToken);
      console.log('Session login successful');
      
      // Fetch CSRF token after successful session login
      await fetchCSRFToken();
      console.log('CSRF token fetched');
      
      // Fetch or create the user's organization from backend
      const apiUrl = process.env.REACT_APP_API_URL === '' ? '/api' : (process.env.REACT_APP_API_URL || 'http://localhost:8080/api');
      
      try {
        const orgResponse = await axios.get(
          `${apiUrl}/organizations/current`,
          {
            headers: {
              'Authorization': `Bearer ${authUser.idToken}`,
            },
          }
        );
        
        const backendOrg = orgResponse.data;
        console.log('Fetched/created organization:', backendOrg);
        
        // Map backend organization to frontend format
        const organization = {
          id: backendOrg.id || backendOrg._id || backendOrg.ID || `org-${authUser.uid}`,
          name: backendOrg.name || 'Personal Clinic',
          subdomain: backendOrg.name?.toLowerCase().replace(/\s+/g, '-') || 'personal',
          settings: backendOrg.settings || {},
          subscription_tier: 'professional' as const,
          is_active: true,
          created_at: backendOrg.created_at || new Date().toISOString()
        };
        
        // Create user object
        const displayName = authUser.displayName || '';
        const nameParts = displayName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        const user = {
          id: authUser.uid,
          username: authUser.email?.split('@')[0] || authUser.uid,
          email: authUser.email || '',
          first_name: firstName,
          last_name: lastName,
          organization: organization.id,
          role: 'admin' as const,
          permissions: ['read', 'write', 'delete', 'admin'],
          phone: '',
          department: 'Administration',
          hipaa_training_completed: true,
          hipaa_training_date: new Date().toISOString(),
          access_level: 'full' as const,
          last_login: new Date().toISOString()
        };
        
        
        
        // Dispatch to Redux store
        console.log('FirebaseAuthContext: Dispatching loginSuccess with organization:', JSON.stringify(organization, null, 2));
        dispatch(loginSuccess({ 
          user, 
          organization 
        }));
        
      } catch (orgError) {
        console.error('Failed to fetch organization, using fallback:', orgError);
        
        // Fallback: Create mock organization if backend call fails
        const userEmail = authUser.email || '';
        const orgName = userEmail.split('@')[1]?.split('.')[0] || 'default-org';
        
        const fallbackOrganization = {
          id: `org-${authUser.uid}`,
          name: orgName.charAt(0).toUpperCase() + orgName.slice(1),
          subdomain: orgName,
          settings: {},
          subscription_tier: 'professional' as const,
          is_active: true,
          created_at: new Date().toISOString()
        };
        
        const displayName = authUser.displayName || '';
        const nameParts = displayName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        const fallbackUser = {
          id: authUser.uid,
          username: authUser.email?.split('@')[0] || authUser.uid,
          email: authUser.email || '',
          first_name: firstName,
          last_name: lastName,
          organization: fallbackOrganization.id,
          role: 'admin' as const,
          permissions: ['read', 'write', 'delete', 'admin'],
          phone: '',
          department: 'Administration',
          hipaa_training_completed: true,
          hipaa_training_date: new Date().toISOString(),
          access_level: 'full' as const,
          last_login: new Date().toISOString()
        };
        
        dispatch(loginSuccess({ 
          user: fallbackUser, 
          organization: fallbackOrganization 
        }));
      }
      
    } catch (error) {
      console.error('Failed to exchange token for session:', error);
      // If session login fails, the user is still logged in via Firebase,
      // but subsequent API calls may fail.
    }
  };

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChange(async (authUser) => {
      setUser(authUser);
      if (authUser) {
        await exchangeTokenForSession(authUser);
      } else {
        authService.logout();
      }
      setLoading(false);
    });

    return () => unsubscribe();
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