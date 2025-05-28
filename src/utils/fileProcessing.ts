import mammoth from 'mammoth';
import {getDocument, GlobalWorkerOptions, version} from 'pdfjs-dist';
import {normalizeText} from './textNormalization';

// Configure PDF.js worker
GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;

/**
 * Extracts text content from a PDF file
 * @param file PDF file to process
 * @returns Extracted text content with preserved formatting
 */
export const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = getDocument({data: arrayBuffer});
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;

        let fullText = '';

        // Process each page sequentially
        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();

            // Group items by their vertical position to detect paragraphs
            const lines: {[y: number]: string[]} = {};
            content.items.forEach(item => {
                if ('str' in item && item.str.trim()) {
                    // Round the y position to handle slight variations
                    const y = Math.round(item.transform[5]);
                    if (!lines[y]) lines[y] = [];
                    lines[y].push(item.str);
                }
            });

            // Convert grouped items to text with proper line breaks
            // Sort in descending order since PDF coordinates start from bottom
            const sortedYPositions = Object.keys(lines)
                .map(Number)
                .sort((a, b) => b - a);

            let pageText = '';
            let lastY: number | null = null;

            sortedYPositions.forEach(y => {
                const line = lines[y].join(' ').trim();
                if (line) {
                    if (lastY !== null && Math.abs(y - lastY) > 15) {
                        // Add double line break for paragraph separation
                        pageText += '\n\n';
                    } else if (lastY !== null) {
                        // Add single line break for line separation
                        pageText += '\n';
                    }
                    pageText += line;
                    lastY = y;
                }
            });

            fullText += pageText + '\n\n';
        }

        return fullText.trim();
    } catch (error) {
        console.error('PDF extraction error:', error);
        throw error;
    }
};

/**
 * Extracts text content from a DOCX file
 * @param file DOCX file to process
 * @returns Extracted text content with preserved formatting
 */
export const extractTextFromDOCX = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({arrayBuffer});
        return result.value;
    } catch (error) {
        console.error('DOCX extraction error:', error);
        throw error;
    }
};

/**
 * Processes a file to extract its text content
 * @param file File to process (PDF, DOCX, or plain text)
 * @returns Normalized text content with preserved formatting
 * @throws Error if text extraction fails
 */
export const processFile = async (file: File): Promise<string> => {
    let extractedText = '';
    const fileType = file.name.toLowerCase();

    try {
        if (fileType.endsWith('.pdf')) {
            extractedText = await extractTextFromPDF(file);
        } else if (fileType.endsWith('.docx')) {
            extractedText = await extractTextFromDOCX(file);
        } else {
            extractedText = await file.text();
        }

        if (!extractedText.trim()) {
            throw new Error('No text content found in file');
        }

        return normalizeText(extractedText);
    } catch (error) {
        console.error('File processing error:', error);
        throw error;
    }
}; 