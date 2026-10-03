import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { runLocalOCR } from './ocr';
import { cleanExtractedText } from './clean';
import { chunkDocument } from './chunk';
import type { FileChunk } from '@/types';
import { MAX_PDF_PAGES } from './validate';

// Configure self-hosted worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export interface ExtractedPDFResult {
  text: string;
  chunks: FileChunk[];
  pageCount: number;
  isScanned: boolean;
}

export async function extractPDF(
  file: File,
  fileId: string,
  onPageProgress?: (page: number, total: number) => void
): Promise<ExtractedPDFResult> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  if (numPages > MAX_PDF_PAGES) {
    throw new Error(
      `PDF exceeds the maximum limit of ${MAX_PDF_PAGES} pages (contains ${numPages} pages). Please use a shorter excerpt.`
    );
  }

  const allPageTexts: string[] = [];
  const allChunks: FileChunk[] = [];
  let scannedPagesCount = 0;

  for (let i = 1; i <= numPages; i++) {
    onPageProgress?.(i, numPages);
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const items = textContent.items as Array<{ str?: string }>;
    let pageRawText = items.map((item) => item.str || '').join(' ');

    // If text layer yields very few words (< 30 words), fallback to OCR rendering
    const wordCount = pageRawText.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 30 && typeof document !== 'undefined') {
      try {
        const viewport = page.getViewport({ scale: 2.0 }); // 2x for OCR legibility
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvas, canvasContext: context, viewport }).promise;
          const ocrText = await runLocalOCR(canvas);
          if (ocrText.trim().length > pageRawText.trim().length) {
            pageRawText = ocrText;
            scannedPagesCount++;
          }
        }
      } catch (ocrErr) {
        console.warn(`OCR fallback failed on page ${i}, using extracted text:`, ocrErr);
      }
    }

    const cleanedPageText = cleanExtractedText(pageRawText);
    allPageTexts.push(cleanedPageText);

    const pageChunks = chunkDocument(
      fileId,
      file.name,
      cleanedPageText,
      i
    );
    allChunks.push(...pageChunks);
  }

  const fullText = allPageTexts.join('\n\n');
  if (fullText.trim().length < 40) {
    throw new Error(
      'Could not extract meaningful text from this PDF. It may be password-protected or contain unreadable scans.'
    );
  }

  return {
    text: fullText,
    chunks: allChunks,
    pageCount: numPages,
    isScanned: scannedPagesCount > 0,
  };
}
