'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, Trophy } from 'lucide-react';
import {
    TeamId,
    GroupPrediction,
    KnockoutMatchPrediction,
    KnockoutMatchSlot,
    KNOCKOUT_MATCHES,
    R32_VISUAL_ORDER,
    R16_VISUAL_ORDER,
    QF_VISUAL_ORDER,
    SF_VISUAL_ORDER,
    STAGE_NAMES,
    TEAMS_REGISTRY,
    PlayoffMapping,
    getResolvedTeam,
} from '@/lib/worldcup2026';
import { buildBracketContext, getMatchTeams } from '@/lib/bracket';
import { cn } from '@/lib/utils';
import * as Flags from 'country-flag-icons/react/3x2';

interface BracketViewProps {
    groupPredictions: GroupPrediction[];
    advancingThirdPlaceTeams: TeamId[];
    knockoutPredictions: KnockoutMatchPrediction[];
    onSelectWinner: (matchId: string, winnerTeamId: TeamId) => void;
    isReadOnly?: boolean;
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

interface MatchProps {
    slot: KnockoutMatchSlot;
    homeTeamId: TeamId | null;
    awayTeamId: TeamId | null;
    winnerTeamId: string | null;
    onSelectWinner: (teamId: TeamId) => void;
    isReadOnly: boolean;
    playoffMapping: PlayoffMapping;
    isFinal?: boolean;
}

function Match({
    slot,
    homeTeamId,
    awayTeamId,
    winnerTeamId,
    onSelectWinner,
    isReadOnly,
    playoffMapping,
    isFinal,
}: MatchProps) {
    const canSelect = homeTeamId && awayTeamId && !isReadOnly;
    const hasWinner = winnerTeamId && winnerTeamId !== '';

    const renderTeam = (teamId: TeamId | null) => {
        if (!teamId) {
            return (
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-gray-50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10">
                    <div className="w-5 h-3.5 rounded bg-gray-200 dark:bg-white/10" />
                    <span className="text-[10px] text-gray-400 dark:text-white/30 italic">TBD</span>
                </div>
            );
        }

        // ALWAYS resolve through playoff mapping
        const team = getResolvedTeam(teamId, playoffMapping);
        if (!team) {
            return (
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-gray-50 dark:bg-white/5">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{teamId}</span>
                </div>
            );
        }

        const FlagComponent = getFlagComponent(team.flagCode);
        const isWinner = winnerTeamId === teamId;
        const isClickable = canSelect;

        return (
            <motion.button
                onClick={() => isClickable && onSelectWinner(teamId)}
                disabled={!isClickable}
                className={cn(
                    'flex items-center gap-2 px-2 py-1.5 rounded-md border w-full transition-all duration-300',
                    isWinner
                        ? 'border-wc-green bg-wc-green/15 dark:bg-wc-green/30 shadow-sm shadow-wc-green/20'
                        : isClickable
                            ? 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-wc-blue hover:bg-wc-blue/5 dark:hover:bg-white/10 dark:hover:border-white/30 cursor-pointer'
                            : 'border-gray-200 dark:border-white/5 bg-white dark:bg-transparent cursor-default'
                )}
                whileHover={isClickable ? { scale: 1.02 } : undefined}
                whileTap={isClickable ? { scale: 0.98 } : undefined}
            >
                <div className="w-5 h-3.5 rounded overflow-hidden shadow-sm flex-shrink-0">
                    {FlagComponent ? (
                        <FlagComponent className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gray-200 dark:bg-white/20 flex items-center justify-center">
                            <span className="text-[6px] text-gray-400 dark:text-white/50">{team.shortName}</span>
                        </div>
                    )}
                </div>
                <span className={cn(
                    'text-[10px] font-bold flex-1 text-left truncate',
                    isWinner ? 'text-wc-green dark:text-green-400' : 'text-gray-800 dark:text-gray-200'
                )}>
                    {team.shortName}
                </span>
                {isWinner && <Check className="w-3 h-3 text-wc-green flex-shrink-0" />}
            </motion.button>
        );
    };

    return (
        <div className={cn(
            'bg-white dark:bg-black/20 dark:backdrop-blur-sm rounded-lg border shadow-sm transition-all',
            hasWinner
                ? 'border-wc-green/30 dark:border-accent-green/30 shadow-md' // Green glow for winner
                : 'border-gray-200 dark:border-white/10',
            isFinal ? 'ring-2 ring-amber-400/50 w-36 scale-110' : 'w-28'
        )}>
            <div className={cn(
                'px-1.5 py-0.5 border-b text-center rounded-t-lg',
                hasWinner
                    ? 'bg-wc-green/5 dark:bg-wc-green/20 border-wc-green/20'
                    : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5'
            )}>
                <span className={cn(
                    'text-[9px] font-bold uppercase tracking-wider',
                    hasWinner ? 'text-wc-green dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
                )}>
                    P{slot.matchNumber}
                </span>
            </div>
            <div className="p-1.5 space-y-1">
                {renderTeam(homeTeamId)}
                {renderTeam(awayTeamId)}
            </div>
        </div>
    );
}

export function BracketView({
    groupPredictions,
    advancingThirdPlaceTeams,
    knockoutPredictions,
    onSelectWinner,
    isReadOnly = false,
    playoffMapping,
}: BracketViewProps) {
    const context = useMemo(() => {
        return buildBracketContext(groupPredictions, advancingThirdPlaceTeams, knockoutPredictions);
    }, [groupPredictions, advancingThirdPlaceTeams, knockoutPredictions]);

    const getPrediction = (matchId: string) => {
        return knockoutPredictions.find((p) => p.matchId === matchId);
    };

    const completedMatches = knockoutPredictions.filter(p => p.winnerTeamId !== '').length;
    const totalMatches = 32;

    const renderMatch = (matchId: string, isFinal?: boolean) => {
        const slot = KNOCKOUT_MATCHES[matchId];
        if (!slot) return null;

        const prediction = getPrediction(matchId);
        const { homeTeamId, awayTeamId } = prediction
            ? { homeTeamId: prediction.homeTeamId, awayTeamId: prediction.awayTeamId }
            : getMatchTeams(slot, context);

        return (
            <Match
                key={matchId}
                slot={slot}
                homeTeamId={homeTeamId}
                awayTeamId={awayTeamId}
                winnerTeamId={prediction?.winnerTeamId || null}
                onSelectWinner={(teamId) => onSelectWinner(matchId, teamId)}
                isReadOnly={isReadOnly}
                playoffMapping={playoffMapping}
                isFinal={isFinal}
            />
        );
    };

    // Split R32 and R16 into left/right halves
    const r32Left = R32_VISUAL_ORDER.slice(0, 8);
    const r32Right = R32_VISUAL_ORDER.slice(8, 16);
    const r16Left = R16_VISUAL_ORDER.slice(0, 4);
    const r16Right = R16_VISUAL_ORDER.slice(4, 8);
    const qfLeft = QF_VISUAL_ORDER.slice(0, 2);
    const qfRight = QF_VISUAL_ORDER.slice(2, 4);

    // Headers for the grid
    const stages = [
        { name: STAGE_NAMES.roundOf32, col: 1 },
        { name: STAGE_NAMES.roundOf16, col: 3 },
        { name: STAGE_NAMES.quarterFinals, col: 5 },
        { name: STAGE_NAMES.semiFinals, col: 7 },
        { name: 'Final', col: 9 }, // Center
        { name: STAGE_NAMES.semiFinals, col: 11 },
        { name: STAGE_NAMES.quarterFinals, col: 13 },
        { name: STAGE_NAMES.roundOf16, col: 15 },
        { name: STAGE_NAMES.roundOf32, col: 17 },
    ];

    return (
        <div className="w-full">
            {/* Legend - Moved to top for better visibility */}
            {!isReadOnly && (
                <div className="mb-4 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded border border-wc-green bg-wc-green/15" />
                        <span>Ganador</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded border border-gray-200 bg-white" />
                        <span>Clic para elegir</span>
                    </div>
                </div>
            )}

            {/* Bracket Grid */}
            <div className="overflow-x-auto pb-8 pt-4" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div
                    className="grid gap-x-1 min-w-[1080px] px-0"
                    style={{
                        gridTemplateColumns: '1fr 12px 1fr 12px 1fr 12px 1fr 12px 1fr 12px 1fr 12px 1fr 12px 1fr 12px 1fr',
                        gridTemplateRows: 'auto repeat(16, minmax(64px, auto))',
                    }}
                >
                    {/* Headers */}
                    {stages.map((stage, idx) => (
                        <div
                            key={`header-${idx}`}
                            style={{ gridColumn: stage.col, gridRow: 1 }}
                            className="text-center pb-4"
                        >
                            <span className={cn(
                                "text-[10px] font-bold uppercase tracking-wider",
                                stage.name.includes('Semy') || stage.name.includes('Final') ? "text-wc-blue dark:text-blue-400" : "text-wc-gray-dark dark:text-gray-400"
                            )}>
                                {stage.name}
                            </span>
                        </div>
                    ))}

                    {/* LEFT SIDE */}

                    {/* R32 Left (Col 1) */}
                    {r32Left.map((id, i) => (
                        <div key={id} style={{ gridColumn: 1, gridRow: `${i * 2 + 2} / span 2`, alignSelf: 'center' }}>
                            {renderMatch(id)}
                        </div>
                    ))}

                    {/* R16 Left (Col 3) */}
                    {r16Left.map((id, i) => (
                        <div key={id} style={{ gridColumn: 3, gridRow: `${i * 4 + 2} / span 4`, alignSelf: 'center' }}>
                            {renderMatch(id)}
                        </div>
                    ))}

                    {/* QF Left (Col 5) */}
                    {qfLeft.map((id, i) => (
                        <div key={id} style={{ gridColumn: 5, gridRow: `${i * 8 + 2} / span 8`, alignSelf: 'center' }}>
                            {renderMatch(id)}
                        </div>
                    ))}

                    {/* SF Left (Col 7) */}
                    <div style={{ gridColumn: 7, gridRow: '2 / span 16', alignSelf: 'center' }}>
                        {renderMatch('M101')}
                    </div>

                    {/* CENTER (Col 9) - Final & 3rd */}
                    {/* Final */}
                    <div style={{ gridColumn: 9, gridRow: '2 / span 16', alignSelf: 'center', justifySelf: 'center' }} className="flex flex-col items-center gap-8">
                        <div className="flex flex-col items-center">
                            <Trophy className="w-8 h-8 text-amber-500 mb-2 drop-shadow-sm" />
                            {renderMatch('M104', true)}
                        </div>

                        {/* 3rd Place */}
                        <div className="flex flex-col items-center mt-8">
                            <span className="text-[10px] font-bold text-amber-700 uppercase mb-1">🥉 {STAGE_NAMES.thirdPlace}</span>
                            {renderMatch('M103')}
                        </div>
                    </div>

                    {/* RIGHT SIDE */}

                    {/* SF Right (Col 11) */}
                    <div style={{ gridColumn: 11, gridRow: '2 / span 16', alignSelf: 'center' }}>
                        {renderMatch('M102')}
                    </div>

                    {/* QF Right (Col 13) */}
                    {qfRight.map((id, i) => (
                        <div key={id} style={{ gridColumn: 13, gridRow: `${i * 8 + 2} / span 8`, alignSelf: 'center' }}>
                            {renderMatch(id)}
                        </div>
                    ))}

                    {/* R16 Right (Col 15) */}
                    {r16Right.map((id, i) => (
                        <div key={id} style={{ gridColumn: 15, gridRow: `${i * 4 + 2} / span 4`, alignSelf: 'center' }}>
                            {renderMatch(id)}
                        </div>
                    ))}

                    {/* R32 Right (Col 17) */}
                    {r32Right.map((id, i) => (
                        <div key={id} style={{ gridColumn: 17, gridRow: `${i * 2 + 2} / span 2`, alignSelf: 'center' }}>
                            {renderMatch(id)}
                        </div>
                    ))}
                </div>
            </div>

            {/* Progress Bar - Moved to bottom */}
            {!isReadOnly && (
                <div className="mt-6 mx-auto max-w-2xl px-4">
                    <div className="flex items-center justify-between mb-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>Progreso del Bracket</span>
                        <span className={cn('font-bold', completedMatches === totalMatches ? 'text-wc-green' : 'text-wc-blue')}>
                            {Math.round((completedMatches / totalMatches) * 100)}%
                        </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-wc-green"
                            initial={{ width: '0%' }}
                            animate={{ width: `${(completedMatches / totalMatches) * 100}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
