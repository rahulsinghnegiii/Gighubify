import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  onAuthStateChanged, 
  loginUser, 
  registerUser, 
  logoutUser,
  resetPassword,
  signInWithGoogle,
  signInWithFacebook
} from '../firebase/auth';
import { COLLECTIONS, getDocument, setDocument, serverTimestamp, updateDocument } from '../firebase/firestore';
import { User, UserRole } from '../models/user.model';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, isSeller?: boolean) => Promise<FirebaseUser>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  googleSignIn: () => Promise<void>;
  facebookSignIn: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Clear any error messages
  const clearError = () => {
    setError(null);
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await loginUser(email, password);
      const user = userCredential.user;
      
      // Check if this user has a document in Firestore
      const userProfile = await getDocument<User>(COLLECTIONS.USERS, user.uid);
      
      // Create a user document if it doesn't exist
      if (!userProfile) {
        console.log('Creating user document for signed in user:', user.uid);
        await setDocument(COLLECTIONS.USERS, user.uid, {
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'User',
          photoURL: user.photoURL || '',
          role: UserRole.USER,
          isSeller: false,
          isVerified: user.emailVerified,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to sign in';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Register a new user
  const signUp = async (email: string, password: string, displayName: string, isSeller: boolean = false): Promise<FirebaseUser> => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await registerUser(email, password, displayName);
      
      // Create user profile in Firestore
      await setDocument(COLLECTIONS.USERS, user.uid, {
        id: user.uid,
        email,
        displayName,
        role: UserRole.USER,
        isSeller: isSeller,
        isVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return user; // Return the user object
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create account';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    setError(null);
    try {
      await logoutUser();
      setUserProfile(null);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to sign out';
      setError(errorMessage);
      throw err;
    }
  };

  // Request password reset
  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await resetPassword(email);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send password reset email';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with Google
  const googleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithGoogle();
      const user = result.user;
      
      // Check if this is a first-time login
      const profileExists = await getDocument<User>(COLLECTIONS.USERS, user.uid);
      
      if (!profileExists) {
        console.log('Creating user document for Google sign-in:', user.uid);
        // Create a new user profile
        await setDocument(COLLECTIONS.USERS, user.uid, {
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          role: UserRole.USER,
          isSeller: false,
          isVerified: user.emailVerified,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to sign in with Google';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with Facebook
  const facebookSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithFacebook();
      const user = result.user;
      
      // Check if this is a first-time login
      const profileExists = await getDocument<User>(COLLECTIONS.USERS, user.uid);
      
      if (!profileExists) {
        console.log('Creating user document for Facebook sign-in:', user.uid);
        // Create a new user profile
        await setDocument(COLLECTIONS.USERS, user.uid, {
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          role: UserRole.USER,
          isSeller: false,
          isVerified: user.emailVerified,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to sign in with Facebook';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // Fetch user profile from Firestore
          let userProfileData = await getDocument<User>(COLLECTIONS.USERS, user.uid);
          
          // If user profile doesn't exist in Firestore, create it
          if (!userProfileData) {
            console.log('Creating user document for authenticated user:', user.uid);
            
            // Create a basic user profile from Auth data
            await setDocument(COLLECTIONS.USERS, user.uid, {
              id: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'User',
              photoURL: user.photoURL || '',
              role: UserRole.USER,
              isSeller: false,
              isVerified: user.emailVerified,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            
            // Fetch the newly created profile
            userProfileData = await getDocument<User>(COLLECTIONS.USERS, user.uid);
          } 
          // Update user profile with latest auth data if needed
          else if (
            user.displayName !== userProfileData.displayName || 
            user.photoURL !== userProfileData.photoURL || 
            user.emailVerified !== userProfileData.isVerified
          ) {
            console.log('Updating user profile with latest auth data:', user.uid);
            
            // Create an update object with only defined fields
            const updateData: any = {
              updatedAt: serverTimestamp()
            };
            
            // Only include fields that are defined
            if (user.displayName) {
              updateData.displayName = user.displayName;
            }
            
            if (user.photoURL) {
              updateData.photoURL = user.photoURL;
            }
            
            // isVerified is a boolean, safe to include
            updateData.isVerified = user.emailVerified;
            
            await updateDocument(COLLECTIONS.USERS, user.uid, updateData);
            
            // Refresh the profile data
            userProfileData = await getDocument<User>(COLLECTIONS.USERS, user.uid);
          }
          
          setUserProfile(userProfileData);
        } catch (err) {
          console.error('Error fetching/creating user profile:', err);
        }
      } else {
        setUserProfile(null);
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    forgotPassword,
    googleSignIn,
    facebookSignIn,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 