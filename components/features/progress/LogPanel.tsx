'use client';

import { useEffect, useRef } from 'react';

interface LogEntry {
    type: 'info' | 'success' | 'warning' | 'error' | 'scanning';
    message: string;
    timestamp?: string;
}

const LOG_STYLES: Record<string, { color: string; icon: string }> = {
    success:  { color: 'text-mint',          icon: '✓' },
    warning:  { color: 'text-yellow',         icon: '⚠' },
    error:    { color: 'text-[#F2C6C6]',      icon: '✕' },
    scanning: { color: 'text-sky',            icon: '◉' },
    info:     { color: 'text-muted',          icon: '·' },
};

export const LogPanel = ({ logs }: { logs: LogEntry[] }) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="rounded-[16px] border-[2px] border-border overflow-hidden shadow-hard">
            {/* Terminal Header */}
            <div className="bg-[#0F0F0F] px-4 py-3 flex items-center justify-between border-b border-[#2A2A2A]">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E] cursor-pointer hover:brightness-110 transition-all" />
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] cursor-pointer hover:brightness-110 transition-all" />
                    <div className="w-3 h-3 rounded-full bg-[#28C840] border border-[#1DAF35] cursor-pointer hover:brightness-110 transition-all" />
                </div>
                <span className="font-mono text-[11px] text-[#555] uppercase tracking-widest font-bold select-none">Live Output</span>
                <div className="w-16" />
            </div>

            {/* Log Body */}
            <div className="bg-[#0F1117] font-mono text-sm overflow-y-auto max-h-[280px] min-h-[120px] px-5 py-4 space-y-1.5">
                {logs.length === 0 ? (
                    <p className="text-[#333] text-xs italic">Waiting for scan to start...</p>
                ) : (
                    logs.map((log, i) => {
                        const style = LOG_STYLES[log.type] ?? LOG_STYLES.info;
                        const isLast = i === logs.length - 1;
                        return (
                            <div
                                key={i}
                                className="flex items-start gap-3 animate-slide-in-right opacity-0"
                                style={{ animationDelay: `${Math.min(i * 30, 400)}ms`, animationFillMode: 'forwards' }}
                            >
                                <span className={`${style.color} flex-shrink-0 w-4 text-center font-bold mt-0.5`}>
                                    {style.icon}
                                </span>
                                {log.timestamp && (
                                    <span className="text-[#3A3A3A] text-[10px] flex-shrink-0 mt-0.5 tabular-nums">
                                        {log.timestamp}
                                    </span>
                                )}
                                <span className={`${style.color} leading-relaxed text-[13px] ${isLast ? 'cursor-blink' : ''}`}>
                                    {log.message}
                                </span>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
};
