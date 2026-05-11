// src/pages/dashboard/Notes.jsx
import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  StickyNote,
  Plus,
  Search,
  Trash2,
  X,
  Sparkles,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  BookOpen,
  Tag,
  Clapperboard,
  CalendarDays,
  Zap,
} from "lucide-react";
import {
  useNotes,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  useToggleNotePin,
} from "@/hooks/useApi";
import useCreatorFlow from "@/store/creatorFlow";
import {
  STRUCTURAL_TAGS,
  STRUCTURAL_TAG_META,
  extractHashtags,
  sortTags,
  scoreNoteEnergy,
} from "@/constants/noteTags";

// ── Animation variants ─────────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", damping: 24 } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
};

// ── Source badge config ────────────────────────────────────────────────────────
const SOURCE_LABELS = {
  manual:         { label: "Manual",  color: "bg-muted text-muted-foreground" },
  studio_hook:    { label: "Hook",    color: "bg-primary/10 text-primary" },
  studio_caption: { label: "Caption", color: "bg-blue-500/10 text-blue-600" },
  studio_idea:    { label: "Idea",    color: "bg-amber-500/10 text-amber-600" },
  studio_script:  { label: "Script",  color: "bg-purple-500/10 text-purple-600" },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── NEW: render a single tag pill with optional structural styling ─────────────
// Used in editor detected-tags area and suggestions — NOT injected into original
// NoteCard tag row (that keeps its original plain span style).
function StructuralTagPill({ tag, onRemove }) {
  const meta = STRUCTURAL_TAG_META[tag];
  return (
    <span
      className={`inline-flex items-center gap-1 font-body text-[11px] font-semibold
        px-2 py-0.5 rounded-full border
        ${meta
          ? `${meta.color} ${meta.border}`
          : "bg-primary/10 text-primary border-primary/20"
        }`}
    >
      {meta?.emoji && <span className="text-[10px]">{meta.emoji}</span>}
      #{tag}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(tag); }}
          className="ml-0.5 hover:opacity-60 transition-opacity"
        >
          <X size={9} />
        </button>
      )}
    </span>
  );
}

// ── NEW: energy badge shown in card footer ─────────────────────────────────────
function EnergyBadge({ content, tags }) {
  const energy = useMemo(() => scoreNoteEnergy(content, tags), [content, tags]);
  const colors = {
    high:   "text-green-600",
    medium: "text-yellow-600",
    low:    "text-muted-foreground",
  };
  return (
    <span className={`font-body text-[10px] font-semibold ${colors[energy.level]}`}>
      {energy.emoji}
    </span>
  );
}

// ── NEW: structural tag suggestion row shown inside editor ─────────────────────
function StructuralTagSuggestions({ currentTags, onAdd }) {
  const suggested = STRUCTURAL_TAGS.filter(
    (t) => !currentTags.includes(t)
  ).slice(0, 5);

  if (suggested.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-1">
      <span className="font-body text-[10px] text-muted-foreground">Suggest:</span>
      {suggested.map((tag) => {
        const meta = STRUCTURAL_TAG_META[tag];
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onAdd(tag)}
            className={`font-body text-[10px] font-semibold px-1.5 py-0.5 rounded-full border
              opacity-50 hover:opacity-100 transition-opacity
              ${meta
                ? `${meta.color} ${meta.border}`
                : "bg-muted text-muted-foreground border-border"
              }`}
          >
            {meta?.emoji} #{tag}
          </button>
        );
      })}
    </div>
  );
}

