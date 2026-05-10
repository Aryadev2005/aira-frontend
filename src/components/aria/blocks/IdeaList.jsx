import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Sparkles, ChevronDown, ChevronUp, ArrowRight, Video, FileText, Image as ImageIcon, Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const formatIcon = (fmt = '') => {
  const f = fmt.toLowerCase();
  if (f.includes('reel') || f.includes('short') || f.includes('video')) return Video;
  if (f.includes('post') || f.includes('static') || f.includes('carousel')) return ImageIcon;
  if (f.includes('blog') || f.includes('article') || f.includes('script')) return FileText;
  if (f.includes('podcast') || f.includes('audio')) return Mic;
  return Sparkles;
};

const formatColor = (fmt = '') => {
  const f = fmt.toLowerCase();
  if (f.includes('reel') || f.includes('short')) return 'bg-pink-500/10 text-pink-600 border-pink-500/20';
  if (f.includes('post') || f.includes('carousel')) return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
  if (f.includes('script') || f.includes('blog')) return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
  return 'bg-primary/10 text-primary border-primary/20';
};

function IdeaRow({ idea, index, onDraft }) {
  const [expanded, setExpanded] = useState(false);
  const FmtIcon = formatIcon(idea.format || idea.contentFormat || '');
  const fmtCls = formatColor(idea.format || idea.contentFormat || '');
  const hook = idea.hook || idea.title || idea.idea || 'Content Idea';
  const format = idea.format || idea.contentFormat || idea.type || 'Reel';
  const platform = idea.platform || idea.targetPlatform || '';
  const reasoning = idea.reasoning || idea.why || idea.description || '';
  const source = idea.source || idea.trendSource || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.2 }}
      className="border border-border rounded-xl overflow-hidden bg-background"
    >
      {/* Main row */}
      <div
        className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Number */}
        <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold font-body text-primary mt-0.5">
          {index + 1}
        </span>

        <div className="flex-1 min-w-0">
          <p className="font-body font-semibold text-sm text-foreground leading-snug">
            {hook}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold font-body border ${fmtCls}`}>
              <FmtIcon size={9} />
              {format}
            </span>
            {platform && (
              <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-body border border-border">
                {platform}
              </span>
            )}
            {source && (
              <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-body border border-border">
                via {source}
              </span>
            )}
          </div>
        </div>

        {/* Expand toggle */}
        <button className="shrink-0 p-1 rounded-lg hover:bg-muted transition-colors mt-0.5">
          {expanded ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
        </button>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0 border-t border-border">
              {reasoning && (
                <p className="font-body text-xs text-muted-foreground leading-relaxed mt-2">
                  {reasoning}
                </p>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onDraft(idea); }}
                className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold font-body hover:bg-primary/90 transition-colors"
              >
                <Sparkles size={11} />
                Draft this in Studio
                <ArrowRight size={10} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function IdeaList({ data }) {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  // Normalise: { ideas: [...] } or raw array
  const rawIdeas = Array.isArray(data)
    ? data
    : Array.isArray(data?.ideas)
    ? data.ideas
    : Array.isArray(data?.results)
    ? data.results
    : [];

  const ideas = showAll ? rawIdeas : rawIdeas.slice(0, 4);

  if (!ideas.length) return null;

  const handleDraft = (idea) => {
    navigate('/dashboard/studio', {
      state: { idea: idea.hook || idea.title || idea.idea, format: idea.format },
    });
  };

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
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Lightbulb size={14} className="text-amber-600" />
          </div>
          <span className="font-heading text-sm text-foreground">Content Ideas</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 text-[10px] font-bold font-body">
            {rawIdeas.length}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground font-body">Tap to expand</span>
      </div>

      {/* Ideas */}
      <div className="p-3 space-y-2">
        {ideas.map((idea, i) => (
          <IdeaRow key={i} idea={idea} index={i} onDraft={handleDraft} />
        ))}
      </div>

      {/* Show more / less */}
      {rawIdeas.length > 4 && (
        <div className="px-4 py-2.5 border-t border-border">
          <button
            onClick={() => setShowAll(v => !v)}
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            {showAll ? '▲ Show less' : `▼ Show ${rawIdeas.length - 4} more ideas`}
          </button>
        </div>
      )}
    </motion.div>
  );
}
