import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Configuration
 * 
 * Uses the publishable key for client-side operations.
 * For server-side operations that need elevated permissions,
 * use the service role key via environment variables.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Supabase client for use in both client and server components
 * Uses the publishable/anon key which respects RLS policies
 */
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Database Types
 */
export interface SimulationRow {
  id: string;
  name: string | null;
  created_at: string;
  updated_at: string;
  data: SimulationData;
  champion_team_id: string;
  votes_count: number;
}

export interface SimulationData {
  groupPredictions: Array<{
    groupId: string;
    orderedTeamIds: string[];
  }>;
  advancingThirdPlaceTeams: string[];
  knockoutPredictions: Array<{
    matchId: string;
    homeTeamId: string;
    awayTeamId: string;
    winnerTeamId: string;
  }>;

  playoffSelections?: Array<{ playoffId: string; selectedTeamId: string }>;
  playoffMapping?: Record<string, string>;
}

export interface VoteRow {
  id: string;
  simulation_id: string;
  created_at: string;
}
