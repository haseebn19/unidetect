/**
 * Represents a hidden character found in text
 */
export interface HiddenChar {
    /** The actual character */
    char: string;
    /** Position in the text */
    index: number;
    /** Unicode code point and name */
    code: string;
    /** Type of hidden character */
    type: 'hidden' | 'newline' | 'tab';
}

/**
 * Statistics about the analyzed text
 */
export interface TextStats {
    /** Total number of characters */
    totalChars: number;
    /** Number of visible characters (including tabs and newlines) */
    visibleChars: number;
    /** Number of hidden characters */
    hiddenChars: number;
    /** Number of newline characters (also included in visibleChars) */
    newlineChars: number;
    /** Number of tab characters (also included in visibleChars) */
    tabChars: number;
    /** Total size in bytes */
    bytes: number;
    /** Number of space characters */
    spaces: number;
}

/**
 * Types of status messages
 */
export type MessageType = 'success' | 'info' | 'error';