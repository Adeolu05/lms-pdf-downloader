import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Base UI Component Library
 * Premium SaaS aesthetic: hard shadows, strong borders, mint/lilac accents.
 * Spec: Inter font, #F6F6F3 bg, #1A1A1A borders, 4px 4px 0px hard shadows.
 */

/* ───────────────────────────── Button ───────────────────────────── */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'warning';
    size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        const variants = {
            primary:   'bg-mint text-heading border-[2px] border-border shadow-hard hover:shadow-hard-lg hover:-translate-y-0.5 hover:scale-[1.02] active:shadow-none active:translate-y-0.5 active:scale-[0.97]',
            secondary: 'bg-surface-alt text-heading border-[2px] border-border shadow-hard-sm hover:bg-yellow/40 hover:shadow-hard hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.97]',
            outline:   'bg-transparent text-heading border-[2px] border-border shadow-hard-sm hover:bg-surface-alt hover:shadow-hard hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.97]',
            ghost:     'text-muted hover:text-heading hover:bg-surface-alt active:scale-[0.97]',
            danger:    'bg-error text-heading border-[2px] border-border shadow-hard hover:shadow-hard-lg hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.97]',
            warning:   'bg-yellow text-heading border-[2px] border-border shadow-hard hover:shadow-hard-lg hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.97]',
        };

        const sizes = {
            sm:   'px-4 py-2 text-xs',
            md:   'px-6 py-3 text-sm',
            lg:   'px-8 py-4 text-base tracking-wide',
            icon: 'p-3',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-btn font-bold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none select-none',
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

/* ───────────────────────────── Card ───────────────────────────── */
interface CardProps {
    className?: string;
    children: React.ReactNode;
    hover?: boolean;
}
export const Card = ({ className, children, hover = false }: CardProps) => (
    <div className={cn(
        'bg-surface border-[2px] border-border rounded-card p-6 shadow-hard transition-all duration-200',
        hover && 'hover:-translate-y-1 hover:shadow-hard-lg cursor-pointer',
        className
    )}>
        {children}
    </div>
);

/* ───────────────────────────── Badge ───────────────────────────── */
interface BadgeProps {
    className?: string;
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'primary' | 'info';
    pulse?: boolean;
}
export const Badge = ({ className, children, variant = 'default', pulse = false }: BadgeProps) => {
    const variants = {
        default: 'bg-surface-alt text-heading border-border',
        success: 'bg-mint text-heading border-border',
        warning: 'bg-yellow text-heading border-border',
        error:   'bg-error text-error-text border-border',
        primary: 'bg-lilac text-heading border-border',
        info:    'bg-sky text-heading border-border',
    };
    return (
        <span className={cn(
            'px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border-[2px] inline-flex items-center justify-center gap-1.5',
            variants[variant],
            pulse && 'animate-gentle-pulse',
            className
        )}>
            {children}
        </span>
    );
};

/* ───────────────────────────── Input ───────────────────────────── */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    hint?: string;
    error?: string;
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, hint, error, ...props }, ref) => (
        <div className="flex flex-col gap-1.5 w-full">
            {label && <label className="text-sm font-bold text-heading">{label}</label>}
            <input
                ref={ref}
                className={cn(
                    'w-full px-4 py-3 rounded-btn border-[2px] border-border bg-surface text-heading font-medium placeholder:text-muted shadow-hard-sm text-sm',
                    'focus:border-mint focus:shadow-[0_0_0_3px_rgba(143,227,136,0.25),3px_3px_0px_#1A1A1A] outline-none',
                    'transition-all duration-200',
                    error && 'border-error-text focus:border-error-text',
                    className
                )}
                {...props}
            />
            {hint && !error && <p className="text-xs text-muted font-medium">{hint}</p>}
            {error && <p className="text-xs text-error-text font-bold">{error}</p>}
        </div>
    )
);
Input.displayName = 'Input';

/* ───────────────────────────── Skeleton ───────────────────────────── */
export const Skeleton = ({ className }: { className?: string }) => (
    <div className={cn('skeleton-shimmer rounded-btn', className)} />
);

/* ───────────────────────────── AnimatedCounter ───────────────────────────── */
export const AnimatedCounter = ({ value, className }: { value: number, className?: string }) => (
    <span className={cn('tabular-nums inline-block transition-all duration-500 animate-count-pop', className)}>
        {value}
    </span>
);

/* ───────────────────────────── Divider ───────────────────────────── */
export const Divider = ({ className }: { className?: string }) => (
    <hr className={cn('border-0 border-t-[2px] border-border/20 my-6', className)} />
);
