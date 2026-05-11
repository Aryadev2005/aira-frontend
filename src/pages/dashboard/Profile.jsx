// @ts-nocheck
// src/pages/dashboard/Profile.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  BarChart2,
  Map,
  Pencil,
  X,
  Check,
  Sparkles,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Target,
  Zap,
  TrendingUp,
  User,
  Mic,
  Image,
  Layout,
  Globe,
  Lock,
  CheckCircle2,
  Circle,
  Heart,
  Users,
  Eye,
  PlayCircle,
  Sprout,
  Instagram,
  Youtube,
  ExternalLink,
  Star,
  Settings,
  Bell,
  Compass,
  History,
  LinkIcon,
  Unlink,
  LogOut,
  ChevronRight,
  Award,
  Hash,
  CheckCircle,
  ArrowRight,
  IndianRupee,
  Flame,
  MessageCircle,
} from "lucide-react";
import {
  useAriaIdentity,
  useUpdateAriaMemory,
  useDeleteAriaMemory,
  usePersonalisedRoadmap,
  useRefreshRoadmap,
  useRoadmapActionStates,
  useCompleteRoadmapAction,
  useDismissRoadmapAction,
  useCreatorAnalytics,
  useRefreshCreatorAnalytics,
  useRebuildVoicePortrait,
} from "@/hooks/useApi";
import { useFirebaseAuth } from "@/lib/FirebaseAuthContext";
import { api } from "@/lib/api";

// ── Animation presets ─────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 24, stiffness: 280 },
  },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const confidenceDot = (score) => {
  if (score >= 75) return "bg-rising";
  if (score >= 50) return "bg-yellow-400";
  return "bg-destructive";
};

const confidenceLabel = (score) => {
  if (score >= 75) return "High confidence";
  if (score >= 50) return "Medium confidence";
  return "Low confidence";
};

function timeAgo(dateStr) {
  if (!dateStr) return "Unknown";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  if (days > 0) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (hours > 0) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  return "Just now";
}

const categoryIcon = (category) => {
  const map = {
    tone: Mic,
    content_format: Layout,
    content_territory: Globe,
    personal_constraint: Lock,
    schedule: Clock,
    audience: User,
    brand_voice: Sparkles,
    goal: Target,
    interest_signal: TrendingUp,
    hook_language: Mic,
  };
  const Icon = map[category] || Brain;
  return <Icon size={11} className="opacity-60" />;
};

const categoryLabel = (cat) =>
  ({
    tone: "Tone",
    content_format: "Format",
    content_territory: "Territory",
    personal_constraint: "Constraint",
    schedule: "Schedule",
    audience: "Audience",
    brand_voice: "Voice",
    goal: "Goal",
    interest_signal: "Interest",
    hook_language: "Language",
  })[cat] || cat;

// ── Analytics card ────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = "text-primary" }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className="text-muted-foreground" />
        <span className="text-muted-foreground text-xs font-body">{label}</span>
      </div>
      <p className={`font-heading text-xl ${color} truncate`}>{value || "—"}</p>
    </div>
  );
}

