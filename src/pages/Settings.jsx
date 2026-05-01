import React from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Link2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
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
    emoji: '📸',
    description: 'Reels analytics, niche detection, and engagement insights',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    emoji: '▶️',
    description: 'Channel analytics, video trends, and subscriber insights',
  },
];

function ConnectedAccounts() {
  const { data: statusData, isLoading, refetch } = useIntegrationStatus();
  const disconnectMutation = useDisconnectPlatform();
  const connections = statusData?.data?.connections || {};

  const handleConnect = async (platform) => {
    try {
      const res = await api.get(`/integrations/${platform}/auth-url`);
      window.location.href = res.data.url;
    } catch (e) {
      console.error(`Failed to get auth URL for ${platform}:`, e);
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
      {platforms.map(({ id, label, emoji, description }) => {
        const conn = connections[id];
        const isConnected = conn?.connected;
        const isExpired = conn?.tokenExpired;

        return (
          <div
            key={id}
            className="flex items-center justify-between p-4 rounded-xl bg-card border border-border gap-4"
          >
            {/* Left: icon + info */}
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl flex-shrink-0">{emoji}</span>
              <div className="min-w-0">
                <p className="font-body font-semibold text-foreground">{label}</p>
                {isConnected && !isExpired ? (
                  <p className="text-xs text-muted-foreground truncate">
                    <CheckCircle2 size={10} className="inline mr-1 text-green-500" />
                    @{conn.handle} · Connected
                  </p>
                ) : isExpired ? (
                  <p className="text-xs text-amber-500 truncate">
                    <AlertTriangle size={10} className="inline mr-1" />
                    @{conn.handle} · Token expired — reconnect
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">{description}</p>
                )}
              </div>
            </div>

            {/* Right: action button */}
            {isConnected && !isExpired ? (
              <button
                id={`disconnect-${id}`}
                onClick={() => handleDisconnect(id)}
                disabled={disconnectMutation.isPending}
                className="flex-shrink-0 flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 font-body font-medium transition-colors disabled:opacity-50"
              >
                <XCircle size={14} />
                Disconnect
              </button>
            ) : (
              <button
                id={`connect-${id}`}
                onClick={() => handleConnect(id)}
                className="flex-shrink-0 text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-body font-semibold hover:bg-primary/90 transition-colors"
              >
                {isExpired ? 'Reconnect' : 'Connect'}
              </button>
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
      {/* Page header */}
      <motion.div variants={item} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <SettingsIcon size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-2xl text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground font-body">Manage your account and connections</p>
        </div>
      </motion.div>

      {/* Connected Accounts */}
      <motion.section variants={item} className="space-y-3">
        <div className="flex items-center gap-2">
          <Link2 size={16} className="text-muted-foreground" />
          <h2 className="font-heading text-lg text-foreground">Connected Accounts</h2>
        </div>
        <p className="text-xs text-muted-foreground font-body -mt-1">
          Connect your social accounts so ARIA can analyse your content and surface personalised trends.
        </p>
        <ConnectedAccounts />
      </motion.section>
    </motion.div>
  );
}
