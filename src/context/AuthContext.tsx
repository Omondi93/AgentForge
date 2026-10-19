import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  deleteUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { deleteAllUserDataFromFirestore } from '../services/projectStorageService';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  role: string;
  createdAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync Firebase Auth state and Firestore user profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          let userSnap;
          try {
            userSnap = await getDoc(userDocRef);
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`);
          }

          if (userSnap && userSnap.exists()) {
            const data = userSnap.data();
            setUser({
              id: fbUser.uid,
              name: data.displayName || fbUser.displayName || 'Architect',
              email: fbUser.email || '',
              photoURL: fbUser.photoURL || undefined,
              role: data.role || 'Lead Architect',
              createdAt: data.createdAt || new Date().toISOString(),
            });
          } else {
            // First-time sign-in: create user profile
            const newProfile = {
              userId: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || 'Lead Architect',
              photoURL: fbUser.photoURL || '',
              role: 'Lead Architect',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            try {
              await setDoc(userDocRef, newProfile);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `users/${fbUser.uid}`);
            }
            setUser({
              id: fbUser.uid,
              name: newProfile.displayName,
              email: newProfile.email,
              photoURL: newProfile.photoURL || undefined,
              role: newProfile.role,
              createdAt: newProfile.createdAt,
            });
          }
        } catch (err) {
          console.warn('Failed to sync Firestore user profile:', err);
          setUser({
            id: fbUser.uid,
            name: fbUser.displayName || 'Architect',
            email: fbUser.email || '',
            photoURL: fbUser.photoURL || undefined,
            role: 'Lead Architect',
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      await signInWithPopup(auth, googleProvider);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Google sign-in failed' };
    }
  };

  // Legacy/Fallback login for offline testing if needed
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Invalid credentials' };
      }
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during login' };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during registration' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fbSignOut(auth);
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      setUser(null);
      setFirebaseUser(null);
    } catch (err) {
      console.warn('Logout error:', err);
      setUser(null);
      setFirebaseUser(null);
    }
  };

  /**
   * GDPR / CCPA Right to be Forgotten:
   * 1. Deletes all user documents in /projects and /chats Firestore collections
   * 2. Deletes user account record in backend session store
   * 3. Deletes Firebase Auth user record
   * 4. Signs user out and triggers redirect to Auth Gateway
   */
  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const uid = user?.id || firebaseUser?.uid;

      // 1. Purge all Firestore data and local mirrors
      if (uid) {
        await deleteAllUserDataFromFirestore(uid);
      }

      // 2. Call backend route
      try {
        await fetch('/api/auth/delete-account', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (err) {
        console.warn('Backend delete-account notice:', err);
      }

      // 3. Delete Firebase Auth user record if active
      if (firebaseUser) {
        try {
          await deleteUser(firebaseUser);
        } catch (authErr: any) {
          console.warn('Firebase Auth user delete note:', authErr);
        }
      }

      // 4. Complete sign-out and clear state
      try {
        await fbSignOut(auth);
      } catch {}

      setUser(null);
      setFirebaseUser(null);
      setIsLoading(false);

      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Failed to complete account deletion.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isLoading,
        isAuthenticated: !!user,
        loginWithGoogle,
        login,
        register,
        logout,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
