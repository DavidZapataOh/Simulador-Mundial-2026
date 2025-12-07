/**
 * Bracket Calculation Utilities
 * 
 * Handles the logic for:
 * - Resolving group positions into knockout bracket teams
 * - Assigning third-place teams to bracket slots using FIFA Annex C matrix
 * - Propagating winners through knockout stages
 * - Reconciling state when groups/third-place selections change
 */

import {
  TeamId,
  GroupId,
  GroupPrediction,
  KnockoutMatchPrediction,
  KnockoutMatchSlot,
  BracketSource,
  KNOCKOUT_SLOTS,
  GROUPS,
  GROUP_IDS,
} from './worldcup2026';

import {
  GroupLetter,
  ThirdPlaceAssignments,
  findThirdPlaceOption,
} from '@/src/data/thirdPlaceMatrix';

// ============================================================================
// Group Results Interface
// ============================================================================

export interface GroupResults {
  winners: Map<GroupId, TeamId>;      // 1st place from each group
  runnersUp: Map<GroupId, TeamId>;    // 2nd place from each group
  thirdPlace: Map<GroupId, TeamId>;   // 3rd place from each group
}

/**
 * Extract group positions from user predictions
 */
export function extractGroupResults(predictions: GroupPrediction[]): GroupResults {
  const winners = new Map<GroupId, TeamId>();
  const runnersUp = new Map<GroupId, TeamId>();
  const thirdPlace = new Map<GroupId, TeamId>();

  for (const prediction of predictions) {
    if (prediction.orderedTeamIds.length >= 3) {
      winners.set(prediction.groupId, prediction.orderedTeamIds[0]);
      runnersUp.set(prediction.groupId, prediction.orderedTeamIds[1]);
      thirdPlace.set(prediction.groupId, prediction.orderedTeamIds[2]);
    }
  }

  return { winners, runnersUp, thirdPlace };
}

/**
 * Get all current third-place teams from group predictions
 */
export function getCurrentThirdPlaceTeams(predictions: GroupPrediction[]): TeamId[] {
  return predictions
    .filter(p => p.orderedTeamIds.length >= 3)
    .map(p => p.orderedTeamIds[2]);
}

/**
 * Reconcile advancing third-place teams:
 * Remove any teams that are no longer in 3rd place in their groups
 */
export function reconcileThirdPlaceTeams(
  currentAdvancing: TeamId[],
  groupPredictions: GroupPrediction[]
): TeamId[] {
  const validThirdPlaceTeams = getCurrentThirdPlaceTeams(groupPredictions);
  return currentAdvancing.filter(teamId => validThirdPlaceTeams.includes(teamId));
}

// ============================================================================
// Third Place Assignment (FIFA Annex C Matrix)
// ============================================================================

/**
 * Get which groups have their 3rd-place teams advancing
 */
export function getAdvancingThirdPlaceGroups(
  advancingThirdPlaceTeams: TeamId[],
  thirdPlaceByGroup: Map<GroupId, TeamId>
): GroupLetter[] {
  const groups: GroupLetter[] = [];
  
  for (const groupId of GROUP_IDS) {
    const thirdPlaceTeam = thirdPlaceByGroup.get(groupId);
    if (thirdPlaceTeam && advancingThirdPlaceTeams.includes(thirdPlaceTeam)) {
      groups.push(groupId as GroupLetter);
    }
  }
  
  return groups;
}

/**
 * Get the third-place assignments from FIFA Annex C matrix.
 * Returns null if not exactly 8 groups are advancing.
 */
export function getThirdPlaceAssignments(
  advancingThirdPlaceGroups: GroupLetter[]
): ThirdPlaceAssignments | null {
  if (advancingThirdPlaceGroups.length !== 8) {
    return null;
  }
  
  const option = findThirdPlaceOption(advancingThirdPlaceGroups);
  return option?.assignments || null;
}

