import React, { useState, useRef } from 'react';
import { useEvent } from '../../context/EventContext';
import type { Challenge } from '../../context/EventContext';
import { parseCSV, exportToCSV } from '../../utils/csvHelper';
import { parseListField } from '../../data/hardChallenges';
import { Plus, Trash2, Edit3, Upload, Download, Lock, CheckCircle, Flame, AlertCircle, AlertTriangle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const emptyDraft = {
  title: '',
  category: 'Security',
  description: '',
  requirement: '',
  constraintsText: '',
  acceptanceText: '',
  judgingText: '',
  adaptationHint: 'Apply this requirement to the most relevant existing workflow in your project.',
  estimatedEffort: '75–150 min'
};

export const ChallengeManager: React.FC = () => {
  const {
    teams,
    challenges,
    addChallenge,
    editChallenge,
    deleteChallenge,
    importChallengesCSV,
    isEventStarted
  } = useEvent();

  const [title, setTitle] = useState(emptyDraft.title);
  const [category, setCategory] = useState(emptyDraft.category);
  const [description, setDescription] = useState(emptyDraft.description);
  const [requirement, setRequirement] = useState(emptyDraft.requirement);
  const [constraintsText, setConstraintsText] = useState(emptyDraft.constraintsText);
  const [acceptanceText, setAcceptanceText] = useState(emptyDraft.acceptanceText);
  const [judgingText, setJudgingText] = useState(emptyDraft.judgingText);
  const [adaptationHint, setAdaptationHint] = useState(emptyDraft.adaptationHint);
  const [estimatedEffort, setEstimatedEffort] = useState(emptyDraft.estimatedEffort);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editRequirement, setEditRequirement] = useState('');
  const [editConstraints, setEditConstraints] = useState('');
  const [editAcceptance, setEditAcceptance] = useState('');
  const [editJudging, setEditJudging] = useState('');
  const [editHint, setEditHint] = useState('');
  const [editEffort, setEditEffort] = useState('');

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [importResults, setImportResults] = useState<{ success: boolean; count: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const categories = Array.from(new Set(challenges.map(c => c.category))).sort();

  const handleAddChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEventStarted) return;
    setFormError(null);
    setImportResults(null);

    const result = addChallenge({
      title,
      category,
      description,
      requirement,
      constraints: parseListField(constraintsText),
      acceptanceCriteria: parseListField(acceptanceText),
      judgingFocus: parseListField(judgingText),
      adaptationHint,
      estimatedEffort,
      tags: []
    });
    if (result.success) {
      setTitle(emptyDraft.title);
      setDescription(emptyDraft.description);
      setRequirement(emptyDraft.requirement);
      setConstraintsText(emptyDraft.constraintsText);
      setAcceptanceText(emptyDraft.acceptanceText);
      setJudgingText(emptyDraft.judgingText);
      setAdaptationHint(emptyDraft.adaptationHint);
      setEstimatedEffort(emptyDraft.estimatedEffort);
    } else {
      setFormError(result.error || 'Failed to add challenge.');
    }
  };

  const handleStartEdit = (c: Challenge) => {
    if (isEventStarted) return;
    setEditingId(c.id);
    setEditTitle(c.title);
    setEditCategory(c.category);
    setEditDescription(c.description);
    setEditRequirement(c.requirement);
    setEditConstraints(c.constraints.join(' | '));
    setEditAcceptance(c.acceptanceCriteria.join(' | '));
    setEditJudging(c.judgingFocus.join(' | '));
    setEditHint(c.adaptationHint);
    setEditEffort(c.estimatedEffort);
    setFormError(null);
  };

  const handleSaveEdit = (id: string) => {
    if (isEventStarted) return;
    const existing = challenges.find(c => c.id === id);
    const result = editChallenge(id, {
      title: editTitle,
      category: editCategory,
      description: editDescription,
      requirement: editRequirement,
      constraints: parseListField(editConstraints),
      acceptanceCriteria: parseListField(editAcceptance),
      judgingFocus: parseListField(editJudging),
      adaptationHint: editHint,
      estimatedEffort: editEffort,
      tags: existing?.tags || []
    });
    if (result.success) {
      setEditingId(null);
    } else {
      setFormError(result.error || 'Failed to update challenge.');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormError(null);
  };

  const handleExportCSV = () => {
    const dataToExport = challenges.map((c, idx) => ({
      Index: idx + 1,
      ID: c.id,
      Title: c.title,
      Category: c.category,
      Difficulty: c.difficulty,
      Description: c.description,
      Requirement: c.requirement,
      Constraints: c.constraints.join(' | '),
      AcceptanceCriteria: c.acceptanceCriteria.join(' | '),
      JudgingFocus: c.judgingFocus.join(' | '),
      AdaptationHint: c.adaptationHint,
      EstimatedEffort: c.estimatedEffort,
      Tags: c.tags.join(' | ')
    }));
    exportToCSV(dataToExport, 'fhc_buildathon_challenges.csv');
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
          const parsed = await parseCSV<Record<string, string>>(text);
          const parsedItems = parsed.map(row => {
            const keys = Object.keys(row);
            const normalizeKey = (k: string) => k.toLowerCase().replace(/[\s_]/g, '');
            const pick = (...names: string[]) => {
              const wanted = names.map(normalizeKey);
              const key = keys.find(k => wanted.includes(normalizeKey(k)));
              return key ? row[key] : '';
            };

            const titleKey = keys.find(k => k.toLowerCase() === 'title' || k.toLowerCase() === 'name');
            const descKey = keys.find(k => k.toLowerCase() === 'description' || k.toLowerCase() === 'desc');

            return {
              title: String(titleKey ? row[titleKey] : row[keys[0]] || ''),
              description: String(descKey ? row[descKey] : pick('description')),
              category: pick('category') || 'Engineering',
              requirement: pick('requirement'),
              constraints: parseListField(pick('constraints')),
              acceptanceCriteria: parseListField(pick('acceptancecriteria', 'acceptance_criteria')),
              judgingFocus: parseListField(pick('judgingfocus', 'judging_focus')),
              adaptationHint: pick('adaptationhint', 'adaptation_hint'),
              estimatedEffort: pick('estimatedeffort', 'estimated_effort'),
              tags: parseListField(pick('tags')),
              difficulty: 'Hard' as const
            };
          });

          const result = importChallengesCSV(parsedItems);
          setImportResults(result);
          if (fileInputRef.current) fileInputRef.current.value = '';
        } catch {
          setFormError('Failed to parse CSV file content.');
        }
      };
      reader.readAsText(file);
    } catch {
      setFormError('Error loading file.');
    }
  };

  const satisfiesRequirement = challenges.length >= teams.length;
  const hardCount = challenges.filter(c => c.difficulty === 'Hard').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center space-x-2">
            <Flame className="text-brand-cyan-400 w-6 h-6" />
            <span>Challenge Management</span>
          </h2>
          <p className="text-sm text-white/50">HARD engineering constraints loaded onto the assignment wheel. List fields use pipe separators (|).</p>
        </div>

        <div className="flex gap-4">
          <div className="glass-panel px-5 py-3 border border-white/5 bg-dark-900/40 text-center md:text-left">
            <span className="text-[10px] text-white/40 block uppercase tracking-wider">Total Challenges</span>
            <span className="text-lg font-black text-brand-cyan-400">{challenges.length}</span>
          </div>
          <div className="glass-panel px-5 py-3 border border-white/5 bg-dark-900/40 text-center md:text-left">
            <span className="text-[10px] text-white/40 block uppercase tracking-wider">HARD Pool</span>
            <span className="text-lg font-black text-red-400">{hardCount}</span>
          </div>
          <div className="glass-panel px-5 py-3 border border-white/5 bg-dark-900/40 text-center md:text-left">
            <span className="text-[10px] text-white/40 block uppercase tracking-wider">Required Slices</span>
            <span className="text-lg font-black">{teams.length}</span>
          </div>
        </div>
      </div>

      {isEventStarted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl flex items-start space-x-3 text-sm"
        >
          <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Challenge Configuration Locked:</span> The event has already started. Adding, modifying, deleting, or importing challenges is locked to maintain historical and wheel consistency.
          </div>
        </motion.div>
      )}

      {!satisfiesRequirement && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start space-x-3 text-sm"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Action Required:</span> The number of challenges ({challenges.length}) must be greater than or equal to the number of teams ({teams.length}). The **"Start Event"** feature will remain locked until this condition is met. Add more challenges or delete extra teams to resolve this conflict.
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 border border-white/5 space-y-4">
            <h3 className="font-bold tracking-tight text-sm uppercase text-white/70">Create HARD Challenge</h3>

            <form onSubmit={handleAddChallenge} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-white/40 font-bold block uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  placeholder={isEventStarted ? 'Locked' : 'e.g. Conflict Protocol'}
                  disabled={isEventStarted}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-white/40 font-bold block uppercase tracking-wider">Category</label>
                <input
                  type="text"
                  placeholder="Security"
                  disabled={isEventStarted}
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-white/40 font-bold block uppercase tracking-wider">Description</label>
                <textarea
                  placeholder={isEventStarted ? 'Locked' : 'Identify one critical workflow and...'}
                  disabled={isEventStarted}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all h-24 resize-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-white/40 font-bold block uppercase tracking-wider">Requirement</label>
                <textarea
                  disabled={isEventStarted}
                  value={requirement}
                  onChange={e => setRequirement(e.target.value)}
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all h-20 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-white/40 font-bold block uppercase tracking-wider">Acceptance criteria (| separated)</label>
                <textarea
                  disabled={isEventStarted}
                  value={acceptanceText}
                  onChange={e => setAcceptanceText(e.target.value)}
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all h-16 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-white/40 font-bold block uppercase tracking-wider">Judging focus (| separated)</label>
                <input
                  disabled={isEventStarted}
                  value={judgingText}
                  onChange={e => setJudgingText(e.target.value)}
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-white/40 font-bold block uppercase tracking-wider">Adaptation hint</label>
                <textarea
                  disabled={isEventStarted}
                  value={adaptationHint}
                  onChange={e => setAdaptationHint(e.target.value)}
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all h-16 resize-none"
                />
              </div>

              <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Difficulty locked to HARD</p>

              <motion.button
                type="submit"
                disabled={isEventStarted || !title.trim() || !description.trim()}
                whileHover={{ scale: (isEventStarted || !title.trim() || !description.trim()) ? 1 : 1.02 }}
                whileTap={{ scale: (isEventStarted || !title.trim() || !description.trim()) ? 1 : 0.98 }}
                className="w-full bg-gradient-to-r from-brand-cyan-600 to-brand-cyan-500 hover:from-brand-cyan-500 hover:to-brand-cyan-400 disabled:from-dark-800 disabled:to-dark-800 disabled:border-white/5 border border-transparent disabled:text-white/30 disabled:cursor-not-allowed py-3 rounded-xl text-sm font-bold shadow-lg hover:shadow-glow-cyan flex items-center justify-center space-x-2 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Challenge</span>
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

          <div className="glass-panel p-6 border border-white/5 space-y-4">
            <h3 className="font-bold tracking-tight text-sm uppercase text-white/70">CSV Actions</h3>

            <div className="grid grid-cols-1 gap-3">
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
                  <span>Import Challenges CSV</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleExportCSV}
                disabled={challenges.length === 0}
                className="w-full bg-dark-900 border border-white/10 hover:border-brand-purple-500/40 text-white disabled:opacity-50 disabled:hover:border-white/10 disabled:cursor-not-allowed py-3 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 transition-all"
              >
                <Download className="w-4 h-4 text-brand-purple-400" />
                <span>Export Challenges CSV</span>
              </button>
            </div>

            {importResults && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-brand-cyan-500/10 border border-brand-cyan-500/20 text-brand-cyan-400 p-3 rounded-xl text-xs flex items-center space-x-1"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Imported {importResults.count} new challenges.</span>
              </motion.div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass-panel border border-white/5 overflow-hidden h-full flex flex-col min-h-[500px]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-dark-900/10">
              <h3 className="font-bold tracking-tight text-sm uppercase text-white/70">HARD Engineering Slices</h3>
              <span className="text-xs text-white/40 font-mono">Count: {challenges.length} · {categories.length} categories</span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[640px] divide-y divide-white/5">
              {challenges.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[350px] text-white/40 space-y-2">
                  <Flame className="w-12 h-12 text-white/20 stroke-[1.5]" />
                  <span className="text-sm font-semibold">No challenges available</span>
                  <span className="text-xs">Create custom features or import them via CSV.</span>
                </div>
              ) : (
                challenges.map((c, idx) => (
                  <div key={c.id} className="p-5 hover:bg-white/[0.01] transition-colors relative group">
                    {editingId === c.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-4 gap-3">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            className="col-span-2 bg-dark-900 border border-brand-cyan-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                            placeholder="Title"
                          />
                          <input
                            type="text"
                            value={editCategory}
                            onChange={e => setEditCategory(e.target.value)}
                            className="col-span-2 bg-dark-900 border border-brand-cyan-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                            placeholder="Category"
                          />
                        </div>
                        <textarea
                          value={editDescription}
                          onChange={e => setEditDescription(e.target.value)}
                          className="w-full bg-dark-900 border border-brand-cyan-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none h-16 resize-none"
                          placeholder="Description"
                        />
                        <textarea
                          value={editRequirement}
                          onChange={e => setEditRequirement(e.target.value)}
                          className="w-full bg-dark-900 border border-brand-cyan-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none h-14 resize-none"
                          placeholder="Requirement"
                        />
                        <textarea
                          value={editAcceptance}
                          onChange={e => setEditAcceptance(e.target.value)}
                          className="w-full bg-dark-900 border border-brand-cyan-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none h-14 resize-none"
                          placeholder="Acceptance | separated"
                        />
                        <input
                          value={editJudging}
                          onChange={e => setEditJudging(e.target.value)}
                          className="w-full bg-dark-900 border border-brand-cyan-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                          placeholder="Judging focus | separated"
                        />
                        <textarea
                          value={editHint}
                          onChange={e => setEditHint(e.target.value)}
                          className="w-full bg-dark-900 border border-brand-cyan-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none h-14 resize-none"
                          placeholder="Adaptation hint"
                        />
                        <input
                          value={editEffort}
                          onChange={e => setEditEffort(e.target.value)}
                          className="w-full bg-dark-900 border border-brand-cyan-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                          placeholder="Estimated effort"
                        />
                        <input
                          value={editConstraints}
                          onChange={e => setEditConstraints(e.target.value)}
                          className="w-full bg-dark-900 border border-brand-cyan-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                          placeholder="Constraints | separated"
                        />
                        <div className="flex items-center space-x-2 justify-end">
                          <button
                            onClick={() => handleSaveEdit(c.id)}
                            className="text-xs bg-brand-cyan-600 hover:bg-brand-cyan-500 text-white px-3 py-1.5 rounded-lg transition-colors font-semibold"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-xs bg-white/5 hover:bg-white/10 text-white/70 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <button
                          type="button"
                          onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                          className="space-y-1.5 flex-1 text-left"
                        >
                          <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                            <span className="text-xs text-white/30 font-bold">{idx + 1}</span>
                            <h4 className="font-bold text-sm text-white">{c.title}</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                              {c.difficulty}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-purple-500/10 text-brand-purple-300 border border-brand-purple-500/20">
                              {c.category}
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 text-white/30 transition-transform ${expandedId === c.id ? 'rotate-180' : ''}`} />
                          </div>
                          <p className="text-xs text-white/50 leading-relaxed max-w-xl">{c.description}</p>
                          {expandedId === c.id && (
                            <div className="pt-2 space-y-2 text-xs text-white/55">
                              <p><span className="text-white/80 font-semibold">Requirement:</span> {c.requirement}</p>
                              <p><span className="text-white/80 font-semibold">Judges:</span> {c.judgingFocus.join(' · ')}</p>
                              <p><span className="text-white/80 font-semibold">Apply to:</span> {c.adaptationHint}</p>
                            </div>
                          )}
                        </button>

                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStartEdit(c)}
                            disabled={isEventStarted}
                            className="p-1.5 text-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteChallenge(c.id)}
                            disabled={isEventStarted}
                            className="p-1.5 text-white/40 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-500/10 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
