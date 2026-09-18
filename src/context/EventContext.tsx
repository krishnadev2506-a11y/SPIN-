import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  DEFAULT_CHALLENGES,
  CHALLENGE_POOL_VERSION,
  normalizeChallenge,
  parseListField
} from '../data/hardChallenges';
import type { Challenge, ChallengeDifficulty } from '../data/hardChallenges';
import {
  DEFAULT_SITUATION_CHALLENGES,
  SITUATION_POOL_VERSION,
  normalizeSituationChallenge
} from '../data/situationChallenges';
import type { SituationChallenge, SituationDifficulty } from '../data/situationChallenges';

export type { Challenge, ChallengeDifficulty, SituationChallenge, SituationDifficulty };

export interface Team {
  id: string;
  name: string;
  assignedChallengeId?: string;
  assignedAt?: string;
}

export type ChallengeDraft = Partial<Omit<Challenge, 'id' | 'difficulty'>> & {
  title: string;
  difficulty?: ChallengeDifficulty;
};

export interface Assignment {
  id: string;
  teamId: string;
  teamName: string;
  challengeId: string;
  challengeTitle: string;
  timestamp: string;
}

export interface SituationAssignment {
  id: string;
  teamId: string;
  teamName: string;
  situationId: string;
  situationTitle: string;
  timestamp: string;
}

interface EventContextProps {
  teams: Team[];
  challenges: Challenge[];
  assignments: Assignment[];
  situationChallenges: SituationChallenge[];
  situationAssignments: SituationAssignment[];
  currentTeamId: string;
  isEventStarted: boolean;
  canStartEvent: boolean;
  addTeam: (name: string) => { success: boolean; error?: string };
  editTeam: (id: string, name: string) => { success: boolean; error?: string };
  deleteTeam: (id: string) => void;
  importTeamsCSV: (names: string[]) => { success: boolean; count: number; duplicates: string[] };
  addChallenge: (draft: ChallengeDraft) => { success: boolean; error?: string };
  editChallenge: (id: string, draft: ChallengeDraft) => { success: boolean; error?: string };
  deleteChallenge: (id: string) => void;
  importChallengesCSV: (items: Partial<Challenge>[]) => { success: boolean; count: number };
  setCurrentTeamId: (id: string) => void;
  assignChallenge: (teamId: string, challengeId: string) => void;
  undoLastAssignment: () => void;
  resetEntireEvent: () => void;
  assignSituation: (teamId: string, situationId: string) => void;
  undoLastSituationAssignment: () => void;
}

const CHALLENGE_VERSION_KEY = 'fhc_challenges_version';
const SITUATION_VERSION_KEY = 'fhc_situations_version';

const PRELOADED_TEAM_NAMES = [
  'Sync6', 'Nissaramm', 'Pentabyte', 'Xeva', 'Decoders', 'Iron Titans', 'Breaking Bytes',
  'Storm Breakers', 'Command Line Crew', 'HEXAHACK', 'Tech Divas', 'French toast',
  'VIBE CODERS', 'Nexus', 'CoffeePowder', 'Kernel', 'Runtime terrors', 'Code Blooded',
  'Nexora', 'Incubug', 'Bay Route', 'Syntax_six', 'R00T', 'Codzilla', 'Altf4',
  'SQUAREONE', '4 Real', 'Hackmates', 'MonoChrome', 'Cyber Nexus', 'Adhil and Co', 'Carbon'
];

function readJson<T>(key: string, fallback: T): T {
  const saved = localStorage.getItem(key);
  if (!saved) return fallback;
  try {
    return JSON.parse(saved) as T;
  } catch {
    return fallback;
  }
}

function loadTeams(): Team[] {
  const saved = readJson<Team[]>('fhc_teams', []);
  const existing = new Set(saved.map(team => team.name.trim().toLowerCase()));
  const additions = PRELOADED_TEAM_NAMES
    .filter(name => !existing.has(name.toLowerCase()))
    .map(name => ({ id: crypto.randomUUID(), name }));
  return [...saved, ...additions].slice(0, 36);
}

