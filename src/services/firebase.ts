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
  updateProfile,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';
import { getFirestore, setDoc, doc, serverTimestamp, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';

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
let db: Firestore;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  // Enable IndexedDB persistence for offline support
  // This allows Firestore to cache data locally and queue writes while offline.
  // If multi-tab persistence fails, it's non-fatal and we continue without it.
  try {
    enableIndexedDbPersistence(db).catch((err) => {
      // Common error: failed-precondition (multiple tabs)
      // or unimplemented (browser doesn't support persistence)
      console.warn('Could not enable IndexedDB persistence:', err);
    });
  } catch (err) {
    console.warn('Persistence setup error:', err);
  }
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
export const registerUser = async (
  email: string,
  password: string,
  firstName?: string,
  lastName?: string
): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Update display name if provided
    try {
      const displayName = [firstName, lastName].filter(Boolean).join(' ').trim();
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
    } catch (err) {
      // Non-fatal: profile update failed but registration succeeded
      console.warn('Failed to update user profile:', err);
    }
    
      // Create/merge a user document in Firestore with profile fields
      try {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email,
          firstName: firstName || null,
          lastName: lastName || null,
          displayName: userCredential.user.displayName || null,
          createdAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn('Failed to create user doc in Firestore:', err);
      }
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

export { auth, db };
export type { FirebaseUser };
