const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    // In production, load from dist folder
    // In development, load from Vite dev server
    if (app.isPackaged) {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    } else {
        const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';
        mainWindow.loadURL(startUrl);
    }

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

function startPythonBackend() {
    // Skip if SKIP_PYTHON env variable is set (for development when Python is already running)
    if (process.env.SKIP_PYTHON === 'true') {
        console.log('Skipping Python backend startup (SKIP_PYTHON=true)');
        return;
    }

    const pythonExecutable = 'python';
    const backendDir = path.join(__dirname, '../../');

    pythonProcess = spawn(pythonExecutable, ['-m', 'backend.main'], {
        cwd: backendDir,
    });

    pythonProcess.stdout.on('data', (data) => {
        console.log(`Python: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
    });
}

app.on('ready', () => {
    startPythonBackend();
    setTimeout(createWindow, 2000);
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});

app.on('will-quit', () => {
    if (pythonProcess) {
        pythonProcess.kill();
    }
});
