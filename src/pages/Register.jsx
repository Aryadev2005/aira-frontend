import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, Eye, EyeOff, User, AlertCircle,
  Instagram, Youtube, CheckCircle2, ArrowRight, ArrowLeft,
  Loader2, Sparkles
} from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useFirebaseAuth } from '@/lib/FirebaseAuthContext';
import { api } from '@/lib/api';

// ── Step config ───────────────────────────────────────────────────────────────
const STEPS = [
  { id: 'credentials', label: 'Account'    },
  { id: 'details',     label: 'About you'  },
  { id: 'verify',      label: 'Verify'     },
  { id: 'platforms',   label: 'Platforms'  },
  { id: 'connect',     label: 'Connect'    },
  { id: 'analysis',    label: 'ARIA Setup' },
];

const stepVariants = {
  enter:  { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0  },
  exit:   { opacity: 0, x: -40},
};

const REGISTER_STEP_KEY = 'aria_register_step';
const REGISTER_DATA_KEY = 'aria_register_data';

/** Persist onboarding progress without passwords (sessionStorage). */
function persistRegisterProgress(stepIndex, formData) {
  const safe = { ...formData };
  delete safe._firebaseUser;
  delete safe.password;
  delete safe.confirm;
  sessionStorage.setItem(REGISTER_STEP_KEY, String(stepIndex));
  sessionStorage.setItem(REGISTER_DATA_KEY, JSON.stringify(safe));
}

// ── Reusable input ────────────────────────────────────────────────────────────
function Input({ icon: Icon, label, hint, error, ...props }) {
  return (
    <div>
      {label && <label className="text-xs font-body font-medium text-foreground/70 mb-1.5 block">{label}</label>}
      <div className="relative">
        {Icon && <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />}
        <input
          className={`w-full ${Icon ? 'pl-9' : 'pl-4'} pr-4 py-3 bg-card border rounded-xl font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${
            error ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'
          }`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-destructive font-body mt-1">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground font-body mt-1">{hint}</p>}
    </div>
  );
}

// ── Error banner ──────────────────────────────────────────────────────────────
function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-xl p-3 mb-4"
    >
      <AlertCircle size={15} className="text-destructive mt-0.5 shrink-0" />
      <p className="text-sm font-body text-destructive">{message}</p>
    </motion.div>
  );
}

