import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useAudio } from '../../hooks/useAudio';
import { motion } from 'framer-motion';

export const MuteToggle: React.FC = () => {
  const { muted, toggleMute } = useAudio();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleMute}
      className={`relative p-3 rounded-xl border flex items-center justify-center transition-all duration-300 ${
        muted
          ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
          : 'bg-brand-purple-500/10 border-brand-purple-500/20 text-brand-purple-400 hover:bg-brand-purple-500/20 hover:shadow-glow-purple'
      }`}
      title={muted ? 'Unmute Sounds' : 'Mute Sounds'}
    >
      <motion.div
        key={muted ? 'muted' : 'unmuted'}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </motion.div>
      {!muted && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-purple-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-purple-500"></span>
        </span>
      )}
    </motion.button>
  );
};
