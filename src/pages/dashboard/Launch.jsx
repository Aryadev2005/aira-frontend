import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, Handshake, Calendar } from 'lucide-react';
import { useLaunchTiming, useLaunchPackage, useBrandAlert, useProfile } from '@/hooks/useApi';

const features = [
  {
    icon: Clock,
    title: 'Posting Intelligence',
    desc: 'AI-calculated best times based on your audience activity patterns',
    status: 'Coming soon',
  },
  {
    icon: Zap,
    title: 'Auto Posting Package',
    desc: 'Caption, hashtags, thumbnail, and cover — ready to publish',
    status: 'Coming soon',
  },
  {
    icon: Handshake,
    title: 'Brand Deal Alerts',
    desc: 'Get matched with brands looking for creators in your niche',
    status: 'Coming soon',
  },
  {
    icon: Calendar,
    title: 'Content Calendar',
    desc: 'AI-generated month-by-month plan tailored to your audience',
    status: 'Coming soon',
  },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25 } }
};

export default function Launch() {
  const { data: profileData } = useProfile();
  const { data: timingData, isLoading: timingLoading } = useLaunchTiming();
  const { data: brandAlertData } = useBrandAlert();
  const { mutateAsync: generatePackage, isPending: packageLoading } = useLaunchPackage();

  const [sessionIdea, setSessionIdea] = useState('');
  const [postingPackage, setPostingPackage] = useState(null);

  const timing = timingData?.data;

  const handleGeneratePackage = async () => {
    const data = await generatePackage({
      idea: sessionIdea || 'general content',
      platform: profileData?.data?.user?.primary_platform || 'instagram',
      niche: profileData?.data?.user?.niches?.[0] || 'lifestyle',
    });
    setPostingPackage(data.data);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="font-heading text-2xl text-foreground mb-1">Launch</h1>
        <p className="text-muted-foreground font-body text-sm">Timing intelligence & brand deals</p>
      </motion.div>

      <motion.div variants={item} className="bg-accent text-accent-foreground rounded-xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🚀</span>
          <span className="font-body font-semibold text-sm text-accent-foreground">Launch Features</span>
        </div>
        <p className="text-accent-foreground/60 font-body text-sm">
          We're building powerful tools to help you publish at the perfect time and land brand deals. Coming very soon!
        </p>
      </motion.div>

      <motion.div variants={container} className="grid sm:grid-cols-2 gap-4">
        {features.map((f) => (
          <motion.div
            key={f.title}
            variants={item}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <f.icon size={20} className="text-primary" />
              </div>
              <span className="px-2.5 py-0.5 rounded-pill bg-muted text-muted-foreground text-[10px] font-body font-semibold">
                {f.status}
              </span>
            </div>
            <h3 className="font-heading text-lg text-foreground mb-1">{f.title}</h3>
            <p className="text-muted-foreground font-body text-xs leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}