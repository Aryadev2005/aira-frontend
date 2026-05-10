import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Brain,
  ChevronDown,
  ChevronRight,
  Loader2,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { auth } from "../../lib/firebase";

import { useFirebaseAuth } from "../../lib/FirebaseAuthContext";
import { useSuggestionFeedback } from "../../hooks/useApi";
import SessionsSidebar from "./SessionsSidebar";
import ARIABlockRenderer from "../../components/aria/ARIABlockRenderer";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const API_BASE = `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000"}/api/v1`;
const STREAM_URL = `${API_BASE}/agent/stream`;

/** @type {import('ai').UIMessage} */
const GREETING = {
  id: "greeting",
  role: "assistant",
  parts: [
    {
      type: "text",
      text: "Hey! I'm ARIA, your AI content strategist. What are we working on today?",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const prettifyTool = (n = "") =>
  n.replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const toolColor = (n = "") => {
  if (n.startsWith("get_db_trending_songs") || n.includes("song"))
    return {
      bg: "bg-green-500/10",
      text: "text-green-600",
      border: "border-green-500/20",
    };
  if (n.startsWith("get_user"))
    return {
      bg: "bg-blue-500/10",
      text: "text-blue-600",
      border: "border-blue-500/20",
    };
  if (n.startsWith("get_youtube") || n.includes("youtube"))
    return {
      bg: "bg-red-500/10",
      text: "text-red-600",
      border: "border-red-500/20",
    };
  if (n.includes("trend") || n.includes("hybrid"))
    return {
      bg: "bg-primary/10",
      text: "text-primary",
      border: "border-primary/20",
    };
  if (n.includes("idea") || n.includes("viral"))
    return {
      bg: "bg-amber-500/10",
      text: "text-amber-600",
      border: "border-amber-500/20",
    };
  return {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────
function ToolPill({ tool, state }) {
  const c = toolColor(tool);
  const isRunning = state === "input-available" || state === "running";
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${c.bg} ${c.text} ${c.border}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full bg-current ${isRunning ? "animate-pulse" : "opacity-50"}`}
      />
      {prettifyTool(tool)}
      {!isRunning && <span className="opacity-40">✓</span>}
    </motion.span>
  );
}

/** @param {{ toolParts: { toolName: string; state: string; args?: any; result?: any }[] }} props */
function ToolBar({ toolParts = [] }) {
  const [open, setOpen] = useState(false);
  if (!toolParts.length) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
      >
        <Wrench size={11} />
        <span>
          {toolParts.length} tool{toolParts.length !== 1 ? "s" : ""}
        </span>
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-1.5 mt-2">
              {toolParts.map((p, i) => (
                <ToolPill key={i} tool={p.toolName} state={p.state} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SuggestionQuickReply({ suggestions, onFeedback }) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [thanks, setThanks] = useState(false);

  if (!suggestions?.length || thanks) {
    return thanks ? (
      <p className="text-xs text-muted-foreground ml-2 mt-1 font-body">
        Got it — ARIA will remember that.
      </p>
    ) : null;
  }

  const handleFeedback = async (s) => {
    if (loading || submitted) return;
    setLoading(true);
    try {
      await onFeedback({ suggestionId: s.id, accepted: true });
      setSubmitted(true);
      setTimeout(() => setThanks(true), 800);
    } catch {
      /* non-fatal */
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="ml-11 mt-2 flex flex-wrap gap-2"
    >
      {suggestions.map((s, i) => (
        <button
          key={i}
          onClick={() => handleFeedback(s)}
          disabled={loading || submitted}
          className="px-3 py-1.5 rounded-full text-xs font-semibold font-body border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
        >
          {s.content}
        </button>
      ))}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Message bubble — renders text + tool parts + ui_block cards
// ─────────────────────────────────────────────────────────────────────────────
function Bubble({
  message,
  isLast,
  dbUser,
  navigate,
  followUpSuggestions,
  onFeedback,
}) {
  const isUser = message.role === "user";
  const isStreaming = message.id?.startsWith("streaming_");

  /** @type {any[]} */
  const parts = message.parts ?? [];

  // v6: text lives in parts with type === 'text'
  const textContent = parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("");

  const displayText = textContent;

  // v6: tool parts have type === `tool-${toolCallId}` with toolName/input/output
  const toolParts = parts
    .filter((p) => p.type?.startsWith("tool-"))
    .map((p) => ({
      toolName: p.toolName ?? p.type.replace(/^tool-/, ""),
      state: p.state ?? "input-available",
      args: p.input,
      result: p.output,
    }));

  // v6: custom data chunks arrive as parts with type === `data-*`
  /** @type {any[]} */
  const dataParts = parts.filter((p) => p.type?.startsWith("data-"));

  const uiBlocks = dataParts
    .filter((p) => p.type === "data-ui_block")
    .map((p) => p.data)
    .reduce((/** @type {any[]} */ acc, b) => {
      const idx = acc.findIndex((x) => x.blockType === b.blockType);
      if (idx >= 0) acc[idx] = b;
      else acc.push(b);
      return acc;
    }, []);

  const suggestions =
    followUpSuggestions ||
    dataParts.find((p) => p.type === "data-suggestions")?.data ||
    [];

  if (!displayText && !uiBlocks.length && !isUser) return null;

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
          <span className="text-white text-xs font-bold">A</span>
        </div>
      )}

      <div className={`${isUser ? "max-w-[78%]" : "flex-1 max-w-[85%]"}`}>
        {/* Text bubble */}
        {displayText && (
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? "bg-primary text-white"
                : "bg-card border border-border text-foreground"
            }`}
          >
            {isUser ? (
              <p className="text-sm whitespace-pre-wrap font-body leading-relaxed">
                {displayText}
              </p>
            ) : (
              <>
                <ReactMarkdown
                  className="text-sm prose prose-sm max-w-none
                    [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
                    prose-headings:font-heading prose-headings:text-foreground
                    prose-p:text-foreground/85 prose-p:leading-relaxed prose-p:font-body
                    prose-strong:text-foreground prose-strong:font-semibold
                    prose-li:text-foreground/85 prose-li:font-body
                    prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs
                    prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground"
                >
                  {displayText}
                </ReactMarkdown>
                {isStreaming && (
                  <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse rounded-sm ml-0.5 align-middle" />
                )}
              </>
            )}
          </div>
        )}

        {/* Generative UI blocks */}
        {uiBlocks.length > 0 && (
          <div className="space-y-2 mt-1">
            {uiBlocks.map((block, i) => (
              // @ts-ignore - key is a React intrinsic prop
              <ARIABlockRenderer
                key={`${block.blockType}-${i}`}
                blockType={block.blockType}
                payload={block.payload}
                index={i}
              />
            ))}
          </div>
        )}

        {/* Tool bar */}
        {!isUser && toolParts.length > 0 && <ToolBar toolParts={toolParts} />}

        {/* Follow-up suggestions */}
        {!isUser && suggestions.length > 0 && (
          <SuggestionQuickReply
            suggestions={suggestions}
            onFeedback={onFeedback}
          />
        )}

        {/* Discover CTA */}
        {!isUser && dbUser?.aria_confirmed_niche && isLast && !isStreaming && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={() => navigate("/dashboard/discover")}
            className="mt-3 flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-semibold font-body hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Sparkles size={16} />
            Go to Discovery
          </motion.button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function AriaBrain() {
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [inputValue, setInputValue] = useState("");
  // Per-message follow-up suggestions keyed by message id
  const [suggestionMap, setSuggestionMap] = useState({});

  const { user, dbUser, syncWithBackend } = useFirebaseAuth();
  const { mutateAsync: submitFeedback } = useSuggestionFeedback();
  const chatEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const entryScreen = location.state?.entryScreen ?? "direct";
  const sessionCtx = location.state?.context ?? {};

  // ── useChat — core hook ──────────────────────────────────────────────────
  // Ref so the transport body function always reads the latest sessionId
  // without needing to recreate the transport on every session change.
  const sessionIdRef = useRef(sessionId);
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Stable transport — recreated only on mount. Dynamic values (sessionId,
  // auth token) are resolved via ref / async function at request time.
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: STREAM_URL,
        headers: async () => {
          const token = await auth.currentUser?.getIdToken(true);
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
        prepareSendMessagesRequest: ({ messages: msgs }) => {
          const lastUser = [...msgs].reverse().find((m) => m.role === "user");
          const text =
            typeof lastUser?.content === "string"
              ? lastUser.content
              : (lastUser?.parts ?? [])
                  .filter((p) => p.type === "text")
                  .map((p) => p.text)
                  .join("");
          return {
            body: {
              message: text,
              sessionId: sessionIdRef.current,
              entryScreen,
              context: sessionCtx,
            },
          };
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const { messages, setMessages, status, error, sendMessage, regenerate, stop } =
    useChat({
      transport,
      // Seed with the greeting; setMessages([GREETING]) handles resets.
      messages: [GREETING],

      onFinish: ({ message }) => {
        // v6: suggestions arrive as data-suggestions parts
        const rawMsg = /** @type {any} */ (message);
        const suggestionsPart = (rawMsg.parts ?? []).find(
          (/** @type {any} */ p) => p.type === "data-suggestions",
        );
        if (suggestionsPart?.data?.length) {
          setSuggestionMap((prev) => ({
            ...prev,
            [message.id]: suggestionsPart.data,
          }));
        }
        if (user) syncWithBackend(user).catch(() => {});
      },

      onError: (err) => {
        console.error("ARIA stream error:", err);
      },
    });

  const isStreaming = status === "submitted" || status === "streaming";

  // ── Scroll to bottom ─────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Greeting on new session ───────────────────────────────────────────────
  useEffect(() => {
    setMessages([GREETING]);
  }, [sessionId]); // eslint-disable-line

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text || isStreaming) return;
    setInputValue("");
    sendMessage({ text });
  }, [inputValue, isStreaming, sendMessage]);

  // ── Load a past session ───────────────────────────────────────────────────
  const loadSession = useCallback(
    async (sid) => {
      if (sid === sessionId) return;
      setLoadingHistory(true);
      try {
        const token = await auth.currentUser?.getIdToken(true);
        const res = await fetch(`${API_BASE}/agent/sessions/${sid}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const msgs = (data?.data?.messages ?? []).map((m) => ({
          id: m.id ?? crypto.randomUUID(),
          role: m.role,
          content:
            typeof m.content === "string"
              ? m.content
              : JSON.stringify(m.content),
          parts: [
            {
              type: "text",
              text: typeof m.content === "string" ? m.content : "",
            },
          ],
        }));
        setMessages(msgs.length ? msgs : [GREETING]);
        setSessionId(sid);
      } catch {
        setMessages([GREETING]);
      } finally {
        setLoadingHistory(false);
      }
    },
    [sessionId, setMessages],
  );

  const startNewChat = useCallback(() => {
    stop();
    setMessages([GREETING]);
    setInputValue("");
    setSuggestionMap({});
    setSessionId(crypto.randomUUID());
  }, [stop, setMessages]);

  // Derive currently-running tools from streaming messages
  const streamingMsg = messages.find(
    (m) =>
      m.id?.startsWith("streaming_") ||
      (status === "streaming" &&
        m.role === "assistant" &&
        !m.id?.startsWith("msg_")),
  );
  const activeToolParts = (streamingMsg?.parts ?? [])
    // @ts-ignore - state property exists at runtime
    .filter((p) => p.type?.startsWith("tool-") && (p.state === "input-available" || p.state === "running"))
    .map((p) => ({ toolName: /** @type {any} */ (p).toolName ?? p.type.replace(/^tool-/, "") }));

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full overflow-hidden">
      {/* Sessions Sidebar */}
      <SessionsSidebar
        activeSessionId={sessionId}
        onSelectSession={loadSession}
        onNewChat={startNewChat}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0 bg-background/80 backdrop-blur-sm">
          <div>
            <h1 className="font-heading text-xl text-foreground">ARIA Brain</h1>
            <p className="text-muted-foreground text-xs mt-0.5 font-body">
              Your AI content strategist
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isStreaming && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
              >
                <Brain size={12} className="text-primary animate-pulse" />
                <span className="text-[11px] font-medium text-primary font-body">
                  Thinking…
                </span>
              </motion.div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Zap size={12} className="text-primary" />
              <span className="text-[11px] font-medium text-primary font-body">
                Agentic · Live tools
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-primary/40" />
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id ?? i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Bubble
                    message={msg}
                    isLast={i === messages.length - 1}
                    navigate={navigate}
                    dbUser={dbUser}
                    followUpSuggestions={suggestionMap[msg.id]}
                    onFeedback={submitFeedback}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {/* Thinking indicator — before streaming starts */}
          {status === "submitted" && (
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

          {/* Active tool pills during streaming */}
          {isStreaming && activeToolParts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-xs text-muted-foreground ml-11"
            >
              <Zap size={11} className="text-primary animate-pulse" />
              <span className="font-body">Using tools:</span>
              <div className="flex flex-wrap gap-1.5">
                {activeToolParts.map((t, i) => (
                  <ToolPill key={i} tool={t.toolName} state="running" />
                ))}
              </div>
            </motion.div>
          )}

          {/* Error state */}
          {error && (
            <div className="ml-11 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive font-body">
              Something went wrong.{" "}
              <button onClick={() => regenerate()} className="underline">
                Retry
              </button>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-border flex-shrink-0 bg-background/80 backdrop-blur-sm">
          {/* Active tool ticker */}
          <AnimatePresence>
            {isStreaming && activeToolParts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 mb-2 text-[11px] text-muted-foreground/50 font-body"
              >
                <Wrench size={11} />
                {activeToolParts
                  .map((t) => prettifyTool(t.toolName))
                  .join(", ")}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && handleSend()
              }
              placeholder="Ask ARIA anything…"
              disabled={isStreaming || loadingHistory}
              className="flex-1 bg-card border border-border rounded-full px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-opacity font-body"
            />
            {isStreaming ? (
              <button
                onClick={() => stop()}
                className="w-11 h-11 rounded-full bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center hover:bg-destructive/20 transition-colors"
                title="Stop"
              >
                <span className="w-3 h-3 bg-destructive rounded-sm" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isStreaming}
                className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm shadow-primary/20"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 8h12M10 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>

          <p className="text-center text-[10px] text-muted-foreground/40 mt-2 font-body">
            ARIA can make mistakes. Verify important info.
          </p>
        </div>
      </div>
    </div>
  );
}
