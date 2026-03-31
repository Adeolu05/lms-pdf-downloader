/**
 * Download Chromium into ./playwright-browsers for packaging with electron-builder
 * (extraResources). Uses PLAYWRIGHT_BROWSERS_PATH so the install is repo-local.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const browsersPath = path.join(root, 'playwright-browsers');
fs.mkdirSync(browsersPath, { recursive: true });

const env = { ...process.env, PLAYWRIGHT_BROWSERS_PATH: browsersPath };
const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const r = spawnSync(cmd, ['playwright', 'install', 'chromium'], {
    cwd: root,
    env,
    shell: process.platform === 'win32',
    stdio: 'inherit',
});

if (r.error) {
    console.error(r.error);
    process.exit(1);
}
process.exit(r.status === null ? 1 : r.status);
