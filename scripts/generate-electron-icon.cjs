/**
 * Rasterize app/icon.svg → build/icon.png for electron-builder (Windows .ico / macOS .icns derived).
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
    const root = path.join(__dirname, '..');
    const svgPath = path.join(root, 'app', 'icon.svg');
    const outDir = path.join(root, 'build');
    const outPng = path.join(outDir, 'icon.png');

    if (!fs.existsSync(svgPath)) {
        console.error('[generate-electron-icon] Missing', svgPath);
        process.exit(1);
    }

    fs.mkdirSync(outDir, { recursive: true });
    await sharp(svgPath).resize(512, 512).png().toFile(outPng);
    console.log('[generate-electron-icon] Wrote', outPng);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
