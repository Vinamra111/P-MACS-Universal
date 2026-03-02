/**
 * Copies CSV database files from packages/api/data/ into packages/web/data/
 * so they are within the Next.js project boundary and get bundled into
 * Vercel serverless functions via outputFileTracingIncludes.
 *
 * Run automatically as part of the Vercel build: "vercel-build" script.
 */

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../../api/data');
const destDir   = path.join(__dirname, '../data');

if (!fs.existsSync(sourceDir)) {
  console.error(`Source directory not found: ${sourceDir}`);
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });

const csvFiles = fs.readdirSync(sourceDir).filter(f => f.endsWith('.csv'));

if (csvFiles.length === 0) {
  console.warn('No CSV files found in', sourceDir);
} else {
  for (const file of csvFiles) {
    fs.copyFileSync(path.join(sourceDir, file), path.join(destDir, file));
    console.log(`Copied: ${file}`);
  }
  console.log(`\nSetup complete — ${csvFiles.length} CSV files copied to ${destDir}`);
}
