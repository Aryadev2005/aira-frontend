// src/pages/dashboard/Profile.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, BarChart2, Map, Pencil, X, Check, Sparkles,
  RefreshCw, AlertCircle, ChevronDown, ChevronUp, Clock,
  Target, Zap, TrendingUp, User, Mic, Image, Layout,
  Globe, Lock, CheckCircle2, Circle,
} from 'lucide-react';
import {
  useAriaIdentity,
  useUpdateAriaMemory,
  useDeleteAriaMemory,
  usePersonalisedRoadmap,
} from '@/hooks/useApi';
import { useFirebaseAuth } from '@/lib/FirebaseAuthContext';

// ── Animation presets ─────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', damping: 24, stiffness: 280 } },
};

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06 } },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const confidenceDot = (score) => {
  if (score >= 75) return 'bg-rising';
  if (score >= 50) return 'bg-yellow-400';
  return 'bg-destructive';
};

const confidenceLabel = (score) => {
  if (score >= 75) return 'High confidence';
  if (score >= 50) return 'Medium confidence';
  return 'Low confidence';
};

function timeAgo(dateStr) {
  if (!dateStr) return 'Unknown';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  if (days > 0)  return `${days} day${days === 1 ? '' : 's'} ago`;
  if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return 'Just now';
}

const categoryIcon = (category) => {
  const map = {
    tone:               Mic,
    content_format:     Layout,
    content_territory:  Globe,
    personal_constraint: Lock,
    schedule:           Clock,
    audience:           User,
    brand_voice:        Sparkles,
    goal:               Target,
    interest_signal:    TrendingUp,
    hook_language:      Mic,
  };
  const Icon = map[category] || Brain;
  return <Icon size={11} className="opacity-60" />;
};

const categoryLabel = (cat) => ({
  tone:               'Tone',
  content_format:     'Format',
  content_territory:  'Territory',
  personal_constraint:'Constraint',
  schedule:           'Schedule',
  audience:           'Audience',
  brand_voice:        'Voice',
  goal:               'Goal',
  interest_signal:    'Interest',
  hook_language:      'Language',
}[cat] || cat);

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — ARIA KNOWS
// ══════════════════════════════════════════════════════════════════════════════

