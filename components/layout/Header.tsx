import { FolderArchive } from 'lucide-react';
import { Badge } from '../ui';

export const Header = ({ action }: { action?: React.ReactNode }) => (
    <header className="w-full border-b-[3px] border-border bg-surface sticky top-0 z-50">
        <div className="w-full px-6 md:px-12 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer">
                <div className="w-8 h-8 bg-mint rounded-lg flex items-center justify-center text-heading border-2 border-border shadow-[2px_2px_0px_#111111] transition-transform duration-200 group-hover:-rotate-6">
                    <FolderArchive size={18} strokeWidth={2.5} />
                </div>
                <h2 className="text-xl font-black tracking-tight text-heading">LMS PDF Downloader</h2>
            </div>
            <div className="flex items-center gap-4">
                {action}
                <Badge variant="primary" className="shadow-[2px_2px_0px_#111111]">v1.0</Badge>
            </div>
        </div>
        {/* Gradient accent line */}
        <div className="h-[2px] bg-gradient-to-r from-mint via-lilac to-sky" />
    </header>
);
