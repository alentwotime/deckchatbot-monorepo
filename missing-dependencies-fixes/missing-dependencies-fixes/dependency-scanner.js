// Dependency Scanner - Find Missing npm Packages
// Save this as dependency-scanner.js and run with: node dependency-scanner.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Scanning for missing npm dependencies...\n');

// Files to check for imports/requires
const filesToCheck = [
    'server.js',
    'routes.js',
    'visionRouter.js',
    'db.js'
];

// Common import patterns
const importPatterns = [
    /import\s+.*\s+from\s+['"`]([^'"`]+)['"`]/g,
    /import\s+['"`]([^'"`]+)['"`]/g,
    /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g
];

// Built-in Node.js modules (don't need to be installed)
const builtInModules = [
    'fs', 'path', 'http', 'https', 'url', 'crypto', 'os', 'util',
    'events', 'stream', 'buffer', 'querystring', 'zlib', 'child_process'
];

// Commonly missing packages and their purposes
const commonPackages = {
    'axios': 'HTTP client for making requests',
    'express': 'Web framework',
    'multer': 'File upload middleware',
    'cors': 'Cross-origin resource sharing',
    'helmet': 'Security middleware',
    'morgan': 'HTTP request logger',
    'dotenv': 'Environment variable loader',
    'bcrypt': 'Password hashing',
    'jsonwebtoken': 'JWT token handling',
    'express-rate-limit': 'Rate limiting middleware',
    'express-slow-down': 'Request slow-down middleware',
    'body-parser': 'Request body parsing',
    'cookie-parser': 'Cookie parsing',
    'express-session': 'Session management',
    'mongoose': 'MongoDB object modeling',
    'mysql2': 'MySQL database driver',
    'pg': 'PostgreSQL database driver',
    'redis': 'Redis client',
    'socket.io': 'Real-time communication',
    'nodemailer': 'Email sending',
    'sharp': 'Image processing',
    'jimp': 'Image manipulation',
    'pdf-parse': 'PDF parsing',
    'csv-parser': 'CSV file parsing',
    'moment': 'Date manipulation',
    'lodash': 'Utility library',
    'uuid': 'UUID generation',
    'validator': 'String validation'
};

let foundPackages = new Set();
let missingPackages = new Set();

function scanFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`\n📁 Scanning: ${filePath}`);
    console.log('=' .repeat(50));

    importPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            const packageName = match[1];
            
            // Skip relative imports (start with . or /)
            if (packageName.startsWith('.') || packageName.startsWith('/')) {
                continue;
            }
            
            // Skip built-in modules
            if (builtInModules.includes(packageName)) {
                continue;
            }
            
            // Extract main package name (before any sub-paths)
            const mainPackage = packageName.split('/')[0];
            foundPackages.add(mainPackage);
            
            console.log(`📦 Found import: ${packageName}`);
            if (commonPackages[mainPackage]) {
                console.log(`   Purpose: ${commonPackages[mainPackage]}`);
            }
        }
    });
}

function checkPackageJson() {
    const packageJsonPath = 'package.json';
    
    if (!fs.existsSync(packageJsonPath)) {
        console.log('\n❌ package.json not found!');
        return {};
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = {
        ...packageJson.dependencies || {},
        ...packageJson.devDependencies || {}
    };
    
    console.log('\n📋 Current package.json dependencies:');
    console.log('=' .repeat(50));
    Object.keys(dependencies).forEach(dep => {
        console.log(`✅ ${dep}: ${dependencies[dep]}`);
    });
    
    return dependencies;
}

function findMissingPackages(currentDependencies) {
    console.log('\n🔍 Analysis Results:');
    console.log('=' .repeat(50));
    
    foundPackages.forEach(pkg => {
        if (!currentDependencies[pkg]) {
            missingPackages.add(pkg);
            console.log(`❌ MISSING: ${pkg}`);
            if (commonPackages[pkg]) {
                console.log(`   Purpose: ${commonPackages[pkg]}`);
            }
        } else {
            console.log(`✅ FOUND: ${pkg}`);
        }
    });
}

function generateFixCommands() {
    if (missingPackages.size === 0) {
        console.log('\n🎉 No missing packages found!');
        return;
    }
    
    console.log('\n🔧 FIX COMMANDS:');
    console.log('=' .repeat(50));
    
    const missingArray = Array.from(missingPackages);
    
    console.log('\n1. Add to package.json dependencies:');
    console.log('```json');
    console.log('{');
    console.log('  "dependencies": {');
    missingArray.forEach((pkg, index) => {
        const version = getRecommendedVersion(pkg);
        const comma = index < missingArray.length - 1 ? ',' : '';
        console.log(`    "${pkg}": "${version}"${comma}`);
    });
    console.log('  }');
    console.log('}');
    console.log('```');
    
    console.log('\n2. Or install via npm:');
    console.log(`npm install ${missingArray.join(' ')}`);
    
    console.log('\n3. Then rebuild Docker container:');
    console.log('docker-compose build backend');
    console.log('docker-compose up -d');
}

function getRecommendedVersion(packageName) {
    const versions = {
        'axios': '^1.6.0',
        'multer': '^1.4.5',
        'cors': '^2.8.5',
        'helmet': '^7.0.0',
        'morgan': '^1.10.0',
        'dotenv': '^16.0.0',
        'bcrypt': '^5.1.0',
        'jsonwebtoken': '^9.0.0',
        'express-rate-limit': '^6.0.0',
        'express-slow-down': '^1.6.0',
        'body-parser': '^1.20.0',
        'cookie-parser': '^1.4.6',
        'express-session': '^1.17.0',
        'mongoose': '^7.0.0',
        'mysql2': '^3.0.0',
        'pg': '^8.8.0',
        'redis': '^4.5.0',
        'socket.io': '^4.7.0',
        'nodemailer': '^6.9.0',
        'sharp': '^0.32.0',
        'jimp': '^0.22.0',
        'moment': '^2.29.0',
        'lodash': '^4.17.0',
        'uuid': '^9.0.0',
        'validator': '^13.9.0'
    };
    
    return versions[packageName] || '^1.0.0';
}

// Main execution
console.log('Starting dependency scan...');
console.log('Looking for import/require statements in backend files\n');

// Scan all files
filesToCheck.forEach(file => {
    scanFile(file);
});

// Also scan api directory if it exists
if (fs.existsSync('api')) {
    console.log('\n📁 Scanning api/ directory...');
    const apiFiles = fs.readdirSync('api').filter(file => file.endsWith('.js'));
    apiFiles.forEach(file => {
        scanFile(path.join('api', file));
    });
}

// Check current package.json
const currentDependencies = checkPackageJson();

// Find missing packages
findMissingPackages(currentDependencies);

// Generate fix commands
generateFixCommands();

console.log('\n' + '='.repeat(60));
console.log('🎯 SCAN COMPLETE');
console.log('='.repeat(60));

console.log(`
📊 SUMMARY:
- Found ${foundPackages.size} unique packages in code
- Missing ${missingPackages.size} packages from package.json
- ${missingPackages.size > 0 ? '❌ ACTION REQUIRED' : '✅ ALL DEPENDENCIES SATISFIED'}

🔧 NEXT STEPS:
1. Add missing packages to package.json
2. Rebuild Docker container
3. Test backend startup
4. Verify no more dependency errors
`);