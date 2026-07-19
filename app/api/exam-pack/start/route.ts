import { NextRequest, NextResponse } from 'next/server';
import { runExamPack } from '@/core/exam-pack';
import { beginBatch } from '@/core/job-control';

export async function POST(req: NextRequest) {
    try {
        if (process.env.VERCEL) {
            return NextResponse.json(
                {
                    error: 'Exam Pack only runs locally (needs your LMS session and disk).',
                    isVercel: true,
                },
                { status: 400 }
            );
        }

        const { courses } = await req.json();

        if (!courses || !Array.isArray(courses)) {
            return NextResponse.json({ error: 'Invalid courses list' }, { status: 400 });
        }

        beginBatch();

        for (const course of courses) {
            runExamPack(course.id, course.url);
        }

        return NextResponse.json({ status: 'started', mode: 'exam-pack' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
