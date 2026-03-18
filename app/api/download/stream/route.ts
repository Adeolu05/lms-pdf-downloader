import { NextRequest, NextResponse } from 'next/server';
import { downloaderEvents } from '@/lib/events';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    const encoder = new TextEncoder();

    // Listener function
    const onEvent = (event: any) => {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        writer.write(encoder.encode(data)).catch(() => {
            // Handle closed connection
            downloaderEvents.removeListener('event', onEvent);
        });
    };

    // Subscribe to downloader events
    downloaderEvents.on('event', onEvent);

    // Close connection handling
    req.signal.addEventListener('abort', () => {
        downloaderEvents.removeListener('event', onEvent);
        writer.close().catch(() => { });
    });

    return new NextResponse(responseStream.readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
        },
    });
}
