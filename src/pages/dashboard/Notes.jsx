// src/pages/dashboard/Notes.jsx
import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import {
  useNotes,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  useToggleNotePin,
} from "@/hooks/useApi";

// ── Animation variants ────────────────────────────────────────────────────────
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
  manual: { label: "Manual", color: "bg-muted text-muted-foreground" },
  studio_hook: { label: "Hook", color: "bg-primary/10 text-primary" },
  studio_caption: { label: "Caption", color: "bg-blue-500/10 text-blue-600" },
  studio_idea: { label: "Idea", color: "bg-amber-500/10 text-amber-600" },
  studio_script: {
    label: "Script",
    color: "bg-purple-500/10 text-purple-600",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── NoteCard component ────────────────────────────────────────────────────────
function NoteCard({ note = {}, onEdit }) {
  const [copied, setCopied] = useState(false);
  const { mutate: togglePin, isPending: pinPending } = useToggleNotePin();
  const { mutate: deleteNote, isPending: deletePending } = useDeleteNote();

  const sourceMeta = SOURCE_LABELS[note.source] ?? SOURCE_LABELS.manual;

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

        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`font-body text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${sourceMeta.color}`}
            >
              {sourceMeta.label}
            </span>
            {(note.tags ?? []).slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="font-body text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="font-body text-[10px] text-muted-foreground flex-shrink-0">
            {timeAgo(note.updated_at)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── NoteEditor modal ──────────────────────────────────────────────────────────
function NoteEditor({ note, onClose }) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState(note?.tags ?? []);
  const contentRef = useRef(null);

  const { mutate: createNote, isPending: creating } = useCreateNote();
  const { mutate: updateNote, isPending: updating } = useUpdateNote();
  const isPending = creating || updating;

  useEffect(() => {
    if (contentRef.current) contentRef.current.focus();
  }, []);

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
    const payload = { title: title.trim(), content: content.trim(), tags };
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
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {note?.id ? "Edit note" : "New note"}
          </p>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full bg-transparent font-heading text-lg text-foreground placeholder:text-muted-foreground/40 outline-none border-b border-border/50 pb-2"
          />

          <textarea
            ref={contentRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your idea, observation, or inspiration here…"
            rows={6}
            className="w-full bg-transparent font-body text-sm text-foreground placeholder:text-muted-foreground/40 outline-none resize-none leading-relaxed"
          />

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag size={11} className="text-muted-foreground" />
              <span className="font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tags
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 font-body text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-primary/60"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
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
                className="w-full bg-muted/50 rounded-lg px-3 py-1.5 font-body text-xs text-foreground placeholder:text-muted-foreground/50 outline-none border border-transparent focus:border-primary/30"
              />
            )}
          </div>
        </div>

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
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [editingNote, setEditingNote] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const filters = {};
  if (sourceFilter !== "all") filters.source = sourceFilter;
  if (debouncedSearch.trim()) filters.search = debouncedSearch.trim();

  const { data, isLoading, error, refetch } = useNotes(filters);
  const notes = data?.notes ?? [];

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

  const pinnedNotes = notes.filter((n) => n.is_pinned);
  const unpinnedNotes = notes.filter((n) => !n.is_pinned);

  return (
    <div className="space-y-6 pb-20">
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

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

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

      {!isLoading && !error && notes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <BookOpen size={28} className="text-primary" />
          </div>
          <p className="font-heading text-lg text-foreground mb-2">
            No notes yet
          </p>
          <p className="font-body text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
            Write a raw idea, or notes will auto-save whenever you generate
            hooks in Studio.
          </p>
          <button
            onClick={handleNewNote}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-body text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus size={15} /> Write your first note
          </button>
        </div>
      )}

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

      <AnimatePresence>
        {showEditor && (
          <NoteEditor note={editingNote} onClose={handleCloseEditor} />
        )}
      </AnimatePresence>
    </div>
  );
}
