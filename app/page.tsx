'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Shield, Key, CheckCircle, Zap, FolderArchive, FileText, ArrowRight } from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AppShell } from '@/components/layout/AppShell';
import { useAppContext } from '@/lib/context';

export default function WelcomePage() {
    const router = useRouter();
    const { sessionStatus, initiateLogin, verifyLogin } = useAppContext();
    const [error, setError] = useState<string | null>(null);

    const handleStartLogin = async () => {
        setError(null);
        await initiateLogin();
    };

    const handleVerify = async () => {
        setError(null);
        const result = await verifyLogin();
        if (result.success) {
            router.push('/courses');
        } else {
            setError(result.error || 'Login failed. Please try again.');
        }
    };

    const handleContinue = () => {
        router.push('/courses');
    };

    return (
        <AppShell maxWidth="lg" className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
            <div className="w-full flex flex-col items-center max-w-[880px] mx-auto">
                {/* Welcome Section Header */}
                <SectionHeader
                    title="Download every course PDF — automatically"
                    description="Connect your LMS, paste a course link, and watch every PDF download itself. Organised by week, ready in minutes."
                    align="center"
                    className="mb-10"
                />

                {/* Main Connection Card — Wide Two-Column Layout */}
                <Card className="w-full p-0 shadow-[6px_6px_0px_#111111] overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* Left Side — Decorative Hero */}
                        <div className="bg-gradient-to-br from-mint/30 via-surface to-lilac/20 p-8 md:p-10 flex flex-col justify-between border-b-[3px] md:border-b-0 md:border-r-[3px] border-border">
                            <div>
                                <div 
                                    className="w-16 h-16 bg-mint rounded-2xl flex items-center justify-center mb-6 border-[3px] border-border shadow-[4px_4px_0px_#111111] transition-transform duration-200 hover:-rotate-6 cursor-pointer"
                                    onClick={handleStartLogin}
                                >
                                    <Key className="text-heading" size={28} />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black text-heading mb-3 tracking-tight leading-tight">
                                    Connect your<br />LMS session
                                </h2>
                                <p className="text-muted text-sm md:text-base leading-relaxed max-w-sm">
                                    Log in once through your browser and save a secure local session. The app uses session cookies to access your course files — no passwords are ever stored.
                                </p>
                            </div>

                            {/* Privacy callout */}
                            <div className="flex items-center gap-3 mt-8 p-3 bg-surface/70 rounded-xl border border-border/15 backdrop-blur-sm">
                                <div className="p-2 bg-lilac rounded-lg border-2 border-border shadow-[2px_2px_0px_#111111] flex-shrink-0">
                                    <Shield size={16} className="text-heading" />
                                </div>
                                <p className="text-xs text-muted leading-relaxed">
                                    <strong className="text-heading font-bold">Privacy First</strong> — your login stays on your device. Nothing is sent to us.
                                </p>
                            </div>
                        </div>

                        {/* Right Side — Session Status + Action */}
                        <div className="p-8 md:p-10 flex flex-col items-center justify-center text-center bg-surface">
                            {/* Status Indicator */}
                            <div className="mb-8">
                                {sessionStatus === 'none' && (
                                    <div className="flex flex-col items-center gap-4 animate-fade-in-up">
                                        <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center border-[3px] border-border/20">
                                            <span className="relative flex h-4 w-4">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-4 w-4 bg-error"></span>
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-heading tracking-tight mb-1">No session saved</p>
                                            <p className="text-sm text-muted font-medium">Click below to start the login flow</p>
                                        </div>
                                    </div>
                                )}
                                {sessionStatus === 'loading' && (
                                    <div className="flex flex-col items-center gap-4 animate-fade-in-up">
                                        <div className="w-20 h-20 bg-yellow/20 rounded-full flex items-center justify-center border-[3px] border-border/20 animate-gentle-pulse">
                                            <div className="w-8 h-8 border-[3px] border-heading border-t-transparent rounded-full animate-spin" />
                                        </div>
                                        <div>
                                            <Badge variant="warning" className="px-4 py-2 text-sm shadow-[2px_2px_0px_#111111] mb-2">Login in progress...</Badge>
                                            <p className="text-sm text-muted font-medium max-w-xs">Log in to your LMS in the browser window, then return here.</p>
                                        </div>
                                    </div>
                                )}
                                {sessionStatus === 'ready' && (
                                    <div className="flex flex-col items-center gap-4 animate-fade-in-up">
                                        <div className="w-20 h-20 bg-mint/20 rounded-full flex items-center justify-center border-[3px] border-border/20">
                                            <CheckCircle size={36} className="text-heading" />
                                        </div>
                                        <div>
                                            <Badge variant="success" className="px-4 py-2 text-sm shadow-[2px_2px_0px_#111111] mb-2">Session ready</Badge>
                                            <p className="text-sm text-muted font-medium">You&apos;re all set! Head to courses.</p>
                                        </div>
                                    </div>
                                )}
                                {error && (
                                    <p className="text-sm text-red-600 font-bold mt-4 bg-red-100 px-4 py-2 rounded-lg border-2 border-red-200 animate-fade-in-up">{error}</p>
                                )}
                            </div>

                            {/* CTA Button */}
                            <div className="w-full max-w-xs">
                                {sessionStatus === 'none' && (
                                    <Button className="w-full py-5 text-base font-bold shadow-[4px_4px_0px_#111111]" onClick={handleStartLogin}>
                                        <LogIn size={20} className="mr-2" />
                                        <span>Login to LMS</span>
                                    </Button>
                                )}
                                {sessionStatus === 'loading' && (
                                    <Button variant="primary" className="w-full py-5 text-base font-bold shadow-[4px_4px_0px_#111111]" onClick={handleVerify}>
                                        <CheckCircle size={20} className="mr-2" />
                                        <span>Confirm Login Ready</span>
                                    </Button>
                                )}
                                {sessionStatus === 'ready' && (
                                    <Button className="w-full py-5 text-base font-bold shadow-[4px_4px_0px_#111111] bg-mint text-heading hover:bg-mint/90" onClick={handleContinue}>
                                        <span>Continue to Courses</span>
                                        <ArrowRight size={20} className="ml-2" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Animated Mini Preview + Feature Highlights Row */}
                <div className="w-full grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
                    {/* Preview — takes 3 columns */}
                    <div className="md:col-span-3 animate-fade-in-up stagger-3">
                        <Card className="p-5 bg-surface-alt/60 shadow-[3px_3px_0px_#111111] border-[2px] h-full">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 rounded-full bg-error" />
                                <div className="w-2 h-2 rounded-full bg-warning" />
                                <div className="w-2 h-2 rounded-full bg-mint" />
                                <span className="ml-2 text-xs font-bold text-muted uppercase tracking-widest">Preview</span>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { name: 'Week 1 — Introduction.pdf', status: '✅', delay: 'stagger-1' },
                                    { name: 'Week 2 — Boolean Algebra.pdf', status: '✅', delay: 'stagger-2' },
                                    { name: 'Week 3 — Logic Gates.pdf', status: '⏳', delay: 'stagger-3' },
                                ].map((file) => (
                                    <div
                                        key={file.name}
                                        className={`flex items-center gap-3 p-3 rounded-btn bg-surface border border-border/20 animate-fade-in-up ${file.delay}`}
                                    >
                                        <FileText size={16} className="text-muted flex-shrink-0" />
                                        <span className="text-sm font-medium text-heading truncate">{file.name}</span>
                                        <span className="ml-auto text-sm">{file.status}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Feature Highlights — takes 2 columns, stacked vertically */}
                    <div className="md:col-span-2 flex flex-col gap-4">
                        {[
                            { icon: Zap, label: 'Auto-download', desc: 'Every PDF, hands-free', color: 'bg-mint/20', delay: 'stagger-4' },
                            { icon: FolderArchive, label: 'Organised', desc: 'Sorted by week automatically', color: 'bg-lilac/20', delay: 'stagger-5' },
                            { icon: Shield, label: 'Private', desc: 'Nothing leaves your device', color: 'bg-sky/20', delay: 'stagger-6' },
                        ].map((feat) => (
                            <div
                                key={feat.label}
                                className={`flex items-center gap-3 p-4 rounded-card ${feat.color} border-2 border-border/20 animate-fade-in-up ${feat.delay} transition-transform duration-200 hover:-translate-y-1`}
                            >
                                <div className="p-2 bg-surface rounded-lg border border-border/20 flex-shrink-0">
                                    <feat.icon size={18} className="text-heading" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-heading tracking-tight">{feat.label}</p>
                                    <p className="text-xs text-muted">{feat.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Links */}
                <footer className="mt-12 flex gap-8 text-muted text-sm pb-12 font-medium">
                    <a className="hover:text-mint hover:-translate-y-1 transition-all underline underline-offset-4 decoration-border/20 hover:decoration-mint" href="https://github.com/Adeolu05/lms-pdf-downloader#readme" target="_blank" rel="noopener noreferrer">Documentation</a>
                    <a className="hover:text-lilac hover:-translate-y-1 transition-all underline underline-offset-4 decoration-border/20 hover:decoration-lilac" href="/privacy">Privacy Policy</a>
                    <a className="hover:text-sky hover:-translate-y-1 transition-all underline underline-offset-4 decoration-border/20 hover:decoration-sky" href="mailto:hello@dpeluola.com">Support</a>
                </footer>
            </div>
        </AppShell>
    );
}
