import {useRef} from 'react';
import type {DragEvent} from 'react';
import type {StatusMessage} from '../../hooks/useStatusMessage';
import './TextInput.css';

const ACCEPTED_FILES = '.pdf,.docx,.txt,.text,.md,.markdown,text/plain,text/markdown';

interface TextInputProps {
    text: string;
    onTextChange: (text: string) => void;
    onOpenFile: (file: File) => void;
    onClean: () => void;
    canClean: boolean;
    isDragging: boolean;
    isProcessing: boolean;
    message: StatusMessage | null;
    dragHandlers: {
        onDragOver: (event: DragEvent<HTMLElement>) => void;
        onDragLeave: (event: DragEvent<HTMLElement>) => void;
        onDrop: (event: DragEvent<HTMLElement>) => void;
    };
}

/**
 * Text area for pasted or dropped text, with actions to open a file and clean the text.
 */
export const TextInput = ({
    text,
    onTextChange,
    onOpenFile,
    onClean,
    canClean,
    isDragging,
    isProcessing,
    message,
    dragHandlers
}: TextInputProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="textarea-wrapper">
            <div
                className={`textarea-container ${isDragging ? 'dragging' : ''} ${isProcessing ? 'processing' : ''}`}
                {...dragHandlers}
            >
                <textarea
                    value={text}
                    onChange={(event) => onTextChange(event.target.value)}
                    placeholder="Paste text here, or drop a PDF, DOCX, TXT, or MD file"
                    aria-label="Text to inspect"
                    autoCapitalize="off"
                    autoComplete="off"
                    spellCheck={false}
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
                    <button type="button" className="clean-button" onClick={onClean} disabled={!canClean}>
                        Clean text
                    </button>
                    <button type="button" className="open-file-button" onClick={() => fileInputRef.current?.click()}>
                        Open file
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED_FILES}
                        hidden
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) onOpenFile(file);
                            // Clear the selection so choosing the same file again still triggers a change.
                            event.target.value = '';
                        }}
                    />
                </div>
                <div role="status" aria-live="polite">
                    {message && (
                        <span className={`message ${message.type} ${message.fadingOut ? 'fade-out' : ''}`}>
                            {message.text}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
