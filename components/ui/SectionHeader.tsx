'use client';

import React from 'react';
import { cn } from '@/components/ui';

interface SectionHeaderProps {
    title: string;
    description?: string;
    className?: string;
    align?: 'left' | 'center';
}

export const SectionHeader = ({
    title,
    description,
    className,
    align = 'left'
}: SectionHeaderProps) => (
    <div className={cn(
        "flex flex-col gap-3 mb-8",
        align === 'center' && "items-center text-center",
        className
    )}>
        <h1 className="text-heading text-4xl md:text-5xl font-black leading-tight tracking-tight">
            {title}
        </h1>
        {description && (
            <p className={cn(
                "text-muted text-lg font-normal leading-relaxed max-w-2xl",
                align === 'center' && "mx-auto"
            )}>
                {description}
            </p>
        )}
    </div>
);
