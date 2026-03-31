import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import os from 'os';
import { config } from '@/core/config';

function makeSafeFilename(text: string) {
    return text.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/\s+/g, ' ').trim();
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const courseName = body.courseName || '';
        
        const downloadsDir = path.resolve(config.downloadDir);
        const safeCourseName = courseName ? makeSafeFilename(courseName) : '';
        const targetDir = safeCourseName ? path.join(downloadsDir, safeCourseName) : downloadsDir;

        let command = '';
        if (os.platform() === 'win32') {
            command = `start "" "${targetDir}"`;
        } else if (os.platform() === 'darwin') {
            command = `open "${targetDir}"`;
        } else {
            command = `xdg-open "${targetDir}"`;
        }

        exec(command, (error) => {
            if (error) {
                console.error(`Failed to open directory ${targetDir}:`, error);
            }
        });

        return NextResponse.json({ success: true, path: targetDir });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
