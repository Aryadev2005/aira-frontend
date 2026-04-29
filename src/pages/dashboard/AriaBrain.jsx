import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const greetingMessage = {
  role: 'assistant',
  content: "Hey! I'm ARIA — your AI content strategist 🧠\n\nI know your niche, your audience, and what's trending right now. Ask me anything:\n\n- \"What should I post this week?\"\n- \"Write me a reel script about street food\"\n- \"What audio should I use for a travel reel?\"\n\nLet's make something amazing today!",
  tools: [],
};

const mockResponses = [
  {
    content: "Great question! Based on current trends in your niche, here's what I'd recommend for this week:\n\n**Monday** — Behind-the-scenes content (your audience loves authenticity)\n**Wednesday** — Educational reel: Pick one trending topic and simplify it\n**Friday** — Trend hop: 'Aesthetic routine' format is blowing up right now\n\n💡 **Pro tip:** Post your educational reel at 7:30 PM IST — that's when your audience is most active.",
    tools: ['checked live trends', 'analysed your niche'],
  },
  {
    content: "Here's a script for your street food reel:\n\n🎣 **Hook:** \"This ₹20 plate destroyed every restaurant I've been to\"\n\n📝 **Script:**\n> Open on the vendor's hands. Close-up of the sizzle. Pull back to reveal the crowd.\n> \n> \"30 years. Same spot. Same recipe. And he still sells out by lunch.\"\n> \n> Cut to you tasting. Genuine reaction.\n> \n> \"₹20. That's it. That's the price of perfection.\"\n\n🎵 **Audio:** Use 'Agar Tum Saath Ho (Lo-fi)' — it's trending for aesthetic food content right now.",
    tools: ['generated script', 'matched BGM', 'checked trends'],
  },
];

export default function AriaBrain() {
  const [messages, setMessages] = useState([greetingMessage]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const responseIndex = useRef(0);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const resp = mockResponses[responseIndex.current % mockResponses.length];
      responseIndex.current++;
      setMessages((prev) => [...prev, { role: 'assistant', ...resp }]);
      setIsTyping(false);
    }, 1500);
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
                <div className={`rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-card border border-border text-foreground'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="font-body text-sm">{msg.content}</p>
                  ) : (
                    <ReactMarkdown className="font-body text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 prose-headings:text-foreground prose-strong:text-foreground prose-p:text-foreground/80">
                      {msg.content}
                    </ReactMarkdown>
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

        {isTyping && (
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
            className="flex-1 bg-card border border-border rounded-pill px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}