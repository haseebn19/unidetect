import mammoth from 'mammoth';
import {getDocument, GlobalWorkerOptions, OPS, version} from 'pdfjs-dist';
import {detectHiddenChars} from './unicodeHelpers';

// Configure PDF.js worker
GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;

interface PDFTextItemLike {
    str: string;
    transform?: number[];
}

interface PDFPageLike {
    getOperatorList: () => Promise<{fnArray: number[]; argsArray: unknown[]}>;
    getTextContent: () => Promise<{items: unknown[]}>;
}

interface PositionedTextItem {
    str: string;
    y: number;
    order: number;
}

interface PDFGlyphLike {
    unicode?: unknown;
}

const isPDFTextItem = (item: unknown): item is PDFTextItemLike => (
    typeof item === 'object' &&
    item !== null &&
    'str' in item &&
    typeof (item as PDFTextItemLike).str === 'string'
);

const isPDFGlyph = (value: unknown): value is PDFGlyphLike => (
    typeof value === 'object' &&
    value !== null &&
    'unicode' in value
);

const countHiddenUnicodeChars = (text: string): number => (
    detectHiddenChars(text).filter(char => char.type === 'hidden').length
);

const hasDetectableContent = (text: string): boolean => (
    text.trim().length > 0 || countHiddenUnicodeChars(text) > 0
);

const normalizeExtractedLine = (line: string): string => (
    line.trim().length > 0 ? line.trim() : line
);

const combinePositionedTextItems = (
    items: PositionedTextItem[],
    itemJoiner: string
): string => {
    const lines: Record<number, {parts: string[]; firstOrder: number}> = {};

    items.forEach(item => {
        if (!lines[item.y]) {
            lines[item.y] = {parts: [], firstOrder: item.order};
        }
        lines[item.y].parts.push(item.str);
    });

    const sortedYPositions = Object.keys(lines)
        .map(Number)
        .sort((a, b) => b - a || lines[a].firstOrder - lines[b].firstOrder);

    let pageText = '';
    let lastY: number | null = null;

    sortedYPositions.forEach(y => {
        const line = normalizeExtractedLine(lines[y].parts.join(itemJoiner));
        if (line) {
            if (lastY !== null && Math.abs(y - lastY) > 15) {
                pageText += '\n\n';
            } else if (lastY !== null) {
                pageText += '\n';
            }
            pageText += line;
            lastY = y;
        }
    });

    return pageText;
};

const extractTextContentText = async (page: PDFPageLike): Promise<string> => {
    const content = await page.getTextContent();
    const items: PositionedTextItem[] = [];

    content.items.forEach((item, order) => {
        if (!isPDFTextItem(item)) {
            return;
        }

        const hiddenCount = countHiddenUnicodeChars(item.str);
        if (!item.str.trim() && hiddenCount === 0) {
            return;
        }

        const y = Array.isArray(item.transform) && typeof item.transform[5] === 'number'
            ? Math.round(item.transform[5])
            : 0;

        items.push({str: item.str, y, order});
    });

    return combinePositionedTextItems(items, ' ');
};

const extractGlyphText = (value: unknown): string => {
    if (Array.isArray(value)) {
        return value.map(extractGlyphText).join('');
    }

    if (!isPDFGlyph(value) || typeof value.unicode !== 'string') {
        return '';
    }

    return value.unicode;
};

const extractOperatorListText = async (page: PDFPageLike): Promise<string> => {
    const operatorList = await page.getOperatorList();
    const items: PositionedTextItem[] = [];
    let currentY = 0;
    let leading = 0;
    let order = 0;

    operatorList.fnArray.forEach((operation, index) => {
        const args = operatorList.argsArray[index];

        if (operation === OPS.setLeading && Array.isArray(args) && typeof args[0] === 'number') {
            leading = args[0];
            return;
        }

        if (operation === OPS.setTextMatrix && Array.isArray(args) && typeof args[5] === 'number') {
            currentY = Math.round(args[5]);
            return;
        }

        if (operation === OPS.moveText && Array.isArray(args) && typeof args[1] === 'number') {
            currentY = Math.round(currentY + args[1]);
            return;
        }

        if (operation === OPS.setLeadingMoveText && Array.isArray(args) && typeof args[1] === 'number') {
            leading = -args[1];
            currentY = Math.round(currentY + args[1]);
            return;
        }

        if (
            operation === OPS.nextLineShowText ||
            operation === OPS.nextLineSetSpacingShowText
        ) {
            currentY = Math.round(currentY - leading);
        }

        if (
            operation !== OPS.showText &&
            operation !== OPS.showSpacedText &&
            operation !== OPS.nextLineShowText &&
            operation !== OPS.nextLineSetSpacingShowText
        ) {
            return;
        }

        const text = extractGlyphText(args);
        if (text) {
            items.push({str: text, y: currentY, order});
            order++;
        }
    });

    return combinePositionedTextItems(items, '');
};

