import {useCallback, useMemo, useState} from 'react';
import type {DragEvent} from 'react';
import type {MessageType} from '../types';
import {extractTextFromFile, FileReadError} from '../utils/fileExtraction';

/**
 * Loads text from dropped or selected files and tracks drag state for the drop zone. The text
 * goes to `onText`, and `showMessage` reports success or why a file could not be read.
 */
export const useFileExtraction = (
    onText: (text: string) => void,
    showMessage: (text: string, type: MessageType) => void
) => {
    const [isExtracting, setIsExtracting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const loadFile = useCallback(
        async (file: File) => {
            setIsExtracting(true);
            try {
                onText(await extractTextFromFile(file));
                showMessage(`Loaded "${file.name}".`, 'success');
            } catch (error) {
                if (error instanceof FileReadError) {
                    showMessage(error.message, 'error');
                } else {
                    console.error(error);
                    showMessage(`Could not read "${file.name}".`, 'error');
                }
            } finally {
                setIsExtracting(false);
            }
        },
        [onText, showMessage]
    );

    const dragHandlers = useMemo(
        () => ({
            onDragOver: (event: DragEvent<HTMLElement>) => {
                event.preventDefault();
                setIsDragging(true);
            },
            onDragLeave: (event: DragEvent<HTMLElement>) => {
                // Moving between child elements fires dragleave on the parent; ignore those.
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setIsDragging(false);
                }
            },
            onDrop: (event: DragEvent<HTMLElement>) => {
                event.preventDefault();
                setIsDragging(false);

                const [file] = Array.from(event.dataTransfer.files);
                if (file) {
                    void loadFile(file);
                    return;
                }

                const droppedText = event.dataTransfer.getData('text');
                if (droppedText) {
                    onText(droppedText);
                }
            }
        }),
        [loadFile, onText]
    );

    return {isExtracting, isDragging, dragHandlers, loadFile};
};
