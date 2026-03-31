'use client';

import { useSearchParams } from 'next/navigation';
import { Download, Terminal, Shield, ExternalLink, BookOpen, FolderArchive, Zap } from 'lucide-react';
import { Card, Badge, cn } from '@/components/ui';
import { AppShell } from '@/components/layout/AppShell';
import { GITHUB_RELEASES_LATEST_URL, GITHUB_REPO_URL } from '@/lib/constants';

const TERMINAL_STEPS = `git clone https://github.com/Adeolu05/lms-pdf-downloader.git
cd lms-pdf-downloader
npm install
npx playwright install chromium
npm run dev
# then open http://localhost:3000 — or use: npm run electron:dev`;

export function VercelDownloadLanding() {
    const searchParams = useSearchParams();
    const fromApp = searchParams.get('hint') === 'download';

    return (
        <AppShell maxWidth="lg" className="pb-16">
            {fromApp && (
                <div className="mb-6 p-4 rounded-card border-[2px] border-mint/40 bg-mint/15 text-sm text-heading font-medium text-center">
                    The full app (login & downloads) only runs on your computer. Use the Windows installer or terminal steps below.
                </div>
            )}

            <div className="text-center mb-10 animate-fade-in-up">
                <Badge variant="primary" className="mb-4 shadow-hard-sm">
                    Download &amp; docs — not the live LMS tool
                </Badge>
                <h1 className="text-4xl sm:text-5xl font-black text-heading tracking-[-0.03em] leading-[1.1] mb-4">
                    LMS PDF Downloader
                </h1>
                <p className="text-muted text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-medium">
                    This site helps you <strong className="text-heading">get the app</strong> and see how to run it. Your LMS login and PDF downloads happen{' '}
                    <strong className="text-heading">only on your own device</strong> — never on this server.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                <Card className="p-7 shadow-hard border-[3px] border-border flex flex-col gap-5 animate-fade-in-up">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-mint rounded-btn border-[2px] border-border shadow-hard-sm">
                            <Download className="text-heading" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-heading tracking-tight">Windows (recommended)</h2>
                            <p className="text-sm text-muted font-medium">Installer — no Node.js required.</p>
                        </div>
                    </div>
                    <p className="text-sm text-muted leading-relaxed">
                        Open the <strong className="text-heading">latest GitHub release</strong>, scroll to <strong className="text-heading">Assets</strong>, and download{' '}
                        <code className="text-xs font-mono bg-surface-alt px-1.5 py-0.5 rounded border border-border/30">LMS PDF Downloader-*-Setup.exe</code>.
                        Run the installer, then launch the app from the Start menu.
                    </p>
                    <p className="text-xs text-muted leading-relaxed bg-yellow/15 border border-border/20 rounded-btn px-3 py-2">
                        <strong className="text-heading">SmartScreen:</strong> the build is unsigned. If Windows warns you, use <em>More info</em> → <em>Run anyway</em>.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                        <a
                            href={GITHUB_RELEASES_LATEST_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                'inline-flex flex-1 items-center justify-center gap-2 rounded-btn font-bold transition-all duration-200 select-none text-center',
                                'bg-mint text-heading border-[2px] border-border shadow-hard hover:shadow-hard-lg hover:-translate-y-0.5 hover:scale-[1.02] active:shadow-none active:translate-y-0.5 active:scale-[0.97]',
                                'px-8 py-4 text-base'
                            )}
                        >
                            <Download size={20} />
                            Latest release
                            <ExternalLink size={16} className="opacity-80" />
                        </a>
                        <a
                            href={`${GITHUB_REPO_URL}/releases`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                'inline-flex flex-1 items-center justify-center gap-2 rounded-btn font-bold transition-all duration-200 select-none text-center',
                                'bg-surface-alt text-heading border-[2px] border-border shadow-hard-sm hover:bg-yellow/40 hover:shadow-hard hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.97]',
                                'px-8 py-4 text-sm'
                            )}
                        >
                            All releases
                        </a>
                    </div>
                </Card>

                <Card className="p-7 shadow-hard border-[3px] border-border flex flex-col gap-5 animate-fade-in-up stagger-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-lilac rounded-btn border-[2px] border-border shadow-hard-sm">
                            <Terminal className="text-heading" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-heading tracking-tight">From source (terminal)</h2>
                            <p className="text-sm text-muted font-medium">For developers — Node.js 18+ required.</p>
                        </div>
                    </div>
                    <p className="text-sm text-muted leading-relaxed">
                        Clone the repo, install dependencies, install Chromium for Playwright, then start the dev server or the Electron window.
                    </p>
                    <pre className="text-left text-[11px] sm:text-xs leading-relaxed font-mono bg-[#0F1117] text-mint/90 border-[2px] border-border rounded-btn p-4 overflow-x-auto whitespace-pre shadow-hard-sm">
                        {TERMINAL_STEPS}
                    </pre>
                    <div className="flex flex-wrap gap-3">
                        <a
                            href={`${GITHUB_REPO_URL}#readme`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                'inline-flex items-center justify-center gap-2 rounded-btn font-bold transition-all duration-200 select-none',
                                'bg-transparent text-heading border-[2px] border-border shadow-hard-sm hover:bg-surface-alt hover:shadow-hard hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.97]',
                                'px-4 py-2 text-xs'
                            )}
                        >
                            <BookOpen size={16} />
                            Full README
                        </a>
                        <a
                            href={GITHUB_REPO_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                'inline-flex items-center justify-center gap-2 rounded-btn font-bold transition-all duration-200 select-none',
                                'text-muted hover:text-heading hover:bg-surface-alt active:scale-[0.97]',
                                'px-4 py-2 text-xs'
                            )}
                        >
                            <ExternalLink size={16} />
                            Repository
                        </a>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                {[
                    { icon: Shield, title: 'Privacy', body: 'Credentials and PDFs stay on your machine.' },
                    { icon: FolderArchive, title: 'Organised', body: 'Course PDFs sorted by week in folders.' },
                    { icon: Zap, title: 'Hands-free', body: 'Queue courses and download in one go.' },
                ].map(({ icon: Icon, title, body }) => (
                    <div
                        key={title}
                        className="flex gap-3 p-4 rounded-card border-[2px] border-border/25 bg-surface-alt/50 shadow-hard-sm"
                    >
                        <div className="p-2 bg-surface rounded-lg border border-border/20 h-fit">
                            <Icon size={18} className="text-heading" />
                        </div>
                        <div>
                            <p className="font-black text-heading text-sm">{title}</p>
                            <p className="text-xs text-muted leading-relaxed mt-0.5">{body}</p>
                        </div>
                    </div>
                ))}
            </div>

            <footer className="flex flex-wrap gap-6 text-muted text-sm font-medium justify-center border-t-[2px] border-border/15 pt-10">
                <a
                    className="hover:text-mint underline underline-offset-4 decoration-border/20 hover:decoration-mint"
                    href={`${GITHUB_REPO_URL}#readme`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Documentation
                </a>
                <a className="hover:text-lilac underline underline-offset-4 decoration-border/20 hover:decoration-lilac" href="/privacy">
                    Privacy Policy
                </a>
                <a className="hover:text-sky underline underline-offset-4 decoration-border/20 hover:decoration-sky" href="mailto:hello@dpeluola.com">
                    Support
                </a>
            </footer>
        </AppShell>
    );
}
