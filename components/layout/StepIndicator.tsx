'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/components/ui';

export type AppStep = 1 | 2 | 3;

const STEPS: { step: AppStep; label: string; href: string; short: string }[] = [
    { step: 1, label: 'Login', href: '/', short: '1' },
    { step: 2, label: 'Courses', href: '/courses', short: '2' },
    { step: 3, label: 'Run', href: '/progress', short: '3' },
];

interface StepIndicatorProps {
    active: AppStep;
    className?: string;
    /** When false, steps are not clickable (e.g. Vercel landing). Default true. */
    navigable?: boolean;
}

export function StepIndicator({ active, className, navigable = true }: StepIndicatorProps) {
    const router = useRouter();

    return (
        <nav
            aria-label="App steps"
            className={cn(
                'w-full border-b-[2px] border-border/15 bg-surface-alt/60',
                className
            )}
        >
            <ol className="max-w-5xl mx-auto px-5 sm:px-8 py-2.5 flex items-center justify-center gap-1 sm:gap-2">
                {STEPS.map((s, i) => {
                    const done = s.step < active;
                    const current = s.step === active;
                    const clickable = navigable && (done || current || s.step === active + 1);

                    return (
                        <li key={s.step} className="flex items-center gap-1 sm:gap-2">
                            {i > 0 && (
                                <span
                                    className={cn(
                                        'hidden xs:block w-6 sm:w-10 h-[2px] mx-0.5 rounded-full',
                                        done || current ? 'bg-heading' : 'bg-border/25'
                                    )}
                                    aria-hidden
                                />
                            )}
                            <button
                                type="button"
                                disabled={!clickable}
                                onClick={() => clickable && router.push(s.href)}
                                className={cn(
                                    'inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full border-[2px] text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200',
                                    current &&
                                        'bg-mint border-border text-heading shadow-hard-sm scale-[1.02]',
                                    done &&
                                        !current &&
                                        'bg-surface border-border text-heading hover:-translate-y-0.5 hover:shadow-hard-sm',
                                    !done &&
                                        !current &&
                                        'bg-transparent border-border/20 text-muted cursor-default',
                                    clickable && !current && 'cursor-pointer'
                                )}
                                aria-current={current ? 'step' : undefined}
                            >
                                <span
                                    className={cn(
                                        'w-5 h-5 rounded-full border-[2px] border-border flex items-center justify-center text-[10px] font-black',
                                        current && 'bg-heading text-mint',
                                        done && !current && 'bg-lilac text-heading',
                                        !done && !current && 'bg-surface-alt text-muted'
                                    )}
                                >
                                    {done && !current ? '✓' : s.short}
                                </span>
                                <span className="hidden sm:inline">{s.label}</span>
                            </button>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
