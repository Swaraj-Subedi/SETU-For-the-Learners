import { createWorker } from 'tesseract.js';

export interface OCROptions {
  onProgress?: (progress: number) => void;
}

/**
 * Perform optical character recognition on an image blob, canvas, or URL
 * Uses strictly self-hosted worker, core WASM, and language traineddata
 * Never makes external third-party requests.
 */
export async function runLocalOCR(
  imageSource: Blob | HTMLCanvasElement | string,
  options?: OCROptions
): Promise<string> {
  let worker = null;
  try {
    worker = await createWorker('eng', 1, {
      workerPath: '/tesseract/worker.min.js',
      corePath: '/tesseract',
      langPath: '/tesseract',
      gzip: true,
      logger: (m) => {
        if (m.status === 'recognizing text' && options?.onProgress) {
          options.onProgress(m.progress);
        }
      },
    });

    const res = await worker.recognize(imageSource);
    return res.data.text || '';
  } catch (err) {
    console.error('OCR processing error:', err);
    throw new Error(
      'OCR failed to extract readable text. Please ensure the image is clear or convert to DOCX/PDF.'
    );
  } finally {
    if (worker) {
      await worker.terminate().catch(() => {});
    }
  }
}
