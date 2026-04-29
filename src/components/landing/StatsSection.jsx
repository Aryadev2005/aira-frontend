import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

function AnimatedCounter({ value, prefix = '', suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const numericValue = parseInt(value);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const increment = numericValue / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= numericValue) {
        setCount(numericValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, numericValue, duration]);

  return (
    <span ref={ref} className="font-heading text-3xl sm:text-4xl text-primary">
      {prefix}{count}{suffix}
    </span>
  );
}

const stats = [
  { value: '48', suffix: 'h', label: 'Trend lead time' },
  { value: '499', prefix: '₹', label: 'Pro/month' },
  { value: '12', label: 'Creator tools' },
];

export default function StatsSection() {
  return (
    <section className="py-20 bg-accent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-3 gap-6"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-accent/80 border border-white/10 rounded-xl p-6 text-center"
            >
              <AnimatedCounter value={stat.value} prefix={stat.prefix || ''} suffix={stat.suffix || ''} />
              <p className="text-accent-foreground/50 font-body text-sm mt-2">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}