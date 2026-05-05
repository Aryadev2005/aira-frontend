import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Wrench, Brain, ChevronDown, ChevronRight, Zap, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useFirebaseAuth } from '@/lib/FirebaseAuthContext';
import { auth } from '@/lib/firebase';
import { api } from '@/lib/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSuggestionFeedback } from '@/hooks/useApi';
import SessionsSidebar, { apiFetch } from './SessionsSidebar';

// ── Constants ─────────────────────────────────────────────────────────────────
const STREAM_URL = `${import.meta.env.VITE_API_BASE_URL}/api/v1/agent/stream`;

const GREETING = {
  role: 'assistant',
  content: "Hey! I'm **ARIA** — your AI content strategist 🧠\n\nAsk me anything:\n- \"What should I post this week?\"\n- \"Write me a reel script about street food\"\n- \"What audio is trending for travel reels?\"",
  toolEvents: [],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
// Normalize OpenAI content-block arrays (or any type) → plain string
const extractText = (content) => {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter(b => b?.type === 'text')
      .map(b => b.text ?? '')
      .join('');
  }
  if (content && typeof content === 'object' && typeof content.text === 'string') return content.text;
  return content ? JSON.stringify(content, null, 2) : '';
};

const prettifyTool = (n = '') => n.replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const toolColor = (n = '') => {
  if (n.startsWith('spotify'))  return { bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/20' };
  if (n.startsWith('instagram')) return { bg: 'bg-pink-500/10',  text: 'text-pink-400',   border: 'border-pink-500/20' };
  if (n.startsWith('apify'))    return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' };
  if (n.startsWith('get_db') || n.startsWith('get_user')) return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' };
  return { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' };
};

// ── SSE stream helper ─────────────────────────────────────────────────────────
const streamAgent = async ({ message, sessionId, entryScreen, context, onToolStart, onToolEnd, onToken, onDone, onError }) => {
  try {
    const token = await auth.currentUser?.getIdToken(true);
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(STREAM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        message,
        sessionId,
        // Bug fix #5: pass entryScreen + context so ARIA opens with the right behaviour
        entryScreen: entryScreen || 'direct',
        context: context || {},
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '', full = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') { onDone(full); return; }
        let evt;
        try { evt = JSON.parse(raw); } catch { continue; }
        switch (evt.type) {
          case 'tool_start': onToolStart(evt.tool, evt.input); break;
          case 'tool_end':   onToolEnd(evt.tool); break;
          case 'token': {
            // Guard against object tokens from OpenAI content blocks
            const chunk = typeof evt.content === 'string'
              ? evt.content
              : extractText(evt.content);
            full += chunk;
            onToken(full);
            break;
          }
          case 'done':  onDone(extractText(evt.message) || full); return;
          case 'error': throw new Error(evt.message || 'Stream error');
        }
      }
    }
    onDone(full);
  } catch (err) { onError(err); }
};

// ── UI sub-components ─────────────────────────────────────────────────────────
function ToolPill({ tool, status }) {
  const c = toolColor(tool);
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${c.bg} ${c.text} ${c.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'running' ? 'animate-pulse bg-current' : 'bg-current opacity-60'}`} />
      {prettifyTool(tool)}{status === 'done' && <span className="opacity-50">✓</span>}
    </motion.span>
  );
}

function ToolBar({ toolEvents, streaming }) {
  const [open, setOpen] = useState(false);
  if (!toolEvents?.length) return null;
  return (
    <div className="mt-2">
      <button onClick={() => setOpen(v => !v)} className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors">
        <Wrench size={11} />
        <span>{toolEvents.length} tool{toolEvents.length !== 1 ? 's' : ''}</span>
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex flex-wrap gap-1.5 mt-2">
              {toolEvents.map((e, i) => <ToolPill key={i} tool={e.tool} status={e.status} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Suggestion quick-reply buttons — shown after ARIA messages that have followUpSuggestions
function SuggestionQuickReply({ suggestions, onFeedback }) {
  const [submitted, setSubmitted]   = useState(false);
  const [loading,   setLoading]     = useState(false);
  const [showThanks, setShowThanks] = useState(false);

  if (!suggestions?.length) return null;
  if (showThanks) {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="font-body text-xs text-muted-foreground ml-2 mt-1"
      >
        Got it — ARIA will remember that.
      </motion.p>
    );
  }
  if (submitted) return null;

  const suggestion = suggestions[0]; // handle first suggestion only

  const handleFeedback = async (outcome) => {
    setLoading(true);
    try {
      await onFeedback({ suggestionId: suggestion.id, outcome });
      setSubmitted(true);
      setShowThanks(true);
      setTimeout(() => setShowThanks(false), 3000);
    } catch {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2 mt-2 ml-2 flex-wrap"
    >
      {[
        { label: '✅ Yes, I tried it', outcome: 'followed',   style: 'border-rising/30 text-rising bg-rising/5' },
        { label: '🔄 Sort of',         outcome: 'partially', style: 'border-border    text-muted-foreground' },
        { label: '❌ Didn\'t get to it', outcome: 'ignored',  style: 'border-border    text-muted-foreground' },
      ].map(btn => (
        <button
          key={btn.outcome}
          onClick={() => handleFeedback(btn.outcome)}
          disabled={loading}
          className={`px-3 py-1.5 rounded-pill border text-xs font-body font-semibold transition-colors disabled:opacity-40 ${btn.style}`}
        >
          {btn.label}
        </button>
      ))}
    </motion.div>
  );
}

function Bubble({ msg, isLast, navigate, dbUser }) {
  const isUser = msg.role === 'user';

  if (msg.role === 'system-ui' && msg.content === 'niche-confirmed') {
    return (
      <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 mx-2 my-1">
        <div>
          <p className="text-sm font-semibold text-foreground">✅ Niche confirmed</p>
          <p className="text-xs text-muted-foreground mt-0.5">Ready to see personalised trends?</p>
        </div>
        <button onClick={() => navigate('/dashboard/discover')} className="ml-4 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors">
          Go to Discovery →
        </button>
      </div>
    );
  }

  // Always normalize content to a plain string before rendering
  const contentStr = extractText(msg.content);

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-white text-xs font-bold">A</span>
        </div>
      )}
      <div className="max-w-[82%]">
        <div className={`rounded-2xl px-4 py-3 ${isUser ? 'bg-primary text-white' : 'bg-card border border-border text-foreground'}`}>
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{contentStr}</p>
          ) : (
            <>
              <ReactMarkdown className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 prose-headings:text-foreground prose-p:text-foreground/80 prose-strong:text-foreground prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:rounded">
                {contentStr}
              </ReactMarkdown>
              {msg._streaming && <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse rounded-sm ml-0.5 align-middle" />}
            </>
          )}
        </div>
        {!isUser && <ToolBar toolEvents={msg.toolEvents} streaming={!!msg._streaming} />}
        {!isUser && dbUser?.aria_confirmed_niche && isLast && !msg._streaming && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => navigate('/dashboard/discover')}
            className="mt-3 flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
            <Sparkles size={16} />Go to Discovery
          </motion.button>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AriaBrain() {
  const [messages, setMessages]         = useState([GREETING]);
  const [input, setInput]               = useState('');
  const [streaming, setStreaming]        = useState(false);
  const [activeTools, setActiveTools]   = useState([]);
  const [sessionId, setSessionId]       = useState(() => crypto.randomUUID());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loadingHistory, setLoadingHistory]     = useState(false);

  const { user, dbUser, syncWithBackend } = useFirebaseAuth();
  const { mutateAsync: submitFeedback } = useSuggestionFeedback();
  const chatEndRef    = useRef(null);
  // When true, the greeting effect will skip for one sessionId change (used when loading history)
  const skipGreetRef  = useRef(false);
  const navigate      = useNavigate();
  const location      = useLocation();

  // Derive entryScreen + session context from navigation state (set by the page that navigated here)
  // e.g. <Link to="/dashboard/brain" state={{ entryScreen: 'profile' }} />
  const entryScreen   = location.state?.entryScreen || 'direct';
  const sessionCtx    = location.state?.context || {};

  // ── Auto-scroll ─────────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Load personalized greeting on new session ────────────────────────────
  useEffect(() => {
    if (!sessionId) return;

    // If we just loaded a past session, skip the greeting for this run
    if (skipGreetRef.current) {
      skipGreetRef.current = false;
      return;
    }

    let cancelled = false;

    const loadGreeting = async () => {
      try {
        const freshAnalysis = sessionStorage.getItem('aria_fresh_analysis');
        const entryScreen   = freshAnalysis ? 'fresh_analysis' : 'direct';

        const res      = await api.get(`/brain/greet?sessionId=${sessionId}&entryScreen=${entryScreen}`);
        const greeting = res?.data?.greeting || res?.greeting;

        if (cancelled) return;

        setMessages([{
          role: 'assistant',
          content: greeting || "Hey! I'm ARIA — your AI content strategist 🧠\n\nWhat are we working on today?",
          toolEvents: [],
        }]);

        if (freshAnalysis) {
          sessionStorage.removeItem('aria_fresh_analysis');
          setTimeout(() => autoSendAnalysis(), 800);
        }
      } catch {
        if (!cancelled) {
          setMessages([{ role: 'assistant', content: "Hey! I'm ARIA 🧠 What are we working on today?", toolEvents: [] }]);
        }
      }
    };

    loadGreeting();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // ── Shared updateLast helper ─────────────────────────────────────────────
  const updateLast = useCallback((fn) => {
    setMessages(prev => {
      const arr  = [...prev];
      const last = arr[arr.length - 1];
      if (last && (last._streaming || last.role === 'assistant')) {
        arr[arr.length - 1] = fn(last);
      }
      return arr;
    });
  }, []);

  // ── Auto-send analysis after fresh Instagram connect ─────────────────────
  const autoSendAnalysis = useCallback(async () => {
    const analysisPrompt = "Show me my complete profile analysis — my top performing content, niche, archetype, and what I should focus on next.";

    setMessages(prev => [
      ...prev,
      { role: 'user',      content: analysisPrompt, toolEvents: [] },
      { role: 'assistant', content: '',              toolEvents: [], _streaming: true },
    ]);
    setStreaming(true);

    await streamAgent({
      message:  analysisPrompt,
      sessionId,
      entryScreen,
      context: sessionCtx,
      onToolStart: (tool) => {
        setActiveTools(p => [...p.filter(t => t !== tool), tool]);
        updateLast(last => ({ ...last, toolEvents: [...(last.toolEvents || []), { tool, status: 'running' }] }));
      },
      onToolEnd: (tool) => {
        setActiveTools(p => p.filter(t => t !== tool));
        updateLast(last => ({ ...last, toolEvents: (last.toolEvents || []).map(e => e.tool === tool && e.status === 'running' ? { ...e, status: 'done' } : e) }));
      },
      onToken:  (full) => updateLast(last => ({ ...last, content: full })),
      onDone:   (full) => {
        setActiveTools([]);
        setStreaming(false);
        updateLast(last => ({
          role: 'assistant',
          content: full || 'Done!',
          toolEvents: (last.toolEvents || []).map(e => e.status === 'running' ? { ...e, status: 'done' } : e),
        }));
      },
      onError: () => {
        setActiveTools([]);
        setStreaming(false);
        updateLast(() => ({ role: 'assistant', content: "Let me pull up your analysis — ask me 'what was my best post?' or 'what's my niche?' to get started!", toolEvents: [] }));
      },
    });
  }, [sessionId, updateLast]);

  // ── Load a past session ──────────────────────────────────────────────────
  const loadSession = useCallback(async (sid) => {
    if (sid === sessionId) return;

    setLoadingHistory(true);
    setMessages([]);

    try {
      const data = await apiFetch(`/sessions/${sid}/messages`);
      const msgs = (data?.messages || []).map(m => ({
        role:       m.role,
        content:    extractText(m.content),  // normalize any content-block arrays
        toolEvents: (m.tool_calls || []).map(t => ({ tool: t.name || t, status: 'done' })),
      }));

      // Set messages first, then flip the flag, then update sessionId.
      // The greeting effect fires on sessionId change; the flag ensures it skips once.
      setMessages(msgs.length ? msgs : [GREETING]);
      skipGreetRef.current = true;
      setSessionId(sid);
    } catch {
      setMessages([GREETING]);
    } finally {
      setLoadingHistory(false);
    }
  }, [sessionId]);

  const startNewChat = useCallback(() => {
    setMessages([GREETING]);
    setInput('');
    setActiveTools([]);
    // new UUID triggers greeting effect naturally
    setSessionId(crypto.randomUUID());
  }, []);

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || streaming) return;
    const userMsg = input.trim();
    setInput('');
    setActiveTools([]);

    setMessages(prev => [
      ...prev,
      { role: 'user',      content: userMsg, toolEvents: [] },
      { role: 'assistant', content: '',      toolEvents: [], _streaming: true },
    ]);
    setStreaming(true);

    await streamAgent({
      message:  userMsg,
      sessionId,
      entryScreen,
      context: sessionCtx,
      onToolStart: (tool) => {
        setActiveTools(p => [...p.filter(t => t !== tool), tool]);
        updateLast(last => ({ ...last, toolEvents: [...(last.toolEvents || []), { tool, status: 'running' }] }));
      },
      onToolEnd: (tool) => {
        setActiveTools(p => p.filter(t => t !== tool));
        updateLast(last => ({ ...last, toolEvents: (last.toolEvents || []).map(e => e.tool === tool && e.status === 'running' ? { ...e, status: 'done' } : e) }));
      },
      onToken:  (full) => updateLast(last => ({ ...last, content: full })),
      onDone:   (full) => {
        setActiveTools([]);
        setStreaming(false);
        updateLast(last => ({
          role: 'assistant',
          content: full || 'Done!',
          toolEvents: (last.toolEvents || []).map(e => e.status === 'running' ? { ...e, status: 'done' } : e),
        }));
        if (user) syncWithBackend(user).catch(() => {});
        // Niche confirmation
        const confirmPhrases = ['yes', 'correct', "that's right", 'perfect', 'accurate', 'haan', 'bilkul'];
        if (confirmPhrases.some(p => userMsg.toLowerCase().includes(p))) {
          api.put('/users/confirm-niche').catch(() => {});
          setTimeout(() => setMessages(prev => [...prev, { role: 'system-ui', content: 'niche-confirmed', toolEvents: [] }]), 1000);
        }
      },
      onError: () => {
        setActiveTools([]);
        setStreaming(false);
        updateLast(() => ({ role: 'assistant', content: 'Something went wrong. Please try again.', toolEvents: [] }));
      },
    });
  };

  // ── Render ───────────────────────────────────────────────────────────────
  // True when the last message is already an in-progress streaming bubble
  const hasStreamingBubble = messages[messages.length - 1]?._streaming === true;
  return (
    <div className="flex h-full overflow-hidden">
      {/* Sessions Sidebar */}
      <SessionsSidebar
        activeSessionId={sessionId}
        onSelectSession={loadSession}
        onNewChat={startNewChat}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(v => !v)}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h1 className="font-heading text-xl text-foreground">ARIA Brain</h1>
            <p className="text-muted-foreground text-xs mt-0.5">Your AI content strategist</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Zap size={12} className="text-primary" />
            <span className="text-[11px] font-medium text-primary">Agentic · Live tools</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-primary/40" />
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
                  <Bubble msg={msg} isLast={i === messages.length - 1} navigate={navigate} dbUser={dbUser} />
                  {msg.role === 'assistant' && msg.followUpSuggestions?.length > 0 && (
                    <SuggestionQuickReply
                      suggestions={msg.followUpSuggestions}
                      onFeedback={submitFeedback}
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {/* Tool activity indicator — only when no streaming bubble yet */}
          {streaming && activeTools.length > 0 && !hasStreamingBubble && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-xs font-bold">A</span>
              </div>
              <div className="bg-card border border-border rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Zap size={12} className="text-primary animate-pulse" />Using tools...
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeTools.map((t, i) => <ToolPill key={i} tool={t} status="running" />)}
                </div>
              </div>
            </div>
          )}

          {/* Thinking indicator — only when no streaming bubble yet */}
          {streaming && activeTools.length === 0 && !hasStreamingBubble && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-xs font-bold">A</span>
              </div>
              <div className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-2">
                <Brain size={13} className="text-primary animate-pulse" />
                <div className="flex gap-1">
                  {[0, 150, 300].map(d => (
                    <div key={d} className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-border flex-shrink-0">
          <AnimatePresence>
            {streaming && activeTools.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 mb-2 text-[11px] text-muted-foreground/50">
                <Wrench size={11} />{activeTools.map(prettifyTool).join(', ')}
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask ARIA anything..."
              disabled={streaming || loadingHistory}
              className="flex-1 bg-card border border-border rounded-full px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-opacity"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || streaming}
              className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {streaming
                ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}