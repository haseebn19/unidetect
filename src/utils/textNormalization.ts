/**
 * Normalizes text content for consistent formatting
 * - Converts all line endings to CRLF format
 * - Preserves intentional line breaks
 * - Removes excessive blank lines
 * @param text The text content to normalize
 * @returns Normalized text with consistent formatting
 */
export const normalizeText = (text: string): string => {
    // Convert all line endings to CRLF
    let normalized = text
        .replace(/\r(?!\n)/g, '\r\n')
        .replace(/(?<!\r)\n/g, '\r\n');

    // Limit consecutive line breaks to maximum of two
    normalized = normalized.replace(/(\r\n){3,}/g, '\r\n\r\n');

    return normalized;
}; 