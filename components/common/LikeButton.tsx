'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';

interface LikeButtonProps {
    simulationId: string;
    initialCount: number;
    className?: string;
    onAuthRequired?: () => void;
}

async function voteForSimulation(simulationId: string, token: string): Promise<{ votes_count: number }> {
    const response = await fetch(`/api/simulations/${simulationId}/vote`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) {
        throw new Error('Failed to vote');
    }
    return response.json();
}

export function LikeButton({
    simulationId,
    initialCount,
    className,
    onAuthRequired,
}: LikeButtonProps) {
    const [count, setCount] = useState(initialCount);
    const [hasVoted, setHasVoted] = useState(false);
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No session');
            return voteForSimulation(simulationId, session.access_token);
        },
        onMutate: () => {
            // Optimistic update
            setCount((prev) => prev + 1);
            setHasVoted(true);
        },
        onSuccess: (data) => {
            setCount(data.votes_count);
            queryClient.invalidateQueries({ queryKey: ['simulations'] });
        },
        onError: () => {
            // Revert optimistic update
            setCount(initialCount);
            setHasVoted(false);
        },
    });

    const handleClick = async () => {
        if (hasVoted || mutation.isPending) return;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            onAuthRequired?.();
            return;
        }

        mutation.mutate();
    };

    return (
        <motion.button
            onClick={handleClick}
            disabled={hasVoted || mutation.isPending}
            className={cn(
                'relative flex items-center gap-2 rounded-xl px-4 py-2.5 font-medium transition-all',
                hasVoted
                    ? 'bg-wc-red/10 text-wc-red cursor-default'
                    : 'bg-gray-100 text-gray-600 hover:bg-wc-red/10 hover:text-wc-red',
                className
            )}
            whileHover={!hasVoted ? { scale: 1.05 } : undefined}
            whileTap={!hasVoted ? { scale: 0.95 } : undefined}
        >
            {/* Heart icon */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={hasVoted ? 'voted' : 'not-voted'}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                    <Heart
                        className={cn(
                            'h-5 w-5 transition-colors',
                            hasVoted ? 'fill-wc-red text-wc-red' : 'text-gray-500'
                        )}
                    />
                </motion.div>
            </AnimatePresence>

            {/* Count */}
            <AnimatePresence mode="wait">
                <motion.span
                    key={count}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="min-w-[1.5rem] text-center"
                >
                    {count}
                </motion.span>
            </AnimatePresence>

            {/* Burst animation on vote */}
            {hasVoted && (
                <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 rounded-xl border-2 border-wc-red"
                />
            )}
        </motion.button>
    );
}
