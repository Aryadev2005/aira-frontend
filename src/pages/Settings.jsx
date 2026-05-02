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
  const [connectError, setConnectError] = useState('');
  const [connectSuccess, setConnectSuccess] = useState('');
  const [connecting, setConnecting] = useState(null);
  const [instagramHandle, setInstagramHandle] = useState('');
  const [showBrainRedirect, setShowBrainRedirect] = useState(false);
  const [showInstagramInput, setShowInstagramInput] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const successPlatform = params.get('oauth_success');
    const errorParam = params.get('oauth_error');

    if (!successPlatform && !errorParam) return;

    window.history.replaceState({}, '', window.location.pathname);

    if (successPlatform) {
      refetch();
      setConnectError('');
      const h = params.get('handle');
      const integrationFlow = params.get('integration_flow') || 'settings';
      try {
        sessionStorage.setItem(
          'integration_oauth_last',
          JSON.stringify({
            ok: true,
            platform: successPlatform,
            handle: h,
            integration_flow: integrationFlow,
            t: Date.now(),
          }),
        );
      } catch {
        /* ignore */
      }
      const label = successPlatform === 'instagram' ? 'Instagram' : 'YouTube';
      setConnectSuccess(
        h ? `${label} connected · @${decodeURIComponent(h)}` : `${label} connected`,
      );
    }
    if (errorParam) {
      const integrationFlow = params.get('integration_flow') || 'settings';
      try {
        sessionStorage.setItem(
          'integration_oauth_last',
          JSON.stringify({
            ok: false,
            error: errorParam,
            integration_flow: integrationFlow,
            t: Date.now(),
          }),
        );
      } catch {
        /* ignore */
      }
      setConnectError(OAUTH_ERROR_MESSAGES[errorParam] || 'Connection failed. Please try again.');
    }
  }, [refetch]);

  const handleConnect = async (platform) => {
    setConnectError('');
    setConnectSuccess('');
    setConnecting(platform);

    if (platform === 'instagram') {
      const cleaned = instagramHandle.replace(/^@/, '').trim();
      if (!cleaned) {
        setConnectError('Please enter your Instagram username');
        return;
      }

      setConnecting('instagram');
      setConnectError('');

      try {
        const res = await api.post('/integrations/instagram/connect-by-handle', {
          handle: cleaned,
          flow: 'dashboard',
        });

        if (res.data?.success) {
          setConnectSuccess(`Instagram connected · @${res.data.handle} — ARIA is analysing your profile...`);
          setShowInstagramInput(false);
          setInstagramHandle('');
          refetch();

          // Poll for niche detection — then redirect to ARIA Brain
          let attempts = 0;
          const poll = async () => {
            attempts++;
            try {
              const profile = await api.get('/users/me');
              const data = profile?.data || profile;

              if (data?.niches?.length > 0 && data?.archetype) {
                // Analysis done — update banner and show redirect button
                setConnectSuccess(`✨ ARIA detected your niche: ${data.niches[0]} · ${data.archetype_label || data.archetype}`);
                setShowBrainRedirect(true); // show the "Open ARIA Brain" button
                refetch();
                return;
              }
            } catch { /* non-fatal */ }

            if (attempts < 12) setTimeout(poll, 5000);
            else setConnectSuccess(`Instagram connected · @${res.data.handle} — Analysis running, check ARIA Brain in a moment.`);
          };

          setTimeout(poll, 4000);
        } else {
          throw new Error(res.data?.message || 'Connection failed');
        }
      } catch (err) {
        const errCode = err?.response?.data?.error;
        const messages = {
          instagram_private:   'Your account is private. Please switch to a public account.',
          instagram_not_found: 'Username not found. Please check and try again.',
          instagram_failed:    'Connection failed. Please try again.',
        };
        setConnectError(messages[errCode] || err.message || 'Instagram connection failed');
      } finally {
        setConnecting(null);
      }
      return;
    }

    // YouTube: OAuth redirect
    try {
      const res = await api.get(`/integrations/${platform}/auth-url?flow=settings`);
      const url = res?.data?.url || res?.url;
      if (!url) throw new Error('No authorization URL returned. Try again later.');
      window.location.href = url;
    } catch (e) {
      const msg =
        e?.message ||
        e?.data?.message ||
        `Could not start ${platform} connection. Check your network and try again.`;
      setConnectError(typeof msg === 'string' ? msg : 'Connection failed.');
      setConnecting(null);
    }
  };

  const handleDisconnect = (platform) => {
    if (window.confirm(`Disconnect ${platform}? You can reconnect at any time.`)) {
      disconnectMutation.mutate(platform, { onSuccess: () => refetch() });
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
      {connectSuccess && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5">
          <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs font-body text-emerald-800 dark:text-emerald-200">{connectSuccess}</p>
        </div>
      )}
      {showBrainRedirect && (
        <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <div>
            <p className="text-sm font-body font-semibold text-foreground">
              🎯 Your niche analysis is ready
            </p>
            <p className="text-xs text-muted-foreground font-body mt-0.5">
              ARIA has analysed your profile. See your full breakdown.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.location.href = '/dashboard/brain'}
            className="shrink-0 ml-4 px-4 py-2 rounded-xl bg-primary text-white text-xs font-body font-semibold hover:bg-primary/90 transition-colors"
          >
            Open ARIA Brain →
          </button>
        </div>
      )}
      {connectError && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2.5">
          <AlertTriangle size={15} className="text-destructive shrink-0 mt-0.5" />
          <p className="text-xs font-body text-destructive">{connectError}</p>
        </div>
      )}
      {platforms.map(({ id, label, Icon: PlatformIcon, gradient, bg, description }) => {
        const conn = connections[id];
        const isConnected = conn?.connected;
        const isExpired = conn?.tokenExpired;
        const isBusy = connecting === id;
        const isInstagram = id === 'instagram';

        return (
          <div
            key={id}
            className={`flex flex-col p-4 rounded-xl border gap-3 ${
              isConnected ? `${bg} border-border` : 'bg-card border-border'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}
                >
                  <PlatformIcon size={20} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-body font-semibold text-foreground">{label}</p>
                  {isConnected && !isExpired ? (
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                      <CheckCircle2 size={12} className="inline text-green-500 shrink-0" />
                      <span className="truncate">
                        @{conn.handle} · Connected
                      </span>
                    </p>
                  ) : isExpired ? (
                    <p className="text-xs text-amber-500 truncate flex items-center gap-1 mt-0.5">
                      <AlertTriangle size={12} className="inline shrink-0" />
                      @{conn.handle} · Token expired — reconnect
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                  )}
                </div>
              </div>

              {isConnected && !isExpired ? (
                <button
                  type="button"
                  id={`disconnect-${id}`}
                  onClick={() => handleDisconnect(id)}
                  disabled={disconnectMutation.isPending}
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 font-body font-medium transition-colors disabled:opacity-50"
                >
                  <XCircle size={14} />
                  Disconnect
                </button>
              ) : !isInstagram ? (
                // YouTube — OAuth button
                <button
                  type="button"
                  id={`connect-${id}`}
                  onClick={() => handleConnect(id)}
                  disabled={isBusy || disconnectMutation.isPending}
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-body font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isBusy ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Opening…
                    </>
                  ) : isExpired ? (
                    'Reconnect'
                  ) : (
                    'Connect'
                  )}
                </button>
              ) : null}
            </div>

            {/* Instagram: username input (shown when not connected or expired) */}
            {isInstagram && (!isConnected || isExpired) && showInstagramInput && (
              <div className="flex gap-2">
                <input
                  type="text"
                  id="connect-instagram-input"
                  placeholder="@yourusername"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConnect('instagram')}
                  disabled={isBusy || disconnectMutation.isPending}
                  className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 disabled:opacity-50"
                />
                <button
                  type="button"
                  id="connect-instagram"
                  onClick={() => handleConnect('instagram')}
                  disabled={isBusy || !instagramHandle.trim() || disconnectMutation.isPending}
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-body font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isBusy ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Connecting…
                    </>
                  ) : (
                    isExpired ? 'Reconnect' : 'Connect'
                  )}
                </button>
              </div>
            )}
          </div>
        );
      })}
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
