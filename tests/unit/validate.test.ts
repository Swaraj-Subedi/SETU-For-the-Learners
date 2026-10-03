import { describe, it, expect } from 'vitest';
import { validateFileInput, MAX_FILE_SIZE, MAX_TOTAL_SIZE } from '@/lib/files/validate';

describe('File Validation', () => {
  it('accepts valid PDF, DOCX, and TXT for syllabus', () => {
    const pdfFile = new File(['dummy content for pdf'], 'syllabus.pdf', { type: 'application/pdf' });
    const docxFile = new File(['dummy content for docx'], 'syllabus.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const txtFile = new File(['dummy content for txt'], 'syllabus.txt', { type: 'text/plain' });

    expect(validateFileInput(pdfFile, true, 0, 0).valid).toBe(true);
    expect(validateFileInput(docxFile, true, 0, 0).valid).toBe(true);
    expect(validateFileInput(txtFile, true, 0, 0).valid).toBe(true);
  });

  it('rejects legacy .doc files with friendly advice', () => {
    const docFile = new File(['legacy doc content'], 'syllabus.doc', { type: 'application/msword' });
    const result = validateFileInput(docFile, true, 0, 0);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Legacy .doc format cannot be read');
    expect(result.error).toContain('re-save as DOCX or PDF');
  });

  it('rejects images for syllabus (syllabus must be document)', () => {
    const imgFile = new File(['img'], 'photo.png', { type: 'image/png' });
    const result = validateFileInput(imgFile, true, 0, 0);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Unsupported file format');
  });

  it('accepts images for study materials', () => {
    const pngFile = new File(['png content'], 'notes.png', { type: 'image/png' });
    const jpgFile = new File(['jpg content'], 'notes.jpg', { type: 'image/jpeg' });
    const webpFile = new File(['webp content'], 'notes.webp', { type: 'image/webp' });

    expect(validateFileInput(pngFile, false, 0, 0).valid).toBe(true);
    expect(validateFileInput(jpgFile, false, 0, 0).valid).toBe(true);
    expect(validateFileInput(webpFile, false, 0, 0).valid).toBe(true);
  });

  it('rejects empty files (0 bytes)', () => {
    const emptyFile = new File([], 'empty.pdf', { type: 'application/pdf' });
    const result = validateFileInput(emptyFile, true, 0, 0);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('0 bytes');
  });

  it('rejects files exceeding 20 MB', () => {
    const largeFile = new File(['a'], 'oversized.pdf', { type: 'application/pdf' });
    Object.defineProperty(largeFile, 'size', { value: MAX_FILE_SIZE + 1024 });

    const result = validateFileInput(largeFile, true, 0, 0);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('too large');
  });

  it('enforces maximum 10 study material files', () => {
    const validFile = new File(['abc'], 'file11.pdf', { type: 'application/pdf' });
    const result = validateFileInput(validFile, false, 10, 1000);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Maximum of 10 files allowed');
  });

  it('enforces maximum 60 MB total study material size', () => {
    const file = new File(['abc'], 'file.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 });

    const result = validateFileInput(file, false, 2, MAX_TOTAL_SIZE - 5 * 1024 * 1024);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceed 60 MB limit');
  });
});
