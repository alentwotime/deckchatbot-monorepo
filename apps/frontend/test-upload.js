const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Test configuration
const SERVER_URL = 'http://localhost:3000'; // Adjust if different
const UPLOAD_ENDPOINT = '/upload-drawing';
const AUTH_TOKEN = 'Bearer revamp123secure';

// Test files (create some dummy test files)
const testFiles = [
  {
    name: 'test-image.jpg',
    content: Buffer.from('fake-jpeg-content'),
    mimeType: 'image/jpeg'
  },
  {
    name: 'test-drawing.pdf',
    content: Buffer.from('fake-pdf-content'),
    mimeType: 'application/pdf'
  },
  {
    name: 'test-cad.dwg',
    content: Buffer.from('fake-dwg-content'),
    mimeType: 'application/dwg'
  },
  {
    name: 'large-file.jpg',
    content: Buffer.alloc(60 * 1024 * 1024), // 60MB - should fail
    mimeType: 'image/jpeg'
  },
  {
    name: 'unsupported.txt',
    content: Buffer.from('text content'),
    mimeType: 'text/plain'
  }
];

async function testFileUpload(file, shouldSucceed = true) {
  console.log(`\n--- Testing: ${file.name} ---`);
  
  try {
    const formData = new FormData();
    formData.append('image', file.content, {
      filename: file.name,
      contentType: file.mimeType
    });

    const response = await fetch(`${SERVER_URL}${UPLOAD_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Authorization': AUTH_TOKEN,
        ...formData.getHeaders()
      },
      body: formData
    });

    const result = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(result, null, 2));
    
    if (shouldSucceed && response.ok) {
      console.log('✅ Test PASSED - Upload succeeded as expected');
    } else if (!shouldSucceed && !response.ok) {
      console.log('✅ Test PASSED - Upload failed as expected');
    } else {
      console.log('❌ Test FAILED - Unexpected result');
    }
    
  } catch (error) {
    console.log('❌ Test ERROR:', error.message);
  }
}

async function runTests() {
  console.log('🧪 Starting File Upload Tests');
  console.log('=====================================');
  
  // Test valid files (should succeed)
  await testFileUpload(testFiles[0], true);  // JPEG
  await testFileUpload(testFiles[1], true);  // PDF
  await testFileUpload(testFiles[2], true);  // DWG
  
  // Test invalid files (should fail)
  await testFileUpload(testFiles[3], false); // Too large
  await testFileUpload(testFiles[4], false); // Unsupported format
  
  console.log('\n=====================================');
  console.log('🏁 Tests completed!');
  console.log('\nNote: These tests require the server to be running.');
  console.log('Start the server with: npm start or node server.js');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testFileUpload, runTests };
