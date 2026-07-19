'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CourseStatus } from './constants';
import { validateCourseUrl, validateCourseUrls, splitUrlPaste } from './course-url';

export type JobMode = 'idle' | 'pdf' | 'exam-pack';
/** User-selected path on Courses before running a job */
export type SelectedMode = 'pdf' | 'exam-pack';

interface Course {
    id: string;
    url: string;
    name: string;
    session: string;
}

interface LogEntry {
    time: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error' | 'pulse';
}

export type SkippedQuizInfo = {
    name: string;
    weekFolder: string;
    reason: string;
};

export type JobSummary = {
    mode?: string;
    courseName?: string;
    totalQuestions?: number;
    quizzesWithQuestions?: number;
    skipped?: number;
    failed?: number;
    skippedQuizzes?: SkippedQuizInfo[];
    packRelative?: string;
    pdfFileName?: string | null;
    studyPdfFileName?: string | null;
    htmlFileName?: string;
    hasPdf?: boolean;
    hasStudyPdf?: boolean;
    cancelled?: boolean;
};

interface CourseProgress extends Course {
    status: CourseStatus;
    found: number;
    downloaded: number;
    skipped: number;
    failed: number;
    percent: number;
    logs: LogEntry[];
    summary?: JobSummary;
}

export type AddCoursesResult = {
    added: number;
    rejected: { raw: string; reason: string }[];
    nonMiva: number;
    duplicatesSkipped: number;
};

interface AppContextType {
    sessionStatus: 'none' | 'ready' | 'loading';
    setSessionStatus: (status: 'none' | 'ready' | 'loading') => void;
    courses: Course[];
    setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
    progress: CourseProgress[];
    setProgress: React.Dispatch<React.SetStateAction<CourseProgress[]>>;
    jobMode: JobMode;
    selectedMode: SelectedMode;
    setSelectedMode: (mode: SelectedMode) => void;
    addCourse: (url: string) => { ok: true } | { ok: false; reason: string };
    addCoursesFromPaste: (text: string) => AddCoursesResult;
    removeCourse: (id: string) => void;
    startDownloads: () => Promise<void>;
    startExamPack: () => Promise<void>;
    startSelectedJob: () => Promise<void>;
    cancelJobs: (courseId?: string) => Promise<void>;
    refreshSession: () => Promise<void>;
    initiateLogin: () => Promise<{ success: boolean; error?: string } | undefined>;
    verifyLogin: () => Promise<{ success: boolean; error?: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [sessionStatus, setSessionStatus] = useState<'none' | 'ready' | 'loading'>('none');
    const [courses, setCourses] = useState<Course[]>([]);
    const [progress, setProgress] = useState<CourseProgress[]>([]);
    const [jobMode, setJobMode] = useState<JobMode>('idle');
    const [selectedMode, setSelectedMode] = useState<SelectedMode>('pdf');

    useEffect(() => {
        const eventSource = new EventSource('/api/download/stream');

        eventSource.onmessage = (event) => {
            const { courseId, type, data, timestamp } = JSON.parse(event.data);
            const time = new Date(timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });

            setProgress((prevProgress) => {
                return prevProgress.map((p) => {
                    if (p.id !== courseId) return p;
                    const updated = { ...p };

                    switch (type) {
                        case 'status':
                            updated.status = data.status;
                            if (data.total) updated.found = data.total;
                            break;
                        case 'progress':
                            updated.downloaded = data.downloaded;
                            updated.skipped = data.skipped;
                            updated.failed = data.failed;
                            updated.percent = data.percent;
                            break;
                        case 'meta':
                            updated.name = data.name;
                            break;
                        case 'log':
                            updated.logs = [
                                { time, message: data.message, type: data.type },
                                ...updated.logs,
                            ].slice(0, 100);
                            break;
                        case 'error':
                            updated.status = 'failed';
                            updated.logs = [
                                { time, message: data.message, type: 'error' },
                                ...updated.logs,
                            ];
                            break;
                        case 'summary':
                            updated.summary = data as JobSummary;
                            break;
                    }

                    return updated;
                });
            });
        };

        eventSource.onerror = (err) => {
            console.error('SSE Error:', err);
        };

        return () => {
            eventSource.close();
        };
    }, []);

    useEffect(() => {
        refreshSession();
    }, []);

    const refreshSession = async () => {
        try {
            const resp = await fetch('/api/auth/check');
            const data = await resp.json();
            if (data.status) setSessionStatus(data.status);
        } catch (e) {
            console.error('Failed to refresh session:', e);
        }
    };

    const initiateLogin = async () => {
        setSessionStatus('loading');
        try {
            const resp = await fetch('/api/auth/login', { method: 'POST' });
            if (!resp.ok) {
                const data = await resp.json().catch(() => ({}));
                setSessionStatus('none');
                const message =
                    typeof data.error === 'string'
                        ? data.error
                        : `Login failed (${resp.status})`;
                return { success: false, error: message };
            }
            return { success: true };
        } catch (e: any) {
            setSessionStatus('none');
            console.error(e);
            return { success: false, error: e.message };
        }
    };

