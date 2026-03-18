import { NextResponse } from 'next/server';
import { Browser, BrowserContext, Page } from 'playwright';
import { startLoginSession, validateAndSaveSession } from '@/core/session-manager';

// We'll use a global variable to track the active browser session for simplicity in this local MVP.
let activeBrowser: Browser | null = null;
let activeContext: BrowserContext | null = null;
let activePage: Page | null = null;

export async function POST() {
    try {
        if (activeBrowser) {
            await activeBrowser.close().catch(() => { });
        }

        const { browser, context, page } = await startLoginSession({ headless: false });
        activeBrowser = browser as Browser;
        activeContext = context as BrowserContext;
        activePage = page as Page;

        return NextResponse.json({ status: 'loading', message: 'Browser launched. Please log in.' });
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT() {
    if (!activePage || !activeContext) {
        return NextResponse.json({ error: 'No active login session. Click Login first.' }, { status: 400 });
    }

    try {
        await validateAndSaveSession(activeContext, activePage);

        if (activeBrowser) {
            await activeBrowser.close().catch(() => { });
        }
        activeBrowser = null;
        activeContext = null;
        activePage = null;

        return NextResponse.json({ status: 'ready', message: 'Login successful' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function DELETE() {
    if (activeBrowser) {
        await activeBrowser.close().catch(() => { });
        activeBrowser = null;
        activeContext = null;
        activePage = null;
    }
    return NextResponse.json({ status: 'none' });
}
