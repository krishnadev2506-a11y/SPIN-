import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import type { BatchAssignmentResult } from '../../context/EventContext';
import type { Challenge } from '../../context/EventContext';
import type { SituationChallenge } from '../../data/situationChallenges';
import { SpinningWheel } from './SpinningWheel';
import { RevealOverlay } from './RevealOverlay';
import { SituationRevealOverlay } from './SituationRevealOverlay';
import { BatchResultsOverlay } from './BatchResultsOverlay';
import { ArrowLeft, Sparkles, WandSparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PresentationModeProps {
  onClose: () => void;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({ onClose }) => {
  const { teams, currentTeamId, assignChallenge, assignSituation, setCurrentTeamId, assignAllFeatureChallenges, assignAllSituations, situationAssignments } = useEvent();
  const [winningChallenge, setWinningChallenge] = useState<Challenge | null>(null);
  const [winningSituation, setWinningSituation] = useState<SituationChallenge | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelMode, setWheelMode] = useState<'feature' | 'situation'>('feature');
  const [batchResults, setBatchResults] = useState<BatchAssignmentResult[] | null>(null);

  const currentTeam = teams.find(t => t.id === currentTeamId);

  const handleSpinStart = () => {
    setIsSpinning(true);
  };

  const handleSpinComplete = (challenge: Challenge | SituationChallenge) => {
    if (wheelMode === 'feature') {
      setWinningChallenge(challenge as Challenge);
    } else {
      setWinningSituation(challenge as SituationChallenge);
    }
    setIsSpinning(false);
  };

  const handleSaveAssignment = () => {
    if (currentTeamId) {
      if (wheelMode === 'feature' && winningChallenge) {
        assignChallenge(currentTeamId, winningChallenge.id);
        setWinningChallenge(null);
      } else if (wheelMode === 'situation' && winningSituation) {
        assignSituation(currentTeamId, winningSituation.id);
        setWinningSituation(null);
      }
    }
  };

  const remainingCount = wheelMode === 'feature'
    ? teams.filter(team => !team.assignedChallengeId).length
    : teams.filter(team => !situationAssignments.some(item => item.teamId === team.id)).length;

  const handleBulkSpin = () => {
    if (isSpinning) return;
    const results = wheelMode === 'feature' ? assignAllFeatureChallenges() : assignAllSituations();
    if (results.length) setBatchResults(results);
  };

  // Either phase can be run for any selected team; history prevents repeats per phase.
  const selectableTeams = teams;

  return (
    <div className="min-h-screen bg-dark-950 text-white relative overflow-hidden flex flex-col font-sans">
      {/* Dynamic Background Glow Blobs */}
      <div className="bg-blob bg-blob-purple opacity-20" />
      <div className="bg-blob bg-blob-cyan opacity-20" />

      {/* Focused distribution header */}
      <div className="glass-panel rounded-none border-t-0 border-x-0 border-b border-white/5 px-6 py-4 flex items-center justify-between z-30 select-none bg-dark-900/40 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl border border-white/5 text-white/70 hover:text-white transition-all flex items-center space-x-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-bold hidden sm:inline">Admin View</span>
          </button>

          <span className="font-extrabold text-sm tracking-tight uppercase">Challenge Distributor</span>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center space-x-1 border border-white/5 bg-dark-900/60 p-1 rounded-xl">
          <button
            onClick={() => setWheelMode('feature')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              wheelMode === 'feature'
                ? 'bg-brand-purple-600 text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Phase 1 · Feature
          </button>
          <button
            onClick={() => setWheelMode('situation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              wheelMode === 'situation'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Phase 2 · Situation
          </button>
        </div>

        <span className="text-[11px] text-white/40 font-medium">Select team · Select phase · Spin</span>
      </div>

      {/* Main Grid split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 p-6 gap-6 relative z-10 max-w-[1400px] w-full mx-auto self-center">
        <div className="lg:col-span-4 flex flex-col">
          
          {/* Active Team Selection & Target */}
          <div className="glass-panel p-6 border border-white/5 flex flex-col justify-center flex-1 min-h-[160px] relative overflow-hidden bg-gradient-to-br from-dark-900 to-dark-950">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-purple-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-4">
              <div className={`flex items-center space-x-1.5 text-xs font-bold uppercase tracking-widest ${
                wheelMode === 'feature' ? 'text-brand-purple-400' : 'text-orange-400'
              }`}>
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>active target contestant</span>
              </div>

              {currentTeam ? (
                <div className="space-y-2">
                  <motion.div
                    key={currentTeam.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`text-3xl md:text-4xl font-black tracking-tight py-2 leading-tight ${
                      wheelMode === 'feature' ? 'glow-text-purple' : 'glow-text-orange'
                    } text-white`}
                  >
                    {currentTeam.name}
                  </motion.div>
                  <p className="text-xs text-white/40">
                    {wheelMode === 'feature' ? 'Phase 1 — add something useful to the existing project.' : 'Phase 2 — something changed. Adapt the project.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  <p className="text-lg font-bold text-white/50">All Teams Assigned!</p>
                  <p className="text-xs text-white/30">Select a team from admin panel or reset the event to start over.</p>
                </div>
              )}

              {/* Selector dropdown for live override if needed */}
              {selectableTeams.length > 0 && !isSpinning && (
                <div className="pt-2">
                  <label className="text-[10px] text-white/30 block uppercase font-bold tracking-wider mb-1">Switch Active Team</label>
                  <select
                    value={currentTeamId}
                    onChange={e => setCurrentTeamId(e.target.value)}
                    className="bg-dark-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-brand-purple-500 w-full max-w-xs transition-all"
                  >
                    <option value="" disabled>-- Select a team --</option>
                    {selectableTeams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="border-t border-white/10 pt-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/35">One-click distribution</p>
                <button onClick={handleBulkSpin} disabled={remainingCount === 0 || isSpinning} className={`w-full rounded-xl px-4 py-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${wheelMode === 'feature' ? 'bg-brand-purple-600 hover:bg-brand-purple-500' : 'bg-orange-600 hover:bg-orange-500'}`}>
                  <span className="flex items-center justify-center gap-2"><WandSparkles className="h-4 w-4" />Spin all remaining teams ({remainingCount})</span>
                </button>
                <p className="mt-2 text-[11px] leading-relaxed text-white/35">Assigns one random eligible {wheelMode === 'feature' ? 'feature' : 'situation'} to every unassigned team and keeps existing results unchanged.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Center/Right Side: Spinning Wheel container */}
        <div className="lg:col-span-8 glass-panel border border-white/5 flex flex-col items-center justify-center p-8 bg-dark-900/20 backdrop-blur-sm relative min-h-[500px]">
          <div className="absolute top-4 left-4 text-[10px] font-bold text-white/35 uppercase tracking-widest">Fair eligible pool · random draw</div>

          <SpinningWheel
            onSpinStart={handleSpinStart}
            onSpinComplete={handleSpinComplete}
            disabled={!currentTeamId || isSpinning}
            mode={wheelMode}
          />
        </div>
      </div>

      {/* Dramatic Reveal Modal Overlay */}
      <AnimatePresence>
        {winningChallenge && currentTeam && (
          <RevealOverlay
            challenge={winningChallenge}
            teamName={currentTeam.name}
            onSave={handleSaveAssignment}
          />
        )}
        {winningSituation && currentTeam && (
          <SituationRevealOverlay
            situation={winningSituation}
            teamName={currentTeam.name}
            onSave={handleSaveAssignment}
          />
        )}
        {batchResults && <BatchResultsOverlay phase={wheelMode} results={batchResults} onClose={() => setBatchResults(null)} />}
      </AnimatePresence>
    </div>
  );
};
