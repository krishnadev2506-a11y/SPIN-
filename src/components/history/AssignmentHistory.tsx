import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { exportToCSV } from '../../utils/csvHelper';
import { Search, Download, FileText, Calendar, ShieldAlert } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';

export const AssignmentHistory: React.FC = () => {
  const { assignments, situationAssignments } = useEvent();
  const [searchQuery, setSearchQuery] = useState('');
  const [phase, setPhase] = useState<'feature' | 'situation'>('feature');

  const currentAssignments = phase === 'feature'
    ? assignments.map(item => ({ id: item.id, teamName: item.teamName, taskTitle: item.challengeTitle, timestamp: item.timestamp }))
    : situationAssignments.map(item => ({ id: item.id, teamName: item.teamName, taskTitle: item.situationTitle, timestamp: item.timestamp }));

  const filteredAssignments = currentAssignments.filter(item => 
    item.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.taskTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleExportCSV = () => {
    const csvData = currentAssignments.map((item, idx) => ({
      Rank: idx + 1,
      Team: item.teamName,
      [phase === 'feature' ? 'Assigned Feature' : 'Assigned Situation']: item.taskTitle,
      Timestamp: formatTimestamp(item.timestamp)
    }));
    exportToCSV(csvData, phase === 'feature' ? 'phase_1_feature_assignments.csv' : 'phase_2_situation_assignments.csv');
  };

  const handleExportXLSX = () => {
    const rows = currentAssignments.map((item, idx) => ({
      'Assignment #': idx + 1,
      Team: item.teamName,
      [phase === 'feature' ? 'Feature Challenge' : 'Situation Challenge']: item.taskTitle,
      Assigned: formatTimestamp(item.timestamp)
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet['!cols'] = [{ wch: 16 }, { wch: 28 }, { wch: 34 }, { wch: 24 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, phase === 'feature' ? 'Phase 1 Features' : 'Phase 2 Situations');
    XLSX.writeFile(workbook, phase === 'feature' ? 'phase_1_feature_assignments.xlsx' : 'phase_2_situation_assignments.xlsx');
  };

  const handleExportPDF = () => {
    const element = document.getElementById('pdf-report-template');
    if (!element) return;

    // Show the printable element temporarily for rendering
    element.style.display = 'block';

    const opt = {
      margin: 0.5,
      filename: 'fhc_lightning_assignments_report.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
    };

    // Use html2pdf to compile PDF
    html2pdf()
      .from(element)
      .set(opt)
      .save()
      .then(() => {
        // Hide the printable element again after export finishes
        element.style.display = 'none';
      })
      .catch((err: any) => {
        console.error('PDF export failed:', err);
        element.style.display = 'none';
      });
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center space-x-2">
            <Calendar className="text-brand-purple-400 w-6 h-6" />
            <span>Assignment History</span>
          </h2>
          <p className="text-sm text-white/50">Search and export assignments generated during the spin sessions.</p>
        </div>

        {/* Action downloads */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            disabled={currentAssignments.length === 0}
            className="bg-dark-900 border border-white/10 hover:border-brand-purple-500/40 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center space-x-1.5 disabled:opacity-40 disabled:hover:border-white/10 disabled:cursor-not-allowed transition-all"
          >
            <Download className="w-3.5 h-3.5 text-brand-purple-400" />
            <span>Export CSV</span>
          </button>
          
          <button
            onClick={handleExportPDF}
            disabled={currentAssignments.length === 0}
            className="bg-dark-900 border border-white/10 hover:border-brand-cyan-500/40 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center space-x-1.5 disabled:opacity-40 disabled:hover:border-white/10 disabled:cursor-not-allowed transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-brand-cyan-400" />
            <span>Export PDF Report</span>
          </button>
          <button
            onClick={handleExportXLSX}
            disabled={currentAssignments.length === 0}
            className="bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-400/70 text-emerald-200 text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center space-x-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export XLSX</span>
          </button>
        </div>
      </div>

      <div className="flex w-fit rounded-xl border border-white/10 bg-dark-900/60 p-1">
        <button onClick={() => setPhase('feature')} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${phase === 'feature' ? 'bg-brand-purple-600 text-white' : 'text-white/60 hover:text-white'}`}>Phase 1 · Features</button>
        <button onClick={() => setPhase('situation')} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${phase === 'situation' ? 'bg-orange-600 text-white' : 'text-white/60 hover:text-white'}`}>Phase 2 · Situations</button>
      </div>

      {/* Search inputs */}
      <div className="glass-panel p-4 border border-white/5 flex items-center space-x-3">
        <Search className="w-5 h-5 text-white/30" />
        <input
          type="text"
          placeholder="Filter by team name or assigned challenge..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="bg-transparent border-none text-white text-sm focus:outline-none w-full"
        />
      </div>

      {/* History table */}
      <div className="glass-panel border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-bold text-white/50 uppercase tracking-wider">
                <th className="px-6 py-4">Index</th>
                <th className="px-6 py-4">Team Name</th>
                <th className="px-6 py-4">{phase === 'feature' ? 'Assigned Feature' : 'Assigned Situation'}</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-white/80">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-white/40">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <ShieldAlert className="w-10 h-10 text-white/10 stroke-[1.5]" />
                      <span className="font-semibold text-sm">No matches found</span>
                      <span className="text-xs">Try searching for a different keyword or start spinning.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4 text-white/40 font-mono font-bold text-xs">{idx + 1}</td>
                    <td className="px-6 py-4 font-bold text-white">{item.teamName}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block bg-brand-purple-500/10 text-brand-purple-300 border border-brand-purple-500/20 px-3 py-1 rounded-full text-xs font-semibold">
                        {item.taskTitle}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/40 text-xs">{formatTimestamp(item.timestamp)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden printable report layout (Light themed for ink efficiency) */}
      <div
        id="pdf-report-template"
        style={{ display: 'none' }}
        className="p-10 bg-white text-zinc-950 font-sans border border-zinc-200"
      >
        <div className="flex justify-between items-center border-b-2 border-zinc-300 pb-5 mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">FHC BUILDATHON</h1>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Official Feature Assignment Log</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-zinc-500">Date Generated</p>
            <p className="text-sm font-bold text-zinc-800">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200 flex justify-between text-xs font-bold text-zinc-600">
            <span>Total {phase === 'feature' ? 'Feature' : 'Situation'} Assignments: {currentAssignments.length}</span>
            <span>Generated Programmatically</span>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-zinc-300 bg-zinc-100 font-bold text-zinc-700 uppercase">
                <th className="p-3">Rank</th>
                <th className="p-3">Team</th>
                <th className="p-3">{phase === 'feature' ? 'Assigned Feature' : 'Assigned Situation'}</th>
                <th className="p-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-800">
              {currentAssignments.map((item, idx) => (
                <tr key={item.id}>
                  <td className="p-3 font-mono font-bold">{idx + 1}</td>
                  <td className="p-3 font-bold text-zinc-900">{item.teamName}</td>
                  <td className="p-3 font-semibold">{item.taskTitle}</td>
                  <td className="p-3 text-zinc-500">{new Date(item.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pt-16 text-center border-t border-zinc-200 mt-10">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">FHC Buildathon Organizer Committee</p>
            <p className="text-[9px] text-zinc-400">© {new Date().getFullYear()} Founder House Capital. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
