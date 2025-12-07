'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Home, BarChart3, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { LoginButton } from '@/components/auth/LoginButton';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

const navItems = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/simular', label: 'Simular', icon: PlusCircle },
    { href: '/top', label: 'Top Predicciones', icon: BarChart3 },
];

export function MainNav() {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 dark:border-white/10 bg-white/80 dark:bg-black/50 backdrop-blur-xl">
            <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-xl bg-wc-blue opacity-20 blur-lg group-hover:opacity-40 transition-opacity" />
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-wc-blue shadow-lg">
                            <Trophy className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    <div className="hidden sm:flex flex-col">
                        <span className="sm:text-lg font-bold text-wc-blue">
                            Mundial 2026
                        </span>
                        <span className="sm:text-[10px] font-medium text-gray-500 dark:text-gray-400 -mt-0.5 tracking-wider uppercase">
                            Simulador
                        </span>
                    </div>
                </Link>

                {/* Navigation Links */}
                <div className="flex items-center gap-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/' && pathname.startsWith(item.href));
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
                                    isActive
                                        ? 'text-wc-blue'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/10'
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="hidden sm:inline">{item.label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-indicator"
                                        className="absolute inset-0 rounded-xl bg-wc-blue/10 -z-10"
                                        transition={{ type: 'spring', duration: 0.5 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                    {/* Login Button */}
                    <div className="ml-4 pl-4 border-l border-gray-200 dark:border-white/10 flex items-center gap-3">
                        <ThemeToggle />
                        <LoginButton />
                    </div>
                </div>
            </nav>
        </header>
    );
}
