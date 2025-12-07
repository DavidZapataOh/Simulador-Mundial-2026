/**
 * Zustand Store for Simulation Draft
 * 
 * Uses centralized team resolution via buildPlayoffMapping
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  TeamId,
  GroupId,
  GroupPrediction,
  KnockoutMatchPrediction,
  PlayoffSelection,
  PlayoffMapping,
  PLAYOFF_PATHS,
  TEAMS_REGISTRY,
  buildPlayoffMapping,
  resolveTeamId,
  getResolvedTeam,
} from '@/lib/worldcup2026';
import {
  initializeGroupPredictions,
  initializeKnockoutPredictions,
  updateKnockoutPredictions,
  reconcileKnockoutPredictions,
  reconcileThirdPlaceTeams,
  getChampion,
} from '@/lib/bracket';

export type WizardStep = 0 | 1 | 2 | 3;

export interface SimulationDraftState {
  step: WizardStep;
  playoffSelections: PlayoffSelection[];
  groupPredictions: GroupPrediction[];
  advancingThirdPlaceTeams: TeamId[];
  knockoutPredictions: KnockoutMatchPrediction[];
  
  // Actions
  setStep: (step: WizardStep) => void;
  setPlayoffWinner: (playoffId: string, selectedTeamId: TeamId) => void;
  setGroupPrediction: (groupId: GroupId, orderedTeamIds: TeamId[]) => void;
  setAdvancingThirdPlaceTeams: (teamIds: TeamId[]) => void;
  toggleThirdPlaceTeam: (teamId: TeamId) => void;
  setKnockoutMatchWinner: (matchId: string, winnerTeamId: TeamId) => void;
  initializeKnockout: () => void;
  reset: () => void;
  
  // Computed helpers
  isStep0Complete: () => boolean;
  isStep1Complete: () => boolean;
  isStep2Complete: () => boolean;
  isStep3Complete: () => boolean;
  getChampionTeamId: () => TeamId | null;
  
  // Team resolution - THE KEY FUNCTIONS
  getPlayoffMapping: () => PlayoffMapping;
  getTeamDisplayName: (teamId: TeamId) => string;
  getTeamShortName: (teamId: TeamId) => string;
  getTeamFlagCode: (teamId: TeamId) => string;
}

function initializePlayoffSelections(): PlayoffSelection[] {
  return PLAYOFF_PATHS.map(path => ({
    playoffId: path.id,
    selectedTeamId: path.candidateIds[0], // Default to first candidate
  }));
}

const initialState = {
  step: 0 as WizardStep,
  playoffSelections: initializePlayoffSelections(),
  groupPredictions: initializeGroupPredictions(),
  advancingThirdPlaceTeams: [] as TeamId[],
  knockoutPredictions: [] as KnockoutMatchPrediction[],
};

export const useSimulationDraftStore = create<SimulationDraftState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setStep: (step: WizardStep) => {
        const state = get();
        
        if (step === 2) {
          const reconciled = reconcileThirdPlaceTeams(
            state.advancingThirdPlaceTeams,
            state.groupPredictions
          );
          set({ step, advancingThirdPlaceTeams: reconciled });
        } else if (step === 3) {
          const reconciledThird = reconcileThirdPlaceTeams(
            state.advancingThirdPlaceTeams,
            state.groupPredictions
          );
          
          if (reconciledThird.length === 8) {
            if (state.knockoutPredictions.length > 0) {
              const reconciledKnockout = reconcileKnockoutPredictions(
                state.knockoutPredictions,
                state.groupPredictions,
                reconciledThird
              );
              set({ step, advancingThirdPlaceTeams: reconciledThird, knockoutPredictions: reconciledKnockout });
            } else {
              const predictions = initializeKnockoutPredictions(
                state.groupPredictions,
                reconciledThird
              );
              set({ step, advancingThirdPlaceTeams: reconciledThird, knockoutPredictions: predictions });
            }
          } else {
            set({ step, advancingThirdPlaceTeams: reconciledThird });
          }
        } else {
          set({ step });
        }
      },
      
      setPlayoffWinner: (playoffId: string, selectedTeamId: TeamId) => {
        set((state) => ({
          playoffSelections: state.playoffSelections.map((ps) =>
            ps.playoffId === playoffId ? { ...ps, selectedTeamId } : ps
          ),
        }));
      },
      
      setGroupPrediction: (groupId: GroupId, orderedTeamIds: TeamId[]) => {
        set((state) => ({
          groupPredictions: state.groupPredictions.map((gp) =>
            gp.groupId === groupId ? { ...gp, orderedTeamIds } : gp
          ),
        }));
      },
      
      setAdvancingThirdPlaceTeams: (teamIds: TeamId[]) => {
        set({ advancingThirdPlaceTeams: teamIds });
      },
      
      toggleThirdPlaceTeam: (teamId: TeamId) => {
        set((state) => {
          const current = state.advancingThirdPlaceTeams;
          if (current.includes(teamId)) {
            return { advancingThirdPlaceTeams: current.filter((id) => id !== teamId) };
          }
          if (current.length < 8) {
            return { advancingThirdPlaceTeams: [...current, teamId] };
          }
          return state;
        });
      },
      
      setKnockoutMatchWinner: (matchId: string, winnerTeamId: TeamId) => {
        const state = get();
        const updatedPredictions = updateKnockoutPredictions(
          state.knockoutPredictions,
          matchId,
          winnerTeamId,
          state.groupPredictions,
          state.advancingThirdPlaceTeams
        );
        set({ knockoutPredictions: updatedPredictions });
      },
      
      initializeKnockout: () => {
        const state = get();
        const predictions = initializeKnockoutPredictions(
          state.groupPredictions,
          state.advancingThirdPlaceTeams
        );
        set({ knockoutPredictions: predictions });
      },
      
      reset: () => set({
        ...initialState,
        playoffSelections: initializePlayoffSelections(),
        groupPredictions: initializeGroupPredictions(),
      }),
      
      isStep0Complete: () => {
        const state = get();
        return state.playoffSelections.length === PLAYOFF_PATHS.length &&
          state.playoffSelections.every(ps => ps.selectedTeamId);
      },
      
      isStep1Complete: () => {
        const state = get();
        return state.groupPredictions.every((gp) => gp.orderedTeamIds.length === 4);
      },
      
      isStep2Complete: () => {
        const state = get();
        return state.advancingThirdPlaceTeams.length === 8;
      },
      
      isStep3Complete: () => {
        const state = get();
        return (
          state.knockoutPredictions.length === 32 &&
          state.knockoutPredictions.every((p) => p.winnerTeamId !== '')
        );
      },
      
      getChampionTeamId: () => {
        const state = get();
        return getChampion(state.knockoutPredictions);
      },
      
      // Build the playoff mapping from current selections
      getPlayoffMapping: () => {
        const state = get();
        return buildPlayoffMapping(state.playoffSelections);
      },
      
      // Resolve team and get display name
      getTeamDisplayName: (teamId: TeamId) => {
        const state = get();
        const mapping = buildPlayoffMapping(state.playoffSelections);
        const team = getResolvedTeam(teamId, mapping);
        return team?.name || teamId;
      },
      
      // Resolve team and get short name
      getTeamShortName: (teamId: TeamId) => {
        const state = get();
        const mapping = buildPlayoffMapping(state.playoffSelections);
        const team = getResolvedTeam(teamId, mapping);
        return team?.shortName || teamId;
      },
      
      // Resolve team and get flag code
      getTeamFlagCode: (teamId: TeamId) => {
        const state = get();
        const mapping = buildPlayoffMapping(state.playoffSelections);
        const team = getResolvedTeam(teamId, mapping);
        return team?.flagCode || 'UN';
      },
    }),
    {
      name: 'mundial26-simulation-draft-v5',
    }
  )
);
