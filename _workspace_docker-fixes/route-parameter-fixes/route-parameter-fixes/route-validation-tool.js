// Route Validation Tool - Test Route Patterns
// Save this as route-validation-tool.js and run with: node route-validation-tool.js

const { pathToRegexp } = require('path-to-regexp');

console.log('🧪 Route Pattern Validation Tool\n');

// Test patterns - add your suspected routes here
const testRoutes = [
    // Common problematic patterns
    '/api/:/',      // ❌ BAD - Missing parameter name
    '/users/:',     // ❌ BAD - Missing parameter name  
    '/data/:?',     // ❌ BAD - Malformed optional
    '/items/:/edit', // ❌ BAD - Empty parameter
    
    // Good patterns for comparison
    '/api/:id',     // ✅ GOOD
    '/users/:userId', // ✅ GOOD
    '/data/:dataId?', // ✅ GOOD - Optional parameter
    '/items/:itemId/edit', // ✅ GOOD
    '/api/',        // ✅ GOOD - No parameters
];

// Additional routes from your backend (add suspected routes here)
const suspectedRoutes = [
    // Add any routes you suspect might be causing issues
    // Example: '/vision/:/',
    // Example: '/upload/:',
];

function validateRoute(route) {
    console.log(`Testing: "${route}"`);
    
    try {
        const regexp = pathToRegexp(route);
        console.log(`✅ VALID - Pattern compiles successfully`);
        console.log(`   Regex: ${regexp}`);
        return true;
    } catch (error) {
        console.log(`❌ INVALID - ${error.message}`);
        console.log(`   This pattern will crash your backend!`);
        
        // Suggest fixes
        if (route.includes(':/')) {
            console.log(`   💡 Fix: Change "${route}" to "${route.replace(':/', ':id')}"`);
        } else if (route.endsWith(':')) {
            console.log(`   💡 Fix: Change "${route}" to "${route}id"`);
        } else if (route.includes(':?')) {
            console.log(`   💡 Fix: Change "${route}" to "${route.replace(':?', ':id?')}"`);
        }
        
        return false;
    }
}

console.log('='.repeat(60));
console.log('🔍 TESTING COMMON PROBLEMATIC PATTERNS');
console.log('='.repeat(60));

let hasErrors = false;

[...testRoutes, ...suspectedRoutes].forEach(route => {
    console.log('');
    const isValid = validateRoute(route);
    if (!isValid) {
        hasErrors = true;
    }
});

console.log('\n' + '='.repeat(60));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(60));

if (hasErrors) {
    console.log(`
❌ ERRORS FOUND!
- Routes marked with ❌ will crash your backend
- Fix these patterns before starting your server
- Use the suggested fixes above

🔧 COMMON FIXES:
- '/api/:/' → '/api/:id'
- '/users/:' → '/users/:userId'  
- '/data/:?' → '/data/:dataId?'
- '/items/:/edit' → '/items/:itemId/edit'
`);
} else {
    console.log(`
✅ ALL PATTERNS VALID!
- No problematic route patterns detected
- Your routes should work correctly
`);
}

console.log(`
🎯 HOW TO USE THIS TOOL:
1. Add your suspected routes to the 'suspectedRoutes' array above
2. Run this script again: node route-validation-tool.js
3. Fix any routes marked with ❌
4. Re-run until all routes show ✅

📝 TO ADD YOUR ROUTES:
Edit this file and add routes to the 'suspectedRoutes' array:
const suspectedRoutes = [
    '/your/route/here',
    '/another/route/:param',
];
`);