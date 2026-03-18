'use client';

import React from 'react';
import { Header } from './Header';
import { cn } from '@/components/ui';

interface AppShellProps {
    children: React.ReactNode;
    headerAction?: React.ReactNode;
    className?: string;
    maxWidth?: 'md' | 'lg' | 'xl' | 'full';
}

export const AppShell = ({
    children,
    headerAction,
    className,
    maxWidth = 'lg'
}: AppShellProps) => {
    const maxWidthClasses = {
        md: 'max-w-[540px]',
        lg: 'max-w-5xl',
        xl: 'max-w-7xl',
        full: 'max-w-full',
    };

    return (
        <div className="min-h-screen flex flex-col bg-background text-body font-sans selection:bg-mint/40">
            <Header action={headerAction} />

            <main className={cn(
                "flex-1 w-full mx-auto px-6 py-10",
                maxWidthClasses[maxWidth],
                className
            )}>
                <div className="animate-fade-in-up">
                    {children}
                </div>
            </main>

            {/* Decorative Pastel Shapes */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-20 -left-16 w-72 h-72 bg-mint/15 rounded-full blur-[80px]"></div>
                <div className="absolute bottom-32 -right-16 w-80 h-80 bg-lilac/15 rounded-full blur-[80px]"></div>
                <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-yellow/10 rounded-full blur-[60px]"></div>
            </div>
        </div>
    );
};
