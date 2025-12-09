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
            <footer className="privacy-notice">
                <p>🔒 Privacy Notice: This app processes all text locally in your browser. No data is collected, stored, or transmitted to any server.</p>
            </footer>
        </div>
    );
};