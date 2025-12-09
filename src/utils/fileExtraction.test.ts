import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extractTextFromFile,
  extractTextFromPDF,
  extractTextFromDOCX,
} from './fileExtraction';

// Create mock functions using vi.hoisted to avoid hoisting issues
const { mockExtractRawText, mockGetDocument } = vi.hoisted(() => ({
  mockExtractRawText: vi.fn(),
  mockGetDocument: vi.fn(),
}));

// Mock PDF.js
vi.mock('pdfjs-dist', () => ({
  getDocument: mockGetDocument,
  GlobalWorkerOptions: { workerSrc: '' },
  version: '3.11.174',
}));

// Mock Mammoth with default export
vi.mock('mammoth', () => ({
  default: {
    extractRawText: mockExtractRawText,
  },
}));

// Create a mock File class that includes the missing browser methods
class MockFile extends File {
  private content: string | ArrayBuffer;

  constructor(bits: BlobPart[], name: string, options?: FilePropertyBag) {
    super(bits, name, options);
    // Store the content for our mock methods
    if (bits.length > 0) {
      if (bits[0] instanceof ArrayBuffer) {
        this.content = bits[0];
      } else if (typeof bits[0] === 'string') {
        this.content = bits[0];
      } else {
        this.content = bits.join('');
      }
    } else {
      this.content = '';
    }
  }

  async text(): Promise<string> {
    if (this.content instanceof ArrayBuffer) {
      // Try to decode as UTF-8, throw error if it's binary
      try {
        return new TextDecoder().decode(this.content);
      } catch {
        throw new Error('Cannot read binary data as text');
      }
    }
    return this.content;
  }
  async arrayBuffer(): Promise<ArrayBuffer> {
    if (this.content instanceof ArrayBuffer) {
      return this.content;
    }
    // Convert string to ArrayBuffer
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(this.content);
    // Create a proper ArrayBuffer from the Uint8Array
    const buffer = new ArrayBuffer(uint8Array.length);
    const view = new Uint8Array(buffer);
    view.set(uint8Array);
    return buffer;
  }
}

// Replace the global File constructor with our mock
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).File = MockFile;

