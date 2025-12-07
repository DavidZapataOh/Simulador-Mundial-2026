'use client';

import { forwardRef, useMemo } from 'react';
import { TEAMS, KNOCKOUT_MATCHES, R32_VISUAL_ORDER, R16_VISUAL_ORDER, QF_VISUAL_ORDER, Team, TeamId, getResolvedTeam, buildPlayoffMapping } from '@/lib/worldcup2026';
import { SimulationRow } from '@/lib/supabaseClient';
import { buildBracketContext, getMatchTeams } from '@/lib/bracket';
import { cn, getTeamFlagCode } from '@/lib/utils';
import * as Flags from 'country-flag-icons/react/3x2';
import { Trophy } from 'lucide-react';

interface SocialExportViewProps {
    simulation: SimulationRow & { profiles: { full_name: string; avatar_url: string } | null };
    avatarOverride?: string | null;
}

// Compact Match Component for the Export View
const ExportMatch = ({ slot, homeTeamId, awayTeamId, winnerTeamId, isFinal, playoffMapping }: any) => {
    const renderTeam = (teamId: string | null) => {
        if (!teamId) return <div className="h-5 w-full bg-white/5 rounded" />;
        const team = getResolvedTeam(teamId, playoffMapping);
        if (!team) return <div className="h-5 w-full bg-white/5 rounded" />;

        const FlagComponent = Flags[getTeamFlagCode(team) as keyof typeof Flags];
        const isWinner = winnerTeamId === teamId;
        const isLost = winnerTeamId && winnerTeamId !== teamId;

        return (
            <div className={cn(
                "flex items-center gap-2 px-2 py-1 rounded transition-all h-6",
                isWinner ? "bg-amber-400 text-wc-blue font-bold shadow-[0_0_10px_rgba(251,191,36,0.4)]" : "text-white/90",
                isLost && "opacity-50"
            )}>
                <div className="w-4 h-3 rounded overflow-hidden flex-shrink-0 shadow-sm">
                    {FlagComponent && <FlagComponent className="w-full h-full object-cover" />}
                </div>
                <span className="text-[10px] uppercase tracking-wide truncate">{team.shortName}</span>
            </div>
        );
    };

    return (
        <div className={cn("flex flex-col justify-center w-full relative", isFinal ? "scale-125" : "")}>
            <div className={cn(
                "flex flex-col border border-white/10 bg-black/20 backdrop-blur-sm rounded-md overflow-hidden shadow-lg",
                winnerTeamId ? "border-amber-400/30" : ""
            )}>
                {renderTeam(homeTeamId)}
                <div className="h-[1px] bg-white/5" />
                {renderTeam(awayTeamId)}
            </div>
        </div>
    );
};

