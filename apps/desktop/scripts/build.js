const { spawnSync } = require('child_process');
const path = require('path');
const os = require('os');

function run(command, args, cwd = process.cwd()) {
    console.log(`> Running: ${command} ${args.join(' ')} in ${cwd}`);
    const shell = process.platform === 'win32'; // Use shell on Windows
    // Pass process.env to ensure variables like APP_BUILDER_BIN are seen by the child process
    const result = spawnSync(command, args, { stdio: 'inherit', cwd, shell, env: process.env });

    if (result.error) {
        console.error(`Failed to start command: ${command}`, result.error);
        process.exit(1);
    }

    if (result.status !== 0) {
        console.error(`Command failed with exit code ${result.status}`);
        process.exit(result.status);
    }
}

const desktopRoot = path.resolve(__dirname, '..');
const webRoot = path.resolve(desktopRoot, '../web');
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

// Fix for pnpm + electron-builder on Windows (cross-spawn ENOENT)
try {
    const projectRoot = path.resolve(desktopRoot, '../..');
    const srcBin = path.join(projectRoot, 'node_modules/.pnpm/app-builder-bin@4.0.0/node_modules/app-builder-bin/win/x64/app-builder.exe');
    const destBin = path.join(desktopRoot, 'app-builder.exe');

    if (require('fs').existsSync(srcBin)) {
        console.log(`Copying app-builder.exe to ${destBin}`);
        require('fs').copyFileSync(srcBin, destBin);
        console.log(`Setting APP_BUILDER_BIN to ${destBin}`);
        process.env.APP_BUILDER_BIN = destBin;
    } else {
        console.warn(`Could not find source binary at ${srcBin}`);
    }
} catch (e) {
    console.warn('Could not setup APP_BUILDER_BIN', e);
}

// 1. Build Web
console.log('--- Building Web App ---');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
run(npm, ['run', 'build'], webRoot);

// 2. Prepare Build (Copy Resources)
console.log('--- Copying Resources ---');
run('node', ['scripts/copy-resources.js'], desktopRoot);

// 3. Compile Main Process (TSC)
console.log('--- Compiling Main Process ---');
const tsc = path.join(desktopRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'tsc.cmd' : 'tsc');
run(tsc, [], desktopRoot);

// 4. Package Electron App
console.log('--- Packaging Electron App ---');
const builder = path.join(desktopRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'electron-builder.cmd' : 'electron-builder');
run(builder, ['--config.npmRebuild=false'], desktopRoot);

console.log('--- Build Complete ---');
