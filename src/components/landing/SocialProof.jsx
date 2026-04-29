import React from 'react';
import { motion } from 'framer-motion';

const niches = ['Fashion', 'Finance', 'Food', 'Travel', 'Comedy', 'Fitness', 'Tech', 'Beauty', 'Gaming', 'Lifestyle', 'Education', 'Health'];

export default function SocialProof() {
  return (
    <section className="py-8 bg-background overflow-hidden border-y border-border">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <p className="text-center text-muted-foreground text-sm font-body mb-4">
          Trusted by creators across every niche
        </p>
        <div className="relative overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...niches, ...niches].map((niche, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 mx-4 text-foreground/60 font-body font-medium text-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                {niche}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}