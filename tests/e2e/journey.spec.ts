import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.resolve(__dirname, '..', 'fixtures');

test.describe('Setu — Full End-to-End User Journey', () => {
  test('creates practice paper, asserts reveal gating, attempts, reveals, and prints', async ({ page }) => {
    // 1. Visit homepage
    await page.goto('/');

    // 2. Select Mock Model in Model Sheet
    await page.getByRole('button', { name: /model/i }).click();
    await page.getByRole('radio', { name: /deterministic mock/i }).click();
    await page.getByRole('button', { name: /test connection/i }).click();
    await expect(page.getByText(/Connected successfully/i)).toBeVisible();
    await page.getByRole('button', { name: /save and close/i }).click();

    // 3. Upload Syllabus and Study Material
    const syllabusInput = page.locator('input#syllabus-upload');
    await syllabusInput.setInputFiles(path.join(fixturesDir, 'sample-syllabus.txt'));
    await expect(page.getByText('sample-syllabus.txt')).toBeVisible();
    await expect(page.getByText('Ready')).toBeVisible();

    const materialsInput = page.locator('input#materials-upload');
    await materialsInput.setInputFiles(path.join(fixturesDir, 'sample-notes.txt'));
    await expect(page.getByText('sample-notes.txt')).toBeVisible();

    // 4. Fill Subject and Level
    await page.fill('#field-subject', 'Advanced Modern Physics');
    await page.fill('#field-level', 'Class 12');

    // 5. Select Style: Class test (10 Qs, 30 Marks)
    await page.getByRole('radio', { name: /class test/i }).click();

    // 6. Primary Button should now be enabled
    const createBtn = page.getByRole('button', { name: /create practice paper/i });
    await expect(createBtn).toBeEnabled();

    // 7. Click Create Practice Paper -> Observe Processing Screen
    await createBtn.click();

    // Verify processing stage appears
    await expect(page.locator('text=Processing entirely inside your browser')).toBeVisible({ timeout: 10000 });

    // 8. Arrive at Paper View
    await expect(page.locator('h1', { hasText: /Advanced Modern Physics/i })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/Covers/i)).toBeVisible();

    // 9. Reveal Gating: Verify model answers are NOT in DOM before reveal
    await expect(page.getByText('Model answer:').first()).not.toBeVisible();

    // 10. Attempt Question 1
    // If Q1 is MCQ: select an option; if written: fill textarea
    const q1Radio = page.locator('input[type="radio"][name^="q-"]').first();
    const q1Textarea = page.locator('textarea[id^="attempt-"]').first();

    if (await q1Radio.isVisible()) {
      await q1Radio.check();
    } else if (await q1Textarea.isVisible()) {
      await q1Textarea.fill('This is the student attempt explaining the concept.');
    }

    // 11. "Reveal model answer" button should now be enabled
    const revealBtn = page.getByRole('button', { name: /reveal model answer/i }).first();
    await expect(revealBtn).toBeEnabled();

    // 12. Click Reveal -> Model answer and marking scheme appear
    await revealBtn.click();
    await expect(page.getByText('Model answer:').first()).toBeVisible();
    await expect(page.getByText(/Model answer revealed/i).first()).toBeVisible();

    // Take screenshot of Paper View
    await page.screenshot({ path: 'docs/screenshots/paper-view.png', fullPage: true });

    // 13. Test PrintablePaper component exists in DOM
    const printablePaper = page.locator('.printable-paper-root');
    await expect(printablePaper).toBeAttached();
    await expect(printablePaper.locator('text=Official Practice Assessment')).toBeAttached();

    // 14. Clear Everything
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: /clear everything/i }).click();

    // Verify returned to empty state
    await expect(page.getByText(/Practice, built from your own pages/i)).toBeVisible();
    await expect(page.locator('#field-subject')).toHaveValue('');
  });
});
