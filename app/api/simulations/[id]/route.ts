import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/simulations/[id]
 * Fetch a single simulation by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  // Validate UUID format (basic check)
  if (!id || id.length < 10) {
    return NextResponse.json(
      { error: 'Invalid simulation ID' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('simulations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Simulation not found' },
        { status: 404 }
      );
    }
    console.error('Error fetching simulation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch simulation' },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
