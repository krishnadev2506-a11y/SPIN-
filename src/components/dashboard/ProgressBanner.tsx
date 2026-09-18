import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBannerProps {
  registeredCount: number;
  completedCount: number;
  challengesRemaining: number;
}

export const ProgressBanner: React.FC<ProgressBannerProps> = ({
  registeredCount,
  completedCount,
  challengesRemaining,
}) => {
  const percentage = registeredCount > 0 ? Math.round((completedCount / registeredCount) * 100) : 0;

  return (
    <div className="glass-panel p-6 space-y-4 border border-white/5 shadow-2xl relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand-purple-600/10 to-brand-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Buildathon Assignment Progress</h2>
          <p className="text-sm text-white/50">Track live team assignments as the event progresses.</p>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-center md:text-right">
            <span className="text-xs text-white/40 block uppercase tracking-wider">Overall Completion</span>
            <span className="text-2xl font-black text-brand-purple-400">{percentage}%</span>
          </div>
          <div className="h-10 w-[1px] bg-white/10 hidden md:block" />
          <div className="flex gap-4">
            <div>
              <span className="text-xs text-white/40 block uppercase tracking-wider">Assigned</span>
              <span className="text-lg font-bold">{completedCount} <span className="text-xs text-white/40">/ {registeredCount}</span></span>
            </div>
            <div>
              <span className="text-xs text-white/40 block uppercase tracking-wider">Available Slices</span>
              <span className="text-lg font-bold text-brand-cyan-400">{challengesRemaining}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="h-4 w-full bg-dark-800 rounded-full overflow-hidden p-[2px] border border-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
            className="h-full bg-gradient-to-r from-brand-purple-600 via-brand-purple-500 to-brand-cyan-400 rounded-full relative"
          >
            {/* Glow sweep effect */}
            <div className="absolute inset-0 w-full h-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-[loading-shimmer_2s_infinite] pointer-events-none" />
          </motion.div>
        </div>
        <div className="flex justify-between text-xs text-white/40 px-1">
          <span>0% Start</span>
          <span>50% Midpoint</span>
          <span>100% Completed</span>
        </div>
      </div>
    </div>
  );
};
