import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { api } from './api';

const FirebaseAuthContext = createContext();

export function FirebaseAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null); // full user from our DB
  const [loading, setLoading] = useState(true);

  // After Firebase auth, exchange token with our backend to create/fetch DB user
  const syncWithBackend = async (firebaseUser) => {
    if (!firebaseUser) { setDbUser(null); return; }
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/v1/auth/firebase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      });
      if (res.ok) {
        const data = await res.json();
        setDbUser(data.data?.user || null);
      }
    } catch (e) {
      console.error('Backend sync failed', e);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      await syncWithBackend(firebaseUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await syncWithBackend(cred.user);
    return cred;
  };

  const signUp = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) await updateProfile(cred.user, { displayName });
    await syncWithBackend(cred.user);
    return cred;
  };

  const signInWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    await syncWithBackend(cred.user);
    return cred;
  };

  const logout = async () => {
    await signOut(auth);
    setDbUser(null);
  };

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  // Check if onboarding is complete.
  // A user does NOT need onboarding if they have already connected a social account,
  // regardless of whether niches have been detected yet.
  const needsOnboarding = dbUser &&
    (!dbUser.onboarding_step || dbUser.onboarding_step === 'new') &&
    !dbUser.instagram_handle &&
    !dbUser.youtube_handle;

  return (
    <FirebaseAuthContext.Provider
      value={{ user, dbUser, loading, needsOnboarding, signIn, signUp, signInWithGoogle, logout, resetPassword, syncWithBackend }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const ctx = useContext(FirebaseAuthContext);
  if (!ctx) throw new Error('useFirebaseAuth must be used within FirebaseAuthProvider');
  return ctx;
}