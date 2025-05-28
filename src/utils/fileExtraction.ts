import mammoth from 'mammoth';
import {getDocument, GlobalWorkerOptions, version} from 'pdfjs-dist';

// Configure PDF.js worker
GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;

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

        const result = fullText.trim();
        if (!result) {
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

    const fileType = file.name.toLowerCase(); try {
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
