import { fork } from 'child_process';
import { app, BrowserWindow } from 'electron';
import getPort from 'get-port';
import path from 'path';
import fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let serverProcess: any = null;

const isDev = process.env.NODE_ENV === 'development';

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: 'Orello',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: undefined,
        },
    });

    // Keep DevTools closed in packaged app; enable manually if needed during debugging

    const port = await getPort();

    startServer(port);

    // Wait longer for server to start
    setTimeout(() => {
        console.log(`Loading URL: http://localhost:${port}`);
        mainWindow?.loadURL(`http://localhost:${port}`).catch((err) => {
            console.error('Failed to load URL:', err);
        });
    }, 5000);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function getResourcePath() {
    // Try multiple possible resource paths
    const candidates = [
        // Standard electron-builder path
        path.join(process.resourcesPath, 'app'),
        // For win-unpacked copied directory
        path.join(path.dirname(process.execPath), 'resources', 'app'),
        // Alternative path
        path.join(process.execPath, '..', 'resources', 'app'),
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate) && fs.existsSync(path.join(candidate, 'apps/web'))) {
            console.log(`Found app resources at: ${candidate}`);
            return candidate;
        }
    }

    // Fallback to standard path
    console.warn('Could not find app resources at expected locations, using default path');
    return path.join(process.resourcesPath, 'app');
}

function startServer(port: number) {
    const pgliteDataDir = path.join(app.getPath('userData'), 'pgdata');
    const appResourcePath = getResourcePath();

    // Use executable-relative path for migrations to work when app is copied
    const getMigrationsPath = () => {
        const candidates = [
            path.join(process.resourcesPath, 'migrations'),
            path.join(path.dirname(process.execPath), 'resources', 'migrations'),
        ];
        for (const candidate of candidates) {
            if (fs.existsSync(candidate)) {
                console.log(`Found migrations at: ${candidate}`);
                return candidate;
            }
        }
        console.warn('Could not find migrations at expected locations');
        return path.join(process.resourcesPath, 'migrations');
    };

    const migrationsDir = isDev
        ? path.join(__dirname, '../../../packages/db/migrations')
        : getMigrationsPath();

    console.log(`========== SERVER STARTUP ==========`);
    console.log(`Starting server on port ${port}`);
    console.log(`Executable path: ${process.execPath}`);
    console.log(`Resources path: ${process.resourcesPath}`);
    console.log(`App resource path: ${appResourcePath}`);
    console.log(`PGlite Data Dir: ${pgliteDataDir}`);
    console.log(`Migrations Dir: ${migrationsDir}`);
    console.log(`====================================`);

    const env = {
        ...process.env,
        PORT: port.toString(),
        HOSTNAME: 'localhost',
        NODE_ENV: 'production',
        PGLITE_DATA_DIR: pgliteDataDir,
        MIGRATIONS_DIR: migrationsDir,
        POSTGRES_URL: '',
    };

    const serverPath = isDev
        ? path.join(__dirname, '../../web/.next/standalone/apps/web/server.js')
        : path.join(appResourcePath, 'apps/web/server.js');

    console.log(`Server path: ${serverPath}`);
    console.log(`Server file exists: ${fs.existsSync(serverPath)}`);

    if (!fs.existsSync(serverPath)) {
        console.error(`ERROR: Server file not found at: ${serverPath}`);
        console.error('Available files in app resource:');
        if (fs.existsSync(appResourcePath)) {
            const files = fs.readdirSync(appResourcePath, { recursive: true }).slice(0, 50);
            console.error(files);
        }
        return;
    }

    serverProcess = fork(serverPath, [], {
        env,
        cwd: path.dirname(serverPath),
        stdio: 'inherit',
        silent: false,
    });

    serverProcess.on('error', (err: Error) => {
        console.error('Server process error:', err);
    });

    serverProcess.on('exit', (code: number, signal: string) => {
        console.log(`Server process exited with code ${code} and signal ${signal}`);
    });

    console.log(`Server process spawned with PID: ${serverProcess.pid}`);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
