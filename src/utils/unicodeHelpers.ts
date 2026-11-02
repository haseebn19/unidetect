import type {HiddenChar} from '../types';

// Characters that render as nothing: zero-width spaces and joiners, bidirectional controls,
// variation selectors, tag characters, fillers, and similar format characters.
const INVISIBLE = /\p{Default_Ignorable_Code_Point}/u;
// Whitespace other than the ordinary space, tab, LF, and CR is checked separately.
const WHITE_SPACE = /\p{White_Space}/u;
// Control codes, private use, unassigned code points, and unpaired surrogates.
const CONTROL_OR_UNASSIGNED = /[\p{Cc}\p{Co}\p{Cn}\p{Cs}]/u;
// Whitespace characters that act as line breaks. Cleaning turns these into LF.
const LINE_BREAKS = new Set(['\v', '\f', '\u0085', '\u2028', '\u2029']);

const EMOJI = /\p{Emoji}/u;
const PICTOGRAPHIC = /\p{Extended_Pictographic}/u;
const EMOJI_MODIFIER = /\p{Emoji_Modifier}/u;
const ZERO_WIDTH_JOINER = '\u200D';
const TEXT_PRESENTATION_SELECTOR = '\uFE0E';
const EMOJI_PRESENTATION_SELECTOR = '\uFE0F';

/**
 * Returns true when the character at `index` is a legitimate part of an emoji sequence:
 * a presentation selector after an emoji, or a joiner between two pictographs.
 */
const isPartOfEmojiSequence = (chars: string[], index: number): boolean => {
    const char = chars[index];

    if (char === TEXT_PRESENTATION_SELECTOR || char === EMOJI_PRESENTATION_SELECTOR) {
        return EMOJI.test(chars[index - 1] ?? '');
    }

    if (char === ZERO_WIDTH_JOINER) {
        let previous = index - 1;
        while (
            previous >= 0 &&
            (chars[previous] === EMOJI_PRESENTATION_SELECTOR || EMOJI_MODIFIER.test(chars[previous]))
        ) {
            previous--;
        }
        return PICTOGRAPHIC.test(chars[previous] ?? '') && PICTOGRAPHIC.test(chars[index + 1] ?? '');
    }

    return false;
};

/**
 * Returns true when the character at `index` is invisible or unexpected in plain text.
 * Tabs and line breaks are handled separately by `detectHiddenChars`.
 */
const isHiddenChar = (chars: string[], index: number): boolean => {
    const char = chars[index];
    if (char === ' ' || isPartOfEmojiSequence(chars, index)) {
        return false;
    }
    return INVISIBLE.test(char) || WHITE_SPACE.test(char) || CONTROL_OR_UNASSIGNED.test(char);
};

/**
 * Detects hidden characters, line breaks, and tabs in text.
 * Indexes are code point positions, so characters outside the BMP count as one position.
 */
export const detectHiddenChars = (input: string): HiddenChar[] => {
    const chars = Array.from(input);
    const found: HiddenChar[] = [];

    chars.forEach((char, index) => {
        if (char === '\r' || char === '\n') {
            found.push({char, index, label: char === '\r' ? 'CR (U+000D)' : 'LF (U+000A)', type: 'newline'});
        } else if (char === '\t') {
            found.push({char, index, label: 'Tab (U+0009)', type: 'tab'});
        } else if (isHiddenChar(chars, index)) {
            found.push({char, index, label: describeCodePoint(char.codePointAt(0)!), type: 'hidden'});
        }
    });

    return found;
};

export const countHiddenChars = (text: string): number =>
    detectHiddenChars(text).filter((char) => char.type === 'hidden').length;

/**
 * Returns what a hidden character becomes when text is cleaned: unusual spaces become a
 * regular space, line and paragraph separators become LF, and everything else is removed.
 */
export const replacementFor = (char: string): string => {
    if (LINE_BREAKS.has(char)) return '\n';
    if (WHITE_SPACE.test(char)) return ' ';
    return '';
};