/**
 * Resolve third-place team based on FIFA matrix.
 * 
 * @param firstPlaceKey - The first place key (e.g., '1A', '1B', '1D', '1E', '1G', '1I', '1K', '1L')
 * @param assignments - The third-place assignments from the FIFA matrix
 * @param thirdPlaceByGroup - Map of group ID to third-place team
 */
function resolveThirdPlaceTeamFromMatrix(
  firstPlaceKey: keyof ThirdPlaceAssignments,
  assignments: ThirdPlaceAssignments | null,
  thirdPlaceByGroup: Map<GroupId, TeamId>
): TeamId | null {
  if (!assignments) return null;
  
  const thirdPlaceId = assignments[firstPlaceKey]; // e.g., "3E"
  const groupLetter = thirdPlaceId.charAt(1) as GroupLetter; // e.g., "E"
  
  return thirdPlaceByGroup.get(groupLetter as GroupId) || null;
}

// ============================================================================
// Bracket Team Resolution
// ============================================================================

export interface BracketContext {
  groupResults: GroupResults;
  advancingThirdPlaceGroups: GroupLetter[];
  thirdPlaceAssignments: ThirdPlaceAssignments | null;
  knockoutPredictions: Map<string, KnockoutMatchPrediction>;
}

/**
 * Resolve a bracket source to the actual team ID
 */
export function resolveTeamFromSource(
  source: BracketSource,
  context: BracketContext
): TeamId | null {
  switch (source.type) {
    case 'groupWinner':
      return context.groupResults.winners.get(source.groupId) || null;
    
    case 'groupRunnerUp':
      return context.groupResults.runnersUp.get(source.groupId) || null;
    
    case 'thirdPlace': {
      // The first-place key is determined by the home team of the match
      // We need to identify which 1st place this third-place slot is paired with
      // The source.possibleGroups is legacy - we use the context.thirdPlaceAssignments instead
      // But we need to know which first-place winner this match is for
      // This is determined by the match's homeSource which should be a groupWinner
      // For now, use the first-place key from possibleGroups[0] as a fallback identifier
      // The proper way is to track the first-place key in the source itself
      
      // Try to determine the first-place key from possibleGroups pattern
      // Based on FIFA structure, we can map possibleGroups to first-place keys:
      const firstPlaceKey = getFirstPlaceKeyForThirdPlace(source.possibleGroups);
      if (!firstPlaceKey) return null;
      
      return resolveThirdPlaceTeamFromMatrix(
        firstPlaceKey,
        context.thirdPlaceAssignments,
        context.groupResults.thirdPlace
      );
    }
    
    case 'winnerOf': {
      const match = context.knockoutPredictions.get(source.matchId);
      return match?.winnerTeamId || null;
    }
    
    case 'loserOf': {
      const match = context.knockoutPredictions.get(source.matchId);
      if (!match?.winnerTeamId) return null;
      // Return the non-winner team
      return match.homeTeamId === match.winnerTeamId 
        ? match.awayTeamId 
        : match.homeTeamId;
    }
    
    default:
      return null;
  }
}

/**
 * Get both teams for a knockout match
 */
export function getMatchTeams(
  matchSlot: KnockoutMatchSlot,
  context: BracketContext
): { homeTeamId: TeamId | null; awayTeamId: TeamId | null } {
  return {
    homeTeamId: resolveTeamFromSource(matchSlot.homeSource, context),
    awayTeamId: resolveTeamFromSource(matchSlot.awaySource, context),
  };
}

/**
 * Map from match home source (first-place winner group) to first-place assignment key.
 * This maps which 1st-place winners face 3rd-place teams per FIFA bracket.
 */
const FIRST_PLACE_TO_ASSIGNMENT_KEY: Record<GroupId, keyof ThirdPlaceAssignments | null> = {
  'A': '1A',
  'B': '1B',
  'C': null,  // 1C faces 2nd place, not 3rd
  'D': '1D',
  'E': '1E',
  'F': null,  // 1F faces 2nd place, not 3rd
  'G': '1G',
  'H': null,  // 1H faces 2nd place, not 3rd
  'I': '1I',
  'J': null,  // 1J faces 2nd place, not 3rd
  'K': '1K',
  'L': '1L',
};

