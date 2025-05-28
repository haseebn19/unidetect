import {useState, useCallback, useMemo} from 'react';
import {HiddenChar, TextStats} from '../types';
import {detectHiddenChars} from '../utils/unicodeHelpers';
import {normalizeText} from '../utils/textNormalization';

/**
 * Custom hook for Unicode character detection and management
 * Handles text state, character detection, and text cleaning operations
 */
export const useUnicodeDetection = () => {
    const [text, setText] = useState<string>('');
    const [hiddenChars, setHiddenChars] = useState<HiddenChar[]>([]);

    /**
     * Updates text content and detects hidden characters
     * Applies text normalization for consistent line endings
     */
    const handleTextChange = useCallback((newText: string) => {
        const normalizedText = normalizeText(newText);
        setText(normalizedText);
        setHiddenChars(detectHiddenChars(normalizedText));
    }, []);

    /**
     * Calculates and returns current text statistics
     * Includes character counts, byte size, and space analysis
     */
    const textStats: TextStats = useMemo(() => {
        const stats = {
            totalChars: text.length,
            visibleChars: 0,
            hiddenChars: hiddenChars.filter(char => char.type === 'hidden').length,
            newlineChars: hiddenChars.filter(char => char.type === 'newline').length,
            bytes: new Blob([text]).size,
            spaces: 0
        };

        for (const char of text) {
            if (char === ' ') {
                stats.spaces++;
            }
            if (!hiddenChars.some(hidden => hidden.char === char)) {
                stats.visibleChars++;
            }
        }

        return stats;
    }, [text, hiddenChars]);

    /**
     * Cleans text by replacing hidden characters with spaces
     * Preserves newlines and visible characters
     */
    const cleanText = useCallback((): string => {
        const newlineIndices = new Set(
            hiddenChars
                .filter(char => char.type === 'newline')
                .map(char => char.index)
        );

        let cleanedText = '';
        const chars = Array.from(text);

        for (let i = 0; i < chars.length; i++) {
            const isHiddenChar = hiddenChars.some(h => h.index === i && h.type === 'hidden');
            if (isHiddenChar) {
                cleanedText += ' ';
            } else if (newlineIndices.has(i)) {
                cleanedText += chars[i];
            } else {
                cleanedText += chars[i];
            }
        }

        return cleanedText;
    }, [text, hiddenChars]);

    return {
        text,
        hiddenChars,
        textStats,
        handleTextChange,
        cleanText
    };
}; 