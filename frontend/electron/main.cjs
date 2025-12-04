const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let pythonProcess;

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

    let backendPath;
    let cwd;

    if (app.isPackaged) {
        // In production, the backend executable is in resources/backend_dist/backend.exe
        backendPath = path.join(process.resourcesPath, 'backend_dist', 'backend.exe');
        cwd = path.join(process.resourcesPath, 'backend_dist');
        console.log('Production mode - Backend path:', backendPath);
        console.log('Production mode - CWD:', cwd);
    } else {
        // In development, we are in frontend/electron
        // We set cwd to project root so 'python -m backend.main' finds 'backend/main.py'
        cwd = path.join(__dirname, '../../');
        backendPath = 'python';
        console.log('Development mode - Backend path:', backendPath);
        console.log('Development mode - CWD:', cwd);
    }

    try {
        if (app.isPackaged) {
            pythonProcess = spawn(backendPath, [], { cwd: cwd });
        } else {
            pythonProcess = spawn(backendPath, ['-m', 'backend.main'], { cwd: cwd });
        }

        pythonProcess.stdout.on('data', (data) => {
            console.log(`Python: ${data}`);
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python Error: ${data}`);
        });

        pythonProcess.on('error', (err) => {
            console.error('Failed to start backend:', err);
        });

        pythonProcess.on('close', (code) => {
            console.log(`Python process exited with code ${code}`);
        });
    } catch (err) {
        console.error('Error spawning backend process:', err);
    }
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
