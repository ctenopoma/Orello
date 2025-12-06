import { fork } from 'child_process';
import { app, BrowserWindow } from 'electron';
import getPort from 'get-port';
import path from 'path';

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
        },
    });

    const port = await getPort();

    startServer(port);

    setTimeout(() => {
        mainWindow?.loadURL(`http://localhost:${port}`);
    }, 2000);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function startServer(port: number) {
    const pgliteDataDir = path.join(app.getPath('userData'), 'pgdata');
    const migrationsDir = isDev
        ? path.join(__dirname, '../../../packages/db/migrations')
        : path.join(process.resourcesPath, 'migrations');

    console.log(`Starting server on port ${port}`);
    console.log(`PGlite Data Dir: ${pgliteDataDir}`);
    console.log(`Migrations Dir: ${migrationsDir}`);

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
        : path.join(process.resourcesPath, 'app/apps/web/server.js');

    serverProcess = fork(serverPath, [], {
        env,
        cwd: path.dirname(serverPath),
        stdio: 'inherit',
    });
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
