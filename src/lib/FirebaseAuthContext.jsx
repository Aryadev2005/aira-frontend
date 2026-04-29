import React, { createContext, useContext, useEffect, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// STUB — Replace the functions below with real Firebase calls once you install
// the firebase package and add your config to lib/firebaseConfig.js
//
// Example real implementation:
//   import { auth, googleProvider } from './firebase';
//   import { signInWithEmailAndPassword, ... } from 'firebase/auth';
// ─────────────────────────────────────────────────────────────────────────────

const FirebaseAuthContext = createContext();

// Simulates a persisted session via localStorage
function getStoredUser() {
  try {
    const raw = localStorage.getItem('aira_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function FirebaseAuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(false);

  const persistUser = (u) => {
    setUser(u);
    if (u) localStorage.setItem('aira_user', JSON.stringify(u));
    else localStorage.removeItem('aira_user');
  };

  // ── Email / password sign-in ──────────────────────────────────────────────
  const signIn = async (email, password) => {
    // TODO: replace with signInWithEmailAndPassword(auth, email, password)
    if (!email || !password) throw { code: 'auth/invalid-credential' };
    const u = { uid: 'stub-uid', email, displayName: email.split('@')[0] };
    persistUser(u);
    return { user: u };
  };

  // ── Email / password sign-up ──────────────────────────────────────────────
  const signUp = async (email, password, displayName) => {
    // TODO: replace with createUserWithEmailAndPassword + updateProfile
    if (!email || !password) throw { code: 'auth/invalid-email' };
    const u = { uid: 'stub-uid', email, displayName: displayName || email.split('@')[0] };
    persistUser(u);
    return { user: u };
  };

  // ── Google sign-in ────────────────────────────────────────────────────────
  const signInWithGoogle = async () => {
    // TODO: replace with signInWithPopup(auth, googleProvider)
    const u = { uid: 'google-stub-uid', email: 'creator@gmail.com', displayName: 'Creator' };
    persistUser(u);
    return { user: u };
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    // TODO: replace with signOut(auth)
    persistUser(null);
  };

  // ── Password reset ────────────────────────────────────────────────────────
  const resetPassword = async (email) => {
    // TODO: replace with sendPasswordResetEmail(auth, email)
    console.log('Password reset email sent to', email);
  };

  return (
    <FirebaseAuthContext.Provider
      value={{ user, loading, signIn, signUp, signInWithGoogle, logout, resetPassword }}
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