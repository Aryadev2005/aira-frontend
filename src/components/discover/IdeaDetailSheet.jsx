// src/components/discover/IdeaDetailSheet.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  X, Clapperboard, Zap, Globe, Clock, TrendingUp,
  ArrowRight, Sparkles, BookOpen
} from 'lucide-react';
import useCreatorFlow from '@/store/creatorFlow';

const sourceIconMap = {
  youtube:       '▶',
  reddit:        '🔴',
  tiktok:        '♪',
  pinterest:     '📌',
  google_trends: '📈',
  instagram:     '📸',
};

const badgeStyles = {
  HOT:    'bg-orange-500/15 text-orange-500 border border-orange-500/20',
  RISING: 'bg-blue-500/15 text-blue-500 border border-blue-500/20',
  NEW:    'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20',
};

export default function IdeaDetailSheet({ idea, onClose }) {
  const navigate      = useNavigate();
  const setSelectedIdea = useCreatorFlow((s) => s.setSelectedIdea);
  const setIdeaText     = useCreatorFlow((s) => s.setIdeaText);

  if (!idea) return null;

  const handleGoToStudio = () => {
    setSelectedIdea(idea);
    setIdeaText(idea.title);
    onClose();
    navigate('/dashboard/studio');
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet — slides up from bottom on mobile, slides in from right on desktop */}
      <motion.div
        key="sheet"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 lg:left-auto lg:right-0 lg:top-0 lg:bottom-0 lg:w-[440px]
                   bg-card border-t lg:border-t-0 lg:border-l border-border rounded-t-2xl lg:rounded-none
                   flex flex-col max-h-[92vh] lg:max-h-full overflow-hidden shadow-2xl"
      >
        {/* Drag indicator (mobile) */}
        <div className="lg:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-body font-semibold ${badgeStyles[idea.badge] || ''}`}>
              {idea.badge}
            </span>
            <span className="text-xs font-body text-muted-foreground capitalize">
              {idea.formatSuggestion || idea.format}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Source Signal — shown at top as designed */}
          {(idea.sources?.length > 0 || idea.whyNow) && (
            <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={13} className="text-primary" />
                <span className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Signal Source
                </span>
              </div>
              <div className="flex gap-2 flex-wrap mb-2">
                {(idea.sources || []).map((src) => (
                  <span
                    key={src}
                    className="text-xs font-body bg-background border border-border px-2 py-0.5 rounded-full text-muted-foreground"
                  >
                    {sourceIconMap[src] || '📊'} {src}
                  </span>
                ))}
              </div>
              <p className="font-body text-sm text-foreground leading-relaxed">
                {idea.whyNow || idea.growthSignal}
              </p>
            </div>
          )}

          {/* The idea itself */}
          <div>
            <h2 className="font-heading text-xl text-foreground leading-snug mb-2">
              {idea.title}
            </h2>
            <p className="font-body text-sm text-muted-foreground italic leading-relaxed">
              "{idea.contentAngle}"
            </p>
          </div>

          {/* Hook */}
          {idea.hook && (
            <div className="bg-primary/8 border border-primary/15 rounded-xl px-4 py-3">
              <p className="font-body text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                Opening Hook
              </p>
              <p className="font-body text-sm text-foreground font-medium leading-relaxed">
                "{idea.hook}"
              </p>
            </div>
          )}

          {/* ARIA Tip */}
          {idea.ariaTip && (
            <div className="flex gap-3">
              <Sparkles size={15} className="text-primary mt-0.5 shrink-0" />
              <p className="font-body text-sm text-muted-foreground leading-relaxed">
                <span className="text-foreground font-semibold">ARIA tip: </span>
                {idea.ariaTip}
              </p>
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="font-heading text-lg text-primary">{idea.velocityScore || idea.viralityScore}</p>
              <p className="font-body text-[10px] text-muted-foreground mt-0.5">Virality</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="font-heading text-sm text-foreground capitalize">
                {idea.formatSuggestion || idea.format || 'Reel'}
              </p>
              <p className="font-body text-[10px] text-muted-foreground mt-0.5">Format</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <Globe size={14} className="mx-auto text-muted-foreground mb-0.5" />
              <p className="font-body text-[10px] text-muted-foreground">{idea.geo || 'India'}</p>
            </div>
          </div>

          {/* Content gap note if applicable */}
          {idea.isContentGap && idea.contentGapNote && (
            <div className="flex gap-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3">
              <BookOpen size={14} className="text-emerald-600 mt-0.5 shrink-0" />
              <p className="font-body text-sm text-emerald-700 dark:text-emerald-400">
                <span className="font-semibold">Content gap: </span>
                {idea.contentGapNote}
              </p>
            </div>
          )}
        </div>

        {/* Action footer */}
        <div className="px-5 py-4 border-t border-border bg-card space-y-2">
          <button
            onClick={handleGoToStudio}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white
                       rounded-xl font-body font-semibold text-sm hover:bg-primary/90
                       active:scale-[0.98] transition-all shadow-warm"
          >
            <Clapperboard size={16} />
            Go to Studio
            <ArrowRight size={14} />
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-muted-foreground font-body text-sm
                       hover:text-foreground transition-colors rounded-xl hover:bg-muted"
          >
            Close
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
