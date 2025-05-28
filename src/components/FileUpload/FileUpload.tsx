import React, {useCallback} from 'react';
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
export const FileUpload: React.FC<FileUploadProps> = ({
    text,
    isProcessing,
    isDragging,
    statusMessage,
    messageType,
    hiddenCharsCount,
    onTextChange,
    onDragOver,
    onDragLeave,
    onDrop,
    onCleanText
}) => {
    /**
     * Handles paste events to preserve original text formatting
     */
    const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        e.preventDefault();
        const text = await navigator.clipboard.readText();
        onTextChange(text);
    }, [onTextChange]);

    return (
        <div className="textarea-wrapper">
            <div
                className={`textarea-container ${isDragging ? 'dragging' : ''} ${isProcessing ? 'processing' : ''}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                <textarea
                    value={text}
                    onChange={(e) => onTextChange(e.target.value)}
                    onPaste={handlePaste}
                    placeholder="Paste your text here or drag & drop any document"
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
                    <span className={`message ${messageType}`}>
                        {statusMessage}
                    </span>
                )}
            </div>
        </div>
    );
}; 