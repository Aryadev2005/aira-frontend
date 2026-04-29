import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } }
};
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 200 } }
};

export default function Hero() {
  return (
    <section className="relative bg-accent text-accent-foreground overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent via-accent to-primary/10 opacity-80" />
      <div className="absolute top-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 lg:pt-40 lg:pb-28">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid lg:grid-cols-2 gap-12 items-center"
        >
          <div>
            <motion.div variants={item}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-pill border border-primary/30 bg-primary/10 text-primary text-sm font-body font-medium mb-8">
                India's First AI Content Manager 🇮🇳
              </span>
            </motion.div>

            <motion.h1 variants={item} className="font-heading text-4xl sm:text-5xl lg:text-7xl text-accent-foreground leading-tight mb-6">
              Know what to post.
              <br />
              <span className="italic">Before anyone else.</span>
            </motion.h1>

            <motion.p variants={item} className="text-accent-foreground/60 font-body text-lg max-w-lg mb-8 leading-relaxed">
              AIRA gives you real trends, AI scripts, and the perfect posting time — 48 hours before your competitors.
            </motion.p>

            <motion.div variants={item} className="flex flex-wrap gap-4 mb-10">
              <Link to="/register">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-pill px-8 py-6 text-base font-body font-semibold shadow-warm-lg">
                  Start for free — it's ₹0
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="rounded-pill px-8 py-6 text-base font-body font-medium border-accent-foreground/20 text-accent-foreground hover:bg-accent-foreground/5">
                <Play size={18} className="mr-2" /> Watch demo
              </Button>
            </motion.div>

            <motion.div variants={item} className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {['bg-primary', 'bg-rising', 'bg-new-badge', 'bg-primary/80', 'bg-rising/80'].map((c, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-accent flex items-center justify-center`}>
                    <span className="text-white text-xs font-bold">{['P', 'R', 'A', 'S', 'M'][i]}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="fill-primary text-primary" />
                ))}
              </div>
              <span className="text-accent-foreground/50 text-sm font-body">Join 50,000+ Indian creators</span>
            </motion.div>
          </div>

          <motion.div
            variants={item}
            className="hidden lg:block relative"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring', damping: 20 }}
              className="relative bg-accent/80 border border-white/10 rounded-xl p-6 shadow-warm-lg backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-primary text-white text-xs font-body font-semibold">
                  AIRA DAILY BRIEF
                </span>
                <Sparkles size={18} className="text-primary" />
              </div>
              <p className="text-accent-foreground/80 font-body text-sm leading-relaxed mb-4">
                "Aesthetic Diwali Prep Vlogs are blowing up — creators documenting festive prep with ASMR-style editing see 3x engagement. Start a 'Diwali Prep with Me' series today."
              </p>
              <div className="flex items-center gap-2 text-primary text-sm font-body font-medium">
                → Start with Discover
              </div>
            </motion.div>

            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}