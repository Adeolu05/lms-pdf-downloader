'use client';

import React from 'react';
import { Header } from './Header';
import { cn } from '@/components/ui';

interface AppShellProps {
    children: React.ReactNode;
    headerAction?: React.ReactNode;
    className?: string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const AppShell = ({
    children,
    headerAction,
    className,
    maxWidth = 'lg'
}: AppShellProps) => {
    const maxWidthClasses = {
        sm:   'max-w-2xl',
        md:   'max-w-3xl',
        lg:   'max-w-5xl',
        xl:   'max-w-7xl',
        full: 'max-w-full',
    };

    return (
        <div className="min-h-screen flex flex-col bg-background text-body font-sans selection:bg-mint/40">
            <Header action={headerAction} />

            <main className={cn(
                "flex-1 w-full mx-auto px-5 sm:px-8 py-10 md:py-14",
                maxWidthClasses[maxWidth],
                className
            )}>
                <div className="animate-fade-in-up">
                    {children}
                </div>
            </main>

            {/* Ambient background glows */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-24 -left-24 w-80 h-80 bg-mint/10 rounded-full blur-[100px] hero-glow" />
                <div className="absolute bottom-32 -right-20 w-96 h-96 bg-lilac/10 rounded-full blur-[100px] hero-glow" style={{animationDelay: '2s'}} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-sky/8 rounded-full blur-[80px]" />
            </div>
        </div>
    );
};
