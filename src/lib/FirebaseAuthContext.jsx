import React, {
  createContext, useCallback, useContext, useEffect, useState,
} from 'react';
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

const FirebaseAuthContext = createContext(null);

export function FirebaseAuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [dbUser, setDbUser]   = useState(null);
  const [loading, setLoading] = useState(true);

  // Exchange Firebase token with backend — creates user in DB if new
  // Optional profile fields keep DB aligned with registration (name/phone) before other API calls.
  const syncWithBackend = useCallback(async (firebaseUser, profile = {}) => {
    if (!firebaseUser) { setDbUser(null); return null; }
    try {
      const token = await firebaseUser.getIdToken(true);
      const body = { idToken: token };
      if (profile.name?.trim()) body.name = profile.name.trim();
      if (profile.phone?.trim()) body.phone = profile.phone.trim();
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/v1/auth/firebase`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const u = data.data?.user || null;
        setDbUser(u);
        return u;
      }
    } catch (e) {
      console.error('Backend sync failed', e);
    }
    return null;
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await syncWithBackend(firebaseUser);
      } else {
        setDbUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [syncWithBackend]);

  // ── Sign in — do not gate on fetchSignInMethodsForEmail: with email enumeration
  // protection enabled Firebase often returns no methods and blocks real users.
  const signIn = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    await syncWithBackend(cred.user);
    return cred;
  };

  // ── Sign up — creates account ─────────────────────────────────────────────
  const signUp = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (displayName) await updateProfile(cred.user, { displayName });
    await syncWithBackend(cred.user);
    return cred;
  };

  // ── Google sign in (creates account if new, signs in if existing) ─────────
  const signInWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    await syncWithBackend(cred.user);
    return cred;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setDbUser(null);
  };

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  // ── Onboarding gate ───────────────────────────────────────────────────────
  // A user needs onboarding if:
  // - They have no connected social account (no instagram or youtube handle)
  // - AND their onboarding_step is not 'complete'
  //
  // A user does NOT need onboarding if:
  // - They have at least one connected account, even if niche isn't detected yet
  // - OR their onboarding_step is 'complete'
  const needsOnboarding = dbUser &&
    !dbUser.instagram_handle &&
    !dbUser.youtube_handle &&
    dbUser.onboarding_step !== 'complete';

  const value = {
    user,
    dbUser,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    resetPassword,
    syncWithBackend,
    needsOnboarding,
    isAuthenticated: !!user,
    isPro: dbUser?.is_pro || dbUser?.subscription_tier === 'pro',
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const ctx = useContext(FirebaseAuthContext);
  if (!ctx) throw new Error('useFirebaseAuth must be used inside FirebaseAuthProvider');
  return ctx;
}
