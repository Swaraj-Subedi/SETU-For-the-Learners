import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const tesseractTargetDir = path.join(rootDir, 'public', 'tesseract');
const pdfjsTargetDir = path.join(rootDir, 'public', 'pdfjs');

if (!fs.existsSync(tesseractTargetDir)) {
  fs.mkdirSync(tesseractTargetDir, { recursive: true });
}

if (!fs.existsSync(pdfjsTargetDir)) {
  fs.mkdirSync(pdfjsTargetDir, { recursive: true });
}

// 1. Copy Tesseract worker
const workerSrc = path.join(rootDir, 'node_modules', 'tesseract.js', 'dist', 'worker.min.js');
if (fs.existsSync(workerSrc)) {
  fs.copyFileSync(workerSrc, path.join(tesseractTargetDir, 'worker.min.js'));
  console.log('Copied tesseract worker.min.js');
}

// 2. Copy Tesseract core WASM and JS
const coreSrcDir = path.join(rootDir, 'node_modules', 'tesseract.js-core');
if (fs.existsSync(coreSrcDir)) {
  const coreFiles = fs.readdirSync(coreSrcDir);
  for (const file of coreFiles) {
    if (file.startsWith('tesseract-core')) {
      fs.copyFileSync(path.join(coreSrcDir, file), path.join(tesseractTargetDir, file));
    }
  }
  console.log('Copied tesseract core files');
}

// 3. Copy traineddata
const trainedDataSrc = path.join(
  rootDir,
  'node_modules',
  '@tesseract.js-data',
  'eng',
  '4.0.0_best_int',
  'eng.traineddata.gz'
);
if (fs.existsSync(trainedDataSrc)) {
  fs.copyFileSync(trainedDataSrc, path.join(tesseractTargetDir, 'eng.traineddata.gz'));
  console.log('Copied eng.traineddata.gz');
}

// 4. Copy PDF.js worker
const pdfWorkerSrc = path.join(rootDir, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
if (fs.existsSync(pdfWorkerSrc)) {
  fs.copyFileSync(pdfWorkerSrc, path.join(pdfjsTargetDir, 'pdf.worker.min.mjs'));
  console.log('Copied pdf.worker.min.mjs');
}

console.log('Asset copying complete.');
