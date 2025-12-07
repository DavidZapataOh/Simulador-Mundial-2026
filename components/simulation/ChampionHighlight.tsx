'use client';

import { motion } from 'framer-motion';
import { Trophy, Sparkles } from 'lucide-react';
import { TeamId, TEAMS } from '@/lib/worldcup2026';
import { cn } from '@/lib/utils';

// Import flags
import * as Flags from 'country-flag-icons/react/3x2';

interface ChampionHighlightProps {
    teamId: TeamId | null;
    className?: string;
}

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

export function ChampionHighlight({ teamId, className }: ChampionHighlightProps) {
    if (!teamId) {
        return (
            <div className={cn('relative', className)}>
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8">
                    <Trophy className="h-16 w-16 text-gray-300" />
                    <p className="mt-4 text-lg font-medium text-gray-400">
                        Completa el bracket para ver tu campeón
                    </p>
                </div>
            </div>
        );
    }

    const team = TEAMS[teamId];
    if (!team) return null;

    const FlagComponent = getFlagComponent(team.flagCode);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className={cn('relative', className)}
        >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 via-yellow-300/20 to-amber-500/20 rounded-3xl blur-xl" />

            {/* Sparkle animations */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute"
                    style={{
                        left: `${15 + Math.random() * 70}%`,
                        top: `${10 + Math.random() * 80}%`,
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.3,
                        ease: 'easeInOut',
                    }}
                >
                    <Sparkles className="h-5 w-5 text-amber-400" />
                </motion.div>
            ))}

            {/* Main card */}
            <div className="relative overflow-hidden rounded-3xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-white to-yellow-50 p-8 shadow-xl shadow-amber-200/50">
                {/* Trophy pattern */}
                <div className="absolute top-0 right-0 opacity-10">
                    <Trophy className="h-40 w-40 text-amber-600 -translate-y-10 translate-x-10" />
                </div>

                <div className="relative flex flex-col items-center gap-6">
                    {/* Crown / Trophy */}
                    <motion.div
                        animate={{
                            y: [0, -5, 0],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                        className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-300/50"
                    >
                        <Trophy className="h-10 w-10 text-white" />
                    </motion.div>

                    {/* "Champion" label */}
                    <div className="text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xs font-bold uppercase tracking-widest text-amber-600"
                        >
                            🏆 CAMPEÓN MUNDIAL 2026 🏆
                        </motion.div>
                    </div>

                    {/* Flag */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring' }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl blur-md opacity-40" />
                        <div className="relative w-32 h-20 rounded-xl overflow-hidden shadow-xl ring-4 ring-amber-200">
                            {FlagComponent ? (
                                <FlagComponent className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-gray-500">
                                        {team.shortName}
                                    </span>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Team name */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-center"
                    >
                        <h2 className="text-3xl font-bold text-amber-600">
                            {team.name}
                        </h2>
                        <p className="mt-1 text-sm font-medium text-gray-500">
                            {team.shortName} • FIFA World Cup 2026
                        </p>
                    </motion.div>

                    {/* Confetti-like decorations */}
                    <div className="flex gap-2">
                        {['🥇', '⭐', '🎉'].map((emoji, i) => (
                            <motion.span
                                key={emoji}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + i * 0.1 }}
                                className="text-2xl"
                            >
                                {emoji}
                            </motion.span>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
