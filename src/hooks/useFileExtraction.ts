import {useState, useCallback} from 'react';
import {extractTextFromFile} from '../utils/fileExtraction';
import {MessageType} from '../types';

/**
 * Result type for the file extraction hook
 */
interface UseFileExtractionResult {
    isExtracting: boolean;
    isDragging: boolean;
    statusMessage: string;
    messageType: MessageType;
    handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    handleDrop: (e: React.DragEvent<HTMLDivElement>, onSuccess: (text: string) => void) => void;
    extractFromFile: (file: File, onSuccess: (text: string) => void) => Promise<void>;
}

/**
 * Hook for handling file text extraction and drag-and-drop functionality
 * @returns Object containing file extraction state and handlers
 */
export const useFileExtraction = (): UseFileExtractionResult => {
    const [isExtracting, setIsExtracting] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<MessageType>('info');

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const extractFromFile = async (file: File, onSuccess: (text: string) => void) => {
        setIsExtracting(true);
        try {
            const extractedText = await extractTextFromFile(file);
            onSuccess(extractedText);
            setMessageType('success');
            setStatusMessage(`File "${file.name}" loaded successfully`);
        } catch (error) {
            console.error('Error extracting text from file:', error);
            setMessageType('error');
            setStatusMessage(`Could not extract text from "${file.name}". Try copying the text directly.`);
        } finally {
            setIsExtracting(false);
            setTimeout(() => {
                setStatusMessage('');
            }, 3000);
        }
    };

    const handleDrop = useCallback((
        e: React.DragEvent<HTMLDivElement>,
        onSuccess: (text: string) => void
    ) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            extractFromFile(files[0], onSuccess);
            return;
        }

        const text = e.dataTransfer.getData('text');
        if (text) {
            onSuccess(text);
            setMessageType('success');
            setStatusMessage('Text dropped successfully');
            setTimeout(() => {
                setStatusMessage('');
            }, 3000);
        }
    }, []);

    return {
        isExtracting,
        isDragging,
        statusMessage,
        messageType,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        extractFromFile
    };
};
