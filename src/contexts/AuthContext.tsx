import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import { LIMITS, UserProfile } from '../types';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  authReady: boolean;
  isAdmin: boolean;
  authError: string | null;
  signingIn: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfileDetails: (details: {
    displayName: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
  }) => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hasAdminDoc, setHasAdminDoc] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setHasAdminDoc(false);
        setAuthReady(true);
        return;
      }

      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(userRef);

        const isBootAdmin =
          firebaseUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL &&
          firebaseUser.emailVerified;

        if (!snap.exists()) {
          const initialProfile = {
            uid: firebaseUser.uid,
            email: (firebaseUser.email || 'user@thrifthub.ph').slice(0, 200),
            displayName: (firebaseUser.displayName || 'ThriftHub Member').slice(0, LIMITS.MAX_NAME),
            photoURL: (firebaseUser.photoURL || '').slice(0, 1000),
            role: isBootAdmin ? 'admin' : 'user',
            phone: '',
            address: '',
            city: '',
            postalCode: '',
            isSuspended: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userRef, initialProfile);
        }

        try {
          const adminSnap = await getDoc(doc(db, 'admins', firebaseUser.uid));
          setHasAdminDoc(adminSnap.exists());
        } catch {
          setHasAdminDoc(false);
        }
      } catch (err) {
        console.error('Error initializing user profile:', err);
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const userPath = `users/${user.uid}`;
    const unsubProfile = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, userPath);
      }
    );

    const unsubAdmin = onSnapshot(
      doc(db, 'admins', user.uid),
      (snap) => {
        setHasAdminDoc(snap.exists());
      },
      () => {
        setHasAdminDoc(false);
      }
    );

    return () => {
      unsubProfile();
      unsubAdmin();
    };
  }, [user]);

  const isAdmin = Boolean(
    user &&
      user.emailVerified &&
      (user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL ||
        hasAdminDoc ||
        profile?.role === 'admin')
  );

  const signInWithGoogle = async () => {
    setAuthError(null);
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to sign in with Google.';
      if (!msg.includes('popup-closed-by-user')) {
        setAuthError(msg);
      }
    } finally {
      setSigningIn(false);
    }
  };

  const logout = async () => {
    setAuthError(null);
    await signOut(auth);
  };

  const updateProfileDetails = async (details: {
    displayName: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
  }) => {
    if (!user) throw new Error('Sign in required.');
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: details.displayName.trim().slice(0, LIMITS.MAX_NAME) || 'ThriftHub Member',
        phone: details.phone.trim().slice(0, LIMITS.MAX_PHONE),
        address: details.address.trim().slice(0, LIMITS.MAX_ADDRESS),
        city: details.city.trim().slice(0, LIMITS.MAX_CITY),
        postalCode: details.postalCode.trim().slice(0, LIMITS.MAX_POSTAL),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        authReady,
        isAdmin,
        authError,
        signingIn,
        signInWithGoogle,
        logout,
        updateProfileDetails,
        clearAuthError: () => setAuthError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
