const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'frontend', 'dist');
const dest = path.join(__dirname, 'client');

if (!fs.existsSync(dest)) {
  fs.mkdirSync(dest, { recursive: true });
}

fs.readdirSync(src).forEach(file => {
  fs.copyFileSync(path.join(src, file), path.join(dest, file));
});

console.log('✅ Frontend dist copied to unified-site/client');
