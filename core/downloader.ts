import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { config } from './config';
import fs from 'fs';
import path from 'path';
import { downloaderEvents } from '@/lib/events';

/**
 * Refactored Downloader Engine (v18.0 - Modular ESM)
 * Supports real-time event emission for UI streaming.
 */

interface PDFItem {
    cleanTitle: string;
    weekFolder: string;
    url: string;
}

export async function runDownloader(courseId: string, courseUrl: string) {
    if (!fs.existsSync(config.sessionPath)) {
        downloaderEvents.emitEvent(courseId, 'error', { message: 'Session expired. Please log in again.' });
        return;
    }

    downloaderEvents.emitEvent(courseId, 'log', { message: 'Initializing browser engine...', type: 'info' });

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ storageState: config.sessionPath });
    const page = await context.newPage();

    try {
        downloaderEvents.emitEvent(courseId, 'log', { message: `Navigating to: ${courseUrl}`, type: 'info' });
        downloaderEvents.emitEvent(courseId, 'status', { status: 'scanning' });

        await page.goto(courseUrl, { waitUntil: 'domcontentloaded' });

        // 1. Session Validation
        const isLoginPage = await page.$(config.selectors.auth.loginIndicator);
        const currentUrl = page.url().toLowerCase();
        
        if (isLoginPage || currentUrl.includes('login') || currentUrl.includes('cas/')) {
            downloaderEvents.emitEvent(courseId, 'error', { message: 'Session invalid. Please click the key icon on the Welcome page to re-login.' });
            downloaderEvents.emitEvent(courseId, 'status', { status: 'failed' });
            return;
        }

        // 2. Scan for PDF items
        downloaderEvents.emitEvent(courseId, 'log', { message: 'Scanning modules for PDF materials...', type: 'pulse' });
        let pdfItems = await scanForPDFs(page);

        if (pdfItems.length === 0) {
            downloaderEvents.emitEvent(courseId, 'log', { message: 'No items found. Retrying scan...', type: 'warning' });
            await page.waitForTimeout(config.retryWait);
            await page.reload({ waitUntil: 'domcontentloaded' });
            pdfItems = await scanForPDFs(page);
        }

        if (pdfItems.length === 0) {
            downloaderEvents.emitEvent(courseId, 'log', { message: 'Scan finished. 0 PDF items found.', type: 'error' });
            downloaderEvents.emitEvent(courseId, 'status', { status: 'failed' });
            return;
        }

        // 3. Setup Course Directory
        let courseName = 'Unknown_Course';
        const courseNameElement = await page.$(config.selectors.course.courseName);
        if (courseNameElement) {
            courseName = makeSafeFilename(await courseNameElement.innerText());
            downloaderEvents.emitEvent(courseId, 'meta', { name: courseName });
        }

        const courseDirPath = path.join(config.downloadDir, courseName);
        if (!fs.existsSync(courseDirPath)) fs.mkdirSync(courseDirPath, { recursive: true });

        downloaderEvents.emitEvent(courseId, 'log', { message: `Found ${pdfItems.length} items. Starting downloads...`, type: 'success' });
        downloaderEvents.emitEvent(courseId, 'status', { status: 'downloading', total: pdfItems.length });

        let downloaded = 0;
        let skipped = 0;
        let failed = 0;

        // 4. Processing Loop
        for (let i = 0; i < pdfItems.length; i++) {
            const item = pdfItems[i];
            const canonicalPath = getCanonicalFilePath(item, courseDirPath);
            const weekDirPath = path.dirname(canonicalPath);

            downloaderEvents.emitEvent(courseId, 'log', { message: `[${i + 1}/${pdfItems.length}] Processing: ${item.cleanTitle}`, type: 'info' });

            if (fs.existsSync(canonicalPath)) {
                downloaderEvents.emitEvent(courseId, 'log', { message: `Skipping: ${item.cleanTitle} (Already exists)`, type: 'warning' });
                skipped++;
                updateProgress(courseId, downloaded, skipped, failed, pdfItems.length);
                continue;
            }

            try {
                await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
                const pdfUrl = await extractPdfSource(page);

                if (!pdfUrl) throw new Error('PDF source not found.');

                const response = await context.request.get(pdfUrl);
                if (response.ok()) {
                    if (!fs.existsSync(weekDirPath)) fs.mkdirSync(weekDirPath, { recursive: true });
                    fs.writeFileSync(canonicalPath, await response.body());
                    downloaderEvents.emitEvent(courseId, 'log', { message: `Saved: ${item.cleanTitle}`, type: 'success' });
                    downloaded++;
                } else {
                    throw new Error(`Download failed (${response.status()})`);
                }
            } catch (err: any) {
                downloaderEvents.emitEvent(courseId, 'log', { message: `Failed: ${item.cleanTitle} - ${err.message}`, type: 'error' });
                failed++;
            }

            updateProgress(courseId, downloaded, skipped, failed, pdfItems.length);
            await page.waitForTimeout(config.delay);
        }

        downloaderEvents.emitEvent(courseId, 'log', { message: 'All materials processed successfully.', type: 'success' });
        downloaderEvents.emitEvent(courseId, 'status', { status: 'completed' });

    } catch (err: any) {
        downloaderEvents.emitEvent(courseId, 'log', { message: `Fatal: ${err.message}`, type: 'error' });
        downloaderEvents.emitEvent(courseId, 'status', { status: 'failed' });
    } finally {
        await browser.close().catch(() => { });
    }
}

