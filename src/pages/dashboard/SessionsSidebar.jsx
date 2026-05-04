import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, MessageSquare, Trash2, Pencil, Check, X, Loader2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { auth } from '@/lib/firebase';

const API = `${import.meta.env.VITE_API_BASE_URL}/api/v1/agent`;

const getToken = async () => {
  const u = auth.currentUser;
  if (!u) throw new Error('Not authenticated');
  return u.getIdToken(true);
};

const apiFetch = async (path, opts = {}) => {
  const token = await getToken();
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
  if (res.status === 204) return null;
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Request failed');
  return json.data;
};

const timeLabel = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

function RenameInput({ current, onSave, onCancel }) {
  const [val, setVal] = useState(current);
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  return (
    <form onSubmit={(e) => { e.preventDefault(); val.trim() && onSave(val.trim()); }}
      className="flex items-center gap-1 w-full"
    >
      <input
        ref={ref}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="flex-1 bg-transparent text-xs text-foreground border-b border-primary/40 outline-none py-0.5 min-w-0"
        maxLength={80}
      />
      <button type="submit" className="text-emerald-400 hover:text-emerald-300 p-0.5"><Check size={12} /></button>
      <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground p-0.5"><X size={12} /></button>
    </form>
  );
}

function SessionItem({ session, isActive, onSelect, onRename, onDelete }) {
  const [renaming, setRenaming] = useState(false);
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`group relative flex items-start gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
        isActive ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
      }`}
      onClick={() => !renaming && onSelect(session.session_id)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <MessageSquare size={13} className={`mt-0.5 flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground/50'}`} />

      <div className="flex-1 min-w-0">
        {renaming ? (
          <RenameInput
            current={session.title}
            onSave={(t) => { onRename(session.session_id, t); setRenaming(false); }}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <>
            <p className={`text-xs font-medium truncate leading-tight ${isActive ? 'text-foreground' : 'text-foreground/80'}`}>
              {session.title}
            </p>
            {session.preview && (
              <p className="text-[10px] text-muted-foreground/60 truncate mt-0.5 leading-tight">
                {session.preview}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground/40 mt-1">{timeLabel(session.updated_at)}</p>
          </>
        )}
      </div>

      {/* Action buttons */}
      <AnimatePresence>
        {showActions && !renaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute right-2 top-2 flex gap-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setRenaming(true)}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground/60 hover:text-foreground transition-colors"
            >
              <Pencil size={11} />
            </button>
            <button
              onClick={() => onDelete(session.session_id)}
              className="p-1 rounded-md hover:bg-red-500/10 text-muted-foreground/60 hover:text-red-400 transition-colors"
            >
              <Trash2 size={11} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function SessionsSidebar({ activeSessionId, onSelectSession, onNewChat, collapsed, onToggle }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch('/sessions');
      setSessions(data || []);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Refresh when active session changes (new message was sent)
  useEffect(() => {
    if (activeSessionId) load();
  }, [activeSessionId, load]);

  const handleDelete = async (sessionId) => {
    try {
      await apiFetch(`/sessions/${sessionId}`, { method: 'DELETE' });
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
      if (sessionId === activeSessionId) onNewChat();
    } catch {/* ignore */}
  };

  const handleRename = async (sessionId, title) => {
    try {
      await apiFetch(`/sessions/${sessionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      });
      setSessions((prev) => prev.map((s) => s.session_id === sessionId ? { ...s, title } : s));
    } catch {/* ignore */}
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 48 : 260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex-shrink-0 flex flex-col bg-card border-r border-border overflow-hidden"
    >
      {/* Header */}
      <div className={`flex ${collapsed ? 'flex-col justify-center items-center py-4 gap-4 px-0' : 'items-center gap-2 px-3 py-4'} border-b border-border`}>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            Chats
          </motion.span>
        )}
        <button
          onClick={onNewChat}
          title="New chat"
          className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors flex-shrink-0"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors flex-shrink-0"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Session list */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={16} className="animate-spin text-muted-foreground/40" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-[11px] text-muted-foreground/40 text-center py-8 px-4">
              No chats yet. Start a conversation!
            </p>
          ) : (
            sessions.map((s) => (
              <SessionItem
                key={s.session_id}
                session={s}
                isActive={s.session_id === activeSessionId}
                onSelect={onSelectSession}
                onRename={handleRename}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      )}
    </motion.aside>
  );
}

// Export the apiFetch for use by AriaBrain
export { apiFetch };