/**
 * Determine the first-place key from the possibleGroups pattern.
 * This is a temporary solution - ideally the source would include the first-place key directly.
 */
function getFirstPlaceKeyForThirdPlace(possibleGroups: GroupId[]): keyof ThirdPlaceAssignments | null {
  // The possibleGroups arrays are defined per match. We need to map them to the correct 1st place key.
  // This is derived from which 1st-place team the match's home source is.
  // Since we don't have direct access to the match here, we use a heuristic based on possibleGroups patterns.
  
  // Based on worldcup2026.ts definitions:
  // M74: 1E vs 3? (possibleGroups: ['A', 'B', 'C', 'D', 'F'])
  // M77: 1I vs 3? (possibleGroups: ['C', 'D', 'F', 'G', 'H'])
  // M79: 1A vs 3? (possibleGroups: ['C', 'E', 'F', 'H', 'I'])
  // M80: 1L vs 3? (possibleGroups: ['E', 'H', 'I', 'J', 'K'])
  // M81: 1D vs 3? (possibleGroups: ['B', 'E', 'F', 'I', 'J'])
  // M82: 1G vs 3? (possibleGroups: ['A', 'E', 'H', 'I', 'J'])
  // M85: 1B vs 3? (possibleGroups: ['E', 'F', 'G', 'I', 'J'])
  // M87: 1K vs 3? (possibleGroups: ['D', 'E', 'I', 'J', 'L'])
  
  const pgStr = possibleGroups.slice().sort().join('');
  
  const mapping: Record<string, keyof ThirdPlaceAssignments> = {
    'ABCDF': '1E',
    'CDFGH': '1I',
    'CEFHI': '1A',
    'EHIJK': '1L',
    'BEFIJ': '1D',
    'AEHIJ': '1G',
    'EFGIJ': '1B',
    'DEIJL': '1K',
  };
  
  return mapping[pgStr] || null;
}

/**
 * Build bracket context from state
 */
export function buildBracketContext(
  groupPredictions: GroupPrediction[],
  advancingThirdPlaceTeams: TeamId[],
  knockoutPredictions: KnockoutMatchPrediction[]
): BracketContext {
  const groupResults = extractGroupResults(groupPredictions);
  const advancingThirdPlaceGroups = getAdvancingThirdPlaceGroups(
    advancingThirdPlaceTeams,
    groupResults.thirdPlace
  );
  
  // Get the official FIFA third-place assignments based on which 8 groups advance
  const thirdPlaceAssignments = getThirdPlaceAssignments(advancingThirdPlaceGroups);
  
  const predictionsMap = new Map<string, KnockoutMatchPrediction>();
  for (const pred of knockoutPredictions) {
    predictionsMap.set(pred.matchId, pred);
  }
  
  return { 
    groupResults, 
    advancingThirdPlaceGroups, 
    thirdPlaceAssignments,
    knockoutPredictions: predictionsMap 
  };
}

// ============================================================================
// Bracket State Management
// ============================================================================

/**
 * Create initial knockout predictions based on group results and third-place selection
 */
export function initializeKnockoutPredictions(
  groupPredictions: GroupPrediction[],
  advancingThirdPlaceTeams: TeamId[]
): KnockoutMatchPrediction[] {
  const context = buildBracketContext(groupPredictions, advancingThirdPlaceTeams, []);
  const predictions: KnockoutMatchPrediction[] = [];
  
  // Initialize Round of 32 matches (they have known teams from groups)
  const r32Matches = KNOCKOUT_SLOTS.filter(slot => slot.stage === 'roundOf32');
  
  for (const matchSlot of r32Matches) {
    const { homeTeamId, awayTeamId } = getMatchTeams(matchSlot, context);
    
    predictions.push({
      matchId: matchSlot.id,
      homeTeamId: homeTeamId || '',
      awayTeamId: awayTeamId || '',
      winnerTeamId: '', // Not selected yet
    });
  }
  
  return predictions;
}

