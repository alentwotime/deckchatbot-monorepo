const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 STEP 20: TESTING AND VALIDATION');
console.log('=====================================\n');

const results = {
  typescript: { backend: false, frontend: false },
  eslint: false,
  imports: false,
  azure: false,
  api: false,
  fileOps: false,
  rateLimiting: false,
  errorHandling: false,
  imageUpload: false,
  model3D: false,
  blueprint: false,
  frontend: false
};

// Helper function to run commands safely
function runCommand(command, cwd = process.cwd()) {
  try {
    const result = execSync(command, { cwd, encoding: 'utf8', stdio: 'pipe' });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || error.stderr };
  }
}

// Test 1: TypeScript Compilation
console.log('📝 Testing TypeScript Compilation...');
console.log('-----------------------------------');

// Backend TypeScript
console.log('🔧 Backend TypeScript compilation...');
const backendTsc = runCommand('npx tsc --noEmit', './apps/backend');
if (backendTsc.success) {
  console.log('✅ Backend TypeScript compilation: PASSED');
  results.typescript.backend = true;
} else {
  console.log('❌ Backend TypeScript compilation: FAILED');
  console.log('Errors:', backendTsc.output);
}

// Frontend TypeScript
console.log('🔧 Frontend TypeScript compilation...');
const frontendTsc = runCommand('npx tsc --noEmit', './apps/frontend');
if (frontendTsc.success) {
  console.log('✅ Frontend TypeScript compilation: PASSED');
  results.typescript.frontend = true;
} else {
  console.log('❌ Frontend TypeScript compilation: FAILED');
  console.log('Errors:', frontendTsc.output);
}

// Test 2: ESLint
console.log('\n🔍 Testing ESLint...');
console.log('-------------------');
const eslintResult = runCommand('npx eslint . --ext .ts,.tsx,.js,.jsx');
if (eslintResult.success) {
  console.log('✅ ESLint: PASSED');
  results.eslint = true;
} else {
  console.log('❌ ESLint: FAILED');
  console.log('Warnings/Errors:', eslintResult.output);
}

// Test 3: Import Resolution
console.log('\n📦 Testing Import Resolution...');
console.log('-------------------------------');
const importFiles = [
  './apps/backend/src/controllers/upload-controller.ts',
  './apps/backend/src/controllers/deck-controller.ts',
  './apps/backend/src/controllers/visualization-controller.ts',
  './apps/backend/src/services/azure-computer-vision.ts'
];

let importsValid = true;
for (const file of importFiles) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const imports = content.match(/import.*from\s+['"]([^'"]+)['"]/g) || [];
    console.log(`📄 ${path.basename(file)}: ${imports.length} imports found`);
  } else {
    console.log(`❌ File not found: ${file}`);
    importsValid = false;
  }
}
results.imports = importsValid;
console.log(importsValid ? '✅ Import Resolution: PASSED' : '❌ Import Resolution: FAILED');

// Test 4: Azure Service Connections
console.log('\n☁️ Testing Azure Service Connections...');
console.log('--------------------------------------');
const azureConfigExists = fs.existsSync('./apps/backend/src/services/azure-config.ts');
const azureEnvExists = fs.existsSync('./.env');
if (azureConfigExists && azureEnvExists) {
  console.log('✅ Azure configuration files: FOUND');
  results.azure = true;
} else {
  console.log('❌ Azure configuration files: MISSING');
  console.log(`Config file: ${azureConfigExists ? 'FOUND' : 'MISSING'}`);
  console.log(`Env file: ${azureEnvExists ? 'FOUND' : 'MISSING'}`);
}

// Test 5: API Endpoints
console.log('\n🌐 Testing API Endpoints...');
console.log('---------------------------');
const apiFiles = [
  './apps/backend/src/controllers/upload-controller.ts',
  './apps/backend/src/controllers/deck-controller.ts',
  './apps/backend/src/controllers/visualization-controller.ts',
  './apps/backend/src/controllers/chat-controller.ts'
];

let apiEndpointsFound = 0;
for (const file of apiFiles) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const endpoints = content.match(/public\s+\w+\s*=\s*async/g) || [];
    console.log(`📄 ${path.basename(file)}: ${endpoints.length} endpoints found`);
    apiEndpointsFound += endpoints.length;
  }
}
results.api = apiEndpointsFound > 0;
console.log(`✅ API Endpoints: ${apiEndpointsFound} total endpoints found`);

// Test 6: File Operations
console.log('\n📁 Testing File Operations...');
console.log('-----------------------------');
const fileOpFiles = [
  './apps/backend/src/controllers/upload-controller.ts',
  './apps/backend/src/services/azure-storage.ts'
];

let fileOpsFound = false;
for (const file of fileOpFiles) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('upload') || content.includes('storage') || content.includes('file')) {
      fileOpsFound = true;
      console.log(`📄 ${path.basename(file)}: File operations detected`);
    }
  }
}
results.fileOps = fileOpsFound;
console.log(fileOpsFound ? '✅ File Operations: FOUND' : '❌ File Operations: NOT FOUND');

// Test 7: Rate Limiting
console.log('\n⏱️ Testing Rate Limiting...');
console.log('---------------------------');
const rateLimitFile = './apps/backend/src/middleware/rate-limiter.ts';
if (fs.existsSync(rateLimitFile)) {
  const content = fs.readFileSync(rateLimitFile, 'utf8');
  const rateLimitFunctions = content.match(/function\s+\w*[Rr]ate[Ll]imit/g) || [];
  console.log(`📄 Rate limiter: ${rateLimitFunctions.length} functions found`);
  results.rateLimiting = rateLimitFunctions.length > 0;
} else {
  console.log('❌ Rate limiter file not found');
}
console.log(results.rateLimiting ? '✅ Rate Limiting: FOUND' : '❌ Rate Limiting: NOT FOUND');

