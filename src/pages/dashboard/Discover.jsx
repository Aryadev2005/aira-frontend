import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Sparkles, Globe, Zap, Pencil, X, Check } from 'lucide-react';
import { useProfile } from '@/hooks/useApi';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

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

// ── Niche Picker Modal ────────────────────────────────────────────────────────
function NichePickerModal({ currentNiche, onSave, onClose, isFirstTime }) {
  const [input, setInput]   = useState(currentNiche || '');
  const [saving, setSaving] = useState(false);

  const examples = [
    'book reels', 'dance', 'mens fashion', 'fitness',
    'food', 'bollywood edits', 'skincare', 'travel',
    'startup', 'gaming', 'comedy', 'cricket',
  ];

  const handleSave = async () => {
    if (!input.trim()) return;
    setSaving(true);
    await onSave(input.trim().toLowerCase());
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={e => { if (e.target === e.currentTarget && !isFirstTime) onClose(); }}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0,  opacity: 1 }}
        exit={{    y: 50, opacity: 0 }}
        transition={{ type: 'spring', damping: 28 }}
        className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-warm"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-heading text-lg text-foreground">
              {isFirstTime ? 'What do you create?' : 'Edit your niche'}
            </h2>
            <p className="text-muted-foreground font-body text-sm mt-0.5">
              {isFirstTime
                ? 'Tell ARIA your niche for personalized viral ideas'
                : 'Update your niche — trends refresh instantly'}
            </p>
          </div>
          {!isFirstTime && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <X size={16} className="text-muted-foreground" />
            </button>
          )}
        </div>

        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder="e.g. book reels, dance, mens fashion..."
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-3"
          autoFocus
        />

        <div className="flex flex-wrap gap-2 mb-5">
          {examples.map(ex => (
            <button
              key={ex}
              onClick={() => setInput(ex)}
              className={`px-3 py-1 rounded-full font-body text-xs transition-colors ${
                input === ex
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
              }`}
            >
              {ex}
            </button>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={!input.trim() || saving}
          className="w-full py-3 rounded-xl bg-primary text-white font-body font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving
            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
            : <><Check size={16} /> {isFirstTime ? 'Find my trends' : 'Update niche'}</>
          }
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Main Discover Component ───────────────────────────────────────────────────
export default function Discover() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing]     = useState(false);
  const [showNichePicker, setShowNichePicker] = useState(false);

  const { data: profileData, refetch: refetchProfile } = useProfile();
  const user      = profileData?.data;
  const userNiche = user?.niches?.[0] || null;
  const hasNiche  = !!userNiche;

  // Update niche permanently in DB
  const updateNiche = useMutation({
    mutationFn: niche => api.put('/users/niche', { niche }),
    onSuccess: async () => {
      await refetchProfile();
      await queryClient.invalidateQueries({ queryKey: ['viralIdeas'] });
      setShowNichePicker(false);
      // Force fresh fetch with new niche
      setIsRefreshing(true);
      try {
        await api.get('/trends/viral-ideas?force=true');
        await queryClient.invalidateQueries({ queryKey: ['viralIdeas'] });
      } finally {
        setIsRefreshing(false);
      }
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['viralIdeas', userNiche],
    queryFn:  () => api.get('/trends/viral-ideas'),
    staleTime: 1000 * 60 * 60 * 2,
    retry: 1,
    enabled: hasNiche,
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
  const niche   = data?.data?.niche || userNiche || '';
  const cached  = data?.data?.cached;
  const topPick = ideas[0] || null;
  const rest    = ideas.slice(1);

  return (
    <>
      <AnimatePresence>
        {(showNichePicker || (!hasNiche && !isLoading)) && (
          <NichePickerModal
            currentNiche={userNiche}
            isFirstTime={!hasNiche}
            onSave={n => updateNiche.mutateAsync(n)}
            onClose={() => setShowNichePicker(false)}
          />
        )}
      </AnimatePresence>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

        {/* Header */}
        <motion.div variants={item} className="flex items-start justify-between">
          <div>
            <h1 className="font-heading text-2xl text-foreground mb-1">Viral Ideas</h1>
            <div className="flex items-center gap-1.5">
              <Globe size={12} className="text-muted-foreground" />
              <p className="text-muted-foreground font-body text-sm">
                Global signals · 48–72h predictions
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || !hasNiche}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border hover:shadow-warm-sm transition-all text-sm font-body text-muted-foreground disabled:opacity-50"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Fetching...' : 'Refresh'}
          </button>
        </motion.div>

        {/* Niche pill — always visible, always editable */}
        {hasNiche && (
          <motion.div variants={item}>
            <button
              onClick={() => setShowNichePicker(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors group"
            >
              <span className="text-primary font-body text-xs font-semibold capitalize">
                Trends for: {niche}
              </span>
              <Pencil size={10} className="text-primary/60 group-hover:text-primary transition-colors" />
            </button>
          </motion.div>
        )}

        {/* Cache notice */}
        {cached && (
          <motion.div variants={item} className="flex items-center gap-2 text-xs text-muted-foreground font-body">
            <Zap size={11} />
            Showing cached signals. Refresh for live data.
          </motion.div>
        )}

        {/* Loading skeleton */}
        {(isLoading || isRefreshing) && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-36 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* No niche state */}
        {!hasNiche && !isLoading && (
          <motion.div variants={item} className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-3xl mb-3">🎯</p>
            <p className="font-body font-semibold text-foreground mb-1">Tell ARIA what you create</p>
            <p className="text-muted-foreground font-body text-sm mb-4">
              We need your niche to find the right trending ideas for you
            </p>
            <button
              onClick={() => setShowNichePicker(true)}
              className="px-5 py-2.5 rounded-xl bg-primary text-white font-body font-semibold text-sm"
            >
              Set my niche
            </button>
          </motion.div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <motion.div variants={item} className="bg-destructive/10 text-destructive rounded-xl p-4 font-body text-sm">
            Could not load trend ideas. Tap refresh to try again.
          </motion.div>
        )}

        {/* Empty */}
        {hasNiche && !isLoading && !isRefreshing && !error && ideas.length === 0 && (
          <motion.div variants={item} className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground font-body text-sm">
              No signals yet. Tap Refresh to pull live global trends.
            </p>
          </motion.div>
        )}

        {/* ARIA Top Pick */}
        {topPick && !isLoading && !isRefreshing && (
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

        {/* Ideas grid */}
        {rest.length > 0 && !isLoading && !isRefreshing && (
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
                    <span className="ml-auto flex items-center gap-1">
                      <Globe size={10} /> {idea.geo}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

      </motion.div>
    </>
  );
}