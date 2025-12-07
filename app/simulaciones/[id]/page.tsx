import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase, SimulationRow } from '@/lib/supabaseClient';
import { SimulationDetailClient } from './SimulationDetailClient';
import { TEAMS } from '@/lib/worldcup2026';

interface PageProps {
    params: Promise<{ id: string }>;
}

async function getSimulation(id: string): Promise<SimulationRow & { profiles: { full_name: string; avatar_url: string } | null } | null> {
    // 1. Fetch Simulation
    const { data: simulation, error } = await supabase
        .from('simulations')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !simulation) {
        return null;
    }

    // 2. Fetch Profile if user_id exists
    let profile = null;
    if (simulation.user_id) {
        const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', simulation.user_id)
            .single();
        profile = profileData;
    }

    return {
        ...simulation,
        profiles: profile
    } as SimulationRow & { profiles: { full_name: string; avatar_url: string } | null };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const simulation = await getSimulation(id);

    if (!simulation) {
        return {
            title: 'Predicción no encontrada',
        };
    }

    const championTeam = TEAMS[simulation.champion_team_id];
    const title = simulation.name || 'Predicción del Mundial 2026';
    const description = championTeam
        ? `Predicción: ${championTeam.name} campeón del Mundial 2026. ¡Mira el bracket completo!`
        : 'Mira esta predicción del Mundial 2026';

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
    };
}

export default async function SimulationDetailPage({ params }: PageProps) {
    const { id } = await params;
    const simulation = await getSimulation(id);

    if (!simulation) {
        notFound();
    }

    return <SimulationDetailClient simulation={simulation} />;
}