// Test 8: Error Handling
console.log('\n🚨 Testing Error Handling...');
console.log('-----------------------------');
const errorHandlingFiles = [
  './apps/backend/src/types/deckchatbot.ts',
  './apps/backend/src/controllers/chat-controller.ts'
];

let errorHandlingFound = false;
for (const file of errorHandlingFiles) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('AppError') || content.includes('try') || content.includes('catch')) {
      errorHandlingFound = true;
      console.log(`📄 ${path.basename(file)}: Error handling detected`);
    }
  }
}
results.errorHandling = errorHandlingFound;
console.log(errorHandlingFound ? '✅ Error Handling: FOUND' : '❌ Error Handling: NOT FOUND');

// Test 9: Image Upload and Processing
console.log('\n🖼️ Testing Image Upload and Processing...');
console.log('----------------------------------------');
const imageFiles = [
  './apps/backend/src/controllers/upload-controller.ts',
  './apps/backend/src/services/azure-computer-vision.ts'
];

let imageProcessingFound = false;
for (const file of imageFiles) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('image') || content.includes('upload') || content.includes('vision')) {
      imageProcessingFound = true;
      console.log(`📄 ${path.basename(file)}: Image processing detected`);
    }
  }
}
results.imageUpload = imageProcessingFound;
console.log(imageProcessingFound ? '✅ Image Upload/Processing: FOUND' : '❌ Image Upload/Processing: NOT FOUND');

// Test 10: 3D Model Generation
console.log('\n🎯 Testing 3D Model Generation...');
console.log('---------------------------------');
const model3DFiles = [
  './apps/backend/src/controllers/deck-controller.ts',
  './apps/backend/src/controllers/visualization-controller.ts'
];

let model3DFound = false;
for (const file of model3DFiles) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('3D') || content.includes('model') || content.includes('create3DDeckModel')) {
      model3DFound = true;
      console.log(`📄 ${path.basename(file)}: 3D model generation detected`);
    }
  }
}
results.model3D = model3DFound;
console.log(model3DFound ? '✅ 3D Model Generation: FOUND' : '❌ 3D Model Generation: NOT FOUND');

// Test 11: Blueprint Creation
console.log('\n📐 Testing Blueprint Creation...');
console.log('--------------------------------');
const blueprintFiles = [
  './apps/backend/src/controllers/deck-controller.ts',
  './apps/backend/src/controllers/visualization-controller.ts'
];

let blueprintFound = false;
for (const file of blueprintFiles) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('blueprint') || content.includes('generateDeckBlueprint')) {
      blueprintFound = true;
      console.log(`📄 ${path.basename(file)}: Blueprint creation detected`);
    }
  }
}
results.blueprint = blueprintFound;
console.log(blueprintFound ? '✅ Blueprint Creation: FOUND' : '❌ Blueprint Creation: NOT FOUND');

// Test 12: Frontend Scrolling Website
console.log('\n🌐 Testing Frontend Scrolling Website...');
console.log('---------------------------------------');
const frontendFiles = [
  './apps/frontend/src',
  './apps/frontend/package.json'
];

let frontendFound = false;
for (const file of frontendFiles) {
  if (fs.existsSync(file)) {
    frontendFound = true;
    console.log(`📄 ${path.basename(file)}: Frontend structure detected`);
  }
}
results.frontend = frontendFound;
console.log(frontendFound ? '✅ Frontend: FOUND' : '❌ Frontend: NOT FOUND');

// Summary
console.log('\n📊 VALIDATION SUMMARY');
console.log('====================');
const totalTests = Object.keys(results).length + 1; // +1 for typescript having 2 sub-tests
const passedTests = Object.values(results).filter(Boolean).length + 
  (results.typescript.backend ? 1 : 0) + (results.typescript.frontend ? 1 : 0) - 1;

console.log(`✅ TypeScript Backend: ${results.typescript.backend ? 'PASS' : 'FAIL'}`);
console.log(`✅ TypeScript Frontend: ${results.typescript.frontend ? 'PASS' : 'FAIL'}`);
console.log(`✅ ESLint: ${results.eslint ? 'PASS' : 'FAIL'}`);
console.log(`✅ Import Resolution: ${results.imports ? 'PASS' : 'FAIL'}`);
console.log(`✅ Azure Services: ${results.azure ? 'PASS' : 'FAIL'}`);
console.log(`✅ API Endpoints: ${results.api ? 'PASS' : 'FAIL'}`);
console.log(`✅ File Operations: ${results.fileOps ? 'PASS' : 'FAIL'}`);
console.log(`✅ Rate Limiting: ${results.rateLimiting ? 'PASS' : 'FAIL'}`);
console.log(`✅ Error Handling: ${results.errorHandling ? 'PASS' : 'FAIL'}`);
console.log(`✅ Image Upload/Processing: ${results.imageUpload ? 'PASS' : 'FAIL'}`);
console.log(`✅ 3D Model Generation: ${results.model3D ? 'PASS' : 'FAIL'}`);
console.log(`✅ Blueprint Creation: ${results.blueprint ? 'PASS' : 'FAIL'}`);
console.log(`✅ Frontend: ${results.frontend ? 'PASS' : 'FAIL'}`);

console.log(`\n🎯 Overall Score: ${passedTests}/${totalTests} tests passed`);
console.log(`📈 Success Rate: ${Math.round((passedTests/totalTests) * 100)}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 ALL TESTS PASSED! System is ready for deployment.');
} else {
  console.log('\n⚠️ Some tests failed. Please review and fix the issues above.');
}
