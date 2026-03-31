import { FolderArchive } from 'lucide-react';
import { Badge } from '../ui';

export const Header = ({ action }: { action?: React.ReactNode }) => (
    <header className="w-full border-b-[2px] border-border bg-surface/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="w-full px-6 md:px-12 h-16 flex items-center justify-between">
            {/* Logo + Wordmark */}
            <div className="flex items-center gap-3.5 group cursor-pointer select-none">
                <div className="relative">
                    {/* Offset shadow layer */}
                    <div className="absolute inset-0 bg-lilac rounded-2xl translate-x-[3px] translate-y-[3px] border-[2px] border-border transition-all duration-200 group-hover:translate-x-[5px] group-hover:translate-y-[5px]" />
                    <div className="relative w-10 h-10 bg-mint rounded-2xl flex items-center justify-center text-heading border-[2px] border-border transition-all duration-200 group-hover:-translate-y-1 group-hover:rotate-[-6deg]">
                        <FolderArchive size={20} strokeWidth={2.5} />
                    </div>
                </div>
                <div className="flex flex-col justify-center leading-none">
                    <h1 className="text-[18px] font-black tracking-[-0.04em] text-heading leading-none">LMS PDF</h1>
                    <span className="text-[9px] font-bold text-muted uppercase tracking-[0.22em] mt-1.5">Downloader</span>
                </div>
            </div>

            {/* Right side: actions + version */}
            <div className="flex items-center gap-3">
                {action}
                <Badge variant="primary" className="shadow-hard-sm text-[10px] px-2.5 py-1">v1.1.0</Badge>
            </div>
        </div>
        {/* Gradient accent bar */}
        <div className="h-[2px] bg-gradient-to-r from-mint via-lilac to-sky" />
    </header>
);
