const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const webRoot = path.resolve(projectRoot, '../web');
const dbRoot = path.resolve(projectRoot, '../../packages/db');
const buildDir = path.join(projectRoot, 'build');

// Clean build dir
if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true, force: true });
}
fs.mkdirSync(buildDir, { recursive: true });

// 1. Copy Standalone Build
const standaloneSrc = path.join(webRoot, '.next/standalone');
const appDest = path.join(buildDir, 'app');

console.log(`Copying standalone build from ${standaloneSrc} to ${appDest}...`);
fs.cpSync(standaloneSrc, appDest, { recursive: true });

// 2. Copy Public folder
const publicSrc = path.join(webRoot, 'public');
const publicDest = path.join(appDest, 'apps/web/public');

console.log(`Copying public folder from ${publicSrc} to ${publicDest}...`);
fs.cpSync(publicSrc, publicDest, { recursive: true });

// 3. Copy Static folder
const staticSrc = path.join(webRoot, '.next/static');
const staticDest = path.join(appDest, 'apps/web/.next/static');

console.log(`Copying static folder from ${staticSrc} to ${staticDest}...`);
fs.cpSync(staticSrc, staticDest, { recursive: true });

// 4. Copy Migrations
const migrationsSrc = path.join(dbRoot, 'migrations');
const migrationsDest = path.join(buildDir, 'migrations');

console.log(`Copying migrations from ${migrationsSrc} to ${migrationsDest}...`);
fs.cpSync(migrationsSrc, migrationsDest, { recursive: true });

// 5. Copy Icon (use root icon.ico, not favicon.ico)
const workspaceRoot = path.resolve(projectRoot, '../..');
const iconSrc = path.join(workspaceRoot, 'icon.ico');
const iconDest = path.join(buildDir, 'icon.ico');
if (fs.existsSync(iconSrc)) {
    console.log(`Copying icon from ${iconSrc} to ${iconDest}...`);
    fs.cpSync(iconSrc, iconDest);
} else {
    console.warn("Icon not found at " + iconSrc);
}

// 6. Copy @electric-sql/pglite to standalone node_modules
// This is needed because it's marked as serverExternalPackages
const nodeModulesRoot = path.resolve(projectRoot, '../../node_modules');
const standalonNodeModules = path.join(appDest, 'apps/web/node_modules');

const pgliteModules = [
    '@electric-sql/pglite',
    '@electric-sql/pglite-bundler-plugin'
];

for (const moduleName of pgliteModules) {
    const moduleSrc = path.join(nodeModulesRoot, '.pnpm');
    // Find the actual pglite directory in .pnpm
    // pnpm uses format like @electric-sql+pglite@0.3.7 (scope/name becomes scope+name)
    const searchPattern = moduleName.replace('/', '+');
    const pnpmDirs = fs.readdirSync(moduleSrc).filter(d => d.startsWith(searchPattern + '@'));

    for (const pnpmDir of pnpmDirs) {
        const fullSrc = path.join(moduleSrc, pnpmDir, 'node_modules', moduleName);
        if (fs.existsSync(fullSrc)) {
            const destPath = path.join(standalonNodeModules, moduleName);
            console.log(`Copying ${moduleName} from ${fullSrc} to ${destPath}...`);
            fs.mkdirSync(path.dirname(destPath), { recursive: true });
            fs.cpSync(fullSrc, destPath, { recursive: true });
            break;
        }
    }
}

// Also copy directly from node_modules if it's hoisted there
const directPgliteSrc = path.join(nodeModulesRoot, '@electric-sql/pglite');
const directPgliteDest = path.join(standalonNodeModules, '@electric-sql/pglite');
if (fs.existsSync(directPgliteSrc) && !fs.existsSync(directPgliteDest)) {
    console.log(`Copying @electric-sql/pglite from ${directPgliteSrc} to ${directPgliteDest}...`);
    fs.mkdirSync(path.dirname(directPgliteDest), { recursive: true });
    fs.cpSync(directPgliteSrc, directPgliteDest, { recursive: true });
}

console.log('Resources copied successfully.');

// 7. Remove unnecessary large packages from standalone node_modules
console.log('Removing unnecessary packages to reduce size...');
const unnecessaryPackages = [
    'typescript',
    '@types',
    'eslint',
    '@eslint',
    'prettier',
    '@typescript-eslint',
    'webpack',
    'vite',
    'esbuild',
    'rollup',
    '@swc',
    'terser',
    'jest',
    '@jest',
    'vitest',
    '@vitest',
];

function removePackagesRecursively(dir) {
    if (!fs.existsSync(dir)) return;
    
    const nodeModulesPath = path.join(dir, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) return;
    
    for (const pkg of unnecessaryPackages) {
        const pkgPath = path.join(nodeModulesPath, pkg);
        if (fs.existsSync(pkgPath)) {
            console.log(`  Removing ${pkg}...`);
            fs.rmSync(pkgPath, { recursive: true, force: true });
        }
    }
    
    // Also check subdirectories
    const entries = fs.readdirSync(nodeModulesPath, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith('@')) {
            const scopePath = path.join(nodeModulesPath, entry.name);
            const subEntries = fs.readdirSync(scopePath);
            if (subEntries.length === 0) {
                // Remove empty scope directories
                fs.rmdirSync(scopePath);
            }
        }
    }
}

removePackagesRecursively(appDest);
console.log('Cleanup completed.');

