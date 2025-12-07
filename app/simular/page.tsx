'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Save, Loader2, RotateCcw } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

import { PageShell } from '@/components/layout/PageShell';
import { StepHeader } from '@/components/simulation/StepHeader';
import { PlayoffSelector } from '@/components/simulation/PlayoffSelector';
import { GroupCard } from '@/components/simulation/GroupCard';
import { ThirdPlaceSelector } from '@/components/simulation/ThirdPlaceSelector';
import { BracketView } from '@/components/bracket/BracketView';
import { ChampionHighlight } from '@/components/simulation/ChampionHighlight';
import { supabase } from '@/lib/supabaseClient';
import { AuthModal } from '@/components/auth/AuthModal';
import { ConfirmModal } from '@/components/common/ConfirmModal';

import { useSimulationDraftStore } from '@/store/simulationDraft';
import { GROUPS } from '@/lib/worldcup2026';
import { cn } from '@/lib/utils';

interface CreateSimulationPayload {
    name: string;
    playoffSelections: Array<{ playoffId: string; selectedTeamId: string }>;
    groupPredictions: Array<{ groupId: string; orderedTeamIds: string[] }>;
    advancingThirdPlaceTeams: string[];
    knockoutPredictions: Array<{
        matchId: string;
        homeTeamId: string;
        awayTeamId: string;
        winnerTeamId: string;
    }>;
    championTeamId: string;
    userId?: string;
}

async function createSimulation(payload: CreateSimulationPayload, token: string) {
    const response = await fetch('/api/simulations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        throw new Error('Failed to create simulation');
    }
    return response.json();
}

const stepDescriptions = {
    0: 'Selecciona los ganadores de cada partido de repechaje.',
    1: 'Ordena los equipos de cada grupo del 1° al 4° lugar.',
    2: 'Selecciona los 8 mejores terceros que clasificarán.',
    3: 'Elige los ganadores de cada partido hasta la final.',
};