function ARIAKnowsTab() {
  const { data, isLoading, error } = useAriaIdentity();
  const { mutateAsync: updateMemory, isPending: updateLoading } = useUpdateAriaMemory();
  const { mutateAsync: deleteMemory, isPending: deleteLoading } = useDeleteAriaMemory();

  const [editingKey, setEditingKey]   = useState(null); // "category::key"
  const [editValue,  setEditValue]    = useState('');
  const [deletingKey, setDeletingKey] = useState(null);
  const [savedKey,   setSavedKey]     = useState(null);

  const identity  = data?.data;
  const portrait  = identity?.voicePortrait;
  const memories  = identity?.keyMemories || [];
  const stats     = identity?.suggestionStats;
  const age       = identity?.portraitAge;

  const handleEditStart = (mem) => {
    setEditingKey(`${mem.category}::${mem.key}`);
    setEditValue(mem.value);
    setDeletingKey(null);
  };

  const handleEditSave = async (mem) => {
    if (!editValue.trim()) return;
    try {
      await updateMemory({ category: mem.category, key: mem.key, value: editValue.trim() });
      setSavedKey(`${mem.category}::${mem.key}`);
      setTimeout(() => setSavedKey(null), 2000);
      setEditingKey(null);
    } catch {}
  };

  const handleDelete = async (mem) => {
    if (deletingKey !== `${mem.category}::${mem.key}`) {
      setDeletingKey(`${mem.category}::${mem.key}`);
      setEditingKey(null);
      return;
    }
    try {
      await deleteMemory({ category: mem.category, key: mem.key });
      setDeletingKey(null);
    } catch {}
  };

  if (isLoading) {
    return (
      <div className="space-y-3 pt-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !identity) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Brain size={32} className="text-muted-foreground mb-3" />
        <p className="font-body text-sm text-muted-foreground">
          ARIA is still getting to know you.
        </p>
        <p className="font-body text-xs text-muted-foreground mt-1">
          Keep using ARIA and this will fill in over the next few days.
        </p>
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4 pt-1">

      {/* Portrait hero card */}
      {portrait?.contentTerritory && (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-primary/20 bg-primary/5 p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="font-body text-xs text-primary font-semibold uppercase tracking-wider mb-1">
                ARIA's understanding of you
              </p>
              <p className="font-heading text-base text-foreground leading-snug">
                {portrait.contentTerritory}
              </p>
            </div>
            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles size={14} className="text-primary" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className={`w-2 h-2 rounded-full ${portrait.confidence >= 0.6 ? 'bg-rising' : 'bg-yellow-400'}`} />
            <p className="font-body text-xs text-muted-foreground">
              {Math.round((portrait.confidence || 0) * 100)}% confident · Updated {age || 'recently'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Voice attributes grid */}
      {portrait && (
        <motion.div variants={fadeUp}>
          <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            Voice attributes
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Tone',     value: portrait.toneSignature },
              { label: 'Language', value: portrait.preferredLanguage },
              { label: 'Energy',   value: portrait.energyLevel },
              { label: 'Formats',  value: portrait.preferredFormats?.join(' · ') },
            ].filter(a => a.value).map(attr => (
              <div key={attr.label} className="bg-card border border-border rounded-xl px-3 py-2.5">
                <p className="font-body text-[10px] text-muted-foreground mb-0.5">{attr.label}</p>
                <p className="font-body text-sm text-foreground font-medium capitalize leading-tight">
                  {attr.value}
                </p>
              </div>
            ))}
          </div>
          {portrait.audienceDescription && (
            <div className="mt-2 bg-card border border-border rounded-xl px-3 py-2.5">
              <p className="font-body text-[10px] text-muted-foreground mb-0.5">Audience</p>
              <p className="font-body text-sm text-foreground">{portrait.audienceDescription}</p>
            </div>
          )}
          {portrait.personalConstraints?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {portrait.personalConstraints.map(c => (
                <span key={c} className="flex items-center gap-1 px-2 py-1 rounded-pill bg-muted text-xs font-body text-muted-foreground">
                  <Lock size={9} /> {c}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Editable memories */}
      {memories.length > 0 && (
        <motion.div variants={fadeUp}>
          <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            Things ARIA has noticed
          </p>
          <div className="space-y-2">
            {memories.map((mem) => {
              const compKey = `${mem.category}::${mem.key}`;
              const isEditing  = editingKey  === compKey;
              const isDeleting = deletingKey === compKey;
              const isSaved    = savedKey    === compKey;

              return (
                <motion.div
                  key={compKey}
                  layout
                  className={`rounded-xl border px-3 py-2.5 transition-colors ${
                    isEditing
                      ? 'border-primary/40 bg-primary/5'
                      : isDeleting
                      ? 'border-destructive/30 bg-destructive/5'
                      : 'border-border bg-card'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        {categoryIcon(mem.category)}
                        <p className="font-body text-[10px] text-muted-foreground">
                          {categoryLabel(mem.category)}
                        </p>
                      </div>
                      <input
                        autoFocus
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter')  handleEditSave(mem);
                          if (e.key === 'Escape') setEditingKey(null);
                        }}
                        className="w-full bg-background border border-border rounded-lg px-3 py-1.5 font-body text-sm text-foreground focus:outline-none focus:border-primary"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditSave(mem)}
                          disabled={updateLoading}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary text-white text-xs font-body font-semibold disabled:opacity-50"
                        >
                          <Check size={11} /> Save
                        </button>
                        <button
                          onClick={() => setEditingKey(null)}
                          className="px-3 py-1 rounded-lg border border-border text-xs font-body text-muted-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : isDeleting ? (
                    <div className="space-y-2">
                      <p className="font-body text-sm text-foreground">
                        Remove "<span className="font-semibold">{mem.value}</span>" from ARIA's memory?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(mem)}
                          disabled={deleteLoading}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-destructive text-white text-xs font-body font-semibold disabled:opacity-50"
                        >
                          <X size={11} /> Remove
                        </button>
                        <button
                          onClick={() => setDeletingKey(null)}
                          className="px-3 py-1 rounded-lg border border-border text-xs font-body text-muted-foreground"
                        >
                          Keep it
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {categoryIcon(mem.category)}
                          <p className="font-body text-[10px] text-muted-foreground">
                            {categoryLabel(mem.category)}
                          </p>
                          <span className={`w-1.5 h-1.5 rounded-full ml-auto ${confidenceDot(mem.confidence)}`} title={confidenceLabel(mem.confidence)} />
                        </div>
                        <p className="font-body text-sm text-foreground truncate">
                          {isSaved ? (
                            <span className="text-rising flex items-center gap-1">
                              <CheckCircle2 size={12} /> Saved
                            </span>
                          ) : mem.value}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEditStart(mem)}
                          className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                        >
                          <Pencil size={12} className="text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(mem)}
                          className="w-7 h-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center transition-colors"
                        >
                          <X size={12} className="text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Suggestion stats */}
      {stats && stats.totalSuggestions > 0 && (
        <motion.div variants={fadeUp} className="bg-card border border-border rounded-2xl p-4">
          <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            ARIA's suggestions
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="font-heading text-xl text-foreground">{stats.totalSuggestions}</p>
              <p className="font-body text-[10px] text-muted-foreground mt-0.5">Total made</p>
            </div>
            <div>
              <p className="font-heading text-xl text-rising">
                {Math.round((stats.followRate || 0) * 100)}%
              </p>
              <p className="font-body text-[10px] text-muted-foreground mt-0.5">You followed</p>
            </div>
            <div>
              <p className="font-heading text-xl text-foreground capitalize">
                {stats.topFollowedTypes?.[0]?.replace('_', ' ') || '—'}
              </p>
              <p className="font-body text-[10px] text-muted-foreground mt-0.5">Top type</p>
            </div>
          </div>
        </motion.div>
      )}

    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — ROADMAP
// ══════════════════════════════════════════════════════════════════════════════

function RoadmapTab() {
  const [forceRefresh, setForceRefresh]   = useState(false);
  const [expandedWeek, setExpandedWeek]   = useState(0);
  const [expandedAction, setExpandedAction] = useState(null);

  const { data, isLoading, error, refetch } = usePersonalisedRoadmap(forceRefresh);
  const roadmap = data?.data;

  const handleRefresh = async () => {
    setForceRefresh(true);
    await refetch();
    setTimeout(() => setForceRefresh(false), 500);
  };

  if (isLoading) {
    return (
      <div className="space-y-3 pt-2">
        <div className="h-24 bg-muted rounded-2xl animate-pulse" />
        <div className="h-16 bg-muted rounded-2xl animate-pulse" />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Map size={32} className="text-muted-foreground mb-3" />
        <p className="font-body text-sm text-muted-foreground">
          Could not load your roadmap.
        </p>
        <button
          onClick={handleRefresh}
          className="mt-3 px-4 py-2 rounded-xl bg-primary text-white text-sm font-body font-semibold"
        >
          Try again
        </button>
      </div>
    );
  }

  const weeks = Object.entries(roadmap.weeklyPlan || {});

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4 pt-1">

      {/* Header with refresh */}
      <div className="flex items-center justify-between px-1">
        <p className="font-body text-xs text-muted-foreground">
          {data?.data?.fromCache !== false ? 'Personalised for you' : 'Just generated'}
        </p>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-1 text-xs font-body text-primary font-semibold hover:opacity-80 transition-opacity"
        >
          <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Current situation */}
      {roadmap.currentSituation && (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-primary/25 bg-primary/5 p-4"
        >
          <p className="font-body text-[10px] font-semibold text-primary uppercase tracking-wider mb-2">
            Where you are right now
          </p>
          <p className="font-body text-sm text-foreground leading-relaxed">
            {roadmap.currentSituation}
          </p>
        </motion.div>
      )}

      {/* Core challenge */}
      {roadmap.coreChallenge && (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-border bg-card p-4"
        >
          <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            The one thing holding you back
          </p>
          <p className="font-body text-sm text-foreground font-semibold leading-snug">
            {roadmap.coreChallenge}
          </p>
        </motion.div>
      )}

      {/* Weekly plan */}
      {weeks.length > 0 && (
        <motion.div variants={fadeUp} className="space-y-2">
          <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Your 4-week plan
          </p>
          {weeks.map(([weekKey, weekData], idx) => {
            const isOpen = expandedWeek === idx;
            const weekNum = idx + 1;

            return (
              <div key={weekKey} className="rounded-2xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setExpandedWeek(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div>
                    <p className="font-body text-xs text-muted-foreground mb-0.5">Week {weekNum}</p>
                    <p className="font-body text-sm text-foreground font-semibold">
                      {weekData.focus}
                    </p>
                  </div>
                  {isOpen ? (
                    <ChevronUp size={16} className="text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown size={16} className="text-muted-foreground flex-shrink-0" />
                  )}
                </button>

                <AnimatePresence>
                  {isOpen && weekData.actions?.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                        {weekData.actions.map((action, aIdx) => {
                          const actionKey = `${idx}-${aIdx}`;
                          const actionOpen = expandedAction === actionKey;

                          return (
                            <div key={aIdx} className="space-y-1">
                              <div className="flex items-start gap-2">
                                <Circle size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="font-body text-sm text-foreground font-medium">
                                    {action.action}
                                  </p>
                                  {action.why && (
                                    <p className="font-body text-xs text-muted-foreground mt-0.5">
                                      {action.why}
                                    </p>
                                  )}
                                  {action.howTo && (
                                    <button
                                      onClick={() => setExpandedAction(actionOpen ? null : actionKey)}
                                      className="mt-1 text-[11px] font-body text-primary font-semibold flex items-center gap-0.5"
                                    >
                                      {actionOpen ? 'Hide' : 'How to do this'}
                                      {actionOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                    </button>
                                  )}
                                  <AnimatePresence>
                                    {actionOpen && action.howTo && (
                                      <motion.p
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="font-body text-xs text-foreground/70 mt-1 overflow-hidden"
                                      >
                                        {action.howTo}
                                      </motion.p>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Milestones */}
      {roadmap.milestones?.length > 0 && (
        <motion.div variants={fadeUp} className="space-y-2">
          <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Milestones
          </p>
          {roadmap.milestones.map((m, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Target size={13} className="text-primary" />
                  </div>
                  <p className="font-body text-sm text-foreground font-semibold">{m.target}</p>
                </div>
                <span className="text-xs font-body text-muted-foreground bg-muted px-2 py-0.5 rounded-pill flex-shrink-0">
                  {m.eta}
                </span>
              </div>
              {m.unlocks && (
                <p className="font-body text-xs text-muted-foreground ml-9 mb-2">
                  Unlocks: {m.unlocks}
                </p>
              )}
              {m.triggerAction && (
                <div className="ml-9 bg-primary/5 border border-primary/15 rounded-xl px-3 py-2">
                  <p className="font-body text-[10px] text-primary font-semibold mb-0.5">Key action</p>
                  <p className="font-body text-xs text-foreground">{m.triggerAction}</p>
                </div>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {/* Content strategy */}
      {roadmap.contentStrategy && (
        <motion.div variants={fadeUp} className="bg-card border border-border rounded-2xl p-4">
          <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Content strategy
          </p>
          <div className="space-y-2">
            {roadmap.contentStrategy.frequency && (
              <div className="flex items-center justify-between">
                <p className="font-body text-xs text-muted-foreground">Posting frequency</p>
                <p className="font-body text-xs text-foreground font-semibold">{roadmap.contentStrategy.frequency}</p>
              </div>
            )}
            {roadmap.contentStrategy.bestTimes && (
              <div className="flex items-center justify-between">
                <p className="font-body text-xs text-muted-foreground">Best times</p>
                <p className="font-body text-xs text-foreground font-semibold">{roadmap.contentStrategy.bestTimes}</p>
              </div>
            )}
            {roadmap.contentStrategy.topicPillars?.length > 0 && (
              <div>
                <p className="font-body text-xs text-muted-foreground mb-1.5">Topic pillars</p>
                <div className="flex flex-wrap gap-1.5">
                  {roadmap.contentStrategy.topicPillars.map((p, i) => (
                    <span key={i} className="px-2 py-1 rounded-pill bg-muted text-xs font-body text-foreground">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Immediate action — orange card */}
      {roadmap.immediateAction && (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl bg-primary p-5 text-white"
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap size={15} className="text-white/80" />
            <p className="font-body text-[11px] font-semibold text-white/80 uppercase tracking-wider">
              Do this in the next 24 hours
            </p>
          </div>
          <p className="font-body text-sm text-white font-semibold leading-snug">
            {roadmap.immediateAction}
          </p>
        </motion.div>
      )}

      {/* Growth projection */}
      {roadmap.growthProjection && (
        <motion.div variants={fadeUp} className="bg-card border border-border rounded-2xl p-4">
          <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            3-month projection
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted rounded-xl p-3 text-center">
              <p className="font-body text-[10px] text-muted-foreground mb-1">Conservative</p>
              <p className="font-body text-sm text-foreground font-semibold">
                {roadmap.growthProjection.conservative}
              </p>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-center">
              <p className="font-body text-[10px] text-primary mb-1">Optimistic</p>
              <p className="font-body text-sm text-foreground font-semibold">
                {roadmap.growthProjection.optimistic}
              </p>
            </div>
          </div>
          {roadmap.growthProjection.keyAssumption && (
            <p className="font-body text-xs text-muted-foreground mt-2">
              Assumes: {roadmap.growthProjection.keyAssumption}
            </p>
          )}
        </motion.div>
      )}

    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PROFILE PAGE
// ══════════════════════════════════════════════════════════════════════════════

const TABS = [
  { id: 'aria',     label: 'ARIA Knows', icon: Brain },
  { id: 'roadmap',  label: 'Roadmap',    icon: Map },
  { id: 'analytics',label: 'Analytics',  icon: BarChart2 },
];

export default function Profile() {
  const [activeTab, setActiveTab] = useState('aria');
  const { dbUser } = useFirebaseAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="px-4 pt-4 pb-3">
          <h1 className="font-heading text-2xl text-foreground">Profile</h1>
          {dbUser?.name && (
            <p className="font-body text-sm text-muted-foreground mt-0.5">
              {dbUser.name}
            </p>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-border px-4 gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-body font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  active
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 py-4 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'aria' && (
            <motion.div
              key="aria"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <ARIAKnowsTab />
            </motion.div>
          )}
          {activeTab === 'roadmap' && (
            <motion.div
              key="roadmap"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <RoadmapTab />
            </motion.div>
          )}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {/* Your existing analytics content goes here */}
              {/* Paste whatever was previously rendered in Profile.jsx analytics tab */}
              <div className="py-8 text-center">
                <p className="font-body text-sm text-muted-foreground">
                  Analytics content — paste your existing analytics JSX here.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}