import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Music, TrendingUp } from 'lucide-react';
import { useSongs, useProfile } from '@/hooks/useApi';

const signalStyles = {
  postNow: { label: 'Post Now', class: 'bg-rising/10 text-rising' },
  wait: { label: 'Wait', class: 'bg-primary/10 text-primary' },
  tooLate: { label: 'Too Late', class: 'bg-muted text-muted-foreground' },
};

const signals = ['All', 'postNow', 'wait', 'tooLate'];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25 } }
};

export default function Songs() {
  const [filter, setFilter] = useState('All');

  const { data: profileData } = useProfile();
  const niche = profileData?.data?.user?.niches?.[0];
  const platform = profileData?.data?.user?.primary_platform;

  const { data: songsData, isLoading, error } = useSongs({ niche, limit: 20 });

  const songs = songsData?.data || [];
  const filtered = filter === 'All' ? songs : songs.filter((s) => s.signal === filter);

  if (isLoading) return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
    </div>
  );

  if (error) return (
    <div className="bg-destructive/10 text-destructive rounded-xl p-4 font-body text-sm">
      Could not load songs. {error.message}
    </div>
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="font-heading text-2xl text-foreground mb-1">Songs</h1>
        <p className="text-muted-foreground font-body text-sm">Trending audio with lifecycle signals</p>
      </motion.div>

      <motion.div variants={item} className="flex gap-2 flex-wrap">
        {signals.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-pill text-xs font-body font-semibold transition-colors ${
              filter === s
                ? 'bg-foreground text-background'
                : 'bg-card border border-border text-muted-foreground'
            }`}
          >
            {s === 'All' ? 'All' : signalStyles[s].label}
          </button>
        ))}
      </motion.div>

      {/* Top 10 Header */}
      <motion.div variants={item} className="bg-accent text-accent-foreground rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={18} className="text-primary" />
          <span className="font-body font-semibold text-sm text-accent-foreground">Top 10 This Week</span>
        </div>
        <p className="text-accent-foreground/60 font-body text-xs">Hottest tracks across Indian social media right now</p>
      </motion.div>

      <motion.div variants={container} className="space-y-3">
        {filtered.map((song, i) => (
          <motion.div
            key={song.id}
            variants={item}
            whileHover={{ scale: 1.01 }}
            className="bg-card border border-border rounded-xl p-4 hover:shadow-warm-sm transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Music size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-muted-foreground text-xs font-body font-bold">#{i + 1}</span>
                  <h4 className="font-body font-semibold text-sm text-foreground truncate">{song.title}</h4>
                </div>
                <p className="text-muted-foreground text-xs font-body">{song.artist} · {song.genre}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-rising text-xs font-body font-semibold">{song.growth}</span>
                <span className={`px-2.5 py-0.5 rounded-pill text-[10px] font-body font-semibold ${signalStyles[song.signal].class}`}>
                  {signalStyles[song.signal].label}
                </span>
              </div>
            </div>
            {(song.tip || song.ai_tip) && (
              <div className="mt-3 px-3 py-2 bg-primary/5 rounded-lg">
                <p className="text-primary/80 text-xs font-body">💡 {song.tip || song.ai_tip}</p>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}