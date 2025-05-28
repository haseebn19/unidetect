import {renderHook, act} from '@testing-library/react';
import {useUnicodeDetection} from './useUnicodeDetection';

describe('useUnicodeDetection', () => {
    it('should initialize with empty state', () => {
        const {result} = renderHook(() => useUnicodeDetection());

        expect(result.current.text).toBe('');
        expect(result.current.hiddenChars).toEqual([]);
        expect(result.current.textStats).toEqual({
            totalChars: 0,
            visibleChars: 0,
            hiddenChars: 0,
            newlineChars: 0,
            bytes: 0,
            spaces: 0
        });
    });

    it('should detect hidden characters', () => {
        const {result} = renderHook(() => useUnicodeDetection());

        act(() => {
            // Text with zero-width space (U+200B)
            result.current.handleTextChange('Hello\u200BWorld');
        });

        expect(result.current.text).toBe('Hello\u200BWorld');
        expect(result.current.hiddenChars).toHaveLength(1);
        expect(result.current.hiddenChars[0]).toEqual({
            char: '\u200B',
            index: 5,
            code: 'Zero Width Space (U+200B)',
            type: 'hidden'
        });
    });

    it('should clean hidden characters', () => {
        const {result} = renderHook(() => useUnicodeDetection());

        act(() => {
            // Text with zero-width space (U+200B)
            result.current.handleTextChange('Hello\u200BWorld');
        });

        const cleanedText = result.current.cleanText();
        expect(cleanedText).toBe('Hello World');
    });

    it('should preserve newlines when cleaning', () => {
        const {result} = renderHook(() => useUnicodeDetection());

        act(() => {
            // Text with newline and zero-width space
            result.current.handleTextChange('Hello\n\u200BWorld');
        });

        const cleanedText = result.current.cleanText();
        expect(cleanedText).toBe('Hello\n World');
    });

    it('should calculate correct statistics', () => {
        const {result} = renderHook(() => useUnicodeDetection());

        act(() => {
            // Text with space, newline, and zero-width space
            result.current.handleTextChange('Hello World\n\u200BTest');
        });

        expect(result.current.textStats).toEqual({
            totalChars: 15,
            visibleChars: 13, // "Hello World Test"
            hiddenChars: 1,   // One zero-width space
            newlineChars: 1,   // One newline
            bytes: expect.any(Number),
            spaces: 1         // One regular space
        });
    });
}); 