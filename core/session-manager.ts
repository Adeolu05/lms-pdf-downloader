import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { config } from './config';
import fs from 'fs';
import path from 'path';

/**
 * Miva LMS Login & Session Manager - Modular Version (ESM)
 */

export function checkSessionSync() {
    return fs.existsSync(config.sessionPath);
}

export async function startLoginSession(options: { targetUrl?: string; headless?: boolean } = {}) {
    const { targetUrl = config.baseUrl, headless = false } = options;
    const hasExistingSession = checkSessionSync();

    const browser = await chromium.launch({ headless });
    const contextOptions = hasExistingSession ? { storageState: config.sessionPath } : {};
    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    return { browser, context, page };
}

export async function validateAndSaveSession(context: BrowserContext, page: Page) {
    const currentUrl = page.url();
    const pageContent = await page.content();

    const looksLikeLoginPage =
        /login|signin/i.test(currentUrl) ||
        /name="username"|name="password"|type="password"/i.test(pageContent);

    if (looksLikeLoginPage) {
        throw new Error('Still on login page. Please log in first.');
    }

    const cookies = await context.cookies();
    const domains = [...new Set(cookies.map(c => c.domain))];
    const hasLmsCookie = domains.some(d => d.includes('lms.miva.university'));

    if (!hasLmsCookie) {
        throw new Error('Session not found on lms.miva.university. Ensure you are on the correct domain.');
    }

    const sessionDir = path.dirname(config.sessionPath);
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

    await context.storageState({ path: config.sessionPath });
    return true;
}

export { config };
