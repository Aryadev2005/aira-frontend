import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const steps = [
  {
    emoji: '🔍',
    label: 'DISCOVER',
    badge: 'HOT',
    badgeClass: 'bg-primary text-white',
    title: 'What to make',
    sub: 'Niche trends, viral angles, competitor moves — 48hrs early',
    path: '/dashboard/discover',
  },
  {
    emoji: '🎬',
    label: 'STUDIO',
    badge: 'START DISCOVER',
    badgeClass: 'bg-muted text-muted-foreground',
    title: 'How to make it',
    sub: 'Script builder, BGM matcher, editing help — without losing your voice',
    path: '/dashboard/studio',
  },
  {
    emoji: '🚀',
    label: 'LAUNCH',
    badge: 'FINISH STUDIO',
    badgeClass: 'bg-muted text-muted-foreground',
    title: 'Drop it right',
    sub: 'Timing intelligence, posting package, brand deal alerts',
    path: '/dashboard/launch',
  },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25 } }
};

export default function WorkflowCards() {
  return (
    <div>
      <h3 className="font-body font-semibold text-sm text-muted-foreground tracking-wider uppercase mb-4">
        Your Workflow Today
      </h3>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid sm:grid-cols-3 gap-4"
      >
        {steps.map((step) => (
          <motion.div key={step.label} variants={item}>
            <Link to={step.path}>
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:shadow-warm transition-shadow group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{step.emoji}</span>
                    <span className="font-body font-semibold text-xs tracking-wider text-muted-foreground">
                      {step.label}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-pill text-[10px] font-body font-semibold ${step.badgeClass}`}>
                    {step.badge}
                  </span>
                </div>
                <h4 className="font-heading text-lg text-foreground mb-1">{step.title}</h4>
                <p className="text-muted-foreground font-body text-xs leading-relaxed mb-3">{step.sub}</p>
                <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}