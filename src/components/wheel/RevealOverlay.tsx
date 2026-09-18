import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Challenge } from '../../context/EventContext';
import { useAudio } from '../../hooks/useAudio';
import ReactConfetti from 'react-confetti';
import { Check, Trophy, Sparkles } from 'lucide-react';

interface RevealOverlayProps {
  challenge: Challenge;
  teamName: string;
  onSave: () => void;
}

export const RevealOverlay: React.FC<RevealOverlayProps> = ({
  challenge,
  teamName,
  onSave
}) => {
  const { playReveal, playCelebration, playConfettiPop } = useAudio();
  const [step, setStep] = useState<'suspense' | 'reveal'>('suspense');
  const [showConfetti, setShowConfetti] = useState(false);
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const suspenseTimer = setTimeout(() => {
      playReveal();
      setStep('reveal');

      setTimeout(() => {
        playCelebration();
        playConfettiPop();
        setShowConfetti(true);
      }, 300);

      setTimeout(() => {
        setShowConfetti(false);
      }, 5300);

    }, 2000);

    return () => clearTimeout(suspenseTimer);
  }, [challenge, playReveal, playCelebration, playConfettiPop]);

  return (
    <div className="fixed inset-0 bg-dark-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
      {showConfetti && (
        <>
          <ReactConfetti
            width={width}
            height={height}
            numberOfPieces={150}
            recycle={false}
            confettiSource={{
              x: 0,
              y: height / 2,
              w: 10,
              h: 10
            }}
            initialVelocityX={{ min: 10, max: 25 }}
            initialVelocityY={{ min: -15, max: -5 }}
            gravity={0.15}
          />
          <ReactConfetti
            width={width}
            height={height}
            numberOfPieces={150}
            recycle={false}
            confettiSource={{
              x: width - 10,
              y: height / 2,
              w: 10,
              h: 10
            }}
            initialVelocityX={{ min: -25, max: -10 }}
            initialVelocityY={{ min: -15, max: -5 }}
            gravity={0.15}
          />
        </>
      )}

      <div className="w-full max-w-3xl relative">
        <AnimatePresence mode="wait">
          {step === 'suspense' ? (
            <motion.div
              key="suspense"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
              transition={{ duration: 0.3 }}
              className="text-center space-y-4"
            >
              <span className="text-white/40 font-bold uppercase tracking-widest text-xs">Assigning challenge to {teamName}</span>
              <div className="text-5xl md:text-7xl font-black text-white glow-text-purple tracking-widest flex justify-center items-center">
                {Array.from('???????').map((char, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: index * 0.1
                    }}
                    className="mx-0.5"
                  >
                    {char}
                  </motion.span>
                ))}
              </div>
              <p className="text-sm text-brand-purple-400 font-semibold animate-pulse">Calculating Slices...</p>
            </motion.div>
          ) : (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 70, damping: 12 }}
              className="glass-modal p-6 md:p-8 border border-brand-purple-500/30 shadow-glow-purple flex flex-col text-left space-y-4 relative overflow-hidden max-h-[90vh]"
            >
              <motion.div
                initial={{ left: '-100%' }}
                animate={{ left: '150%' }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
                className="absolute top-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none"
              />

              <div className="flex items-start justify-between gap-3 relative z-10">
                <div>
                  <span className="text-[10px] text-brand-cyan-400 font-black uppercase tracking-[0.2em]">Challenge Unlocked</span>
                  <p className="text-xs text-white/40 mt-1">Assigned to <span className="text-white font-bold">{teamName}</span></p>
                </div>
                <div className="flex items-center text-[10px] text-brand-purple-400 font-bold uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  <Trophy className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="relative z-10 overflow-y-auto pr-1 space-y-4 max-h-[62vh]">
                <div className="space-y-2">
                  <h2 className="text-3xl font-extrabold tracking-tight text-white glow-text-cyan leading-tight uppercase">
                    {challenge.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand-purple-500/10 text-brand-purple-200 border border-brand-purple-500/20">
                    {challenge.hardness} / 10 — {challenge.hardness >= 7 ? 'Challenging' : 'Medium'}
                  </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand-purple-500/10 text-brand-purple-300 border border-brand-purple-500/20 uppercase tracking-wider">
                      {challenge.category}
                    </span>
                    {challenge.estimatedEffort && (
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10">
                        {challenge.estimatedEffort}
                      </span>
                    )}
                  </div>
                </div>

                <section className="space-y-1"><h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">What you need to do</h3><p className="text-sm text-white/70 leading-relaxed border-l-2 border-brand-cyan-500/50 pl-3">
                  {challenge.description}
                </p></section>

                {challenge.requirement && (
                  <section className="space-y-1">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Special requirement</h3>
                    <p className="text-sm text-white/70 leading-relaxed">{challenge.requirement}</p>
                  </section>
                )}

                <section className="space-y-1"><h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">One-line solution</h3><p className="text-sm text-white/70 leading-relaxed">{challenge.oneLineSolution}</p></section>
                <section className="space-y-1"><h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Judge check</h3><p className="text-sm text-white/70 leading-relaxed">{challenge.judgeCheck}</p></section>

                {challenge.constraints.length > 0 && (
                  <section className="space-y-1.5">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Constraints</h3>
                    <ul className="space-y-1">
                      {challenge.constraints.map((item) => (
                        <li key={item} className="text-xs text-white/55 leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-brand-purple-400">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {challenge.acceptanceCriteria.length > 0 && (
                  <section className="space-y-1.5">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Acceptance Criteria</h3>
                    <ul className="space-y-1">
                      {challenge.acceptanceCriteria.map((item) => (
                        <li key={item} className="text-xs text-brand-cyan-100/80 leading-relaxed flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-brand-cyan-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {challenge.judgingFocus.length > 0 && (
                  <section className="space-y-1.5">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Judges will check</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {challenge.judgingFocus.map((item) => (
                        <span key={item} className="text-[11px] px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70">
                          {item}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {challenge.adaptationHint && (
                  <section className="bg-brand-purple-500/10 border border-brand-purple-500/20 rounded-xl p-3">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-purple-300 mb-1">Apply to</h3>
                    <p className="text-xs text-white/70 leading-relaxed">{challenge.adaptationHint}</p>
                  </section>
                )}
              </div>

              <div className="pt-1 w-full relative z-10">
                <motion.button
                  onClick={onSave}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full bg-gradient-to-r from-brand-purple-600 to-brand-cyan-500 hover:from-brand-purple-500 hover:to-brand-cyan-400 py-3.5 rounded-full text-base font-black uppercase tracking-wider text-white shadow-glow-purple flex items-center justify-center space-x-2 transition-all"
                >
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>Save & Next Team</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