// ── Platform analytics section ────────────────────────────────────────────────
function PlatformAnalytics({ profile, analyticsData }) {
  const hasInstagram = !!profile?.instagram_handle;
  const hasYoutube = !!profile?.youtube_handle;

  if (!hasInstagram && !hasYoutube) return null;

  // Use primary_platform as source of truth.
  // Fallback: if youtube_handle exists and no primary set, treat as youtube.
  const platform =
    profile?.primary_platform ||
    (hasYoutube && !hasInstagram ? "youtube" : "instagram");
  const isYoutube = platform === "youtube";

  const instagramStats = [
    { icon: Users, label: "Followers", value: profile?.follower_range },
    {
      icon: Heart,
      label: "Engagement",
      value: profile?.engagement_rate ? `${profile.engagement_rate}%` : null,
    },
    {
      icon: BarChart2,
      label: "Health Score",
      value: profile?.health_score ? `${profile.health_score}/100` : null,
    },
    { icon: Sprout, label: "Growth Stage", value: profile?.growth_stage },
  ];

  const youtubeStats = analyticsData
    ? [
        {
          icon: Users,
          label: "Subscribers",
          value: analyticsData.followers?.toLocaleString("en-IN"),
        },
        {
          icon: Eye,
          label: "Avg Views",
          value: analyticsData.avgViewsPerVideo?.toLocaleString("en-IN"),
        },
        {
          icon: PlayCircle,
          label: "Total Videos",
          value: analyticsData.videoCount,
        },
        {
          icon: TrendingUp,
          label: "Upload Freq",
          value: analyticsData.uploadFrequency,
        },
      ]
    : instagramStats;

  const stats = isYoutube ? youtubeStats : instagramStats;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isYoutube ? (
            <Youtube size={16} className="text-red-500" />
          ) : (
            <Instagram size={16} className="text-purple-500" />
          )}
          <h3 className="font-body font-semibold text-sm text-foreground">
            {isYoutube ? "YouTube Analytics" : "Instagram Analytics"}
          </h3>
          <span className="text-muted-foreground text-xs font-body">
            @{isYoutube ? profile?.youtube_handle : profile?.instagram_handle}
          </span>
        </div>
        {analyticsData?.fromCache && (
          <span className="text-[10px] text-muted-foreground font-body flex items-center gap-1">
            <Clock size={10} /> cached
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <StatCard
            key={s.label}
            icon={s.icon}
            label={s.label}
            value={s.value}
          />
        ))}
      </div>

      {/* ARIA intelligence insight */}
      {analyticsData?.ariaIntelligence?.keyInsight && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Star size={14} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-body font-semibold text-primary mb-1">
                ARIA Insight
              </p>
              <p className="text-xs font-body text-foreground/80 leading-relaxed">
                {analyticsData.ariaIntelligence.keyInsight}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Estimated revenue (YouTube) */}
      {isYoutube && analyticsData?.estimatedMonthlyRevenue && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground font-body mb-1">
            Est. Monthly Revenue
          </p>
          <p className="font-heading text-lg text-foreground">
            {analyticsData.estimatedMonthlyRevenue}
          </p>
          <p className="text-[10px] text-muted-foreground font-body mt-1">
            CPM: {analyticsData.estimatedCPM}
          </p>
        </div>
      )}

      {/* Top content */}
      {isYoutube && analyticsData?.topVideos?.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <p className="text-xs font-body font-semibold text-foreground mb-2">
            Top Videos
          </p>
          {analyticsData.topVideos.slice(0, 3).map((v, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <p className="text-xs font-body text-foreground/80 truncate flex-1">
                {v.title}
              </p>
              <span className="text-xs font-body text-muted-foreground shrink-0">
                {v.views?.toLocaleString("en-IN")} views
              </span>
            </div>
          ))}
        </div>
      )}

      {!isYoutube && analyticsData?.topHashtags?.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-body font-semibold text-foreground mb-2">
            Top Hashtags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {analyticsData.topHashtags.slice(0, 8).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-body px-2 py-0.5 rounded-full bg-primary/10 text-primary"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — ARIA KNOWS
// ══════════════════════════════════════════════════════════════════════════════

function ARIAKnowsTab() {
  const { data, isLoading, error, refetch } = useAriaIdentity();
  const { mutateAsync: updateMemory, isPending: updateLoading } =
    useUpdateAriaMemory();
  const { mutateAsync: deleteMemory, isPending: deleteLoading } =
    useDeleteAriaMemory();
  const { mutateAsync: rebuildPortrait, isPending: rebuildLoading } =
    useRebuildVoicePortrait();

  const [editingKey, setEditingKey] = useState(null); // "category::key"
  const [editValue, setEditValue] = useState("");
  const [deletingKey, setDeletingKey] = useState(null);
  const [savedKey, setSavedKey] = useState(null);
  const [rebuildSuccess, setRebuildSuccess] = useState(false);

  const identity = data?.data;
  const portrait = identity?.voicePortrait;
  const memories = identity?.keyMemories || [];
  const stats = identity?.suggestionStats;
  const age = identity?.portraitAge;
  const nextRebuildAt = identity?.nextRebuildAt || null;
  const confidencePct = portrait
    ? Math.round((portrait.confidence || 0) * 100)
    : null;

  const formatNextRebuild = () => {
    if (!nextRebuildAt) return "Not scheduled yet";
    try {
      return new Date(nextRebuildAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Not scheduled yet";
    }
  };

  const handleEditStart = (mem) => {
    setEditingKey(`${mem.category}::${mem.key}`);
    setEditValue(mem.value);
    setDeletingKey(null);
  };

  const handleEditSave = async (mem) => {
    if (!editValue.trim()) return;
    try {
      await updateMemory({
        category: mem.category,
        key: mem.key,
        value: editValue.trim(),
      });
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

  const handleRebuild = async () => {
    try {
      await rebuildPortrait(undefined);
      setRebuildSuccess(true);
      setTimeout(() => setRebuildSuccess(false), 3000);
      await refetch();
    } catch (err) {
      console.error("Rebuild failed:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 pt-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !identity) {
    return (
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="space-y-4 pt-1"
      >
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Brain size={32} className="text-muted-foreground mb-3" />
          <p className="font-body text-sm text-muted-foreground">
            ARIA is still getting to know you.
          </p>
          <p className="font-body text-xs text-muted-foreground mt-1">
            Use the rebuild button to initialize your voice profile.
          </p>
        </div>

        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-border bg-card p-4 space-y-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Profile Reconstruction
              </p>
              <p className="font-body text-sm text-foreground">
                ARIA rebuilds your profile weekly to stay up-to-date with your
                learnings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
            <Clock size={14} className="text-muted-foreground flex-shrink-0" />
            <p className="font-body text-xs text-muted-foreground">
              Next auto-rebuild:{" "}
              <span className="font-semibold text-foreground">
                {formatNextRebuild()}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="px-2 py-1.5 rounded-lg bg-muted/30">
              <p className="text-muted-foreground">Current Memories</p>
              <p className="font-heading text-sm text-foreground">
                {memories.length}
              </p>
            </div>
            <div className="px-2 py-1.5 rounded-lg bg-muted/30">
              <p className="text-muted-foreground">Confidence Level</p>
              <p className="font-heading text-sm text-foreground">
                {confidencePct !== null ? `${confidencePct}%` : "—"}
              </p>
            </div>
          </div>

          <button
            onClick={handleRebuild}
            disabled={rebuildLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white font-body font-semibold text-sm transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              size={14}
              className={rebuildLoading ? "animate-spin" : ""}
            />
            {rebuildLoading ? "Rebuilding..." : "Rebuild Now"}
          </button>

          {rebuildSuccess && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rising/10 border border-rising/20">
              <CheckCircle2 size={14} className="text-rising flex-shrink-0" />
              <p className="font-body text-xs text-rising">
                Profile rebuilt successfully! Refresh to see updates.
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-4 pt-1"
    >
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
            <span
              className={`w-2 h-2 rounded-full ${portrait.confidence >= 0.6 ? "bg-rising" : "bg-yellow-400"}`}
            />
            <p className="font-body text-xs text-muted-foreground">
              {confidencePct}% confident · Updated {age || "recently"}
            </p>
          </div>
        </motion.div>
      )}

      {/* Rebuild & Reconstruction Schedule */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-border bg-card p-4 space-y-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Profile Reconstruction
            </p>
            <p className="font-body text-sm text-foreground">
              ARIA rebuilds your profile weekly to stay up-to-date with your
              learnings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
          <Clock size={14} className="text-muted-foreground flex-shrink-0" />
          <p className="font-body text-xs text-muted-foreground">
            Next auto-rebuild:{" "}
            <span className="font-semibold text-foreground">
              {formatNextRebuild()}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="px-2 py-1.5 rounded-lg bg-muted/30">
            <p className="text-muted-foreground">Current Memories</p>
            <p className="font-heading text-sm text-foreground">
              {memories.length}
            </p>
          </div>
          <div className="px-2 py-1.5 rounded-lg bg-muted/30">
            <p className="text-muted-foreground">Confidence Level</p>
            <p className="font-heading text-sm text-foreground">
              {confidencePct !== null ? `${confidencePct}%` : "—"}
            </p>
          </div>
        </div>

        <button
          onClick={handleRebuild}
          disabled={rebuildLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white font-body font-semibold text-sm transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw
            size={14}
            className={rebuildLoading ? "animate-spin" : ""}
          />
          {rebuildLoading ? "Rebuilding..." : "Rebuild Now"}
        </button>

        {rebuildSuccess && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rising/10 border border-rising/20">
            <CheckCircle2 size={14} className="text-rising flex-shrink-0" />
            <p className="font-body text-xs text-rising">
              Profile rebuilt successfully! Refresh to see updates.
            </p>
          </div>
        )}
      </motion.div>

      {/* Voice attributes grid */}
      {portrait && (
        <motion.div variants={fadeUp}>
          <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            Voice attributes
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Tone", value: portrait.toneSignature },
              { label: "Language", value: portrait.preferredLanguage },
              { label: "Energy", value: portrait.energyLevel },
              {
                label: "Formats",
                value: portrait.preferredFormats?.join(" · "),
              },
            ]
              .filter((a) => a.value)
              .map((attr) => (
                <div
                  key={attr.label}
                  className="bg-card border border-border rounded-xl px-3 py-2.5"
                >
                  <p className="font-body text-[10px] text-muted-foreground mb-0.5">
                    {attr.label}
                  </p>
                  <p className="font-body text-sm text-foreground font-medium capitalize leading-tight">
                    {attr.value}
                  </p>
                </div>
              ))}
          </div>
          {portrait.audienceDescription && (
            <div className="mt-2 bg-card border border-border rounded-xl px-3 py-2.5">
              <p className="font-body text-[10px] text-muted-foreground mb-0.5">
                Audience
              </p>
              <p className="font-body text-sm text-foreground">
                {portrait.audienceDescription}
              </p>
            </div>
          )}
          {portrait.personalConstraints?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {portrait.personalConstraints.map((c) => (
                <span
                  key={c}
                  className="flex items-center gap-1 px-2 py-1 rounded-pill bg-muted text-xs font-body text-muted-foreground"
                >
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
              const isEditing = editingKey === compKey;
              const isDeleting = deletingKey === compKey;
              const isSaved = savedKey === compKey;

              return (
                <motion.div
                  key={compKey}
                  layout
                  className={`rounded-xl border px-3 py-2.5 transition-colors ${
                    isEditing
                      ? "border-primary/40 bg-primary/5"
                      : isDeleting
                        ? "border-destructive/30 bg-destructive/5"
                        : "border-border bg-card"
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
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleEditSave(mem);
                          if (e.key === "Escape") setEditingKey(null);
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
                        Remove "
                        <span className="font-semibold">{mem.value}</span>" from
                        ARIA's memory?
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
                          <span
                            className={`w-1.5 h-1.5 rounded-full ml-auto ${confidenceDot(mem.confidence)}`}
                            title={confidenceLabel(mem.confidence)}
                          />
                        </div>
                        <p className="font-body text-sm text-foreground truncate">
                          {isSaved ? (
                            <span className="text-rising flex items-center gap-1">
                              <CheckCircle2 size={12} /> Saved
                            </span>
                          ) : (
                            mem.value
                          )}
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
        <motion.div
          variants={fadeUp}
          className="bg-card border border-border rounded-2xl p-4"
        >
          <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            ARIA's suggestions
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="font-heading text-xl text-foreground">
                {stats.totalSuggestions}
              </p>
              <p className="font-body text-[10px] text-muted-foreground mt-0.5">
                Total made
              </p>
            </div>
            <div>
              <p className="font-heading text-xl text-rising">
                {Math.round((stats.followRate || 0) * 100)}%
              </p>
              <p className="font-body text-[10px] text-muted-foreground mt-0.5">
                You followed
              </p>
            </div>
            <div>
              <p className="font-heading text-xl text-foreground capitalize">
                {stats.topFollowedTypes?.[0]?.replace("_", " ") || "—"}
              </p>
              <p className="font-body text-[10px] text-muted-foreground mt-0.5">
                Top type
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — ROADMAP
// ══════════════════════════════════════════════════════════════════════════════

function RoadmapTab() {
  const [expandedWeek,   setExpandedWeek]   = useState(0);
  const [expandedAction, setExpandedAction] = useState(null);

  // ── Data hooks ──────────────────────────────────────────────────────
  const { data, isLoading, error } = usePersonalisedRoadmap();
  const { mutate: doRefresh, isPending: isRefreshing } = useRefreshRoadmap();

  const roadmap        = data?.data;
  const roadmapVersion = roadmap?.roadmapVersion ?? null;

  const { data: statesData } = useRoadmapActionStates(roadmapVersion);
  // actionStates: { "1-0": "completed", "1-2": "dismissed", ... }
  const actionStates = statesData?.data?.states ?? {};

  const { mutate: completeAction } = useCompleteRoadmapAction();
  const { mutate: dismissAction  } = useDismissRoadmapAction();

  // ── Handlers ────────────────────────────────────────────────────────
  const handleRefresh = () => doRefresh();

  const handleComplete = (weekNumber, actionIndex, actionText) => {
    if (!roadmapVersion) return;
    completeAction({ roadmapVersion, weekNumber, actionIndex, actionText });
  };

  const handleDismiss = (weekNumber, actionIndex, actionText) => {
    if (!roadmapVersion) return;
    dismissAction({ roadmapVersion, weekNumber, actionIndex, actionText });
  };

  // ── Loading state — shows elapsed time so user knows it's working ────────
  if (isLoading) {
    return (
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 px-1 mb-4">
          <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin flex-shrink-0" />
          <p className="font-body text-xs text-muted-foreground">
            ARIA is building your personalised roadmap…
          </p>
        </div>
        <div className="h-20 bg-muted rounded-2xl animate-pulse" />
        <div className="h-16 bg-muted rounded-2xl animate-pulse" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
        <div className="h-24 bg-muted rounded-2xl animate-pulse" />
        <p className="font-body text-[10px] text-muted-foreground text-center px-4 pt-2">
          First generation takes 10–15 seconds. Subsequent loads are instant.
        </p>
      </div>
    );
  }

  // ── Error / empty state ──────────────────────────────────────────────
  if (error || !roadmap) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Map size={32} className="text-muted-foreground mb-3" />
        <p className="font-body text-sm text-muted-foreground">
          Could not load your roadmap.
        </p>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="mt-3 px-4 py-2 rounded-xl bg-primary text-white text-sm font-body font-semibold disabled:opacity-60"
        >
          {isRefreshing ? "Generating…" : "Try again"}
        </button>
      </div>
    );
  }

  const weeks = Object.entries(roadmap.weeklyPlan || {});

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-4 pt-1"
    >
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="font-body text-xs text-muted-foreground">
            {roadmap.fromCache ? "Personalised for you" : "Just generated"}
          </p>
          {roadmap.strategicLens && (
            <p className="font-body text-[10px] text-primary font-semibold mt-0.5">
              {roadmap.strategicLens}
            </p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1 text-xs font-body text-primary font-semibold hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          <RefreshCw size={11} className={isRefreshing ? "animate-spin" : ""} />
          {isRefreshing ? "Generating…" : "Refresh"}
        </button>
      </div>

      {/* ── Wildcard trend badge ──────────────────────────────────────── */}
      {roadmap.wildcardTrend && (
        <motion.div
          variants={fadeUp}
          className="rounded-xl border border-amber-500/30 bg-amber-500/8 px-3 py-2 flex items-start gap-2"
        >
          <Zap size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="font-body text-[11px] text-amber-700 dark:text-amber-400 leading-snug">
            <span className="font-semibold">Trending now:</span> {roadmap.wildcardTrend}
          </p>
        </motion.div>
      )}

      {/* ── Current situation ─────────────────────────────────────────── */}
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

      {/* ── Core challenge ────────────────────────────────────────────── */}
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

      {/* ── Immediate action ──────────────────────────────────────────── */}
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

      {/* ── Weekly plan ───────────────────────────────────────────────── */}
      {weeks.length > 0 && (
        <motion.div variants={fadeUp} className="space-y-2">
          <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Your 4-week plan
          </p>
          {weeks.map(([weekKey, weekData], idx) => {
            const isOpen  = expandedWeek === idx;
            const weekNum = idx + 1;

            // Count completed actions for this week
            const completedCount = (weekData.actions || []).filter(
              (_, aIdx) => actionStates[`${weekNum}-${aIdx}`] === 'completed'
            ).length;
            const totalCount = (weekData.actions || []).length;

            return (
              <div
                key={weekKey}
                className="rounded-2xl border border-border bg-card overflow-hidden"
              >
                <button
                  onClick={() => setExpandedWeek(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-body text-xs text-muted-foreground">
                        Week {weekNum}
                      </p>
                      {completedCount > 0 && (
                        <span className="text-[10px] font-body font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                          {completedCount}/{totalCount}
                        </span>
                      )}
                    </div>
                    <p className="font-body text-sm text-foreground font-semibold truncate">
                      {weekData.focus}
                    </p>
                  </div>
                  {isOpen ? (
                    <ChevronUp size={16} className="text-muted-foreground flex-shrink-0 ml-2" />
                  ) : (
                    <ChevronDown size={16} className="text-muted-foreground flex-shrink-0 ml-2" />
                  )}
                </button>

                <AnimatePresence>
                  {isOpen && weekData.actions?.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                        {weekData.actions.map((action, aIdx) => {
                          const actionKey    = `${idx}-${aIdx}`;
                          const stateKey     = `${weekNum}-${aIdx}`;
                          const actionOpen   = expandedAction === actionKey;
                          const isCompleted  = actionStates[stateKey] === 'completed';
                          const isDismissed  = actionStates[stateKey] === 'dismissed';

                          if (isDismissed) return null; // hide dismissed actions

                          return (
                            <div
                              key={aIdx}
                              className={`space-y-1 transition-opacity ${isCompleted ? "opacity-50" : "opacity-100"}`}
                            >
                              <div className="flex items-start gap-2">
                                {/* Complete toggle */}
                                <button
                                  onClick={() =>
                                    !isCompleted &&
                                    handleComplete(weekNum, aIdx, action.action)
                                  }
                                  className="mt-0.5 flex-shrink-0 focus:outline-none"
                                  aria-label={isCompleted ? "Completed" : "Mark complete"}
                                >
                                  {isCompleted ? (
                                    <CheckCircle2
                                      size={16}
                                      className="text-primary"
                                    />
                                  ) : (
                                    <Circle
                                      size={16}
                                      className="text-muted-foreground hover:text-primary transition-colors"
                                    />
                                  )}
                                </button>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-1">
                                    <p
                                      className={`font-body text-sm font-medium leading-snug ${
                                        isCompleted
                                          ? "line-through text-muted-foreground"
                                          : "text-foreground"
                                      }`}
                                    >
                                      {action.action}
                                    </p>
                                    {/* Dismiss button */}
                                    {!isCompleted && (
                                      <button
                                        onClick={() =>
                                          handleDismiss(weekNum, aIdx, action.action)
                                        }
                                        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors ml-1"
                                        aria-label="Dismiss action"
                                      >
                                        <X size={12} />
                                      </button>
                                    )}
                                  </div>

                                  {action.why && !isCompleted && (
                                    <p className="font-body text-xs text-muted-foreground mt-0.5 leading-snug">
                                      {action.why}
                                    </p>
                                  )}

                                  {action.howTo && !isCompleted && (
                                    <button
                                      onClick={() =>
                                        setExpandedAction(
                                          actionOpen ? null : actionKey
                                        )
                                      }
                                      className="mt-1 text-[11px] font-body text-primary font-semibold flex items-center gap-0.5"
                                    >
                                      {actionOpen ? "Hide" : "How to do this"}
                                      {actionOpen ? (
                                        <ChevronUp size={10} />
                                      ) : (
                                        <ChevronDown size={10} />
                                      )}
                                    </button>
                                  )}

                                  <AnimatePresence>
                                    {actionOpen && action.howTo && !isCompleted && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <p className="font-body text-xs text-foreground/70 mt-1 leading-relaxed">
                                          {action.howTo}
                                        </p>
                                        {action.expectedImpact && (
                                          <p className="font-body text-[11px] text-primary/80 mt-1 font-medium">
                                            Expected: {action.expectedImpact}
                                          </p>
                                        )}
                                      </motion.div>
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

      {/* ── Content strategy ──────────────────────────────────────────── */}
      {roadmap.contentStrategy && (
        <motion.div
          variants={fadeUp}
          className="bg-card border border-border rounded-2xl p-4 space-y-3"
        >
          <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Content strategy
          </p>
          {roadmap.contentStrategy.frequency && (
            <div>
              <p className="font-body text-xs text-muted-foreground">Posting frequency</p>
              <p className="font-body text-xs text-foreground font-semibold">
                {roadmap.contentStrategy.frequency}
              </p>
            </div>
          )}
          {roadmap.contentStrategy.bestTimes && (
            <div>
              <p className="font-body text-xs text-muted-foreground">Best times</p>
              <p className="font-body text-xs text-foreground font-semibold">
                {roadmap.contentStrategy.bestTimes}
              </p>
            </div>
          )}
          {roadmap.contentStrategy.topicPillars?.length > 0 && (
            <div>
              <p className="font-body text-xs text-muted-foreground mb-1.5">Topic pillars</p>
              <div className="flex flex-wrap gap-1.5">
                {roadmap.contentStrategy.topicPillars.map((p, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded-full bg-muted text-xs font-body text-foreground"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Growth projection ─────────────────────────────────────────── */}
      {roadmap.growthProjection && (
        <motion.div
          variants={fadeUp}
          className="bg-card border border-border rounded-2xl p-4"
        >
          <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            3-month projection
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted rounded-xl p-3 text-center">
              <p className="font-body text-base font-bold text-foreground">
                {roadmap.growthProjection.conservative}
              </p>
              <p className="font-body text-[10px] text-muted-foreground mt-0.5">
                Conservative
              </p>
            </div>
            <div className="bg-primary/10 rounded-xl p-3 text-center">
              <p className="font-body text-base font-bold text-primary">
                {roadmap.growthProjection.optimistic}
              </p>
              <p className="font-body text-[10px] text-muted-foreground mt-0.5">
                Optimistic
              </p>
            </div>
          </div>
          {roadmap.growthProjection.keyAssumption && (
            <p className="font-body text-[11px] text-muted-foreground mt-3 leading-snug">
              ⚡ {roadmap.growthProjection.keyAssumption}
            </p>
          )}
        </motion.div>
      )}

      {/* ── Milestones ────────────────────────────────────────────────── */}
      {roadmap.milestones?.length > 0 && (
        <motion.div variants={fadeUp} className="space-y-2">
          <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Milestones
          </p>
          {roadmap.milestones.map((m, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-body text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                  </div>
                  <p className="font-body text-sm text-foreground font-semibold">
                    {m.target}
                  </p>
                </div>
                {m.eta && (
                  <span className="font-body text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                    {m.eta}
                  </span>
                )}
              </div>
              {m.unlocks && (
                <p className="font-body text-xs text-muted-foreground mb-1.5 ml-9">
                  Unlocks: {m.unlocks}
                </p>
              )}
              {m.triggerAction && (
                <p className="font-body text-xs text-primary font-medium ml-9">
                  → {m.triggerAction}
                </p>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {/* ── Bottom spacer ────────────────────────────────────────────── */}
      <div className="h-6" />
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCORE RING COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

function ScoreRing({ score, label, size = 72, color = "text-primary" }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const fill = circ * (score / 100);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            className="text-muted/30"
            strokeWidth={size * 0.08}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            className={color}
            strokeWidth={size * 0.08}
            strokeDasharray={`${fill} ${circ - fill}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-heading text-base font-bold ${color}`}>
            {score}
          </span>
        </div>
      </div>
      <p className="font-body text-[10px] text-muted-foreground text-center leading-tight">
        {label}
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ANALYTICS TAB — MAIN
// ══════════════════════════════════════════════════════════════════════════════

function AnalyticsTab() {
  const { data, isLoading, error } = useCreatorAnalytics();
  const { mutateAsync: doRefresh, isPending: refreshing } =
    useRefreshCreatorAnalytics();
  const [expandedPost, setExpandedPost] = useState(null);

  const analytics = data?.data;

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-3 pt-2">
        <div className="h-32 bg-muted rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-20 bg-muted rounded-2xl animate-pulse" />
          <div className="h-20 bg-muted rounded-2xl animate-pulse" />
        </div>
        <div className="h-48 bg-muted rounded-2xl animate-pulse" />
        <div className="h-36 bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  // ── No Instagram connected ───────────────────────────────────────────────────
  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <BarChart2 size={28} className="text-primary" />
        </div>
        <p className="font-heading text-lg text-foreground mb-2">
          No analytics yet
        </p>
        <p className="font-body text-sm text-muted-foreground leading-relaxed">
          Connect your Instagram account to get your full ARIA analysis — better
          than Social Status, better than VidIQ.
        </p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <AlertCircle size={32} className="text-destructive mb-3" />
        <p className="font-body text-sm text-muted-foreground">
          Could not load analytics.
        </p>
        <button
          onClick={() => doRefresh()}
          className="mt-3 px-4 py-2 rounded-xl bg-primary text-white text-sm font-body font-semibold"
        >
          Try again
        </button>
      </div>
    );
  }

  const scoreColor = (s) =>
    s >= 75
      ? "text-green-500"
      : s >= 50
        ? "text-primary"
        : s >= 30
          ? "text-yellow-500"
          : "text-destructive";

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-4 pt-1 pb-8"
    >
      {/* ── Header row ──────────────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="flex items-center justify-between px-1"
      >
        <div>
          <p className="font-body text-xs text-muted-foreground">
            @{analytics.handle} · {analytics.followerRange}
          </p>
          <p className="font-body text-[10px] text-muted-foreground/60">
            {analytics.isFromCache ? "Cached" : "Live"} ·{" "}
            {analytics.scrapedAt
              ? new Date(analytics.scrapedAt).toLocaleDateString("en-IN")
              : "—"}
          </p>
        </div>
        <button
          onClick={() => doRefresh()}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-body font-semibold hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Analysing..." : "Refresh"}
        </button>
      </motion.div>

      {/* ── Health Score hero ────────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-5"
      >
        <p className="font-body text-xs text-primary font-semibold uppercase tracking-wider mb-4">
          Account Health
        </p>
        <div className="flex items-center justify-around">
          <ScoreRing
            score={analytics.healthScore}
            label="Overall"
            size={80}
            color={scoreColor(analytics.healthScore)}
          />
          <ScoreRing
            score={analytics.engagementScore}
            label="Engagement"
            size={64}
            color={scoreColor(analytics.engagementScore)}
          />
          <ScoreRing
            score={analytics.consistencyScore}
            label="Consistency"
            size={64}
            color={scoreColor(analytics.consistencyScore)}
          />
          <ScoreRing
            score={analytics.growthScore}
            label="Growth"
            size={64}
            color={scoreColor(analytics.growthScore)}
          />
        </div>
        {/* Niche benchmark bar */}
        {analytics.nicheBenchmarks && (
          <div className="mt-4 bg-background/60 rounded-xl px-3 py-2.5">
            <p className="font-body text-[10px] text-muted-foreground mb-1.5">
              {analytics.nicheBenchmarks.label}
            </p>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${analytics.nicheBenchmarks.percentile}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <p className="font-body text-[10px] text-muted-foreground">
                Niche avg: {analytics.nicheBenchmarks.avgER}%
              </p>
              <p className="font-body text-[10px] text-primary font-semibold">
                Your ER: {analytics.engagementRate}%
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── ARIA Diagnosis ───────────────────────────────────────────────────── */}
      {analytics.ariaDiagnosis && (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Zap size={13} className="text-primary" />
            </div>
            <p className="font-body text-xs font-semibold text-foreground uppercase tracking-wider">
              AIRRA's Diagnosis
            </p>
          </div>
          <p className="font-body text-sm text-foreground leading-relaxed">
            {analytics.ariaDiagnosis}
          </p>
        </motion.div>
      )}

      {/* ── Key Stats grid ───────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
          Key Numbers
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              icon: Users,
              label: "Followers",
              value: analytics.followers?.toLocaleString("en-IN"),
            },
            {
              icon: Heart,
              label: "Avg Likes",
              value: Math.round(analytics.avgLikes)?.toLocaleString("en-IN"),
            },
            {
              icon: MessageCircle,
              label: "Avg Comments",
              value: Math.round(analytics.avgComments)?.toLocaleString("en-IN"),
            },
            {
              icon: Eye,
              label: "Avg Views",
              value: Math.round(analytics.avgViews)?.toLocaleString("en-IN"),
            },
            {
              icon: TrendingUp,
              label: "Eng. Rate",
              value: `${analytics.engagementRate}%`,
            },
            {
              icon: Clock,
              label: "Posts/Week",
              value: `${analytics.postsPerWeek}x`,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-card border border-border rounded-xl p-3"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <s.icon size={12} className="text-muted-foreground" />
                <p className="font-body text-[10px] text-muted-foreground">
                  {s.label}
                </p>
              </div>
              <p className="font-heading text-lg text-foreground leading-none">
                {s.value || "—"}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Top Insights ─────────────────────────────────────────────────────── */}
      {analytics.ariaInsights?.length > 0 && (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-border bg-card p-4"
        >
          <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            5 Key Insights
          </p>
          <div className="space-y-2.5">
            {analytics.ariaInsights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="font-heading text-[10px] text-primary font-bold">
                    {i + 1}
                  </span>
                </div>
                <p className="font-body text-sm text-foreground leading-snug">
                  {insight}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Action Items ─────────────────────────────────────────────────────── */}
      {analytics.ariaActionItems?.length > 0 && (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-primary/20 bg-primary/5 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Target size={13} className="text-primary" />
            <p className="font-body text-xs font-semibold text-primary uppercase tracking-wider">
              Do These Now
            </p>
          </div>
          <div className="space-y-2">
            {analytics.ariaActionItems.map((action, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <CheckCircle
                  size={14}
                  className="text-primary flex-shrink-0 mt-0.5"
                />
                <p className="font-body text-sm text-foreground leading-snug">
                  {action}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Format Breakdown ─────────────────────────────────────────────────── */}
      {analytics.formatBreakdown && (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-border bg-card p-4"
        >
          <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Content Format Mix
          </p>
          <div className="space-y-2.5">
            {[
              {
                label: "Reels",
                data: analytics.formatBreakdown.reels,
                color: "bg-primary",
              },
              {
                label: "Photos",
                data: analytics.formatBreakdown.photos,
                color: "bg-blue-500",
              },
              {
                label: "Carousels",
                data: analytics.formatBreakdown.carousels,
                color: "bg-purple-500",
              },
            ]
              .filter((f) => f.data?.count > 0 || f.data?.pct > 0)
              .map((f) => (
                <div key={f.label}>
                  <div className="flex justify-between mb-1">
                    <p className="font-body text-xs text-foreground">
                      {f.label}
                    </p>
                    <p className="font-body text-xs text-muted-foreground">
                      {f.data.count} posts ·{" "}
                      {f.data.avgLikes?.toLocaleString("en-IN")} avg likes
                    </p>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${f.color} rounded-full`}
                      style={{ width: `${f.data.pct}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
          <p className="font-body text-xs text-muted-foreground mt-3 bg-muted/50 rounded-lg px-2.5 py-2">
            {analytics.formatBreakdown.insight}
          </p>
        </motion.div>
      )}

      {/* ── Best Posting Times ───────────────────────────────────────────────── */}
      {analytics.bestPostingTimes?.length > 0 && (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock size={13} className="text-muted-foreground" />
            <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Best Times to Post
            </p>
          </div>
          <div className="space-y-2">
            {analytics.bestPostingTimes.map((t, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-muted/40 rounded-xl px-3 py-2.5"
              >
                <div>
                  <p className="font-body text-sm text-foreground font-semibold">
                    {t.day}
                  </p>
                  <p className="font-body text-[10px] text-muted-foreground">
                    {t.timeWindow}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-body text-xs text-foreground">
                    {t.avgLikes?.toLocaleString("en-IN")} avg likes
                  </p>
                  <p
                    className={`font-body text-[10px] ${t.confidence === "high" ? "text-green-500" : "text-yellow-500"}`}
                  >
                    {t.confidence} confidence
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Top Hashtags ─────────────────────────────────────────────────────── */}
      {analytics.topHashtags?.length > 0 && (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Hash size={13} className="text-muted-foreground" />
            <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Your Top Hashtags
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {analytics.topHashtags.slice(0, 12).map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-body px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
              >
                #{tag}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Top Posts ────────────────────────────────────────────────────────── */}
      {analytics.topPosts?.length > 0 && (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Flame size={13} className="text-orange-500" />
            <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Top Performing Posts
            </p>
          </div>
          <div className="space-y-2">
            {analytics.topPosts.slice(0, 5).map((post, i) => {
              const isExpanded = expandedPost === i;
              return (
                <div
                  key={i}
                  className="border border-border rounded-xl overflow-hidden cursor-pointer"
                  onClick={() => setExpandedPost(isExpanded ? null : i)}
                >
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="font-heading text-[10px] text-primary font-bold">
                        {i + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-xs text-foreground truncate">
                        {post.caption || `${post.type} post`}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="font-body text-[10px] text-muted-foreground flex items-center gap-1">
                          <Heart size={9} />{" "}
                          {post.likes?.toLocaleString("en-IN")}
                        </span>
                        <span className="font-body text-[10px] text-muted-foreground flex items-center gap-1">
                          <MessageCircle size={9} />{" "}
                          {post.comments?.toLocaleString("en-IN")}
                        </span>
                        {post.views > 0 && (
                          <span className="font-body text-[10px] text-muted-foreground flex items-center gap-1">
                            <Eye size={9} />{" "}
                            {post.views?.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp
                        size={14}
                        className="text-muted-foreground flex-shrink-0"
                      />
                    ) : (
                      <ChevronDown
                        size={14}
                        className="text-muted-foreground flex-shrink-0"
                      />
                    )}
                  </div>
                  {isExpanded && (
                    <div className="border-t border-border px-3 py-2.5 bg-muted/30 space-y-2">
                      {post.hashtags?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {post.hashtags.map((h) => (
                            <span
                              key={h}
                              className="text-[10px] font-body px-1.5 py-0.5 rounded-full bg-primary/10 text-primary"
                            >
                              #{h}
                            </span>
                          ))}
                        </div>
                      )}
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[10px] font-body text-primary font-semibold"
                      >
                        View on Instagram <ArrowRight size={10} />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Growth Projection ────────────────────────────────────────────────── */}
      {analytics.growthProjection && (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-border bg-card p-4"
        >
          <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Growth Projection
          </p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-muted/40 rounded-xl p-3 text-center">
              <p className="font-body text-[10px] text-muted-foreground mb-1">
                Conservative (30d)
              </p>
              <p className="font-heading text-sm text-foreground font-semibold">
                {analytics.growthProjection.conservative}
              </p>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-center">
              <p className="font-body text-[10px] text-primary mb-1">
                Optimistic (30d)
              </p>
              <p className="font-heading text-sm text-foreground font-semibold">
                {analytics.growthProjection.optimistic}
              </p>
            </div>
          </div>
          {analytics.growthProjection.daysToMilestone && (
            <div className="bg-muted/40 rounded-xl px-3 py-2.5">
              <p className="font-body text-xs text-foreground">
                Next milestone:{" "}
                <span className="font-semibold text-primary">
                  {analytics.growthProjection.milestone} followers
                </span>
              </p>
              <p className="font-body text-[10px] text-muted-foreground mt-0.5">
                Est. {analytics.growthProjection.daysToMilestone} days at
                current pace
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Monetisation ─────────────────────────────────────────────────────── */}
      {analytics.monetisation && (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <IndianRupee size={13} className="text-green-500" />
            <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Monetisation
            </p>
            <div
              className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-body font-semibold ${
                analytics.monetisation.isReadyForBrands
                  ? "bg-green-500/10 text-green-500"
                  : "bg-yellow-500/10 text-yellow-600"
              }`}
            >
              {analytics.monetisation.isReadyForBrands
                ? "✓ Brand Ready"
                : `Unlock at ${analytics.monetisation.unlockAt}`}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="font-body text-[10px] text-muted-foreground mb-1">
                Brand Deal Range
              </p>
              <p className="font-heading text-sm text-foreground font-semibold">
                ₹
                {analytics.monetisation.brandDeal?.min?.toLocaleString("en-IN")}{" "}
                – ₹
                {analytics.monetisation.brandDeal?.max?.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="font-body text-[10px] text-muted-foreground mb-1">
                Est. Monthly
              </p>
              <p className="font-heading text-sm text-foreground font-semibold">
                ₹
                {analytics.monetisation.estimatedMonthlyRevenue?.min?.toLocaleString(
                  "en-IN",
                )}{" "}
                – ₹
                {analytics.monetisation.estimatedMonthlyRevenue?.max?.toLocaleString(
                  "en-IN",
                )}
              </p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <p className="font-body text-[10px] text-muted-foreground">
              CPM estimate: {analytics.monetisation.cpm}
            </p>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden ml-auto w-24">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${analytics.monetisationScore}%` }}
              />
            </div>
            <p className="font-body text-[10px] text-muted-foreground">
              {analytics.monetisationScore}/100
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Content Gaps ─────────────────────────────────────────────────────── */}
      {analytics.ariaContentGaps?.length > 0 && (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={13} className="text-yellow-500" />
            <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Content Gaps ARIA Spotted
            </p>
          </div>
          <div className="space-y-2">
            {analytics.ariaContentGaps.map((gap, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-3 py-2.5"
              >
                <ArrowRight
                  size={12}
                  className="text-yellow-500 flex-shrink-0 mt-0.5"
                />
                <p className="font-body text-sm text-foreground leading-snug">
                  {gap}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PROFILE PAGE
// ══════════════════════════════════════════════════════════════════════════════

const TABS = [
  { id: "aria", label: "ARIA Knows", icon: Brain },
  { id: "roadmap", label: "Roadmap", icon: Map },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
];

export default function Profile() {
  const [activeTab, setActiveTab] = useState("aria");
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
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-body font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
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
          {activeTab === "aria" && (
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
          {activeTab === "roadmap" && (
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
          {activeTab === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <AnalyticsTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
