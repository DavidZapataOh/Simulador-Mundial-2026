'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Trophy, Heart, Calendar, Filter, ArrowUpDown } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { SimulationRow } from '@/lib/supabaseClient';
import { TEAMS } from '@/lib/worldcup2026';
import { formatDate, cn } from '@/lib/utils';

// Import flags
import * as Flags from 'country-flag-icons/react/3x2';

function getFlagComponent(flagCode: string): React.ComponentType<{ className?: string }> | null {
    const codeMap: Record<string, string> = {
        'GB-ENG': 'GB',
        'GB-SCT': 'GB',
        'EU': 'EU',
        'UN': 'UN',
        'CW': 'NL',
    };
    const actualCode = codeMap[flagCode] || flagCode;
    // @ts-expect-error - Dynamic access
    return Flags[actualCode] || null;
}

type SortOption = 'votes' | 'recent';

async function fetchSimulations(sort: SortOption): Promise<SimulationRow[]> {
    const response = await fetch(`/api/simulations?sort=${sort}`);
    if (!response.ok) {
        throw new Error('Failed to fetch simulations');
    }
    return response.json();
}

export default function TopPage() {
    const [sortBy, setSortBy] = useState<SortOption>('votes');

    const { data: simulations, isLoading, error } = useQuery({
        queryKey: ['simulations', sortBy],
        queryFn: () => fetchSimulations(sortBy),
    });

    return (
        <PageShell paddingY="md">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Top Predicciones
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Las predicciones más votadas por la comunidad
                </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Ordenar por:</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setSortBy('votes')}
                        className={cn(
                            'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                            sortBy === 'votes'
                                ? 'bg-wc-red text-white shadow-md'
                                : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
                        )}
                    >
                        Más votadas
                    </button>
                    <button
                        onClick={() => setSortBy('recent')}
                        className={cn(
                            'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                            sortBy === 'recent'
                                ? 'bg-wc-blue text-white shadow-md'
                                : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
                        )}
                    >
                        Más recientes
                    </button>
                </div>
            </div>

            {/* Loading state */}
            {isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="h-48 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse"
                        />
                    ))}
                </div>
            )}

            {/* Error state */}
            {error && (
                <div className="text-center py-12">
                    <p className="text-gray-500">Error al cargar las predicciones</p>
                </div>
            )}

            {/* Empty state */}
            {simulations?.length === 0 && (
                <div className="text-center py-16">
                    <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">
                        Aún no hay predicciones
                    </h2>
                    <p className="text-gray-500 mb-6">
                        ¡Sé el primero en crear tu predicción!
                    </p>
                    <Link
                        href="/simular"
                        className="inline-flex items-center gap-2 rounded-xl bg-wc-red px-6 py-3 font-semibold text-white hover:bg-wc-red/90 transition-colors"
                    >
                        Crear predicción
                    </Link>
                </div>
            )}

            {/* Simulations grid */}
            {simulations && simulations.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {simulations.map((simulation, index) => {
                        const championTeam = TEAMS[simulation.champion_team_id];
                        const FlagComponent = championTeam
                            ? getFlagComponent(championTeam.flagCode)
                            : null;

                        return (
                            <motion.div
                                key={simulation.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Link href={`/simulaciones/${simulation.id}`}>
                                    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 dark:backdrop-blur-sm shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
                                        {/* Rank badge */}
                                        {sortBy === 'votes' && index < 3 && (
                                            <div
                                                className={cn(
                                                    'absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full font-bold text-white text-sm shadow-lg z-10',
                                                    index === 0
                                                        ? 'bg-amber-400'
                                                        : index === 1
                                                            ? 'bg-gray-400'
                                                            : 'bg-amber-600'
                                                )}
                                            >
                                                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                            </div>
                                        )}

                                        {/* Champion flag background */}
                                        <div className="relative h-32 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-white/5 dark:to-white/10 flex items-center justify-center overflow-hidden">
                                            {FlagComponent ? (
                                                <>
                                                    <div className="absolute inset-0 opacity-20">
                                                        <FlagComponent className="w-full h-full object-cover blur-sm scale-150" />
                                                    </div>
                                                    <div className="relative w-20 h-14 rounded-lg overflow-hidden shadow-xl ring-4 ring-white dark:ring-white/10">
                                                        <FlagComponent className="w-full h-full object-cover" />
                                                    </div>
                                                </>
                                            ) : (
                                                <Trophy className="h-12 w-12 text-gray-300" />
                                            )}

                                            {/* Champion label */}
                                            <div className="absolute bottom-2 left-0 right-0 text-center">
                                                <span className="inline-block px-3 py-1 rounded-full bg-white/90 shadow-sm text-xs font-semibold text-gray-700">
                                                    🏆 {championTeam?.name || 'Campeón'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4">
                                            <h3 className="font-semibold text-gray-900 dark:text-white truncate mb-2 group-hover:text-wc-red transition-colors">
                                                {simulation.name || 'Predicción'}
                                            </h3>

                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {formatDate(simulation.created_at)}
                                                </div>

                                                <div className="flex items-center gap-1.5 text-wc-red font-medium">
                                                    <Heart className="h-3.5 w-3.5 fill-wc-red" />
                                                    {simulation.votes_count}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hover effect */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-wc-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </PageShell>
    );
}
