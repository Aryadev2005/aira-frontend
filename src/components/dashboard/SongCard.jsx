import React from 'react';
import { motion } from 'framer-motion';
import { Music } from 'lucide-react';

const signalStyles = {
  postNow: { label: 'Post Now', class: 'bg-rising/10 text-rising' },
  wait: { label: 'Wait', class: 'bg-primary/10 text-primary' },
  tooLate: { label: 'Too Late', class: 'bg-muted text-muted-foreground' },
};

export default function SongCard({ song }) {
  const signal = signalStyles[song.signal];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="bg-card border border-border rounded-xl p-4 min-w-[220px] max-w-[240px] flex-shrink-0 hover:shadow-warm transition-shadow"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Music size={18} className="text-primary" />
        </div>
        <div className="min-w-0">
          <h4 className="font-body font-semibold text-sm text-foreground truncate">{song.title}</h4>
          <p className="text-muted-foreground text-xs font-body truncate">{song.artist}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-rising text-xs font-body font-semibold">{song.growth}</span>
        <span className={`px-2 py-0.5 rounded-pill text-[10px] font-body font-semibold ${signal.class}`}>
          {signal.label}
        </span>
      </div>
    </motion.div>
  );
}