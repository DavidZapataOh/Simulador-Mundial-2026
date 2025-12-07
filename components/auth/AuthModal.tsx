'use client';

import { motion } from 'framer-motion';
import { X, Trophy, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
    if (!isOpen) return null;

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="flex flex-col items-center p-8 text-center">
                    {/* Icon */}
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-wc-blue/10">
                        <Trophy className="h-10 w-10 text-wc-blue" />
                    </div>

                    <h2 className="mb-2 text-2xl font-bold text-gray-900">
                        Inicia Sesión
                    </h2>
                    <p className="mb-8 text-gray-500">
                        Para guardar y compartir tu predicción del Mundial 2026 necesitas iniciar sesión.
                    </p>

                    <button
                        onClick={handleLogin}
                        className="flex w-full items-center justify-center gap-3 rounded-xl bg-white border-2 border-gray-200 px-6 py-3.5 font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-300"
                    >
                        <img
                            src="https://www.svgrepo.com/show/475656/google-color.svg"
                            alt="Google"
                            className="h-5 w-5"
                        />
                        Continuar con Google
                    </button>

                    <div className="mt-6 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                        <AlertCircle className="h-4 w-4" />
                        <span>¡Es rápido, seguro y gratis!</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
