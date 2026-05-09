import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AlmanacHero, AlmanacJourney, AlmanacConstellation, AlmanacSongs, AlmanacStats } from '@/components/almanac';
import { useProfile, useAnalyticsDashboard } from '@/hooks/useApi';
import { useFirebaseAuth } from '@/lib/FirebaseAuthContext';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25 } }
};

export default function DashboardHome() {
  const [stage, setStage] = useState('discover');
  const navigate = useNavigate();
  const { data: profileData } = useProfile();
  const { dbUser } = useFirebaseAuth();
  const { data: analyticsData } = useAnalyticsDashboard();

  const displayName = dbUser?.name || profileData?.data?.user?.name || 'Creator';
  const analytics = analyticsData?.data;

  // Journey navigation handler
  const handleStageClick = (id) => {
    setStage(id);
    if (id === 'discover') navigate('/dashboard/discover');
    if (id === 'studio') navigate('/dashboard/studio');
    if (id === 'launch') navigate('/dashboard/launch');
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Almanac Hero with forecast */}
      <motion.div variants={item}>
        <AlmanacHero name={displayName} />
      </motion.div>

      {/* Workflow Journey */}
      <motion.div variants={item}>
        <AlmanacJourney active={stage} setActive={handleStageClick} />
      </motion.div>

      {/* Trend Constellation */}
      <motion.div variants={item}>
        <AlmanacConstellation />
      </motion.div>

      {/* Almanac Stats */}
      <motion.div variants={item}>
        <AlmanacStats analytics={analytics} />
      </motion.div>

      {/* Songs Section */}
      <motion.div variants={item}>
        <AlmanacSongs />
      </motion.div>

      {/* Footer Signature */}
      <motion.div variants={item} className="almanac-signature">
        <span>End of issue · No. 0099</span>
        <span className="ornament">— ✦ —</span>
        <span>Printed for {displayName} · Mumbai · MMXXVI</span>
      </motion.div>
    </motion.div>
  );
}