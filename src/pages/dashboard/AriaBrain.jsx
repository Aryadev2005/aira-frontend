/**
 * src/pages/dashboard/AriaBrain.jsx
 *
 * FULL REPLACEMENT of the existing AriaBrain.jsx.
 * Key additions vs original:
 *   1. OpenUI <Renderer /> inside assistant bubbles (renders generative UI from OpenUI Lang)
 *   2. QuickAction event listener — chips emit 'aria:quickAction' → auto-send
 *   3. CSS import for @openuidev/react-ui
 *   4. All original streaming logic, sessions sidebar, tool events kept intact
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Wrench, Brain, Zap, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Renderer } from "@openuidev/react-lang";
import { ariaLibrary } from "@/lib/aria-openui-library";

// Import OpenUI bundled styles (add once, they're scoped)
import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";

import { useFirebaseAuth } from "@/lib/FirebaseAuthContext";
import { auth } from "@/lib/firebase";
import { api } from "@/lib/api";
import { useNavigate, useLocation } from "react-router-dom";
import { useSuggestionFeedback } from "@/hooks/useApi";
import SessionsSidebar from "./SessionsSidebar";
import { apiFetch } from "@/lib/api";

// ── Constants ─────────────────────────────────────────────────────────────────
const STREAM_URL = `${import.meta.env.VITE_API_BASE_URL}/api/v1/agent/stream`;

const GREETING = {
  role: "assistant",
  content:
    'Hey! I\'m **AIRRA** — your AI content strategist 🧠\n\nAsk me anything:\n- "What should I post this week?"\n- "Write me a reel script about street food"\n- "What audio is trending for travel reels?"',
  toolEvents: [],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const extractText = (content) => {
  if (typeof content === "string") return content;
  if (Array.isArray(content))
    return content
      .filter((b) => b?.type === "text")
      .map((b) => b.text ?? "")
      .join("");
  if (
    content &&
    typeof content === "object" &&
    typeof content.text === "string"
  )
    return content.text;
  return content ? String(content) : "";
};

const prettifyTool = (t) =>
  t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// ─────────────────────────────────────────────────────────────────────────────
// OPENUI LANG DETECTION
// The model emits a mix of plain markdown + OpenUI Lang blocks.
// We split on the first "root =" line — everything before is markdown preamble,
// the rest is OpenUI Lang for the Renderer.
// ─────────────────────────────────────────────────────────────────────────────
const hasOpenUILang = (text = "") => /^\s*root\s*=/m.test(text);

const splitOpenUI = (text = "") => {
  const match = text.match(/^(\s*root\s*=[\s\S]*)$/m);
  if (!match) return { markdown: text, openui: "" };
  const splitIdx = text.indexOf(match[0]);
  return {
    markdown: text.slice(0, splitIdx).trim(),
    openui: text.slice(splitIdx).trim(),
  };
};

// ── Tool event pill ───────────────────────────────────────────────────────────
function ToolPill({ tool, status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body
      ${status === "running" ? "bg-primary/10 text-primary border border-primary/20 animate-pulse" : "bg-muted text-muted-foreground border border-border"}`}
    >
      <Wrench size={10} />
      {prettifyTool(tool)}
      {status === "running" && (
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
      )}
    </span>
  );
}

function ToolBar({ toolEvents = [], streaming }) {
  const doneTools = toolEvents.filter((e) => e.status === "done");
  if (!doneTools.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {doneTools.map((e, i) => (
        <ToolPill key={i} tool={e.tool} status="done" />
      ))}
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, isLast, onQuickAction }) {
  const isUser = msg.role === "user";
  const contentStr = extractText(msg.content);
  const { openui, markdown } = splitOpenUI(contentStr);
  const isGenUI = hasOpenUILang(contentStr);

  if (msg.role === "system-ui" && msg.content === "niche-confirmed") {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs font-body font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
          ✅ Niche confirmed — Discovery unlocked!
        </span>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-white text-xs font-bold">A</span>
        </div>
      )}
      <div className={`${isUser ? "max-w-[82%]" : "max-w-[90%] w-full"}`}>
        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-primary text-white"
              : "bg-card border border-border text-foreground"
          }`}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap font-body">
              {contentStr}
            </p>
          ) : isGenUI ? (
            /* ── GENERATIVE UI BRANCH ── */
            <div className="space-y-3">
              {/* Markdown preamble (before OpenUI Lang) */}
              {markdown && (
                <ReactMarkdown
                  className="text-sm prose prose-sm max-w-none
                  [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
                  prose-headings:text-foreground prose-headings:font-heading
                  prose-p:text-foreground/80 prose-strong:text-foreground
                  prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:rounded"
                >
                  {markdown}
                </ReactMarkdown>
              )}
              {/* OpenUI Renderer — renders the component tree */}
              <div className="space-y-3">
                <Renderer
                  library={ariaLibrary}
                  response={openui}
                  isStreaming={!!msg._streaming}
                />
              </div>
              {msg._streaming && (
                <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse rounded-sm ml-0.5 align-middle" />
              )}
            </div>
          ) : (
            /* ── PLAIN MARKDOWN BRANCH (original behaviour) ── */
            <>
              <ReactMarkdown
                className="text-sm prose prose-sm max-w-none
                [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
                prose-headings:text-foreground prose-headings:font-heading
                prose-p:text-foreground/80 prose-strong:text-foreground
                prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:rounded"
              >
                {contentStr}
              </ReactMarkdown>
              {msg._streaming && (
                <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse rounded-sm ml-0.5 align-middle" />
              )}
            </>
          )}
        </div>

        {/* Tool bar below bubble */}
        {!isUser && (
          <ToolBar toolEvents={msg.toolEvents} streaming={!!msg._streaming} />
        )}
      </div>
    </div>
  );
}

