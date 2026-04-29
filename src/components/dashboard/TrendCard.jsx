import React from 'react';
import { motion } from 'framer-motion';

const badgeStyles = {
  HOT: 'bg-primary text-white',
  RISING: 'bg-rising text-white',
  NEW: 'bg-new-badge text-white',
};

export default function TrendCard({ trend }) {
  const scoreColor = trend.score >= 90 ? 'text-primary' : trend.score >= 80 ? 'text-rising' : 'text-muted-foreground';

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="bg-card border border-border rounded-xl p-4 min-w-[260px] max-w-[280px] flex-shrink-0 cursor-pointer hover:shadow-warm transition-shadow group"
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`px-2.5 py-0.5 rounded-pill text-[10px] font-body font-semibold ${badgeStyles[trend.badge]}`}>
          {trend.badge}
        </span>
        <div className={`w-9 h-9 rounded-full border-2 border-current flex items-center justify-center ${scoreColor}`}>
          <span className="text-xs font-body font-bold">{trend.score}</span>
        </div>
      </div>
      <h4 className="font-body font-semibold text-sm text-foreground mb-1 line-clamp-1">{trend.title}</h4>
      <p className="text-muted-foreground font-body text-xs leading-relaxed line-clamp-2 mb-3">{trend.description}</p>
      <button className="text-primary text-xs font-body font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
        Create now →
      </button>
    </motion.div>
  );
}