    const verifyLogin = async () => {
        try {
            const resp = await fetch('/api/auth/login', { method: 'PUT' });
            const data = await resp.json();

            if (resp.ok && data.status === 'ready') {
                setSessionStatus('ready');
                return { success: true };
            } else {
                return { success: false, error: data.error || 'Verification failed' };
            }
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    };

    const addCourse = (url: string) => {
        const check = validateCourseUrl(url);
        if (!check.ok) {
            return { ok: false as const, reason: check.reason };
        }
        setCourses((prev) => {
            if (prev.some((c) => c.url === check.url)) return prev;
            return [
                ...prev,
                {
                    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    url: check.url,
                    name: 'Ready for scanning...',
                    session: 'Pending',
                },
            ];
        });
        return { ok: true as const };
    };

    const addCoursesFromPaste = (text: string): AddCoursesResult => {
        const candidates = splitUrlPaste(text);
        const { accepted, rejected, nonMiva } = validateCourseUrls(candidates);

        const existing = new Set(courses.map((c) => c.url));
        const fresh: string[] = [];
        let duplicatesSkipped = 0;
        for (const u of accepted) {
            if (existing.has(u)) {
                duplicatesSkipped++;
                continue;
            }
            existing.add(u);
            fresh.push(u);
        }

        if (fresh.length) {
            const base = Date.now();
            setCourses((prev) => {
                const still = new Set(prev.map((c) => c.url));
                const toAdd = fresh.filter((u) => !still.has(u));
                if (!toAdd.length) return prev;
                return [
                    ...prev,
                    ...toAdd.map((url, i) => ({
                        id: `${base}-${i}-${Math.random().toString(36).slice(2, 6)}`,
                        url,
                        name: 'Ready for scanning...',
                        session: 'Pending',
                    })),
                ];
            });
        }

        return {
            added: fresh.length,
            rejected,
            nonMiva,
            duplicatesSkipped,
        };
    };

    const removeCourse = (id: string) => {
        setCourses((prev) => prev.filter((c) => c.id !== id));
    };

    const startDownloads = async () => {
        setJobMode('pdf');
        setSelectedMode('pdf');
        const initialProgress: CourseProgress[] = courses.map((c) => ({
            ...c,
            session: 'PDF materials',
            status: 'scanning',
            found: 0,
            downloaded: 0,
            skipped: 0,
            failed: 0,
            percent: 0,
            logs: [],
            summary: undefined,
        }));
        setProgress(initialProgress);
        router.push('/progress');

        try {
            await fetch('/api/download/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courses: courses.map((c) => ({ id: c.id, url: c.url })),
                }),
            });
        } catch (e) {
            console.error('Failed to start downloads:', e);
        }
    };

    const startExamPack = async () => {
        setJobMode('exam-pack');
        setSelectedMode('exam-pack');
        const initialProgress: CourseProgress[] = courses.map((c) => ({
            ...c,
            name: c.name === 'Ready for scanning...' ? 'Exam Pack…' : c.name,
            session: 'Exam Pack · review only',
            status: 'scanning',
            found: 0,
            downloaded: 0,
            skipped: 0,
            failed: 0,
            percent: 0,
            logs: [],
            summary: undefined,
        }));
        setProgress(initialProgress);
        router.push('/progress');

        try {
            await fetch('/api/exam-pack/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courses: courses.map((c) => ({ id: c.id, url: c.url })),
                }),
            });
        } catch (e) {
            console.error('Failed to start exam pack:', e);
        }
    };

    const startSelectedJob = async () => {
        if (selectedMode === 'exam-pack') {
            await startExamPack();
        } else {
            await startDownloads();
        }
    };

    const cancelJobs = async (courseId?: string) => {
        try {
            await fetch('/api/job/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(courseId ? { courseId } : {}),
            });
            setProgress((prev) =>
                prev.map((p) => {
                    if (courseId && p.id !== courseId) return p;
                    if (p.status === 'completed' || p.status === 'failed') return p;
                    return {
                        ...p,
                        logs: [
                            {
                                time: new Date().toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                }),
                                message: 'Cancel requested…',
                                type: 'warning' as const,
                            },
                            ...p.logs,
                        ],
                    };
                })
            );
        } catch (e) {
            console.error('Failed to cancel jobs:', e);
        }
    };

    return (
        <AppContext.Provider
            value={{
                sessionStatus,
                setSessionStatus,
                courses,
                setCourses,
                progress,
                setProgress,
                jobMode,
                selectedMode,
                setSelectedMode,
                addCourse,
                addCoursesFromPaste,
                removeCourse,
                startDownloads,
                startExamPack,
                startSelectedJob,
                cancelJobs,
                refreshSession,
                initiateLogin,
                verifyLogin,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
}
