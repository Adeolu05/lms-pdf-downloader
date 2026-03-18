'use client';

import { RefreshCw, CheckCircle2, AlertCircle, ChevronRight, PartyPopper } from 'lucide-react';
import { Card, Badge, cn, AnimatedCounter } from '@/components/ui';
import { LogPanel } from './LogPanel';
import { CourseStatus, STATUS_CONFIG } from '@/lib/constants';

interface ProgressCardProps {
    name: string;
    session: string;
    status: CourseStatus;
    found: number;
    downloaded: number;
    skipped: number;
    failed: number;
    percent: number;
    logs: any[];
    onViewFolder?: () => void;
}

export const ProgressCard = ({
    name,
    session,
    status,
    found,
    downloaded,
    skipped,
    failed,
    percent,
    logs,
    onViewFolder,
}: ProgressCardProps) => {
    const config = STATUS_CONFIG[status];

    const statusChipStyles = {
        scanning: 'bg-lilac text-heading border-[3px] border-border shadow-[2px_2px_0px_#111111]',
        downloading: 'bg-sky text-heading border-[3px] border-border shadow-[2px_2px_0px_#111111]',
        completed: 'bg-mint text-heading border-[3px] border-border shadow-[2px_2px_0px_#111111]',
        failed: 'bg-error/30 text-heading border-[3px] border-border shadow-[2px_2px_0px_#111111]',
    };

    const statItems = [
        { label: 'Found', value: found, bg: 'bg-surface-alt', delay: 'stagger-1' },
        { label: 'Downloaded', value: downloaded, bg: 'bg-mint/30', delay: 'stagger-2' },
        { label: 'Skipped', value: skipped, bg: 'bg-yellow/40', delay: 'stagger-3' },
        { label: 'Failed', value: failed, bg: 'bg-error/20', delay: 'stagger-4' },
    ];

    return (
        <Card className={cn("p-6 md:p-8 transition-all duration-200 shadow-[4px_4px_0px_#111111] animate-fade-in-up", status === 'scanning' && "opacity-95")}>
            <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-4 flex-wrap">
                        <h3 className="text-2xl font-black text-heading tracking-tight">{name}</h3>
                        <span className={cn(
                            'px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest inline-flex items-center justify-center',
                            statusChipStyles[status]
                        )}>
                            {status === 'scanning' && <RefreshCw size={12} className="mr-1.5 animate-spin" />}
                            {config.label}
                        </span>
                    </div>
                    <p className="text-muted text-sm font-medium">{session}</p>
                </div>

                <div className="flex items-center gap-3 font-bold border-[3px] border-border rounded-xl px-4 py-2 shadow-[2px_2px_0px_#111111] bg-surface-alt">
                    {status === 'downloading' && <span className="text-heading text-base font-black px-1 tabular-nums">{percent}%</span>}
                    {status === 'scanning' && <RefreshCw size={22} className="text-heading animate-spin" />}
                    {status === 'completed' && <CheckCircle2 size={24} className="text-heading" />}
                    {status === 'failed' && <AlertCircle size={24} className="text-error" />}
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statItems.map((stat) => (
                    <div key={stat.label} className={cn(`flex flex-col gap-1 p-4 rounded-btn border-[3px] border-border shadow-[2px_2px_0px_#111111] animate-fade-in-up ${stat.delay}`, stat.bg)}>
                        <p className="text-xs text-muted font-black uppercase tracking-widest">{stat.label}</p>
                        <AnimatedCounter value={stat.value} className="text-2xl font-black text-heading tracking-tight" />
                    </div>
                ))}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-surface-alt h-4 rounded-full mb-8 overflow-hidden border-[3px] border-border shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)]">
                <div
                    className={cn(
                        "h-full rounded-r-full transition-all duration-700 ease-out",
                        status === 'downloading' ? "bg-mint progress-stripe" : "bg-mint",
                        percent > 0 && "border-r-[3px] border-border"
                    )}
                    style={{ width: `${percent}%` }}
                ></div>
            </div>

            {/* Live Log Panel */}
            {status !== 'completed' && <LogPanel logs={logs} />}

            {/* Completion Celebration */}
            {status === 'completed' && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-mint/15 rounded-btn border-[3px] border-border shadow-[2px_2px_0px_#111111] animate-fade-in-up">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-mint rounded-lg border-2 border-border shadow-[2px_2px_0px_#111111]">
                            <PartyPopper size={20} className="text-heading" />
                        </div>
                        <div>
                            <p className="font-black text-heading text-base tracking-tight">All downloads complete! 🚀</p>
                            <p className="text-sm text-muted font-medium">{downloaded} files saved successfully</p>
                        </div>
                    </div>
                    {onViewFolder && (
                        <button
                            className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-heading bg-mint px-6 py-3 rounded-btn border-[3px] border-border shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#111111] transition-all duration-200 active:scale-[0.97]"
                            onClick={onViewFolder}
                        >
                            <span>View folder</span>
                            <ChevronRight size={20} strokeWidth={3} />
                        </button>
                    )}
                </div>
            )}
        </Card>
    );
};
