import {HiddenChar} from '../types';

/**
 * Determines the Unicode category of a character
 * This is a simplified version that covers the main categories
 * L = Letter, N = Number, P = Punctuation, S = Symbol, Z = Separator, etc.
 * 
 * @param char The character to categorize
 * @returns The Unicode category abbreviation
 */
const getUnicodeCategory = (char: string): string => {
    // Use regex to determine character category
    if (/^\p{L}$/u.test(char)) return 'L'; // Letter
    if (/^\p{N}$/u.test(char)) return 'N'; // Number
    if (/^\p{P}$/u.test(char)) return 'P'; // Punctuation
    if (/^\p{S}$/u.test(char)) return 'S'; // Symbol
    if (/^\p{Z}$/u.test(char)) return 'Z'; // Separator/space
    if (/^\p{M}$/u.test(char)) return 'M'; // Mark
    if (/^\p{C}$/u.test(char)) return 'C'; // Control/format
    
    // Default category for anything else
    return 'O'; // Other
};

/**
 * Detects hidden and special characters in text input
 * @param input Text to analyze
 * @returns Array of hidden characters with their positions and types
 */
export const detectHiddenChars = (input: string): HiddenChar[] => {
    const hidden: HiddenChar[] = [];
    // Use array spread with String.prototype[Symbol.iterator] to properly handle surrogate pairs
    const chars = [...input];

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
    // Special space characters - check for these specifically since some are not correctly identified by regex
    if (code === 0x205F || // Medium Mathematical Space
        code === 0x00A0 || // No-Break Space
        code === 0x202F || // Narrow No-Break Space
        (code >= 0x2000 && code <= 0x200A) || // Various width spaces
        code === 0x3000) // Ideographic Space
        return true;

    // Word joiners, zero-width characters, and other special format characters
    if ((code >= 0x2060 && code <= 0x206F) || // Word joiners and invisible format characters
        (code >= 0x200B && code <= 0x200F) || // Zero-width characters and directional marks
        code === 0xFEFF) // Byte order mark
        return true;

    // Control characters
    if ((code >= 0x00 && code <= 0x1F) || (code >= 0x7F && code <= 0x9F)) {
        return code !== 0x09 && code !== 0x0A && code !== 0x0D; // Exclude tab and newlines
    }

    // Arabic Letter Mark and Mongolian Vowel Separator
    if (code === 0x061C || code === 0x180E)
        return true;
    
    // Additional check for other characters by their Unicode category
    // Using a more precise approach than regex for better performance
    const category = getUnicodeCategory(char);
    
    // If it's a visible character from standard categories, it's not hidden
    if (category === 'L' || category === 'N' || category === 'P' || category === 'S') {
        return false;
    }
    
    // Exclude regular spaces, which are categorized as 'Zs'
    if (code === 0x0020) { // Regular space
        return false;
    }
    
    // For everything else, consider it potentially hidden or special
    return true;
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
    0x2004: 'Three-Per-Em Space',
    0x2005: 'Four-Per-Em Space',
    0x2006: 'Six-Per-Em Space',
    0x2007: 'Figure Space',
    0x2008: 'Punctuation Space',
    0x2009: 'Thin Space',
    0x200A: 'Hair Space',
    0x202F: 'Narrow No-Break Space',
    0x205F: 'Medium Mathematical Space',
    0x3000: 'Ideographic Space',    // Other format characters
    0x061C: 'Arabic Letter Mark',
    0x180E: 'Mongolian Vowel Separator',
    0x2028: 'Line Separator',
    0x2029: 'Paragraph Separator',
    0x00AD: 'Soft Hyphen',
    0x034F: 'Combining Grapheme Joiner',
    0x115F: 'Hangul Choseong Filler',
    0x1160: 'Hangul Jungseong Filler',
    0x17B4: 'Khmer Vowel Inherent AQ',
    0x17B5: 'Khmer Vowel Inherent AA'
};



/**
 * Maps Unicode ranges to human-readable descriptions
 */
const UNICODE_RANGES: Array<[number, number, string]> = [
    [0x0000, 0x001F, 'Control Character'],
    [0x007F, 0x009F, 'Control Character'],
    [0x0080, 0x00FF, 'Latin-1 Supplement'],
    [0x0100, 0x017F, 'Latin Extended-A'],
    [0x0180, 0x024F, 'Latin Extended-B'],
    [0x2000, 0x206F, 'General Punctuation'],
    [0x2070, 0x209F, 'Superscripts and Subscripts'],
    [0x20A0, 0x20CF, 'Currency Symbols'],
    [0x20D0, 0x20FF, 'Combining Diacritical Marks for Symbols'],
    [0xE000, 0xF8FF, 'Private Use Area'],
    [0xF900, 0xFAFF, 'CJK Compatibility Ideographs'],
    [0xFE00, 0xFE0F, 'Variation Selectors'],
    [0xFE10, 0xFE1F, 'Vertical Forms'],
    [0xFE20, 0xFE2F, 'Combining Half Marks'],
    [0xFE30, 0xFE4F, 'CJK Compatibility Forms'],
    [0xFE50, 0xFE6F, 'Small Form Variants'],
    [0xFE70, 0xFEFF, 'Arabic Presentation Forms-B'],
    [0xFFF0, 0xFFFF, 'Specials'],
];

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
    
    // Try to identify the range this character belongs to
    for (const [start, end, name] of UNICODE_RANGES) {
        if (code >= start && code <= end) {
            return `${name} (U+${codeHex})`;
        }
    }

    // Simple fallback for completely unknown characters
    return `U+${codeHex}`;
};

