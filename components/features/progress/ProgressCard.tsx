'use client';

import {
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    FolderOpen,
    PartyPopper,
    FileText,
} from 'lucide-react';
import { Card, cn, AnimatedCounter } from '@/components/ui';
import { LogPanel } from './LogPanel';
import { CourseStatus, STATUS_CONFIG } from '@/lib/constants';
import type { JobMode, JobSummary } from '@/lib/context';

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
    jobMode?: JobMode;
    summary?: JobSummary;
    onViewFolder?: () => void;
    onOpenExamPack?: () => void;
    onOpenLibrary?: () => void;
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
    jobMode = 'pdf',
    summary,
    onViewFolder,
    onOpenExamPack,
    onOpenLibrary,
}: ProgressCardProps) => {
    const config = STATUS_CONFIG[status];
    const isExam = jobMode === 'exam-pack';
    const skippedList = summary?.skippedQuizzes || [];
    const questionTotal = summary?.totalQuestions;

    const statusChip = {
        scanning: 'bg-sky text-heading',
        downloading: 'bg-mint text-heading',
        completed: 'bg-mint text-heading',
        failed: 'bg-error text-heading',
    };

    const statusLabel = isExam
        ? {
              scanning: 'Scanning quizzes',
              downloading: 'Building pack',
              completed: 'Pack ready',
              failed: 'Failed',
          }[status]
        : config.label;

    const statItems = isExam
        ? [
              { label: 'Quizzes', value: found, bg: 'bg-surface-alt', delay: 'stagger-1' },
              { label: 'Saved', value: downloaded, bg: 'bg-mint/25', delay: 'stagger-2' },
              { label: 'Skipped', value: skipped, bg: 'bg-yellow/40', delay: 'stagger-3' },
              { label: 'Failed', value: failed, bg: 'bg-error/20', delay: 'stagger-4' },
          ]
        : [
              { label: 'Found', value: found, bg: 'bg-surface-alt', delay: 'stagger-1' },
              { label: 'Downloaded', value: downloaded, bg: 'bg-mint/25', delay: 'stagger-2' },
              { label: 'Skipped', value: skipped, bg: 'bg-yellow/40', delay: 'stagger-3' },
              { label: 'Failed', value: failed, bg: 'bg-error/20', delay: 'stagger-4' },
          ];

    const completeTitle = isExam ? 'Exam Pack ready! 📚' : 'All downloads complete! 🚀';
    const completeSub = isExam
        ? (typeof questionTotal === 'number'
              ? `${questionTotal} question${questionTotal === 1 ? '' : 's'} from ${downloaded} quiz${downloaded === 1 ? '' : 'zes'}`
              : `${downloaded} quiz${downloaded === 1 ? '' : 'zes'} with review data`) +
          (skipped > 0 ? ` · ${skipped} skipped` : '') +
          (summary?.cancelled ? ' · stopped early' : '') +
          (summary?.hasPdf
              ? ` · full PDF`
              : ' · open HTML/PDF in folder') +
          (summary?.hasStudyPdf ? ' + study PDF' : '')
        : `${downloaded} file${downloaded === 1 ? '' : 's'} saved and organised by week`;

    return (
        <Card
            className={cn(
                'p-6 md:p-8 shadow-hard animate-fade-in-up',
                status === 'completed' && 'border-mint/60'
            )}
        >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-xl font-black text-heading tracking-tight">{name}</h3>
                        <span
                            className={cn(
                                'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 border-[2px] border-border shadow-hard-sm',
                                statusChip[status]
                            )}
                        >
                            {status === 'scanning' && (
                                <>
                                    <span className="scanning-dot inline-block w-1.5 h-1.5 rounded-full bg-heading" />
                                    <span className="scanning-dot inline-block w-1.5 h-1.5 rounded-full bg-heading" />
                                    <span className="scanning-dot inline-block w-1.5 h-1.5 rounded-full bg-heading" />
                                </>
                            )}
                            {status === 'downloading' && (
                                <RefreshCw size={10} className="animate-spin" />
                            )}
                            {status === 'completed' && <CheckCircle2 size={10} />}
                            {status === 'failed' && <AlertCircle size={10} />}
                            {statusLabel}
                        </span>
                        {isExam && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-[2px] border-border bg-lilac/40 text-heading shadow-hard-sm">
                                Exam Pack
                            </span>
                        )}
                    </div>
                    <p className="text-muted text-sm font-medium">{session}</p>
                </div>

                <div className="flex items-center justify-center w-14 h-14 rounded-full border-[2px] border-border shadow-hard-sm bg-surface-alt flex-shrink-0">
                    {status === 'downloading' && (
                        <span className="text-base font-black text-heading tabular-nums">
                            {percent}%
                        </span>
                    )}
                    {status === 'scanning' && (
                        <RefreshCw size={20} className="text-heading animate-spin" />
                    )}
                    {status === 'completed' && <CheckCircle2 size={22} className="text-heading" />}
                    {status === 'failed' && <AlertCircle size={22} className="text-heading" />}
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
                {statItems.map((stat) => (
                    <div
                        key={stat.label}
                        className={cn(
                            'flex flex-col gap-1 p-4 rounded-btn border-[2px] border-border shadow-hard-sm animate-fade-in-up',
                            stat.bg,
                            stat.delay
                        )}
                    >
                        <p className="text-[10px] text-muted font-black uppercase tracking-widest">
                            {stat.label}
                        </p>
                        <AnimatedCounter
                            value={stat.value}
                            className="text-2xl font-black text-heading tracking-tight"
                        />
                    </div>
                ))}
            </div>

            <div className="w-full bg-surface-alt h-3.5 rounded-full mb-7 overflow-hidden border-[2px] border-border">
                <div
                    className={cn(
                        'h-full rounded-full transition-all duration-700 ease-out',
                        status === 'downloading' ? 'bg-mint progress-stripe' : 'bg-mint',
                        percent > 0 && 'border-r-[2px] border-border'
                    )}
                    style={{ width: `${percent}%` }}
                />
            </div>

            {status !== 'completed' && <LogPanel logs={logs} />}

            {status === 'completed' && (
                <div className="flex flex-col gap-4 p-5 bg-mint/15 rounded-btn border-[2px] border-border shadow-hard-sm success-pop">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-mint rounded-btn border-[2px] border-border shadow-hard-sm">
                                <PartyPopper size={20} className="text-heading" />
                            </div>
                            <div>
                                <p className="font-black text-heading text-base tracking-tight">
                                    {completeTitle}
                                </p>
                                <p className="text-sm text-muted font-medium">{completeSub}</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            {isExam && onOpenExamPack && (
                                <button
                                    className="flex items-center justify-center gap-2 text-sm font-bold text-heading bg-lilac px-5 py-3 rounded-btn border-[2px] border-border shadow-hard hover:shadow-hard-lg hover:-translate-y-0.5 hover:scale-[1.02] transition-all duration-200 active:scale-[0.97] whitespace-nowrap"
                                    onClick={onOpenExamPack}
                                >
                                    <FileText size={16} />
                                    <span>Open Exam Pack folder</span>
                                </button>
                            )}
                            {onViewFolder && (
                                <button
                                    className="flex items-center justify-center gap-2 text-sm font-bold text-heading bg-mint px-5 py-3 rounded-btn border-[2px] border-border shadow-hard hover:shadow-hard-lg hover:-translate-y-0.5 hover:scale-[1.02] transition-all duration-200 active:scale-[0.97] whitespace-nowrap"
                                    onClick={onViewFolder}
                                >
                                    <FolderOpen size={16} />
                                    <span>{isExam ? 'Open course folder' : 'View folder'}</span>
                                </button>
                            )}
                        </div>
                    </div>
                    {isExam && (
                        <div className="border-t border-border/15 pt-3 space-y-3">
                            <p className="text-xs text-muted font-medium leading-relaxed">
                                <strong className="text-heading">Full:</strong>{' '}
                                {summary?.pdfFileName || '… Exam Pack.pdf'} (answers inline) ·{' '}
                                <strong className="text-heading">Study:</strong>{' '}
                                {summary?.studyPdfFileName || '… Exam Pack Study.pdf'} (answer key at end)
                                · also <code className="text-heading">Exam Pack.html</code>
                            </p>
                            {skippedList.length > 0 && (
                                <div className="rounded-btn border-2 border-border bg-yellow/25 p-3">
                                    <p className="text-xs font-black text-heading uppercase tracking-wider mb-2">
                                        Finish these on LMS to unlock more questions
                                    </p>
                                    <ul className="space-y-1 max-h-36 overflow-y-auto">
                                        {skippedList.map((q) => (
                                            <li
                                                key={`${q.weekFolder}-${q.name}`}
                                                className="text-xs font-semibold text-heading/90 flex gap-2"
                                            >
                                                <span className="text-muted shrink-0">{q.weekFolder}</span>
                                                <span className="min-w-0">
                                                    {q.name}
                                                    <span className="text-muted font-medium">
                                                        {' '}
                                                        — {q.reason}
                                                    </span>
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="text-[11px] text-muted font-medium mt-2">
                                        Complete the quiz (or open Review), then re-run Exam Pack for this
                                        course.
                                    </p>
                                </div>
                            )}
                            {onOpenLibrary && (
                                <button
                                    type="button"
                                    className="text-xs font-bold text-heading underline underline-offset-2 decoration-border/30 hover:decoration-heading"
                                    onClick={onOpenLibrary}
                                >
                                    View all courses in Library →
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};
