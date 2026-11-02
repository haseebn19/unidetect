import {act, renderHook} from '@testing-library/react';
import type {DragEvent} from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {extractTextFromFile, FileReadError} from '../utils/fileExtraction';
import {useFileExtraction} from './useFileExtraction';

vi.mock('../utils/fileExtraction', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../utils/fileExtraction')>()),
    extractTextFromFile: vi.fn()
}));

const onText = vi.fn();
const showMessage = vi.fn();
const file = new File(['text'], 'notes.txt');

const renderExtraction = () => renderHook(() => useFileExtraction(onText, showMessage)).result;

// A drop event carrying either files or plain text
const dropEvent = (data: {files?: File[]; text?: string}) =>
    ({
        preventDefault: vi.fn(),
        dataTransfer: {files: data.files ?? [], getData: () => data.text ?? ''}
    }) as unknown as DragEvent<HTMLElement>;

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useFileExtraction', () => {
    it('passes the extracted text on and reports the loaded file', async () => {
        vi.mocked(extractTextFromFile).mockResolvedValue('file text');
        const result = renderExtraction();

        await act(() => result.current.loadFile(file));

        expect(onText).toHaveBeenCalledWith('file text');
        expect(showMessage).toHaveBeenCalledWith('Loaded "notes.txt".', 'success');
        expect(result.current.isExtracting).toBe(false);
    });

    it('shows the reason a file could not be read', async () => {
        vi.mocked(extractTextFromFile).mockRejectedValue(new FileReadError('This file is empty.'));
        const result = renderExtraction();

        await act(() => result.current.loadFile(file));

        expect(onText).not.toHaveBeenCalled();
        expect(showMessage).toHaveBeenCalledWith('This file is empty.', 'error');
    });

    it('shows a general message for unexpected errors', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.mocked(extractTextFromFile).mockRejectedValue(new Error('NotReadableError'));
        const result = renderExtraction();

        await act(() => result.current.loadFile(file));

        expect(showMessage).toHaveBeenCalledWith('Could not read "notes.txt".', 'error');
    });

    it('loads a dropped file, or uses dropped text directly', async () => {
        vi.mocked(extractTextFromFile).mockResolvedValue('file text');
        const result = renderExtraction();

        await act(async () => result.current.dragHandlers.onDrop(dropEvent({files: [file]})));
        expect(extractTextFromFile).toHaveBeenCalledWith(file);

        act(() => result.current.dragHandlers.onDrop(dropEvent({text: 'dropped text'})));
        expect(onText).toHaveBeenLastCalledWith('dropped text');
    });

    it('tracks whether something is being dragged over the drop zone', () => {
        const result = renderExtraction();
        const zone = document.createElement('div');
        const child = zone.appendChild(document.createElement('span'));
        const dragEvent = (relatedTarget: Node | null) =>
            ({preventDefault: vi.fn(), currentTarget: zone, relatedTarget}) as unknown as DragEvent<HTMLElement>;

        act(() => result.current.dragHandlers.onDragOver(dragEvent(null)));
        expect(result.current.isDragging).toBe(true);

        act(() => result.current.dragHandlers.onDragLeave(dragEvent(child)));
        expect(result.current.isDragging).toBe(true);

        act(() => result.current.dragHandlers.onDragLeave(dragEvent(null)));
        expect(result.current.isDragging).toBe(false);
    });
});
