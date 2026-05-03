import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Link2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Instagram,
  Youtube,
  Loader2,
} from 'lucide-react';
import { useIntegrationStatus, useDisconnectPlatform } from '@/hooks/useApi';
import { api } from '@/lib/api';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 22 } },
};

const platforms = [
  {
    id: 'instagram',
    label: 'Instagram',
    Icon: Instagram,
    gradient: 'from-purple-500 to-pink-500',
    bg: 'bg-purple-500/10',
    description: 'Reels analytics, niche detection, and engagement insights',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    Icon: Youtube,
    gradient: 'from-red-500 to-orange-400',
    bg: 'bg-red-500/10',
    description: 'Channel analytics, video trends, and subscriber insights',
  },
];

const OAUTH_ERROR_MESSAGES = {
  youtube_denied: 'YouTube access was denied. Please try again.',
  youtube_failed: 'YouTube connection failed. Please try again.',
  invalid_state: 'Session expired. Please try connecting again.',
};

function ConnectedAccounts() {
  const { data: statusData, isLoading, refetch } = useIntegrationStatus();
  const disconnectMutation = useDisconnectPlatform();
  const connections = statusData?.data?.connections || {};

  const [connectError, setConnectError]       = useState('');
  const [connectSuccess, setConnectSuccess]   = useState('');
  const [connecting, setConnecting]           = useState(null);
  const [instagramHandle, setInstagramHandle] = useState('');
  const [showIgInput, setShowIgInput]         = useState(false);
  const [showBrainRedirect, setShowBrainRedirect] = useState(false);
  const [analysisResult, setAnalysisResult]   = useState(null);

  // ── Connect Instagram by username ──────────────────────────────────────
  const handleConnectInstagram = async () => {
    const cleaned = instagramHandle.replace(/^@/, '').trim();
    if (!cleaned) {
      setConnectError('Please enter your Instagram username');
      return;
    }

    setConnecting('instagram');
    setConnectError('');
    setConnectSuccess('');
    setShowBrainRedirect(false);

    try {
      const res = await api.post('/integrations/instagram/connect-by-handle', {
        handle: cleaned,
        flow: 'dashboard',
      });

      if (res?.data?.success || res?.success) {
        const handle = res?.data?.handle || res?.handle || cleaned;
        setConnectSuccess(`Analysing @${handle}... this takes ~30 seconds`);
        setShowIgInput(false);
        setInstagramHandle('');
        refetch();

        // Poll every 5s for up to 60s
        let attempts = 0;
        const poll = async () => {
          attempts++;
          try {
            const profile = await api.get('/users/me');
            const data = profile?.data || profile;
            if (data?.niches?.length > 0 && data?.archetype) {
              const niche     = Array.isArray(data.niches) ? data.niches[0] : data.niches;
              const archetype = data.archetype_label || data.archetype;
              setConnectSuccess(`✨ Niche detected: ${niche} · ${archetype}`);
              setAnalysisResult({ niche, archetype });
              setShowBrainRedirect(true);
              refetch();
              return;
            }
          } catch { /* non-fatal */ }
          if (attempts < 12) setTimeout(poll, 5000);
          else {
            setConnectSuccess(`Connected @${handle} — analysis still running, check ARIA Brain`);
            setShowBrainRedirect(true);
          }
        };
        setTimeout(poll, 5000);
      } else {
        throw new Error('Connection failed');
      }
    } catch (err) {
      const errCode = err?.response?.data?.error || err?.data?.error;
      const messages = {
        instagram_private:   'Your account is private. Switch to public first.',
        instagram_not_found: 'Username not found. Check and try again.',
        instagram_failed:    'Connection failed. Please try again.',
        invalid_handle:      'Invalid username format.',
      };
      setConnectError(messages[errCode] || err?.message || 'Instagram connection failed');
    } finally {
      setConnecting(null);
    }
  };

  // ── Connect YouTube (OAuth) ────────────────────────────────────────────
  const handleConnectYouTube = async () => {
    setConnectError('');
    setConnectSuccess('');
    setConnecting('youtube');
    try {
      const res = await api.get('/integrations/youtube/auth-url?flow=settings');
      const url = res?.data?.url || res?.url;
      if (!url) throw new Error('No auth URL returned');
      window.location.href = url;
    } catch (e) {
      setConnectError(e?.message || 'Could not start YouTube connection');
      setConnecting(null);
    }
  };

  // ── Disconnect ─────────────────────────────────────────────────────────
  const handleDisconnect = (platform) => {
    if (window.confirm(`Disconnect ${platform}? You can reconnect at any time.`)) {
      disconnectMutation.mutate(platform, {
        onSuccess: () => {
          refetch();
          setConnectSuccess('');
          setShowBrainRedirect(false);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-card border border-border animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">

      {/* ── Success banner ── */}
      {connectSuccess && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5">
          <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-xs font-body text-emerald-800 dark:text-emerald-200">{connectSuccess}</p>
        </div>
      )}

      {/* ── Error banner ── */}
      {connectError && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2.5">
          <AlertTriangle size={15} className="text-destructive shrink-0 mt-0.5" />
          <p className="text-xs font-body text-destructive">{connectError}</p>
        </div>
      )}

      {/* ── ARIA Brain redirect card ── */}
      {showBrainRedirect && (
        <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <div>
            <p className="text-sm font-body font-semibold text-foreground">
              🎯 Your analysis is ready
            </p>
            <p className="text-xs text-muted-foreground font-body mt-0.5">
              ARIA has analysed your profile. See your full breakdown.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem('aria_fresh_analysis', 'true');
              window.location.href = '/dashboard/brain';
            }}
            className="shrink-0 ml-4 px-4 py-2 rounded-xl bg-primary text-white text-xs font-body font-semibold hover:bg-primary/90 transition-colors"
          >
            Open ARIA Brain →
          </button>
        </div>
      )}

      {/* ── Instagram card ── */}
      {(() => {
        const conn = connections['instagram'];
        const isConnected = conn?.connected;
        return (
          <div className={`rounded-xl border p-4 space-y-3 ${isConnected ? 'bg-purple-500/10 border-border' : 'bg-card border-border'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                  <Instagram size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-body font-semibold text-foreground">Instagram</p>
                  {isConnected ? (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <CheckCircle2 size={12} className="text-green-500" />
                      @{conn.handle} · Connected
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Reels analytics, niche detection, and engagement insights
                    </p>
                  )}
                </div>
              </div>

              {isConnected ? (
                <button
                  type="button"
                  onClick={() => handleDisconnect('instagram')}
                  disabled={disconnectMutation.isPending}
                  className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 font-body font-medium transition-colors disabled:opacity-50"
                >
                  <XCircle size={14} />
                  Disconnect
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setShowIgInput(v => !v); setConnectError(''); }}
                  className="flex items-center gap-1.5 text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-body font-semibold hover:bg-primary/90 transition-colors"
                >
                  Connect
                </button>
              )}
            </div>

            {/* Username input — shown when not connected and toggle is open */}
            {!isConnected && showIgInput && (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="your_instagram_username"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value.replace(/^@/, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && handleConnectInstagram()}
                  autoFocus
                  disabled={connecting === 'instagram'}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleConnectInstagram}
                    disabled={connecting === 'instagram' || !instagramHandle.trim()}
                    className="flex-1 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-body font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {connecting === 'instagram' ? (
                      <><Loader2 size={12} className="animate-spin" /> Connecting...</>
                    ) : (
                      'Analyse My Instagram'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowIgInput(false); setInstagramHandle(''); setConnectError(''); }}
                    className="px-3 py-2 rounded-lg border border-border text-xs font-body text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-xs text-muted-foreground font-body text-center">
                  🔒 Public profile only — no login or password needed
                </p>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── YouTube card ── */}
      {(() => {
        const conn = connections['youtube'];
        const isConnected = conn?.connected;
        const isExpired = conn?.tokenExpired;
        const isBusy = connecting === 'youtube';
        return (
          <div className={`flex items-center justify-between p-4 rounded-xl border gap-4 ${isConnected ? 'bg-red-500/10 border-border' : 'bg-card border-border'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-400 flex items-center justify-center shrink-0">
                <Youtube size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-body font-semibold text-foreground">YouTube</p>
                {isConnected && !isExpired ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <CheckCircle2 size={12} className="text-green-500" />
                    @{conn.handle} · Connected
                  </p>
                ) : isExpired ? (
                  <p className="text-xs text-amber-500 flex items-center gap-1 mt-0.5">
                    <AlertTriangle size={12} />
                    @{conn.handle} · Token expired — reconnect
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Channel analytics, video trends, and subscriber insights
                  </p>
                )}
              </div>
            </div>

            {isConnected && !isExpired ? (
              <button
                type="button"
                onClick={() => handleDisconnect('youtube')}
                disabled={disconnectMutation.isPending}
                className="flex-shrink-0 flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 font-body font-medium transition-colors disabled:opacity-50"
              >
                <XCircle size={14} />
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnectYouTube}
                disabled={isBusy || disconnectMutation.isPending}
                className="flex-shrink-0 flex items-center gap-1.5 text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-body font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isBusy ? (
                  <><Loader2 size={12} className="animate-spin" /> Opening…</>
                ) : isExpired ? 'Reconnect' : 'Connect'}
              </button>
            )}
          </div>
        );
      })()}

    </div>
  );
}

export default function Settings() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-8">
      <motion.div variants={item} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <SettingsIcon size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-2xl text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground font-body">Manage integrations and preferences</p>
        </div>
      </motion.div>

      <motion.section variants={item} className="space-y-3">
        <div className="flex items-center gap-2">
          <Link2 size={16} className="text-muted-foreground" />
          <h2 className="font-heading text-lg text-foreground">Connected accounts</h2>
        </div>
        <p className="text-xs text-muted-foreground font-body -mt-1">
          Connect Instagram and YouTube so ARIA can analyse your content and surface personalised trends.
          Read-only access — nothing is posted without your permission.
        </p>
        <ConnectedAccounts />
      </motion.section>
    </motion.div>
  );
}
