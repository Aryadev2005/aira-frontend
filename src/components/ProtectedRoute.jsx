import React from 'react';
import { Navigate } from 'react-router-dom';
import { useFirebaseAuth } from '@/lib/FirebaseAuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading, needsOnboarding } = useFirebaseAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );
  
  if (!user) return <Navigate to="/signin" replace />;
  if (needsOnboarding) return <Navigate to="/onboarding" replace />;
  
  return children;
}
