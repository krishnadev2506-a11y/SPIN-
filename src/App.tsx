import { useState } from 'react';
import { EventProvider } from './context/EventContext';
import { PresentationMode } from './components/wheel/PresentationMode';
import { TeamManager } from './components/manage/TeamManager';
import { AssignmentHistory } from './components/history/AssignmentHistory';
import { Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type View = 'distribute' | 'teams' | 'history';
function DistributorApp() {
  const [view, setView] = useState<View>('distribute');
  if (view === 'distribute') return <PresentationMode onClose={() => setView('teams')} />;
  return <div className="min-h-screen bg-dark-950 text-white">
    <header className="sticky top-0 z-20 border-b border-white/10 bg-dark-950/90 backdrop-blur px-5 py-4 flex flex-wrap items-center justify-between gap-3">
      <button onClick={() => setView('distribute')} className="flex items-center gap-2 font-bold tracking-tight"><Zap className="w-5 h-5 text-brand-purple-400" />Challenge Distributor</button>
      <nav className="flex gap-1 rounded-xl border border-white/10 p-1">
        {([['distribute','Distribute'],['teams','Teams'],['history','History']] as const).map(([key,label]) => <button key={key} onClick={() => setView(key)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${view===key?'bg-brand-purple-600 text-white':'text-white/60 hover:bg-white/5 hover:text-white'}`}>{label}</button>)}
      </nav>
    </header>
    <main className="mx-auto w-full max-w-6xl px-5 py-8"><AnimatePresence mode="wait"><motion.div key={view} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.18}}>{view==='teams'?<TeamManager/>:<AssignmentHistory/>}</motion.div></AnimatePresence></main>
  </div>;
}
export default function App(){ return <EventProvider><DistributorApp/></EventProvider>; }
