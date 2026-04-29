import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const freeFeatures = [
  '5 trend lookups/month',
  '3 ARIA messages/day',
  'Basic archetype',
];

const proFeatures = [
  'Unlimited trends',
  'Unlimited ARIA Brain',
  'Script generator',
  'Content calendar',
  'Rate card builder',
  '48hr early access',
  'Video DNA analyzer',
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section className="py-20 lg:py-28 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="font-heading text-3xl sm:text-4xl text-foreground mb-3">
            Simple, honest pricing
          </h2>
          <p className="text-muted-foreground font-body text-lg">
            Built for Indian creators. Priced for Indian wallets.
          </p>

          <div className="flex items-center justify-center gap-3 mt-6">
            <span className={`font-body text-sm ${!annual ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-12 h-6 rounded-pill transition-colors ${annual ? 'bg-primary' : 'bg-border'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${annual ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
            <span className={`font-body text-sm ${annual ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>Annual</span>
            {annual && (
              <span className="px-2 py-0.5 rounded-pill bg-rising/10 text-rising text-xs font-body font-semibold">
                Save 17%
              </span>
            )}
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-background border border-border rounded-xl p-8"
          >
            <h3 className="font-heading text-2xl text-foreground mb-1">Free Forever</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="font-heading text-4xl text-foreground">₹0</span>
              <span className="text-muted-foreground font-body text-sm">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm font-body text-foreground/80">
                  <Check size={16} className="text-primary flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/dashboard">
              <Button variant="outline" className="w-full rounded-pill font-body font-semibold">
                Get started
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-accent text-accent-foreground border border-primary/30 rounded-xl p-8 relative shadow-warm-lg"
          >
            <span className="absolute -top-3 right-6 px-3 py-1 rounded-pill bg-primary text-white text-xs font-body font-semibold">
              MOST POPULAR
            </span>
            <h3 className="font-heading text-2xl text-accent-foreground mb-1">Pro</h3>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="font-heading text-4xl text-accent-foreground">
                {annual ? '₹5,000' : '₹499'}
              </span>
              <span className="text-accent-foreground/50 font-body text-sm">
                /{annual ? 'year' : 'month'}
              </span>
            </div>
            {annual && (
              <p className="text-rising text-sm font-body font-medium mb-6">= ₹417/month</p>
            )}
            {!annual && <div className="mb-6" />}
            <ul className="space-y-3 mb-8">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm font-body text-accent-foreground/80">
                  <Check size={16} className="text-primary flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/dashboard">
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-pill font-body font-semibold shadow-warm">
                Start Pro
              </Button>
            </Link>
          </motion.div>
        </div>

        <p className="text-center text-muted-foreground text-sm font-body mt-8">
          Cancel anytime. Billed in India. UPI & cards accepted.
        </p>
      </div>
    </section>
  );
}