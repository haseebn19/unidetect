import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useTextProcessor } from './useTextProcessor';

describe('useTextProcessor', () => {
  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useTextProcessor());
    expect(result.current.text).toBe('');
    expect(result.current.hiddenChars).toEqual([]);
    expect(result.current.textStats.totalChars).toBe(0);
  });

  it('should process text input and detect hidden characters', () => {
    const { result } = renderHook(() => useTextProcessor());
    const textWithHidden = 'Hello\u200bWorld';

    act(() => {
      result.current.handleTextInput(textWithHidden);
    });

    expect(result.current.text).toBe('Hello\u200bWorld');
    expect(result.current.hiddenChars).toHaveLength(1);
    expect(result.current.hiddenChars[0]).toEqual({
      char: '\u200b',
      code: 'Zero Width Space (U+200B)',
      index: 5,
      type: 'hidden',
    });
  });

  it('should preserve text exactly as-is', () => {
    const { result } = renderHook(() => useTextProcessor());
    const textWithLF = 'Line 1\nLine 2\nLine 3';

    act(() => {
      result.current.handleTextInput(textWithLF);
    });
    expect(result.current.text).toBe('Line 1\nLine 2\nLine 3');
  });

  it('should calculate text statistics correctly', () => {
    const { result } = renderHook(() => useTextProcessor());
    const text = 'Hello World!\nSecond line';
    act(() => {
      result.current.handleTextInput(text);
    });

    const stats = result.current.textStats;
    expect(stats.totalChars).toBe(24);
    expect(stats.visibleChars).toBe(24);
    expect(stats.newlineChars).toBe(1);
    expect(stats.spaces).toBe(2);
  });

  it('should clean text by removing hidden characters', () => {
    const { result } = renderHook(() => useTextProcessor());
    // Test with zero-width space, word joiner, and no-break space
    const textWithHidden = 'Hello\u200b\u2060World\u00a0Test';

    act(() => {
      result.current.handleTextInput(textWithHidden);
    });

    const cleanedText = result.current.cleanTextContent();
    // Zero-width characters are removed, no-break space is replaced with regular space
    expect(cleanedText).toBe('HelloWorld Test');
  });

  it('should handle empty text input', () => {
    const { result } = renderHook(() => useTextProcessor());

    act(() => {
      result.current.handleTextInput('');
    });

    expect(result.current.text).toBe('');
    expect(result.current.hiddenChars).toEqual([]);
    expect(result.current.textStats.totalChars).toBe(0);
  });

  it('should handle text with only spaces', () => {
    const { result } = renderHook(() => useTextProcessor());
    const spacesText = '   ';

    act(() => {
      result.current.handleTextInput(spacesText);
    });

    expect(result.current.text).toBe('   ');
    expect(result.current.textStats.spaces).toBe(3);
    expect(result.current.textStats.visibleChars).toBe(3);
  });
});
