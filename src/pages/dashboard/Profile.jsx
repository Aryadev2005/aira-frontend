import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, Heart, BarChart3, Sprout, ChevronRight, LogOut, Bell, Globe, Zap, History, Compass } from 'lucide-react';
import { mockUserProfile } from '@/lib/mockData';

const stats = [
  { icon: TrendingUp, label: 'Followers', value: mockUserProfile.followers },
  { icon: Heart, label: 'Engagement', value: mockUserProfile.engagement },
  { icon: BarChart3, label: 'Health Score', value: mockUserProfile.healthScore },
  { icon: Sprout, label: 'Growth Stage', value: mockUserProfile.growthStage },
];

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
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
          <span className="text-white text-xl font-bold font-body">{mockUserProfile.name[0]}</span>
        </div>
        <div>
          <h1 className="font-heading text-2xl text-foreground">{mockUserProfile.name}</h1>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-body text-sm">{mockUserProfile.email}</span>
            <span className="px-2 py-0.5 rounded-pill bg-primary/10 text-primary text-[10px] font-body font-semibold">
              {mockUserProfile.platform}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Niches */}
      <motion.div variants={item} className="flex gap-2 flex-wrap">
        {mockUserProfile.niches.map((n) => (
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
          onClick={() => window.location.href = '/'}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/5 transition-colors"
        >
          <LogOut size={18} />
          <span className="font-body text-sm font-medium">Logout</span>
        </button>
      </motion.div>
    </motion.div>
  );
}