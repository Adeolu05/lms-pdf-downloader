'use client';

import { useRef, useEffect } from 'react';
import { cn } from '@/components/ui';

interface LogEntry {
    time: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error' | 'pulse';
}

interface LogPanelProps {
    logs: LogEntry[];
    className?: string;
}

const typeColors = {
    info: 'text-sky',
    success: 'text-[#7BE27B]',
    warning: 'text-[#FFD970]',
    error: 'text-[#FF8A8A]',
    pulse: 'text-white',
};

const typeIcons = {
    info: '●',
    success: '✓',
    warning: '⚠',
    error: '✕',
    pulse: '◉',
};

export const LogPanel = ({ logs, className }: LogPanelProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new logs arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs.length]);

    return (
        <div className={cn("rounded-btn overflow-hidden border-[3px] border-border shadow-[2px_2px_0px_#111111]", className)}>
            {/* Terminal header bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a2e] border-b border-white/10">
                <div className="w-3 h-3 rounded-full bg-error/80" />
                <div className="w-3 h-3 rounded-full bg-warning/80" />
                <div className="w-3 h-3 rounded-full bg-mint/80" />
                <span className="ml-2 text-[11px] font-bold text-white/40 uppercase tracking-widest">Live Log</span>
            </div>
            {/* Terminal body */}
            <div
                ref={scrollRef}
                className="bg-[#12122a] p-4 font-mono text-sm h-52 overflow-y-auto"
            >
                <div className="flex flex-col gap-1.5">
                    {logs.length === 0 ? (
                        <span className="text-white/30 italic font-medium animate-gentle-pulse">Waiting for logs...</span>
                    ) : (
                        logs.map((log, idx) => (
                            <div key={idx} className="flex gap-3 animate-slide-in-right" style={{ animationDelay: `${Math.min(idx * 30, 200)}ms` }}>
                                <span className="text-white/25 flex-shrink-0 font-semibold text-xs mt-0.5">{`${log.time}`}</span>
                                <span className={cn(
                                    'text-xs font-semibold',
                                    typeColors[log.type || 'info']
                                )}>
                                    {typeIcons[log.type || 'info']}
                                </span>
                                <span className={cn(
                                    "font-medium text-xs",
                                    log.type === 'pulse' ? "text-white animate-gentle-pulse" :
                                        log.type === 'success' ? "text-[#7BE27B]" :
                                            log.type === 'warning' ? "text-[#FFD970]" :
                                                log.type === 'error' ? "text-[#FF8A8A]" :
                                                    "text-white/70",
                                )}>
                                    {log.message}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
