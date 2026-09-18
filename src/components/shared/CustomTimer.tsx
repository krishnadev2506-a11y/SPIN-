import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';
import { useAudio } from '../../hooks/useAudio';
import { motion, AnimatePresence } from 'framer-motion';

export const CustomTimer: React.FC = () => {
  const { playTimerTick, playAlarm } = useAudio();
  const [duration, setDuration] = useState<number>(120); // 2 minutes default (120s)
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>('2'); // in minutes

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            playAlarm();
            return 0;
          }
          const nextVal = prev - 1;
          // Play a tick warning for the final 10 seconds
          if (nextVal <= 10) {
            playTimerTick();
          }
          return nextVal;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  const toggleStart = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration);
  };

  const applyCustomDuration = () => {
    const mins = parseFloat(customInput);
    if (!isNaN(mins) && mins > 0) {
      const secs = Math.round(mins * 60);
      setDuration(secs);
      setTimeLeft(secs);
      setShowConfig(false);
    }
  };

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Circular progress math
  const strokeWidth = 8;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const progress = duration > 0 ? timeLeft / duration : 0;
  const strokeDashoffset = circumference - progress * circumference;

  // Visual status color
  const timerColor = timeLeft <= 10 
    ? 'text-red-500' 
    : timeLeft <= 30 
      ? 'text-amber-400' 
      : 'text-brand-cyan-400';

  return (
    <div className="glass-panel p-6 border border-white/5 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-brand-cyan-400" />
          <h3 className="font-bold tracking-tight text-sm uppercase">Pitch Timer</h3>
        </div>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="text-xs text-white/50 hover:text-white transition-colors"
        >
          {showConfig ? 'Close' : 'Set Time'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {showConfig ? (
          <motion.div
            key="config"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col space-y-3 justify-center h-[140px]"
          >
            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                className="bg-dark-800 border border-white/10 rounded-xl px-3 py-2 text-white font-bold w-24 text-center focus:outline-none focus:border-brand-purple-500 transition-all"
              />
              <span className="text-sm text-white/50">minutes</span>
            </div>
            <button
              onClick={applyCustomDuration}
              className="w-full bg-gradient-to-r from-brand-purple-600 to-brand-purple-500 hover:from-brand-purple-500 hover:to-brand-purple-400 py-2 rounded-xl text-sm font-bold shadow-lg hover:shadow-glow-purple transition-all"
            >
              Apply Timer
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="timer"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center justify-around h-[140px]"
          >
            {/* Circle timer representation */}
            <div className="relative flex items-center justify-center w-[130px] h-[130px]">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                {/* Background Track */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  className="stroke-dark-800 fill-none"
                  strokeWidth={strokeWidth}
                />
                {/* Active Progress */}
                <motion.circle
                  cx="70"
                  cy="70"
                  r={radius}
                  className={`fill-none transition-colors duration-500 ${
                    timeLeft <= 10 
                      ? 'stroke-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' 
                      : 'stroke-brand-cyan-500'
                  }`}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              {/* Floating remaining text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-black font-mono tracking-wider ${timerColor}`}>
                  {formatTime(timeLeft)}
                </span>
                <span className="text-[10px] text-white/40 uppercase tracking-widest">
                  {isRunning ? 'active' : 'paused'}
                </span>
              </div>
            </div>

            {/* Timer Controllers */}
            <div className="flex flex-col space-y-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleStart}
                className={`flex items-center justify-center p-3 rounded-xl border text-white font-bold transition-all shadow-md ${
                  isRunning
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
                    : 'bg-brand-cyan-500/10 border-brand-cyan-500/20 text-brand-cyan-400 hover:bg-brand-cyan-500/20 hover:shadow-glow-cyan'
                }`}
              >
                {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetTimer}
                className="flex items-center justify-center p-3 rounded-xl border border-white/5 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all shadow-md"
                title="Reset Timer"
              >
                <RotateCcw className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
