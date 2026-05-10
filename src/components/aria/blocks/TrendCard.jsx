import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Flame, Zap, ExternalLink, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const velocityColor = (v = 0) => {
  if (v >= 80) return 'text-red-500';
  if (v >= 60) return 'text-orange-500';
  if (v >= 40) return 'text-primary';
  return 'text-muted-foreground';
};

const velocityBg = (v = 0) => {
  if (v >= 80) return 'bg-red-500';
  if (v >= 60) return 'bg-orange-500';
  if (v >= 40) return 'bg-primary';
  return 'bg-muted-foreground';
};

const sourceBadge = (source = '') => {
  const s = source.toLowerCase();
  if (s.includes('reddit'))   return { label: 'Reddit',    cls: 'bg-orange-500/15 text-orange-600 border-orange-500/20' };
  if (s.includes('youtube'))  return { label: 'YouTube',   cls: 'bg-red-500/15 text-red-600 border-red-500/20' };
  if (s.includes('tiktok'))   return { label: 'TikTok',    cls: 'bg-pink-500/15 text-pink-600 border-pink-500/20' };
  if (s.includes('instagram'))return { label: 'Instagram', cls: 'bg-purple-500/15 text-purple-600 border-purple-500/20' };
  if (s.includes('google'))   return { label: 'Trends',    cls: 'bg-blue-500/15 text-blue-600 border-blue-500/20' };
  if (s.includes('pinterest'))return { label: 'Pinterest', cls: 'bg-rose-500/15 text-rose-600 border-rose-500/20' };
  return { label: source, cls: 'bg-muted text-muted-foreground border-border' };
};

function TrendRow({ trend, index }) {
  const navigate = useNavigate();
  const badge = sourceBadge(trend.source);
  const vel = trend.velocity ?? trend.score ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.2 }}
      className="group flex items-start gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer"
      onClick={() => navigate('/dashboard/discover')}
    >
      {/* Rank */}
      <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold font-body text-primary mt-0.5">
        {index + 1}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-body font-semibold text-sm text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
            {trend.title || trend.query || 'Untitled Trend'}
          </p>
          {/* Velocity badge */}
          <div className="shrink-0 flex items-center gap-1">
            <Flame size={11} className={velocityColor(vel)} />
            <span className={`text-[11px] font-bold font-body ${velocityColor(vel)}`}>{vel}</span>
          </div>
        </div>

        {/* Description */}
        {trend.description && (
          <p className="font-body text-xs text-muted-foreground mt-0.5 line-clamp-1 leading-relaxed">
            {trend.description}
          </p>
        )}

        {/* Bottom row */}
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold font-body border ${badge.cls}`}>
            {badge.label}
          </span>
          {/* Velocity bar */}
          <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(vel, 100)}%` }}
              transition={{ delay: index * 0.06 + 0.2, duration: 0.5, ease: 'easeOut' }}
              className={`h-full rounded-full ${velocityBg(vel)}`}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function TrendCard({ data }) {
  const navigate = useNavigate();

  // Normalise: data can be { trends: [...] } or a raw array
  const rawTrends = Array.isArray(data)
    ? data
    : Array.isArray(data?.trends)
    ? data.trends
    : Array.isArray(data?.results)
    ? data.results
    : [];

  const trends = rawTrends.slice(0, 6);

  if (!trends.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mt-3 w-full max-w-xl bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp size={14} className="text-primary" />
          </div>
          <span className="font-heading text-sm text-foreground">Live Trends</span>
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold font-body">
            {trends.length}
          </span>
        </div>
        <button
          onClick={() => navigate('/dashboard/discover')}
          className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          View all <ExternalLink size={10} />
        </button>
      </div>

      {/* Trends list */}
      <div className="px-1 py-1.5 space-y-0.5">
        {trends.map((t, i) => (
          <TrendRow key={i} trend={t} index={i} />
        ))}
      </div>

      {/* CTA footer */}
      <div className="px-4 py-2.5 border-t border-border bg-muted/30">
        <button
          onClick={() => navigate('/dashboard/studio')}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          <Sparkles size={12} />
          Create content from a trend
        </button>
      </div>
    </motion.div>
  );
}
