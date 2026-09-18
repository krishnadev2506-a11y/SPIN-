import { motion } from 'framer-motion';
import { Check, Download, X } from 'lucide-react';
import type { BatchAssignmentResult } from '../../context/EventContext';

interface BatchResultsOverlayProps {
  phase: 'feature' | 'situation';
  results: BatchAssignmentResult[];
  onClose: () => void;
}

export function BatchResultsOverlay({ phase, results, onClose }: BatchResultsOverlayProps) {
  const accent = phase === 'feature' ? 'border-brand-purple-500/30' : 'border-orange-500/30';
  const label = phase === 'feature' ? 'Phase 1 · Feature challenges' : 'Phase 2 · Situation challenges';
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/90 p-4 backdrop-blur-md">
    <motion.div initial={{ opacity: 0, scale: .96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} className={`glass-modal w-full max-w-2xl border ${accent} p-6 shadow-2xl`}>
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/45">Bulk spin complete</p><h2 className="mt-1 text-2xl font-bold">{results.length} assignments generated</h2><p className="mt-1 text-sm text-white/55">{label}</p></div>
        <button onClick={onClose} className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white" aria-label="Close results"><X className="h-5 w-5" /></button>
      </div>
      <div className="mt-5 max-h-[52vh] overflow-y-auto rounded-xl border border-white/10 divide-y divide-white/5">
        {results.map((result, index) => <div key={`${result.teamName}-${index}`} className="flex items-center gap-3 px-4 py-3 text-sm"><Check className={`h-4 w-4 shrink-0 ${phase === 'feature' ? 'text-brand-purple-300' : 'text-orange-300'}`} /><span className="min-w-0 flex-1 font-semibold">{result.teamName}</span><span className="max-w-[52%] text-right text-xs text-white/60">{result.title}</span></div>)}
      </div>
      <div className="mt-5 flex justify-end"><button onClick={onClose} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white ${phase === 'feature' ? 'bg-brand-purple-600 hover:bg-brand-purple-500' : 'bg-orange-600 hover:bg-orange-500'}`}><Download className="h-4 w-4" />Done</button></div>
    </motion.div>
  </div>;
}
