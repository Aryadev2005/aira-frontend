import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const platforms = ['Instagram', 'YouTube'];
const types = ['Reel', 'Carousel', 'Short', 'Video'];

const mockResult = {
  hook: "Stop scrolling if you eat street food in India 🤯",
  script: "Open with a dramatic close-up of sizzling oil. Cut to: the vendor's hands moving at impossible speed. Narrate: 'This man has been making the same chaat for 30 years — and he still sells out by 2 PM.' Show the crowd. Show the food. End with you tasting it — genuine reaction only.",
  caption: "This 30-year-old chaat stall taught me everything about consistency 🔥\n\nFound this hidden gem in Old Delhi — the uncle starts at 6 AM and sells out by 2 PM every single day.\n\nSave this for your next Delhi trip 📍",
  hashtags: "#StreetFood #DelhiFood #IndianFood #FoodBlogger #Foodie #OldDelhi #StreetFoodIndia #FoodReels",
  bestTime: "Tuesday 7:30 PM IST — Your audience is most active",
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
      {copied ? <Check size={14} className="text-rising" /> : <Copy size={14} className="text-muted-foreground" />}
    </button>
  );
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25 } }
};

export default function Studio() {
  const [platform, setPlatform] = useState('Instagram');
  const [type, setType] = useState('Reel');
  const [idea, setIdea] = useState('');
  const [result, setResult] = useState(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setResult(mockResult);
      setGenerating(false);
    }, 1500);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="font-heading text-2xl text-foreground mb-1">Studio</h1>
        <p className="text-muted-foreground font-body text-sm">Generate scripts, hooks & captions</p>
      </motion.div>

      <motion.div variants={item} className="space-y-4">
        <div>
          <label className="font-body text-sm font-medium text-foreground mb-2 block">Platform</label>
          <div className="flex gap-2">
            {platforms.map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`px-4 py-2 rounded-pill text-sm font-body font-semibold transition-colors ${
                  platform === p ? 'bg-primary text-white' : 'bg-card border border-border text-muted-foreground'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-body text-sm font-medium text-foreground mb-2 block">Content Type</label>
          <div className="flex gap-2 flex-wrap">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-4 py-2 rounded-pill text-sm font-body font-semibold transition-colors ${
                  type === t ? 'bg-primary text-white' : 'bg-card border border-border text-muted-foreground'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-body text-sm font-medium text-foreground mb-2 block">Your Idea</label>
          <Textarea
            placeholder="e.g. Street food vendor in Old Delhi who's been making chaat for 30 years..."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            className="bg-card border-border rounded-xl font-body text-sm min-h-[100px] resize-none"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-primary hover:bg-primary/90 text-white rounded-pill px-8 font-body font-semibold shadow-warm"
        >
          {generating ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles size={16} /> Generate Script
            </span>
          )}
        </Button>
      </motion.div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {[
            { label: '🎣 Hook', content: result.hook },
            { label: '📝 Script', content: result.script },
            { label: '💬 Caption', content: result.caption },
            { label: '#️⃣ Hashtags', content: result.hashtags },
            { label: '⏰ Best Time', content: result.bestTime },
          ].map((card) => (
            <div key={card.label} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-body font-semibold text-sm text-foreground">{card.label}</span>
                <CopyButton text={card.content} />
              </div>
              <p className="text-foreground/80 font-body text-sm leading-relaxed whitespace-pre-line">{card.content}</p>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}