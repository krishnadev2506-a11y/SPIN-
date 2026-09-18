import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { useEvent } from '../../context/EventContext';
import type { Challenge } from '../../context/EventContext';
import type { SituationChallenge } from '../../data/situationChallenges';
import { useAudio } from '../../hooks/useAudio';
import { Play } from 'lucide-react';

interface SpinningWheelProps {
  onSpinStart: () => void;
  onSpinComplete: (winningChallenge: Challenge | SituationChallenge) => void;
  disabled: boolean;
  challengePool?: Challenge[] | SituationChallenge[];
  mode?: 'feature' | 'situation';
}

const COLORS = [
  '#9333ea', // purple-600
  '#0891b2', // cyan-600
  '#4f46e5', // indigo-600
  '#2563eb', // blue-600
  '#7c3aed', // violet-600
  '#0d9488', // teal-600
  '#0284c7', // sky-600
  '#c084fc', // purple-400
  '#22d3ee', // cyan-400
  '#818cf8', // indigo-400
  '#60a5fa', // blue-400
  '#a78bfa'  // violet-400
];

const SITUATION_COLORS = [
  '#f97316', // orange-500
  '#ef4444', // red-500
  '#f59e0b', // amber-500
  '#dc2626', // red-600
  '#ea580c', // orange-600
  '#b91c1c', // red-700
  '#fb923c', // orange-400
  '#f87171', // red-400
  '#fbbf24', // amber-400
  '#fca5a5', // red-300
  '#fdba74', // orange-300
  '#fcd34d'  // amber-300
];

