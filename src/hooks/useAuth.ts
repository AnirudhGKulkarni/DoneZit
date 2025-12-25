/**
 * Authentication Hook
 * 
 * This hook manages the authentication state throughout the app.
 * It listens to Firebase auth state changes and provides
 * login, register, and logout functions.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  subscribeToAuthChanges,
  FirebaseUser 
} from '@/services/firebase';
import { User, AuthState } from '@/types';

interface UseAuthReturn extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * Convert Firebase User to our User type
 */
const mapFirebaseUser = (firebaseUser: FirebaseUser): User => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email,
  displayName: firebaseUser.displayName,
  createdAt: firebaseUser.metadata.creationTime 
    ? new Date(firebaseUser.metadata.creationTime) 
    : undefined
});

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to auth state changes on mount
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
      if (firebaseUser) {
        setUser(mapFirebaseUser(firebaseUser));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  /**
   * Register a new user
   */
  const register = useCallback(async (email: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await registerUser(email, password);
      // Auth state listener will update the user
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Login an existing user
   */
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await loginUser(email, password);
      // Auth state listener will update the user
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout the current user
   */
  const logout = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await logoutUser();
      // Auth state listener will update the user to null
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    error,
    login,
    register,
    logout
  };
};
