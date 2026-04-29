import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const steps = [
  {
    emoji: '🔍',
    label: 'DISCOVER',
    badge: 'HOT',
    badgeClass: 'bg-primary text-white',
    title: 'What to make',
    sub: 'Niche trends, viral angles, competitor moves — 48hrs early',
  },
  {
    emoji: '🎬',
    label: 'STUDIO',
    badge: 'START DISCOVER',
    badgeClass: 'bg-muted text-muted-foreground',
    title: 'How to make it',
    sub: 'Script builder, BGM matcher, editing help — without losing your voice',
  },
  {
    emoji: '🚀',
    label: 'LAUNCH',
    badge: 'FINISH STUDIO',
    badgeClass: 'bg-muted text-muted-foreground',
    title: 'Drop it right',
    sub: 'Timing intelligence, posting package, brand deal alerts',
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } }
};
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25 } }
};

export default function HowItWorks() {
  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <p className="text-primary font-body font-semibold text-sm tracking-widest uppercase mb-3">
            Your Workflow
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl text-foreground">
            Three steps to viral content
          </h2>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6 relative"
        >
          {steps.map((step, i) => (
            <React.Fragment key={step.label}>
              <motion.div
                variants={item}
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="bg-card border border-border rounded-xl p-6 cursor-pointer shadow-warm-sm hover:shadow-warm transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{step.emoji}</span>
                    <span className="font-body font-semibold text-xs tracking-wider text-muted-foreground">
                      {step.label}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-pill text-xs font-body font-semibold ${step.badgeClass}`}>
                    {step.badge}
                  </span>
                </div>
                <h3 className="font-heading text-xl text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground font-body text-sm leading-relaxed">{step.sub}</p>
              </motion.div>

              {i < 2 && (
                <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 items-center justify-center text-border" style={{ left: `${(i + 1) * 33.33 - 2}%` }}>
                  <ArrowRight size={20} className="text-primary/30" />
                </div>
              )}
            </React.Fragment>
          ))}
        </motion.div>
      </div>
    </section>
  );
}