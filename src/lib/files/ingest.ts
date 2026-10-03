import type { IngestedFile } from '@/types';
import { validateFileInput } from './validate';
import { extractPDF } from './pdf';
import { extractDocx } from './docx';
import { runLocalOCR } from './ocr';
import { cleanExtractedText } from './clean';
import { chunkDocument } from './chunk';

export async function processFileIntake(
  file: File,
  isSyllabus: boolean,
  currentCount: number,
  currentTotalBytes: number,
  onStatusUpdate?: (status: IngestedFile['status'], error?: string) => void
): Promise<IngestedFile> {
  const fileId = `${isSyllabus ? 'syl' : 'mat'}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();

  const fileItem: IngestedFile = {
    id: fileId,
    file,
    name: file.name,
    size: file.size,
    type: ext,
    status: 'reading',
    chunks: [],
  };

  // Validate
  const validation = validateFileInput(
    file,
    isSyllabus,
    currentCount,
    currentTotalBytes
  );

  if (!validation.valid) {
    fileItem.status = 'error';
    fileItem.error = validation.error;
    onStatusUpdate?.('error', validation.error);
    return fileItem;
  }

  try {
    if (ext === '.pdf') {
      const result = await extractPDF(file, fileId);
      fileItem.text = result.text;
      fileItem.chunks = result.chunks;
      fileItem.pageCount = result.pageCount;
      fileItem.isScanned = result.isScanned;
      fileItem.status = 'ready';
    } else if (ext === '.docx') {
      const result = await extractDocx(file, fileId);
      fileItem.text = result.text;
      fileItem.chunks = result.chunks;
      fileItem.status = 'ready';
    } else if (ext === '.txt') {
      const raw = await file.text();
      const cleaned = cleanExtractedText(raw);
      if (cleaned.trim().length < 20) {
        throw new Error('This text file is empty or contains insufficient content.');
      }
      fileItem.text = cleaned;
      fileItem.chunks = chunkDocument(fileId, file.name, cleaned);
      fileItem.status = 'ready';
    } else if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      fileItem.isScanned = true;
      const text = await runLocalOCR(file);
      const cleaned = cleanExtractedText(text);
      if (cleaned.trim().length < 20) {
        throw new Error('OCR could not detect readable text from this image.');
      }
      fileItem.text = cleaned;
      fileItem.chunks = chunkDocument(fileId, file.name, cleaned);
      fileItem.status = 'ready';
    } else {
      throw new Error(`Unsupported file type ${ext}`);
    }

    onStatusUpdate?.('ready');
    return fileItem;
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : 'Failed to read file contents.';
    fileItem.status = 'error';
    fileItem.error = errorMsg;
    onStatusUpdate?.('error', errorMsg);
    return fileItem;
  }
}