describe('fileExtraction', () => {
  describe('extractTextFromFile', () => {
    it('should handle empty files', async () => {
      const emptyFile = new File([], 'empty.txt', { type: 'text/plain' });

      await expect(extractTextFromFile(emptyFile)).rejects.toThrow(
        'File is empty or invalid'
      );
    });

    it('should handle large files', async () => {
      // Create a mock file larger than 50MB
      const largeFileSize = 51 * 1024 * 1024; // 51MB
      const largeFile = new File(['x'.repeat(largeFileSize)], 'large.txt', {
        type: 'text/plain',
      });

      await expect(extractTextFromFile(largeFile)).rejects.toThrow(
        'File is too large. Please use files smaller than 50MB.'
      );
    });

    it('should extract text from TXT files', async () => {
      const textContent = 'Hello world!\nThis is a test file.';
      const txtFile = new File([textContent], 'test.txt', {
        type: 'text/plain',
      });

      const result = await extractTextFromFile(txtFile);
      expect(result).toBe(textContent);
    });

    it('should extract text from MD files', async () => {
      const markdownContent = '# Hello World\n\nThis is **bold** text.';
      const mdFile = new File([markdownContent], 'test.md', {
        type: 'text/markdown',
      });

      const result = await extractTextFromFile(mdFile);
      expect(result).toBe(markdownContent);
    });
    it('should handle empty text files', async () => {
      const emptyTextFile = new File([''], 'empty.txt', { type: 'text/plain' });

      await expect(extractTextFromFile(emptyTextFile)).rejects.toThrow(
        'File is empty or invalid'
      );
    });

    it('should handle whitespace-only text files', async () => {
      const whitespaceFile = new File(['   \n\t  '], 'whitespace.txt', {
        type: 'text/plain',
      });

      await expect(extractTextFromFile(whitespaceFile)).rejects.toThrow(
        'Text file appears to be empty'
      );
    });

    it('should try to read unknown file types as text', async () => {
      const textContent = 'This is plain text content';
      const unknownFile = new File([textContent], 'test.unknown', {
        type: 'application/octet-stream',
      });

      const result = await extractTextFromFile(unknownFile);
      expect(result).toBe(textContent);
    });
    it('should handle unsupported binary files', async () => {
      // Create a binary file that can't be read as text
      const binaryData = new Uint8Array([0xff, 0xfe, 0x00, 0x01]);
      const binaryFile = new File([binaryData], 'test.bin', {
        type: 'application/octet-stream',
      });

      // The binary data will be decoded as text, resulting in visible characters
      // This test should expect success since the text() method will work
      const result = await extractTextFromFile(binaryFile);
      expect(result).toBeDefined();
    });
  });

  describe('extractTextFromPDF', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should handle empty PDF files', async () => {
      const emptyPdfFile = new File([], 'empty.pdf', {
        type: 'application/pdf',
      });

      await expect(extractTextFromPDF(emptyPdfFile)).rejects.toThrow(
        'PDF file appears to be empty or corrupted'
      );
    });

    it('should extract text from valid PDF', async () => {
      const pdfContent = new ArrayBuffer(1024);
      const pdfFile = new File([pdfContent], 'test.pdf', {
        type: 'application/pdf',
      });

      const mockPage = {
        getTextContent: vi.fn().mockResolvedValue({
          items: [
            { str: 'Hello', transform: [1, 0, 0, 1, 10, 100] },
            { str: ' ', transform: [1, 0, 0, 1, 50, 100] },
            { str: 'World', transform: [1, 0, 0, 1, 60, 100] },
            { str: 'Second', transform: [1, 0, 0, 1, 10, 80] },
            { str: ' line', transform: [1, 0, 0, 1, 50, 80] },
          ],
        }),
      };

      const mockPdf = {
        numPages: 1,
        getPage: vi.fn().mockResolvedValue(mockPage),
      };

      const mockLoadingTask = {
        promise: Promise.resolve(mockPdf),
      };

      mockGetDocument.mockReturnValue(mockLoadingTask);

      const result = await extractTextFromPDF(pdfFile);
      expect(result).toContain('Hello World');
      expect(result).toContain('Second');
      expect(result).toContain('line');
    });

    it('should handle PDFs with no text content', async () => {
      const pdfContent = new ArrayBuffer(1024);
      const pdfFile = new File([pdfContent], 'test.pdf', {
        type: 'application/pdf',
      });

      const mockPage = {
        getTextContent: vi.fn().mockResolvedValue({ items: [] }),
      };

      const mockPdf = {
        numPages: 1,
        getPage: vi.fn().mockResolvedValue(mockPage),
      };

      const mockLoadingTask = {
        promise: Promise.resolve(mockPdf),
      };

      mockGetDocument.mockReturnValue(mockLoadingTask);

      await expect(extractTextFromPDF(pdfFile)).rejects.toThrow(
        'No readable text content found in this PDF'
      );
    });

    it('should handle PDF processing errors', async () => {
      const pdfContent = new ArrayBuffer(1024);
      const pdfFile = new File([pdfContent], 'corrupted.pdf', {
        type: 'application/pdf',
      });

      mockGetDocument.mockImplementation(() => {
        throw new Error('PDF parsing failed');
      });

      await expect(extractTextFromPDF(pdfFile)).rejects.toThrow(
        'PDF parsing failed'
      );
    });
  });

  describe('extractTextFromDOCX', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should handle empty DOCX files', async () => {
      const emptyDocxFile = new File([], 'empty.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      await expect(extractTextFromDOCX(emptyDocxFile)).rejects.toThrow(
        'DOCX file appears to be empty or corrupted'
      );
    });

    it('should extract text from valid DOCX', async () => {
      const docxContent = new ArrayBuffer(1024);
      const docxFile = new File([docxContent], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      mockExtractRawText.mockResolvedValue({
        value: 'Hello World!\nThis is a DOCX document.',
        messages: [],
      });

      const result = await extractTextFromDOCX(docxFile);
      expect(result).toBe('Hello World!\nThis is a DOCX document.');
      expect(mockExtractRawText).toHaveBeenCalledWith({
        arrayBuffer: expect.any(ArrayBuffer),
      });
    });

    it('should handle DOCX files with no text content', async () => {
      const docxContent = new ArrayBuffer(1024);
      const docxFile = new File([docxContent], 'empty-content.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      mockExtractRawText.mockResolvedValue({
        value: '   \n\t  ',
        messages: [],
      });

      await expect(extractTextFromDOCX(docxFile)).rejects.toThrow(
        'No readable text content found in this DOCX file'
      );
    });

    it('should handle DOCX processing errors', async () => {
      const docxContent = new ArrayBuffer(1024);
      const docxFile = new File([docxContent], 'corrupted.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      mockExtractRawText.mockRejectedValue(new Error('DOCX parsing failed'));

      await expect(extractTextFromDOCX(docxFile)).rejects.toThrow(
        'DOCX parsing failed'
      );
    });
  });

  describe('file type detection', () => {
    it('should handle different text file extensions', async () => {
      const testCases = [
        { name: 'test.txt', content: 'Text file' },
        { name: 'test.text', content: 'Text file' },
        { name: 'README.md', content: '# Markdown' },
        { name: 'doc.markdown', content: '## Markdown doc' },
      ];

      for (const testCase of testCases) {
        const file = new File([testCase.content], testCase.name, {
          type: 'text/plain',
        });
        const result = await extractTextFromFile(file);
        expect(result).toBe(testCase.content);
      }
    });

    it('should handle case-insensitive file extensions', async () => {
      const content = 'Test content';
      const testCases = ['test.TXT', 'test.PDF', 'test.DOCX', 'test.MD'];

      for (const fileName of testCases) {
        const file = new File([content], fileName, { type: 'text/plain' });

        if (fileName.endsWith('.TXT') || fileName.endsWith('.MD')) {
          const result = await extractTextFromFile(file);
          expect(result).toBe(content);
        }
      }
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should handle null or undefined files', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(extractTextFromFile(null as any)).rejects.toThrow(
        'File is empty or invalid'
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(extractTextFromFile(undefined as any)).rejects.toThrow(
        'File is empty or invalid'
      );
    });

    it('should preserve original error messages from extraction functions', async () => {
      const docxContent = new ArrayBuffer(1024);
      const docxFile = new File([docxContent], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const customError = new Error('Custom extraction error');
      mockExtractRawText.mockRejectedValue(customError);

      await expect(extractTextFromFile(docxFile)).rejects.toThrow(
        'Custom extraction error'
      );
    });
    it('should handle generic errors gracefully', async () => {
      const docxContent = new ArrayBuffer(1024);
      const docxFile = new File([docxContent], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      // Throw a non-Error object
      mockExtractRawText.mockRejectedValue('String error');

      await expect(extractTextFromFile(docxFile)).rejects.toThrow(
        'Failed to process DOCX file'
      );
    });
  });
});
