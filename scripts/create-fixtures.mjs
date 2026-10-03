import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function createPdfFixture() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { height } = page.getSize();

  page.drawText('ADVANCED MODERN PHYSICS — COURSE SYLLABUS', {
    x: 50,
    y: height - 60,
    size: 16,
    font: boldFont,
    color: rgb(0.08, 0.12, 0.1),
  });

  page.drawText('Course Code: PHYS-301 | Total Marks: 100', {
    x: 50,
    y: height - 85,
    size: 10,
    font: font,
    color: rgb(0.3, 0.35, 0.3),
  });

  const lines = [
    'Unit 1: Special Relativity (Weight: 25 marks)',
    '  - Michelson-Morley experiment and constancy of the speed of light.',
    '  - Lorentz transformations, time dilation, and length contraction.',
    '  - Relativistic momentum and mass-energy equivalence E=mc^2.',
    '',
    'Unit 2: Quantum Foundations and Wave Mechanics (Weight: 35 marks)',
    '  - Photoelectric effect, work function, and Compton scattering.',
    '  - De Broglie matter waves and wave-particle duality.',
    '  - Heisenberg uncertainty principle: position-momentum and energy-time.',
    '  - 1D infinite square well: eigenfunctions and quantized energy levels.',
    '',
    'Unit 3: Atomic Structure and Spectroscopy (Weight: 25 marks)',
    '  - Bohr model of hydrogen atom and Rydberg formula.',
    '  - Pauli exclusion principle and Hund rules.',
    '',
    'Unit 4: Nuclear and Particle Physics (Weight: 15 marks)',
    '  - Nuclear binding energy, mass defect, and radioactive decay law.',
  ];

  let y = height - 120;
  for (const line of lines) {
    page.drawText(line, {
      x: 50,
      y,
      size: 11,
      font: line.startsWith('Unit') ? boldFont : font,
      color: rgb(0.1, 0.15, 0.12),
    });
    y -= 22;
  }

  const pdfBytes = await pdfDoc.save();
  const fixturesDir = path.join(rootDir, 'tests', 'fixtures');
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  fs.writeFileSync(path.join(fixturesDir, 'sample-syllabus.pdf'), pdfBytes);
  console.log('Generated tests/fixtures/sample-syllabus.pdf');
}

createPdfFixture().catch(console.error);
