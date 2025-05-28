import {useState, useCallback, useMemo, useRef, useEffect} from 'react';
import {HiddenChar, TextStats} from '../types';
import {processText, calculateTextStats, cleanText} from '../utils/textProcessor';

/**
 * Return type for the useTextProcessor hook
 */
interface UseTextProcessorResult {
    text: string;
    hiddenChars: HiddenChar[];
    textStats: TextStats;
    handleTextInput: (rawText: string) => void;
    cleanTextContent: () => string;
}

/**
 * Custom hook for unified text processing
 * Handles both pasted text and extracted file text through the same pipeline
 */
export const useTextProcessor = (): UseTextProcessorResult => {
    const [text, setText] = useState<string>('');
    const [hiddenChars, setHiddenChars] = useState<HiddenChar[]>([]);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);    /**
     * Processes any text input (pasted or from files) through unified pipeline
     * Detects hidden characters without text normalization
     */
    const handleTextInput = useCallback((rawText: string) => {
        const {text: processedText, hiddenChars: detectedChars} = processText(rawText);
        setText(processedText);

        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        if (processedText.length > 10000) {
            debounceTimeoutRef.current = setTimeout(() => {
                setHiddenChars(detectedChars);
            }, 300);
        } else {
            setHiddenChars(detectedChars);
        }
    }, []);

    /**
     * Calculates and returns current text statistics
     * Includes character counts, byte size, and space analysis
     */
    const textStats: TextStats = useMemo(() => {
        return calculateTextStats(text, hiddenChars);
    }, [text, hiddenChars]);

    /**
     * Cleans text by replacing hidden characters with spaces
     * Preserves newlines and visible characters
     */
    const cleanTextContent = useCallback((): string => {
        return cleanText(text, hiddenChars);
    }, [text, hiddenChars]);

    /**
     * Cleanup debounce timeout on unmount
     */
    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    return {
        text,
        hiddenChars,
        textStats,
        handleTextInput,
        cleanTextContent
    };
};
