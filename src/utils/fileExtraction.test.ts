import {beforeEach, describe, expect, it, vi} from 'vitest';
import {extractTextFromFile, FileReadError} from './fileExtraction';

const {mockExtractRawText, mockGetDocument} = vi.hoisted(() => ({
    mockExtractRawText: vi.fn(),
    mockGetDocument: vi.fn()
}));

// Operator codes from pdf.js, used by the operator list extraction
const OPS = {
    setLeading: 36,
    setTextMatrix: 42,
    moveText: 40,
    setLeadingMoveText: 41,
    showText: 44,
    showSpacedText: 45,
    nextLineShowText: 46,
    nextLineSetSpacingShowText: 47
};

vi.mock('pdfjs-dist', () => ({getDocument: mockGetDocument, GlobalWorkerOptions: {workerSrc: ''}, OPS}));
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({default: '/pdf.worker.min.mjs'}));
vi.mock('mammoth', () => ({default: {extractRawText: mockExtractRawText}}));

const fileNamed = (name: string, content: BlobPart = 'content') => new File([content], name);

// A one-page PDF whose text content API returns `items` and whose operator list is `operators`
function mockPdf(
    items: {str: string; transform: number[]}[],
    operators = {fnArray: [] as number[], argsArray: [] as unknown[]}
) {
    const page = {
        getTextContent: vi.fn().mockResolvedValue({items}),
        getOperatorList: vi.fn().mockResolvedValue(operators)
    };
    mockGetDocument.mockReturnValue({
        promise: Promise.resolve({numPages: 1, getPage: vi.fn().mockResolvedValue(page)})
    });
}

const at = (y: number) => [1, 0, 0, 1, 10, y];

beforeEach(() => {
    vi.clearAllMocks();
});

describe('extractTextFromFile', () => {
    it('reads text and Markdown files as they are', async () => {
        for (const name of ['notes.txt', 'notes.text', 'README.md', 'guide.markdown', 'NOTES.TXT', 'notes.log']) {
            await expect(extractTextFromFile(fileNamed(name, '# Title\n\nBody'))).resolves.toBe('# Title\n\nBody');
        }
    });

    it('rejects empty and oversized files', async () => {
        await expect(extractTextFromFile(fileNamed('empty.txt', ''))).rejects.toThrow('This file is empty.');

        const large = fileNamed('large.txt');
        Object.defineProperty(large, 'size', {value: 51 * 1024 * 1024});
        await expect(extractTextFromFile(large)).rejects.toThrow('smaller than 50 MB');
    });

    it('rejects binary files', async () => {
        const binary = fileNamed('photo.bin', new Uint8Array([0xff, 0xfe, 0x00, 0x01]));
        await expect(extractTextFromFile(binary)).rejects.toThrow('This file type is not supported.');
    });

    it('rejects files with only regular whitespace, but keeps unusual spaces', async () => {
        await expect(extractTextFromFile(fileNamed('blank.txt', '   \n\t  '))).rejects.toThrow(
            'only spaces and line breaks'
        );
        await expect(extractTextFromFile(fileNamed('nbsp.txt', '\u00A0'))).resolves.toBe('\u00A0');
    });

    it('reports problems with a FileReadError', async () => {
        await expect(extractTextFromFile(fileNamed('empty.txt', ''))).rejects.toBeInstanceOf(FileReadError);
    });
});

describe('PDF files', () => {
    it('joins items on the same line and separates lines and paragraphs', async () => {
        mockPdf([
            {str: 'Hello', transform: at(100)},
            {str: ' ', transform: at(100)},
            {str: 'World', transform: at(100)},
            {str: 'Next line', transform: at(88)},
            {str: 'New paragraph', transform: at(60)}
        ]);

        await expect(extractTextFromFile(fileNamed('doc.pdf'))).resolves.toBe(
            'Hello World\nNext line\n\nNew paragraph'
        );
    });

    it('keeps unusual spaces at the start and end of a line', async () => {
        mockPdf([{str: '\u00A0Total\u3000 ', transform: at(100)}]);

        await expect(extractTextFromFile(fileNamed('doc.pdf'))).resolves.toBe('\u00A0Total\u3000');
    });

    it('uses the glyph text when the text content API drops hidden characters', async () => {
        const hiddenText = 'Invoice INV\u200B-2026-001';
        mockPdf([{str: 'Invoice INV-2026-001', transform: at(100)}], {
            fnArray: [OPS.setTextMatrix, OPS.showText],
            argsArray: [at(100), [[...hiddenText].map((unicode) => ({unicode}))]]
        });

        await expect(extractTextFromFile(fileNamed('invoice.pdf'))).resolves.toBe(hiddenText);
    });

    it('explains PDFs without text and PDFs that cannot be opened', async () => {
        mockPdf([]);
        await expect(extractTextFromFile(fileNamed('scan.pdf'))).rejects.toThrow('No text found in this PDF.');

        mockGetDocument.mockReturnValue({promise: Promise.reject(new Error('Invalid PDF structure.'))});
        await expect(extractTextFromFile(fileNamed('broken.pdf'))).rejects.toThrow(
            'Could not open this PDF. It may be damaged or password-protected.'
        );
    });
});

describe('DOCX files', () => {
    it('returns the document text', async () => {
        mockExtractRawText.mockResolvedValue({value: 'Hello World!\nThis is a DOCX document.', messages: []});

        await expect(extractTextFromFile(fileNamed('letter.DOCX'))).resolves.toBe(
            'Hello World!\nThis is a DOCX document.'
        );
        expect(mockExtractRawText).toHaveBeenCalledWith({arrayBuffer: expect.any(ArrayBuffer)});
    });

    it('explains documents without text and documents that cannot be opened', async () => {
        mockExtractRawText.mockResolvedValue({value: '   \n\t  ', messages: []});
        await expect(extractTextFromFile(fileNamed('blank.docx'))).rejects.toThrow('No text found in this DOCX file.');

        mockExtractRawText.mockRejectedValue(new Error("Can't find end of central directory"));
        await expect(extractTextFromFile(fileNamed('broken.docx'))).rejects.toThrow(
            'Could not open this DOCX file. It may be damaged or password-protected.'
        );
    });
});
