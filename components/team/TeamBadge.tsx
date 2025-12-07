'use client';

import { TeamId, TEAMS } from '@/lib/worldcup2026';
import { cn } from '@/lib/utils';

// Import flags from country-flag-icons
import * as Flags from 'country-flag-icons/react/3x2';

interface TeamBadgeProps {
    teamId: TeamId;
    size?: 'sm' | 'md' | 'lg';
    showName?: boolean;
    showShortName?: boolean;
    isSelected?: boolean;
    isWinner?: boolean;
    onClick?: () => void;
    className?: string;
}

// Map special flag codes to actual components
function getFlagComponent(flagCode: string): React.ComponentType<{ className?: string }> | null {
    // Handle special codes
    const codeMap: Record<string, string> = {
        'GB-ENG': 'GB', // England uses GB flag (could use a custom flag)
        'GB-SCT': 'GB', // Scotland uses GB flag
        'EU': 'EU',     // European Union placeholder
        'UN': 'UN',     // United Nations placeholder
        'CW': 'NL',     // Curaçao - use Netherlands as fallback
    };

    const actualCode = codeMap[flagCode] || flagCode;

    // @ts-expect-error - Dynamic access to Flags
    return Flags[actualCode] || null;
}

export function TeamBadge({
    teamId,
    size = 'md',
    showName = true,
    showShortName = false,
    isSelected = false,
    isWinner = false,
    onClick,
    className,
}: TeamBadgeProps) {
    const team = TEAMS[teamId];

    if (!team) {
        return null;
    }

    const FlagComponent = getFlagComponent(team.flagCode);

    const sizeClasses = {
        sm: 'h-8 px-2 gap-1.5',
        md: 'h-10 px-3 gap-2',
        lg: 'h-12 px-4 gap-3',
    };

    const flagSizeClasses = {
        sm: 'w-5 h-3.5',
        md: 'w-6 h-4',
        lg: 'w-8 h-5',
    };

    const textSizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
    };

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!onClick}
            className={cn(
                'flex items-center rounded-lg border transition-all duration-200',
                sizeClasses[size],
                onClick && 'cursor-pointer hover:shadow-md active:scale-[0.98]',
                !onClick && 'cursor-default',
                isWinner
                    ? 'border-wc-green bg-wc-green/10 shadow-sm shadow-wc-green/20'
                    : isSelected
                        ? 'border-wc-red bg-wc-red/5 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300',
                className
            )}
        >
            {/* Flag */}
            <div
                className={cn(
                    'flex-shrink-0 rounded overflow-hidden shadow-sm',
                    flagSizeClasses[size]
                )}
            >
                {FlagComponent ? (
                    <FlagComponent className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-gray-500">
                            {team.shortName.slice(0, 2)}
                        </span>
                    </div>
                )}
            </div>

            {/* Team name */}
            {(showName || showShortName) && (
                <span
                    className={cn(
                        'font-medium truncate',
                        textSizeClasses[size],
                        isWinner ? 'text-wc-green' : 'text-gray-700'
                    )}
                >
                    {showShortName ? team.shortName : team.name}
                </span>
            )}

            {/* Winner indicator */}
            {isWinner && (
                <span className="ml-auto text-wc-green">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                        />
                    </svg>
                </span>
            )}
        </button>
    );
}

// Compact version for bracket display
export function TeamBadgeCompact({
    teamId,
    isWinner = false,
    onClick,
    className,
}: {
    teamId: TeamId | null;
    isWinner?: boolean;
    onClick?: () => void;
    className?: string;
}) {
    if (!teamId) {
        return (
            <div
                className={cn(
                    'flex items-center gap-2 h-9 px-2.5 rounded-md border border-dashed border-gray-300 bg-gray-50',
                    className
                )}
            >
                <div className="w-5 h-3.5 rounded bg-gray-200" />
                <span className="text-xs text-gray-400">Por definir</span>
            </div>
        );
    }

    const team = TEAMS[teamId];
    if (!team) return null;

    const FlagComponent = getFlagComponent(team.flagCode);

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!onClick}
            className={cn(
                'flex items-center gap-2 h-9 px-2.5 rounded-md border transition-all duration-200',
                onClick && 'cursor-pointer hover:shadow-md active:scale-[0.98]',
                !onClick && 'cursor-default',
                isWinner
                    ? 'border-wc-green bg-wc-green/10 ring-2 ring-wc-green/30'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
                className
            )}
        >
            <div className="w-5 h-3.5 rounded overflow-hidden shadow-sm flex-shrink-0">
                {FlagComponent ? (
                    <FlagComponent className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                )}
            </div>
            <span
                className={cn(
                    'text-xs font-semibold',
                    isWinner ? 'text-wc-green' : 'text-gray-700'
                )}
            >
                {team.shortName}
            </span>
        </button>
    );
}
