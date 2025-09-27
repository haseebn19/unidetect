import React, {useCallback, memo, useEffect, useRef} from 'react';
import {MessageType} from '../../types';
import './FileUpload.css';

/**
 * Props interface for the FileUpload component
 */
interface FileUploadProps {
    text: string;
    isProcessing: boolean;
    isDragging: boolean;
    statusMessage: string;
    messageType: MessageType;
    hiddenCharsCount: number;
    isMessageFadingOut?: boolean;
    onTextChange: (text: string) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    onCleanText: () => void;
}

/**
 * Component for text input and file upload handling
 * Supports direct text input, paste operations, and file drag-and-drop
 */
const FileUploadComponent: React.FC<FileUploadProps> = ({
    text,
    isProcessing,
    isDragging,
    statusMessage,
    messageType,
    hiddenCharsCount,
    isMessageFadingOut = false,
    onTextChange,
    onDragOver,
    onDragLeave,
    onDrop,
    onCleanText
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    /**
     * Handles paste events to preserve original text formatting
     */
    const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        e.preventDefault();
        const text = await navigator.clipboard.readText();
        onTextChange(text);
    }, [onTextChange]);

    /**
     * Update the textarea placeholder based on device type
     */
    useEffect(() => {
        const updatePlaceholder = () => {
            if (!textareaRef.current) return;

            const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
            const mobilePlaceholder = textareaRef.current.getAttribute('data-mobile-placeholder');
            const desktopPlaceholder = textareaRef.current.getAttribute('data-desktop-placeholder');

            if (isMobile && mobilePlaceholder) {
                textareaRef.current.placeholder = mobilePlaceholder;
            } else if (desktopPlaceholder) {
                textareaRef.current.placeholder = desktopPlaceholder;
            }
        };

        updatePlaceholder();
        window.addEventListener('resize', updatePlaceholder);

        return () => {
            window.removeEventListener('resize', updatePlaceholder);
        };
    }, []);

    return (
        <div className="textarea-wrapper">
            <div
                className={`textarea-container ${isDragging ? 'dragging' : ''} ${isProcessing ? 'processing' : ''}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => onTextChange(e.target.value)}
                    onPaste={handlePaste}
                    placeholder="Paste text or tap to type"
                    data-mobile-placeholder="Tap to enter text"
                    data-desktop-placeholder="Paste your text here or drag & drop any document"
                    autoCapitalize="off"
                    autoComplete="off"
                    spellCheck="false"
                />
                {isDragging && (
                    <div className="drag-overlay">
                        <span>Drop document here</span>
                    </div>
                )}
                {isProcessing && (
                    <div className="processing-overlay">
                        <span>Processing document...</span>
                    </div>
                )}
            </div>
            <div className="actions-container">
                <div className="clean-options">
                    <button
                        onClick={onCleanText}
                        className="clean-button active"
                    >
                        Clean Text
                    </button>
                </div>
                {statusMessage && (
                    <span className={`message ${messageType} ${isMessageFadingOut ? 'fade-out' : ''}`}>
                        {statusMessage}
                    </span>
                )}
            </div>
        </div>
    );
};

export const FileUpload = memo(FileUploadComponent);