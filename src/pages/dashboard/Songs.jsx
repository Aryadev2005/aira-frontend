// src/pages/dashboard/Songs.jsx
// ══════════════════════════════════════════════════════════════════════════════
// Songs page — powered by 3-tier RAG architecture
// Shows lifecycle badges, signals, trajectory data, language filter
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, TrendingUp, Clock, XCircle, RefreshCw, Zap, BarChart2 } from 'lucide-react';
import { useSongs, useSongLanguages, usePredictSongs } from '@/hooks/useApi';
import { useFirebaseAuth } from '@/lib/FirebaseAuthContext';

// ── Constants ─────────────────────────────────────────────────────────────────

const LIFECYCLE_CONFIG = {
  RISING:    { label: 'Rising',    emoji: '🚀', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  PEAKING:   { label: 'Peaking',   emoji: '🔥', class: 'bg-orange-500/10  text-orange-400  border-orange-500/20'  },
  DECLINING: { label: 'Declining', emoji: '📉', class: 'bg-red-500/10     text-red-400     border-red-500/20'     },
  CYCLICAL:  { label: 'Cyclical',  emoji: '🔄', class: 'bg-blue-500/10    text-blue-400    border-blue-500/20'    },
  DEAD:      { label: 'Dead',      emoji: '💀', class: 'bg-muted          text-muted-foreground border-border'    },
};

const SIGNAL_CONFIG = {
  postNow:  { label: 'Post Now', class: 'bg-rising/10 text-rising border-rising/20',                    dot: 'bg-rising'   },
  wait:     { label: 'Wait',     class: 'bg-primary/10 text-primary border-primary/20',                 dot: 'bg-primary'  },
  tooLate:  { label: 'Too Late', class: 'bg-muted text-muted-foreground border-border',                 dot: 'bg-muted-foreground' },
};

const LIFECYCLE_TABS = [
  { id: 'all',      label: 'All' },
  { id: 'RISING',   label: '🚀 Rising' },
  { id: 'PEAKING',  label: '🔥 Peaking' },
  { id: 'DECLINING',label: '📉 Declining' },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item      = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25 } } };

// ── Song Card ──────────────────────────────────────────────────────────────────