const UNICODE_NAMES: Record<number, string> = {
    // Control characters
    0x0000: 'Null',
    0x0001: 'Start of Heading',
    0x0002: 'Start of Text',
    0x0003: 'End of Text',
    0x0007: 'Bell',
    0x0008: 'Backspace',
    0x000b: 'Line Tabulation',
    0x000c: 'Form Feed',
    0x001b: 'Escape',
    0x007f: 'Delete',
    0x0085: 'Next Line',

    // Spaces
    0x00a0: 'No-Break Space',
    0x1680: 'Ogham Space Mark',
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
    0x200a: 'Hair Space',
    0x2028: 'Line Separator',
    0x2029: 'Paragraph Separator',
    0x202f: 'Narrow No-Break Space',
    0x205f: 'Medium Mathematical Space',
    0x3000: 'Ideographic Space',

    // Zero-width and joining characters
    0x00ad: 'Soft Hyphen',
    0x034f: 'Combining Grapheme Joiner',
    0x200b: 'Zero Width Space',
    0x200c: 'Zero Width Non-Joiner',
    0x200d: 'Zero Width Joiner',
    0x2060: 'Word Joiner',
    0x2061: 'Function Application',
    0x2062: 'Invisible Times',
    0x2063: 'Invisible Separator',
    0x2064: 'Invisible Plus',
    0xfeff: 'Byte Order Mark',

    // Bidirectional text controls
    0x061c: 'Arabic Letter Mark',
    0x200e: 'Left-to-Right Mark',
    0x200f: 'Right-to-Left Mark',
    0x202a: 'Left-to-Right Embedding',
    0x202b: 'Right-to-Left Embedding',
    0x202c: 'Pop Directional Formatting',
    0x202d: 'Left-to-Right Override',
    0x202e: 'Right-to-Left Override',
    0x2066: 'Left-to-Right Isolate',
    0x2067: 'Right-to-Left Isolate',
    0x2068: 'First Strong Isolate',
    0x2069: 'Pop Directional Isolate',

    // Fillers and other invisible format characters
    0x115f: 'Hangul Choseong Filler',
    0x1160: 'Hangul Jungseong Filler',
    0x17b4: 'Khmer Vowel Inherent AQ',
    0x17b5: 'Khmer Vowel Inherent AA',
    0x180e: 'Mongolian Vowel Separator',
    0x3164: 'Hangul Filler',
    0xffa0: 'Halfwidth Hangul Filler',
    0xe0001: 'Language Tag',
    0xe007f: 'Cancel Tag'
};

const UNICODE_RANGES: Array<[number, number, string]> = [
    [0x0000, 0x001f, 'Control Character'],
    [0x007f, 0x009f, 'Control Character'],
    [0x2000, 0x206f, 'General Punctuation'],
    [0xe000, 0xf8ff, 'Private Use Character'],
    [0xfff0, 0xffff, 'Special'],
    [0xf0000, 0x10ffff, 'Private Use Character']
];

const describeRange = (codePoint: number): string | undefined => {
    if (codePoint >= 0xfe00 && codePoint <= 0xfe0f) {
        return `Variation Selector-${codePoint - 0xfe00 + 1}`;
    }
    if (codePoint >= 0xe0100 && codePoint <= 0xe01ef) {
        return `Variation Selector-${codePoint - 0xe0100 + 17}`;
    }
    // Tag characters mirror ASCII, which is how they are used to smuggle invisible text.
    if (codePoint >= 0xe0020 && codePoint <= 0xe007e) {
        const ascii = String.fromCharCode(codePoint - 0xe0000);
        return ascii === ' ' ? 'Tag Space' : `Tag "${ascii}"`;
    }
    return UNICODE_RANGES.find(([start, end]) => codePoint >= start && codePoint <= end)?.[2];
};

/**
 * Formats a code point as a readable label, such as "Zero Width Space (U+200B)".
 */
export const describeCodePoint = (codePoint: number): string => {
    const hex = `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`;
    const name = UNICODE_NAMES[codePoint] ?? describeRange(codePoint);
    return name ? `${name} (${hex})` : hex;
};
