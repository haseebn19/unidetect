import React, {useCallback, useState} from 'react';
import {HiddenChar} from '../../types';
import './CharacterDisplay.css';

/**
 * Props for the CharacterDisplay component
 */
interface CharacterDisplayProps {
    text: string;
    hiddenChars: HiddenChar[];
}

/**
 * Component for displaying text with highlighted characters
 * Shows hidden characters and newlines with visual indicators
 */
export const CharacterDisplay: React.FC<CharacterDisplayProps> = ({text, hiddenChars}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpanded = useCallback(() => {
        setIsExpanded(prev => !prev);
    }, []);

    /**
     * Renders text content with highlighted characters
     * Processes text sequentially to maintain proper character positions
     */
    const renderText = useCallback(() => {
        if (!text) return null;

        let result = [];
        let lastIndex = 0;

        for (let i = 0; i < hiddenChars.length; i++) {
            const current = hiddenChars[i];

            // Add text before the current character
            if (current.index > lastIndex) {
                const textContent = text.substring(lastIndex, current.index);
                result.push(
                    <span key={`text-${i}`}>
                        {textContent}
                    </span>
                );
            }

            // Add the highlighted character
            result.push(
                <span
                    key={`hidden-${i}`}
                    className={`hidden-char ${current.type}`}
                    title={`${current.code}`}
                >
                    <span>
                        {current.type === 'newline'
                            ? (current.char === '\r' ? '↵' : '⏎')
                            : '⚠'}
                    </span>
                </span>
            );

            // Add line break after LF
            if (current.type === 'newline' && current.char === '\n') {
                result.push(<br key={`br-${i}`} />);
            }

            lastIndex = current.index + 1;
        }

        // Add remaining text
        if (lastIndex < text.length) {
            const textContent = text.substring(lastIndex);
            result.push(
                <span key="text-end">
                    {textContent}
                </span>
            );
        }

        return result;
    }, [text, hiddenChars]);

    return (
        <>
            <div className="result-container">
                {renderText() || 'Paste some text to analyze...'}
            </div>
            {hiddenChars.length > 0 && (
                <div className="summary-container">
                    <div className="summary-header" onClick={toggleExpanded}>
                        <h3>Found {hiddenChars.length} hidden character{hiddenChars.length === 1 ? '' : 's'}</h3>
                        <button
                            className={`summary-toggle ${isExpanded ? 'expanded' : ''}`}
                            aria-label={isExpanded ? 'Collapse list' : 'Expand list'}
                        >
                            ▼
                        </button>
                    </div>
                    <div className={`summary-content ${isExpanded ? 'expanded' : ''}`}>
                        <ul>
                            {hiddenChars.map((char, index) => (
                                <li key={index} className={char.type}>
                                    Position {char.index + 1}: {char.code}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </>
    );
}; 