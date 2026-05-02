import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useFirebaseAuth } from '@/lib/FirebaseAuthContext';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 22 } } };

export default function SignIn() {
  const navigate = useNavigate();
  const { signIn } = useFirebaseAuth();

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (!password)     { setError('Please enter your password.'); return; }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        variants={container} initial="hidden" animate="show"
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <motion.div variants={item} className="text-center mb-8">
          <Link to="/" className="font-heading text-3xl text-primary">ARIA</Link>
          <p className="text-muted-foreground font-body text-sm mt-1">Welcome back</p>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-xl p-3"
          >
            <AlertCircle size={16} className="text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-body text-destructive">{error}</p>
              {error.includes('sign up') && (
                <Link to="/register" className="text-xs text-primary font-body font-semibold mt-1 block hover:underline">
                  Create account →
                </Link>
              )}
            </div>
          </motion.div>
        )}

        <motion.form variants={item} onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="text-xs font-body font-medium text-foreground/70 mb-1.5 block">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-4 py-3 bg-card border border-border rounded-xl font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-body font-medium text-foreground/70">Password</label>
              <Link to="/forgot-password" className="text-xs text-primary font-body hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-3 bg-card border border-border rounded-xl font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-xl font-body font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : 'Sign in'}
          </button>
        </motion.form>

        <motion.p variants={item} className="text-center text-muted-foreground font-body text-sm mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Create one
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}

function friendlyError(code) {
  const map = {
    'auth/wrong-password':        'Incorrect password. Please try again.',
    'auth/invalid-credential':    'Incorrect email or password.',
    'auth/user-not-found':        'No account found with this email. Please sign up first.',
    'auth/invalid-email':         'Please enter a valid email address.',
    'auth/too-many-requests':     'Too many attempts. Please try again in a few minutes.',
    'auth/user-disabled':         'This account has been disabled.',
    'auth/network-request-failed':'Network error. Check your connection.',
  };
  return map[code] || 'Sign in failed. Please try again.';
}