// ── Stream agent (unchanged from original, kept for reference) ────────────────
async function streamAgent({
  message,
  sessionId,
  entryScreen,
  context,
  onToolStart,
  onToolEnd,
  onToken,
  onSuggestions,
  onDone,
  onError,
}) {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(STREAM_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message, sessionId, entryScreen, context }),
  });
  if (!res.ok) {
    onError();
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "",
    full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop() ?? "";
    for (const part of parts) {
      if (!part.startsWith("data: ")) continue;
      const raw = part.slice(6).trim();
      if (raw === "[DONE]") {
        onDone(full);
        return;
      }
      try {
        const ev = JSON.parse(raw);
        if (ev.type === "token") {
          full += extractText(ev.content);
          onToken(full);
        }
        if (ev.type === "tool_start") onToolStart(ev.tool);
        if (ev.type === "tool_end") onToolEnd(ev.tool);
        if (ev.type === "suggestions") onSuggestions(ev.data);
        if (ev.type === "done") {
          onDone(extractText(ev.message) || full);
          return;
        }
        if (ev.type === "error") {
          onError();
          return;
        }
      } catch {
        /* skip malformed event */
      }
    }
  }
  onDone(full);
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AriaBrain() {
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [activeTools, setActiveTools] = useState([]);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const { user, dbUser, syncWithBackend } = useFirebaseAuth();
  const { mutateAsync: submitFeedback } = useSuggestionFeedback();
  const chatEndRef = useRef(null);
  const skipGreetRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef(null);

  const entryScreen = location.state?.entryScreen || "direct";
  const sessionCtx = location.state?.context || {};

  // ── Quick Action event listener (from OpenUI QuickActions component chips) ──
  useEffect(() => {
    const handler = (e) => {
      const msg = e.detail;
      if (msg && !streaming) {
        setInput(msg);
        // Small delay so input renders, then send
        setTimeout(() => handleSendMessage(msg), 80);
      }
    };
    window.addEventListener("aria:quickAction", handler);
    return () => window.removeEventListener("aria:quickAction", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaming]);

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Personalized greeting ────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;
    if (skipGreetRef.current) {
      skipGreetRef.current = false;
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const freshAnalysis = sessionStorage.getItem("aria_fresh_analysis");
        const screen = freshAnalysis ? "fresh_analysis" : entryScreen;
        const res = await api.get(
          `/brain/greet?sessionId=${sessionId}&entryScreen=${screen}`,
        );
        const greeting = res?.data?.greeting || res?.greeting;
        if (!cancelled)
          setMessages([
            {
              role: "assistant",
              content:
                greeting || "Hey! I'm ARIA 🧠 What are we working on today?",
              toolEvents: [],
            },
          ]);
        if (freshAnalysis) {
          sessionStorage.removeItem("aria_fresh_analysis");
          setTimeout(() => autoSendAnalysis(), 800);
        }
      } catch {
        if (!cancelled)
          setMessages([
            {
              role: "assistant",
              content: "Hey! I'm ARIA 🧠 What are we working on today?",
              toolEvents: [],
            },
          ]);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // ── Shared updateLast helper ──────────────────────────────────────────────
  const updateLast = useCallback((fn) => {
    setMessages((prev) => {
      const arr = [...prev];
      const last = arr[arr.length - 1];
      if (last && (last._streaming || last.role === "assistant"))
        arr[arr.length - 1] = fn(last);
      return arr;
    });
  }, []);

  const autoSendAnalysis = useCallback(async () => {
    const prompt =
      "Show me my complete profile analysis — my top performing content, niche, archetype, and what I should focus on next.";
    handleSendMessage(prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load past session ────────────────────────────────────────────────────
  const loadSession = useCallback(
    async (sid) => {
      setLoadingHistory(true);
      try {
        const res = await apiFetch(`/api/v1/agent/sessions/${sid}/messages`);
        const msgs = (res?.messages || []).map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
          toolEvents: (m.tools_used || []).map((t) => ({
            tool: t.name,
            status: "done",
          })),
        }));
        setMessages(msgs.length ? msgs : [GREETING]);
        skipGreetRef.current = true;
        setSessionId(sid);
      } catch {
        setMessages([GREETING]);
      } finally {
        setLoadingHistory(false);
      }
    },
    [sessionId],
  );

  const startNewChat = useCallback(() => {
    setMessages([GREETING]);
    setInput("");
    setActiveTools([]);
    setSessionId(crypto.randomUUID());
  }, []);

  // ── Core send logic ───────────────────────────────────────────────────────
  const handleSendMessage = useCallback(
    async (userMsg) => {
      if (!userMsg.trim() || streaming) return;
      setInput("");
      setActiveTools([]);

      setMessages((prev) => [
        ...prev,
        { role: "user", content: userMsg, toolEvents: [] },
        { role: "assistant", content: "", toolEvents: [], _streaming: true },
      ]);
      setStreaming(true);

      await streamAgent({
        message: userMsg,
        sessionId,
        entryScreen,
        context: sessionCtx,
        onToolStart: (tool) => {
          setActiveTools((p) => [...p.filter((t) => t !== tool), tool]);
          updateLast((last) => ({
            ...last,
            toolEvents: [
              ...(last.toolEvents || []),
              { tool, status: "running" },
            ],
          }));
        },
        onToolEnd: (tool) => {
          setActiveTools((p) => p.filter((t) => t !== tool));
          updateLast((last) => ({
            ...last,
            toolEvents: (last.toolEvents || []).map((e) =>
              e.tool === tool && e.status === "running"
                ? { ...e, status: "done" }
                : e,
            ),
          }));
        },
        onToken: (full) => updateLast((last) => ({ ...last, content: full })),
        onSuggestions: (suggestions) => {
          updateLast((last) => ({ ...last, followUpSuggestions: suggestions }));
        },
        onDone: (full) => {
          setActiveTools([]);
          setStreaming(false);
          updateLast((last) => ({
            role: "assistant",
            content: full || "Done!",
            toolEvents: (last.toolEvents || []).map((e) =>
              e.status === "running" ? { ...e, status: "done" } : e,
            ),
          }));
          if (user) syncWithBackend(user).catch(() => {});
          // Niche confirmation
          const confirmPhrases = [
            "yes",
            "correct",
            "that's right",
            "perfect",
            "accurate",
            "haan",
            "bilkul",
          ];
          if (confirmPhrases.some((p) => userMsg.toLowerCase().includes(p))) {
            api.put("/users/confirm-niche").catch(() => {});
            setTimeout(
              () =>
                setMessages((prev) => [
                  ...prev,
                  {
                    role: "system-ui",
                    content: "niche-confirmed",
                    toolEvents: [],
                  },
                ]),
              1000,
            );
          }
        },
        onError: () => {
          setActiveTools([]);
          setStreaming(false);
          updateLast(() => ({
            role: "assistant",
            content: "Something went wrong. Please try again.",
            toolEvents: [],
          }));
        },
      });
    },
    [
      streaming,
      sessionId,
      entryScreen,
      sessionCtx,
      updateLast,
      user,
      syncWithBackend,
    ],
  );

  const handleSend = () => handleSendMessage(input.trim());

  const hasStreamingBubble = messages.some((m) => m._streaming);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full overflow-hidden">
      {/* Sessions sidebar */}
      <SessionsSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((p) => !p)}
        onSelectSession={loadSession}
        onNewChat={startNewChat}
        currentSessionId={sessionId}
      />

      {/* Chat panel */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {loadingHistory && (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              msg={msg}
              isLast={i === messages.length - 1}
              onQuickAction={handleSendMessage}
            />
          ))}

          {/* Active tools overlay (when streaming) */}
          {streaming && activeTools.length > 0 && !hasStreamingBubble && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-xs font-bold">A</span>
              </div>
              <div className="bg-card border border-border rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Zap size={12} className="text-primary animate-pulse" />
                  Using tools...
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeTools.map((t, i) => (
                    <ToolPill key={i} tool={t} status="running" />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Thinking indicator */}
          {streaming && activeTools.length === 0 && !hasStreamingBubble && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-xs font-bold">A</span>
              </div>
              <div className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-2">
                <Brain size={13} className="text-primary animate-pulse" />
                <div className="flex gap-1">
                  {[0, 150, 300].map((d) => (
                    <div
                      key={d}
                      className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                      style={{ animationDelay: `${d}ms` }}
                    />
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
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 mb-2 text-[11px] text-muted-foreground/50"
              >
                <Wrench size={11} />
                {activeTools.map(prettifyTool).join(", ")}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask ARIA anything..."
              disabled={streaming || loadingHistory}
              className="flex-1 bg-card border border-border rounded-full px-5 py-3 text-sm font-body
                text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2
                focus:ring-primary/20 disabled:opacity-50 transition-opacity"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || streaming}
              className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center
                hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {streaming ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
