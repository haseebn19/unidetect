import React, {useCallback, useState} from 'react';
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

    /**
     * Handles text cleaning and clipboard operations
     * Automatically copies cleaned text to clipboard
     */
    const handleCleanText = useCallback(async () => {
        const hiddenCount = hiddenChars.filter((char) => char.type === 'hidden').length;

        if (hiddenCount === 0) {
            setCleanMessageType('info');
            setCleanMessage('No hidden characters to clean!');
            return;
        }

        const cleanedText = cleanTextContent();
        handleTextInput(cleanedText);

        try {
            await navigator.clipboard.writeText(cleanedText);
            setCleanMessageType('success');
            setCleanMessage(`Text cleaned and copied to clipboard (${hiddenCount} hidden character${hiddenCount === 1 ? '' : 's'} removed)`);
        } catch (err) {
            setCleanMessageType('error');
            setCleanMessage('Text cleaned but copying to clipboard failed');
        }

        setTimeout(() => {
            setCleanMessage('');
        }, 3000);
    }, [hiddenChars, cleanTextContent, handleTextInput]);

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
                        hiddenCharsCount={hiddenChars.length}
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