const extractTextFromPDFPage = async (page: PDFPageLike): Promise<string> => {
    const textContentText = await extractTextContentText(page);

    try {
        const operatorListText = await extractOperatorListText(page);
        if (
            countHiddenUnicodeChars(operatorListText) > countHiddenUnicodeChars(textContentText) ||
            (!hasDetectableContent(textContentText) && hasDetectableContent(operatorListText))
        ) {
            return operatorListText;
        }
    } catch (error) {
        console.warn('PDF operator-list extraction failed, falling back to text content:', error);
    }

    return textContentText;
};

/**
 * Extracts text content from a PDF file
 * @param file PDF file to process
 * @returns Raw extracted text content with preserved formatting
 * @throws Error with specific message for different failure scenarios
 */
export const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();

        if (arrayBuffer.byteLength === 0) {
            throw new Error('PDF file appears to be empty or corrupted');
        }

        const loadingTask = getDocument({data: arrayBuffer});
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;

        const pageTexts: string[] = [];

        // Process each page sequentially
        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const pageText = await extractTextFromPDFPage(page);
            if (pageText) {
                pageTexts.push(pageText);
            }
        }

        const result = pageTexts.join('\n\n');
        if (!hasDetectableContent(result)) {
            throw new Error('No readable text content found in this PDF. The file may contain only images or be password-protected.');
        }

        return result;
    } catch (error) {
        console.error('PDF extraction error:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to process PDF file. Please ensure the file is valid and not corrupted.');
    }
};

/**
 * Extracts text content from a DOCX file
 * @param file DOCX file to process
 * @returns Raw extracted text content with preserved formatting
 * @throws Error with specific message for different failure scenarios
 */
export const extractTextFromDOCX = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();

        if (arrayBuffer.byteLength === 0) {
            throw new Error('DOCX file appears to be empty or corrupted');
        }

        const result = await mammoth.extractRawText({arrayBuffer});

        if (!result.value.trim()) {
            throw new Error('No readable text content found in this DOCX file');
        }

        // Return the raw text exactly as mammoth extracts it
        return result.value;
    } catch (error) {
        console.error('DOCX extraction error:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to process DOCX file. Please ensure the file is valid and not password-protected.');
    }
};

/**
 * Extracts text content from a file based on its type
 * @param file File to extract text from (PDF, DOCX, or plain text)
 * @returns Raw extracted text content
 * @throws Error with specific message for different failure scenarios
 */
export const extractTextFromFile = async (file: File): Promise<string> => {
    if (!file || file.size === 0) {
        throw new Error('File is empty or invalid');
    }

    // Check file size (limit to 50MB)
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxFileSize) {
        throw new Error('File is too large. Please use files smaller than 50MB.');
    }

    const fileType = file.name.toLowerCase();

    try {
        if (fileType.endsWith('.pdf')) {
            return await extractTextFromPDF(file);
        } else if (fileType.endsWith('.docx')) {
            return await extractTextFromDOCX(file);
        } else {
            // Handle text files and attempt to read other file types as text
            try {
                const extractedText = await file.text();
                if (!extractedText.trim()) {
                    // Check if it's a known text file type for better error messaging
                    const isKnownTextType = fileType.endsWith('.txt') || fileType.endsWith('.md') ||
                        fileType.endsWith('.text') || fileType.endsWith('.markdown');

                    if (isKnownTextType) {
                        throw new Error('Text file appears to be empty');
                    } else {
                        throw new Error('No readable text content found');
                    }
                }
                return extractedText;
            } catch (error) {
                // If it's already an Error object, re-throw it (including our empty file errors)
                if (error instanceof Error) {
                    throw error;
                }
                // Only throw unsupported file type error for truly unreadable files
                throw new Error(`Unsupported file type: ${file.name.split('.').pop()?.toUpperCase() || 'unknown'}. Please use PDF, DOCX, TXT, or MD files.`);
            }
        }
    } catch (error) {
        console.error('File extraction error:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An unexpected error occurred while extracting text from the file');
    }
};
