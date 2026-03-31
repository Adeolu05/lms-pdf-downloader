'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, FolderOpen, Zap, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AppShell } from '@/components/layout/AppShell';
import { CloudDeploymentBanner } from '@/components/layout/CloudDeploymentBanner';
import { ProgressCard } from '@/components/features/progress/ProgressCard';
import { useAppContext } from '@/lib/context';
import { MOCK_LOGS } from '@/lib/constants';

const DEV_MOCK_PROGRESS =
    process.env.NODE_ENV === 'development'
        ? [
              {
                  id: '1',
                  name: 'Introduction to Psychology',
                  session: 'Spring 2024 • Section A',
                  status: 'downloading' as const,
                  found: 15,
                  downloaded: 12,
                  skipped: 2,
                  failed: 1,
                  percent: 80,
                  logs: MOCK_LOGS,
                  url: '',
              },
              {
                  id: '2',
                  name: 'Data Structures & Algorithms',
                  session: 'Summer 2024 • Section C',
                  status: 'scanning' as const,
                  found: 42,
                  downloaded: 0,
                  skipped: 0,
                  failed: 0,
                  percent: 25,
                  logs: MOCK_LOGS.slice(0, 3),
                  url: '',
              },
          ]
        : [];

export default function ProgressPage() {
    const router = useRouter();
    const { progress } = useAppContext();

    const displayProgress = progress.length > 0 ? progress : DEV_MOCK_PROGRESS;

    const isActive = displayProgress.some((p) => p.status === 'downloading' || p.status === 'scanning');

    return (
        <AppShell
            headerAction={
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => router.push('/courses')}>
                        <ArrowLeft size={16} />
                        <span className="hidden sm:inline">Back</span>
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => fetch('/api/download/open', { method: 'POST' })}>
                        <FolderOpen size={16} />
                        <span className="hidden sm:inline">Open Downloads</span>
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col max-w-[960px] mx-auto gap-6">
                <CloudDeploymentBanner className="mb-2" />
                {/* Progress Section Header */}
                <SectionHeader
                    title="Download Progress"
                    description="Track scanning, skipped files, and completed downloads in real time."
                />

                {/* Dynamic Course Activity Stack */}
                <div className="flex flex-col gap-6 mb-20">
                    {displayProgress.length === 0 && (
                        <div className="flex flex-col items-center text-center py-16 px-6 border-[3px] border-dashed border-border/30 rounded-card bg-surface-alt/50">
                            <p className="font-bold text-heading text-lg mb-2">No active downloads</p>
                            <p className="text-sm text-muted max-w-md mb-6">
                                Add courses and choose <strong className="text-heading">Download Materials</strong> to see live progress here.
                            </p>
                            <Button className="px-8" onClick={() => router.push('/courses')}>
                                Go to Courses
                            </Button>
                        </div>
                    )}
                    {displayProgress.map((item, idx) => (
                        <div key={item.id} className={`stagger-${idx + 1}`}>
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
                                onViewFolder={() => {
                                    fetch('/api/download/open', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ courseName: item.name })
                                    });
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer: real activity only (no fake throughput in production) */}
            {displayProgress.length > 0 && (
                <footer className="fixed bottom-0 left-0 right-0 border-t-[3px] border-border px-6 py-4 lg:px-40 bg-surface z-40 flex items-center justify-between">
                    <div className="flex items-center gap-6 text-sm text-muted">
                        {process.env.NODE_ENV === 'development' ? (
                            <>
                                <span
                                    className={`flex items-center gap-2 bg-mint/20 px-3 py-1 rounded-full border-2 border-border ${isActive ? 'animate-gentle-pulse' : ''}`}
                                >
                                    <Zap size={14} className="text-heading" />
                                    <span className="font-bold text-heading tabular-nums">2.4 MB/s</span>
                                </span>
                                <span className="flex items-center gap-2 bg-lilac/20 px-3 py-1 rounded-full border-2 border-border">
                                    <HardDrive size={14} className="text-heading" />
                                    <span className="font-bold text-heading">1.2 GB free</span>
                                </span>
                            </>
                        ) : (
                            <span
                                className={`flex items-center gap-2 bg-mint/20 px-3 py-1 rounded-full border-2 border-border ${isActive ? 'animate-gentle-pulse' : ''}`}
                            >
                                <Zap size={14} className="text-heading" />
                                <span className="font-bold text-heading">
                                    {isActive ? 'Download activity running' : 'Idle'}
                                </span>
                            </span>
                        )}
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-xs text-muted font-semibold">
                            {displayProgress.length} course{displayProgress.length === 1 ? '' : 's'} in view
                        </p>
                    </div>
                </footer>
            )}
        </AppShell>
    );
}
