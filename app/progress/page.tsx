'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, FolderOpen, Zap, ClipboardList, Download, Square } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AppShell } from '@/components/layout/AppShell';
import { CloudDeploymentBanner } from '@/components/layout/CloudDeploymentBanner';
import { ProgressCard } from '@/components/features/progress/ProgressCard';
import { useAppContext } from '@/lib/context';

function openPath(body: { courseName?: string; subfolder?: string }) {
    return fetch('/api/download/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

export default function ProgressPage() {
    const router = useRouter();
    const { progress, jobMode, cancelJobs } = useAppContext();

    const isActive = progress.some((p) => p.status === 'downloading' || p.status === 'scanning');
    const isExam = jobMode === 'exam-pack';
    const allDone =
        progress.length > 0 && progress.every((p) => p.status === 'completed' || p.status === 'failed');

    const title = isExam ? 'Exam Pack progress' : jobMode === 'pdf' ? 'PDF download progress' : 'Progress';
    const description = isExam
        ? 'Harvesting finished quiz reviews into a study booklet (Markdown, HTML, and PDF when available).'
        : jobMode === 'pdf'
          ? 'Scanning course pages and saving lecture PDFs organised by week.'
          : 'Start a PDF download or Exam Pack from Courses to see live progress here.';

    return (
        <AppShell
            activeStep={3}
            headerAction={
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => router.push('/courses')}>
                        <ArrowLeft size={16} />
                        <span className="hidden sm:inline">Back</span>
                    </Button>
                    {isActive && (
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={() => cancelJobs()}
                            aria-label="Stop all jobs"
                        >
                            <Square size={14} fill="currentColor" />
                            <span className="hidden sm:inline">Stop</span>
                        </Button>
                    )}
                    <Button variant="primary" size="sm" onClick={() => openPath({})}>
                        <FolderOpen size={16} />
                        <span className="hidden sm:inline">Open Downloads</span>
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col max-w-[960px] mx-auto gap-6 pb-24">
                <CloudDeploymentBanner className="mb-2" />

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <SectionHeader title={title} description={description} />
                    {jobMode !== 'idle' && (
                        <Badge
                            variant={isExam ? 'primary' : 'info'}
                            className="shadow-hard-sm self-start sm:self-auto shrink-0"
                        >
                            {isExam ? (
                                <span className="inline-flex items-center gap-1.5">
                                    <ClipboardList size={12} /> Exam Pack
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5">
                                    <Download size={12} /> PDF materials
                                </span>
                            )}
                        </Badge>
                    )}
                </div>

                <div className="flex flex-col gap-6">
                    {progress.length === 0 && (
                        <div className="flex flex-col items-center text-center py-16 px-6 border-[3px] border-dashed border-border/30 rounded-card bg-surface-alt/50">
                            <p className="font-bold text-heading text-lg mb-2">No active job</p>
                            <p className="text-sm text-muted max-w-md mb-6">
                                Add courses, then choose <strong className="text-heading">Download PDFs</strong>{' '}
                                or <strong className="text-heading">Build Exam Pack</strong> to see live
                                progress here. (No demo data — only real runs.)
                            </p>
                            <Button className="px-8" onClick={() => router.push('/courses')}>
                                Go to Courses
                            </Button>
                        </div>
                    )}
                    {progress.map((item, idx) => (
                        <div key={item.id} className={`stagger-${Math.min(idx + 1, 6)}`}>
                            <ProgressCard
                                name={item.name}
                                session={item.session}
                                status={item.status}
                                found={item.found}
                                downloaded={item.downloaded}
                                skipped={item.skipped}
                                failed={item.failed}
                                percent={item.percent}
                                logs={item.logs}
                                summary={item.summary}
                                jobMode={jobMode === 'idle' ? 'pdf' : jobMode}
                                onViewFolder={() => openPath({ courseName: item.name })}
                                onOpenExamPack={() =>
                                    openPath({ courseName: item.name, subfolder: 'Exam Pack' })
                                }
                                onOpenLibrary={() => router.push('/library')}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {progress.length > 0 && (
                <footer className="fixed bottom-0 left-0 right-0 border-t-[3px] border-border px-6 py-4 lg:px-40 bg-surface z-40 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-sm text-muted min-w-0">
                        <span
                            className={`flex items-center gap-2 bg-mint/20 px-3 py-1 rounded-full border-2 border-border shrink-0 ${
                                isActive ? 'animate-gentle-pulse' : ''
                            }`}
                        >
                            <Zap size={14} className="text-heading" />
                            <span className="font-bold text-heading">
                                {isActive
                                    ? isExam
                                        ? 'Exam Pack running'
                                        : 'Download running'
                                    : allDone
                                      ? 'Finished'
                                      : 'Idle'}
                            </span>
                        </span>
                        <span className="hidden sm:inline text-xs font-semibold truncate">
                            {progress.length} course{progress.length === 1 ? '' : 's'}
                            {isExam ? ' · review-only (no new attempts)' : ''}
                        </span>
                    </div>
                    <p className="text-xs text-muted font-semibold hidden md:block shrink-0">
                        {isExam ? 'Output: downloads/…/Exam Pack/' : 'Output: downloads/…/'}
                    </p>
                </footer>
            )}
        </AppShell>
    );
}
