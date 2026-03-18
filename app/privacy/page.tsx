'use client';

import { ArrowLeft, Shield, Eye, HardDrive, Cookie, Mail } from 'lucide-react';
import { Card } from '@/components/ui';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AppShell } from '@/components/layout/AppShell';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
    return (
        <AppShell maxWidth="lg" className="pb-12">
            {/* Back Link + Header Row */}
            <div className="flex items-center justify-between mb-6">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-heading transition-colors group"
                >
                    <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                    Back to Home
                </Link>
                <span className="text-xs text-muted font-medium">Updated March 18, 2026</span>
            </div>

            <SectionHeader
                title="Privacy Policy"
                description="How LMS PDF Downloader handles your data."
                align="left"
                className="mb-6"
            />

            {/* Two-column grid for policy sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Overview */}
                <Card className="p-6 shadow-[4px_4px_0px_#111111] transition-all hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[2px_2px_0px_#111111] animate-fade-in-up stagger-1">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-mint rounded-xl border-2 border-border shadow-[2px_2px_0px_#111111]">
                            <Shield size={18} className="text-heading" />
                        </div>
                        <h2 className="text-lg font-black text-heading tracking-tight">Overview</h2>
                    </div>
                    <p className="text-sm text-muted leading-relaxed">
                        LMS PDF Downloader helps students download and organise course PDFs from their LMS.
                        We are committed to protecting your privacy. This policy explains what data the app handles and how it is used.
                    </p>
                </Card>

                {/* What We Collect */}
                <Card className="p-6 shadow-[4px_4px_0px_#111111] transition-all hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[2px_2px_0px_#111111]">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-lilac rounded-xl border-2 border-border shadow-[2px_2px_0px_#111111]">
                            <Eye size={18} className="text-heading" />
                        </div>
                        <h2 className="text-lg font-black text-heading tracking-tight">What We Collect</h2>
                    </div>
                    <p className="text-sm text-muted leading-relaxed mb-3">
                        We do <strong className="text-heading">not</strong> collect, store, or transmit any personal data. Specifically:
                    </p>
                    <ul className="space-y-2">
                        {[
                            'No LMS username or password stored.',
                            'No usage or browsing tracking.',
                            'No third-party analytics or ads.',
                            'No personally identifiable information (PII).',
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted leading-relaxed">
                                <span className="mt-1.5 h-2 w-2 rounded-full bg-lilac border border-border flex-shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </Card>

                {/* Local Data Storage */}
                <Card className="p-6 shadow-[4px_4px_0px_#111111] transition-all hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[2px_2px_0px_#111111]">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-sky rounded-xl border-2 border-border shadow-[2px_2px_0px_#111111]">
                            <HardDrive size={18} className="text-heading" />
                        </div>
                        <h2 className="text-lg font-black text-heading tracking-tight">Local Data Storage</h2>
                    </div>
                    <p className="text-sm text-muted leading-relaxed mb-3">
                        Data is stored <strong className="text-heading">locally on your device only</strong>:
                    </p>
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-sm text-muted leading-relaxed">
                            <span className="mt-1.5 h-2 w-2 rounded-full bg-sky border border-border flex-shrink-0" />
                            <span><strong className="text-heading">Session cookies</strong> — saved locally after login, never transmitted to us.</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-muted leading-relaxed">
                            <span className="mt-1.5 h-2 w-2 rounded-full bg-sky border border-border flex-shrink-0" />
                            <span><strong className="text-heading">Downloaded PDFs</strong> — saved to a local folder on your machine.</span>
                        </li>
                    </ul>
                    <p className="text-xs text-muted leading-relaxed mt-3">
                        Delete anytime by removing the <code className="bg-surface-alt px-1 py-0.5 rounded text-xs font-mono border border-border/20">sessions/</code> and <code className="bg-surface-alt px-1 py-0.5 rounded text-xs font-mono border border-border/20">downloads/</code> folders.
                    </p>
                </Card>

                {/* Cookies & Authentication */}
                <Card className="p-6 shadow-[4px_4px_0px_#111111] transition-all hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[2px_2px_0px_#111111]">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-yellow rounded-xl border-2 border-border shadow-[2px_2px_0px_#111111]">
                            <Cookie size={18} className="text-heading" />
                        </div>
                        <h2 className="text-lg font-black text-heading tracking-tight">Cookies &amp; Auth</h2>
                    </div>
                    <p className="text-sm text-muted leading-relaxed">
                        Session cookies are used solely to maintain your authenticated LMS session.
                        They are created by your LMS (not by us) and stored locally on your device.
                        We never access, read, or transmit your login credentials.
                    </p>
                </Card>
            </div>

            {/* Contact Banner */}
            <Card className="mt-4 p-5 shadow-[4px_4px_0px_#111111] flex items-center gap-4 transition-all hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[2px_2px_0px_#111111]">
                <div className="p-2 bg-mint rounded-xl border-2 border-border shadow-[2px_2px_0px_#111111] flex-shrink-0">
                    <Mail size={18} className="text-heading" />
                </div>
                <p className="text-sm text-muted leading-relaxed">
                    Questions? Reach out at{' '}
                    <a
                        href="mailto:hello@dpeluola.com"
                        className="text-heading font-bold underline underline-offset-4 decoration-mint hover:text-mint transition-colors"
                    >
                        hello@dpeluola.com
                    </a>
                </p>
            </Card>

            {/* Footer */}
            <footer className="mt-8 text-center text-sm text-muted font-medium pb-8">
                &copy; {new Date().getFullYear()} LMS PDF Downloader &mdash; Built by{' '}
                <a
                    href="https://github.com/Adeolu05"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-heading font-bold underline underline-offset-4 decoration-border/20 hover:decoration-mint hover:text-mint transition-colors"
                >
                    David Peluola
                </a>
            </footer>
        </AppShell>
    );
}
