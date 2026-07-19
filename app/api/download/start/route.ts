import { NextRequest, NextResponse } from 'next/server';
import { runDownloader } from '@/core/downloader';
import { beginBatch } from '@/core/job-control';

export async function POST(req: NextRequest) {
    try {
        const { courses } = await req.json();

        if (!courses || !Array.isArray(courses)) {
            return NextResponse.json({ error: 'Invalid courses list' }, { status: 400 });
        }

        beginBatch();

        for (const course of courses) {
            runDownloader(course.id, course.url);
        }

        return NextResponse.json({ status: 'started' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
