import { NextRequest, NextResponse } from 'next/server';
import { runDownloader } from '@/core/downloader';

export async function POST(req: NextRequest) {
    try {
        const { courses } = await req.json();

        if (!courses || !Array.isArray(courses)) {
            return NextResponse.json({ error: 'Invalid courses list' }, { status: 400 });
        }

        // Trigger downloads in the background (no await)
        // We process them sequentially or in parallel? Standard downloader handles one course.
        // Let's loop through them.
        for (const course of courses) {
            // Fire and forget, events will be streamed
            runDownloader(course.id, course.url);
        }

        return NextResponse.json({ status: 'started' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