export default function SimularPage() {
    const router = useRouter();
    const [simulationName, setSimulationName] = useState('');
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [mounted, setMounted] = useState(false);

    const {
        step,
        setStep,
        playoffSelections,
        setPlayoffWinner,
        groupPredictions,
        setGroupPrediction,
        advancingThirdPlaceTeams,
        toggleThirdPlaceTeam,
        knockoutPredictions,
        setKnockoutMatchWinner,
        initializeKnockout,
        isStep0Complete,
        isStep1Complete,
        isStep2Complete,
        isStep3Complete,
        getChampionTeamId,
        getPlayoffMapping,
        getTeamDisplayName,
        getTeamShortName,
        getTeamFlagCode,
        reset,
    } = useSimulationDraftStore();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Initialize knockout when entering step 3
    useEffect(() => {
        if (mounted && step === 3 && knockoutPredictions.length === 0 && advancingThirdPlaceTeams.length === 8) {
            initializeKnockout();
        }
    }, [mounted, step, knockoutPredictions.length, advancingThirdPlaceTeams.length, initializeKnockout]);

    const mutation = useMutation({
        mutationFn: ({ payload, token }: { payload: CreateSimulationPayload; token: string }) =>
            createSimulation(payload, token),
        onSuccess: (data) => {
            reset();
            router.push(`/simulaciones/${data.id}`);
        },
    });

    const handleNextStep = () => {
        if (step === 0) {
            setStep(1);
        } else if (step === 1 && isStep1Complete()) {
            setStep(2);
        } else if (step === 2 && isStep2Complete()) {
            setStep(3);
        }
    };

    const handlePrevStep = () => {
        if (step === 1) setStep(0);
        if (step === 2) setStep(1);
        if (step === 3) setStep(2);
    };

    const handleSaveClick = async () => {
        // 1. Check Auth first
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setShowAuthModal(true);
            return;
        }

        // 2. Open Save Dialog (Name Input)
        setShowSaveDialog(true);
    };

    const performSave = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const championTeamId = getChampionTeamId();
        if (!championTeamId) return;

        mutation.mutate({
            payload: {
                name: simulationName || 'Mi Predicción',
                playoffSelections,
                groupPredictions,
                advancingThirdPlaceTeams,
                knockoutPredictions,
                championTeamId,
                userId: session.user.id,
            },
            token: session.access_token,
        });

        setShowSaveDialog(false);
    };

    const canGoNext =
        step === 0 || // Step 0 always completable
        (step === 1 && isStep1Complete()) ||
        (step === 2 && isStep2Complete());

    const canSave = step === 3 && isStep3Complete();

    if (!mounted) {
        return (
            <PageShell>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-wc-blue" />
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell paddingY="md">
            {/* Header */}
            <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                        Crea tu Predicción
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {stepDescriptions[step as keyof typeof stepDescriptions]}
                    </p>
                </div>
                <button
                    onClick={() => setShowResetConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 transition-colors flex-shrink-0 mt-1"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reiniciar</span>
                </button>
            </div>

            {/* Progress stepper */}
            <StepHeader
                currentStep={step}
                step0Complete={isStep0Complete()}
                step1Complete={isStep1Complete()}
                step2Complete={isStep2Complete()}
                step3Complete={isStep3Complete()}
            />

            {/* Content */}
            <AnimatePresence mode="wait">
                {/* Step 0: Playoff Winners */}
                {step === 0 && (
                    <motion.div
                        key="step0"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <PlayoffSelector
                            playoffSelections={playoffSelections}
                            onSelectWinner={setPlayoffWinner}
                        />
                    </motion.div>
                )}

                {/* Step 1: Groups */}
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {GROUPS.map((group, index) => {
                                const prediction = groupPredictions.find(
                                    (gp) => gp.groupId === group.id
                                );
                                return (
                                    <motion.div
                                        key={group.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                    >
                                        <GroupCard
                                            groupId={group.id}
                                            groupName={group.name}
                                            orderedTeamIds={prediction?.orderedTeamIds || group.teams}
                                            onOrderChange={(newOrder) =>
                                                setGroupPrediction(group.id, newOrder)
                                            }
                                            playoffMapping={getPlayoffMapping()}
                                        />
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Step 2: Third Place Selection */}
                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ThirdPlaceSelector
                            groupPredictions={groupPredictions}
                            selectedTeams={advancingThirdPlaceTeams}
                            onToggleTeam={toggleThirdPlaceTeam}
                            playoffMapping={getPlayoffMapping()}
                        />
                    </motion.div>
                )}

                {/* Step 3: Knockout Bracket */}
                {step === 3 && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-8"
                    >
                        {/* Champion highlight */}
                        {getChampionTeamId() && (
                            <div className="flex justify-center">
                                <ChampionHighlight teamId={getChampionTeamId()} />
                            </div>
                        )}

                        {/* Bracket */}
                        <BracketView
                            groupPredictions={groupPredictions}
                            advancingThirdPlaceTeams={advancingThirdPlaceTeams}
                            knockoutPredictions={knockoutPredictions}
                            onSelectWinner={setKnockoutMatchWinner}
                            playoffMapping={getPlayoffMapping()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="sticky bottom-0 left-0 right-0 mt-8 py-4 bg-gradient-to-t from-background via-background to-transparent">
                <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto">
                    {/* Back button */}
                    <button
                        onClick={handlePrevStep}
                        disabled={step === 0}
                        className={cn(
                            'flex items-center gap-2 rounded-xl px-6 py-3 font-medium transition-all',
                            step === 0
                                ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
                                : 'text-gray-600 dark:text-gray-300 hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800'
                        )}
                    >
                        <ArrowLeft className="h-5 w-5" />
                        Anterior
                    </button>

                    {/* Next / Save button */}
                    {step < 3 ? (
                        <button
                            onClick={handleNextStep}
                            disabled={!canGoNext}
                            className={cn(
                                'flex items-center gap-2 rounded-xl px-8 py-3 font-semibold transition-all',
                                canGoNext
                                    ? 'bg-wc-blue text-white shadow-lg shadow-wc-blue/30 hover:shadow-xl hover:shadow-wc-blue/40 hover:scale-105'
                                    : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                            )}
                        >
                            {step === 0 ? 'Continuar' : 'Siguiente'}
                            <ArrowRight className="h-5 w-5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSaveClick}
                            disabled={!canSave}
                            className={cn(
                                'flex items-center gap-2 rounded-xl px-8 py-3 font-semibold transition-all',
                                canSave
                                    ? 'bg-wc-blue text-white shadow-lg shadow-wc-blue/30 hover:shadow-xl hover:shadow-wc-blue/40 hover:scale-105'
                                    : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                            )}
                        >
                            <Save className="h-5 w-5" />
                            Guardar y Compartir
                        </button>
                    )}
                </div>
            </div>

            {/* Save Dialog */}
            <AnimatePresence>
                {showSaveDialog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => setShowSaveDialog(false)}
                    >
                        <motion.div
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border"
                        >
                            <h2 className="text-xl font-bold text-foreground mb-4">
                                Guardar Predicción
                            </h2>

                            <div className="mb-6">
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                                >
                                    Nombre de tu predicción (opcional)
                                </label>
                                <input
                                    id="name"
                                    value={simulationName}
                                    onChange={(e) => setSimulationName(e.target.value)}
                                    placeholder="Ej: Mi predicción Argentina campeón"
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-foreground placeholder-gray-400 focus:border-wc-blue focus:ring-2 focus:ring-wc-blue/20 outline-none transition-all"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowSaveDialog(false)}
                                    className="flex-1 rounded-xl border border-gray-200 px-4 py-3 font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={performSave}
                                    disabled={mutation.isPending}
                                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-wc-blue px-4 py-3 font-semibold text-white hover:bg-wc-blue/90 transition-colors disabled:opacity-50"
                                >
                                    {mutation.isPending ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-5 w-5" />
                                            Guardar
                                        </>
                                    )}
                                </button>
                            </div>

                            {mutation.isError && (
                                <p className="mt-4 text-sm text-red-600 text-center">
                                    Error al guardar. Por favor intenta de nuevo.
                                </p>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Authentication Modal */}
            <AnimatePresence>
                {showAuthModal && (
                    <AuthModal
                        isOpen={showAuthModal}
                        onClose={() => setShowAuthModal(false)}
                    />
                )}
            </AnimatePresence>

            {/* Reset Confirmation Modal */}
            <AnimatePresence>
                {showResetConfirm && (
                    <ConfirmModal
                        isOpen={showResetConfirm}
                        onClose={() => setShowResetConfirm(false)}
                        onConfirm={reset}
                        title="¿Reiniciar simulación?"
                        description="Se borrarán todas tus predicciones actuales y volverás al inicio. Esta acción no se puede deshacer."
                        confirmText="Reiniciar"
                        variant="danger"
                    />
                )}
            </AnimatePresence>
        </PageShell>
    );
}
