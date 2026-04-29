import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { mockTrends } from '@/lib/mockData';

export default function DailyBrief() {
  const brief = mockTrends[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-accent text-accent-foreground rounded-xl p-6 shadow-warm"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-primary text-white text-xs font-body font-semibold">
          AIRA DAILY BRIEF
        </span>
        <Sparkles size={18} className="text-primary" />
      </div>
      <p className="text-accent-foreground/80 font-body text-sm leading-relaxed mb-4">
        "{brief.recommendation}"
      </p>
      <Link to="/dashboard/discover" className="text-primary text-sm font-body font-medium hover:underline">
        → Start with Discover
      </Link>
    </motion.div>
  );
}