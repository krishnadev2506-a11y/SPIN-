import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  accent: 'purple' | 'cyan';
  suffix?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, accent, suffix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const end = value;
    if (end === 0) {
      setDisplayValue(0);
      return;
    }
    const duration = 1000; // 1 second animation
    const startTime = performance.now();

    const animateCount = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out quad
      const easeProgress = progress * (2 - progress);
      const current = Math.floor(easeProgress * end);
      
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      } else {
        setDisplayValue(end);
      }
    };

    requestAnimationFrame(animateCount);
  }, [value]);

  const glowClass = accent === 'purple'
    ? 'hover:shadow-glow-purple group-hover:border-brand-purple-500/50'
    : 'hover:shadow-glow-cyan group-hover:border-brand-cyan-500/50';

  const iconAccent = accent === 'purple'
    ? 'bg-brand-purple-500/10 text-brand-purple-400 border border-brand-purple-500/20'
    : 'bg-brand-cyan-500/10 text-brand-cyan-400 border border-brand-cyan-500/20';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={`glass-panel p-6 flex items-center justify-between group cursor-pointer border border-white/5 ${glowClass}`}
    >
      <div className="space-y-2">
        <span className="text-sm font-medium text-white/50 tracking-wider uppercase">{title}</span>
        <div className="flex items-baseline space-x-1">
          <span className="text-4xl font-extrabold tracking-tight font-sans">
            {displayValue}
          </span>
          {suffix && <span className="text-xl font-medium text-white/60">{suffix}</span>}
        </div>
      </div>
      <div className={`p-4 rounded-xl transition-all duration-300 ${iconAccent}`}>
        {icon}
      </div>
    </motion.div>
  );
};
