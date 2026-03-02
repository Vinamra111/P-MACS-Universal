/**
 * One-time script: replaces the hardcoded '../api/data' path with an
 * environment-variable-aware version so that the app works both locally
 * (DATA_PATH unset → falls back to '../api/data') and on Vercel
 * (DATA_PATH=data → uses the copied ./data/ directory).
 */

const fs = require('fs');
const path = require('path');

function walk(dir) {
  const results = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory() && !['node_modules', '.next', '__tests__', 'scripts'].includes(item.name)) {
      results.push(...walk(full));
    } else if (item.isFile() && item.name.endsWith('.ts')) {
      results.push(full);
    }
  }
  return results;
}

const OLD = "path.join(process.cwd(), '../api/data')";
const NEW = "path.join(process.cwd(), process.env.DATA_PATH || '../api/data')";

const srcDir = path.join(__dirname, '../src');
let updated = 0;

for (const file of walk(srcDir)) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes(OLD)) {
    fs.writeFileSync(file, content.replaceAll(OLD, NEW), 'utf8');
    console.log('Updated:', path.relative(srcDir, file));
    updated++;
  }
}

console.log(`\nDone — ${updated} file(s) updated.`);
