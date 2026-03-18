'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CourseStatus } from './constants';

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

interface CourseProgress extends Course {
    status: CourseStatus;
    found: number;
    downloaded: number;
    skipped: number;
    failed: number;
    percent: number;
    logs: LogEntry[];
}

interface AppContextType {
    sessionStatus: 'none' | 'ready' | 'loading';
    setSessionStatus: (status: 'none' | 'ready' | 'loading') => void;
    courses: Course[];
    setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
    progress: CourseProgress[];
    setProgress: React.Dispatch<React.SetStateAction<CourseProgress[]>>;
    addCourse: (url: string) => void;
    removeCourse: (id: string) => void;
    startDownloads: () => Promise<void>;
    refreshSession: () => Promise<void>;
    initiateLogin: () => Promise<void>;
    verifyLogin: () => Promise<{ success: boolean; error?: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [sessionStatus, setSessionStatus] = useState<'none' | 'ready' | 'loading'>('none');
    const [courses, setCourses] = useState<Course[]>([]);
    const [progress, setProgress] = useState<CourseProgress[]>([]);

    // Event Source for streaming
    useEffect(() => {
        const eventSource = new EventSource('/api/download/stream');

        eventSource.onmessage = (event) => {
            const { courseId, type, data, timestamp } = JSON.parse(event.data);
            const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

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
                            updated.logs = [{ time, message: data.message, type: data.type }, ...updated.logs].slice(0, 100);
                            break;
                        case 'error':
                            updated.status = 'failed';
                            updated.logs = [{ time, message: data.message, type: 'error' }, ...updated.logs];
                            break;
                    }

                    return updated;
                });
            });
        };

        eventSource.onerror = (err) => {
            console.error('SSE Error:', err);
            // Attempt reconnect if needed - EventSource handles this natively usually
        };

        return () => {
            eventSource.close();
        };
    }, []);

    // Check session status on mount
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
            if (!resp.ok) throw new Error('Failed to start login');
        } catch (e) {
            setSessionStatus('none');
            console.error(e);
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
        const newCourse: Course = {
            id: Date.now().toString(),
            url,
            name: 'Ready for scanning...',
            session: 'Pending',
        };
        setCourses([...courses, newCourse]);
    };

    const removeCourse = (id: string) => {
        setCourses(courses.filter((c) => c.id !== id));
    };

    const startDownloads = async () => {
        // 1. Setup initial progress state
        const initialProgress: CourseProgress[] = courses.map((c) => ({
            ...c,
            status: 'scanning',
            found: 0,
            downloaded: 0,
            skipped: 0,
            failed: 0,
            percent: 0,
            logs: [],
        }));
        setProgress(initialProgress);

        // 2. Navigate to progress screen
        router.push('/progress');

        // 3. Trigger API
        try {
            await fetch('/api/download/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courses: courses.map(c => ({ id: c.id, url: c.url })) })
            });
        } catch (e) {
            console.error('Failed to start downloads:', e);
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
                addCourse,
                removeCourse,
                startDownloads,
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
