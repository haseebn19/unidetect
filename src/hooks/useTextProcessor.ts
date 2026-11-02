import {useCallback, useDeferredValue, useMemo, useState} from 'react';
import {countHiddenChars, detectHiddenChars} from '../utils/unicodeHelpers';
import {calculateTextStats, cleanText} from '../utils/textProcessor';

/**
 * Holds the text being inspected and its analysis.
 *
 * Analysis runs on a deferred copy of the text, so typing in large documents stays
 * responsive and the highlights always match the text they were computed from.
 */
export const useTextProcessor = () => {
    const [text, setText] = useState('');
    const analyzedText = useDeferredValue(text);
    const hiddenChars = useMemo(() => detectHiddenChars(analyzedText), [analyzedText]);
    const textStats = useMemo(() => calculateTextStats(analyzedText, hiddenChars), [analyzedText, hiddenChars]);

    /** Cleans the current text in place. Returns the cleaned text and how many hidden characters were removed. */
    const cleanCurrentText = useCallback(() => {
        const removedCount = countHiddenChars(text);
        const cleaned = cleanText(text);
        setText(cleaned);
        return {cleaned, removedCount};
    }, [text]);

    return {text, setText, analyzedText, hiddenChars, textStats, cleanCurrentText};
};
