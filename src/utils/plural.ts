/** A count with its noun, such as "1 hidden character" or "3 hidden characters". */
export const plural = (count: number, word: string): string => `${count} ${word}${count === 1 ? '' : 's'}`;
