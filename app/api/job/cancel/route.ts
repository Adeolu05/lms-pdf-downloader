import { NextRequest, NextResponse } from 'next/server';
import { abortAllJobs, abortJob } from '@/core/job-control';
import { downloaderEvents } from '@/lib/events';

/**
 * POST { courseId?: string } — cancel one course job, or all if omitted.
 */
export async function POST(req: NextRequest) {
    try {
        if (process.env.VERCEL) {
            return NextResponse.json({ error: 'Not available in cloud' }, { status: 400 });
        }

        const body = await req.json().catch(() => ({}));
        const courseId = typeof body.courseId === 'string' ? body.courseId : null;

        if (courseId) {
            abortJob(courseId);
            downloaderEvents.emitEvent(courseId, 'log', {
                message: 'Cancel requested…',
                type: 'warning',
            });
            return NextResponse.json({ status: 'cancelling', courseId });
        }

        abortAllJobs();
        downloaderEvents.emitEvent('system', 'log', {
            message: 'Cancel all jobs requested…',
            type: 'warning',
        });
        return NextResponse.json({ status: 'cancelling_all' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
