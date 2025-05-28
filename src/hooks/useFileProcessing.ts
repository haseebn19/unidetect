import {useState, useCallback} from 'react';
import {processFile} from '../utils/fileProcessing';
import {MessageType} from '../types';

/**
 * Result type for the file processing hook
 */
interface UseFileProcessingResult {
    isProcessing: boolean;
    isDragging: boolean;
    statusMessage: string;
    messageType: MessageType;
    handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    handleDrop: (e: React.DragEvent<HTMLDivElement>, onSuccess: (text: string) => void) => void;
    processUploadedFile: (file: File, onSuccess: (text: string) => void) => Promise<void>;
}

/**
 * Hook for handling file uploads and drag-and-drop functionality
 * @returns Object containing file processing state and handlers
 */
export const useFileProcessing = (): UseFileProcessingResult => {
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<MessageType>('info');

    /**
     * Handles drag over event
     */
    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    /**
     * Handles drag leave event
     */
    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    /**
     * Processes an uploaded file and handles success/error states
     */
    const processUploadedFile = async (file: File, onSuccess: (text: string) => void) => {
        setIsProcessing(true);
        try {
            const extractedText = await processFile(file);
            onSuccess(extractedText);
            setMessageType('success');
            setStatusMessage(`File "${file.name}" loaded successfully`);
        } catch (error) {
            console.error('Error processing file:', error);
            setMessageType('error');
            setStatusMessage(`Could not extract text from "${file.name}". Try copying the text directly.`);
        } finally {
            setIsProcessing(false);
            setTimeout(() => {
                setStatusMessage('');
            }, 3000);
        }
    };

    /**
     * Handles file and text drop events
     */
    const handleDrop = useCallback((
        e: React.DragEvent<HTMLDivElement>,
        onSuccess: (text: string) => void
    ) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        // Check for files first
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            processUploadedFile(files[0], onSuccess);
            return;
        }

        // If no files, check for text content
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
        isProcessing,
        isDragging,
        statusMessage,
        messageType,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        processUploadedFile
    };
}; 