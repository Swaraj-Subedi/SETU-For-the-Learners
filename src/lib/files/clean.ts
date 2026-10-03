/**
 * Clean extracted raw text:
 * - De-hyphenates line breaks (e.g. "charac-\nteristic" -> "characteristic")
 * - Drops repeated headers and footers across pages
 * - Normalizes excessive whitespace while preserving paragraphs and headings
 */
export function cleanExtractedText(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Normalize line endings
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 2. De-hyphenate words broken by line breaks
  // e.g. "differ-\nent" -> "different"
  text = text.replace(/([a-zA-Z]{2,})-\n([a-zA-Z]{2,})/g, '$1$2');

  // 3. Remove standalone page numbers or simple running headers
  // e.g. "Page 12 of 45" or lines that are just numbers
  text = text
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      // Filter out isolated page numbering: "Page 1", "12 / 40", "[ 3 ]"
      if (/^(page\s+\d+(\s+of\s+\d+)?|\d+|-\s*\d+\s*-)$/i.test(trimmed)) {
        return false;
      }
      return true;
    })
    .join('\n');

  // 4. Collapse 3+ consecutive newlines to 2 (preserve paragraph breaks)
  text = text.replace(/\n{3,}/g, '\n\n');

  // 5. Replace runs of tabs or spaces with single space within lines
  text = text
    .split('\n')
    .map((line) => line.replace(/[ \t]{2,}/g, ' ').trim())
    .join('\n');

  return text.trim();
}
