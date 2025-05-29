import {HiddenChar} from '../types';

/**
 * Detects hidden and special characters in text input
 * @param input Text to analyze
 * @returns Array of hidden characters with their positions and types
 */
export const detectHiddenChars = (input: string): HiddenChar[] => {
    const hidden: HiddenChar[] = [];
    const chars = Array.from(input);

    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        const code = char.codePointAt(0);
        if (!code) {
            continue;
        }

        // Handle newline characters individually
        if (char === '\r' || char === '\n') {
            hidden.push({
                char,
                index: i,
                code: char === '\r' ? 'CR (U+000D)' : 'LF (U+000A)',
                type: 'newline'
            });
            continue;
        }

        if (isHiddenCharacter(char, code)) {
            const codeName = getUnicodeCodeName(code);
            hidden.push({
                char,
                index: i,
                code: codeName,
                type: 'hidden'
            });
        }
    }

    return hidden;
};

/**
 * Check for hidden characters
 * @param char The character to check
 * @param code The Unicode code point
 * @returns True if the character is hidden/non-printable
 */
const isHiddenCharacter = (char: string, code: number): boolean => {
    if (code >= 0x2060 && code <= 0x2064) return true;
    if (char === '\u200B') return true;
    if (code === 0xFEFF) return true;

    if ((code >= 0x00 && code <= 0x1F) || (code >= 0x7F && code <= 0x9F)) {
        return code !== 0x09 && code !== 0x0A && code !== 0x0D;
    }

    // Check for other non-printable using regex (more expensive, so do last)
    return !char.match(/^[\p{L}\p{M}\p{N}\p{P}\p{S}\p{Z}]$/u);
};

/**
 * Unicode character names for common hidden/special characters
 */
const UNICODE_NAMES: Record<number, string> = {
    // Zero-width and invisible characters
    0x200B: 'Zero Width Space',
    0x200C: 'Zero Width Non-Joiner',
    0x200D: 'Zero Width Joiner',
    0x200E: 'Left-to-Right Mark',
    0x200F: 'Right-to-Left Mark',
    0x2060: 'Word Joiner',
    0x2061: 'Function Application',
    0x2062: 'Invisible Times',
    0x2063: 'Invisible Separator',
    0x2064: 'Invisible Plus',
    0x2066: 'Left-to-Right Isolate',
    0x2067: 'Right-to-Left Isolate',
    0x2068: 'First Strong Isolate',
    0x2069: 'Pop Directional Isolate',
    0xFEFF: 'Byte Order Mark',

    // Control characters
    0x0000: 'Null',
    0x0001: 'Start of Heading',
    0x0002: 'Start of Text',
    0x0003: 'End of Text',
    0x0007: 'Bell',
    0x0008: 'Backspace',
    0x0009: 'Character Tabulation',
    0x000A: 'Line Feed',
    0x000B: 'Line Tabulation',
    0x000C: 'Form Feed',
    0x000D: 'Carriage Return',
    0x001B: 'Escape',
    0x007F: 'Delete',
    0x0085: 'Next Line',

    // Space characters
    0x00A0: 'No-Break Space',
    0x2000: 'En Quad',
    0x2001: 'Em Quad',
    0x2002: 'En Space',
    0x2003: 'Em Space',
    0x2009: 'Thin Space',
    0x200A: 'Hair Space',
    0x202F: 'Narrow No-Break Space',
    0x3000: 'Ideographic Space',

    // Other format characters
    0x061C: 'Arabic Letter Mark',
    0x180E: 'Mongolian Vowel Separator'
};



/**
 * Gets the Unicode name and code point for a character
 * @param code Unicode code point value
 * @returns Formatted string with code point and name
 */
export const getUnicodeCodeName = (code: number): string => {
    const codeHex = code.toString(16).toUpperCase().padStart(4, '0');
    const unicodeName = UNICODE_NAMES[code];

    if (unicodeName) {
        return `${unicodeName} (U+${codeHex})`;
    }

    // Simple fallback for unknown characters
    return `U+${codeHex}`;
};

