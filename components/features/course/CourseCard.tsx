'use client';

import { Link as LinkIcon, Trash2, Clock } from 'lucide-react';
import { cn } from '@/components/ui';

interface CourseCardProps {
    url: string;
    name: string;
    onRemove: () => void;
    status?: 'ready' | 'scanning' | 'completed';
}

const AVATAR_COLORS = [
    { bg: 'bg-mint',   ring: 'shadow-[3px_3px_0px_#1A1A1A]' },
    { bg: 'bg-lilac',  ring: 'shadow-[3px_3px_0px_#1A1A1A]' },
    { bg: 'bg-sky',    ring: 'shadow-[3px_3px_0px_#1A1A1A]' },
    { bg: 'bg-yellow', ring: 'shadow-[3px_3px_0px_#1A1A1A]' },
];

function getAvatarColor(url: string) {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
        hash = url.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const STATUS_LABELS = {
    ready:     { label: 'Ready to scan', dot: 'bg-mint' },
    scanning:  { label: 'Scanning…',     dot: 'bg-sky animate-gentle-pulse' },
    completed: { label: 'Complete',       dot: 'bg-mint' },
};

export const CourseCard = ({ url, name, onRemove, status = 'ready' }: CourseCardProps) => {
    const avatar = getAvatarColor(url);
    const statusInfo = STATUS_LABELS[status];

    // Extract hostname for cleaner display
    let displayUrl = url;
    try {
        const parsed = new URL(url);
        displayUrl = parsed.hostname + parsed.pathname.slice(0, 30) + (parsed.pathname.length > 30 ? '…' : '');
    } catch {}

    return (
        <div className={cn(
            "group flex items-center justify-between gap-4 rounded-[16px] border-[2px] border-border bg-surface p-4",
            "shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5",
            "transition-all duration-200 ease-out animate-fade-in-up"
        )}>
            {/* Avatar + info */}
            <div className="flex items-center gap-4 min-w-0">
                <div className={cn(
                    `flex-shrink-0 w-11 h-11 rounded-[12px] border-[2px] border-border flex items-center justify-center`,
                    avatar.bg,
                    avatar.ring,
                    'transition-transform duration-200 group-hover:-rotate-6'
                )}>
                    <LinkIcon size={18} strokeWidth={2.5} className="text-heading" />
                </div>

                <div className="flex flex-col gap-1 min-w-0">
                    <p className="text-sm font-bold text-heading truncate leading-tight">{displayUrl}</p>
                    <div className="flex items-center gap-2">
                        <span className={cn('inline-block w-1.5 h-1.5 rounded-full flex-shrink-0', statusInfo.dot)} />
                        <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">{statusInfo.label}</span>
                    </div>
                </div>
            </div>

            {/* Remove button */}
            <button
                className={cn(
                    'flex-shrink-0 p-2.5 rounded-[10px] border-[2px] border-transparent',
                    'text-muted hover:text-heading hover:border-border hover:bg-error/20',
                    'transition-all duration-200 active:scale-90'
                )}
                onClick={onRemove}
                aria-label="Remove course"
            >
                <Trash2 size={18} strokeWidth={2} />
            </button>
        </div>
    );
};