function loadChallenges(): Challenge[] {
  const assignments = readJson<Assignment[]>('fhc_assignments', []);
  const eventInProgress = assignments.length > 0;
  const savedVersion = localStorage.getItem(CHALLENGE_VERSION_KEY);
  const savedChallenges = localStorage.getItem('fhc_challenges');

  if (savedVersion !== CHALLENGE_POOL_VERSION && !eventInProgress) {
    localStorage.setItem(CHALLENGE_VERSION_KEY, CHALLENGE_POOL_VERSION);
    localStorage.setItem('fhc_challenges', JSON.stringify(DEFAULT_CHALLENGES));
    return DEFAULT_CHALLENGES;
  }

  if (!savedChallenges) {
    localStorage.setItem(CHALLENGE_VERSION_KEY, CHALLENGE_POOL_VERSION);
    return DEFAULT_CHALLENGES;
  }

  try {
    const parsed = JSON.parse(savedChallenges) as Partial<Challenge>[];
    return parsed.map(normalizeChallenge);
  } catch {
    return DEFAULT_CHALLENGES;
  }
}

function loadSituationChallenges(): SituationChallenge[] {
  const situationAssignments = readJson<SituationAssignment[]>('fhc_situation_assignments', []);
  const eventInProgress = situationAssignments.length > 0;
  const savedVersion = localStorage.getItem(SITUATION_VERSION_KEY);
  const savedSituations = localStorage.getItem('fhc_situations');

  if (savedVersion !== SITUATION_POOL_VERSION && !eventInProgress) {
    localStorage.setItem(SITUATION_VERSION_KEY, SITUATION_POOL_VERSION);
    localStorage.setItem('fhc_situations', JSON.stringify(DEFAULT_SITUATION_CHALLENGES));
    return DEFAULT_SITUATION_CHALLENGES;
  }

  if (!savedSituations) {
    localStorage.setItem(SITUATION_VERSION_KEY, SITUATION_POOL_VERSION);
    return DEFAULT_SITUATION_CHALLENGES;
  }

  try {
    const parsed = JSON.parse(savedSituations) as Partial<SituationChallenge>[];
    return parsed.map(normalizeSituationChallenge);
  } catch {
    return DEFAULT_SITUATION_CHALLENGES;
  }
}

const EventContext = createContext<EventContextProps | undefined>(undefined);

