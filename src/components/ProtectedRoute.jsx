import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useFirebaseAuth } from '@/lib/FirebaseAuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading, needsOnboarding } = useFirebaseAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <p className="font-heading text-2xl text-primary tracking-tight">AIRRA</p>
        <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Don't block dashboard access if user is partially onboarded
  // The Profile > Accounts tab handles account connection post-signup
  return children;
}
