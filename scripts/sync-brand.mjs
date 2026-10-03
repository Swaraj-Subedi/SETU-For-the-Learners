import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const sourceBrandDir = path.join(rootDir, 'brand');
const targetBrandDir = path.join(rootDir, 'public', 'brand');

if (!fs.existsSync(targetBrandDir)) {
  fs.mkdirSync(targetBrandDir, { recursive: true });
}

if (fs.existsSync(sourceBrandDir)) {
  const files = fs.readdirSync(sourceBrandDir);
  for (const file of files) {
    const srcFile = path.join(sourceBrandDir, file);
    const destFile = path.join(targetBrandDir, file);
    fs.copyFileSync(srcFile, destFile);
    console.log(`Synced brand asset: ${file} -> public/brand/${file}`);
  }
} else {
  console.warn('Source brand directory does not exist.');
}
