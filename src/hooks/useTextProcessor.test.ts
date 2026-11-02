import {renderHook, act} from '@testing-library/react';
import {describe, it, expect} from 'vitest';
import {useTextProcessor} from './useTextProcessor';

const renderWithText = (text: string) => {
    const hook = renderHook(() => useTextProcessor());
    act(() => {
        hook.result.current.setText(text);
    });
    return hook.result;
};

describe('useTextProcessor', () => {
    it('starts empty', () => {
        const {result} = renderHook(() => useTextProcessor());
        expect(result.current.text).toBe('');
        expect(result.current.hiddenChars).toEqual([]);
        expect(result.current.textStats.totalChars).toBe(0);
    });

    it('detects hidden characters in the text', () => {
        const result = renderWithText('Hello\u200BWorld');

        expect(result.current.text).toBe('Hello\u200BWorld');
        expect(result.current.hiddenChars).toEqual([
            {char: '\u200B', label: 'Zero Width Space (U+200B)', index: 5, type: 'hidden'}
        ]);
    });

    it('keeps the text exactly as entered', () => {
        const result = renderWithText('Line 1\nLine 2\r\nLine 3');
        expect(result.current.text).toBe('Line 1\nLine 2\r\nLine 3');
        expect(result.current.analyzedText).toBe('Line 1\nLine 2\r\nLine 3');
    });

    it('calculates text statistics', () => {
        const stats = renderWithText('Hello World!\nSecond line').current.textStats;

        expect(stats.totalChars).toBe(24);
        expect(stats.visibleChars).toBe(24);
        expect(stats.newlineChars).toBe(1);
        expect(stats.spaces).toBe(2);
    });

    it('cleans the text in place and reports how many characters were removed', () => {
        const result = renderWithText('Hello\u200B\u2060World\u00A0Test');

        let outcome: {cleaned: string; removedCount: number} | undefined;
        act(() => {
            outcome = result.current.cleanCurrentText();
        });

        expect(outcome).toEqual({cleaned: 'HelloWorld Test', removedCount: 3});
        expect(result.current.text).toBe('HelloWorld Test');
        expect(result.current.hiddenChars).toEqual([]);
    });

    it('keeps positions aligned after characters outside the BMP', () => {
        const result = renderWithText('\u{1F600}a\u200Bb');

        expect(result.current.hiddenChars[0]).toEqual({
            char: '\u200B',
            label: 'Zero Width Space (U+200B)',
            index: 2,
            type: 'hidden'
        });
        expect(result.current.textStats.totalChars).toBe(4);
        expect(result.current.textStats.visibleChars).toBe(3);
    });

    it('counts spaces as visible characters', () => {
        const stats = renderWithText('   ').current.textStats;
        expect(stats.spaces).toBe(3);
        expect(stats.visibleChars).toBe(3);
    });
});
