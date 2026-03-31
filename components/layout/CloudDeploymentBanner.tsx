'use client';

import { CloudOff } from 'lucide-react';
import { cn } from '@/components/ui';

/** True when built on Vercel (`NEXT_PUBLIC_VERCEL_ENV` is injected at build time). */
function isCloudDeployment() {
    return Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV);
}

interface CloudDeploymentBannerProps {
    className?: string;
}

export function CloudDeploymentBanner({ className }: CloudDeploymentBannerProps) {
    if (!isCloudDeployment()) return null;

    return (
        <div
            role="status"
            className={cn(
                'w-full p-5 rounded-card border-[3px] border-border bg-yellow/25 shadow-hard flex gap-4 items-start text-left',
                className
            )}
        >
            <div className="p-2.5 bg-surface rounded-btn border-[2px] border-border flex-shrink-0">
                <CloudOff className="text-heading" size={22} aria-hidden />
            </div>
            <div className="min-w-0">
                <p className="font-black text-heading text-sm sm:text-base tracking-tight mb-1">
                    This deployment is a preview only
                </p>
                <p className="text-sm text-muted leading-relaxed">
                    Login, PDF downloads, and saved sessions need a real browser and disk on{' '}
                    <strong className="text-heading">your machine</strong>. The API intentionally disables LMS login on
                    Vercel. Clone the repo and run{' '}
                    <code className="text-xs font-mono bg-surface px-1.5 py-0.5 rounded border border-border/30">
                        npm run dev
                    </code>{' '}
                    locally to use the full app.
                </p>
            </div>
        </div>
    );
}
