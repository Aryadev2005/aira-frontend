// @ts-nocheck
// src/pages/dashboard/Songs.jsx
// ══════════════════════════════════════════════════════════════════════════════
// Songs page — powered by 3-tier RAG architecture
// Shows lifecycle badges, signals, trajectory data, language filter
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  Music,
  TrendingUp,
  Clock,
  XCircle,
  RefreshCw,
  Zap,
  BarChart2,
  ExternalLink,
  X,
  LayoutGrid,
  Disc,
} from "lucide-react";
import {
  useSongs,
  useSongLanguages,
  useSongNiches,
  usePredictSongs,
} from "@/hooks/useApi";
import { api } from "@/lib/api";
import { useFirebaseAuth } from "@/lib/FirebaseAuthContext";
import { AlmanacSongs } from "@/components/almanac";

// ── Constants ─────────────────────────────────────────────────────────────────

const LIFECYCLE_CONFIG = {
  RISING: {
    label: "Rising",
    emoji: "🚀",
    class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  PEAKING: {
    label: "Peaking",
    emoji: "🔥",
    class: "bg-orange-500/10  text-orange-400  border-orange-500/20",
  },
  DECLINING: {
    label: "Declining",
    emoji: "📉",
    class: "bg-red-500/10     text-red-400     border-red-500/20",
  },
  CYCLICAL: {
    label: "Cyclical",
    emoji: "🔄",
    class: "bg-blue-500/10    text-blue-400    border-blue-500/20",
  },
  DEAD: {
    label: "Dead",
    emoji: "💀",
    class: "bg-muted          text-muted-foreground border-border",
  },
};

const SIGNAL_CONFIG = {
  postNow: {
    label: "Post Now",
    class: "bg-rising/10 text-rising border-rising/20",
    dot: "bg-rising",
  },
  wait: {
    label: "Wait",
    class: "bg-primary/10 text-primary border-primary/20",
    dot: "bg-primary",
  },
  tooLate: {
    label: "Too Late",
    class: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
};

const LIFECYCLE_TABS = [
  { id: "all", label: "All" },
  { id: "RISING", label: "🚀 Rising" },
  { id: "PEAKING", label: "🔥 Peaking" },
  { id: "DECLINING", label: "📉 Declining" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", damping: 25 } },
};

// ── Song Card ──────────────────────────────────────────────────────────────────

function SongCard({ song, index, onClick }) {
  const lifecycle = LIFECYCLE_CONFIG[song.lifecycle] || LIFECYCLE_CONFIG.RISING;
  const signal = SIGNAL_CONFIG[song.signal] || SIGNAL_CONFIG.postNow;

  const streams =
    song.streams_today && Number(song.streams_today) > 0
      ? Number(song.streams_today) > 1_000_000
        ? `${(Number(song.streams_today) / 1_000_000).toFixed(1)}M`
        : `${(Number(song.streams_today) / 1_000).toFixed(0)}K`
      : null;

  return (
    <motion.div
      variants={item}
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      onClick={onClick}
      className="bg-card border border-border rounded-2xl p-4 hover:shadow-warm transition-shadow cursor-pointer"
    >
      <div className="flex items-start gap-3">
        {/* Rank badge */}
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="font-heading text-sm font-bold text-primary">
            {song.chart_position || "—"}
          </span>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0">
              <h4 className="font-body font-semibold text-sm text-foreground truncate">
                {song.title}
              </h4>
              <p className="text-muted-foreground text-xs font-body truncate">
                {song.artist}
              </p>
            </div>
            {/* Signal badge */}
            <span
              className={`flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-body font-semibold border ${signal.class}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${signal.dot}`} />
              {signal.label}
            </span>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-2 flex-wrap mt-2">
            {/* Lifecycle */}
            <span
              className={`px-2 py-0.5 rounded-pill text-[10px] font-body font-semibold border ${lifecycle.class}`}
            >
              {lifecycle.emoji} {lifecycle.label}
            </span>

            {/* Chart change */}
            {song.chart_change !== 0 && song.chart_change !== undefined && (
              <span
                className={`text-[10px] font-body font-semibold ${song.chart_change > 0 ? "text-rising" : "text-destructive"}`}
              >
                {song.chart_change > 0
                  ? `↑${song.chart_change}`
                  : `↓${Math.abs(song.chart_change)}`}
              </span>
            )}

            {/* Streams */}
            {streams && (
              <span className="text-[10px] font-body text-muted-foreground">
                {streams} streams
              </span>
            )}

            {/* Source */}
            <span className="text-[10px] font-body text-muted-foreground capitalize ml-auto">
              {song.source}
            </span>
          </div>

          {/* Mood tags */}
          {song.mood_tags?.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {song.mood_tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded bg-muted text-[9px] font-body text-muted-foreground"
                >
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

// ── Song Detail Modal ──────────────────────────────────────────────────────────

function SongDetailModal({ song, isOpen, onClose }) {
  if (!isOpen || !song) return null;

  const lifecycle = LIFECYCLE_CONFIG[song.lifecycle] || LIFECYCLE_CONFIG.RISING;
  const signal = SIGNAL_CONFIG[song.signal] || SIGNAL_CONFIG.postNow;

  const streams =
    song.streams_today && Number(song.streams_today) > 0
      ? Number(song.streams_today) > 1_000_000
        ? `${(Number(song.streams_today) / 1_000_000).toFixed(1)}M`
        : `${(Number(song.streams_today) / 1_000).toFixed(0)}K`
      : "—";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.button
            type="button"
            aria-label="Close song details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 18 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative w-full max-w-lg bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-2xl max-h-[calc(100vh-2rem)] sm:max-h-[min(90vh,48rem)] overflow-y-auto"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X size={16} className="text-muted-foreground" />
            </button>

            {/* Song title & artist */}
            <div className="mb-4">
              <h2 className="font-heading text-xl text-foreground mb-1">
                {song.title}
              </h2>
              <p className="font-body text-sm text-muted-foreground">
                {song.artist}
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-muted/50 rounded-xl p-3">
                <div className="font-body text-xs text-muted-foreground mb-1">
                  Chart Position
                </div>
                <div className="font-heading text-lg text-primary">
                  #{song.chart_position || "—"}
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-3">
                <div className="font-body text-xs text-muted-foreground mb-1">
                  Streams Today
                </div>
                <div className="font-heading text-lg text-primary">
                  {streams}
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-3">
                <div className="font-body text-xs text-muted-foreground mb-1">
                  Chart Change
                </div>
                <div
                  className={`font-heading text-lg ${song.chart_change > 0 ? "text-rising" : "text-destructive"}`}
                >
                  {song.chart_change > 0
                    ? `+${song.chart_change}`
                    : song.chart_change}
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-3">
                <div className="font-body text-xs text-muted-foreground mb-1">
                  Source
                </div>
                <div className="font-heading text-lg capitalize">
                  {song.source}
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span
                className={`px-3 py-1 rounded-pill text-xs font-body font-semibold border ${lifecycle.class}`}
              >
                {lifecycle.emoji} {lifecycle.label}
              </span>
              <span
                className={`px-3 py-1 rounded-pill text-xs font-body font-semibold border ${signal.class}`}
              >
                {signal.label}
              </span>
            </div>

            {/* Mood tags */}
            {song.mood_tags?.length > 0 && (
              <div className="mb-4">
                <p className="font-body text-xs text-muted-foreground mb-2">
                  Mood Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {song.mood_tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 rounded bg-primary/10 text-xs font-body text-primary border border-primary/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Niche tags */}
            {song.niche_tags?.length > 0 && (
              <div className="mb-4">
                <p className="font-body text-xs text-muted-foreground mb-2">
                  Niche Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {song.niche_tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 rounded bg-muted text-xs font-body text-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* External link */}
            {song.raw_data?.external_url && (
              <a
                href={song.raw_data.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full px-4 py-2 rounded-xl bg-primary text-white font-body text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <ExternalLink size={14} />
                Open on Spotify
              </a>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main Songs Page ───────────────────────────────────────────────────────────

export default function Songs() {
  const { dbUser } = useFirebaseAuth();
  const queryClient = useQueryClient();

  const [language, setLanguage] = useState("Hindi");
  const [lifecycleTab, setLifecycleTab] = useState("all");
  const [showPredict, setShowPredict] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [niche, setNiche] = useState(dbUser?.niches?.[0] || "general");
  const [viewMode, setViewMode] = useState("list"); // 'list' | 'almanac'

  const filters = {
    niche,
    language,
    ...(lifecycleTab !== "all" ? { lifecycle: lifecycleTab } : {}),
    limit: "120",
  };
  const songsQueryKey = ["songs", filters];
  const songsQueryParams = new URLSearchParams(filters).toString();

  // Don't fire until dbUser is loaded — prevents niche=undefined query
  const {
    data: songsData,
    isLoading,
    error,
    refetch,
  } = useSongs(filters, !!dbUser);
  const { data: langsData } = useSongLanguages();
  const { data: nichesData } = useSongNiches();
  const { data: predictData, isLoading: predictLoading } = usePredictSongs();

  const songs = songsData?.data?.songs || [];
  const fromCache = songsData?.data?.fromCache;
  const languages = langsData?.data || [
    { language: "Hindi" },
    { language: "English" },
    { language: "Punjabi" },
  ];
  const niches = nichesData?.data || [];
  const predictions = predictData?.data || [];

  useEffect(() => {
    if (!niches.length) return;

    const availableNicheNames = new Set(
      niches.map((entry) => String(entry.niche).toLowerCase()),
    );

    if (!availableNicheNames.has(String(niche).toLowerCase())) {
      const preferredNiche =
        dbUser?.niches?.find((entry) =>
          availableNicheNames.has(String(entry).toLowerCase()),
        ) ||
        niches[0]?.niche ||
        "general";

      setNiche(preferredNiche);
    }
  }, [dbUser?.niches, niche, niches]);

  const normalizedLifecycleTab = lifecycleTab.toUpperCase();
  const visibleSongs =
    lifecycleTab === "all"
      ? songs
      : songs.filter(
          (song) =>
            (song.lifecycle || "").toUpperCase() === normalizedLifecycleTab,
        );

  // Split songs by signal for summary stats
  const postNowCount = visibleSongs.filter(
    (s) => s.signal === "postNow",
  ).length;
  const peakingCount = visibleSongs.filter(
    (s) => s.lifecycle === "PEAKING",
  ).length;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl text-foreground mb-1">
            Trending Songs
          </h1>
          <p className="text-muted-foreground font-body text-sm">
            3-tier intelligence · refreshed every 6h
            {fromCache === false && (
              <span className="ml-2 text-rising">● live</span>
            )}
            {fromCache === true && (
              <span className="ml-2 text-muted-foreground">● cached</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-card border border-border">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-body font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="List view"
            >
              <LayoutGrid size={14} />
              List
            </button>
            <button
              onClick={() => setViewMode('almanac')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-body font-medium transition-all ${
                viewMode === 'almanac'
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Almanac view"
            >
              <Disc size={14} />
              Vinyl
            </button>
          </div>

          <button
            onClick={async () => {
              try {
                // Trigger backend refresh, then bypass the hot-window cache for a fresh read
                await api.post("/songs/refresh");
                const freshResponse = await api.get(
                  `/songs${songsQueryParams ? `?${songsQueryParams}&skipCache=true` : "?skipCache=true"}`,
                );
                queryClient.setQueryData(songsQueryKey, freshResponse);
              } catch (err) {
                // Fallback to the existing query if the refresh fetch fails
                refetch();
              }
            }}
            className="p-2 rounded-xl border border-border hover:bg-muted transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} className="text-muted-foreground" />
          </button>
        </div>
      </motion.div>

      {/* Almanac View */}
      {viewMode === 'almanac' && (
        <motion.div variants={item}>
          <AlmanacSongs songs={visibleSongs.slice(0, 4)} />
        </motion.div>
      )}

      {/* List View Content */}
      {viewMode === 'list' && (
        <>
      {/* Summary stats */}
      {visibleSongs.length > 0 && (
        <motion.div variants={item} className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="font-heading text-xl text-rising">
              {postNowCount}
            </div>
            <div className="font-body text-xs text-muted-foreground mt-0.5">
              Post Now
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="font-heading text-xl text-orange-400">
              {peakingCount}
            </div>
            <div className="font-body text-xs text-muted-foreground mt-0.5">
              Peaking
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="font-heading text-xl text-foreground">
              {songs.length}
            </div>
            <div className="font-body text-xs text-muted-foreground mt-0.5">
              Total tracked
            </div>
          </div>
        </motion.div>
      )}

      {/* Language filter */}
      <motion.div
        variants={item}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
      >
        {languages.map((l) => (
          <button
            key={l.language}
            onClick={() => setLanguage(l.language)}
            className={`px-3 py-1.5 rounded-pill text-xs font-body font-semibold whitespace-nowrap transition-colors border ${
              language === l.language
                ? "bg-primary text-white border-primary"
                : "bg-card border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {l.language}
            {l.count && <span className="ml-1 opacity-60">({l.count})</span>}
          </button>
        ))}
      </motion.div>

      {/* Niche filter */}
      <motion.div
        variants={item}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
      >
        <span className="px-3 py-1.5 rounded-pill text-xs font-body font-semibold border bg-muted text-muted-foreground whitespace-nowrap">
          Type
        </span>
        {niches.map((entry) => (
          <button
            key={entry.niche}
            onClick={() => setNiche(entry.niche)}
            className={`px-3 py-1.5 rounded-pill text-xs font-body font-semibold whitespace-nowrap transition-colors border ${
              niche === entry.niche
                ? "bg-primary text-white border-primary"
                : "bg-card border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {entry.niche}
            {entry.count && (
              <span className="ml-1 opacity-60">({entry.count})</span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Lifecycle tab filter */}
      <motion.div
        variants={item}
        className="flex gap-2 border-b border-border pb-0 overflow-x-auto scrollbar-hide"
      >
        {LIFECYCLE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setLifecycleTab(tab.id)}
            className={`px-3 py-2 text-sm font-body font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
              lifecycleTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
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
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
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
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} className="text-primary" />
                <span className="font-body font-semibold text-sm text-foreground">
                  ARIA Predictions — Rising before top 10
                </span>
              </div>
              {predictLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-14 bg-muted rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : predictions.length > 0 ? (
                <div className="space-y-2">
                  {predictions.map((song) => (
                    <SongCard
                      key={song.id}
                      song={song}
                      index={0}
                      onClick={() => setSelectedSong(song)}
                    />
                  ))}
                </div>
              ) : (
                <p className="font-body text-sm text-muted-foreground">
                  No predictions available yet. Check back after the next
                  refresh.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Song list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <XCircle className="mx-auto mb-2 text-destructive" size={24} />
          <p className="font-body text-sm text-muted-foreground">
            Could not load songs. Tap refresh to try again.
          </p>
        </div>
      ) : visibleSongs.length === 0 ? (
        <div className="text-center py-12">
          <Music className="mx-auto mb-2 text-muted-foreground" size={24} />
          <p className="font-body text-sm text-muted-foreground">
            No songs found for {language} /{" "}
            {lifecycleTab !== "all" ? lifecycleTab : "all lifecycle stages"}.
          </p>
          <p className="font-body text-xs text-muted-foreground mt-1">
            Data refreshes every 6 hours.
          </p>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {visibleSongs.map((song, i) => (
            <SongCard
              key={song.id || `${song.title}-${i}`}
              song={song}
              index={i}
              onClick={() => setSelectedSong(song)}
            />
          ))}
        </motion.div>
      )}
        </>
      )}

      {/* Song detail modal - only in list mode */}
      {viewMode === 'list' && (
        <SongDetailModal
          song={selectedSong}
          isOpen={!!selectedSong}
          onClose={() => setSelectedSong(null)}
        />
      )}
    </motion.div>
  );
}
