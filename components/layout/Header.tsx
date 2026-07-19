'use client';

import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, Library } from 'lucide-react';
import { Badge, Button, cn } from '../ui';
import { useAppContext } from '@/lib/context';

export const Header = ({ action }: { action?: React.ReactNode }) => {
    const router = useRouter();
    const pathname = usePathname();
    const { sessionStatus } = useAppContext();

    const sessionChip =
        sessionStatus === 'ready'
            ? { label: 'Session ready', className: 'bg-mint text-heading' }
            : sessionStatus === 'loading'
              ? { label: 'Logging in…', className: 'bg-yellow text-heading' }
              : { label: 'Not logged in', className: 'bg-surface-alt text-muted' };

    const onLibrary = pathname === '/library' || pathname?.startsWith('/library/');

    return (
        <header className="w-full border-b-[2px] border-border bg-surface/95 backdrop-blur-sm sticky top-0 z-50">
            <div className="w-full px-6 md:px-12 h-16 flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="flex items-center gap-3.5 group select-none text-left"
                    aria-label="Home — LMS Study Pack"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-lilac rounded-2xl translate-x-[3px] translate-y-[3px] border-[2px] border-border transition-all duration-200 group-hover:translate-x-[5px] group-hover:translate-y-[5px]" />
                        <div className="relative w-10 h-10 bg-mint rounded-2xl flex items-center justify-center text-heading border-[2px] border-border transition-all duration-200 group-hover:-translate-y-1 group-hover:rotate-[-6deg]">
                            <BookOpen size={20} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div className="flex flex-col justify-center leading-none">
                        <h1 className="text-[17px] sm:text-[18px] font-black tracking-[-0.04em] text-heading leading-none">
                            LMS Study Pack
                        </h1>
                        <span className="text-[9px] font-bold text-muted uppercase tracking-[0.18em] mt-1.5">
                            PDFs · Exam Pack
                        </span>
                    </div>
                </button>

                <div className="flex items-center gap-2 sm:gap-3">
                    <Button
                        variant={onLibrary ? 'secondary' : 'ghost'}
                        size="sm"
                        className={cn(onLibrary && 'shadow-hard-sm')}
                        onClick={() => router.push('/library')}
                        aria-label="Library"
                    >
                        <Library size={16} />
                        <span className="hidden sm:inline">Library</span>
                    </Button>
                    {action}
                    <Badge
                        variant="default"
                        className={`hidden sm:inline-flex shadow-hard-sm text-[10px] px-2.5 py-1 border-border ${sessionChip.className}`}
                    >
                        {sessionChip.label}
                    </Badge>
                    <Badge variant="primary" className="shadow-hard-sm text-[10px] px-2.5 py-1">
                        v1.1.0
                    </Badge>
                </div>
            </div>
            <div className="h-[2px] bg-gradient-to-r from-mint via-lilac to-sky" />
        </header>
    );
};
