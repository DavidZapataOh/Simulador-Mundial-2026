'use client';

import { motion } from 'framer-motion';
import { Check, AlertTriangle } from 'lucide-react';
import { TeamId, GroupId, TEAMS_REGISTRY, GROUPS, PlayoffMapping, getResolvedTeam } from '@/lib/worldcup2026';
import { cn } from '@/lib/utils';
import * as Flags from 'country-flag-icons/react/3x2';

interface ThirdPlaceSelectorProps {
    groupPredictions: Array<{ groupId: GroupId; orderedTeamIds: TeamId[] }>;
    selectedTeams: TeamId[];
    onToggleTeam: (teamId: TeamId) => void;
    playoffMapping: PlayoffMapping;
}

function getFlagComponent(flagCode: string): React.ComponentType<{ className?: string }> | null {
    const codeMap: Record<string, string> = {
        'GB-ENG': 'GB', 'GB-SCT': 'GB', 'EU': 'EU', 'UN': 'UN',
        'CW': 'NL', 'XK': 'XK', 'NC': 'NC',
    };
    const actualCode = codeMap[flagCode] || flagCode;
    // @ts-expect-error - Dynamic access
    return Flags[actualCode] || null;
}

export function ThirdPlaceSelector({
    groupPredictions,
    selectedTeams,
    onToggleTeam,
    playoffMapping,
}: ThirdPlaceSelectorProps) {
    // Get all third-place teams from group predictions
    const thirdPlaceTeams = groupPredictions
        .map((gp) => {
            const group = GROUPS.find((g) => g.id === gp.groupId);
            const teamId = gp.orderedTeamIds[2]; // 3rd place (0-indexed)
            // Resolve through playoff mapping
            const team = teamId ? getResolvedTeam(teamId, playoffMapping) : null;
            return { group, teamId, team };
        })
        .filter((item) => item.team !== null);

    const validThirdPlaceTeamIds = thirdPlaceTeams.map(t => t.teamId);
    const invalidSelections = selectedTeams.filter(id => !validThirdPlaceTeamIds.includes(id));
    const validSelectedCount = selectedTeams.filter(id => validThirdPlaceTeamIds.includes(id)).length;
    const canSelectMore = validSelectedCount < 8;

    return (
        <div className="space-y-6">
            {invalidSelections.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200"
                >
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-amber-800">
                            Algunos equipos seleccionados ya no están en 3° lugar
                        </p>
                        <p className="text-xs text-amber-600 mt-1">
                            Por favor actualiza tu selección. Los equipos inválidos serán ignorados.
                        </p>
                    </div>
                </motion.div>
            )}

            <div className="text-center">
                <div className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-wc-blue/10 to-wc-green/10 px-6 py-3 border border-white/5">
                    <span className="text-gray-600 dark:text-gray-300">Has elegido</span>
                    <span className={cn('text-3xl font-bold', validSelectedCount === 8 ? 'text-wc-green' : 'text-wc-blue')}>
                        {validSelectedCount}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300">de 8 mejores terceros</span>
                </div>
                {validSelectedCount === 8 && (
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 text-sm text-wc-green font-medium"
                    >
                        ¡Selección completa! Puedes continuar al bracket.
                    </motion.p>
                )}
            </div>

            <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-wc-red via-wc-blue to-wc-green"
                    initial={{ width: 0 }}
                    animate={{ width: `${(validSelectedCount / 8) * 100}%` }}
                />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {thirdPlaceTeams.map(({ group, teamId, team }, index) => {
                    if (!team || !teamId || !group) return null;

                    const isSelected = selectedTeams.includes(teamId);
                    const isDisabled = !isSelected && !canSelectMore;
                    const FlagComponent = getFlagComponent(team.flagCode);

                    return (
                        <motion.button
                            key={teamId}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.03 }}
                            onClick={() => !isDisabled && onToggleTeam(teamId)}
                            disabled={isDisabled}
                            className={cn(
                                'relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                                isSelected
                                    ? 'border-wc-green bg-wc-green/5 dark:bg-wc-green/20 shadow-md shadow-wc-green/20'
                                    : isDisabled
                                        ? 'border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/5 opacity-50 cursor-not-allowed'
                                        : 'border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 dark:backdrop-blur-sm hover:border-wc-blue hover:shadow-md cursor-pointer'
                            )}
                        >
                            {isSelected && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-wc-green shadow-md"
                                >
                                    <Check className="h-3.5 w-3.5 text-white" />
                                </motion.div>
                            )}

                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                Grupo {group.id}
                            </span>

                            <div className="w-12 h-8 rounded-md overflow-hidden shadow-sm">
                                {FlagComponent ? (
                                    <FlagComponent className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-white/10 dark:to-white/20 flex items-center justify-center">
                                        <span className="text-xs font-bold text-gray-500 dark:text-gray-300">{team.shortName}</span>
                                    </div>
                                )}
                            </div>

                            <span className={cn(
                                'text-sm font-semibold text-center truncate w-full',
                                isSelected ? 'text-wc-green dark:text-green-400' : 'text-gray-700 dark:text-gray-200'
                            )}>
                                {team.name}
                            </span>

                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                                3° lugar
                            </span>
                        </motion.button>
                    );
                })}
            </div>

            <div className="text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                <p>
                    Selecciona los <strong>8 equipos</strong> que crees que clasificarán como mejores terceros.
                </p>
            </div>
        </div>
    );
}
