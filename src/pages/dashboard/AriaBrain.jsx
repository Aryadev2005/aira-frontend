import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useFirebaseAuth } from '@/lib/FirebaseAuthContext';
import { auth } from '@/lib/firebase';
import { api } from '@/lib/api';

const greetingMessage = {
  role: 'assistant',
  content: "Hey! I'm ARIA — your AI content strategist 🧠\n\nI know your niche, your audience, and what's trending right now. Ask me anything:\n\n- \"What should I post this week?\"\n- \"Write me a reel script about street food\"\n- \"What audio should I use for a travel reel?\"\n\nLet's make something amazing today!",
  tools: [],
};

// ── SSE Streaming helper ───────────────────────────────────────────────────────
const streamAriaResponse = async (message, sessionId, dbUser, onToken, onDone, onError) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    const token = await user.getIdToken(true);

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/v1/brain/chat/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          sessionId,
          entryScreen: 'direct',
          context: {
            niche: dbUser?.niches?.[0],
            platform: dbUser?.primary_platform,
            archetype: dbUser?.archetype,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          onDone(fullText);
          return fullText;
        }
        try {
          const parsed = JSON.parse(data);
          // Backend event shapes: { type: 'token', token } or { type: 'done' } or { type: 'error' }
          if (parsed.type === 'done') {
            onDone(fullText);
            return fullText;
          }
          if (parsed.type === 'error') {
            throw new Error(parsed.message || 'Stream error');
          }
          const text = parsed.token || parsed.text || '';
          fullText += text;
          onToken(fullText);
        } catch (parseErr) {
          // Ignore malformed chunks
        }
      }
    }

    onDone(fullText);
    return fullText;
  } catch (err) {
    onError(err);
    return null;
  }
};

// ── Fallback non-streaming chat ───────────────────────────────────────────────
const chatFallback = async (message, sessionId, messages, dbUser) => {
  const data = await api.post('/brain/chat', {
    message,
    sessionId,
    entryScreen: 'direct',
    conversationHistory: messages.slice(-10).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
    context: {
      niche: dbUser?.niches?.[0],
      platform: dbUser?.primary_platform,
      archetype: dbUser?.archetype,
    },
  });
  return data.data?.message || data.data?.reply || data.data?.content || "Sorry, I couldn't process that.";
};

export default function AriaBrain() {
  const [messages, setMessages] = useState([greetingMessage]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const { dbUser } = useFirebaseAuth();
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, streamingText]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const userMessage = input.trim();
    const newMessages = [...messages, { role: 'user', content: userMessage, tools: [] }];
    setMessages(newMessages);
    setInput('');
    setStreamingText('');

    const useStream = !!import.meta.env.VITE_API_BASE_URL;

    if (useStream) {
      setIsStreaming(true);
      // Add a placeholder assistant message we'll fill in as tokens arrive
      setMessages((prev) => [...prev, { role: 'assistant', content: '', tools: [], _streaming: true }]);

      await streamAriaResponse(
        userMessage,
        sessionId,
        dbUser,
        // onToken: update the streaming placeholder
        (fullText) => {
          setStreamingText(fullText);
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?._streaming) {
              updated[updated.length - 1] = { ...last, content: fullText };
            }
            return updated;
          });
        },
        // onDone
        (fullText) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?._streaming) {
              updated[updated.length - 1] = { role: 'assistant', content: fullText || "Done!", tools: [] };
            }
            return updated;
          });
          setStreamingText('');
          setIsStreaming(false);
        },
        // onError: fall back to non-streaming
        async () => {
          setIsStreaming(false);
          setIsTyping(true);
          try {
            const reply = await chatFallback(userMessage, sessionId, newMessages, dbUser);
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?._streaming) {
                updated[updated.length - 1] = { role: 'assistant', content: reply, tools: [] };
              } else {
                updated.push({ role: 'assistant', content: reply, tools: [] });
              }
              return updated;
            });
          } catch {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?._streaming) {
                updated[updated.length - 1] = { role: 'assistant', content: 'Something went wrong. Please try again.', tools: [] };
              }
              return updated;
            });
          } finally {
            setIsTyping(false);
          }
        }
      );
    } else {
      // No base URL configured — use non-streaming fallback
      setIsTyping(true);
      try {
        const reply = await chatFallback(userMessage, sessionId, newMessages, dbUser);
        setMessages((prev) => [...prev, { role: 'assistant', content: reply, tools: [] }]);
      } catch {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.', tools: [] }]);
      } finally {
        setIsTyping(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] lg:h-[calc(100vh-48px)]">
      <div className="mb-4">
        <h1 className="font-heading text-2xl text-foreground mb-1">ARIA Brain</h1>
        <p className="text-muted-foreground font-body text-sm">Your AI content strategist</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-xs font-bold">A</span>
                </div>
              )}
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                <div className={`rounded-2xl px-4 py-3 ${msg.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-card border border-border text-foreground'
                  }`}>
                  {msg.role === 'user' ? (
                    <p className="font-body text-sm">{msg.content}</p>
                  ) : (
                    <>
                      <ReactMarkdown className="font-body text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 prose-headings:text-foreground prose-strong:text-foreground prose-p:text-foreground/80">
                        {msg.content}
                      </ReactMarkdown>
                      {msg._streaming && !msg.content && (
                        <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse rounded-sm ml-0.5" />
                      )}
                    </>
                  )}
                </div>
                {msg.tools && msg.tools.length > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {msg.tools.map((tool) => (
                      <span key={tool} className="px-2 py-0.5 rounded-pill bg-primary/10 text-primary text-[10px] font-body font-medium">
                        {tool}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {(isTyping && !isStreaming) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <div className="bg-card border border-border rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="border-t border-border pt-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask ARIA anything..."
            disabled={isStreaming}
            className="flex-1 bg-card border border-border rounded-pill px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}