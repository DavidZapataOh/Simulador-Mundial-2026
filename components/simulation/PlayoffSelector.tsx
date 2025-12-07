'use client';

import { motion } from 'framer-motion';
import { Check, Trophy } from 'lucide-react';
import { PLAYOFF_PATHS, PlayoffSelection, TEAMS_REGISTRY, TeamId } from '@/lib/worldcup2026';
import { cn } from '@/lib/utils';
import * as Flags from 'country-flag-icons/react/3x2';

interface PlayoffSelectorProps {
    playoffSelections: PlayoffSelection[];
    onSelectWinner: (playoffId: string, selectedTeamId: TeamId) => void;
}

function getFlagComponent(flagCode: string): React.ComponentType<{ className?: string }> | null {
    const codeMap: Record<string, string> = {
        'GB-ENG': 'GB',
        'GB-SCT': 'GB',
        'EU': 'EU',
        'UN': 'UN',
        'CW': 'NL',
        'XK': 'XK',
        'NC': 'NC',
    };
    const actualCode = codeMap[flagCode] || flagCode;
    // @ts-expect-error - Dynamic access
    return Flags[actualCode] || null;
}

interface CandidateCardProps {
    teamId: TeamId;
    isSelected: boolean;
    onClick: () => void;
}

function CandidateCard({ teamId, isSelected, onClick }: CandidateCardProps) {
    const team = TEAMS_REGISTRY[teamId];
    if (!team) return null;

    const FlagComponent = getFlagComponent(team.flagCode);

    return (
        <motion.button
            onClick={onClick}
            className={cn(
                'relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all flex-1 min-w-[80px]',
                isSelected
                    ? 'border-wc-green bg-wc-green/10 dark:bg-wc-green/20 shadow-lg shadow-wc-green/20'
                    : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-wc-blue hover:bg-wc-blue/5 dark:hover:bg-white/10'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            {isSelected && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-wc-green shadow-md"
                >
                    <Check className="h-3 w-3 text-white" />
                </motion.div>
            )}

            <div className="w-12 h-8 rounded-lg overflow-hidden shadow-md ring-1 ring-black/10">
                {FlagComponent ? (
                    <FlagComponent className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-white/10 dark:to-white/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-300">{team.shortName}</span>
                    </div>
                )}
            </div>

            <span className={cn(
                'text-xs font-bold text-center leading-tight',
                isSelected ? 'text-wc-green dark:text-green-400' : 'text-gray-800 dark:text-gray-200'
            )}>
                {team.name}
            </span>

            <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                {team.shortName}
            </span>
        </motion.button>
    );
}

export function PlayoffSelector({ playoffSelections, onSelectWinner }: PlayoffSelectorProps) {
    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-wc-red/10 to-wc-blue/10 border border-transparent dark:border-white/5">
                    <Trophy className="h-5 w-5 text-wc-red" />
                    <span className="font-semibold text-gray-800 dark:text-gray-200">Selecciona los ganadores de cada repechaje</span>
                </div>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    Cada repechaje tiene varios candidatos. Haz clic en el equipo que crees que ganará.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {PLAYOFF_PATHS.map((path, index) => {
                    const selection = playoffSelections.find(ps => ps.playoffId === path.id);
                    const selectedTeamId = selection?.selectedTeamId || path.candidateIds[0];

                    return (
                        <motion.div
                            key={path.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 dark:backdrop-blur-sm p-4 shadow-sm"
                        >
                            <div className="text-center mb-4">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{path.name}</span>
                                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{path.candidateIds.length} candidatos</div>
                            </div>

                            <div className="flex gap-2 flex-wrap justify-center">
                                {path.candidateIds.map((candidateId) => (
                                    <CandidateCard
                                        key={candidateId}
                                        teamId={candidateId}
                                        isSelected={selectedTeamId === candidateId}
                                        onClick={() => onSelectWinner(path.id, candidateId)}
                                    />
                                ))}
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 text-center">
                                <span className="text-xs text-gray-400 dark:text-gray-500">Ganador: </span>
                                <span className="text-xs font-bold text-wc-green">
                                    {TEAMS_REGISTRY[selectedTeamId]?.name || '-'}
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
