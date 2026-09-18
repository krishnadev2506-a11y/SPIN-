import { useMemo, useState } from 'react';
import { CheckCircle2, Circle, Search } from 'lucide-react';
import { useEvent } from '../../context/EventContext';

type Phase = 'feature' | 'situation';

export function ChallengeCatalog() {
  const { challenges, situationChallenges, assignments, situationAssignments } = useEvent();
  const [phase, setPhase] = useState<Phase>('feature');
  const [query, setQuery] = useState('');
  const assignmentMap = useMemo(() => new Map(
    (phase === 'feature' ? assignments : situationAssignments).map(item => [
      phase === 'feature' ? (item as typeof assignments[number]).challengeTitle : (item as typeof situationAssignments[number]).situationTitle,
      item.teamName
    ])
  ), [phase, assignments, situationAssignments]);
  const items = phase === 'feature' ? challenges : situationChallenges;
  const filtered = items.filter(item => item.title.toLowerCase().includes(query.toLowerCase()));

  return <section className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><h2 className="text-2xl font-bold">Challenge catalogue</h2><p className="mt-1 text-sm text-white/50">Every available wheel entry and its current assignment status.</p></div>
      <div className="flex rounded-xl border border-white/10 bg-dark-900/50 p-1">
        <button onClick={() => setPhase('feature')} className={`rounded-lg px-3 py-2 text-xs font-semibold ${phase === 'feature' ? 'bg-brand-purple-600 text-white' : 'text-white/60 hover:text-white'}`}>Phase 1 · Features</button>
        <button onClick={() => setPhase('situation')} className={`rounded-lg px-3 py-2 text-xs font-semibold ${phase === 'situation' ? 'bg-orange-600 text-white' : 'text-white/60 hover:text-white'}`}>Phase 2 · Situations</button>
      </div>
    </div>
    <label className="glass-panel flex items-center gap-3 border border-white/10 px-4 py-3"><Search className="h-4 w-4 text-white/40" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search titles…" className="w-full bg-transparent text-sm outline-none" /></label>
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-dark-900/50">
      <div className="max-h-[65vh] overflow-auto divide-y divide-white/5">
        {filtered.map((item, index) => {
          const assignedTo = assignmentMap.get(item.title);
          return <div key={item.id} className="flex items-center gap-4 px-4 py-3 sm:px-6">
            <span className="w-7 text-xs font-semibold text-white/30">{index + 1}</span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.title}</p><p className="mt-0.5 truncate text-xs text-white/45">{phase === 'feature' ? `${(item as typeof challenges[number]).hardness} / 10` : `${(item as typeof situationChallenges[number]).difficultyScore} / 10`}</p></div>
            {assignedTo ? <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-300"><CheckCircle2 className="h-4 w-4" />Assigned · {assignedTo}</span> : <span className="flex items-center gap-1.5 text-xs text-white/40"><Circle className="h-4 w-4" />Available</span>}
          </div>;
        })}
      </div>
    </div>
  </section>;
}
