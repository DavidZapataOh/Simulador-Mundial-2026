import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/simulations/[id]/vote
 * Add a vote to a simulation
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  // 1. Authenticate User
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Create auth client
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey, {
     global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate UUID format (basic check)
  if (!id || id.length < 10) {
    return NextResponse.json(
      { error: 'Invalid simulation ID' },
      { status: 400 }
    );
  }

  // Check if simulation exists
  const { data: simulation, error: fetchError } = await supabase
    .from('simulations')
    .select('id, votes_count')
    .eq('id', id)
    .single();

  if (fetchError || !simulation) {
    return NextResponse.json(
      { error: 'Simulation not found' },
      { status: 404 }
    );
  }

  // Insert vote (trigger will update votes_count)
  // Insert vote (trigger will update votes_count)
  const { error: voteError } = await supabase
    .from('votes')
    .insert({
      simulation_id: id,
      user_id: user.id
    });

  if (voteError) {
    console.error('Error creating vote:', voteError);
    return NextResponse.json(
      { error: 'Failed to add vote' },
      { status: 500 }
    );
  }

  // Fetch updated vote count
  const { data: updatedSimulation, error: updateError } = await supabase
    .from('simulations')
    .select('votes_count')
    .eq('id', id)
    .single();

  if (updateError) {
    // Vote was added, just return the incremented count
    return NextResponse.json({
      votes_count: simulation.votes_count + 1,
    });
  }

  return NextResponse.json({
    votes_count: updatedSimulation.votes_count,
  });
}
