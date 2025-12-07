'use client';
import { motion } from 'framer-motion';
import { Check, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepHeaderProps {
    currentStep: 0 | 1 | 2 | 3;
    onStepClick?: (step: 0 | 1 | 2 | 3) => void;
    step0Complete?: boolean;
    step1Complete?: boolean;
    step2Complete?: boolean;
    step3Complete?: boolean;
}

const steps = [
    { number: 0, label: 'Repechaje', shortLabel: 'Playoff' },
    { number: 1, label: 'Grupos', shortLabel: 'Grupos' },
    { number: 2, label: 'Mejores Terceros', shortLabel: 'Terceros' },
    { number: 3, label: 'Eliminación Directa', shortLabel: 'Bracket' },
] as const;

export function StepHeader({
    currentStep,
    onStepClick,
    step0Complete = false,
    step1Complete = false,
    step2Complete = false,
    step3Complete = false,
}: StepHeaderProps) {
    const completionMap = {
        0: step0Complete,
        1: step1Complete,
        2: step2Complete,
        3: step3Complete,
    };

    // Calculate progress percentage based on current step
    const getProgressWidth = () => {
        switch (currentStep) {
            case 0: return '0%';
            case 1: return '33%';
            case 2: return '66%';
            case 3: return '100%';
            default: return '0%';
        }
    };

    return (
        <div className="w-full mb-8">
            <div className="relative">
                {/* Progress line */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-white/10">
                    <motion.div
                        className="h-full bg-gradient-to-r from-wc-red via-wc-blue to-wc-green"
                        initial={{ width: '0%' }}
                        animate={{ width: getProgressWidth() }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                </div>

                {/* Steps */}
                <div className="relative flex justify-between">
                    {steps.map((step) => {
                        const isActive = currentStep === step.number;
                        const isCompleted = completionMap[step.number as 0 | 1 | 2 | 3];
                        const isPast = step.number < currentStep;

                        return (
                            <button
                                key={step.number}
                                onClick={() => onStepClick?.(step.number as 0 | 1 | 2 | 3)}
                                disabled={!onStepClick}
                                className={cn(
                                    'flex flex-col items-center gap-2 group',
                                    onStepClick && 'cursor-pointer'
                                )}
                            >
                                {/* Step circle */}
                                <motion.div
                                    className={cn(
                                        'relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300',
                                        isActive
                                            ? 'border-wc-blue bg-wc-blue text-white shadow-lg shadow-wc-blue/30'
                                            : isPast || isCompleted
                                                ? 'border-wc-green bg-wc-green text-white'
                                                : 'border-gray-300 dark:border-white/10 bg-white dark:bg-black/40 text-gray-500 dark:text-gray-400'
                                    )}
                                    whileHover={onStepClick ? { scale: 1.1 } : undefined}
                                    whileTap={onStepClick ? { scale: 0.95 } : undefined}
                                >
                                    {isPast || isCompleted ? (
                                        <Check className="h-5 w-5" />
                                    ) : (
                                        <span className="text-sm font-bold">{step.number}</span>
                                    )}

                                    {/* Active glow */}
                                    {isActive && (
                                        <motion.div
                                            className="absolute inset-0 rounded-full bg-wc-blue"
                                            initial={{ opacity: 0.5, scale: 1 }}
                                            animate={{ opacity: 0, scale: 1.5 }}
                                            transition={{
                                                duration: 1.5,
                                                repeat: Infinity,
                                                ease: 'easeOut',
                                            }}
                                        />
                                    )}
                                </motion.div>

                                {/* Step label */}
                                <span
                                    className={cn(
                                        'text-xs sm:text-sm font-medium transition-colors',
                                        isActive
                                            ? 'text-wc-blue'
                                            : isPast || isCompleted
                                                ? 'text-wc-green'
                                                : 'text-gray-500 dark:text-gray-400'
                                    )}
                                >
                                    <span className="hidden sm:inline">{step.label}</span>
                                    <span className="sm:hidden">{step.shortLabel}</span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
