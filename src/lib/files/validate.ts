export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
export const MAX_TOTAL_SIZE = 60 * 1024 * 1024; // 60 MB
export const MAX_FILE_COUNT = 10;
export const MAX_PDF_PAGES = 300;

export const SYLLABUS_EXTENSIONS = ['.pdf', '.docx', '.txt'];
export const MATERIAL_EXTENSIONS = [
  '.pdf',
  '.docx',
  '.txt',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
];

/**
 * Checks file magic bytes to verify actual content type
 */
export async function checkFileSignature(file: File): Promise<string | null> {
  const slice = file.slice(0, 8);
  const buffer = await slice.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // PDF: %PDF (25 50 44 46)
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return 'pdf';
  }

  // ZIP (DOCX is a zip): PK.. (50 4B 03 04)
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && (bytes[2] === 0x03 || bytes[2] === 0x05)) {
    return 'docx';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'png';
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpeg';
  }

  // WEBP: RIFF....WEBP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46
  ) {
    return 'webp';
  }

  // Plain text: assume valid if readable characters or UTF-8
  return 'txt';
}

export function validateFileInput(
  file: File,
  isSyllabus: boolean,
  currentCount: number,
  currentTotalBytes: number
): FileValidationResult {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();

  // Legacy .doc check
  if (ext === '.doc') {
    return {
      valid: false,
      error:
        'Legacy .doc format cannot be read in the browser. Please re-save as DOCX or PDF.',
    };
  }

  // Allowed extensions
  const allowed = isSyllabus ? SYLLABUS_EXTENSIONS : MATERIAL_EXTENSIONS;
  if (!allowed.includes(ext)) {
    return {
      valid: false,
      error: isSyllabus
        ? `Unsupported file format. Please drop a PDF, DOCX, or TXT file.`
        : `Unsupported file format. Supported: PDF, DOCX, TXT, JPG, PNG, WEBP.`,
    };
  }

  // Empty file check
  if (file.size === 0) {
    return {
      valid: false,
      error: 'This file appears to be empty (0 bytes).',
    };
  }

  // Max individual file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed is 20 MB.`,
    };
  }

  // Max count check (only for study materials)
  if (!isSyllabus && currentCount >= MAX_FILE_COUNT) {
    return {
      valid: false,
      error: `Maximum of ${MAX_FILE_COUNT} files allowed. Please remove a file to add another.`,
    };
  }

  // Max total cumulative size
  if (!isSyllabus && currentTotalBytes + file.size > MAX_TOTAL_SIZE) {
    return {
      valid: false,
      error: `Total uploads exceed 60 MB limit. Please select a smaller file or remove previous files.`,
    };
  }

  return { valid: true };
}
