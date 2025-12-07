import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client helper
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

function getAuthenticatedClient(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
     return createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } },
     });
  }
  // Fallback to anon client (will fail RLS for protected inserts)
  return createClient(supabaseUrl, supabaseKey);
}

// Global anon client for public reads
const publicSupabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/simulations
 * Fetch list of simulations with optional sorting
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sort = searchParams.get('sort') || 'votes';
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const championFilter = searchParams.get('champion');

  let query = publicSupabase
    .from('simulations')
    .select('*');

  // Apply champion filter if provided
  if (championFilter) {
    query = query.eq('champion_team_id', championFilter);
  }

  // Apply sorting
  if (sort === 'votes') {
    query = query.order('votes_count', { ascending: false }).order('created_at', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  // Apply limit
  query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching simulations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch simulations' },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

/**
 * POST /api/simulations
 * Create a new simulation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, playoffSelections, groupPredictions, advancingThirdPlaceTeams, knockoutPredictions, championTeamId, userId } = body;

    // Validate required fields
    if (!groupPredictions || !advancingThirdPlaceTeams || !knockoutPredictions || !championTeamId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate group predictions
    if (!Array.isArray(groupPredictions) || groupPredictions.length !== 12) {
      return NextResponse.json(
        { error: 'Invalid group predictions' },
        { status: 400 }
      );
    }

    // Validate third place teams
    if (!Array.isArray(advancingThirdPlaceTeams) || advancingThirdPlaceTeams.length !== 8) {
      return NextResponse.json(
        { error: 'Invalid third place teams' },
        { status: 400 }
      );
    }

    // Prepare simulation data
    const simulationData = {
      playoffSelections: playoffSelections || [],
      groupPredictions,
      advancingThirdPlaceTeams,
      knockoutPredictions,
    };

    // Insert into database
    // Use authenticated client to pass RLS
    const supabaseClient = getAuthenticatedClient(request);
    
    const { data, error } = await supabaseClient
      .from('simulations')
      .insert({
        name: name || null,
        data: simulationData,
        champion_team_id: championTeamId,
        user_id: userId || null, // Link to user if authenticated
        votes_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating simulation:', error);
      return NextResponse.json(
        { error: 'Failed to create simulation' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('Error processing request:', err);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
