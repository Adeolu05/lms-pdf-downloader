/**
 * Electron shell: opens a window to the Next.js app.
 * - Dev: Next is started by npm script (concurrently); we only open localhost:3000.
 * - Prod: Prefer `.next/standalone/server.js` (Next output: standalone). Packaged builds
 *   run the server with ELECTRON_RUN_AS_NODE so end users do not need Node on PATH.
 */
const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const net = require('net');

const PORT = Number(process.env.PORT || 3000);
const BIND_HOST = process.env.HOSTNAME || process.env.HOST || '127.0.0.1';
const OPEN_URL = `http://127.0.0.1:${PORT}`;

const isDev = process.env.ELECTRON_DEV === '1';

/** Optional auto-update when packaged (see docs/SHIPPING.md). */
function setupAutoUpdater() {
    if (isDev || !app.isPackaged) return;
    try {
        const { autoUpdater } = require('electron-updater');
        autoUpdater.autoDownload = false;
        autoUpdater.on('update-available', (info) => {
            dialog
                .showMessageBox({
                    type: 'info',
                    title: 'Update available',
                    message: `LMS Study Pack ${info.version} is available.`,
                    detail: 'Download and install from GitHub Releases, or enable auto-download in a future build.',
                    buttons: ['Open releases', 'Later'],
                    defaultId: 0,
                    cancelId: 1,
                })
                .then(({ response }) => {
                    if (response === 0) {
                        shell.openExternal(
                            'https://github.com/Adeolu05/lms-pdf-downloader/releases/latest'
                        );
                    }
                })
                .catch(() => {});
        });
        autoUpdater.on('error', (err) => {
            console.error('[updater]', err?.message || err);
        });
        autoUpdater.checkForUpdates().catch((e) => console.error('[updater] check failed', e));
    } catch (e) {
        console.warn('[updater] electron-updater not available:', e?.message || e);
    }
}

/** @type {import('child_process').ChildProcess | null} */
let nextChild = null;

function waitForPort(port, timeoutMs = 120_000) {
    const host = '127.0.0.1';
    const start = Date.now();
    return new Promise((resolve, reject) => {
        const tryConnect = () => {
            const socket = net.createConnection({ port, host }, () => {
                socket.end();
                resolve(undefined);
            });
            socket.on('error', () => {
                socket.destroy();
                if (Date.now() - start > timeoutMs) {
                    reject(new Error(`Timed out waiting for ${host}:${port}`));
                    return;
                }
                setTimeout(tryConnect, 300);
            });
        };
        tryConnect();
    });
}

function projectRoot() {
    if (app.isPackaged) {
        return app.getAppPath();
    }
    return path.join(__dirname, '..');
}

/** Same artwork as `app/icon.svg`, rasterized for Electron (taskbar / window). */
function windowIconPath() {
    const candidates = [path.join(projectRoot(), 'build', 'icon.png'), path.join(__dirname, '..', 'build', 'icon.png')];
    for (const p of candidates) {
        if (fs.existsSync(p)) return p;
    }
    return undefined;
}

function startNextServer() {
    const root = projectRoot();
    const standaloneRoot = path.join(root, '.next', 'standalone');
    const serverJs = path.join(standaloneRoot, 'server.js');

    const userDataDir = app.isPackaged ? app.getPath('userData') : root;

    const extraEnv = {
        ...process.env,
        PORT: String(PORT),
        HOSTNAME: BIND_HOST,
        NODE_ENV: 'production',
        LMS_USER_DATA_DIR: userDataDir,
    };

    try {
        fs.mkdirSync(path.join(userDataDir, 'sessions'), { recursive: true });
        fs.mkdirSync(path.join(userDataDir, 'downloads'), { recursive: true });
    } catch (_) {
        /* ignore */
    }

    if (app.isPackaged) {
        const bw = path.join(process.resourcesPath, 'playwright-browsers');
        if (fs.existsSync(bw)) {
            extraEnv.PLAYWRIGHT_BROWSERS_PATH = bw;
        }
    }

    if (fs.existsSync(serverJs)) {
        const serverEntry = path.resolve(serverJs);
        const cwd = path.resolve(standaloneRoot);

        if (app.isPackaged) {
            extraEnv.ELECTRON_RUN_AS_NODE = '1';
            nextChild = spawn(process.execPath, [serverEntry], {
                cwd,
                env: extraEnv,
                stdio: 'pipe',
            });
        } else {
            nextChild = spawn('node', [serverEntry], {
                cwd,
                shell: process.platform === 'win32',
                env: extraEnv,
                stdio: 'pipe',
            });
        }
    } else {
        const nextCli = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
        nextChild = spawn('node', [nextCli, 'start', '-p', String(PORT), '-H', BIND_HOST], {
            cwd: root,
            shell: process.platform === 'win32',
            env: extraEnv,
            stdio: 'pipe',
        });
    }

    nextChild.stderr?.on('data', (d) => process.stderr.write(d));
    nextChild.stdout?.on('data', (d) => process.stdout.write(d));
    nextChild.on('error', (err) => console.error('[electron] next process error:', err));
    nextChild.on('exit', (code) => {
        if (code && code !== 0) console.error('[electron] next process exited with code', code);
    });
}

function createWindow() {
    const icon = windowIconPath();
    const win = new BrowserWindow({
        width: 1280,
        height: 840,
        minWidth: 900,
        minHeight: 640,
        show: false,
        backgroundColor: '#F6F6F3',
        ...(icon ? { icon } : {}),
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    win.once('ready-to-show', () => win.show());
    win.loadURL(OPEN_URL);
    win.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
    return win;
}

app.whenReady().then(async () => {
    if (!isDev) {
        startNextServer();
        try {
            await waitForPort(PORT);
        } catch (e) {
            console.error(e);
            app.quit();
            return;
        }
    }
    createWindow();
    setupAutoUpdater();
});

app.on('window-all-closed', () => {
    if (nextChild && !nextChild.killed) {
        nextChild.kill('SIGTERM');
    }
    app.quit();
});

app.on('before-quit', () => {
    if (nextChild && !nextChild.killed) {
        nextChild.kill('SIGTERM');
    }
});