/**
 * Update knockout predictions after a winner is selected
 * Propagates the result to subsequent matches
 */
export function updateKnockoutPredictions(
  currentPredictions: KnockoutMatchPrediction[],
  matchId: string,
  winnerTeamId: TeamId,
  groupPredictions: GroupPrediction[],
  advancingThirdPlaceTeams: TeamId[]
): KnockoutMatchPrediction[] {
  // Create map of current predictions
  const predictionsMap = new Map<string, KnockoutMatchPrediction>();
  for (const pred of currentPredictions) {
    predictionsMap.set(pred.matchId, { ...pred });
  }
  
  // Update the selected match
  const currentMatch = predictionsMap.get(matchId);
  if (currentMatch) {
    currentMatch.winnerTeamId = winnerTeamId;
    predictionsMap.set(matchId, currentMatch);
  }
  
  // Build context with updated predictions
  const context = buildBracketContext(
    groupPredictions, 
    advancingThirdPlaceTeams, 
    Array.from(predictionsMap.values())
  );
  
  // Find and update/create subsequent matches that depend on this result
  const matchesToProcess = getMatchesDependingOn(matchId);
  
  for (const matchSlot of matchesToProcess) {
    const { homeTeamId, awayTeamId } = getMatchTeams(matchSlot, context);
    const existingPred = predictionsMap.get(matchSlot.id);
    
    if (homeTeamId && awayTeamId) {
      // Check if teams have changed
      if (existingPred?.homeTeamId !== homeTeamId || existingPred?.awayTeamId !== awayTeamId) {
        // Reset winner if teams changed
        predictionsMap.set(matchSlot.id, {
          matchId: matchSlot.id,
          homeTeamId,
          awayTeamId,
          winnerTeamId: '',
        });
        // Need to also cascade reset downstream matches
        const downstreamMatches = getMatchesDependingOn(matchSlot.id);
        for (const downstream of downstreamMatches) {
          predictionsMap.delete(downstream.id);
        }
      } else if (!existingPred) {
        // Create new prediction
        predictionsMap.set(matchSlot.id, {
          matchId: matchSlot.id,
          homeTeamId,
          awayTeamId,
          winnerTeamId: '',
        });
      }
    }
  }
  
  return Array.from(predictionsMap.values());
}

/**
 * Get all matches that depend on a given match (directly or indirectly)
 */
function getMatchesDependingOn(matchId: string): KnockoutMatchSlot[] {
  const dependentMatches: KnockoutMatchSlot[] = [];
  const toCheck = [matchId];
  const checked = new Set<string>();
  
  while (toCheck.length > 0) {
    const currentMatchId = toCheck.pop()!;
    if (checked.has(currentMatchId)) continue;
    checked.add(currentMatchId);
    
    for (const matchSlot of KNOCKOUT_SLOTS) {
      const dependsOn = 
        (matchSlot.homeSource.type === 'winnerOf' && matchSlot.homeSource.matchId === currentMatchId) ||
        (matchSlot.awaySource.type === 'winnerOf' && matchSlot.awaySource.matchId === currentMatchId) ||
        (matchSlot.homeSource.type === 'loserOf' && matchSlot.homeSource.matchId === currentMatchId) ||
        (matchSlot.awaySource.type === 'loserOf' && matchSlot.awaySource.matchId === currentMatchId);
      
      if (dependsOn && !checked.has(matchSlot.id)) {
        dependentMatches.push(matchSlot);
        toCheck.push(matchSlot.id);
      }
    }
  }
  
  return dependentMatches;
}

/**
 * Reconcile knockout predictions when groups or third-place teams change
 * Recomputes R32 and resets invalid downstream predictions
 */
