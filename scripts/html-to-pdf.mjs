/**
 * Convert existing Exam Pack.html files to PDF via Playwright.
 *   node scripts/html-to-pdf.mjs [path-to-html ...]
 * If no args, finds all Exam Pack.html files under downloads/
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath, pathToFileURL } from 'url';
import { chromium } from 'playwright';

// Optional user-local Chrome shared libs (Linux hosts without system packages)
const localChromeLibs = path.join(os.homedir(), '.local/chrome-deps/root/usr/lib/x86_64-linux-gnu');
if (fs.existsSync(localChromeLibs)) {
    const extra = [
        localChromeLibs,
        path.join(os.homedir(), '.local/chrome-deps/root/lib/x86_64-linux-gnu'),
    ].join(path.delimiter);
    process.env.LD_LIBRARY_PATH = process.env.LD_LIBRARY_PATH
        ? `${extra}${path.delimiter}${process.env.LD_LIBRARY_PATH}`
        : extra;
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function findHtmlFiles() {
    const downloads = path.join(root, 'downloads');
    const out = [];
    if (!fs.existsSync(downloads)) return out;
    for (const course of fs.readdirSync(downloads)) {
        const html = path.join(downloads, course, 'Exam Pack', 'Exam Pack.html');
        if (fs.existsSync(html)) out.push(html);
    }
    return out;
}

function pdfPathFor(htmlPath) {
    const packDir = path.dirname(htmlPath);
    const courseName = path.basename(path.dirname(packDir));
    const safe = courseName.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim();
    return path.join(packDir, `${safe} - Exam Pack.pdf`);
}

async function launchBrowser() {
    const candidates = [
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
        path.join(process.env.HOME || '', '.cache/ms-playwright/chromium-1208/chrome-linux64/chrome'),
        path.join(
            process.env.HOME || '',
            '.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell'
        ),
    ].filter(Boolean);

    const errors = [];
    for (const exe of candidates) {
        if (!fs.existsSync(exe)) continue;
        try {
            return await chromium.launch({ headless: true, executablePath: exe });
        } catch (e) {
            errors.push(`${exe}: ${e.message}`);
        }
    }
    try {
        return await chromium.launch({ headless: true });
    } catch (e) {
        errors.push(e.message);
        throw new Error('Chromium launch failed:\n' + errors.join('\n'));
    }
}

async function htmlToPdf(htmlPath, pdfPath) {
    const browser = await launchBrowser();
    try {
        const page = await browser.newPage();
        const fileUrl = pathToFileURL(path.resolve(htmlPath)).href;
        console.log('  open', fileUrl);
        await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 120_000 });
        await page
            .waitForFunction(() => typeof window.renderMathInElement === 'function', { timeout: 45_000 })
            .catch(() => console.warn('  (KaTeX auto-render not detected — continuing)'));
        await page.evaluate(() => {
            if (typeof window.renderMathInElement === 'function') {
                window.renderMathInElement(document.body, {
                    delimiters: [
                        { left: '\\(', right: '\\)', display: false },
                        { left: '\\[', right: '\\]', display: true },
                        { left: '$$', right: '$$', display: true },
                    ],
                    throwOnError: false,
                    strict: 'ignore',
                });
            }
        }).catch(() => {});
        await page.waitForTimeout(2000);
        await page.evaluate(async () => {
            await Promise.all(
                Array.from(document.images).map(
                    (img) =>
                        img.complete ||
                        new Promise((res) => {
                            img.onload = img.onerror = () => res(null);
                        })
                )
            );
        }).catch(() => {});

        await page.pdf({
            path: pdfPath,
            format: 'A4',
            printBackground: true,
            margin: { top: '14mm', bottom: '16mm', left: '12mm', right: '12mm' },
            displayHeaderFooter: true,
            headerTemplate: '<div></div>',
            footerTemplate: `
        <div style="font-size:9px;width:100%;padding:0 14mm;color:#666;display:flex;justify-content:space-between;font-family:sans-serif;">
          <span>Exam Pack</span>
          <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
        </div>`,
        });
        const st = fs.statSync(pdfPath);
        console.log('  wrote', pdfPath, `(${(st.size / 1024).toFixed(1)} KB)`);
    } finally {
        await browser.close().catch(() => {});
    }
}

const args = process.argv.slice(2);
const files = args.length ? args : findHtmlFiles();
if (!files.length) {
    console.error('No Exam Pack.html found.');
    process.exit(1);
}

console.log(`Converting ${files.length} HTML pack(s) to PDF…`);
for (const html of files) {
    console.log('\n•', html);
    await htmlToPdf(html, pdfPathFor(html));
}
console.log('\nDone.');