export const SocialExportView = forwardRef<HTMLDivElement, SocialExportViewProps>(
    ({ simulation }, ref) => {
        const championTeam = TEAMS[simulation.champion_team_id];

        // Recompute context
        const context = useMemo(() => {
            return buildBracketContext(
                simulation.data.groupPredictions.map(gp => ({
                    groupId: gp.groupId as any,
                    orderedTeamIds: gp.orderedTeamIds
                })),
                simulation.data.advancingThirdPlaceTeams || [],
                simulation.data.knockoutPredictions
            );
        }, [simulation]);

        const playoffMapping = useMemo(() => {
            if (simulation.data.playoffMapping) return simulation.data.playoffMapping;
            if (simulation.data.playoffSelections) return buildPlayoffMapping(simulation.data.playoffSelections);
            return {};
        }, [simulation]);

        const getMatchData = (matchId: string) => {
            const slot = KNOCKOUT_MATCHES[matchId];
            const prediction = simulation.data.knockoutPredictions.find(p => p.matchId === matchId);
            const teams = prediction
                ? { homeTeamId: prediction.homeTeamId, awayTeamId: prediction.awayTeamId }
                : getMatchTeams(slot!, context);

            return {
                slot,
                ...teams,
                winnerTeamId: prediction?.winnerTeamId,
                playoffMapping
            };
        };

        const renderMatch = (matchId: string, isFinal = false) => <ExportMatch key={matchId} isFinal={isFinal} {...getMatchData(matchId)} />;

        // Slices for layout
        const r32Left = R32_VISUAL_ORDER.slice(0, 8);
        const r32Right = R32_VISUAL_ORDER.slice(8, 16);
        const r16Left = R16_VISUAL_ORDER.slice(0, 4);
        const r16Right = R16_VISUAL_ORDER.slice(4, 8);
        const qfLeft = QF_VISUAL_ORDER.slice(0, 2);
        const qfRight = QF_VISUAL_ORDER.slice(2, 4);

        return (
            <div
                ref={ref}
                className="w-[1080px] h-[1080px] bg-[#0F172A] text-white overflow-hidden relative font-sans flex flex-col items-center"
            >
                {/* Epico Background */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e293b,transparent)] opacity-80" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

                {/* Huge Glow behind Champion */}
                <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-[120px]" />

                {/* HEADER / CHAMPION SECTION (Top ~30%) */}
                <div className="relative z-10 w-full h-[320px] flex flex-col items-center justify-center pt-10 pb-2 gap-4">
                    <div className="text-amber-400 font-bold tracking-[0.4em] text-sm uppercase">Mundial 2026 Prediction</div>

                    {championTeam ? (
                        <div className="flex flex-col items-center relative gap-4">
                            {/* Epic Trophy overlay or effect */}
                            <div className="relative">
                                <div className="absolute inset-0 bg-amber-400/20 blur-xl rounded-full"></div>
                                <div className="w-20 h-14 rounded-lg overflow-hidden border-2 border-amber-400/50 shadow-[0_0_30px_rgba(251,191,36,0.3)] relative z-10">
                                    {(() => {
                                        const Flag = Flags[getTeamFlagCode(championTeam) as keyof typeof Flags];
                                        return Flag ? <Flag className="w-full h-full object-cover" /> : null;
                                    })()}
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-1">
                                <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/60 uppercase tracking-tighter drop-shadow-2xl">
                                    {championTeam.name}
                                </h1>
                                <div className="flex items-center gap-2 text-amber-300/80 font-medium tracking-widest text-base">
                                    <Trophy className="w-4 h-4" />
                                    <span>CAMPEÓN DEL MUNDO</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <h1 className="text-6xl font-black text-white/20">???</h1>
                    )}
                </div>

                {/* BRACKET SECTION (Bottom ~70%) */}
                <div className="relative z-10 w-full flex-1 px-12 pb-16 flex items-center justify-center">
                    <div
                        className="grid w-full h-full"
                        style={{
                            gridTemplateColumns: '1fr 12px 1fr 12px 1fr 12px 1fr 24px 1fr 24px 1fr 12px 1fr 12px 1fr 12px 1fr',
                            gridTemplateRows: 'repeat(16, 1fr)',
                        }}
                    >
                        {/* LEFT SIDE */}
                        {r32Left.map((id, i) => (
                            <div key={id} style={{ gridColumn: 1, gridRow: `${i * 2 + 1} / span 2`, alignSelf: 'center' }}>{renderMatch(id)}</div>
                        ))}
                        {r16Left.map((id, i) => (
                            <div key={id} style={{ gridColumn: 3, gridRow: `${i * 4 + 1} / span 4`, alignSelf: 'center' }}>{renderMatch(id)}</div>
                        ))}
                        {qfLeft.map((id, i) => (
                            <div key={id} style={{ gridColumn: 5, gridRow: `${i * 8 + 1} / span 8`, alignSelf: 'center' }}>{renderMatch(id)}</div>
                        ))}
                        <div style={{ gridColumn: 7, gridRow: '1 / span 16', alignSelf: 'center' }}>{renderMatch('M101')}</div>

                        {/* CENTER - FINAL MATCH LOGO or FINAL BOX */}
                        <div style={{ gridColumn: 9, gridRow: '1 / span 16', alignSelf: 'center', justifySelf: 'center' }} className="flex flex-col items-center justify-center gap-2 w-full">
                            {/* Final Match - Scale up slightly */}
                            {renderMatch('M104', true)}
                            <span className="text-[10px] text-amber-500/50 uppercase tracking-widest mt-2 font-bold text-center">Final<br />New York</span>
                        </div>

                        {/* RIGHT SIDE */}
                        <div style={{ gridColumn: 11, gridRow: '1 / span 16', alignSelf: 'center' }}>{renderMatch('M102')}</div>
                        {qfRight.map((id, i) => (
                            <div key={id} style={{ gridColumn: 13, gridRow: `${i * 8 + 1} / span 8`, alignSelf: 'center' }}>{renderMatch(id)}</div>
                        ))}
                        {r16Right.map((id, i) => (
                            <div key={id} style={{ gridColumn: 15, gridRow: `${i * 4 + 1} / span 4`, alignSelf: 'center' }}>{renderMatch(id)}</div>
                        ))}
                        {r32Right.map((id, i) => (
                            <div key={id} style={{ gridColumn: 17, gridRow: `${i * 2 + 1} / span 2`, alignSelf: 'center' }}>{renderMatch(id)}</div>
                        ))}

                    </div>
                </div>

                {/* Footer / Branding */}
                <div className="absolute bottom-6 font-mono text-[10px] text-white/20 uppercase tracking-[0.2em]">
                    simuladordelmundial2026.com
                </div>
            </div>
        );
    }
);

SocialExportView.displayName = 'SocialExportView';