// ── Nav buttons ───────────────────────────────────────────────────────────────
function NavButtons({ onBack, onNext, nextLabel = 'Continue', loading, disabled, showBack = true }) {
  return (
    <div className={`flex gap-3 mt-6 ${showBack ? 'justify-between' : 'justify-end'}`}>
      {showBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-border text-foreground font-body text-sm font-medium hover:bg-card transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={disabled || loading}
        className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-primary text-white font-body text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
      >
        {loading
          ? <><Loader2 size={14} className="animate-spin" /> Working...</>
          : <>{nextLabel} <ArrowRight size={14} /></>}
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 1 — Credentials
// ════════════════════════════════════════════════════════════════════════════════
function StepCredentials({ data, onChange, onNext }) {
  const [showPass, setShowPass]   = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [errors, setErrors]       = useState({ email: '', password: '', confirm: '' });
  const [loading, setLoading]     = useState(false);
  const [globalErr, setGlobalErr] = useState('');

  const validate = () => {
    const e = {};
    if (!data.email.trim())                    e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(data.email)) e.email    = 'Enter a valid email';
    if (!data.password)                        e.password = 'Password is required';
    else if (data.password.length < 6)         e.password = 'At least 6 characters';
    if (data.password !== data.confirm)        e.confirm  = 'Passwords do not match';
    return e;
  };

  const handleNext = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setGlobalErr('');
    try {
      // Do not rely on fetchSignInMethodsForEmail — enumeration protection can return no methods.
      // Duplicate Firebase accounts surface when sending verification / creating user.
      onNext();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="font-heading text-2xl text-foreground mb-1">Create your account</h2>
      <p className="text-muted-foreground font-body text-sm mb-6">Join 10,000+ Indian creators on ARIA</p>
      <ErrorBanner message={globalErr} />
      <div className="space-y-4">
        <Input
          icon={Mail} label="Email" type="email"
          placeholder="you@example.com"
          value={data.email}
          onChange={e => onChange('email', e.target.value)}
          error={errors.email}
        />
        {/* Password */}
        <div>
          <label className="text-xs font-body font-medium text-foreground/70 mb-1.5 block">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Min 6 characters"
              value={data.password}
              onChange={e => onChange('password', e.target.value)}
              className={`w-full pl-9 pr-10 py-3 bg-card border rounded-xl font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${errors.password ? 'border-destructive' : 'border-border focus:border-primary'}`}
            />
            <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive font-body mt-1">{errors.password}</p>}
        </div>
        {/* Confirm password */}
        <div>
          <label className="text-xs font-body font-medium text-foreground/70 mb-1.5 block">Confirm password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showConf ? 'text' : 'password'}
              placeholder="Same password again"
              value={data.confirm}
              onChange={e => onChange('confirm', e.target.value)}
              className={`w-full pl-9 pr-10 py-3 bg-card border rounded-xl font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${errors.confirm ? 'border-destructive' : 'border-border focus:border-primary'}`}
            />
            <button type="button" onClick={() => setShowConf(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showConf ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirm && <p className="text-xs text-destructive font-body mt-1">{errors.confirm}</p>}
        </div>
      </div>
      <NavButtons showBack={false} onNext={handleNext} loading={loading} />
      <p className="text-center text-muted-foreground font-body text-xs mt-4">
        Already have an account?{' '}
        <Link to="/signin" className="text-primary font-semibold hover:underline">Sign in</Link>
      </p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 2 — Personal details
// ════════════════════════════════════════════════════════════════════════════════
function StepDetails({ data, onChange, onNext, onBack }) {
  const [errors, setErrors] = useState({ name: '', phone: '' });

  const validate = () => {
    const e = {};
    if (!data.name.trim())  e.name  = 'Your name is required';
    if (!data.phone.trim()) e.phone = 'Mobile number is required';
    else if (!/^[6-9]\d{9}$/.test(data.phone.replace(/\s/g, '')))
      e.phone = 'Enter a valid 10-digit Indian mobile number';
    return e;
  };

  const handleNext = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onNext();
  };

  return (
    <div>
      <h2 className="font-heading text-2xl text-foreground mb-1">Tell us about you</h2>
      <p className="text-muted-foreground font-body text-sm mb-6">ARIA uses this to personalise your experience</p>
      <div className="space-y-4">
        <Input
          icon={User} label="Full name"
          placeholder="Your name"
          value={data.name}
          onChange={e => onChange('name', e.target.value)}
          error={errors.name}
        />
        <div>
          <label className="text-xs font-body font-medium text-foreground/70 mb-1.5 block">Mobile number</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <span className="text-sm font-body text-muted-foreground">🇮🇳 +91</span>
              <div className="w-px h-4 bg-border" />
            </div>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="9876543210"
              value={data.phone}
              onChange={e => onChange('phone', e.target.value.replace(/\D/g, ''))}
              className={`w-full pl-[72px] pr-4 py-3 bg-card border rounded-xl font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${errors.phone ? 'border-destructive' : 'border-border focus:border-primary'}`}
            />
          </div>
          {errors.phone && <p className="text-xs text-destructive font-body mt-1">{errors.phone}</p>}
        </div>
      </div>
      <NavButtons onBack={onBack} onNext={handleNext} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 3 — Email verification
// ════════════════════════════════════════════════════════════════════════════════
function StepVerify({ data, onChange, onNext, onBack }) {
  const { syncWithBackend } = useFirebaseAuth();
  const [codeSent, setCodeSent]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Same browser: Firebase session survives reload — show "check inbox" if account already exists.
  useEffect(() => {
    const u = auth.currentUser;
    const email = data.email?.trim().toLowerCase();
    if (u?.email?.toLowerCase() === email && email) setCodeSent(true);
  }, [data.email]);

  const sendEmailCode = async () => {
    setLoading(true);
    setError('');
    try {
      // Create Firebase account then send verification email
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await updateProfile(cred.user, { displayName: data.name });

      // FIX: use sendEmailVerification directly from firebase/auth
      // Pass actionCodeSettings so user returns to /register?verified=true
      await sendEmailVerification(cred.user, {
        url: `${window.location.origin}/register?verified=true`,
        handleCodeInApp: false,
      });

      // FIX: use onChange instead of mutating data directly
      onChange('_firebaseUser', cred.user);
      await syncWithBackend(cred.user, { name: data.name, phone: data.phone });
      persistRegisterProgress(2, data);
      setCodeSent(true);
      setResendTimer(60);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in.');
      } else {
        setError(err.message || 'Could not send verification email.');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkEmailVerified = async () => {
    setLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('Session lost. Please go back and try again.');
        return;
      }
      await user.reload();
      if (user.emailVerified) {
        persistRegisterProgress(3, data);
        await syncWithBackend(user, { name: data.name, phone: data.phone }).catch(() => {});
        onNext();
      } else {
        setError('Email not verified yet. Click the link in your inbox, then click Continue.');
      }
    } catch {
      setError('Could not check verification status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="font-heading text-2xl text-foreground mb-1">Verify your email</h2>
      <p className="text-muted-foreground font-body text-sm mb-6">
        We'll send a verification link to confirm your identity
      </p>

      <ErrorBanner message={error} />

      {!codeSent ? (
        <>
          {/* Email preview card */}
          <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl mb-6">
            <Mail size={18} className="text-primary shrink-0" />
            <div>
              <p className="font-body text-xs text-muted-foreground">Sending to</p>
              <p className="font-body text-sm font-medium text-foreground">{data.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={sendEmailCode}
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-xl font-body font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Sending...</>
              : 'Send verification email'}
          </button>
        </>
      ) : (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Mail size={28} className="text-primary" />
          </div>
          <div>
            <p className="font-body font-semibold text-foreground">Check your inbox</p>
            <p className="font-body text-sm text-muted-foreground mt-1">
              Verification link sent to{' '}
              <span className="text-foreground font-medium">{data.email}</span>
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-left space-y-1.5">
            <p className="font-body text-xs text-muted-foreground mb-1">Steps:</p>
            <p className="font-body text-sm text-foreground">1. Open the email from ARIA</p>
            <p className="font-body text-sm text-foreground">2. Click "Verify email address"</p>
            <p className="font-body text-sm text-foreground">3. Come back and click Continue below</p>
          </div>
          <button
            type="button"
            onClick={checkEmailVerified}
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-xl font-body font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Checking...</>
              : "I've verified — Continue →"}
          </button>
          <button
            type="button"
            disabled={resendTimer > 0 || loading}
            onClick={() => { setCodeSent(false); setResendTimer(0); }}
            className="text-xs text-muted-foreground font-body hover:text-foreground transition-colors disabled:opacity-40"
          >
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Didn't get it? Resend"}
          </button>
        </div>
      )}

      <div className="mt-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground font-body hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 4 — Platform selection
// ════════════════════════════════════════════════════════════════════════════════
function StepPlatforms({ data, onChange, onNext, onBack }) {
  const [error, setError] = useState('');

  const toggle = (platform) => {
    const current = data.platforms || [];
    const next = current.includes(platform)
      ? current.filter(p => p !== platform)
      : [...current, platform];
    onChange('platforms', next);
    if (next.length) setError('');
  };

  const handleNext = () => {
    if (!data.platforms?.length) { setError('Please select at least one platform'); return; }
    onNext();
  };

  const platforms = [
    {
      id: 'instagram', icon: Instagram, label: 'Instagram', sub: 'Reels, Stories, Posts',
      gradient: 'from-purple-500 to-pink-500', bg: 'bg-purple-500/10',
      border: 'border-purple-500', check: 'bg-purple-500',
    },
    {
      id: 'youtube', icon: Youtube, label: 'YouTube', sub: 'Videos, Shorts',
      gradient: 'from-red-500 to-orange-400', bg: 'bg-red-500/10',
      border: 'border-red-500', check: 'bg-red-500',
    },
  ];

  return (
    <div>
      <h2 className="font-heading text-2xl text-foreground mb-1">Where do you create?</h2>
      <p className="text-muted-foreground font-body text-sm mb-6">
        Select all platforms you use. ARIA will personalise trends for each.
      </p>
      <ErrorBanner message={error} />
      <div className="space-y-3 mb-2">
        {platforms.map(({ id, icon: Icon, label, sub, gradient, bg, border, check }) => {
          const selected = (data.platforms || []).includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                selected ? `${bg} ${border} border-2` : 'bg-card border-border hover:border-primary/30'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
                <Icon size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-body font-semibold text-foreground">{label}</p>
                <p className="font-body text-xs text-muted-foreground">{sub}</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                selected ? `${check} border-transparent` : 'border-border'
              }`}>
                {selected && <CheckCircle2 size={14} className="text-white" />}
              </div>
            </button>
          );
        })}
      </div>
      <NavButtons onBack={onBack} onNext={handleNext} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 5 — Connect accounts via OAuth
// ════════════════════════════════════════════════════════════════════════════════
function StepConnect({ data, onChange, onNext, onBack }) {
  const [connecting, setConnecting] = useState(null);
  const [connected, setConnected]   = useState({});
  const [error, setError]           = useState('');

  const platforms = data.platforms || [];

  // Resume from OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const successPlatform = params.get('success');
    const handle          = params.get('handle');
    const errorParam      = params.get('error');

    if (successPlatform) {
      setConnected(prev => ({ ...prev, [successPlatform]: handle || true }));
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (errorParam) {
      const messages = {
        instagram_denied:           'Instagram access was denied. Please try again.',
        instagram_not_professional: 'Your Instagram account must be a Professional account (Business or Creator). Go to Instagram Settings → Account → Switch to Professional Account — it\'s free!',
        instagram_token_failed:     'Could not connect Instagram. Please try again.',
        instagram_failed:           'Instagram connection failed. Please try again.',
        youtube_denied:             'YouTube access was denied. Please try again.',
        youtube_failed:             'YouTube connection failed. Please try again.',
        invalid_state:              'Session expired. Please try connecting again.',
      };
      setError(messages[errorParam] || 'Connection failed. Please try again.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleConnect = async (platform) => {
    setError('');
    setConnecting(platform);
    try {
      // Pass flow=register
      const res = await api.get(`/integrations/${platform}/auth-url?flow=register`);
      const url = res?.data?.url || res?.url;
      if (!url) throw new Error('No auth URL returned');

      persistRegisterProgress(4, { ...data, _resumeFromOAuth: true });
      window.location.href = url;
    } catch (err) {
      setError(err.message || `Could not connect ${platform}. Please try again.`);
      setConnecting(null);
    }
  };

  const allConnected = platforms.every(p => connected[p]);

  const handleNext = () => {
    if (!allConnected) { setError('Please connect all selected platforms to continue.'); return; }
    onChange('connected', connected);
    onNext();
  };

  const handleSkip = () => {
    setError('');
    const partial = {};
    platforms.forEach((p) => { partial[p] = connected[p] || null; });
    onChange('connected', partial);
    onNext();
  };

  const platformConfig = {
    instagram: {
      icon: Instagram, label: 'Instagram',
      sub: 'ARIA will read your posts, reels and engagement',
      gradient: 'from-purple-500 to-pink-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30',
    },
    youtube: {
      icon: Youtube, label: 'YouTube',
      sub: 'ARIA will read your videos, views and subscriber data',
      gradient: 'from-red-500 to-orange-400', bg: 'bg-red-500/10', border: 'border-red-500/30',
    },
  };

  return (
    <div>
      <h2 className="font-heading text-2xl text-foreground mb-1">Connect your accounts</h2>
      <p className="text-muted-foreground font-body text-sm mb-2">
        ARIA needs read-only access to analyse your content and detect your niche.
      </p>
      <p className="text-primary/70 font-body text-xs mb-6">
        🔒 Read-only. ARIA never posts without your permission.
      </p>

      <ErrorBanner message={error} />

      <div className="space-y-3">
        {platforms.map(platform => {
          const cfg = platformConfig[platform];
          if (!cfg) return null;
          const isConnected  = !!connected[platform];
          const isConnecting = connecting === platform;
          const Icon = cfg.icon;

          return (
            <div
              key={platform}
              className={`rounded-xl border-2 p-4 transition-all ${
                isConnected ? `${cfg.bg} ${cfg.border}` : 'bg-card border-border'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shrink-0`}>
                  <Icon size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-sm text-foreground">{cfg.label}</p>
                  {isConnected ? (
                    <p className="font-body text-xs text-green-600 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 size={11} /> Connected
                      {typeof connected[platform] === 'string' && ` · @${connected[platform]}`}
                    </p>
                  ) : (
                    <p className="font-body text-xs text-muted-foreground mt-0.5 truncate">{cfg.sub}</p>
                  )}
                </div>
                {!isConnected && (
                  <button
                    type="button"
                    onClick={() => handleConnect(platform)}
                    disabled={!!connecting}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-body font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
                  >
                    {isConnecting
                      ? <><Loader2 size={12} className="animate-spin" /> Connecting</>
                      : <>Connect <ArrowRight size={12} /></>}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 mt-6">
        <NavButtons
          onBack={onBack}
          onNext={handleNext}
          nextLabel={allConnected ? 'Let ARIA analyse →' : 'Continue'}
          disabled={!allConnected}
        />
        <button
          type="button"
          onClick={handleSkip}
          className="w-full py-2.5 rounded-xl border border-border text-muted-foreground font-body text-sm font-medium hover:bg-card hover:text-foreground transition-colors"
        >
          Skip for now — connect later in Settings
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// STEP 6 — ARIA analysis
// ════════════════════════════════════════════════════════════════════════════════
function StepAnalysis({ data, onFinish }) {
  const [status, setStatus]         = useState('loading');
  const [analysis, setAnalysis]     = useState(null);
  const [progress, setProgress]     = useState(0);
  const [currentMsg, setCurrentMsg] = useState(0);

  const messages = [
    'Connecting to your account...',
    'Reading your recent content...',
    'Detecting your niche...',
    'Analysing engagement patterns...',
    'Building your creator profile...',
    'ARIA is almost ready...',
  ];

  useEffect(() => {
    const progressInterval = setInterval(() => setProgress(p => Math.min(p + 8, 90)), 800);
    const msgInterval      = setInterval(() => setCurrentMsg(m => Math.min(m + 1, messages.length - 1)), 2500);

    let attempts = 0;
    const maxAttempts = 15;

    const poll = async () => {
      attempts++;
      try {
        // FIX: /users/me returns { success, data: {...user} } — handle both shapes
        const res     = await api.get('/users/me');
        const profile = res?.data || res;

        if (profile?.niches?.length > 0 && profile?.archetype) {
          setProgress(100);
          setAnalysis(profile);
          setStatus('done');
          clearInterval(progressInterval);
          clearInterval(msgInterval);
          return;
        }
      } catch {
        // Polling errors are non-fatal
      }

      if (attempts >= maxAttempts) {
        setProgress(100);
        setStatus('done');
        clearInterval(progressInterval);
        clearInterval(msgInterval);
        return;
      }

      setTimeout(poll, 5000);
    };

    const runAnalysis = async () => {
      try {
        const connectedPlatforms = Object.entries(data.connected || {});
        for (const [platform, handle] of connectedPlatforms) {
          if (!handle) continue;
          await api.post('/onboarding/connect', {
            handle:        typeof handle === 'string' ? handle : platform,
            platform,
            followerRange: 'Under 1K',
          }).catch(() => {});
        }
      } catch {
        // Non-fatal
      }
      setTimeout(poll, 3000);
    };

    runAnalysis();

    return () => {
      clearInterval(progressInterval);
      clearInterval(msgInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'loading') {
    return (
      <div className="text-center py-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Sparkles size={32} className="text-primary" />
        </motion.div>
        <h2 className="font-heading text-2xl text-foreground mb-2">ARIA is analysing your account</h2>
        <p className="text-muted-foreground font-body text-sm mb-6">This takes about 30–60 seconds</p>
        <div className="w-full bg-muted rounded-full h-2 mb-4">
          <motion.div
            className="h-2 bg-primary rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={currentMsg}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-sm text-muted-foreground font-body"
          >
            {messages[currentMsg]}
          </motion.p>
        </AnimatePresence>
      </div>
    );
  }

  const emoji           = analysis?.aria_profile?.archetypeEmoji || '🎯';
  const archetypeLabel  = analysis?.aria_profile?.archetypeLabel || analysis?.archetype || 'Creator';
  const niches          = analysis?.niches || [];
  const ariaMessage     = analysis?.aria_profile?.ariaMessage || 'Welcome to ARIA! Your account is being set up.';
  const healthScore     = analysis?.aria_profile?.healthScore || analysis?.health_score;
  const strengths       = analysis?.aria_profile?.strengths || [];
  const topOpportunity  = analysis?.aria_profile?.topOpportunity || '';
  const estimatedEarning = analysis?.aria_profile?.estimatedMonthlyEarning || '';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-4"
    >
      <div className="text-5xl mb-2">{emoji}</div>
      <div>
        <h2 className="font-heading text-2xl text-foreground">ARIA found your vibe</h2>
        <p className="text-primary font-body font-semibold text-lg mt-1">{archetypeLabel}</p>
      </div>

      {niches.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {niches.map(n => (
            <span key={n} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-body font-medium border border-primary/20">
              {n}
            </span>
          ))}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-4 text-left">
        <p className="text-[10px] text-muted-foreground font-body mb-1 uppercase tracking-wide">ARIA says</p>
        <p className="text-sm text-foreground font-body italic leading-relaxed">"{ariaMessage}"</p>
      </div>

      {(healthScore || topOpportunity || estimatedEarning) && (
        <div className="grid grid-cols-2 gap-3 text-left">
          {healthScore && (
            <div className="bg-card border border-border rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground font-body">Health Score</p>
              <p className="font-heading text-xl text-foreground">{healthScore}/100</p>
            </div>
          )}
          {estimatedEarning && (
            <div className="bg-card border border-border rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground font-body">Est. Monthly</p>
              <p className="font-heading text-lg text-foreground">{estimatedEarning}</p>
            </div>
          )}
          {topOpportunity && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 col-span-2">
              <p className="text-[10px] text-primary font-body mb-1">Top Opportunity</p>
              <p className="text-sm text-foreground font-body">{topOpportunity}</p>
            </div>
          )}
        </div>
      )}

      {strengths.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 text-left">
          <p className="text-[10px] text-muted-foreground font-body mb-2 uppercase tracking-wide">Your Strengths</p>
          {strengths.slice(0, 2).map((s, i) => (
            <p key={i} className="text-sm text-foreground font-body flex items-start gap-2 mb-1">
              <span className="text-primary mt-0.5">✦</span> {s}
            </p>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onFinish}
        className="w-full py-3 bg-primary text-white rounded-xl font-body font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
      >
        Enter ARIA <ArrowRight size={16} />
      </button>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN Register component
// ════════════════════════════════════════════════════════════════════════════════
export default function Register() {
  const navigate             = useNavigate();
  const { syncWithBackend }  = useFirebaseAuth();

  const savedStepRaw = sessionStorage.getItem(REGISTER_STEP_KEY);
  const parsedSavedStep = savedStepRaw != null ? parseInt(savedStepRaw, 10) : NaN;
  const initialStep =
    Number.isFinite(parsedSavedStep) && parsedSavedStep >= 0 && parsedSavedStep <= 5
      ? parsedSavedStep
      : 0;
  const savedData = (() => {
    try { return JSON.parse(sessionStorage.getItem(REGISTER_DATA_KEY) || '{}'); }
    catch { return {}; }
  })();

  const [step, setStep] = useState(initialStep);
  const [data, setData] = useState({
    email: '', password: '', confirm: '',
    name: '', phone: '',
    platforms: [], connected: {},
    _firebaseUser: null,
    ...savedData,
  });

  const onChange = (key, value) => setData(prev => ({ ...prev, [key]: value }));
  const goNext   = () => setStep(s => s + 1);
  const goBack   = () => setStep(s => s - 1);

  const goNextFromCredentials = () => {
    setData((prev) => {
      persistRegisterProgress(1, prev);
      return prev;
    });
    setStep(1);
  };

  const goNextFromDetails = () => {
    setData((prev) => {
      persistRegisterProgress(2, prev);
      return prev;
    });
    setStep(2);
  };

  // Returning from Firebase email link: restore step from session and continue after verify.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') !== 'true') return;

    let cancelled = false;

    (async () => {
      if (typeof auth.authStateReady === 'function') await auth.authStateReady();
      if (cancelled) return;

      const u = auth.currentUser;
      try {
        await u?.reload?.();
      } catch {
        /* non-fatal */
      }

      if (cancelled) return;

      const raw = sessionStorage.getItem(REGISTER_STEP_KEY);
      const saved = raw != null ? parseInt(raw, 10) : NaN;

      if (u?.emailVerified) {
        setStep(3);
        setData((prev) => {
          persistRegisterProgress(3, prev);
          return prev;
        });
        await syncWithBackend(u, { name: data.name, phone: data.phone }).catch(() => {});
      } else if (Number.isFinite(saved) && saved >= 2 && saved <= 5) {
        setStep(saved);
      }

      window.history.replaceState({}, '', window.location.pathname);
    })();

    return () => { cancelled = true; };
    // Run once on load when ?verified=true; initial `data` already includes session snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncWithBackend]);

  // Sync with backend when user reaches platform step (Firebase account now exists)
  useEffect(() => {
    if (step === 3 && auth.currentUser) {
      syncWithBackend(auth.currentUser, { name: data.name, phone: data.phone }).catch(() => {});
    }
  }, [step, data.name, data.phone, syncWithBackend]);

  const handleFinish = async () => {
    try {
      await api.post('/onboarding/finalise', {
        confirmedNiches:    [],
        confirmedArchetype: '',
        platform:           data.platforms[0] || 'instagram',
        followerRange:      'Under 1K',
      }).catch(() => {});
    } catch {}
    sessionStorage.removeItem('aria_register_step');
    sessionStorage.removeItem('aria_register_data');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start pt-8 px-4 pb-12">
      <Link to="/" className="font-heading text-2xl text-primary mb-8">ARIA</Link>

      {/* Progress bar */}
      <div className="w-full max-w-sm mb-6">
        <div className="flex justify-between mb-2">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`flex-1 h-1 rounded-full mx-0.5 transition-all duration-300 ${
                i <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between">
          {STEPS.map((s, i) => (
            <p
              key={s.id}
              className={`text-[9px] font-body transition-colors ${
                i === step ? 'text-primary font-semibold' : 'text-muted-foreground'
              }`}
            >
              {s.label}
            </p>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {step === 0 && <StepCredentials data={data} onChange={onChange} onNext={goNextFromCredentials} />}
            {step === 1 && <StepDetails     data={data} onChange={onChange} onNext={goNextFromDetails} onBack={goBack} />}
            {step === 2 && <StepVerify      data={data} onChange={onChange} onNext={goNext} onBack={goBack} />}
            {step === 3 && <StepPlatforms   data={data} onChange={onChange} onNext={goNext} onBack={goBack} />}
            {step === 4 && <StepConnect     data={data} onChange={onChange} onNext={goNext} onBack={goBack} />}
            {step === 5 && <StepAnalysis    data={data} onFinish={handleFinish} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}