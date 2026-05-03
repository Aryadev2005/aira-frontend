import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Sparkles, TrendingUp, Globe, Zap } from 'lucide-react';
import { useProfile } from '@/hooks/useApi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';  // use your existing api client, not apiClient

const badgeStyles = {
  HOT:    'bg-primary text-white',
  RISING: 'bg-orange-500 text-white',
  NEW:    'bg-blue-500 text-white',
};

const formatIcon = { Reel: '🎬', Carousel: '🖼️', Short: '⚡', Video: '📹' };

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', damping: 25 } },
};

export default function Discover() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: profileData } = useProfile();
  const userNiche = profileData?.data?.user?.niches?.[0] || 'general';

  const { data, isLoading, error } = useQuery({
    queryKey: ['viralIdeas', userNiche],
    queryFn:  () => api.get('/trends/viral-ideas'),
    staleTime: 1000 * 60 * 60 * 2,
    retry: 1,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await api.get('/trends/viral-ideas?force=true');
      await queryClient.invalidateQueries({ queryKey: ['viralIdeas'] });
    } finally {
      setIsRefreshing(false);
    }
  };

  const ideas   = data?.data?.ideas || [];
  const niche   = data?.data?.niche || userNiche;
  const cached  = data?.data?.cached;
  const topPick = ideas[0] || null;
  const rest    = ideas.slice(1);

  if (isLoading) return (
    <div className="space-y-4">
      {[1,2,3,4].map(i => <div key={i} className="h-36 bg-muted rounded-xl animate-pulse" />)}
    </div>
  );

  if (error) return (
    <div className="bg-destructive/10 text-destructive rounded-xl p-4 font-body text-sm">
      Could not load trend ideas. Tap refresh to try again.
    </div>
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

      <motion.div variants={item} className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl text-foreground mb-1">Viral Ideas</h1>
          <div className="flex items-center gap-2">
            <Globe size={12} className="text-muted-foreground" />
            <p className="text-muted-foreground font-body text-sm">
              Global signals · 48–72h predictions for{' '}
              <span className="text-primary font-semibold capitalize">{niche}</span>
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border hover:shadow-warm-sm transition-all text-sm font-body text-muted-foreground disabled:opacity-50"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Fetching...' : 'Refresh'}
        </button>
      </motion.div>

      {cached && (
        <motion.div variants={item} className="flex items-center gap-2 text-xs text-muted-foreground font-body">
          <Zap size={11} />
          Showing cached signals. Refresh for live data.
        </motion.div>
      )}

      {ideas.length === 0 && (
        <motion.div variants={item} className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-muted-foreground font-body text-sm">
            No signals yet. Tap Refresh to pull live global trends.
          </p>
        </motion.div>
      )}

      {topPick && (
        <motion.div variants={item} className="bg-accent text-accent-foreground rounded-xl p-6 shadow-warm">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-primary" />
            <span className="text-primary text-xs font-body font-semibold tracking-wider">ARIA TOP PICK</span>
            <span className={`ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-body font-semibold ${badgeStyles[topPick.badge] || 'bg-muted'}`}>
              {topPick.badge}
            </span>
          </div>
          <h3 className="font-heading text-xl text-accent-foreground mb-1">{topPick.title}</h3>
          <p className="text-accent-foreground/80 font-body text-sm italic mb-2">"{topPick.contentAngle}"</p>
          <p className="text-accent-foreground/60 font-body text-xs leading-relaxed mb-3">{topPick.whyNow}</p>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-body text-accent-foreground/60">
              {formatIcon[topPick.formatSuggestion] || '📱'} {topPick.formatSuggestion}
            </span>
            <span className="text-xs font-body font-bold text-primary">{topPick.growthSignal}</span>
            <span className="text-xs font-body text-accent-foreground/50 flex items-center gap-1">
              <Globe size={10} /> {topPick.geo}
            </span>
          </div>
        </motion.div>
      )}

      {rest.length > 0 && (
        <AnimatePresence>
          <motion.div variants={container} className="grid sm:grid-cols-2 gap-4">
            {rest.map((idea, idx) => (
              <motion.div
                key={idea.id || idx}
                variants={item}
                whileHover={{ scale: 1.01, y: -2 }}
                className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:shadow-warm transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-body font-semibold ${badgeStyles[idea.badge] || 'bg-muted text-muted-foreground'}`}>
                    {idea.badge}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-body font-bold text-primary">{idea.growthSignal}</span>
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold font-body ${
                      idea.velocityScore >= 90 ? 'border-primary text-primary'
                      : idea.velocityScore >= 75 ? 'border-orange-500 text-orange-500'
                      : 'border-muted-foreground text-muted-foreground'
                    }`}>
                      {idea.velocityScore}
                    </div>
                  </div>
                </div>
                <h4 className="font-body font-semibold text-foreground mb-1 text-sm">{idea.title}</h4>
                <p className="text-muted-foreground font-body text-xs italic mb-2 line-clamp-2">"{idea.contentAngle}"</p>
                <p className="text-muted-foreground font-body text-xs leading-relaxed line-clamp-2 mb-3">{idea.whyNow}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
                  <span>{formatIcon[idea.formatSuggestion] || '📱'} {idea.formatSuggestion}</span>
                  <span className="ml-auto flex items-center gap-1"><Globe size={10} /> {idea.geo}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}