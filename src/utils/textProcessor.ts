import {detectHiddenChars} from './unicodeHelpers';
import {HiddenChar, TextStats} from '../types';

/**
 * Processes raw text input and returns text with analysis (no normalization)
 * @param rawText The raw text to process
 * @returns Object containing original text and detected hidden characters
 */
export const processText = (rawText: string): {text: string; hiddenChars: HiddenChar[]} => {
    const hiddenChars = detectHiddenChars(rawText);

    return {
        text: rawText,
        hiddenChars
    };
};

/**
 * Calculates comprehensive text statistics
 * @param text The text to analyze
 * @param hiddenChars Array of detected hidden characters
 * @returns Detailed text statistics
 */
export const calculateTextStats = (text: string, hiddenChars: HiddenChar[]): TextStats => {
    let hiddenCount = 0;
    let newlineCount = 0;
    let spaces = 0;
    let tabCount = 0;
    let visibleChars = 0;

    const hiddenIndices = new Set<number>();

    for (const hiddenChar of hiddenChars) {
        if (hiddenChar.type === 'hidden') {
            hiddenIndices.add(hiddenChar.index);
            hiddenCount++;
        } else if (hiddenChar.type === 'newline') {
            newlineCount++;
        } else if (hiddenChar.type === 'tab') {
            tabCount++;
        }
    }

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === ' ') {  // Count only spaces, not tabs (tabs are counted separately)
            spaces++;
        }
        if (!hiddenIndices.has(i)) {
            visibleChars++;
        }
    }

    return {
        totalChars: text.length,
        visibleChars,
        hiddenChars: hiddenCount,
        newlineChars: newlineCount,
        tabChars: tabCount,
        bytes: new Blob([text]).size,
        spaces
    };
};

/**
 * Cleans text by removing or replacing hidden characters:
 * - Zero-width characters (including soft hyphens) are completely removed
 * - Other hidden characters are replaced with spaces
 * - Preserves newlines, tabs, and visible characters
 * @param text The text to clean
 * @param hiddenChars Array of detected hidden characters
 * @returns Cleaned text with hidden characters removed or replaced
 */
export const cleanText = (text: string, hiddenChars: HiddenChar[]): string => {
    const newlineChars = new Map(
        hiddenChars
            .filter(char => char.type === 'newline')
            .map(char => [char.index, char.char])
    );

    const tabChars = new Map(
        hiddenChars
            .filter(char => char.type === 'tab')
            .map(char => [char.index, char.char])
    );

    let cleanedText = '';
    const chars = Array.from(text);

    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        const isHidden = hiddenChars.some(hiddenChar =>
            hiddenChar.index === i && hiddenChar.type === 'hidden'
        );

        if (isHidden) {
            const code = char.codePointAt(0);
            const isZeroWidth = code && (
                (code >= 0x200B && code <= 0x200F) ||
                (code >= 0x2060 && code <= 0x206F) ||
                code === 0xFEFF ||
                code === 0x00AD
            );

            if (!isZeroWidth) {
                cleanedText += ' ';
            }
        } else if (newlineChars.has(i)) {
            // Preserve the exact newline character (CR or LF)
            cleanedText += newlineChars.get(i);
        } else if (tabChars.has(i)) {
            // Preserve tab characters
            cleanedText += tabChars.get(i);
        } else {
            cleanedText += char;
        }
    }

    return cleanedText;
};
