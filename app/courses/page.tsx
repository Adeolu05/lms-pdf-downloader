'use client';

import { useMemo, useState, type ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus,
    Download,
    ArrowLeft,
    BookOpen,
    ClipboardList,
    Play,
    AlertCircle,
    CheckCircle2,
    Key,
} from 'lucide-react';
import { Button, Card, Badge, cn } from '@/components/ui';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AppShell } from '@/components/layout/AppShell';
import { CloudDeploymentBanner } from '@/components/layout/CloudDeploymentBanner';
import { CourseCard } from '@/components/features/course/CourseCard';
import { useAppContext, type SelectedMode } from '@/lib/context';

export default function CoursesPage() {
    const router = useRouter();
    const {
        courses,
        addCourse,
        addCoursesFromPaste,
        removeCourse,
        setCourses,
        startSelectedJob,
        selectedMode,
        setSelectedMode,
        sessionStatus,
    } = useAppContext();

    const [pasteText, setPasteText] = useState('');
    const [urlError, setUrlError] = useState<string | null>(null);
    const [urlHint, setUrlHint] = useState<string | null>(null);

    const sessionReady = sessionStatus === 'ready';
    const canRun = courses.length > 0 && sessionReady;

    const primaryCta = useMemo(() => {
        if (selectedMode === 'exam-pack') {
            return {
                label: 'Build Exam Pack',
                icon: ClipboardList,
                hint: 'Finished quiz reviews only · PDF booklet + HTML + Markdown',
            };
        }
        return {
            label: 'Download PDFs',
            icon: Download,
            hint: 'Lecture PDFs organised by course and week',
        };
    }, [selectedMode]);

    const handleAdd = () => {
        setUrlError(null);
        setUrlHint(null);
        const text = pasteText.trim();
        if (!text) {
            setUrlError('Paste at least one course URL.');
            return;
        }

        // Multi-line / multi-URL paste
        if (/[\n\r,]/.test(text) || text.split(/\s+/).filter((t) => t.startsWith('http')).length > 1) {
            const result = addCoursesFromPaste(text);
            if (result.added === 0 && result.rejected.length) {
                setUrlError(result.rejected[0]?.reason || 'No valid course URLs found.');
                return;
            }
            if (result.added === 0 && result.duplicatesSkipped) {
                setUrlHint('Those courses are already in your queue.');
                setPasteText('');
                return;
            }
            const parts: string[] = [];
            if (result.added) parts.push(`Added ${result.added} course${result.added === 1 ? '' : 's'}.`);
            if (result.duplicatesSkipped) parts.push(`${result.duplicatesSkipped} duplicate(s) skipped.`);
            if (result.nonMiva) parts.push(`${result.nonMiva} non-Miva link(s) kept — results may vary.`);
            if (result.rejected.length) parts.push(`${result.rejected.length} line(s) rejected.`);
            setUrlHint(parts.join(' '));
            setPasteText('');
            return;
        }

        const single = addCourse(text);
        if (!single.ok) {
            setUrlError(single.reason);
            return;
        }
        setPasteText('');
        setUrlHint('Course added to queue.');
    };

    const selectMode = (mode: SelectedMode) => {
        setSelectedMode(mode);
    };

    const handleRun = async () => {
        if (!sessionReady) {
            router.push('/');
            return;
        }
        if (!courses.length) return;
        await startSelectedJob();
    };

    return (
        <AppShell
            activeStep={2}
            headerAction={
                <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
                    <ArrowLeft size={18} className="mr-1" />
                    <span className="font-extrabold uppercase tracking-wide text-xs">Back</span>
                </Button>
            }
        >
            <div className="flex flex-col max-w-[840px] mx-auto gap-8">
                <CloudDeploymentBanner className="mb-1" />

                <SectionHeader
                    title="Choose a path"
                    description="Pick what you need, add course links, then run. Same queue works for both modes."
                    className="mb-2"
                />

                {/* Session gate */}
                {!sessionReady && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-card border-[2px] border-border bg-yellow/30 shadow-hard-sm animate-fade-in-up">
                        <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 bg-yellow rounded-btn border-2 border-border shadow-hard-sm shrink-0">
                                <Key size={18} className="text-heading" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-heading tracking-tight">
                                    LMS session required
                                </p>
                                <p className="text-xs text-muted font-medium mt-0.5">
                                    Log in on the welcome step first so downloads and Exam Packs can use your
                                    cookies.
                                </p>
                            </div>
                        </div>
                        <Button size="sm" className="shrink-0" onClick={() => router.push('/')}>
                            Go to Login
                        </Button>
                    </div>
                )}

                {/* Mode cards — equal weight */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ModeCard
                        selected={selectedMode === 'pdf'}
                        onSelect={() => selectMode('pdf')}
                        icon={Download}
                        accent="mint"
                        title="Download PDFs"
                        description="Lecture and reading PDFs from the course page. Clean names, folders by week."
                        bullets={['Hands-free bulk download', 'Skip files that already exist', 'Organised by course / week']}
                    />
                    <ModeCard
                        selected={selectedMode === 'exam-pack'}
                        onSelect={() => selectMode('exam-pack')}
                        icon={ClipboardList}
                        accent="lilac"
                        title="Build Exam Pack"
                        description="Pull finished quiz reviews into a student-friendly PDF booklet (math rendered)."
                        bullets={[
                            'Weekly + mid/end assessments',
                            'Review only — no new attempts',
                            'Exam Pack.pdf + HTML + Markdown',
                        ]}
                    />
                </div>

                {/* Shared course queue */}
                <Card className="bg-surface p-6 md:p-7 shadow-hard">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div>
                                <span className="text-heading text-xs font-black uppercase tracking-widest">
                                    Course queue
                                </span>
                                <p className="text-xs text-muted font-medium mt-1">
                                    Paste one URL, or several (newlines or commas). Miva course pages preferred.
                                </p>
                            </div>
                            <Badge variant="primary" className="shadow-hard-sm">
                                {courses.length} queued
                            </Badge>
                        </div>

                        <div className="flex flex-col gap-2">
                            <textarea
                                className={cn(
                                    'w-full min-h-[88px] px-4 py-3 rounded-btn border-[2px] border-border bg-surface text-heading font-medium placeholder:text-muted shadow-hard-sm text-sm resize-y',
                                    'focus:border-mint focus:shadow-[0_0_0_3px_rgba(143,227,136,0.25),3px_3px_0px_#1A1A1A] outline-none transition-all duration-200',
                                    urlError && 'border-error-text'
                                )}
                                placeholder={
                                    'https://lms.miva.university/course/view.php?id=383\nhttps://lms.miva.university/course/view.php?id=386'
                                }
                                value={pasteText}
                                onChange={(e) => {
                                    setPasteText(e.target.value);
                                    setUrlError(null);
                                    setUrlHint(null);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                        e.preventDefault();
                                        handleAdd();
                                    }
                                }}
                                spellCheck={false}
                            />
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <p className="text-[11px] text-muted font-medium">
                                    ⌘/Ctrl + Enter to add · open the course in LMS and copy the address bar
                                </p>
                                <Button onClick={handleAdd} className="py-2.5 px-6 text-sm whitespace-nowrap">
                                    <Plus size={18} className="mr-1" />
                                    Add to queue
                                </Button>
                            </div>
                            {urlError && (
                                <p className="flex items-start gap-2 text-xs font-bold text-error-text bg-error/30 border-2 border-border rounded-btn px-3 py-2">
                                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                    {urlError}
                                </p>
                            )}
                            {urlHint && !urlError && (
                                <p className="flex items-start gap-2 text-xs font-semibold text-heading bg-mint/20 border-2 border-border/20 rounded-btn px-3 py-2">
                                    <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                                    {urlHint}
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-heading text-xl font-black tracking-tight">Queued courses</h3>
                        {courses.length > 0 && (
                            <button
                                type="button"
                                className="text-xs font-bold text-muted hover:text-heading px-3 py-1.5 rounded-btn hover:bg-error/15 transition-all"
                                onClick={() => setCourses([])}
                            >
                                Clear all
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        {courses.length === 0 ? (
                            <div className="flex flex-col items-center text-center py-14 text-muted border-[3px] border-dashed border-border/30 rounded-card bg-surface-alt/50 animate-fade-in-up">
                                <div className="w-14 h-14 bg-lilac/20 rounded-2xl flex items-center justify-center mb-3 border-2 border-border/10">
                                    <BookOpen size={26} className="text-muted/60" />
                                </div>
                                <p className="font-bold text-heading text-base mb-1">Queue is empty</p>
                                <p className="text-sm font-medium text-muted max-w-sm">
                                    Add a Miva course URL above, then run{' '}
                                    <strong className="text-heading">{primaryCta.label}</strong>.
                                </p>
                            </div>
                        ) : (
                            courses.map((course) => (
                                <CourseCard
                                    key={course.id}
                                    url={course.url}
                                    name={course.name}
                                    onRemove={() => removeCourse(course.id)}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Single primary run CTA for selected mode */}
                <div className="flex flex-col gap-3 border-t-[2px] border-border/10 pt-8 pb-6">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <p className="text-sm text-muted font-medium max-w-md leading-relaxed">
                            <span className="text-heading font-bold">
                                Mode: {selectedMode === 'exam-pack' ? 'Exam Pack' : 'PDF materials'}
                            </span>
                            <br />
                            {primaryCta.hint}
                        </p>
                        <Button
                            className="w-full sm:w-auto px-10 py-4 text-base"
                            onClick={handleRun}
                            disabled={courses.length === 0}
                            title={!sessionReady ? 'Log in first' : undefined}
                        >
                            <primaryCta.icon size={20} className="mr-2" />
                            <span>{primaryCta.label}</span>
                            <Play size={18} className="ml-2" fill="currentColor" />
                        </Button>
                    </div>
                    {!canRun && courses.length > 0 && !sessionReady && (
                        <p className="text-xs font-bold text-error-text">
                            You can queue courses now, but you must log in before running.
                        </p>
                    )}
                    {selectedMode === 'exam-pack' && (
                        <p className="text-xs text-muted font-medium leading-relaxed max-w-xl">
                            Quizzes without a finished attempt are skipped until you complete them on the LMS.
                            Output lands in <code className="text-heading">downloads/…/Exam Pack/</code>.
                        </p>
                    )}
                </div>
            </div>
        </AppShell>
    );
}

function ModeCard({
    selected,
    onSelect,
    icon: Icon,
    accent,
    title,
    description,
    bullets,
}: {
    selected: boolean;
    onSelect: () => void;
    icon: ComponentType<{ size?: number; className?: string }>;
    accent: 'mint' | 'lilac';
    title: string;
    description: string;
    bullets: string[];
}) {
    const accentBg = accent === 'mint' ? 'bg-mint' : 'bg-lilac';
    const softBg = accent === 'mint' ? 'bg-mint/15' : 'bg-lilac/15';

    return (
        <button
            type="button"
            onClick={onSelect}
            className={cn(
                'text-left rounded-card border-[3px] border-border p-5 transition-all duration-200 shadow-hard',
                'hover:-translate-y-1 hover:shadow-hard-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-mint',
                selected ? softBg : 'bg-surface',
                selected && 'ring-2 ring-offset-2 ring-heading ring-offset-background'
            )}
            aria-pressed={selected}
        >
            <div className="flex items-start gap-3 mb-3">
                <div
                    className={cn(
                        'p-2.5 rounded-btn border-[2px] border-border shadow-hard-sm shrink-0',
                        accentBg
                    )}
                >
                    <Icon size={22} className="text-heading" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-black text-heading tracking-tight">{title}</h3>
                        {selected && (
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border-2 border-border bg-heading text-mint">
                                Selected
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-muted font-medium leading-relaxed mt-1">{description}</p>
                </div>
            </div>
            <ul className="space-y-1.5 pl-1">
                {bullets.map((b) => (
                    <li key={b} className="text-xs font-semibold text-heading/80 flex items-start gap-2">
                        <span className={cn('mt-1 w-1.5 h-1.5 rounded-full shrink-0', accentBg)} />
                        {b}
                    </li>
                ))}
            </ul>
        </button>
    );
}
