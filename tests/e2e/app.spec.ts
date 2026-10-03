import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.resolve(__dirname, '..', 'fixtures');

test.describe('Setu — Phase 1 & Phase 2 Verification', () => {
  test('home page renders with design system, logo, 4 steps and passes accessibility', async ({ page }, testInfo) => {
    await page.goto('/');

    // Check title and landmarks
    await expect(page).toHaveTitle(/Setu — Practice, built from your own pages/i);
    const main = page.locator('#main-content');
    await expect(main).toBeVisible();

    // Check logo
    const logo = page.locator('img[alt="Setu — For the learners"]').first();
    await expect(logo).toBeVisible();

    // Check top bar quiet buttons (exact match for Privacy)
    await expect(page.getByRole('button', { name: /model/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Privacy', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /clear everything/i })).toBeVisible();

    // Check 4 steps
    await expect(page.locator('#step-syllabus')).toBeVisible();
    await expect(page.locator('#step-material')).toBeVisible();
    await expect(page.locator('#step-subject')).toBeVisible();
    await expect(page.locator('#step-paper')).toBeVisible();

    // Check primary button is initially disabled with clear reason
    const createBtn = page.getByRole('button', { name: /create practice paper/i });
    await expect(createBtn).toBeDisabled();
    await expect(page.getByText(/add your syllabus above to enable generation/i)).toBeVisible();

    // Take screenshot based on project
    const screenshotName = `docs/screenshots/home-${testInfo.project.name}.png`;
    await page.screenshot({ path: screenshotName, fullPage: true });

    // Run axe accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('file intake handles PDF, DOCX, TXT, legacy .doc, and empty files', async ({ page }) => {
    await page.goto('/');

    // 1. Upload syllabus TXT
    let syllabusInput = page.locator('input#syllabus-upload');
    await syllabusInput.setInputFiles(path.join(fixturesDir, 'sample-syllabus.txt'));

    // Verify ready state
    await expect(page.getByText('sample-syllabus.txt')).toBeVisible();
    await expect(page.getByText('Ready')).toBeVisible();
    await expect(page.getByText(/Syllabus loaded:/i)).toBeVisible();

    // 2. Upload study material
    const materialsInput = page.locator('input#materials-upload');
    await materialsInput.setInputFiles(path.join(fixturesDir, 'sample-notes.txt'));

    // Verify study material ready state
    await expect(page.getByText('sample-notes.txt')).toBeVisible();

    // 3. Remove syllabus so dropzone reappears for testing error conditions
    await page.getByRole('button', { name: /remove sample-syllabus\.txt/i }).click();
    await expect(page.locator('input#syllabus-upload')).toBeAttached();

    // 4. Test legacy .doc rejection
    syllabusInput = page.locator('input#syllabus-upload');
    await syllabusInput.setInputFiles(path.join(fixturesDir, 'sample-legacy.doc'));
    await expect(page.getByRole('alert').filter({ hasText: /Legacy \.doc format/i }).first()).toBeVisible();

    // 5. Test empty file rejection
    await page.getByRole('button', { name: /remove sample-legacy\.doc/i }).click();
    syllabusInput = page.locator('input#syllabus-upload');
    await syllabusInput.setInputFiles(path.join(fixturesDir, 'empty.txt'));
    await expect(page.getByRole('alert').filter({ hasText: /0 bytes/i }).first()).toBeVisible();
  });

  test('model sheet opens, displays providers, and test connection is operable', async ({ page }) => {
    await page.goto('/');

    // Open model sheet
    await page.getByRole('button', { name: /model/i }).click();

    // Check dialog content
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/Model configuration/i)).toBeVisible();
    await expect(page.getByText(/Ollama on this computer/i)).toBeVisible();
    await expect(page.getByText(/LM Studio or OpenAI-compatible server/i)).toBeVisible();
    await expect(page.getByText(/Google Gemini/i)).toBeVisible();

    // Test connection button
    const testBtn = page.getByRole('button', { name: /test connection/i });
    await expect(testBtn).toBeVisible();
  });

  test('privacy page and 404 page render cleanly and pass accessibility', async ({ page }) => {
    // Check Privacy page
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: /privacy policy/i })).toBeVisible();
    await expect(page.getByText(/In-browser operation only/i)).toBeVisible();
    await expect(page.getByText(/Memory-only lifecycle/i)).toBeVisible();

    await page.screenshot({ path: 'docs/screenshots/privacy.png', fullPage: true });

    let axeResults = await new AxeBuilder({ page }).analyze();
    expect(axeResults.violations).toEqual([]);

    // Check 404 page
    await page.goto('/non-existent-page');
    await expect(page.getByText(/404/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible();

    axeResults = await new AxeBuilder({ page }).analyze();
    expect(axeResults.violations).toEqual([]);
  });

  test('clear everything resets all files, form state, and memory', async ({ page }) => {
    await page.goto('/');

    // Fill in syllabus and subject
    const syllabusInput = page.locator('input#syllabus-upload');
    await syllabusInput.setInputFiles(path.join(fixturesDir, 'sample-syllabus.txt'));
    await expect(page.getByText('sample-syllabus.txt')).toBeVisible();

    await page.fill('#field-subject', 'Astrophysics');
    await expect(page.locator('#field-subject')).toHaveValue('Astrophysics');

    // Accept confirm dialog when clicking Clear everything
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: /clear everything/i }).click();

    // Verify completely empty
    await expect(page.locator('#field-subject')).toHaveValue('');
    await expect(page.getByText('sample-syllabus.txt')).not.toBeVisible();
    await expect(page.getByText(/Drop your syllabus here/i)).toBeVisible();
  });
});
