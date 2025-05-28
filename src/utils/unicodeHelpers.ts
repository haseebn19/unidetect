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
        if (!code) continue;

        // Handle newline characters
        if (char === '\r' || char === '\n') {
            hidden.push({
                char,
                index: i,
                code: char === '\r' ? 'CR (U+000D)' : 'LF (U+000A)',
                type: 'newline'
            });
            continue;
        }

        // Check for non-printable characters using Unicode properties
        const isPrintable = char.match(/^[\p{L}\p{M}\p{N}\p{P}\p{S}\p{Z}]$/u) && char !== '\u200B';

        if (!isPrintable || (code >= 0x2060 && code <= 0x2064)) {
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
 * Gets the Unicode name and code point for a character
 * @param code Unicode code point value
 * @returns Formatted string with code point and name
 */
export const getUnicodeCodeName = (code: number): string => {
    const codeHex = code.toString(16).toUpperCase().padStart(4, '0');

    // Special format characters with descriptive names
    switch (code) {
        case 0x2060: return 'Word Joiner (U+2060)';
        case 0x2061: return 'Function Application (U+2061)';
        case 0x2062: return 'Invisible Times (U+2062)';
        case 0x2063: return 'Invisible Separator (U+2063)';
        case 0x2064: return 'Invisible Plus (U+2064)';
        case 0x200B: return 'Zero Width Space (U+200B)';
        case 0xFEFF: return 'Byte Order Mark (U+FEFF)';
        default: return `U+${codeHex}`;
    }
}; 