function SongCard({ song, index }) {
  const lifecycle = LIFECYCLE_CONFIG[song.lifecycle] || LIFECYCLE_CONFIG.RISING;
  const signal    = SIGNAL_CONFIG[song.signal]       || SIGNAL_CONFIG.postNow;

  const streams = song.streams_today && Number(song.streams_today) > 0
    ? Number(song.streams_today) > 1_000_000
      ? `${(Number(song.streams_today) / 1_000_000).toFixed(1)}M`
      : `${(Number(song.streams_today) / 1_000).toFixed(0)}K`
    : null;

  return (
    <motion.div
      variants={item}
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="bg-card border border-border rounded-2xl p-4 hover:shadow-warm transition-shadow"
    >
      <div className="flex items-start gap-3">
        {/* Rank badge */}
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="font-heading text-sm font-bold text-primary">
            {song.chart_position || '—'}
          </span>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0">
              <h4 className="font-body font-semibold text-sm text-foreground truncate">{song.title}</h4>
              <p className="text-muted-foreground text-xs font-body truncate">{song.artist}</p>
            </div>
            {/* Signal badge */}
            <span className={`flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-body font-semibold border ${signal.class}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${signal.dot}`} />
              {signal.label}
            </span>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-2 flex-wrap mt-2">
            {/* Lifecycle */}
            <span className={`px-2 py-0.5 rounded-pill text-[10px] font-body font-semibold border ${lifecycle.class}`}>
              {lifecycle.emoji} {lifecycle.label}
            </span>

            {/* Chart change */}
            {song.chart_change !== 0 && song.chart_change !== undefined && (
              <span className={`text-[10px] font-body font-semibold ${song.chart_change > 0 ? 'text-rising' : 'text-destructive'}`}>
                {song.chart_change > 0 ? `↑${song.chart_change}` : `↓${Math.abs(song.chart_change)}`}
              </span>
            )}

            {/* Streams */}
            {streams && (
              <span className="text-[10px] font-body text-muted-foreground">{streams} streams</span>
            )}

            {/* Source */}
            <span className="text-[10px] font-body text-muted-foreground capitalize ml-auto">{song.source}</span>
          </div>

          {/* Mood tags */}
          {song.mood_tags?.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {song.mood_tags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-1.5 py-0.5 rounded bg-muted text-[9px] font-body text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Songs Page ───────────────────────────────────────────────────────────

export default function Songs() {
  const { dbUser } = useFirebaseAuth();

  const [language,      setLanguage]      = useState('Hindi');
  const [lifecycleTab,  setLifecycleTab]  = useState('all');
  const [showPredict,   setShowPredict]   = useState(false);

  const niche = dbUser?.niches?.[0] || 'general';

  const filters = {
    niche,
    language,
    ...(lifecycleTab !== 'all' ? { lifecycle: lifecycleTab } : {}),
    limit: '30',
  };

  // Don't fire until dbUser is loaded — prevents niche=undefined query
  const { data: songsData, isLoading, error, refetch } = useSongs(filters, !!dbUser);
  const { data: langsData }                               = useSongLanguages();
  const { data: predictData, isLoading: predictLoading }  = usePredictSongs();

  const songs       = songsData?.data?.songs       || [];
  const fromCache   = songsData?.data?.fromCache;
  const languages   = langsData?.data             || [{ language: 'Hindi' }, { language: 'English' }, { language: 'Punjabi' }];
  const predictions = predictData?.data            || [];

  // Split songs by signal for summary stats
  const postNowCount  = songs.filter((s) => s.signal === 'postNow').length;
  const peakingCount  = songs.filter((s) => s.lifecycle === 'PEAKING').length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

      {/* Header */}
      <motion.div variants={item} className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl text-foreground mb-1">Trending Songs</h1>
          <p className="text-muted-foreground font-body text-sm">
            3-tier intelligence · refreshed every 6h
            {fromCache === false && <span className="ml-2 text-rising">● live</span>}
            {fromCache === true  && <span className="ml-2 text-muted-foreground">● cached</span>}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 rounded-xl border border-border hover:bg-muted transition-colors"
          title="Refresh"
        >
          <RefreshCw size={14} className="text-muted-foreground" />
        </button>
      </motion.div>

      {/* Summary stats */}
      {songs.length > 0 && (
        <motion.div variants={item} className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="font-heading text-xl text-rising">{postNowCount}</div>
            <div className="font-body text-xs text-muted-foreground mt-0.5">Post Now</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="font-heading text-xl text-orange-400">{peakingCount}</div>
            <div className="font-body text-xs text-muted-foreground mt-0.5">Peaking</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="font-heading text-xl text-foreground">{songs.length}</div>
            <div className="font-body text-xs text-muted-foreground mt-0.5">Total tracked</div>
          </div>
        </motion.div>
      )}

      {/* Language filter */}
      <motion.div variants={item} className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {languages.map((l) => (
          <button
            key={l.language}
            onClick={() => setLanguage(l.language)}
            className={`px-3 py-1.5 rounded-pill text-xs font-body font-semibold whitespace-nowrap transition-colors border ${
              language === l.language
                ? 'bg-primary text-white border-primary'
                : 'bg-card border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {l.language}
            {l.count && <span className="ml-1 opacity-60">({l.count})</span>}
          </button>
        ))}
      </motion.div>

      {/* Lifecycle tab filter */}
      <motion.div variants={item} className="flex gap-2 border-b border-border pb-0 overflow-x-auto scrollbar-hide">
        {LIFECYCLE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setLifecycleTab(tab.id)}
            className={`px-3 py-2 text-sm font-body font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
              lifecycleTab === tab.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}

        {/* Predict button — Pro */}
        {dbUser?.is_pro && (
          <button
            onClick={() => setShowPredict((v) => !v)}
            className={`ml-auto px-3 py-2 text-sm font-body font-semibold whitespace-nowrap transition-colors flex items-center gap-1 border-b-2 -mb-px ${
              showPredict
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Zap size={12} /> Predictions
          </button>
        )}
      </motion.div>

      {/* Prediction panel (Pro) */}
      <AnimatePresence>
        {showPredict && dbUser?.is_pro && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} className="text-primary" />
                <span className="font-body font-semibold text-sm text-foreground">ARIA Predictions — Rising before top 10</span>
              </div>
              {predictLoading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}
                </div>
              ) : predictions.length > 0 ? (
                <div className="space-y-2">
                  {predictions.map((song) => (
                    <SongCard key={song.id} song={song} index={0} />
                  ))}
                </div>
              ) : (
                <p className="font-body text-sm text-muted-foreground">No predictions available yet. Check back after the next refresh.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Song list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <XCircle className="mx-auto mb-2 text-destructive" size={24} />
          <p className="font-body text-sm text-muted-foreground">Could not load songs. Tap refresh to try again.</p>
        </div>
      ) : songs.length === 0 ? (
        <div className="text-center py-12">
          <Music className="mx-auto mb-2 text-muted-foreground" size={24} />
          <p className="font-body text-sm text-muted-foreground">
            No songs found for {language} / {lifecycleTab !== 'all' ? lifecycleTab : 'all lifecycle stages'}.
          </p>
          <p className="font-body text-xs text-muted-foreground mt-1">Data refreshes every 6 hours.</p>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {songs.map((song, i) => (
            <SongCard key={song.id || `${song.title}-${i}`} song={song} index={i} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
