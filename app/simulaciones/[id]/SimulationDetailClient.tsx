'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Trophy, Loader2, Download } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { ChampionHighlight } from '@/components/simulation/ChampionHighlight';
import { BracketView } from '@/components/bracket/BracketView';
import { ShareButton } from '@/components/share/ShareButton';
import { LikeButton } from '@/components/common/LikeButton';
import { AuthModal } from '@/components/auth/AuthModal';
import { SimulationRow } from '@/lib/supabaseClient';
import { SocialExportView } from '@/components/share/SocialExportView';
import { TEAMS, GroupPrediction, KnockoutMatchPrediction, buildPlayoffMapping, getResolvedTeam } from '@/lib/worldcup2026';
import { formatDate, getTeamFlagCode } from '@/lib/utils';
import * as Flags from 'country-flag-icons/react/3x2';
import { toPng } from 'html-to-image';
import download from 'downloadjs';

interface SimulationDetailClientProps {
    simulation: SimulationRow & { profiles: { full_name: string; avatar_url: string } | null };
}

export function SimulationDetailClient({ simulation }: SimulationDetailClientProps) {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [avatarOverride, setAvatarOverride] = useState<string | null>(null);
    const exportRef = useRef<HTMLDivElement>(null);

    const championTeam = TEAMS[simulation.champion_team_id];
    const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/simulaciones/${simulation.id}`
        : '';
    const shareTitle = simulation.name
        ? `${simulation.name} - Mi predicción del Mundial 2026`
        : `${championTeam?.name || 'Campeón'} - Mi predicción del Mundial 2026`;

    // Parse simulation data
    const groupPredictions: GroupPrediction[] = simulation.data.groupPredictions.map(gp => ({
        groupId: gp.groupId as GroupPrediction['groupId'],
        orderedTeamIds: gp.orderedTeamIds,
    }));

    const knockoutPredictions: KnockoutMatchPrediction[] = simulation.data.knockoutPredictions;
    const advancingThirdPlaceTeams = simulation.data.advancingThirdPlaceTeams;

    // Derive playoff mapping to resolve slot IDs to actual teams (e.g. playoff-3-slot -> ita)
    const playoffMapping = simulation.data.playoffMapping ||
        (simulation.data.playoffSelections ? buildPlayoffMapping(simulation.data.playoffSelections) : {});

    const generateImageBlob = async (): Promise<Blob | null> => {
        if (!exportRef.current) return null;

        try {
            setIsGeneratingImage(true);

            // 1. Prepare Avatar: Convert remote URL to Base64 to bypass CORS issues in html-to-image
            let safeAvatar: string | null = null;
            if (simulation.profiles?.avatar_url) {
                try {
                    const response = await fetch(simulation.profiles.avatar_url, { mode: 'cors' });
                    if (response.ok) {
                        const blob = await response.blob();
                        safeAvatar = await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.readAsDataURL(blob);
                        });
                    }
                } catch (e) {
                    console.warn('Could not fetch avatar for export (likely CORS), falling back to initials.', e);
                    safeAvatar = null;
                }
            }
            setAvatarOverride(safeAvatar);
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Generate Blob
            const blob = await toPng(exportRef.current, {
                quality: 1.0,
                pixelRatio: 2,
                cacheBust: true,
            }).then(dataUrl => fetch(dataUrl).then(res => res.blob()));

            return blob;

        } catch (error) {
            console.error('Failed to generate image', error);
            return null;
        } finally {
            setIsGeneratingImage(false);
            setAvatarOverride(null);
        }
    };

    const handleDownloadImage = async () => {
        const blob = await generateImageBlob();
        if (blob) {
            download(blob, `prediccion-mundial-${simulation.id}.png`, 'image/png');
        } else {
            alert('No se pudo generar la imagen para descargar.');
        }
    };

    const handleGenerateFile = async (): Promise<File | null> => {
        const blob = await generateImageBlob();
        if (!blob) {
            alert('No se pudo generar la imagen para compartir.');
            return null;
        }
        return new File([blob], `prediccion-mundial-${simulation.id}.png`, { type: 'image/png' });
    };

    return (
        <PageShell paddingY="md">
            {/* Hidden Export View - Using the override if set */}
            <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -50, opacity: 0, pointerEvents: 'none' }}>
                <SocialExportView
                    ref={exportRef}
                    simulation={simulation}
                    avatarOverride={avatarOverride}
                />
            </div>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            {simulation.name || 'Predicción del Mundial 2026'}
                        </h1>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                {formatDate(simulation.created_at)}
                            </div>
                            {championTeam && (
                                <div className="flex items-center gap-1.5">
                                    <Trophy className="h-4 w-4 text-amber-500" />
                                    <span>Campeón: <strong className="text-gray-700 dark:text-gray-200">{championTeam.name}</strong></span>
                                </div>
                            )}
                        </div>
                        {simulation.profiles && (
                            <div className="mt-3 flex items-center gap-2">
                                <div className="h-6 w-6 overflow-hidden rounded-full bg-gray-100">
                                    {simulation.profiles.avatar_url ? (
                                        <img
                                            src={simulation.profiles.avatar_url}
                                            alt={simulation.profiles.full_name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-wc-blue text-[10px] font-bold text-white">
                                            {simulation.profiles.full_name?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Por {simulation.profiles.full_name}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <LikeButton
                            simulationId={simulation.id}
                            initialCount={simulation.votes_count}
                            onAuthRequired={() => setShowAuthModal(true)}
                        />
                        <button
                            onClick={handleDownloadImage}
                            disabled={isGeneratingImage}
                            className="flex items-center gap-2 rounded-xl bg-wc-blue text-white px-4 py-2.5 font-medium hover:bg-wc-blue/90 transition-all shadow-sm disabled:opacity-70 disabled:cursor-wait"
                        >
                            {isGeneratingImage ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4" />
                            )}
                            <span className="hidden sm:inline">Guardar Imagen</span>
                        </button>
                        <ShareButton
                            url={shareUrl}
                            title={shareTitle}
                            text="¡Mira mi predicción del Mundial 2026! 🏆⚽"
                            onGenerateFile={handleGenerateFile}
                        />
                    </div>
                </div>
            </motion.div>

            {/* Champion */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="flex justify-center mb-12"
            >
                <ChampionHighlight teamId={simulation.champion_team_id} />
            </motion.div>

            {/* Bracket */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                    Bracket Completo
                </h2>
                <BracketView
                    groupPredictions={groupPredictions}
                    advancingThirdPlaceTeams={advancingThirdPlaceTeams}
                    knockoutPredictions={knockoutPredictions}
                    onSelectWinner={() => { }} // Read-only
                    isReadOnly
                    playoffMapping={playoffMapping}
                />
            </motion.div>

            {/* Group predictions summary */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-12"
            >
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                    Predicciones de Grupos
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {groupPredictions.map((gp) => (
                        <div
                            key={gp.groupId}
                            className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 dark:backdrop-blur-sm p-4"
                        >
                            <h3 className="text-sm font-bold text-wc-blue dark:text-blue-400 mb-3">
                                Grupo {gp.groupId}
                            </h3>
                            <div className="space-y-1.5">
                                {gp.orderedTeamIds.map((teamId, index) => {
                                    const team = getResolvedTeam(teamId, playoffMapping);
                                    if (!team) return null;
                                    const FlagComponent = Flags[getTeamFlagCode(team) as keyof typeof Flags];
                                    return (
                                        <div
                                            key={teamId}
                                            className="flex items-center gap-2 text-xs"
                                        >
                                            <span
                                                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[10px] font-bold text-white ${index === 0
                                                    ? 'bg-wc-green'
                                                    : index === 1
                                                        ? 'bg-wc-blue'
                                                        : index === 2
                                                            ? 'bg-amber-500'
                                                            : 'bg-gray-400'
                                                    }`}
                                            >
                                                {index + 1}
                                            </span>
                                            <div className="h-4 w-6 flex-shrink-0 overflow-hidden rounded shadow-sm border border-gray-100 dark:border-white/10">
                                                {FlagComponent ? <FlagComponent className="h-full w-full object-cover" /> : null}
                                            </div>
                                            <span className="text-gray-700 dark:text-gray-300 truncate">
                                                {team.shortName}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Share CTA */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-12 text-center py-8 rounded-2xl bg-gradient-to-r from-wc-blue/5 via-wc-red/5 to-wc-green/5 dark:from-wc-blue/10 dark:via-wc-red/10 dark:to-wc-green/10 border border-transparent dark:border-white/5"
            >
                <p className="text-gray-600 dark:text-gray-300 mb-4">¿Te gusta esta predicción? ¡Compártela!</p>
                <div className="flex justify-center">
                    <ShareButton
                        url={shareUrl}
                        title={shareTitle}
                        text="¡Mira mi predicción del Mundial 2026! 🏆⚽"
                        onGenerateFile={handleGenerateFile}
                    />
                </div>
            </motion.div>
            {/* Authentication Modal */}
            <AnimatePresence>
                {showAuthModal && (
                    <AuthModal
                        isOpen={showAuthModal}
                        onClose={() => setShowAuthModal(false)}
                    />
                )}
            </AnimatePresence>
        </PageShell>
    );
}
