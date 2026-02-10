import React, {memo, useEffect, useRef} from 'react';
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

    const [placeholder, setPlaceholder] = React.useState('Paste your text here or drag & drop any document');

    useEffect(() => {
        const updatePlaceholder = () => {
            const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
            setPlaceholder(isMobile ? 'Tap to enter text' : 'Paste your text here or drag & drop any document');
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
                    placeholder={placeholder}
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
                        className={`clean-button ${hiddenCharsCount > 0 ? 'active' : ''}`}
                        disabled={hiddenCharsCount === 0}
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