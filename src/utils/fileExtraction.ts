import {countHiddenChars} from './unicodeHelpers';

type PdfJs = typeof import('pdfjs-dist');

const MAX_FILE_SIZE = 50 * 1024 * 1024;
// A vertical gap between lines larger than this, in PDF units, starts a new paragraph
const PARAGRAPH_GAP = 15;

/** An error whose message tells the user why their file could not be read. */
export class FileReadError extends Error {}

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

/** Import a file parser the first time it is needed, so text files never download one. */
const loadParser = async <T>(load: () => Promise<T>, name: string): Promise<T> => {
    try {
        return await load();
    } catch {
        throw new FileReadError(`Could not load the ${name} reader. Check your connection and try again.`);
    }
};

const loadPdfJs = async (): Promise<PdfJs> => {
    const [pdfjs, worker] = await Promise.all([
        import('pdfjs-dist'),
        import('pdfjs-dist/build/pdf.worker.min.mjs?url')
    ]);
    // The worker is bundled with the app so PDFs are parsed without loading code from a CDN
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    return pdfjs;
};

const isPDFTextItem = (item: unknown): item is PDFTextItemLike =>
    typeof item === 'object' && item !== null && 'str' in item && typeof (item as PDFTextItemLike).str === 'string';

const isPDFGlyph = (value: unknown): value is PDFGlyphLike =>
    typeof value === 'object' && value !== null && 'unicode' in value;

// Unusual whitespace such as no-break spaces counts as hidden, so it is content here
const hasDetectableContent = (text: string): boolean => text.trim().length > 0 || countHiddenChars(text) > 0;

// Only regular spaces and tabs are trimmed. String.trim would also strip the unusual spaces this app looks for.
const isSpaceOrTab = (char: string): boolean => char === ' ' || char === '\t';

const trimSpaces = (line: string): string => {
    let start = 0;
    let end = line.length;
    while (start < end && isSpaceOrTab(line[start])) start++;
    while (end > start && isSpaceOrTab(line[end - 1])) end--;
    return line.slice(start, end);
};

const combinePositionedTextItems = (items: PositionedTextItem[], itemJoiner: string): string => {
    const lines: Record<number, {parts: string[]; firstOrder: number}> = {};

    items.forEach((item) => {
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

    sortedYPositions.forEach((y) => {
        const line = trimSpaces(lines[y].parts.join(itemJoiner));
        if (line) {
            if (lastY !== null && Math.abs(y - lastY) > PARAGRAPH_GAP) {
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
        if (!isPDFTextItem(item) || !hasDetectableContent(item.str)) {
            return;
        }

        const y =
            Array.isArray(item.transform) && typeof item.transform[5] === 'number' ? Math.round(item.transform[5]) : 0;

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

const extractOperatorListText = async (page: PDFPageLike, OPS: PdfJs['OPS']): Promise<string> => {
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

        if (operation === OPS.nextLineShowText || operation === OPS.nextLineSetSpacingShowText) {
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

const extractTextFromPDFPage = async (page: PDFPageLike, OPS: PdfJs['OPS']): Promise<string> => {
    const textContentText = await extractTextContentText(page);

    try {
        const operatorListText = await extractOperatorListText(page, OPS);
        if (
            countHiddenChars(operatorListText) > countHiddenChars(textContentText) ||
            (!hasDetectableContent(textContentText) && hasDetectableContent(operatorListText))
        ) {
            return operatorListText;
        }
    } catch (error) {
        console.warn('PDF operator list extraction failed; using text content instead.', error);
    }

    return textContentText;
};

/** Extracts the text of every page of a PDF, keeping its line and paragraph breaks. */
const extractTextFromPDF = async (file: File): Promise<string> => {
    const {getDocument, OPS} = await loadParser(loadPdfJs, 'PDF');
    const pdf = await getDocument({data: await file.arrayBuffer()}).promise.catch(() => {
        throw new FileReadError('Could not open this PDF. It may be damaged or password-protected.');
    });

    const pageTexts: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const pageText = await extractTextFromPDFPage(await pdf.getPage(pageNumber), OPS);
        if (pageText) {
            pageTexts.push(pageText);
        }
    }

    const text = pageTexts.join('\n\n');
    if (!hasDetectableContent(text)) {
        throw new FileReadError('No text found in this PDF. It may contain only images.');
    }
    return text;
};

/** Extracts the text of a DOCX file, keeping its paragraph breaks. */
const extractTextFromDOCX = async (file: File): Promise<string> => {
    const {default: mammoth} = await loadParser(() => import('mammoth'), 'DOCX');
    const {value: text} = await mammoth.extractRawText({arrayBuffer: await file.arrayBuffer()}).catch(() => {
        throw new FileReadError('Could not open this DOCX file. It may be damaged or password-protected.');
    });

    if (!hasDetectableContent(text)) {
        throw new FileReadError('No text found in this DOCX file.');
    }
    return text;
};

const extractTextFromPlainFile = async (file: File): Promise<string> => {
    const text = await file.text();

    // Text files do not contain null bytes, so a file that does is binary
    if (text.includes('\u0000')) {
        throw new FileReadError('This file type is not supported. Open a PDF, DOCX, TXT, or MD file.');
    }
    if (!hasDetectableContent(text)) {
        throw new FileReadError('This file contains only spaces and line breaks.');
    }
    return text;
};

/**
 * Extracts the text of a PDF, DOCX, or plain text file. Throws a FileReadError when the file
 * cannot be used.
 */
export const extractTextFromFile = async (file: File): Promise<string> => {
    if (file.size === 0) {
        throw new FileReadError('This file is empty.');
    }
    if (file.size > MAX_FILE_SIZE) {
        throw new FileReadError('This file is too large. Open a file smaller than 50 MB.');
    }

    const name = file.name.toLowerCase();
    if (name.endsWith('.pdf')) {
        return extractTextFromPDF(file);
    }
    if (name.endsWith('.docx')) {
        return extractTextFromDOCX(file);
    }
    return extractTextFromPlainFile(file);
};
