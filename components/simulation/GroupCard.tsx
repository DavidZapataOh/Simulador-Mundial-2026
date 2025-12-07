'use client';

import { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import { GroupId, TeamId, TEAMS_REGISTRY, PlayoffMapping, getResolvedTeam } from '@/lib/worldcup2026';
import { cn } from '@/lib/utils';
import * as Flags from 'country-flag-icons/react/3x2';

interface GroupCardProps {
    groupId: GroupId;
    groupName: string;
    orderedTeamIds: TeamId[];
    onOrderChange: (newOrder: TeamId[]) => void;
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

const positionLabels = ['1°', '2°', '3°', '4°'];
const positionColors = [
    'bg-wc-green text-white',
    'bg-wc-blue text-white',
    // Warning/Possible: #E9A13A (custom hex as requested)
    'bg-[#E9A13A] text-white',
    'bg-gray-400 text-white',
];

export function GroupCard({
    groupId,
    groupName,
    orderedTeamIds,
    onOrderChange,
    playoffMapping,
}: GroupCardProps) {
    const [isDragging, setIsDragging] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
                'relative overflow-hidden rounded-2xl border bg-white dark:bg-black/20 dark:backdrop-blur-sm shadow-sm transition-shadow dark:border-white/10',
                isDragging ? 'shadow-xl ring-2 ring-wc-red/20' : 'hover:shadow-md'
            )}
        >
            <div className="bg-wc-blue px-4 py-3">
                <h3 className="text-lg font-bold text-white">{groupName}</h3>
                <p className="text-xs text-white/70">Arrastra para ordenar</p>
            </div>

            <Reorder.Group
                axis="y"
                values={orderedTeamIds}
                onReorder={onOrderChange}
                className="divide-y divide-gray-100 dark:divide-white/5 p-2"
            >
                {orderedTeamIds.map((teamId, index) => {
                    // ALWAYS resolve through playoff mapping
                    const team = getResolvedTeam(teamId, playoffMapping);
                    if (!team) return null;

                    const FlagComponent = getFlagComponent(team.flagCode);

                    return (
                        <Reorder.Item
                            key={teamId}
                            value={teamId}
                            onDragStart={() => setIsDragging(true)}
                            onDragEnd={() => setIsDragging(false)}
                            className="group"
                        >
                            <motion.div
                                layout
                                className={cn(
                                    'flex items-center gap-3 rounded-xl p-2.5 cursor-grab active:cursor-grabbing',
                                    'transition-colors hover:bg-gray-50 dark:hover:bg-white/5',
                                    isDragging && 'bg-gray-50 dark:bg-white/10'
                                )}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                <div
                                    className={cn(
                                        'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                                        positionColors[index]
                                    )}
                                >
                                    {positionLabels[index]}
                                </div>

                                <GripVertical className="h-4 w-4 flex-shrink-0 text-gray-300 group-hover:text-gray-400 transition-colors" />

                                <div className="w-7 h-5 rounded overflow-hidden shadow-sm flex-shrink-0">
                                    {FlagComponent ? (
                                        <FlagComponent className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-white/10 dark:to-white/20 flex items-center justify-center">
                                            <span className="text-[8px] font-bold text-gray-500 dark:text-gray-300">
                                                {team.shortName.slice(0, 2)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <span className="flex-1 text-sm font-medium truncate text-gray-700 dark:text-gray-200">
                                    {team.name}
                                </span>

                                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                                    {team.shortName}
                                </span>
                            </motion.div>
                        </Reorder.Item>
                    );
                })}
            </Reorder.Group>

            <div className="flex items-center justify-center gap-4 border-t border-gray-100 dark:border-white/5 px-4 py-2.5 bg-gray-50/50 dark:bg-white/5">
                <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-wc-green" />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Clasifica</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-wc-blue" />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Clasifica</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#E9A13A]" />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Posible</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-gray-400" />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Eliminado</span>
                </div>
            </div>
        </motion.div>
    );
}
