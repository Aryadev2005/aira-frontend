import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, Heart, BarChart3, Sprout, ChevronRight, LogOut, Bell, Globe, Zap, History, Compass } from 'lucide-react';
import { useProfile, useTriggerScrape } from '@/hooks/useApi';
import { useFirebaseAuth } from '@/lib/FirebaseAuthContext';

// Removed static stats definition to make it dynamic based on API data

const menuItems = [
  { icon: Compass, label: 'My Trends', path: '/dashboard/discover' },
  { icon: History, label: 'Content History', path: '/dashboard/studio' },
  { icon: Bell, label: 'Notifications', path: '/dashboard' },
  { icon: Globe, label: 'Language', path: '/dashboard' },
  { icon: Zap, label: 'Upgrade to Pro', path: '/dashboard', highlight: true },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25 } }
};

export default function Profile() {
  const { data, isLoading } = useProfile();
  const { mutateAsync: triggerScrape, isPending: scraping } = useTriggerScrape();
  const { logout } = useFirebaseAuth();
  const profile = data?.data?.user;

  const handleConnectInstagram = async () => {
    const handle = prompt('Enter your Instagram handle (without @):');
    if (!handle) return;
    try {
      await triggerScrape({ handle, platform: 'instagram' });
      alert('ARIA is analysing your profile! Check back in 2-3 minutes.');
    } catch (e) {
      console.error('Scrape failed', e);
    }
  };

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading profile...</div>;
  if (!profile) return null;

  const stats = [
    { icon: TrendingUp, label: 'Followers', value: profile.follower_range },
    { icon: Heart, label: 'Engagement', value: `${profile.engagement_rate || 0}%` },
    { icon: BarChart3, label: 'Health Score', value: profile.health_score || 'N/A' },
    { icon: Sprout, label: 'Growth Stage', value: profile.growth_stage || 'New' },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
          <span className="text-white text-xl font-bold font-body">{profile.name?.[0] || profile.email?.[0]}</span>
        </div>
        <div className="flex-1">
          <h1 className="font-heading text-2xl text-foreground">{profile.name || 'Creator'}</h1>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-body text-sm">{profile.email}</span>
            <span className="px-2 py-0.5 rounded-pill bg-primary/10 text-primary text-[10px] font-body font-semibold">
              {profile.primary_platform}
            </span>
          </div>
        </div>
        <button
          onClick={handleConnectInstagram}
          disabled={scraping}
          className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-body font-semibold hover:bg-muted transition-colors disabled:opacity-50"
        >
          {scraping ? 'Connecting...' : 'Connect Instagram'}
        </button>
      </motion.div>

      {/* Niches */}
      <motion.div variants={item} className="flex gap-2 flex-wrap">
        {(profile.niches || []).map((n) => (
          <span key={n} className="px-3 py-1 rounded-pill bg-card border border-border text-foreground text-xs font-body font-medium">
            {n}
          </span>
        ))}
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon size={14} className="text-muted-foreground" />
              <span className="text-muted-foreground text-xs font-body">{s.label}</span>
            </div>
            <p className="font-heading text-xl text-foreground">{s.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Menu */}
      <motion.div variants={item} className="space-y-1">
        {menuItems.map((m) => (
          <Link
            key={m.label}
            to={m.path}
            className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
              m.highlight ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-card'
            }`}
          >
            <div className="flex items-center gap-3">
              <m.icon size={18} className={m.highlight ? 'text-primary' : 'text-muted-foreground'} />
              <span className={`font-body text-sm ${m.highlight ? 'text-primary font-semibold' : 'text-foreground'}`}>
                {m.label}
              </span>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </Link>
        ))}

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/5 transition-colors"
        >
          <LogOut size={18} />
          <span className="font-body text-sm font-medium">Logout</span>
        </button>
      </motion.div>
    </motion.div>
  );
}