function updateProgress(courseId: string, downloaded: number, skipped: number, failed: number, total: number) {
    const percent = Math.round(((downloaded + skipped + failed) / total) * 100);
    downloaderEvents.emitEvent(courseId, 'progress', {
        downloaded,
        skipped,
        failed,
        percent
    });
}

function getCanonicalFilePath(item: PDFItem, courseDirPath: string) {
    const safeFilename = makeSafeFilename(item.cleanTitle) + '.pdf';
    return path.join(courseDirPath, item.weekFolder, safeFilename);
}

function makeSafeFilename(text: string) {
    return text.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/\s+/g, ' ').trim();
}

function cleanTitle(rawTitle: string) {
    return rawTitle.replace(config.pdfMatchRegex, '').replace(/\b(Page|URL|File)\b\s*$/gi, '').trim();
}

async function extractPdfSource(page: Page) {
    const currentUrl = page.url();
    if (currentUrl.toLowerCase().includes('.pdf')) return currentUrl;

    const iframe = await page.$(config.selectors.viewer.pdfIframe);
    if (iframe) return await iframe.getAttribute('src') || await iframe.getAttribute('data');

    const embed = await page.$(config.selectors.viewer.pdfEmbed);
    if (embed) return await embed.getAttribute('src');

    const object = await page.$(config.selectors.viewer.pdfObject);
    if (object) return await object.getAttribute('data') || await object.getAttribute('src');

    const anchor = await page.$(config.selectors.viewer.pdfAnchor);
    if (anchor) return await anchor.getAttribute('href');

    return null;
}

async function scanForPDFs(page: Page) {
    const list: PDFItem[] = [];
    const elements = await page.$$(config.selectors.course.pdfLink);
    for (const el of elements) {
        const titleEl = await el.$(config.selectors.course.title);
        if (titleEl) {
            const rawTitle = await titleEl.innerText();
            const href = await el.getAttribute('href');
            if (!href) continue;
            const cleaned = cleanTitle(rawTitle);
            const weekMatch = cleaned.match(config.weekRegex);
            const weekFolder = weekMatch ? weekMatch[0] : 'General';
            list.push({ cleanTitle: cleaned, weekFolder, url: href.startsWith('http') ? href : new URL(href, config.baseUrl).toString() });
        }
    }
    return list;
}
