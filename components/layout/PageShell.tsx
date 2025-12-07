import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

interface PageShellProps {
    children: ReactNode;
    className?: string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
    paddingY?: 'none' | 'sm' | 'md' | 'lg';
}

const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
};

const paddingYClasses = {
    none: '',
    sm: 'py-6',
    md: 'py-10',
    lg: 'py-16',
};

export function PageShell({
    children,
    className,
    maxWidth = '7xl',
    paddingY = 'md',
}: PageShellProps) {
    return (
        <main
            className={cn(
                'mx-auto w-full px-4 sm:px-6 lg:px-8 relative z-10',
                maxWidthClasses[maxWidth],
                paddingYClasses[paddingY],
                className
            )}
        >
            {/* Global Dark Mode Background Layers - Matches SocialExportView */}
            <div className="fixed inset-0 -z-10 pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-500">
                {/* 1. Base Gradient */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e293b,transparent)] opacity-80" />
                {/* 2. Noise Texture */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                {/* 3. Top Glow (Amber/Blue hint) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-wc-blue/5 rounded-full blur-[120px]" />
            </div>

            {children}
        </main>
    );
}