// ── NEW: cluster banner — surface tag groups at the top of the page ────────────
function NoteClusterBanner({ notes, activeTag, onTagFilter }) {
  const clusters = useMemo(() => {
    const counts = {};
    notes.forEach((n) => {
      (n.tags ?? []).forEach((t) => {
        if (STRUCTURAL_TAGS.includes(t)) counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [notes]);

  if (clusters.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 flex-wrap px-3 py-2.5 rounded-2xl bg-muted/40 border border-border/60"
    >
      <span className="font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Clusters
      </span>
      {clusters.map(([tag, count]) => {
        const meta = STRUCTURAL_TAG_META[tag];
        const isActive = activeTag === tag;
        return (
          <button
            key={tag}
            onClick={() => onTagFilter(tag)}
            className={`flex items-center gap-1 font-body text-[11px] font-semibold px-2 py-1 rounded-xl border
              transition-all hover:scale-105 active:scale-95
              ${isActive
                ? "ring-2 ring-primary/30"
                : ""
              }
              ${meta
                ? `${meta.color} ${meta.border}`
                : "bg-muted text-muted-foreground border-border"
              }`}
          >
            {meta?.emoji} #{tag}
            <span className="ml-1 opacity-60 text-[10px]">{count}</span>
          </button>
        );
      })}
    </motion.div>
  );
}

// ── NoteCard component ─────────────────────────────────────────────────────────
function NoteCard({ note = {}, onEdit }) {
  const navigate            = useNavigate();
  const setSelectedIdea     = useCreatorFlow((s) => s.setSelectedIdea);
  const setPendingCalendarEntry = useCreatorFlow((s) => s.setPendingCalendarEntry);

  const [copied, setCopied] = useState(false);
  const { mutate: togglePin,  isPending: pinPending    } = useToggleNotePin();
  const { mutate: deleteNote, isPending: deletePending } = useDeleteNote();

  const sourceMeta = SOURCE_LABELS[note.source] ?? SOURCE_LABELS.manual;

  // ── ORIGINAL handlers — untouched ─────────────────────────────────────────
  const handleCopy = useCallback(() => {
    const text = [note.title, note.content].filter(Boolean).join("\n\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }, [note.title, note.content]);

  const handleDelete = useCallback(
    (e) => {
      e.stopPropagation();
      deleteNote(note.id);
    },
    [note.id, deleteNote],
  );

  const handlePin = useCallback(
    (e) => {
      e.stopPropagation();
      togglePin(note.id);
    },
    [note.id, togglePin],
  );

  // ── NEW: Note → Studio ─────────────────────────────────────────────────────
  const handleUseInStudio = useCallback(
    (e) => {
      e.stopPropagation();
      const ideaText = note.title || note.content?.slice(0, 120) || "";
      setSelectedIdea({ title: ideaText, id: `note_${note.id}` });
      navigate("/dashboard/studio");
    },
    [note, setSelectedIdea, navigate],
  );

  // ── NEW: Note → Calendar ───────────────────────────────────────────────────
  const handleAddToCalendar = useCallback(
    (e) => {
      e.stopPropagation();
      setPendingCalendarEntry({
        title:  note.title || note.content?.slice(0, 80) || "Untitled",
        notes:  note.content || "",
        source: "note",
        noteId: note.id,
      });
      navigate("/dashboard/calendar");
    },
    [note, setPendingCalendarEntry, navigate],
  );

  return (
    <motion.div
      variants={cardVariants}
      layout
      className={`group relative bg-card rounded-2xl border transition-shadow hover:shadow-warm-sm cursor-pointer
        ${note.is_pinned ? "border-primary/30 bg-primary/3" : "border-border"}`}
      onClick={() => onEdit && onEdit(note)}
    >
      {note.is_pinned && (
        <div className="absolute -top-1.5 left-4 w-3 h-3 rounded-full bg-primary" />
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            {note.title ? (
              <p className="font-heading text-sm text-foreground leading-snug truncate">
                {note.title}
              </p>
            ) : (
              <p className="font-body text-sm text-foreground leading-snug line-clamp-2">
                {note.content}
              </p>
            )}
          </div>
          {/* Action buttons — ORIGINAL CSS visibility pattern preserved.
              New buttons (Studio, Calendar) slotted in before Pin. */}
          <div
            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Copy"
            >
              {copied ? (
                <Check size={12} className="text-green-500" />
              ) : (
                <Copy size={12} />
              )}
            </button>
            {/* NEW: Studio shortcut */}
            <button
              onClick={handleUseInStudio}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="Use in Studio"
            >
              <Clapperboard size={12} />
            </button>
            {/* NEW: Calendar shortcut */}
            <button
              onClick={handleAddToCalendar}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
              title="Add to Calendar"
            >
              <CalendarDays size={12} />
            </button>
            {/* ORIGINAL: Pin */}
            <button
              onClick={handlePin}
              disabled={pinPending}
              className={`p-1.5 rounded-lg transition-colors ${
                note.is_pinned
                  ? "text-primary hover:bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title={note.is_pinned ? "Unpin" : "Pin"}
            >
              <StickyNote size={12} />
            </button>
            {/* ORIGINAL: Delete */}
            <button
              onClick={handleDelete}
              disabled={deletePending}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete"
            >
              {deletePending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Trash2 size={12} />
              )}
            </button>
          </div>
        </div>

        {note.title && note.content && (
          <p className="font-body text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-2">
            {note.content}
          </p>
        )}

        {/* ORIGINAL footer row — source badge + tags + time.
            Energy emoji added inline next to source badge. */}
        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`font-body text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${sourceMeta.color}`}
            >
              {sourceMeta.label}
            </span>
            {/* NEW: energy emoji — compact, non-intrusive */}
            <EnergyBadge content={note.content || ""} tags={note.tags ?? []} />
            {/* ORIGINAL: tag pills — style preserved exactly */}
            {(note.tags ?? []).slice(0, 2).map((tag) => {
              const meta = STRUCTURAL_TAG_META[tag];
              return (
                <span
                  key={tag}
                  className={`font-body text-[10px] px-1.5 py-0.5 rounded-md
                    ${meta ? meta.color : "bg-muted text-muted-foreground"}`}
                >
                  {meta?.emoji} {tag}
                </span>
              );
            })}
          </div>
          <span className="font-body text-[10px] text-muted-foreground flex-shrink-0">
            {timeAgo(note.updated_at)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── NoteEditor modal ───────────────────────────────────────────────────────────
function NoteEditor({ note, onClose }) {
  // ── ORIGINAL state — untouched ─────────────────────────────────────────────
  const [title,    setTitle]    = useState(note?.title   ?? "");
  const [content,  setContent]  = useState(note?.content ?? "");
  const [tagInput, setTagInput] = useState("");
  const [tags,     setTags]     = useState(note?.tags    ?? []);

  const contentRef = useRef(null);

  const { mutate: createNote, isPending: creating } = useCreateNote();
  const { mutate: updateNote, isPending: updating  } = useUpdateNote();
  const isPending = creating || updating;

  useEffect(() => {
    if (contentRef.current) contentRef.current.focus();
  }, []);

  // ── ORIGINAL handlers — untouched ─────────────────────────────────────────
  const addTag = useCallback(() => {
    const t = tagInput
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags((prev) => [...prev, t]);
      setTagInput("");
    }
  }, [tagInput, tags]);

  const removeTag = useCallback((tag) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleSave = useCallback(() => {
    if (!content.trim() && !title.trim()) return;
    // NEW: merge any inline #hashtags from content into tags before saving
    const inlineTags = extractHashtags(content);
    const mergedTags = sortTags([...new Set([...inlineTags, ...tags])]).slice(0, 5);
    const payload = { title: title.trim(), content: content.trim(), tags: mergedTags };
    if (note?.id) {
      updateNote({ id: note.id, ...payload }, { onSuccess: onClose });
    } else {
      createNote({ ...payload, source: "manual" }, { onSuccess: onClose });
    }
  }, [title, content, tags, note, createNote, updateNote, onClose]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    },
    [onClose, handleSave],
  );

  // ── NEW: live-detected inline hashtags ────────────────────────────────────
  const detectedTags = useMemo(() => extractHashtags(content), [content]);
  const detectedNew  = detectedTags.filter((t) => !tags.includes(t));

  // ── NEW: energy score ─────────────────────────────────────────────────────
  const energy = useMemo(() => scoreNoteEnergy(content, tags), [content, tags]);
  const energyColor = { high: "text-green-600", medium: "text-yellow-600", low: "text-muted-foreground" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onKeyDown={handleKeyDown}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", damping: 26 }}
        className="relative w-full sm:max-w-lg bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl flex flex-col"
        style={{ maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ORIGINAL: mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* ORIGINAL: header — energy indicator added to right side */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {note?.id ? "Edit note" : "New note"}
          </p>
          <div className="flex items-center gap-2">
            {/* NEW: live energy label */}
            {content.trim() && (
              <span className={`font-body text-xs font-semibold ${energyColor[energy.level]}`}>
                {energy.emoji} {energy.label}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ORIGINAL: scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* ORIGINAL: title input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full bg-transparent font-heading text-lg text-foreground placeholder:text-muted-foreground/40 outline-none border-b border-border/50 pb-2"
          />

          {/* ORIGINAL: content textarea — placeholder updated to hint at #tags */}
          <textarea
            ref={contentRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your idea… type #hook, #cta, #story to auto-tag"
            rows={6}
            className="w-full bg-transparent font-body text-sm text-foreground placeholder:text-muted-foreground/40 outline-none resize-none leading-relaxed"
          />

          {/* NEW: detected inline hashtags — shown only when content has #tags
              not already in the tags list */}
          <AnimatePresence>
            {detectedNew.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-wrap gap-1.5 px-3 py-2.5 rounded-xl bg-muted/40 border border-border/50"
              >
                <span className="font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-full">
                  Detected — tap to add
                </span>
                {detectedNew.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (!tags.includes(tag) && tags.length < 5) {
                        setTags((prev) => sortTags([...prev, tag]));
                      }
                    }}
                    className="inline-flex items-center gap-1"
                  >
                    <StructuralTagPill tag={tag} />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ORIGINAL: Tags section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag size={11} className="text-muted-foreground" />
              <span className="font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tags
              </span>
            </div>
            {/* ORIGINAL: tag pills */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => {
                const meta = STRUCTURAL_TAG_META[tag];
                return (
                  <span
                    key={tag}
                    className={`flex items-center gap-1 font-body text-[11px] px-2 py-0.5 rounded-full
                      ${meta ? `${meta.color} border ${meta.border}` : "bg-primary/10 text-primary"}`}
                  >
                    {meta?.emoji} {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:opacity-60"
                    >
                      <X size={10} />
                    </button>
                  </span>
                );
              })}
            </div>

            {/* NEW: structural tag suggestions */}
            {tags.length < 5 && (
              <StructuralTagSuggestions
                currentTags={tags}
                onAdd={(tag) => {
                  if (!tags.includes(tag) && tags.length < 5) {
                    setTags((prev) => sortTags([...prev, tag]));
                  }
                }}
              />
            )}

            {/* ORIGINAL: tag input — limit and keydown unchanged */}
            {tags.length < 5 && (
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add tag, press Enter"
                className="w-full bg-muted/50 rounded-lg px-3 py-1.5 font-body text-xs text-foreground placeholder:text-muted-foreground/50 outline-none border border-transparent focus:border-primary/30 mt-2"
              />
            )}
          </div>
        </div>

        {/* ORIGINAL: footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="font-body text-[10px] text-muted-foreground">
            ⌘S to save · Esc to close
          </p>
          <button
            onClick={handleSave}
            disabled={isPending || (!content.trim() && !title.trim())}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white font-body text-sm font-semibold
                       disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            {isPending ? <Loader2 size={13} className="animate-spin" /> : null}
            {note?.id ? "Update" : "Save note"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Notes Page ────────────────────────────────────────────────────────────
export default function Notes() {
  // ── ORIGINAL state — untouched ─────────────────────────────────────────────
  const [search,       setSearch]       = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [editingNote,  setEditingNote]  = useState(null);
  const [showEditor,   setShowEditor]   = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // NEW: structural tag filter
  const [tagFilter, setTagFilter] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // ORIGINAL: filter construction
  const filters = {};
  if (sourceFilter !== "all") filters.source = sourceFilter;
  if (debouncedSearch.trim()) filters.search = debouncedSearch.trim();

  const { data, isLoading, error, refetch } = useNotes(filters);
  const rawNotes = data?.notes ?? [];

  // NEW: client-side structural tag filter
  const notes = useMemo(() => {
    if (!tagFilter) return rawNotes;
    return rawNotes.filter((n) => (n.tags ?? []).includes(tagFilter));
  }, [rawNotes, tagFilter]);

  // ORIGINAL: handlers — untouched
  const handleNewNote = useCallback(() => {
    setEditingNote(null);
    setShowEditor(true);
  }, []);

  const handleEditNote = useCallback((note) => {
    setEditingNote(note);
    setShowEditor(true);
  }, []);

  const handleCloseEditor = useCallback(() => {
    setShowEditor(false);
    setEditingNote(null);
  }, []);

  // ORIGINAL: pin/unpin split
  const pinnedNotes   = notes.filter((n) => n.is_pinned);
  const unpinnedNotes = notes.filter((n) => !n.is_pinned);

  return (
    <div className="space-y-6 pb-20">
      {/* ORIGINAL: header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl text-foreground mb-0.5">
            Notes
          </h1>
          <p className="font-body text-sm text-muted-foreground">
            Your raw ideas · Saved from Studio · Inspiration
          </p>
        </div>
        <button
          onClick={handleNewNote}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-body text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus size={15} /> New note
        </button>
      </div>

      {/* ORIGINAL: search + source filter row */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border font-body text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40 transition-colors"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["all", "manual", "studio_hook", "studio_caption", "studio_idea"].map(
            (src) => (
              <button
                key={src}
                onClick={() => setSourceFilter(src)}
                className={`px-3 py-2 rounded-xl font-body text-xs font-semibold transition-colors ${
                  sourceFilter === src
                    ? "bg-primary text-white"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {src === "all" ? "All" : (SOURCE_LABELS[src]?.label ?? src)}
              </button>
            ),
          )}
        </div>
      </div>

      {/* NEW: cluster banner — only shown when there are notes */}
      {!isLoading && rawNotes.length > 0 && (
        <NoteClusterBanner
          notes={rawNotes}
          activeTag={tagFilter}
          onTagFilter={(tag) => setTagFilter((prev) => (prev === tag ? null : tag))}
        />
      )}

      {/* NEW: active tag filter indicator */}
      {tagFilter && (
        <div className="flex items-center gap-2">
          <span className="font-body text-xs text-muted-foreground">Filtered by:</span>
          <span className={`inline-flex items-center gap-1 font-body text-[11px] font-semibold px-2 py-0.5 rounded-full border
            ${STRUCTURAL_TAG_META[tagFilter]?.color ?? "bg-muted text-muted-foreground"}
            ${STRUCTURAL_TAG_META[tagFilter]?.border ?? "border-border"}`}
          >
            {STRUCTURAL_TAG_META[tagFilter]?.emoji} #{tagFilter}
            <button onClick={() => setTagFilter(null)} className="ml-1 hover:opacity-60">
              <X size={10} />
            </button>
          </span>
        </div>
      )}

      {/* ORIGINAL: loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* ORIGINAL: error state */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle size={28} className="text-destructive mb-3" />
          <p className="font-body text-sm text-muted-foreground mb-3">
            Could not load notes
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl bg-primary text-white font-body text-sm font-semibold"
          >
            Try again
          </button>
        </div>
      )}

      {/* ORIGINAL: empty state */}
      {!isLoading && !error && notes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <BookOpen size={28} className="text-primary" />
          </div>
          <p className="font-heading text-lg text-foreground mb-2">
            {tagFilter ? `No notes tagged #${tagFilter}` : "No notes yet"}
          </p>
          <p className="font-body text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
            {tagFilter
              ? "Clear the filter or write a new note."
              : "Write a raw idea, or notes will auto-save whenever you generate hooks in Studio."}
          </p>
          {!tagFilter && (
            <button
              onClick={handleNewNote}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-body text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus size={15} /> Write your first note
            </button>
          )}
        </div>
      )}

      {/* ORIGINAL: pinned section */}
      {!isLoading && !error && pinnedNotes.length > 0 && (
        <div>
          <p className="font-body text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
            <StickyNote size={11} /> Pinned
          </p>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            <AnimatePresence mode="popLayout">
              {pinnedNotes.map((note) => (
                <NoteCard key={note.id} note={note} onEdit={handleEditNote} />
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {/* ORIGINAL: all notes section */}
      {!isLoading && !error && unpinnedNotes.length > 0 && (
        <div>
          {pinnedNotes.length > 0 && (
            <p className="font-body text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              All Notes
            </p>
          )}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            <AnimatePresence mode="popLayout">
              {unpinnedNotes.map((note) => (
                <NoteCard key={note.id} note={note} onEdit={handleEditNote} />
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {/* ORIGINAL: editor modal */}
      <AnimatePresence>
        {showEditor && (
          <NoteEditor note={editingNote} onClose={handleCloseEditor} />
        )}
      </AnimatePresence>
    </div>
  );
}