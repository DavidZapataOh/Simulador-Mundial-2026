'use client';

import { useState } from 'react';
import { Share2, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
    title: string;
    text: string;
    url: string;
    file?: File | null;
    onGenerateFile?: () => Promise<File | null>;
    className?: string;
}

export function ShareButton({
    title,
    text,
    url,
    file,
    onGenerateFile,
    className,
}: ShareButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [buttonText, setButtonText] = useState('Compartir');
    const [icon, setIcon] = useState<'share' | 'check'>('share');

    const handleShare = async () => {
        if (isLoading) return;
        setIsLoading(true);

        try {
            // ---------------------------------------------------------
            // 1. Prepare Data (File + Text)
            // ---------------------------------------------------------
            let fileToShare = file;
            if (!fileToShare && onGenerateFile) {
                try {
                    fileToShare = await onGenerateFile();
                } catch (e) {
                    console.error("Error generating file:", e);
                }
            }

            const shareData: ShareData = {
                title,
                text,
                url,
            };

            // Only attach files if the browser supports it AND limits are met
            if (
                fileToShare &&
                typeof navigator.canShare === 'function' &&
                navigator.canShare({ files: [fileToShare] })
            ) {
                shareData.files = [fileToShare];
            }

            // ---------------------------------------------------------
            // 2. Attempt Native Share (Web Share API)
            // ---------------------------------------------------------
            if (typeof navigator.share === 'function') {
                try {
                    await navigator.share(shareData);
                    // Standard success flow
                    setIsLoading(false);
                    return;
                } catch (error: any) {
                    if (error.name === 'AbortError') {
                        // User closed the sheet naturally
                        setIsLoading(false);
                        return;
                    }
                    console.warn('Native share error, falling back to clipboard:', error);
                    // If native share explicitly fails (not just missing), we can try fallback
                }
            } else {
                console.warn('Navigator.share is not defined.');
            }

            // ---------------------------------------------------------
            // 3. Fallback: Clipboard (If Native Share is missing or failed)
            // ---------------------------------------------------------
            // This runs ONLY if navigator.share is missing from the browser
            // (e.g. Desktop, or HTTP non-secure context on mobile)

            await copyToClipboard(url);

            // Visual Feedback
            setButtonText('¡Enlace Copiado!');
            setIcon('check');

            // Helpful alert for the developer/user to know WHY simple copy happened
            // instead of the share sheet they expected.
            if (!window.isSecureContext) {
                alert('AVISO: El menú nativo de compartir requiere HTTPS. Se ha copiado el enlace en su lugar.');
            } else if (!navigator.share) {
                // Desktop or unsupported browser
                // standard subtle feedback is better here, no alert needed usually, 
                // but since the user demanded "NO trace of old system", we just leave the text feedback.
            }

            setTimeout(() => {
                setButtonText('Compartir');
                setIcon('share');
            }, 2500);

        } catch (error) {
            console.error('Final share error:', error);
            alert('No se pudo compartir automáticamente.');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Robust clipboard copier that works in both Secure and Non-Secure contexts
     */
    const copyToClipboard = async (text: string) => {
        // Try Modern API first
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            try {
                await navigator.clipboard.writeText(text);
                return;
            } catch (ignored) {
                // Fallthrough to legacy
            }
        }

        // Legacy API (TextArea hack)
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
        } catch (err) {
            throw new Error('Clipboard access denied');
        } finally {
            document.body.removeChild(textArea);
        }
    };

    return (
        <button
            onClick={handleShare}
            disabled={isLoading || icon === 'check'}
            className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 touch-manipulation",
                // Base colors
                "bg-gradient-to-r from-wc-blue to-blue-600 text-white shadow-blue-500/25 hover:shadow-blue-500/40",
                // Success state variant (optional, but nice)
                icon === 'check' && "from-green-600 to-green-500 shadow-green-500/25",
                // Disabled state
                "disabled:opacity-90 disabled:cursor-wait",
                className
            )}
        >
            {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
            ) : icon === 'check' ? (
                <Check className="h-5 w-5" />
            ) : (
                <Share2 className="h-5 w-5" />
            )}
            <span>{buttonText}</span>
        </button>
    );
}

// Global declaration to fix TS error if 'isSecureContext' is missing in older libs
declare global {
    interface Window {
        isSecureContext: boolean;
    }
}
