'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger',
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl"
            >
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div
                            className={cn(
                                'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full',
                                variant === 'danger' && 'bg-red-100 text-red-600',
                                variant === 'warning' && 'bg-amber-100 text-amber-600',
                                variant === 'info' && 'bg-blue-100 text-blue-600'
                            )}
                        >
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 leading-6">
                                {title}
                            </h3>
                            <p className="mt-2 text-sm text-gray-500">
                                {description}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={cn(
                            'flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md',
                            variant === 'danger' && 'bg-red-600 hover:bg-red-700',
                            variant === 'warning' && 'bg-amber-500 hover:bg-amber-600',
                            variant === 'info' && 'bg-blue-600 hover:bg-blue-700'
                        )}
                    >
                        {confirmText}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