export const SpinningWheel: React.FC<SpinningWheelProps> = ({
  onSpinStart,
  onSpinComplete,
  disabled,
  challengePool,
  mode = 'feature'
}) => {
  const { challenges, situationChallenges, currentTeamId, assignments, situationAssignments } = useEvent();
  const { playTick, playSpinStart } = useAudio();

  const [spinning, setSpinning] = useState(false);
  const rotation = useMotionValue(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Use provided challenge pool or fall back to context
  const pool = challengePool || (mode === 'situation' ? situationChallenges : challenges);

  // Duplicates weight the wheel, but a team can never receive the same title twice.
  // Applicability is intentionally broad; only explicit LOW entries are removed.
  const previousTitles = new Set(mode === 'feature'
    ? assignments.filter(a => a.teamId === currentTeamId).map(a => a.challengeTitle)
    : situationAssignments.filter(a => a.teamId === currentTeamId).map(a => a.situationTitle));
  const remainingChallenges = pool.filter(item =>
    !previousTitles.has(item.title) &&
    Object.values(item.applicability).some(level => level === 'HIGH' || level === 'MEDIUM')
  );

  const numSlices = remainingChallenges.length;
  const sliceAngle = 360 / (numSlices || 1);

  // Keep track of the current slice index to avoid redundant ticks
  const lastTickIndexRef = useRef(-1);

  // Monitor rotation to fire physical ticks
  useEffect(() => {
    const unsubscribe = rotation.on('change', (val) => {
      if (numSlices === 0) return;
      // Normalise rotation angle
      // SVG pointer is at 12 o'clock (270 degrees)
      const currentAngle = (270 - val) % 360;
      const normalizedAngle = currentAngle < 0 ? currentAngle + 360 : currentAngle;
      const index = Math.floor(normalizedAngle / sliceAngle);

      if (index !== lastTickIndexRef.current) {
        lastTickIndexRef.current = index;
        playTick();
      }
    });

    return () => unsubscribe();
  }, [rotation, numSlices, sliceAngle]);

  const handleSpin = () => {
    if (spinning || disabled || numSlices === 0 || !currentTeamId) return;

    setSpinning(true);
    onSpinStart();
    playSpinStart();

    // 1. Pick a random index from remaining challenges
    const winIndex = Math.floor(Math.random() * numSlices);
    const winningChallenge = remainingChallenges[winIndex];

    // 2. Compute final rotation angle
    // Align center of target slice to the top (270 degrees)
    const sliceCenter = (winIndex + 0.5) * sliceAngle;
    const baseRotation = 270 - sliceCenter;
    
    // 5 to 7 full rotations plus offset
    const spins = 5 + Math.floor(Math.random() * 3);
    const finalRotation = spins * 360 + baseRotation;

    // Reset rotation motion value first to avoid continuous accumulation issues
    rotation.set(rotation.get() % 360);

    const spinDuration = 6 + Math.random() * 2; // 6 to 8 seconds

    // 3. Trigger Framer Motion rotation animation
    // animate function triggers smooth manual transitions on MotionValues
    import('framer-motion').then(({ animate }) => {
      animate(rotation, finalRotation, {
        duration: spinDuration,
        // Easing: starts fast, decelerates heavily, and does a slight spring/bounce-back overshoot
        ease: [0.15, 0.85, 0.25, 1.025],
        onComplete: () => {
          setSpinning(false);
          // Wait 300ms, then trigger complete callback
          setTimeout(() => {
            onSpinComplete(winningChallenge);
          }, 300);
        }
      });
    });
  };

  // Helper to draw SVG paths for wheel slices
  const makeSlicePath = (index: number) => {
    if (numSlices === 1) {
      return ''; // Handle 1 slice separately below
    }
    const r = 200; // radius
    const cx = 200;
    const cy = 200;

    const startAngleRad = ((index * sliceAngle - 90) * Math.PI) / 180;
    const endAngleRad = (((index + 1) * sliceAngle - 90) * Math.PI) / 180;

    const x1 = cx + r * Math.cos(startAngleRad);
    const y1 = cy + r * Math.sin(startAngleRad);
    const x2 = cx + r * Math.cos(endAngleRad);
    const y2 = cy + r * Math.sin(endAngleRad);

    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
  };

  const getSliceRotation = (index: number) => {
    return index * sliceAngle + sliceAngle / 2;
  };

  // Truncate challenge title to fit slice
  const getTruncatedTitle = (title: string) => {
    const limit = numSlices > 18 ? 12 : numSlices > 10 ? 18 : 28;
    return title.length > limit ? title.substring(0, limit) + '...' : title;
  };

  // Get appropriate colors based on mode
  const colors = mode === 'situation' ? SITUATION_COLORS : COLORS;
  const glowClass = mode === 'situation' ? 'shadow-glow-orange' : 'shadow-glow-purple';
  const pointerColor = mode === 'situation' ? '#f97316' : '#a855f7';
  const pointerShadow = mode === 'situation' ? 'rgba(249, 115, 22, 0.8)' : 'rgba(168, 85, 247, 0.8)';
  const centerText = mode === 'situation' ? 'SIT' : 'BUILD';
  const centerTextColor = mode === 'situation' ? 'text-orange-400' : 'text-brand-purple-400';

  return (
    <div className="flex flex-col items-center justify-center space-y-8 relative">
      {/* Outer Glow container */}
      <div className={`relative p-4 rounded-full border border-white/5 bg-dark-900/30 backdrop-blur-sm ${glowClass} flex items-center justify-center w-[360px] h-[360px] md:w-[440px] md:h-[440px]`}>
        {/* Pointer indicator pin */}
        <div className={`absolute -top-1 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none drop-shadow-[0_0_8px_${pointerShadow}]`}>
          <svg width="28" height="34" viewBox="0 0 28 34" fill="none">
            <path d="M14 34L28 6H0L14 34Z" fill={pointerColor} />
            <circle cx="14" cy="6" r="4" fill="#ffffff" />
          </svg>
        </div>

        {/* Rotating Wheel body */}
        <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/10 relative">
          {numSlices === 0 ? (
            <div className="w-full h-full bg-dark-900 flex flex-col items-center justify-center text-center p-6 text-white/40">
              <span className="font-bold text-sm">All Challenges Assigned!</span>
              <span className="text-xs">Reset the event state to start again.</span>
            </div>
          ) : (
            <motion.div
              ref={wheelRef}
              style={{ rotate: rotation, width: '100%', height: '100%' }}
              className="relative origin-center"
            >
              {numSlices === 1 ? (
                // Single slice fills the entire circle
                <div 
                  className="w-full h-full flex items-center justify-center font-bold text-xs p-4 text-center"
                  style={{ backgroundColor: COLORS[0] }}
                >
                  <span className="transform -rotate-90 select-none text-white drop-shadow">
                    {remainingChallenges[0].title}
                  </span>
                </div>
              ) : (
                <svg viewBox="0 0 400 400" className="w-full h-full">
                  {remainingChallenges.map((challenge, idx) => {
                    const path = makeSlicePath(idx);
                    const angle = getSliceRotation(idx);
                    const color = colors[idx % colors.length];

                    return (
                      <g key={challenge.id}>
                        {/* Slice Sector */}
                        <path
                          d={path}
                          fill={color}
                          stroke="#090714"
                          strokeWidth="1.5"
                          className="transition-colors duration-200"
                        />
                        {/* Slice Title Spoke Text */}
                        <g transform={`rotate(${angle - 90} 200 200)`}>
                          <text
                            x="200"
                            y="70"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize={numSlices > 24 ? '8' : numSlices > 16 ? '9' : '10'}
                            fontWeight="800"
                            className="select-none font-sans drop-shadow-md"
                          >
                            {getTruncatedTitle(challenge.title)}
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </svg>
              )}
            </motion.div>
          )}
        </div>

        {/* Center Circular Glass Plate */}
        <div className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-dark-950/80 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-2xl z-10 select-none">
          <div className="text-center">
            <span className="text-[10px] text-white/40 block font-bold tracking-widest uppercase">FHC</span>
            <span className={`text-xs font-black ${centerTextColor}`}>{centerText}</span>
          </div>
        </div>
      </div>

      {/* Spin Button trigger */}
      <motion.button
        onClick={handleSpin}
        disabled={spinning || disabled || numSlices === 0 || !currentTeamId}
        whileHover={{ scale: (spinning || disabled || numSlices === 0 || !currentTeamId) ? 1 : 1.05 }}
        whileTap={{ scale: (spinning || disabled || numSlices === 0 || !currentTeamId) ? 1 : 0.95 }}
        className="px-8 py-4 bg-gradient-to-r from-brand-purple-600 via-brand-purple-500 to-brand-cyan-500 hover:from-brand-purple-500 hover:via-brand-purple-400 hover:to-brand-cyan-400 disabled:from-dark-800 disabled:to-dark-800 disabled:border-white/5 border border-transparent disabled:text-white/30 disabled:cursor-not-allowed rounded-full text-base font-black uppercase tracking-wider shadow-glow-purple disabled:shadow-none flex items-center space-x-2.5 transition-all z-20"
      >
        <Play className="w-5 h-5 fill-current" />
        <span>Spin Wheel</span>
      </motion.button>
    </div>
  );
};