export const EventProvider = ({ children }: { children: ReactNode }) => {
  const [teams, setTeams] = useState<Team[]>(() => loadTeams());
  const [challenges, setChallenges] = useState<Challenge[]>(() => loadChallenges());
  const [assignments, setAssignments] = useState<Assignment[]>(() => readJson<Assignment[]>('fhc_assignments', []));
  const [situationChallenges, setSituationChallenges] = useState<SituationChallenge[]>(() => loadSituationChallenges());
  const [situationAssignments, setSituationAssignments] = useState<SituationAssignment[]>(() => readJson<SituationAssignment[]>('fhc_situation_assignments', []));
  const [currentTeamId, setCurrentTeamId] = useState<string>(() => localStorage.getItem('fhc_current_team_id') || '');

  useEffect(() => {
    localStorage.setItem('fhc_teams', JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    localStorage.setItem('fhc_challenges', JSON.stringify(challenges));
    localStorage.setItem(CHALLENGE_VERSION_KEY, CHALLENGE_POOL_VERSION);
  }, [challenges]);

  useEffect(() => {
    localStorage.setItem('fhc_assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('fhc_situations', JSON.stringify(situationChallenges));
    localStorage.setItem(SITUATION_VERSION_KEY, SITUATION_POOL_VERSION);
  }, [situationChallenges]);

  useEffect(() => {
    localStorage.setItem('fhc_situation_assignments', JSON.stringify(situationAssignments));
  }, [situationAssignments]);

  useEffect(() => {
    localStorage.setItem('fhc_current_team_id', currentTeamId);
  }, [currentTeamId]);

  const isEventStarted = assignments.length > 0;
  const canStartEvent = teams.length > 0 && challenges.length >= teams.length;

  useEffect(() => {
    if (teams.length > 0 && (!currentTeamId || !teams.some(t => t.id === currentTeamId))) {
      const nextUnassigned = teams.find(t => !t.assignedChallengeId);
      if (nextUnassigned) {
        setCurrentTeamId(nextUnassigned.id);
      }
    }
  }, [teams, currentTeamId]);

  const addTeam = (name: string): { success: boolean; error?: string } => {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: 'Team name cannot be empty.' };
    if (teams.length >= 36) return { success: false, error: 'Maximum limit of 36 teams reached.' };
    if (teams.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) {
      return { success: false, error: 'Team name must be unique.' };
    }

    const newTeam: Team = {
      id: crypto.randomUUID(),
      name: trimmed
    };
    setTeams(prev => [...prev, newTeam]);
    return { success: true };
  };

  const editTeam = (id: string, name: string): { success: boolean; error?: string } => {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: 'Team name cannot be empty.' };
    if (teams.some(t => t.id !== id && t.name.toLowerCase() === trimmed.toLowerCase())) {
      return { success: false, error: 'Team name must be unique.' };
    }

    setTeams(prev => prev.map(t => t.id === id ? { ...t, name: trimmed } : t));
    return { success: true };
  };

  const deleteTeam = (id: string) => {
    setTeams(prev => prev.filter(t => t.id !== id));
    if (currentTeamId === id) {
      setCurrentTeamId('');
    }
  };

  const importTeamsCSV = (names: string[]): { success: boolean; count: number; duplicates: string[] } => {
    let addedCount = 0;
    const duplicates: string[] = [];
    const updatedTeams = [...teams];

    names.forEach(name => {
      const trimmed = name.trim();
      if (!trimmed) return;
      if (updatedTeams.length >= 36) return;
      if (updatedTeams.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) {
        duplicates.push(trimmed);
        return;
      }
      updatedTeams.push({
        id: crypto.randomUUID(),
        name: trimmed
      });
      addedCount++;
    });

    setTeams(updatedTeams);
    return { success: true, count: addedCount, duplicates };
  };

  const addChallenge = (draft: ChallengeDraft): { success: boolean; error?: string } => {
    if (isEventStarted) return { success: false, error: 'Event has started. Adding challenges is locked.' };
    const trimmedTitle = draft.title.trim();
    if (!trimmedTitle) return { success: false, error: 'Challenge title cannot be empty.' };
    if (challenges.some(c => c.title.toLowerCase() === trimmedTitle.toLowerCase())) {
      return { success: false, error: 'Challenge title must be unique.' };
    }

    const newChallenge = normalizeChallenge({
      ...draft,
      id: crypto.randomUUID(),
      title: trimmedTitle,
      difficulty: 'Hard'
    });
    setChallenges(prev => [...prev, newChallenge]);
    return { success: true };
  };

  const editChallenge = (id: string, draft: ChallengeDraft): { success: boolean; error?: string } => {
    if (isEventStarted) return { success: false, error: 'Event has started. Editing challenges is locked.' };
    const trimmedTitle = draft.title.trim();
    if (!trimmedTitle) return { success: false, error: 'Challenge title cannot be empty.' };
    if (challenges.some(c => c.id !== id && c.title.toLowerCase() === trimmedTitle.toLowerCase())) {
      return { success: false, error: 'Challenge title must be unique.' };
    }

    setChallenges(prev => prev.map(c => c.id === id
      ? normalizeChallenge({ ...c, ...draft, id, title: trimmedTitle, difficulty: 'Hard' })
      : c));
    return { success: true };
  };

  const deleteChallenge = (id: string) => {
    if (isEventStarted) return;
    setChallenges(prev => prev.filter(c => c.id !== id));
  };

  const importChallengesCSV = (items: Partial<Challenge>[]): { success: boolean; count: number } => {
    if (isEventStarted) return { success: false, count: 0 };
    let addedCount = 0;
    const updatedChallenges = [...challenges];

    items.forEach(item => {
      const trimmedTitle = (item.title || '').trim();
      if (!trimmedTitle) return;
      if (updatedChallenges.some(c => c.title.toLowerCase() === trimmedTitle.toLowerCase())) return;

      updatedChallenges.push(normalizeChallenge({
        ...item,
        id: crypto.randomUUID(),
        title: trimmedTitle,
        constraints: item.constraints ?? parseListField(item.constraints),
        acceptanceCriteria: item.acceptanceCriteria ?? parseListField(item.acceptanceCriteria),
        judgingFocus: item.judgingFocus ?? parseListField(item.judgingFocus),
        tags: item.tags ?? parseListField(item.tags),
        difficulty: 'Hard'
      }));
      addedCount++;
    });

    setChallenges(updatedChallenges);
    return { success: true, count: addedCount };
  };

  const assignChallenge = (teamId: string, challengeId: string) => {
    const team = teams.find(t => t.id === teamId);
    const challenge = challenges.find(c => c.id === challengeId);
    if (!team || !challenge || assignments.some(a => a.teamId === teamId && a.challengeTitle === challenge.title)) return;

    const timestamp = new Date().toISOString();

    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, assignedChallengeId: challengeId, assignedAt: timestamp } : t));

    const newAssignment: Assignment = {
      id: crypto.randomUUID(),
      teamId,
      teamName: team.name,
      challengeId,
      challengeTitle: challenge.title,
      timestamp
    };

    setAssignments(prev => [newAssignment, ...prev]);

    const remainingTeams = teams.filter(t => t.id !== teamId && !t.assignedChallengeId);
    if (remainingTeams.length > 0) {
      setCurrentTeamId(remainingTeams[0].id);
    } else {
      setCurrentTeamId('');
    }
  };

  const undoLastAssignment = () => {
    if (assignments.length === 0) return;
    const [lastAssignment, ...remainingAssignments] = assignments;

    setTeams(prev => prev.map(t => t.id === lastAssignment.teamId ? { ...t, assignedChallengeId: undefined, assignedAt: undefined } : t));
    setAssignments(remainingAssignments);
    setCurrentTeamId(lastAssignment.teamId);
  };

  const resetEntireEvent = () => {
    setTeams(loadTeams());
    setChallenges(DEFAULT_CHALLENGES);
    setAssignments([]);
    setSituationChallenges(DEFAULT_SITUATION_CHALLENGES);
    setSituationAssignments([]);
    setCurrentTeamId('');
    localStorage.removeItem('fhc_teams');
    localStorage.setItem('fhc_challenges', JSON.stringify(DEFAULT_CHALLENGES));
    localStorage.setItem(CHALLENGE_VERSION_KEY, CHALLENGE_POOL_VERSION);
    localStorage.removeItem('fhc_assignments');
    localStorage.setItem('fhc_situations', JSON.stringify(DEFAULT_SITUATION_CHALLENGES));
    localStorage.setItem(SITUATION_VERSION_KEY, SITUATION_POOL_VERSION);
    localStorage.removeItem('fhc_situation_assignments');
    localStorage.removeItem('fhc_current_team_id');
  };

  const assignSituation = (teamId: string, situationId: string) => {
    const team = teams.find(t => t.id === teamId);
    const situation = situationChallenges.find(s => s.id === situationId);
    if (!team || !situation || situationAssignments.some(a => a.teamId === teamId && a.situationTitle === situation.title)) return;

    const timestamp = new Date().toISOString();

    const newAssignment: SituationAssignment = {
      id: crypto.randomUUID(),
      teamId,
      teamName: team.name,
      situationId,
      situationTitle: situation.title,
      timestamp
    };

    setSituationAssignments(prev => [newAssignment, ...prev]);
  };

  const undoLastSituationAssignment = () => {
    if (situationAssignments.length === 0) return;
    const [, ...remainingAssignments] = situationAssignments;
    setSituationAssignments(remainingAssignments);
  };

  return (
    <EventContext.Provider value={{
      teams,
      challenges,
      assignments,
      situationChallenges,
      situationAssignments,
      currentTeamId,
      isEventStarted,
      canStartEvent,
      addTeam,
      editTeam,
      deleteTeam,
      importTeamsCSV,
      addChallenge,
      editChallenge,
      deleteChallenge,
      importChallengesCSV,
      setCurrentTeamId,
      assignChallenge,
      undoLastAssignment,
      resetEntireEvent,
      assignSituation,
      undoLastSituationAssignment
    }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
};
