const { chromium } = require('playwright');
const config = require('./config');
const fs = require('fs');
const path = require('path');

/**
 * Main Downloader Script - Diagnostics & Robustness v17.0
 */
async function runDownloader(courseUrl) {
    if (!courseUrl) {
        console.error('Error: Please provide a course URL.');
        process.exit(1);
    }

    if (!fs.existsSync(config.sessionPath)) {
        console.error(`Error: Session state not found at ${config.sessionPath}.`);
        process.exit(1);
    }

    console.log('\n--- Miva LMS PDF Downloader (v17.0 Debug) ---');
    console.log(`Loading session keys from: ${config.sessionPath}`);

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ storageState: config.sessionPath });
    const page = await context.newPage();

    try {
        console.log(`\nNavigating to Course: ${courseUrl}`);
        await page.goto(courseUrl, { waitUntil: 'domcontentloaded' });

        // 1. Session Validation
        const isLoginPage = await page.$(config.selectors.auth.loginIndicator);
        if (isLoginPage) {
            console.error('\n--- SESSION EXPIRED ---');
            console.error('Action: Please run: npm run login');
            return;
        }

        // 2. Scan for PDF items
        console.log('Action: Scanning for PDF materials...');
        let pdfItems = await scanForPDFs(page);

        if (pdfItems.length === 0) {
            console.log(`Warning: No PDF items found. Retrying...`);
            await page.waitForTimeout(config.retryWait);
            await page.reload({ waitUntil: 'domcontentloaded' });
            pdfItems = await scanForPDFs(page);
        }

        if (pdfItems.length === 0) {
            console.log('\n--- DIAGNOSTICS: 0 ITEMS FOUND ---');
            return;
        }

        // 3. Setup Course Directory
        let courseName = 'Unknown_Course';
        const courseNameElement = await page.$(config.selectors.course.courseName);
        if (courseNameElement) {
            courseName = makeSafeFilename(await courseNameElement.innerText());
        }
        const courseDirPath = path.join(config.downloadDir, courseName);
        if (!fs.existsSync(courseDirPath)) fs.mkdirSync(courseDirPath, { recursive: true });

        console.log(`Found ${pdfItems.length} PDF items. Starting processing...\n`);

        // 4. Processing Loop
        for (let i = 0; i < pdfItems.length; i++) {
            const item = pdfItems[i];

            const canonicalPath = getCanonicalFilePath(item, courseDirPath);
            const weekDirPath = path.dirname(canonicalPath);

            console.log(`[${i + 1}/${pdfItems.length}] Item: ${item.cleanTitle}`);

            if (fs.existsSync(canonicalPath)) {
                console.log(` Status: Skipping existing file.`);
                continue;
            }

            try {
                let pdfUrl = null;
                let extractionPath = "Direct";

                // Stage 1: Resource Page
                console.log(` Action: Navigating to resource page...`);
                await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
                pdfUrl = await extractWithRetry(page);

                // Stage 2: Gateway Hop if needed
                if (!pdfUrl) {
                    const gatewayUrl = await findGatewayWithDiagnostics(page, item.cleanTitle);
                    if (gatewayUrl) {
                        console.log(` Action: Hop to gateway: ${gatewayUrl}`);
                        extractionPath = "Intermediate Link -> Viewer";
                        await page.goto(gatewayUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
                        await page.waitForTimeout(config.selectors.viewer.extractionWait);
                        pdfUrl = await extractWithRetry(page);
                    }
                }

                if (!pdfUrl) {
                    await runExtractionDiagnostics(page);
                    throw new Error('PDF source not found after all attempts.');
                }

                console.log(` Action: Downloading from ${extractionPath}...`);
                const response = await context.request.get(pdfUrl);
                if (response.ok()) {
                    if (!fs.existsSync(weekDirPath)) fs.mkdirSync(weekDirPath, { recursive: true });
                    fs.writeFileSync(canonicalPath, await response.body());
                    console.log(` Status: Success! Saved to canonical path.`);
                } else {
                    throw new Error(`Download failed (Status ${response.status()})`);
                }

            } catch (err) {
                console.error(` Status: Failed! Reason: ${err.message}`);
            }

            await page.waitForTimeout(config.delay);
        }

        console.log('\n--- All Processing Finished! ---');

    } catch (fatalErr) {
        console.error('\nFatal Error:', fatalErr.message);
    } finally {
        console.log('Action: Cleaning up browser session...');
        await browser.close();
    }
}

/**
 * Extraction with a short "Last Chance" retry
 */
async function extractWithRetry(page) {
    let url = await extractPdfSource(page);
    if (!url) {
        // Wait a bit more and try again
        await page.waitForTimeout(2000);
        url = await extractPdfSource(page);
    }
    return url;
}

/**
 * Advanced Diagnostics: Dump links and frames
 */
async function runExtractionDiagnostics(page) {
    console.log('\n--- DIAGNOSTICS: EXTRACTION FAILURE ---');
    console.log(`URL: ${page.url()}`);

    // Iframe Diagnostics
    const frames = await page.$$eval('iframe, embed, object', elms => elms.map(e => ({
        tag: e.tagName,
        src: e.src || e.data,
        type: e.type || 'none'
    })));

    if (frames.length === 0) {
        console.log('Frames: None found.');
    } else {
        console.log('Frames found:');
        frames.forEach((f, idx) => console.log(` [${idx + 1}] <${f.tag}> src="${f.src}" type="${f.type}"`));
    }

    // Link Diagnostics
    const links = await page.$$eval('a', elms => elms.map(e => ({
        text: e.innerText.trim(),
        href: e.href
    })));

    console.log(`Links: Found ${links.length} total.`);
    if (links.length > 0) {
        console.log('Top 10 Links:');
        links.slice(0, 10).forEach(l => console.log(` - [${l.text || 'EMPTY'}] -> ${l.href}`));
    }
}

async function findGatewayWithDiagnostics(page, targetTitle) {
    const link = await page.$(config.selectors.viewer.gatewayLink);
    if (link) return await link.getAttribute('href');

    const allLinks = await page.$$('a');
    const keywords = ['open', 'resource', 'click', 'view', 'download', targetTitle.toLowerCase()];

    for (const l of allLinks) {
        const text = (await l.innerText()).toLowerCase();
        const href = await l.getAttribute('href');
        if (!href || href.startsWith('javascript:')) continue;

        if (keywords.some(k => text.includes(k))) {
            console.log(` Diagnostic: Matched link text "${await l.innerText()}" via keyword.`);
            return href;
        }
    }
    return null;
}

function getCanonicalFilePath(item, courseDirPath) {
    const safeFilename = makeSafeFilename(item.cleanTitle) + '.pdf';
    return path.join(courseDirPath, item.weekFolder, safeFilename);
}

function makeSafeFilename(text) {
    return text.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/\s+/g, ' ').trim();
}

function cleanTitle(rawTitle) {
    return rawTitle.replace(config.pdfMatchRegex, '').replace(/\b(Page|URL|File)\b\s*$/gi, '').trim();
}

async function extractPdfSource(page) {
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

async function scanForPDFs(page) {
    const list = [];
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

runDownloader(process.argv[2]).catch(err => console.error('Unhandled Rejection:', err));
