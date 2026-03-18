'use client';

import { Link as LinkIcon, Trash2 } from 'lucide-react';

interface CourseCardProps {
    url: string;
    name: string;
    onRemove: () => void;
}

const AVATAR_COLORS = ['bg-mint', 'bg-lilac', 'bg-sky', 'bg-yellow'];

function getAvatarColor(url: string) {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
        hash = url.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export const CourseCard = ({ url, name, onRemove }: CourseCardProps) => {
    const avatarColor = getAvatarColor(url);

    return (
        <div className="group flex items-center justify-between gap-4 rounded-card border-[3px] border-border bg-surface p-4 transition-all duration-200 hover:shadow-[4px_4px_0px_#111111] hover:-translate-x-[2px] hover:-translate-y-[2px] animate-fade-in-up">
            <div className="flex items-center gap-4 min-w-0">
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${avatarColor} text-heading border-[3px] border-border shadow-[2px_2px_0px_#111111] transition-transform duration-200 group-hover:-rotate-3`}>
                    <LinkIcon size={18} className="text-heading" />
                </div>
                <div className="flex flex-col min-w-0">
                    <p className="truncate text-base font-black text-heading tracking-tight">{url}</p>
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-muted">{name}</p>
                        <span className="text-[10px] font-bold text-muted/60 uppercase tracking-widest bg-surface-alt px-2 py-0.5 rounded-full border border-border/10">Ready to scan</span>
                    </div>
                </div>
            </div>
            <button
                className="p-3 text-muted border-2 border-transparent rounded-lg hover:border-border hover:bg-error hover:text-white hover:shadow-[2px_2px_0px_#111111] transition-all duration-200 active:scale-90"
                onClick={onRemove}
                aria-label="Remove course"
            >
                <Trash2 size={20} />
            </button>
        </div>
    );
};
