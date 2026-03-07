const { chromium } = require('playwright');
const config = require('./config');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Miva LMS Login & Session Manager v11.0
 * - Step 1: Login and capture cookies.
 * - Step 2: Run the actual downloader (src/downloader.js).
 */

async function waitForEnter(promptText) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(promptText, () => {
            rl.close();
            resolve();
        });
    });
}

async function runLogin() {
    const targetUrl = process.argv[2] || config.baseUrl;
    console.log('--- Miva LMS Login & Session Manager ---');

    // Check if we have an existing session to load
    const hasExistingSession = fs.existsSync(config.sessionPath);
    if (hasExistingSession) {
        console.log(`Loading current session...`);
    } else {
        console.log('Starting fresh login...');
    }

    console.log(`Navigating to: ${targetUrl}`);

    const browser = await chromium.launch({ headless: false });
    const contextOptions = hasExistingSession ? { storageState: config.sessionPath } : {};
    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();

    try {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

        console.log('\n--- SESSION MONITOR ---');
        console.log('Browser is OPEN.');
        console.log('-> If your page shows the Course/Dashboard, you are already logged in.');
        console.log('-> If your page shows a Login Form, please log in now.');

        console.log('\n--- ACTION REQUIRED ---');
        console.log('1. Finish logging in in the browser.');
        console.log('2. Return here and press [ENTER] when ready.\n');

        let validationPassed = false;

        while (!validationPassed) {
            await waitForEnter('Press [ENTER] to save and lock your session: ');

            console.log('\nValidating session...');
            const currentUrl = page.url();
            const pageContent = await page.content();

            const looksLikeLoginPage =
                /login|signin/i.test(currentUrl) ||
                /name="username"|name="password"|type="password"/i.test(pageContent);

            if (looksLikeLoginPage) {
                console.log('\n!! ERROR: STILL ON LOGIN PAGE !!');
                console.log('Please log in first. The browser is still open for you.');
            } else {
                const cookies = await context.cookies();
                const domains = [...new Set(cookies.map(c => c.domain))];
                const hasLmsCookie = domains.some(d => d.includes('lms.miva.university'));

                if (!hasLmsCookie) {
                    console.log('\n!! WARNING: WRONG DOMAIN !!');
                    console.log('Ensure you are on lms.miva.university before saving.');
                } else {
                    console.log('Success: Captured lms.miva.university cookies.');
                    validationPassed = true;
                }
            }
        }

        if (validationPassed) {
            const sessionDir = path.dirname(config.sessionPath);
            if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

            await context.storageState({ path: config.sessionPath });

            console.log('\n=============================================');
            console.log('   STEP 1 COMPLETE: SESSION SAVED!   ');
            console.log('=============================================');
            console.log('\nNow, COPY and PASTE the following command to start downloading:');
            console.log('\n---------------------------------------------');
            console.log(`node src/downloader.js "${targetUrl}"`);
            console.log('---------------------------------------------\n');
            console.log('You can now close the browser.');
        }

    } catch (err) {
        console.error('\nRuntime Error:', err.message);
    } finally {
        await browser.close();
    }
}

runLogin().catch(err => {
    console.error('Fatal Error:', err);
});