import React, {useCallback, useState, useRef, useEffect} from 'react';
import {useTextProcessor} from '../../hooks/useTextProcessor';
import {useFileExtraction} from '../../hooks/useFileExtraction';
import {StatsDisplay} from '../StatsDisplay/StatsDisplay';
import {CharacterDisplay} from '../CharacterDisplay/CharacterDisplay';
import {FileUpload} from '../FileUpload/FileUpload';
import {MessageType} from '../../types';
import './UniDetect.css';

/**
 * Main application component for Unicode character detection
 * Provides text analysis, character detection, and cleaning functionality
 */
export const UniDetect: React.FC = () => {
    const {
        text,
        hiddenChars,
        textStats,
        handleTextInput,
        cleanTextContent
    } = useTextProcessor();

    const {
        isExtracting,
        isDragging,
        statusMessage,
        messageType,
        handleDragOver,
        handleDragLeave,
        handleDrop
    } = useFileExtraction();

    const [cleanMessage, setCleanMessage] = useState<string>('');
    const [cleanMessageType, setCleanMessageType] = useState<MessageType>('info');
    const [isCleanMessageFadingOut, setIsCleanMessageFadingOut] = useState<boolean>(false);
    const cleanMessageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const fadeOutTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const clearCleanMessage = useCallback(() => {
        if (cleanMessageTimeoutRef.current) {
            clearTimeout(cleanMessageTimeoutRef.current);
            cleanMessageTimeoutRef.current = null;
        }
        if (fadeOutTimeoutRef.current) {
            clearTimeout(fadeOutTimeoutRef.current);
            fadeOutTimeoutRef.current = null;
        }

        setIsCleanMessageFadingOut(true);
        fadeOutTimeoutRef.current = setTimeout(() => {
            setCleanMessage('');
            setIsCleanMessageFadingOut(false);
            fadeOutTimeoutRef.current = null;
        }, 300); // Match CSS animation duration
    }, []);

    const handleCleanText = useCallback(async () => {
        if (cleanMessageTimeoutRef.current) {
            clearTimeout(cleanMessageTimeoutRef.current);
            cleanMessageTimeoutRef.current = null;
        }
        if (fadeOutTimeoutRef.current) {
            clearTimeout(fadeOutTimeoutRef.current);
            fadeOutTimeoutRef.current = null;
        }

        const hiddenCount = hiddenChars.filter((char) => char.type === 'hidden').length;

        if (hiddenCount === 0) {
            setCleanMessageType('info');
            setCleanMessage('No hidden characters to clean!');
            setIsCleanMessageFadingOut(false);
            cleanMessageTimeoutRef.current = setTimeout(clearCleanMessage, 3000);
            return;
        }

        const cleanedText = cleanTextContent();
        handleTextInput(cleanedText);

        try {
            await navigator.clipboard.writeText(cleanedText);
            setCleanMessageType('success');
            setCleanMessage(`Text cleaned and copied to clipboard (${hiddenCount} hidden character${hiddenCount === 1 ? '' : 's'} removed)`);
        } catch {
            setCleanMessageType('error');
            setCleanMessage('Text cleaned but copying to clipboard failed');
        }

        setIsCleanMessageFadingOut(false);
        cleanMessageTimeoutRef.current = setTimeout(clearCleanMessage, 3000);
    }, [hiddenChars, cleanTextContent, handleTextInput, clearCleanMessage]);

    useEffect(() => {
        return () => {
            if (cleanMessageTimeoutRef.current) {
                clearTimeout(cleanMessageTimeoutRef.current);
            }
            if (fadeOutTimeoutRef.current) {
                clearTimeout(fadeOutTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="UniDetect">
            <header className="UniDetect-header">
                <h1>UniDetect</h1>
                <p className="subtitle">Find and clean hidden Unicode characters in your text</p>
                <div className="input-container">
                    <StatsDisplay stats={textStats} />
                    <FileUpload
                        text={text}
                        isProcessing={isExtracting}
                        isDragging={isDragging}
                        statusMessage={cleanMessage || statusMessage}
                        messageType={cleanMessage ? cleanMessageType : messageType}
                        hiddenCharsCount={textStats.hiddenChars}
                        isMessageFadingOut={isCleanMessageFadingOut}
                        onTextChange={handleTextInput}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, handleTextInput)}
                        onCleanText={handleCleanText}
                    />
                    <CharacterDisplay
                        text={text}
                        hiddenChars={hiddenChars}
                    />
                </div>
            </header>
            <footer className="footer">
                <span className="privacy-notice">🔒 All processing done locally in your browser</span>
                <span className="separator">•</span>
                <a
                    href="https://github.com/haseebn19/unidetect"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="github-link"
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" fill="currentColor"/>
                    </svg>
                    Source
                </a>
            </footer>
        </div>
    );
};