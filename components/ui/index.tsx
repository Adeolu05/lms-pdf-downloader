import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Base UI Component Library
 * Warm, playful student aesthetic with thick borders and sharp shadows.
 * Enhanced with micro-interactions and premium feel.
 */

/* Button Component */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'warning';
    size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        const variants = {
            primary: 'bg-mint text-heading border-[3px] border-border hover:brightness-95 shadow-[4px_4px_0px_#111111] hover:shadow-[2px_2px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] active:scale-[0.97]',
            secondary: 'bg-surface-alt text-heading border-[3px] border-border hover:bg-yellow/30 shadow-[3px_3px_0px_#111111] hover:shadow-[1px_1px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] active:scale-[0.97]',
            outline: 'border-[3px] border-border text-heading hover:bg-surface-alt shadow-[3px_3px_0px_#111111] hover:shadow-[1px_1px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] active:scale-[0.97]',
            ghost: 'text-muted hover:text-heading hover:bg-surface-alt active:scale-[0.97]',
            danger: 'bg-error text-white border-[3px] border-border hover:brightness-95 shadow-[4px_4px_0px_#111111] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] active:scale-[0.97]',
            warning: 'bg-warning text-heading border-[3px] border-border hover:brightness-95 shadow-[4px_4px_0px_#111111] hover:shadow-[2px_2px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] active:scale-[0.97]',
        };

        const sizes = {
            sm: 'px-4 py-2 text-xs',
            md: 'px-6 py-3 text-sm',
            lg: 'px-8 py-4 text-base tracking-wide',
            icon: 'p-3',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-btn font-extrabold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none',
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = 'Button';

/* Card Component */
export const Card = ({ className, children }: { className?: string, children: React.ReactNode }) => (
    <div className={cn('bg-surface border-[3px] border-border rounded-card p-6 shadow-[4px_4px_0px_#111111] transition-all duration-200', className)}>
        {children}
    </div>
);

/* Badge Component */
export const Badge = ({ className, children, variant = 'default' }: { className?: string, children: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'error' | 'primary' }) => {
    const variants = {
        default: 'bg-surface-alt text-heading border-border',
        success: 'bg-mint text-heading border-border',
        warning: 'bg-yellow text-heading border-border',
        error: 'bg-error text-heading border-border',
        primary: 'bg-lilac text-heading border-border',
    };

    return (
        <span className={cn('px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border-[2.5px] inline-flex items-center justify-center', variants[variant], className)}>
            {children}
        </span>
    );
};

/* Skeleton Shimmer Component */
export const Skeleton = ({ className }: { className?: string }) => (
    <div className={cn('skeleton-shimmer rounded-btn', className)} />
);

/* Animated Counter Component */
export const AnimatedCounter = ({ value, className }: { value: number, className?: string }) => (
    <span className={cn('tabular-nums inline-block transition-all duration-300', className)}>
        {value}
    </span>
);
