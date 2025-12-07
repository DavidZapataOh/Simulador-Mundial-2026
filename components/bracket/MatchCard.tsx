'use client';

import { motion } from 'framer-motion';
import { TEAMS, TeamId } from '@/lib/worldcup2026';
import { cn } from '@/lib/utils';

// Import flags
import * as Flags from 'country-flag-icons/react/3x2';

interface MatchCardProps {
    matchId: string;
    matchNumber?: number;
    homeTeamId: TeamId | null;
    awayTeamId: TeamId | null;
    winnerTeamId: TeamId | null;
    onSelectWinner: (teamId: TeamId) => void;
    isReadOnly?: boolean;
    getTeamDisplayName?: (teamId: TeamId) => string;
    getTeamShortName?: (teamId: TeamId) => string;
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

function TeamRow({
    teamId,
    isWinner,
    isClickable,
    onClick,
    displayName,
    shortName,
}: {
    teamId: TeamId | null;
    isWinner: boolean;
    isClickable: boolean;
    onClick?: () => void;
    displayName?: string;
    shortName?: string;
}) {
    if (!teamId) {
        return (
            <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-gray-50 border-2 border-dashed border-gray-200">
                <div className="w-6 h-4 rounded bg-gray-200" />
                <span className="text-xs text-gray-400 italic">Por definir</span>
            </div>
        );
    }

    const team = TEAMS[teamId];
    if (!team) return null;

    const FlagComponent = getFlagComponent(team.flagCode);
    const name = shortName || team.shortName;

    return (
        <motion.button
            type="button"
            onClick={onClick}
            disabled={!isClickable}
            className={cn(
                'flex items-center gap-1.5 h-8 px-2 rounded-lg border-2 w-full transition-all duration-200',
                isClickable && 'cursor-pointer hover:shadow-lg active:scale-[0.98]',
                !isClickable && 'cursor-default',
                isWinner
                    ? 'border-wc-green bg-wc-green/15 ring-2 ring-wc-green/40 shadow-md shadow-wc-green/20'
                    : isClickable
                        ? 'border-wc-gray-light bg-white hover:border-wc-blue hover:bg-wc-blue/5'
                        : 'border-wc-gray-light bg-white'
            )}
            whileHover={isClickable ? { scale: 1.02, y: -2 } : undefined}
            whileTap={isClickable ? { scale: 0.98 } : undefined}
        >
            {/* Flag */}
            <div className="w-5 h-3.5 rounded overflow-hidden shadow-sm flex-shrink-0 ring-1 ring-black/5">
                {FlagComponent ? (
                    <FlagComponent className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-gray-500">?</span>
                    </div>
                )}
            </div>

            {/* Name */}
            <span
                className={cn(
                    'text-[9px] font-bold truncate flex-1 text-left leading-tight',
                    isWinner ? 'text-wc-green' : 'text-gray-800'
                )}
            >
                {name}
            </span>

            {/* Winner check */}
            {isWinner && (
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="flex-shrink-0"
                >
                    <svg className="w-3.5 h-3.5 text-wc-green" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                        />
                    </svg>
                </motion.div>
            )}

            {/* Click hint for interactive matches */}
            {isClickable && !isWinner && (
                <span className="text-[10px] text-gray-400 hidden group-hover:inline">
                    Elegir
                </span>
            )}
        </motion.button>
    );
}

export function MatchCard({
    matchId,
    matchNumber,
    homeTeamId,
    awayTeamId,
    winnerTeamId,
    onSelectWinner,
    isReadOnly = false,
    getTeamDisplayName,
    getTeamShortName,
}: MatchCardProps) {
    const bothTeamsReady = Boolean(homeTeamId && awayTeamId);
    const canSelect = bothTeamsReady && !isReadOnly;
    // const needsSelection = canSelect && !winnerTeamId; // Removed to reduce visual noise

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                'w-32 rounded-xl border-2 bg-white shadow-sm overflow-hidden transition-all group',
                winnerTeamId
                    ? 'border-wc-green/40 shadow-wc-green/10'
                    : canSelect
                        ? 'border-wc-gray-light hover:border-wc-blue/30'
                        : 'border-wc-gray-light'
            )}
        >
            {/* Match header */}
            <div className={cn(
                'px-2 py-1 border-b flex items-center justify-between',
                winnerTeamId
                    ? 'bg-wc-green/5 border-wc-green/20'
                    : 'bg-gray-50 border-gray-100'
            )}>
                <span className={cn(
                    'text-[9px] font-bold uppercase tracking-wider',
                    winnerTeamId ? 'text-wc-green' : 'text-gray-400'
                )}>
                    {matchNumber ? `P${matchNumber}` : matchId}
                </span>
                {winnerTeamId && (
                    <span className="text-[10px] font-medium text-wc-green">
                        ✓
                    </span>
                )}
            </div>

            {/* Teams */}
            <div className="p-1.5 space-y-1.5">
                <TeamRow
                    teamId={homeTeamId}
                    isWinner={Boolean(winnerTeamId && winnerTeamId === homeTeamId)}
                    isClickable={canSelect}
                    onClick={() => homeTeamId && onSelectWinner(homeTeamId)}
                    displayName={homeTeamId && getTeamDisplayName ? getTeamDisplayName(homeTeamId) : undefined}
                    shortName={homeTeamId && getTeamShortName ? getTeamShortName(homeTeamId) : undefined}
                />

                {/* VS divider */}
                <div className="flex items-center justify-center gap-2">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-[10px] font-bold text-gray-300 px-1">VS</span>
                    <div className="flex-1 h-px bg-gray-200" />
                </div>

                <TeamRow
                    teamId={awayTeamId}
                    isWinner={Boolean(winnerTeamId && winnerTeamId === awayTeamId)}
                    isClickable={canSelect}
                    onClick={() => awayTeamId && onSelectWinner(awayTeamId)}
                    displayName={awayTeamId && getTeamDisplayName ? getTeamDisplayName(awayTeamId) : undefined}
                    shortName={awayTeamId && getTeamShortName ? getTeamShortName(awayTeamId) : undefined}
                />
            </div>
        </motion.div>
    );
}
