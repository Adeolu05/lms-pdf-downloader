'use client';

import { RefreshCw, CheckCircle2, AlertCircle, FolderOpen, PartyPopper } from 'lucide-react';
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
    name, session, status,
    found, downloaded, skipped, failed,
    percent, logs, onViewFolder,
}: ProgressCardProps) => {
    const config = STATUS_CONFIG[status];

    const statusChip = {
        scanning:    'bg-sky text-heading',
        downloading: 'bg-mint text-heading',
        completed:   'bg-mint text-heading',
        failed:      'bg-error text-heading',
    };

    const statItems = [
        { label: 'Found',      value: found,      bg: 'bg-surface-alt', delay: 'stagger-1' },
        { label: 'Downloaded', value: downloaded,  bg: 'bg-mint/25',    delay: 'stagger-2' },
        { label: 'Skipped',    value: skipped,     bg: 'bg-yellow/40',  delay: 'stagger-3' },
        { label: 'Failed',     value: failed,      bg: 'bg-error/20',   delay: 'stagger-4' },
    ];

    return (
        <Card className={cn(
            "p-6 md:p-8 shadow-hard animate-fade-in-up",
            status === 'completed' && 'border-mint/60'
        )}>
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-xl font-black text-heading tracking-tight">{name}</h3>
                        <span className={cn(
                            'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 border-[2px] border-border shadow-hard-sm',
                            statusChip[status]
                        )}>
                            {status === 'scanning' && (
                                <>
                                    <span className="scanning-dot inline-block w-1.5 h-1.5 rounded-full bg-heading" />
                                    <span className="scanning-dot inline-block w-1.5 h-1.5 rounded-full bg-heading" />
                                    <span className="scanning-dot inline-block w-1.5 h-1.5 rounded-full bg-heading" />
                                </>
                            )}
                            {status === 'downloading' && <RefreshCw size={10} className="animate-spin" />}
                            {status === 'completed' && <CheckCircle2 size={10} />}
                            {status === 'failed' && <AlertCircle size={10} />}
                            {config.label}
                        </span>
                    </div>
                    <p className="text-muted text-sm font-medium">{session}</p>
                </div>

                {/* Percent display */}
                <div className="flex items-center justify-center w-14 h-14 rounded-full border-[2px] border-border shadow-hard-sm bg-surface-alt flex-shrink-0">
                    {status === 'downloading' && (
                        <span className="text-base font-black text-heading tabular-nums">{percent}%</span>
                    )}
                    {status === 'scanning' && <RefreshCw size={20} className="text-heading animate-spin" />}
                    {status === 'completed' && <CheckCircle2 size={22} className="text-heading" />}
                    {status === 'failed' && <AlertCircle size={22} className="text-heading" />}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
                {statItems.map((stat) => (
                    <div key={stat.label} className={cn(
                        'flex flex-col gap-1 p-4 rounded-btn border-[2px] border-border shadow-hard-sm animate-fade-in-up',
                        stat.bg,
                        stat.delay
                    )}>
                        <p className="text-[10px] text-muted font-black uppercase tracking-widest">{stat.label}</p>
                        <AnimatedCounter value={stat.value} className="text-2xl font-black text-heading tracking-tight" />
                    </div>
                ))}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-surface-alt h-3.5 rounded-full mb-7 overflow-hidden border-[2px] border-border">
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-700 ease-out",
                        status === 'downloading' ? "bg-mint progress-stripe" : "bg-mint",
                        percent > 0 && "border-r-[2px] border-border"
                    )}
                    style={{ width: `${percent}%` }}
                />
            </div>

            {/* Log Panel or Completion */}
            {status !== 'completed' && <LogPanel logs={logs} />}

            {status === 'completed' && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-mint/15 rounded-btn border-[2px] border-border shadow-hard-sm success-pop">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-mint rounded-btn border-[2px] border-border shadow-hard-sm">
                            <PartyPopper size={20} className="text-heading" />
                        </div>
                        <div>
                            <p className="font-black text-heading text-base tracking-tight">All downloads complete! 🚀</p>
                            <p className="text-sm text-muted font-medium">{downloaded} files saved and organised by week</p>
                        </div>
                    </div>
                    {onViewFolder && (
                        <button
                            className="flex items-center gap-2 text-sm font-bold text-heading bg-mint px-5 py-3 rounded-btn border-[2px] border-border shadow-hard hover:shadow-hard-lg hover:-translate-y-0.5 hover:scale-[1.02] transition-all duration-200 active:scale-[0.97] whitespace-nowrap"
                            onClick={onViewFolder}
                        >
                            <FolderOpen size={16} />
                            <span>View Folder</span>
                        </button>
                    )}
                </div>
            )}
        </Card>
    );
};
