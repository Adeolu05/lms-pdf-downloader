'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    BookOpen,
    ClipboardList,
    Download,
    FolderOpen,
    FileText,
    Library,
    RefreshCw,
} from 'lucide-react';
import { Button, Card, Badge, cn } from '@/components/ui';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AppShell } from '@/components/layout/AppShell';
import { CloudDeploymentBanner } from '@/components/layout/CloudDeploymentBanner';

type LibraryItem = {
    name: string;
    pdfCount: number;
    hasExamPack: boolean;
    examPdfName: string | null;
    hasExamHtml: boolean;
    questionCount: number | null;
    skippedQuizCount: number | null;
    mtime: number;
};

function openPath(body: { courseName?: string; subfolder?: string }) {
    return fetch('/api/download/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

export default function LibraryPage() {
    const router = useRouter();
    const [items, setItems] = useState<LibraryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [root, setRoot] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const resp = await fetch('/api/library/list');
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || 'Failed to load library');
            setItems(data.items || []);
            setRoot(data.root || null);
        } catch (e: any) {
            setError(e.message || 'Failed to load library');
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <AppShell
            showSteps={false}
            headerAction={
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => router.push('/courses')}>
                        <ArrowLeft size={16} />
                        <span className="hidden sm:inline">Courses</span>
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => load()} disabled={loading}>
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Refresh</span>
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col max-w-[900px] mx-auto gap-8 pb-16">
                <CloudDeploymentBanner />
                <SectionHeader
                    title="Your library"
                    description="Courses already on disk from PDF downloads and Exam Packs. Open folders or re-run jobs from Courses anytime."
                    className="mb-0"
                />

                {root && (
                    <p className="text-xs text-muted font-medium -mt-4">
                        Root: <code className="text-heading break-all">{root}</code>
                    </p>
                )}

                {error && (
                    <div className="p-4 rounded-card border-2 border-border bg-error/30 text-sm font-bold text-error-text">
                        {error}
                    </div>
                )}

                {loading && items.length === 0 && (
                    <div className="py-16 text-center text-muted font-medium">Loading library…</div>
                )}

                {!loading && items.length === 0 && !error && (
                    <div className="flex flex-col items-center text-center py-16 px-6 border-[3px] border-dashed border-border/30 rounded-card bg-surface-alt/50">
                        <div className="w-14 h-14 bg-lilac/20 rounded-2xl flex items-center justify-center mb-4 border-2 border-border/10">
                            <Library size={26} className="text-muted/70" />
                        </div>
                        <p className="font-bold text-heading text-lg mb-1">Nothing on disk yet</p>
                        <p className="text-sm text-muted max-w-md mb-6 font-medium">
                            After you download PDFs or build an Exam Pack, courses appear here.
                        </p>
                        <Button onClick={() => router.push('/courses')}>Go to Courses</Button>
                    </div>
                )}

                <div className="flex flex-col gap-4">
                    {items.map((item) => (
                        <Card
                            key={item.name}
                            className="p-5 md:p-6 shadow-hard hover:-translate-y-0.5 hover:shadow-hard-lg transition-all duration-200"
                        >
                            <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap mb-2">
                                        <h3 className="text-lg font-black text-heading tracking-tight truncate">
                                            {item.name}
                                        </h3>
                                        {item.hasExamPack && (
                                            <Badge variant="primary" className="shadow-hard-sm text-[10px]">
                                                Exam Pack
                                            </Badge>
                                        )}
                                        {item.pdfCount > 0 && (
                                            <Badge variant="info" className="shadow-hard-sm text-[10px]">
                                                {item.pdfCount} PDF{item.pdfCount === 1 ? '' : 's'}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted font-semibold">
                                        {item.questionCount != null && (
                                            <span className="inline-flex items-center gap-1">
                                                <ClipboardList size={12} />
                                                {item.questionCount} quiz questions
                                            </span>
                                        )}
                                        {item.skippedQuizCount != null && item.skippedQuizCount > 0 && (
                                            <span className="text-heading/70">
                                                {item.skippedQuizCount} quiz(zes) skipped (no review)
                                            </span>
                                        )}
                                        {item.examPdfName && (
                                            <span className="inline-flex items-center gap-1 truncate max-w-full">
                                                <FileText size={12} />
                                                {item.examPdfName}
                                            </span>
                                        )}
                                        {!item.hasExamPack && item.pdfCount === 0 && (
                                            <span>Empty folder</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 shrink-0">
                                    {item.hasExamPack && (
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() =>
                                                openPath({
                                                    courseName: item.name,
                                                    subfolder: 'Exam Pack',
                                                })
                                            }
                                        >
                                            <ClipboardList size={16} />
                                            Exam Pack folder
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        onClick={() => openPath({ courseName: item.name })}
                                    >
                                        <FolderOpen size={16} />
                                        Course folder
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {items.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        <button
                            type="button"
                            onClick={() => router.push('/courses')}
                            className={cn(
                                'flex items-center gap-3 p-4 rounded-card border-2 border-border bg-mint/15',
                                'shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 transition-all text-left'
                            )}
                        >
                            <div className="p-2 bg-mint rounded-btn border-2 border-border">
                                <Download size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-heading">Run another job</p>
                                <p className="text-xs text-muted font-medium">PDFs or Exam Pack from Courses</p>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => openPath({})}
                            className={cn(
                                'flex items-center gap-3 p-4 rounded-card border-2 border-border bg-lilac/15',
                                'shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 transition-all text-left'
                            )}
                        >
                            <div className="p-2 bg-lilac rounded-btn border-2 border-border">
                                <BookOpen size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-heading">Open downloads root</p>
                                <p className="text-xs text-muted font-medium">All courses in one place</p>
                            </div>
                        </button>
                    </div>
                )}
            </div>
        </AppShell>
    );
}
