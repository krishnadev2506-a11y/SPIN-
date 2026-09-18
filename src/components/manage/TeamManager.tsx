import React, { useState, useRef } from 'react';
import { useEvent } from '../../context/EventContext';
import { parseCSV, exportToCSV } from '../../utils/csvHelper';
import { Plus, Trash2, Edit3, Upload, Download, Lock, CheckCircle, Users, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const TeamManager: React.FC = () => {
  const {
    teams,
    addTeam,
    editTeam,
    deleteTeam,
    importTeamsCSV,
    isEventStarted
  } = useEvent();

  const [newTeamName, setNewTeamName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [importResults, setImportResults] = useState<{ success: boolean; count: number; duplicates: string[] } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEventStarted) return;
    setFormError(null);
    setImportResults(null);

    const result = addTeam(newTeamName);
    if (result.success) {
      setNewTeamName('');
    } else {
      setFormError(result.error || 'Failed to add team.');
    }
  };

  const handleStartEdit = (id: string, name: string) => {
    if (isEventStarted) return;
    setEditingId(id);
    setEditingName(name);
    setFormError(null);
  };

  const handleSaveEdit = (id: string) => {
    if (isEventStarted) return;
    const result = editTeam(id, editingName);
    if (result.success) {
      setEditingId(null);
      setEditingName('');
    } else {
      setFormError(result.error || 'Failed to update team.');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setFormError(null);
  };

  const handleExportCSV = () => {
    const dataToExport = teams.map((team, idx) => ({
      Index: idx + 1,
      ID: team.id,
      'Team Name': team.name,
      'Assigned Challenge ID': team.assignedChallengeId || 'Unassigned',
      'Assigned At': team.assignedAt || 'N/A'
    }));
    exportToCSV(dataToExport, 'fhc_buildathon_teams.csv');
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isEventStarted) return;
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        try {
          const parsed = await parseCSV<any>(text);
          // Standardized field search: check properties for "team", "name", "team name", or take the first value
          const teamNames: string[] = parsed
            .map(row => {
              const keys = Object.keys(row);
              const foundKey = keys.find(k => 
                k.toLowerCase() === 'name' || 
                k.toLowerCase() === 'team' || 
                k.toLowerCase() === 'team name' || 
                k.toLowerCase() === 'teamname'
              );
              if (foundKey) return row[foundKey];
              // Fallback to first property if header didn't match standard names
              return row[keys[0]];
            })
            .filter(Boolean);

          const result = importTeamsCSV(teamNames);
          setImportResults(result);
          if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (parseErr) {
          setFormError('Failed to parse CSV file content.');
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setFormError('Error loading file.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Counters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center space-x-2">
            <Users className="text-brand-purple-400 w-6 h-6" />
            <span>Team Management</span>
          </h2>
          <p className="text-sm text-white/50">Register, manage, and import team contestants.</p>
        </div>

        {/* Live capacity counter */}
        <div className="glass-panel px-5 py-3 flex items-center space-x-4 border border-white/5 bg-dark-900/40">
          <div className="text-right">
            <span className="text-[10px] text-white/40 block uppercase tracking-wider">Teams Registered</span>
            <span className={`text-lg font-black ${teams.length >= 36 ? 'text-red-400' : 'text-brand-purple-400'}`}>
              {teams.length} <span className="text-sm text-white/30 font-medium">/ 36 Max</span>
            </span>
          </div>
          <div className="w-[80px] bg-dark-800 h-2 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-brand-purple-500 rounded-full transition-all duration-500" 
              style={{ width: `${(teams.length / 36) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Lock banner if event started */}
      {isEventStarted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl flex items-start space-x-3 text-sm"
        >
          <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Team Configuration Locked:</span> The event has already started (challenges are assigned). Adding, modifying, deleting, or importing teams is disabled to protect active status.
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Add Team and CSV Imports */}
        <div className="lg:col-span-1 space-y-6">
          {/* Add Team form */}
          <div className="glass-panel p-6 border border-white/5 space-y-4">
            <h3 className="font-bold tracking-tight text-sm uppercase text-white/70">Add New Team</h3>
            
            <form onSubmit={handleAddTeam} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder={isEventStarted ? "Locked" : "Enter unique team name..."}
                  disabled={isEventStarted || teams.length >= 36}
                  value={newTeamName}
                  onChange={e => {
                    setNewTeamName(e.target.value);
                    setFormError(null);
                  }}
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>

              <motion.button
                type="submit"
                disabled={isEventStarted || !newTeamName.trim() || teams.length >= 36}
                whileHover={{ scale: (isEventStarted || !newTeamName.trim()) ? 1 : 1.02 }}
                whileTap={{ scale: (isEventStarted || !newTeamName.trim()) ? 1 : 0.98 }}
                className="w-full bg-gradient-to-r from-brand-purple-600 to-brand-purple-500 hover:from-brand-purple-500 hover:to-brand-purple-400 disabled:from-dark-800 disabled:to-dark-800 disabled:border-white/5 border border-transparent disabled:text-white/30 disabled:cursor-not-allowed py-3 rounded-xl text-sm font-bold shadow-lg hover:shadow-glow-purple flex items-center justify-center space-x-2 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Team</span>
              </motion.button>
            </form>

            <AnimatePresence mode="wait">
              {formError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-xl text-xs flex items-center space-x-2"
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Import / Export Panel */}
          <div className="glass-panel p-6 border border-white/5 space-y-4">
            <h3 className="font-bold tracking-tight text-sm uppercase text-white/70">CSV Actions</h3>
            
            <div className="grid grid-cols-1 gap-3">
              {/* Import Button */}
              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleCSVImport}
                  disabled={isEventStarted}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isEventStarted}
                  className="w-full bg-dark-900 border border-white/10 hover:border-brand-cyan-500/40 text-white disabled:opacity-50 disabled:hover:border-white/10 disabled:cursor-not-allowed py-3 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 transition-all"
                >
                  <Upload className="w-4 h-4 text-brand-cyan-400" />
                  <span>Import Teams CSV</span>
                </button>
              </div>

              {/* Export Button */}
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={teams.length === 0}
                className="w-full bg-dark-900 border border-white/10 hover:border-brand-purple-500/40 text-white disabled:opacity-50 disabled:hover:border-white/10 disabled:cursor-not-allowed py-3 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 transition-all"
              >
                <Download className="w-4 h-4 text-brand-purple-400" />
                <span>Export Teams CSV</span>
              </button>
            </div>

            {/* CSV Import Summary Status */}
            {importResults && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-brand-cyan-500/10 border border-brand-cyan-500/20 text-brand-cyan-400 p-3 rounded-xl text-xs space-y-1"
              >
                <div className="font-bold flex items-center space-x-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Successfully imported {importResults.count} teams!</span>
                </div>
                {importResults.duplicates.length > 0 && (
                  <p className="text-[10px] text-white/50">
                    Skipped duplicate names: {importResults.duplicates.join(', ')}
                  </p>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Side: Teams Table List */}
        <div className="lg:col-span-2">
          <div className="glass-panel border border-white/5 overflow-hidden h-full flex flex-col min-h-[400px]">
            <div className="p-6 border-b border-white/5">
              <h3 className="font-bold tracking-tight text-sm uppercase text-white/70">Registered Teams List</h3>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[460px]">
              {teams.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-white/40 space-y-2">
                  <Users className="w-12 h-12 text-white/20 stroke-[1.5]" />
                  <span className="text-sm font-semibold">No registered teams yet</span>
                  <span className="text-xs">Add them manually or upload a CSV file to begin.</span>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {teams.map((team, idx) => (
                    <div 
                      key={team.id}
                      className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <span className="text-xs text-white/30 font-bold w-6">{idx + 1}</span>
                        {editingId === team.id ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            className="bg-dark-900 border border-brand-purple-500 rounded-lg px-2 py-1 text-sm text-white focus:outline-none w-full max-w-md"
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveEdit(team.id);
                              else if (e.key === 'Escape') handleCancelEdit();
                            }}
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-sm">{team.name}</span>
                            {team.assignedChallengeId && (
                              <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center space-x-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse mr-1" />
                                Assigned
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Team Row Operations */}
                      <div className="flex items-center space-x-2">
                        {editingId === team.id ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(team.id)}
                              className="text-xs bg-brand-purple-600 text-white px-3 py-1 rounded-md hover:bg-brand-purple-500 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-xs bg-white/5 hover:bg-white/10 text-white/70 px-3 py-1 rounded-md transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEdit(team.id, team.name)}
                              disabled={isEventStarted}
                              className="p-2 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 rounded-lg transition-all"
                              title="Edit Team"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteTeam(team.id)}
                              disabled={isEventStarted}
                              className="p-2 text-white/50 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-500/10 rounded-lg transition-all"
                              title="Delete Team"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
