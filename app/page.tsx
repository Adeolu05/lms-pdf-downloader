'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Shield, Key, CheckCircle, Zap, FolderArchive, FileText, ArrowRight } from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
import { AppShell } from '@/components/layout/AppShell';
import { CloudDeploymentBanner } from '@/components/layout/CloudDeploymentBanner';
import { VercelDownloadLanding } from '@/components/layout/VercelDownloadLanding';
import { useAppContext } from '@/lib/context';
import { isVercelHosted } from '@/lib/deployment';

function WelcomeLocalPage() {
    const router = useRouter();
    const { sessionStatus, initiateLogin, verifyLogin } = useAppContext();
    const [error, setError] = useState<string | null>(null);

    const handleStartLogin = async () => {
        setError(null);
        const result = await initiateLogin();
        if (result && !result.success) {
            setError(result.error || 'Failed to start login');
        }
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
                <CloudDeploymentBanner className="mb-8" />
                {/* Hero Headline */}
                <div className="text-center mb-10 animate-fade-in-up">
                    <h2 className="text-4xl sm:text-5xl font-black text-heading tracking-[-0.03em] leading-[1.1] mb-4">
                        Download every course PDF<br className="hidden sm:block" />
                        <span className="text-heading">automatically.</span>
                    </h2>
                    <p className="text-muted text-base sm:text-lg leading-relaxed max-w-xl mx-auto font-medium">
                        Connect your LMS, paste a course link, and let it handle the rest.
                        <strong className="text-heading font-bold"> Organised by week. Ready in minutes. No manual clicking.</strong>
                    </p>
                </div>

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
                                    No manual clicking. Log in securely once, and let the tool automatically locate and download every single PDF into perfectly structured folders.
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
                    {/* Smart Organisation Preview — takes 3 columns */}
                    <div className="md:col-span-3 animate-fade-in-up stagger-3">
                        <Card className="p-0 bg-surface border-[3px] border-border shadow-[4px_4px_0px_#111111] overflow-hidden h-full flex flex-col">
                            {/* Window Header */}
                            <div className="bg-surface-alt border-b-[3px] border-border px-5 py-3.5 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-3 h-3 rounded-full bg-error border-[2px] border-border/20 shadow-sm" />
                                    <div className="w-3 h-3 rounded-full bg-warning border-[2px] border-border/20 shadow-sm" />
                                    <div className="w-3 h-3 rounded-full bg-mint border-[2px] border-border/20 shadow-sm" />
                                </div>
                                <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em] bg-border/5 px-3 py-1 rounded-full border border-border/10">Smart Organisation</span>
                            </div>

                            {/* File Tree */}
                            <div className="p-6 flex-1 font-mono text-sm bg-[#fafafa]">
                                <div className="flex items-center gap-3 text-heading font-bold mb-4 animate-fade-in-up stagger-1">
                                    <FolderArchive size={20} className="text-mint fill-mint/20" />
                                    <span className="text-base tracking-tight">IFT_211_Digital_Logic</span>
                                </div>

                                {/* Week 1 Folder */}
                                <div className="ml-7 border-l-[2px] border-border/15 pl-6 py-2 animate-fade-in-up stagger-2 relative">
                                    <div className="absolute w-4 border-b-[2px] border-border/15 left-0 top-5"></div>
                                    <div className="flex items-center gap-3 text-heading font-semibold mb-3">
                                        <FolderArchive size={18} className="text-lilac fill-lilac/20" />
                                        <span>Week 1</span>
                                    </div>
                                    <div className="ml-7 flex items-center gap-3 text-muted/80 mb-1 hover:text-heading transition-colors cursor-default">
                                        <FileText size={16} />
                                        <span>Introduction_to_Logic.pdf</span>
                                    </div>
                                </div>

                                {/* Week 2 Folder */}
                                <div className="ml-7 border-l-[2px] border-border/15 pl-6 py-2 animate-fade-in-up stagger-3 relative">
                                    <div className="absolute w-4 border-b-[2px] border-border/15 left-0 top-5"></div>
                                    <div className="flex items-center gap-3 text-heading font-semibold mb-3">
                                        <FolderArchive size={18} className="text-lilac fill-lilac/20" />
                                        <span>Week 2</span>
                                    </div>
                                    <div className="ml-7 flex items-center gap-3 text-muted/80 mb-2 hover:text-heading transition-colors cursor-default">
                                        <FileText size={16} />
                                        <span>Boolean_Algebra_Rules.pdf</span>
                                    </div>
                                    <div className="ml-7 flex items-center gap-3 text-muted/80 mb-1 hover:text-heading transition-colors cursor-default">
                                        <FileText size={16} />
                                        <span className="bg-mint/20 px-1.5 rounded text-heading font-medium">Logic_Gates_Cheatsheet.pdf</span>
                                    </div>
                                </div>
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

export default function WelcomePage() {
    if (isVercelHosted()) {
        return (
            <Suspense
                fallback={
                    <AppShell maxWidth="lg" className="min-h-[50vh] flex items-center justify-center text-muted font-medium">
                        Loading…
                    </AppShell>
                }
            >
                <VercelDownloadLanding />
            </Suspense>
        );
    }

    return <WelcomeLocalPage />;
}
