import React from 'react';
import { motion } from 'framer-motion';
import { Brain, BarChart3, Music, CalendarDays, Compass, Rocket } from 'lucide-react';

const features = [
  { icon: Brain, title: 'ARIA Brain', desc: 'AI chat that knows your archetype and niche — ask anything about content strategy' },
  { icon: BarChart3, title: 'Video DNA', desc: 'Analyse any YouTube video instantly — hook strength, SEO, engagement prediction' },
  { icon: Music, title: 'Live Songs', desc: 'Real-time Spotify + JioSaavn trending audio with lifecycle signals' },
  { icon: CalendarDays, title: 'Content Calendar', desc: 'AI-generated month-by-month plan tailored to your niche and audience' },
  { icon: Compass, title: 'Discover', desc: '48h early trend radar with opportunity scores and competitor intelligence' },
  { icon: Rocket, title: 'Rate Card', desc: 'Auto-generate your brand deal pricing based on real market data' },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25 } }
};

export default function FeaturesGrid() {
  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <h2 className="font-heading text-3xl sm:text-4xl text-foreground mb-3">
            Everything a serious creator needs
          </h2>
          <p className="text-muted-foreground font-body text-lg max-w-2xl mx-auto">
            From trend discovery to posting — all in one platform built for India
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feat) => (
            <motion.div
              key={feat.title}
              variants={item}
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-warm transition-shadow cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <feat.icon size={22} className="text-primary" />
              </div>
              <h3 className="font-heading text-lg text-foreground mb-2">{feat.title}</h3>
              <p className="text-muted-foreground font-body text-sm leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}