import React from 'react';
import { useFirebaseAuth } from '@/lib/FirebaseAuthContext';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProGate({ children, feature = 'This feature' }) {
  const { dbUser } = useFirebaseAuth();
  
  if (dbUser?.subscription_tier === 'pro') return children;
  
  return (
    <div className="bg-card border border-border rounded-xl p-8 text-center shadow-warm-sm">
      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Lock size={20} className="text-primary" />
      </div>
      <h3 className="font-heading text-xl text-foreground mb-2">{feature} is Pro</h3>
      <p className="text-muted-foreground font-body text-sm mb-6">
        Upgrade to access this feature — ₹499/month
      </p>
      <Button className="bg-primary hover:bg-primary/90 text-white font-body font-semibold rounded-pill px-8">
        Upgrade to Pro
      </Button>
    </div>
  );
}
