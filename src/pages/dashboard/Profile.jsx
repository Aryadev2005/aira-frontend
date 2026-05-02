import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  TrendingUp, Heart, BarChart3, Sprout, ChevronRight, LogOut,
  Bell, Zap, History, Compass, Settings, Instagram, Youtube,
  RefreshCw, LinkIcon, Unlink, Eye, Users, PlayCircle,
  AlertCircle, CheckCircle2, Clock, ExternalLink, Star
} from 'lucide-react';
import { useProfile, useIntegrationStatus, useDisconnectPlatform } from '@/hooks/useApi';
import { useFirebaseAuth } from '@/lib/FirebaseAuthContext';
import { api } from '@/lib/api';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25 } }
};

// ── Analytics card ────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = 'text-primary' }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className="text-muted-foreground" />
        <span className="text-muted-foreground text-xs font-body">{label}</span>
      </div>
      <p className={`font-heading text-xl ${color} truncate`}>{value || '—'}</p>
    </div>
  );
}

// ── Platform analytics section ────────────────────────────────────────────────
function PlatformAnalytics({ profile, analyticsData }) {
  const platform = profile?.primary_platform || 'instagram';
  const hasInstagram = !!profile?.instagram_handle;
  const hasYoutube = !!profile?.youtube_handle;

  if (!hasInstagram && !hasYoutube) return null;

  const isYoutube = platform === 'youtube';

  const instagramStats = [
    { icon: Users, label: 'Followers', value: profile?.follower_range },
    { icon: Heart, label: 'Engagement', value: profile?.engagement_rate ? `${profile.engagement_rate}%` : null },
    { icon: BarChart3, label: 'Health Score', value: profile?.health_score ? `${profile.health_score}/100` : null },
    { icon: Sprout, label: 'Growth Stage', value: profile?.growth_stage },
  ];

  const youtubeStats = analyticsData ? [
    { icon: Users, label: 'Subscribers', value: analyticsData.followers?.toLocaleString('en-IN') },
    { icon: Eye, label: 'Avg Views', value: analyticsData.avgViewsPerVideo?.toLocaleString('en-IN') },
    { icon: PlayCircle, label: 'Total Videos', value: analyticsData.videoCount },
    { icon: TrendingUp, label: 'Upload Freq', value: analyticsData.uploadFrequency },
  ] : instagramStats;

  const stats = isYoutube ? youtubeStats : instagramStats;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isYoutube
            ? <Youtube size={16} className="text-red-500" />
            : <Instagram size={16} className="text-purple-500" />}
          <h3 className="font-body font-semibold text-sm text-foreground">
            {isYoutube ? 'YouTube Analytics' : 'Instagram Analytics'}
          </h3>
          <span className="text-muted-foreground text-xs font-body">
            @{isYoutube ? profile?.youtube_handle : profile?.instagram_handle}
          </span>
        </div>
        {analyticsData?.fromCache && (
          <span className="text-[10px] text-muted-foreground font-body flex items-center gap-1">
            <Clock size={10} /> cached
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} />
        ))}
      </div>

      {/* ARIA intelligence insight */}
      {analyticsData?.ariaIntelligence?.keyInsight && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Star size={14} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-body font-semibold text-primary mb-1">ARIA Insight</p>
              <p className="text-xs font-body text-foreground/80 leading-relaxed">
                {analyticsData.ariaIntelligence.keyInsight}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Estimated revenue (YouTube) */}
      {isYoutube && analyticsData?.estimatedMonthlyRevenue && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground font-body mb-1">Est. Monthly Revenue</p>
          <p className="font-heading text-lg text-foreground">{analyticsData.estimatedMonthlyRevenue}</p>
          <p className="text-[10px] text-muted-foreground font-body mt-1">CPM: {analyticsData.estimatedCPM}</p>
        </div>
      )}

      {/* Top content */}
      {isYoutube && analyticsData?.topVideos?.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <p className="text-xs font-body font-semibold text-foreground mb-2">Top Videos</p>
          {analyticsData.topVideos.slice(0, 3).map((v, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <p className="text-xs font-body text-foreground/80 truncate flex-1">{v.title}</p>
              <span className="text-xs font-body text-muted-foreground shrink-0">
                {v.views?.toLocaleString('en-IN')} views
              </span>
            </div>
          ))}
        </div>
      )}

      {!isYoutube && analyticsData?.topHashtags?.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-body font-semibold text-foreground mb-2">Top Hashtags</p>
          <div className="flex flex-wrap gap-1.5">
            {analyticsData.topHashtags.slice(0, 8).map((tag) => (
              <span key={tag} className="text-[10px] font-body px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Connected accounts section ────────────────────────────────────────────────
function ConnectedAccounts({ profile }) {
  const { data: statusData, isLoading: statusLoading, refetch } = useIntegrationStatus();
  const disconnectMutation = useDisconnectPlatform();
  const [connecting, setConnecting] = useState(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(null);

  const connections = statusData?.data?.connections || {};
  const instagram = connections.instagram;
  const youtube = connections.youtube;

  const handleConnect = async (platform) => {
    try {
      setConnecting(platform);
      const res = await api.get(`/integrations/${platform}/auth-url?flow=settings`);
      window.location.href = res.data.url;
    } catch (e) {
      console.error('Connect failed:', e);
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platform) => {
    try {
      await disconnectMutation.mutateAsync(platform);
      setConfirmDisconnect(null);
      refetch();
    } catch (e) {
      console.error('Disconnect failed:', e);
    }
  };

  const platforms = [
    {
      id: 'instagram',
      label: 'Instagram',
      icon: Instagram,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      conn: instagram,
    },
    {
      id: 'youtube',
      label: 'YouTube',
      icon: Youtube,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      conn: youtube,
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="font-body font-semibold text-sm text-foreground flex items-center gap-2">
        <LinkIcon size={14} className="text-muted-foreground" />
        Connected Accounts
      </h3>

      {platforms.map(({ id, label, icon: Icon, color, bg, border, conn }) => (
        <div key={id} className={`rounded-xl border p-4 ${conn?.connected ? `${bg} ${border}` : 'bg-card border-border'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon size={18} className={color} />
              </div>
              <div>
                <p className="font-body font-semibold text-sm text-foreground">{label}</p>
                {conn?.connected ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {conn.tokenExpired
                      ? <AlertCircle size={11} className="text-amber-500" />
                      : <CheckCircle2 size={11} className="text-green-500" />}
                    <p className="text-xs text-muted-foreground font-body">
                      {conn.tokenExpired ? '⚠️ Token expired' : `@${conn.handle}`}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground font-body mt-0.5">Not connected</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {conn?.connected && !conn.tokenExpired ? (
                confirmDisconnect === id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDisconnect(id)}
                      disabled={disconnectMutation.isPending}
                      className="text-xs text-destructive font-body font-medium px-3 py-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDisconnect(null)}
                      className="text-xs text-muted-foreground font-body px-2 py-1.5"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDisconnect(id)}
                    className="flex items-center gap-1 text-xs text-muted-foreground font-body hover:text-destructive transition-colors"
                  >
                    <Unlink size={12} />
                    Disconnect
                  </button>
                )
              ) : (
                <button
                  onClick={() => handleConnect(id)}
                  disabled={connecting === id}
                  className={`flex items-center gap-1.5 text-xs font-body font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    conn?.tokenExpired
                      ? 'bg-amber-500 text-white hover:bg-amber-600'
                      : 'bg-primary text-white hover:bg-primary/90'
                  } disabled:opacity-50`}
                >
                  {connecting === id ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <ExternalLink size={12} />
                  )}
                  {conn?.tokenExpired ? 'Reconnect' : 'Connect'}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Settings section ──────────────────────────────────────────────────────────
function SettingsSection({ profile, onUpgrade }) {
  const { logout } = useFirebaseAuth();
  const isPro = profile?.is_pro || profile?.subscription_tier === 'pro';

  const settingsItems = [
    { icon: LinkIcon, label: 'Social connections', path: '/dashboard/settings', description: 'Connect Instagram & YouTube' },
    { icon: Compass, label: 'My Trends', path: '/dashboard/discover', description: 'Trend radar for your niche' },
    { icon: History, label: 'Content History', path: '/dashboard/studio', description: 'Your past AI-generated content' },
    { icon: Bell, label: 'Notifications', path: '/dashboard', description: 'Manage alerts' },
  ];

  return (
    <div className="space-y-2">
      <h3 className="font-body font-semibold text-sm text-foreground flex items-center gap-2">
        <Settings size={14} className="text-muted-foreground" />
        Settings
      </h3>

      {/* Pro upgrade card */}
      {!isPro && (
        <button
          onClick={onUpgrade}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Zap size={18} className="text-primary" />
            <div className="text-left">
              <p className="font-body font-semibold text-sm text-primary">Upgrade to Pro</p>
              <p className="font-body text-xs text-muted-foreground">Unlimited trends, AI tools & more</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-body font-bold text-primary">₹499/mo</span>
            <ChevronRight size={16} className="text-primary" />
          </div>
        </button>
      )}

      {isPro && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-3">
            <Zap size={18} className="text-primary" />
            <div>
              <p className="font-body font-semibold text-sm text-primary">Pro Plan ✨</p>
              <p className="font-body text-xs text-muted-foreground">All features unlocked</p>
            </div>
          </div>
          <CheckCircle2 size={18} className="text-green-500" />
        </div>
      )}

      {/* Nav items */}
      {settingsItems.map((m) => (
        <Link
          key={m.label}
          to={m.path}
          className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-card transition-colors"
        >
          <div className="flex items-center gap-3">
            <m.icon size={18} className="text-muted-foreground" />
            <div>
              <p className="font-body text-sm text-foreground">{m.label}</p>
              <p className="font-body text-xs text-muted-foreground">{m.description}</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-muted-foreground" />
        </Link>
      ))}

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/5 transition-colors"
      >
        <LogOut size={18} />
        <span className="font-body text-sm font-medium">Logout</span>
      </button>
    </div>
  );
}

// ── Main Profile Page ─────────────────────────────────────────────────────────
export default function Profile() {
  const { data, isLoading: profileLoading } = useProfile();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const { user: firebaseUser } = useFirebaseAuth();
  const location = useLocation();

  React.useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
      // Clear state so refresh doesn't re-trigger
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const profile = data?.data?.user;

  // Fetch analytics on mount if user has a platform connected
  React.useEffect(() => {
    if (!profile) return;
    if (!profile.instagram_handle && !profile.youtube_handle) return;

    const fetchAnalytics = async () => {
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      try {
        const res = await api.get('/profile/analytics');
        setAnalyticsData(res.data);
      } catch (err) {
        setAnalyticsError('Could not load analytics right now.');
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalytics();
  }, [profile?.id]);

  const handleUpgrade = () => {
    const uid = firebaseUser?.uid;
    window.open(`${import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5173'}/upgrade?uid=${uid}`, '_blank');
  };

  const handleRefreshAnalytics = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const res = await api.post('/profile/refresh');
      setAnalyticsData(res.data);
    } catch (err) {
      setAnalyticsError('Refresh failed. Try again in a moment.');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12 space-y-4 max-w-md mx-auto">
        <p className="text-muted-foreground font-body text-sm">Could not load profile.</p>
        <p className="text-muted-foreground font-body text-xs">
          You can still connect Instagram or YouTube and manage integrations from Settings.
        </p>
        <Link
          to="/dashboard/settings"
          className="inline-flex items-center gap-2 text-sm font-body font-semibold text-primary hover:underline"
        >
          <Settings size={14} />
          Open Settings
        </Link>
      </div>
    );
  }

  const initial = profile.name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || 'A';
  const isPro = profile.is_pro || profile.subscription_tier === 'pro';
  const hasConnectedAccount = !!(profile.instagram_handle || profile.youtube_handle);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'accounts', label: 'Accounts' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-8">

      {/* ── Header ── */}
      <motion.div variants={item} className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shrink-0">
          <span className="text-white text-xl font-bold font-body">{initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl text-foreground truncate">
              {profile.name || 'Creator'}
            </h1>
            {isPro && (
              <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-body font-bold shrink-0">
                PRO ✨
              </span>
            )}
          </div>
          <p className="text-muted-foreground font-body text-sm truncate">{profile.email}</p>
          <div className="flex items-center gap-2 mt-1">
            {profile.instagram_handle && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-body">
                <Instagram size={10} className="text-purple-500" />
                @{profile.instagram_handle}
              </span>
            )}
            {profile.youtube_handle && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-body">
                <Youtube size={10} className="text-red-500" />
                {profile.youtube_handle}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Niches + Archetype ── */}
      {(profile.niches?.length > 0 || profile.archetype) && (
        <motion.div variants={item} className="flex flex-wrap gap-2">
          {profile.archetype && (
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-body font-semibold border border-primary/20">
              {profile.archetype}
            </span>
          )}
          {(profile.niches || []).map((n) => (
            <span key={n} className="px-3 py-1 rounded-full bg-card border border-border text-foreground text-xs font-body font-medium">
              {n}
            </span>
          ))}
        </motion.div>
      )}

      {/* ── No account connected banner ── */}
      {!hasConnectedAccount && (
        <motion.div variants={item} className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-body font-semibold text-sm text-foreground mb-1">
                Connect your account to unlock analytics
              </p>
              <p className="font-body text-xs text-muted-foreground mb-3">
                ARIA needs access to your Instagram or YouTube to show real metrics and personalise your content intelligence.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('accounts')}
                  className="flex items-center gap-1.5 text-xs font-body font-semibold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                  <LinkIcon size={12} /> Connect Now
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Tabs ── */}
      <motion.div variants={item}>
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-body font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Users} label="Followers" value={profile.follower_range} />
              <StatCard icon={Heart} label="Engagement" value={profile.engagement_rate ? `${profile.engagement_rate}%` : null} />
              <StatCard icon={BarChart3} label="Health Score" value={profile.health_score ? `${profile.health_score}/100` : null} />
              <StatCard icon={Sprout} label="Growth Stage" value={profile.growth_stage} />
            </div>

            {/* ARIA intelligence summary */}
            {analyticsData?.ariaIntelligence && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Star size={14} className="text-primary" />
                  <p className="font-body font-semibold text-sm text-primary">ARIA Intelligence</p>
                </div>
                {analyticsData.ariaIntelligence.keyInsight && (
                  <p className="font-body text-sm text-foreground/80 leading-relaxed">
                    {analyticsData.ariaIntelligence.keyInsight}
                  </p>
                )}
                {analyticsData.ariaIntelligence.topOpportunity && (
                  <div className="bg-background rounded-lg p-3">
                    <p className="text-[11px] text-muted-foreground font-body mb-1">Top Opportunity</p>
                    <p className="text-sm font-body text-foreground">{analyticsData.ariaIntelligence.topOpportunity}</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ANALYTICS */}
        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-body">
                {analyticsData?.scrapedAt
                  ? `Last updated: ${new Date(analyticsData.scrapedAt).toLocaleDateString('en-IN')}`
                  : 'Real-time analytics from your connected platform'}
              </p>
              <button
                onClick={handleRefreshAnalytics}
                disabled={analyticsLoading}
                className="flex items-center gap-1 text-xs text-primary font-body font-semibold hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                <RefreshCw size={12} className={analyticsLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            {analyticsLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            )}

            {analyticsError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-center">
                <AlertCircle size={20} className="text-destructive mx-auto mb-2" />
                <p className="text-sm font-body text-destructive">{analyticsError}</p>
                <button
                  onClick={handleRefreshAnalytics}
                  className="text-xs text-primary font-body font-semibold mt-2 hover:underline"
                >
                  Try again
                </button>
              </div>
            )}

            {!analyticsLoading && !analyticsError && (
              hasConnectedAccount ? (
                <PlatformAnalytics profile={profile} analyticsData={analyticsData} />
              ) : (
                <div className="text-center py-8">
                  <BarChart3 size={32} className="text-muted-foreground mx-auto mb-3" />
                  <p className="font-body text-sm text-muted-foreground">
                    Connect Instagram or YouTube to see your analytics
                  </p>
                  <button
                    onClick={() => setActiveTab('accounts')}
                    className="mt-3 text-xs text-primary font-body font-semibold hover:underline"
                  >
                    Connect account →
                  </button>
                </div>
              )
            )}
          </motion.div>
        )}

        {/* ACCOUNTS */}
        {activeTab === 'accounts' && (
          <motion.div
            key="accounts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ConnectedAccounts profile={profile} />
          </motion.div>
        )}

        {/* SETTINGS */}
        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <SettingsSection profile={profile} onUpgrade={handleUpgrade} />
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}
