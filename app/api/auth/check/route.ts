import { NextResponse } from 'next/server';
import { checkSessionSync } from '@/core/session-manager';

export async function GET() {
    try {
        const isReady = checkSessionSync();
        return NextResponse.json({
            status: isReady ? 'ready' : 'none',
            message: isReady ? 'Session found' : 'No session found'
        });
    } catch (error) {
        return NextResponse.json({ status: 'none', error: 'Failed to check session' }, { status: 500 });
    }
}
