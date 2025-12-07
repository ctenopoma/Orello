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

if (fs.existsSync(publicSrc)) {
    console.log(`Copying public folder...`);
    fs.cpSync(publicSrc, publicDest, { recursive: true });
}

// 3. Copy Static folder
const staticSrc = path.join(webRoot, '.next/static');
const staticDest = path.join(appDest, 'apps/web/.next/static');

if (fs.existsSync(staticSrc)) {
    console.log(`Copying static folder...`);
    fs.cpSync(staticSrc, staticDest, { recursive: true });
}

// 4. Copy Migrations
const migrationsSrc = path.join(dbRoot, 'migrations');
const migrationsDest = path.join(buildDir, 'migrations');

console.log(`Copying migrations...`);
fs.cpSync(migrationsSrc, migrationsDest, { recursive: true });

// 4. Copy Icon
const workspaceRoot = path.resolve(projectRoot, '../..');
const iconSrc = path.join(workspaceRoot, 'icon.ico');
const iconDest = path.join(buildDir, 'icon.ico');
if (fs.existsSync(iconSrc)) {
    console.log(`Copying icon...`);
    fs.cpSync(iconSrc, iconDest);
}

// 5. Copy all dependencies from .pnpm to flat node_modules structure
// pnpm uses .pnpm directory with symlinks, which electron-builder doesn't handle well
// We need to copy actual packages to create a flat structure
const pnpmRoot = path.resolve(projectRoot, '../../node_modules/.pnpm');
const standalonNodeModules = path.join(appDest, 'apps/web/node_modules');

console.log('Copying dependencies from .pnpm to flat node_modules structure...');
console.log(`Source: ${pnpmRoot}`);
console.log(`Destination: ${standalonNodeModules}`);

if (fs.existsSync(pnpmRoot)) {
    fs.mkdirSync(standalonNodeModules, { recursive: true });
    
    try {
        // Get all package directories in .pnpm
        const pnpmPackages = fs.readdirSync(pnpmRoot);
        let copiedCount = 0;
        
        for (const packageDir of pnpmPackages) {
            if (packageDir === 'lock.yaml' || packageDir.startsWith('.')) continue;
            
            // Extract package name from directory name (format: package@version)
            // Handle scoped packages: @scope+package@version
            const match = packageDir.match(/^(@?[^@]+?)@/);
            if (!match) continue;
            
            let packageName = match[1].replace('+', '/');
            
            // Source: .pnpm/package@version/node_modules/package
            const packageSrc = path.join(pnpmRoot, packageDir, 'node_modules', packageName);
            
            if (fs.existsSync(packageSrc)) {
                const packageDest = path.join(standalonNodeModules, packageName);
                
                // Skip if already copied
                if (fs.existsSync(packageDest)) continue;
                
                // Create parent directory for scoped packages
                fs.mkdirSync(path.dirname(packageDest), { recursive: true });
                
                // Copy package
                fs.cpSync(packageSrc, packageDest, { 
                    recursive: true,
                    filter: (src) => {
                        // Skip unnecessary files to reduce size
                        const relativePath = path.relative(packageSrc, src);
                        if (relativePath.includes('node_modules') ||
                            relativePath.includes('.bin') ||
                            relativePath.includes('.cache')) {
                            return false;
                        }
                        return true;
                    }
                });
                
                copiedCount++;
                if (copiedCount % 100 === 0) {
                    console.log(`Copied ${copiedCount} packages...`);
                }
            }
        }
        
        console.log(`Complete! Copied ${copiedCount} packages from .pnpm structure.`);
    } catch (error) {
        console.error('Error copying from .pnpm:', error.message);
        throw error;
    }
} else {
    console.warn('Warning: node_modules not found at', nodeModulesRoot);
}

console.log('Resources copied successfully.');

// Verify the structure
const serverPath = path.join(appDest, 'apps/web/server.js');
const publicPath = path.join(appDest, 'apps/web/public');
const staticPath = path.join(appDest, 'apps/web/.next/static');

console.log('=== Verifying Copied Resources ===');
console.log(`Server file exists: ${fs.existsSync(serverPath)}`);
console.log(`Public folder exists: ${fs.existsSync(publicPath)}`);
console.log(`Static folder exists: ${fs.existsSync(staticPath)}`);

if (fs.existsSync(appDest)) {
    console.log(`App folder contents: ${fs.readdirSync(appDest).join(', ')}`);
}
console.log('====================================');

// Aggressive cleanup to reduce package size
console.log('Aggressive cleanup - removing unnecessary files and packages...');

function cleanupNodeModules(dir) {
    if (!fs.existsSync(dir)) return;
    
    const nodeModulesPath = path.join(dir, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) return;
    
    console.log(`Cleaning node_modules at ${nodeModulesPath}...`);
    
    // Remove entire packages that are not needed at runtime
    // CRITICAL: Do NOT remove packages that may be required as peer dependencies or used at runtime
    const packagesToRemove = [
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
        'terser',
        'jest',
        '@jest',
        'vitest',
        '@vitest',
        'storybook',
        '@storybook',
        'tsc',
        'babel',
        '@babel',
        'webpack-cli',
        'parcel',
        'turbo',
        'concurrently',
        'cross-env',
        'rimraf',
    ];
    
    for (const pkg of packagesToRemove) {
        const pkgPath = path.join(nodeModulesPath, pkg);
        if (fs.existsSync(pkgPath)) {
            try {
                fs.rmSync(pkgPath, { recursive: true, force: true });
                console.log(`  ✓ Removed ${pkg}`);
            } catch (e) {
                console.warn(`  ✗ Failed to remove ${pkg}: ${e.message}`);
            }
        }
    }
    
    // Remove documentation and test files from all packages - recursively
    const walk = (dir, depth = 0, isNodeModules = false) => {
        if (depth > 6) return; // Don't go too deep
        
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const fullPath = path.join(dir, entry.name);
                    
                    // Remove known non-essential directories
                    if (['test', 'tests', '__tests__', 'docs', 'examples', 'demo', '.git', '.github', 'spec', 'specifications'].includes(entry.name)) {
                        try {
                            fs.rmSync(fullPath, { recursive: true, force: true });
                        } catch (e) {
                            // Ignore errors
                        }
                    } else if (!entry.name.startsWith('.')) {
                        walk(fullPath, depth + 1, isNodeModules || dir === nodeModulesPath);
                    }
                } else if (entry.isFile()) {
                    // IMPORTANT: Only delete specific file types, NOT *.ts or *.tsx as they may be needed
                    // and NOT package.json or similar critical files
                    const name = entry.name.toLowerCase();
                    if (['.md', '.map'].some(ext => name.endsWith(ext)) ||
                        ['readme', 'changelog', 'license']
                        .some(pattern => name.includes(pattern.toLowerCase()))) {
                        try {
                            fs.unlinkSync(path.join(dir, entry.name));
                        } catch (e) {
                            // Ignore errors
                        }
                    }
                }
            }
        } catch (e) {
            // Ignore errors
        }
    };
    
    walk(nodeModulesPath);
    
    // Remove empty scope directories
    try {
        const entries = fs.readdirSync(nodeModulesPath, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory() && entry.name.startsWith('@')) {
                const scopePath = path.join(nodeModulesPath, entry.name);
                const subEntries = fs.readdirSync(scopePath);
                if (subEntries.length === 0) {
                    fs.rmdirSync(scopePath);
                }
            }
        }
    } catch (e) {
        // Ignore errors
    }
}

cleanupNodeModules(appDest);

console.log('Cleanup completed.');

