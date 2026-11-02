import {describe, it, expect} from 'vitest';
import {describeCodePoint, detectHiddenChars} from './unicodeHelpers';
import {cleanText} from './textProcessor';

const hiddenLabels = (text: string) =>
    detectHiddenChars(text)
        .filter((char) => char.type === 'hidden')
        .map((char) => char.label);

describe('detectHiddenChars', () => {
    it('flags zero-width characters, unusual spaces, and control codes', () => {
        expect(hiddenLabels('a\u200Bb\u00A0c\u0007d\uFEFF')).toEqual([
            'Zero Width Space (U+200B)',
            'No-Break Space (U+00A0)',
            'Bell (U+0007)',
            'Byte Order Mark (U+FEFF)'
        ]);
    });

    it('flags bidirectional overrides used to disguise text', () => {
        expect(hiddenLabels('access\u202Elevel\u202C')).toEqual([
            'Right-to-Left Override (U+202E)',
            'Pop Directional Formatting (U+202C)'
        ]);
    });

    it('names tag characters by the ASCII letter they hide', () => {
        expect(hiddenLabels('ok\u{E0068}\u{E0069}')).toEqual(['Tag "h" (U+E0068)', 'Tag "i" (U+E0069)']);
    });

    it('marks line breaks and tabs without counting them as hidden', () => {
        const found = detectHiddenChars('a\tb\r\nc');
        expect(found.map((char) => char.type)).toEqual(['tab', 'newline', 'newline']);
    });

    it('does not flag combining marks in ordinary text', () => {
        expect(hiddenLabels('cafe\u0301')).toEqual([]);
        expect(hiddenLabels('\u0939\u093F\u0928\u094D\u0926\u0940')).toEqual([]);
    });

    it('does not flag the parts of emoji sequences', () => {
        expect(hiddenLabels('\u2764\uFE0F')).toEqual([]);
        expect(hiddenLabels('\u{1F9D1}\u200D\u{1F4BB}')).toEqual([]);
        expect(hiddenLabels('\u{1F469}\u{1F3FD}\u200D\u{1F4BB}')).toEqual([]);
        expect(hiddenLabels('\u{1F3F3}\uFE0F\u200D\u{1F308}')).toEqual([]);
    });

    it('flags joiners and variation selectors outside emoji sequences', () => {
        expect(hiddenLabels('a\u200Db')).toEqual(['Zero Width Joiner (U+200D)']);
        expect(hiddenLabels('a\uFE0F')).toEqual(['Variation Selector-16 (U+FE0F)']);
        expect(hiddenLabels('a\u{E0101}')).toEqual(['Variation Selector-18 (U+E0101)']);
    });
});

describe('cleanText', () => {
    it('removes invisible characters and normalizes unusual spaces', () => {
        expect(cleanText('Hello\u200B\u2060World\u00A0Test\u3000end')).toBe('HelloWorld Test end');
    });

    it('removes tag characters without leaving spaces behind', () => {
        expect(cleanText('ok\u{E0068}\u{E0069}!')).toBe('ok!');
    });

    it('turns line and paragraph separators into line breaks', () => {
        expect(cleanText('one\u2028two\u2029three')).toBe('one\ntwo\nthree');
    });

    it('keeps tabs, line breaks, accents, scripts, and emoji intact', () => {
        const text = 'cafe\u0301\t\u0939\u093F\u0928\u094D\u0926\u0940\r\n\u2764\uFE0F \u{1F9D1}\u200D\u{1F4BB}';
        expect(cleanText(text)).toBe(text);
    });
});

describe('describeCodePoint', () => {
    it('falls back to a range name or the bare code point', () => {
        expect(describeCodePoint(0xe000)).toBe('Private Use Character (U+E000)');
        expect(describeCodePoint(0x0378)).toBe('U+0378');
    });
});