export function reconcileKnockoutPredictions(
  currentPredictions: KnockoutMatchPrediction[],
  groupPredictions: GroupPrediction[],
  advancingThirdPlaceTeams: TeamId[]
): KnockoutMatchPrediction[] {
  const context = buildBracketContext(groupPredictions, advancingThirdPlaceTeams, []);
  const newPredictions: KnockoutMatchPrediction[] = [];
  const validWinners = new Map<string, string>();
  
  // First pass: compute R32 matches and check which winners are still valid
  const r32Matches = KNOCKOUT_SLOTS.filter(slot => slot.stage === 'roundOf32');
  
  for (const matchSlot of r32Matches) {
    const { homeTeamId, awayTeamId } = getMatchTeams(matchSlot, context);
    const oldPred = currentPredictions.find(p => p.matchId === matchSlot.id);
    
    let winnerTeamId = '';
    if (oldPred?.winnerTeamId) {
      // Check if the old winner is still one of the teams
      if (oldPred.winnerTeamId === homeTeamId || oldPred.winnerTeamId === awayTeamId) {
        winnerTeamId = oldPred.winnerTeamId;
        validWinners.set(matchSlot.id, winnerTeamId);
      }
    }
    
    newPredictions.push({
      matchId: matchSlot.id,
      homeTeamId: homeTeamId || '',
      awayTeamId: awayTeamId || '',
      winnerTeamId,
    });
  }
  
  // Second pass: rebuild later rounds based on valid R32 winners
  const laterMatches = KNOCKOUT_SLOTS.filter(slot => slot.stage !== 'roundOf32');
  
  // Build new context with R32 predictions
  const newContext = buildBracketContext(groupPredictions, advancingThirdPlaceTeams, newPredictions);
  
  for (const matchSlot of laterMatches) {
    const { homeTeamId, awayTeamId } = getMatchTeams(matchSlot, newContext);
    const oldPred = currentPredictions.find(p => p.matchId === matchSlot.id);
    
    let winnerTeamId = '';
    if (homeTeamId && awayTeamId && oldPred?.winnerTeamId) {
      // Check if old winner is still valid
      if (oldPred.winnerTeamId === homeTeamId || oldPred.winnerTeamId === awayTeamId) {
        winnerTeamId = oldPred.winnerTeamId;
      }
    }
    
    newPredictions.push({
      matchId: matchSlot.id,
      homeTeamId: homeTeamId || '',
      awayTeamId: awayTeamId || '',
      winnerTeamId,
    });
    
    // Update context for next iteration
    if (winnerTeamId) {
      newContext.knockoutPredictions.set(matchSlot.id, {
        matchId: matchSlot.id,
        homeTeamId: homeTeamId || '',
        awayTeamId: awayTeamId || '',
        winnerTeamId,
      });
    }
  }
  
  return newPredictions;
}

/**
 * Check if all knockout matches have a winner selected
 */
export function isKnockoutComplete(predictions: KnockoutMatchPrediction[]): boolean {
  const totalMatches = KNOCKOUT_SLOTS.length; // 32 matches
  
  if (predictions.length < totalMatches) return false;
  
  return predictions.every(p => p.winnerTeamId !== '');
}

/**
 * Count completed matches in knockout
 */
export function countCompletedKnockoutMatches(predictions: KnockoutMatchPrediction[]): number {
  return predictions.filter(p => p.winnerTeamId !== '').length;
}

/**
 * Get the champion team ID from completed predictions
 */
export function getChampion(predictions: KnockoutMatchPrediction[]): TeamId | null {
  const finalMatch = predictions.find(p => p.matchId === 'M104');
  return finalMatch?.winnerTeamId || null;
}

/**
 * Get semi-finalists
 */
export function getSemiFinalists(predictions: KnockoutMatchPrediction[]): TeamId[] {
  const sfPredictions = predictions.filter(p => p.matchId === 'M101' || p.matchId === 'M102');
  const teams: TeamId[] = [];
  
  for (const sf of sfPredictions) {
    if (sf.homeTeamId) teams.push(sf.homeTeamId);
    if (sf.awayTeamId) teams.push(sf.awayTeamId);
  }
  
  return teams;
}

/**
 * Initialize default group predictions with original group order
 */
export function initializeGroupPredictions(): GroupPrediction[] {
  return GROUPS.map(group => ({
    groupId: group.id,
    orderedTeamIds: [...group.teams],
  }));
}
