// Route Search Script - Find Malformed Route Parameters
// Save this as route-search-script.js and run with: node route-search-script.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Searching for malformed route parameters...\n');

// Files to check
const filesToCheck = [
    'server.js',
    'routes.js', 
    'visionRouter.js',
    'api/index.js',
    'api/routes.js'
];

// Problematic patterns to look for
const problematicPatterns = [
    /app\.(get|post|put|delete|patch)\s*\(\s*['"`][^'"`]*:\s*[,/\)]/g,
    /router\.(get|post|put|delete|patch)\s*\(\s*['"`][^'"`]*:\s*[,/\)]/g,
    /['"`][^'"`]*:\s*[,/\)]['"`]/g,
    /:\s*[,/\)]/g
];

// Good patterns for reference
const goodPatterns = [
    /:\w+/g  // :paramName
];

function searchFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let foundIssues = false;

    console.log(`\n📁 Checking: ${filePath}`);
    console.log('=' .repeat(50));

    lines.forEach((line, index) => {
        const lineNum = index + 1;
        
        // Check for problematic patterns
        problematicPatterns.forEach(pattern => {
            const matches = line.match(pattern);
            if (matches) {
                foundIssues = true;
                console.log(`❌ Line ${lineNum}: ${line.trim()}`);
                console.log(`   Issue: Malformed route parameter`);
                console.log(`   Pattern: ${matches[0]}`);
                console.log('');
            }
        });

        // Check for routes with colons (potential issues)
        if (line.includes('app.') || line.includes('router.')) {
            if (line.includes(':') && (line.includes('get') || line.includes('post') || line.includes('put') || line.includes('delete') || line.includes('patch'))) {
                // Check if it's a problematic pattern
                if (line.includes(':/') || line.includes(':,') || line.includes(':)') || /:\s*[,/\)]/.test(line)) {
                    foundIssues = true;
                    console.log(`🚨 CRITICAL Line ${lineNum}: ${line.trim()}`);
                    console.log(`   This line is likely causing the crash!`);
                    console.log('');
                }
            }
        }
    });

    if (!foundIssues) {
        console.log('✅ No obvious issues found in this file');
    }
}

// Search all files
console.log('Starting route parameter analysis...');
console.log('Looking for patterns that cause path-to-regexp errors\n');

filesToCheck.forEach(file => {
    searchFile(file);
});

// Additional search in api directory
if (fs.existsSync('api')) {
    console.log('\n📁 Checking api/ directory...');
    const apiFiles = fs.readdirSync('api').filter(file => file.endsWith('.js'));
    apiFiles.forEach(file => {
        searchFile(path.join('api', file));
    });
}

console.log('\n' + '='.repeat(60));
console.log('🎯 SEARCH COMPLETE');
console.log('='.repeat(60));

console.log(`
📋 WHAT TO LOOK FOR:
- Lines marked with ❌ or 🚨 are likely causing the crash
- Look for route patterns like: '/api/:/' or '/users/:'
- These should be: '/api/:id' or '/users/:userId'

🔧 HOW TO FIX:
1. Find the problematic line(s) above
2. Add a parameter name after the colon
3. Example: Change '/api/:/' to '/api/:id'
4. Or remove the colon if it's not needed: '/api/'

⚠️  CRITICAL: Even ONE malformed route will crash the entire backend!
`);