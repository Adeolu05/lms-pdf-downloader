/**
 * After `next build` with `output: 'standalone'`, copy static assets into
 * `.next/standalone` so the production server can serve them.
 * @see https://nextjs.org/docs/app/building-your-application/deploying#self-hosting
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const standalone = path.join(root, '.next', 'standalone');
const nextStatic = path.join(root, '.next', 'static');
const pub = path.join(root, 'public');

function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) {
        console.warn('[copy-standalone-assets] skip missing:', src);
        return;
    }
    fs.mkdirSync(dest, { recursive: true });
    for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
        const s = path.join(src, ent.name);
        const d = path.join(dest, ent.name);
        if (ent.isDirectory()) copyRecursive(s, d);
        else fs.copyFileSync(s, d);
    }
}

if (!fs.existsSync(standalone)) {
    console.error('[copy-standalone-assets] Missing .next/standalone — run `npm run build` first.');
    process.exit(1);
}

copyRecursive(nextStatic, path.join(standalone, '.next', 'static'));
if (fs.existsSync(pub)) {
    copyRecursive(pub, path.join(standalone, 'public'));
}

console.log('[copy-standalone-assets] Copied .next/static and public into .next/standalone.');
