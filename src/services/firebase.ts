/**
 * Firebase Configuration and Initialization
 * 
 * This file handles the Firebase setup for authentication.
 * Firebase Authentication is used for email/password auth.
 * 
 * IMPORTANT: You need to add your Firebase config credentials.
 * Get these from: Firebase Console > Project Settings > Your apps > Config
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';

// Firebase configuration object
// Replace these values with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (error) {
  console.error("Firebase initialization error:", error);
  throw error;
}

/**
 * Register a new user with email and password
 * @param email - User's email address
 * @param password - User's password (min 6 characters)
 * @returns Promise with UserCredential on success
 */
export const registerUser = async (email: string, password: string): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error: any) {
    // Handle specific Firebase auth errors with user-friendly messages
    let errorMessage = "Registration failed. Please try again.";
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = "This email is already registered. Please sign in instead.";
        break;
      case 'auth/invalid-email':
        errorMessage = "Please enter a valid email address.";
        break;
      case 'auth/weak-password':
        errorMessage = "Password should be at least 6 characters long.";
        break;
      case 'auth/operation-not-allowed':
        errorMessage = "Email/password accounts are not enabled. Please contact support.";
        break;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Sign in an existing user with email and password
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise with UserCredential on success
 */
export const loginUser = async (email: string, password: string): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error: any) {
    // Handle specific Firebase auth errors with user-friendly messages
    let errorMessage = "Login failed. Please try again.";
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = "No account found with this email. Please register first.";
        break;
      case 'auth/wrong-password':
        errorMessage = "Incorrect password. Please try again.";
        break;
      case 'auth/invalid-email':
        errorMessage = "Please enter a valid email address.";
        break;
      case 'auth/user-disabled':
        errorMessage = "This account has been disabled. Please contact support.";
        break;
      case 'auth/too-many-requests':
        errorMessage = "Too many failed attempts. Please try again later.";
        break;
      case 'auth/invalid-credential':
        errorMessage = "Invalid email or password. Please check your credentials.";
        break;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Sign out the current user
 */
export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error("Failed to sign out. Please try again.");
  }
};

/**
 * Subscribe to authentication state changes
 * @param callback - Function called when auth state changes
 * @returns Unsubscribe function
 */
export const subscribeToAuthChanges = (
  callback: (user: FirebaseUser | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

export { auth };
export type { FirebaseUser };
