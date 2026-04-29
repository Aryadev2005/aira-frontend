import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useGenerateContent } from '@/hooks/useApi';
import { useFirebaseAuth } from '@/lib/FirebaseAuthContext';

const platforms = ['Instagram', 'YouTube'];
const types = ['Reel', 'Carousel', 'Short', 'Video'];

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

  const { dbUser } = useFirebaseAuth();
  const { mutateAsync: generateContent, isPending: generating } = useGenerateContent();

  const handleGenerate = async () => {
    if (!idea.trim()) return;
    try {
      const res = await generateContent({
        trendTitle: idea,
        niche: dbUser?.niches?.[0] || 'Lifestyle',
        platform: platform,
        followerRange: dbUser?.follower_range || '1K-10K',
        contentFormat: type,
      });
      
      const data = res.data;
      setResult({
        hook: data.hooks?.[0] || data.title || '',
        script: Array.isArray(data.script) ? data.script.join('\n') : data.script || '',
        caption: data.caption || '',
        hashtags: typeof data.hashtags === 'object' ? Object.values(data.hashtags).join(' ') : data.hashtags || '',
        bestTime: data.ai_tip || 'Check analytics for best time',
      });
    } catch (e) {
      console.error('Generation failed', e);
    }
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