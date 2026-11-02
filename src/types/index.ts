/**
 * A hidden character, line break, or tab found in text.
 */
export interface HiddenChar {
    char: string;
    /** Code point position in the text */
    index: number;
    /** Readable name and code point, such as "Zero Width Space (U+200B)" */
    label: string;
    /** Hidden characters are flagged; line breaks and tabs are only marked */
    type: 'hidden' | 'newline' | 'tab';
}

/**
 * Counts for the analyzed text. Character counts are in code points.
 */
export interface TextStats {
    totalChars: number;
    /** Code points that are not hidden, including spaces, tabs, and line breaks */
    visibleChars: number;
    hiddenChars: number;
    /** CR and LF characters */
    newlineChars: number;
    tabChars: number;
    /** Size of the text when encoded as UTF-8 */
    bytes: number;
    /** Ordinary space characters */
    spaces: number;
}

export type MessageType = 'success' | 'error';
