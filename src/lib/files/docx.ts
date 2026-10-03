import mammoth from 'mammoth';
import { cleanExtractedText } from './clean';
import { chunkDocument } from './chunk';
import type { FileChunk } from '@/types';

export interface ExtractedDocxResult {
  text: string;
  chunks: FileChunk[];
}

export async function extractDocx(
  file: File,
  fileId: string
): Promise<ExtractedDocxResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const rawText = result.value || '';
    const cleaned = cleanExtractedText(rawText);

    if (cleaned.trim().length < 40) {
      throw new Error(
        'This Word document contains little or no text. Please check the document contents.'
      );
    }

    const chunks = chunkDocument(fileId, file.name, cleaned);
    return { text: cleaned, chunks };
  } catch (err) {
    if (err instanceof Error && err.message.includes('little or no text')) {
      throw err;
    }
    throw new Error(
      'Unable to parse this DOCX file. Please ensure it is a valid modern Word document (.docx).'
    );
  }
}
