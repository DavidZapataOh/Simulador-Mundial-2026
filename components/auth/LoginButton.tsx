'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function LoginButton() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    if (loading) {
        return (
            <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-100" />
        );
    }

    if (user) {
        return (
            <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                    <span className="text-xs font-medium text-gray-700">
                        {user.user_metadata.full_name}
                    </span>
                    <span className="text-[10px] text-gray-500">
                        Sesión iniciada
                    </span>
                </div>

                <div className="group relative">
                    <button className="h-9 w-9 overflow-hidden rounded-full border border-gray-200 bg-gray-50 shadow-sm transition-all hover:ring-2 hover:ring-wc-blue/20">
                        {user.user_metadata.avatar_url ? (
                            <Image
                                src={user.user_metadata.avatar_url}
                                alt="Profile"
                                width={36}
                                height={36}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-wc-blue/10 text-wc-blue">
                                <UserIcon className="h-5 w-5" />
                            </div>
                        )}
                    </button>

                    {/* Logout Dropdown */}
                    <div className="absolute right-0 top-full mt-2 w-32 origin-top-right scale-95 opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto pt-2">
                        <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs font-medium text-red-600 shadow-lg"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={handleLogin}
            className={cn(
                "flex items-center gap-2 rounded-xl bg-wc-blue px-4 py-2 text-sm font-semibold text-white",
                "shadow-lg shadow-wc-blue/20 transition-all hover:bg-wc-blue/90 hover:scale-105"
            )}
        >
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">Iniciar Sesión</span>
            <span className="sm:hidden">Login</span>
        </button>
    );
}
