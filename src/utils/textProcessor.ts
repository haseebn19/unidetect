import {detectHiddenChars, replacementFor} from './unicodeHelpers';
import type {HiddenChar, TextStats} from '../types';

/** Counts characters, bytes, and whitespace in text. `hiddenChars` is the result of `detectHiddenChars(text)`. */
export const calculateTextStats = (text: string, hiddenChars: HiddenChar[]): TextStats => {
    const chars = Array.from(text);
    const countOfType = (type: HiddenChar['type']) => hiddenChars.filter((char) => char.type === type).length;
    const hiddenCount = countOfType('hidden');

    return {
        totalChars: chars.length,
        visibleChars: chars.length - hiddenCount,
        hiddenChars: hiddenCount,
        newlineChars: countOfType('newline'),
        tabChars: countOfType('tab'),
        bytes: new TextEncoder().encode(text).length,
        spaces: chars.filter((char) => char === ' ').length
    };
};

/** Replaces each hidden character with its `replacementFor` value and keeps everything else. */
export const cleanText = (text: string): string => {
    const hiddenIndexes = new Set(
        detectHiddenChars(text)
            .filter((char) => char.type === 'hidden')
            .map((char) => char.index)
    );

    return Array.from(text)
        .map((char, index) => (hiddenIndexes.has(index) ? replacementFor(char) : char))
        .join('');
};
