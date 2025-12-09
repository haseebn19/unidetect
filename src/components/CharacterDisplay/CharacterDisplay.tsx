import React, {useCallback, useState, memo} from 'react';
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
const CharacterDisplayComponent: React.FC<CharacterDisplayProps> = ({text, hiddenChars}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const onlyHiddenChars = React.useMemo(() =>
        hiddenChars.filter(char => char.type === 'hidden'),
        [hiddenChars]
    );

    const hiddenCount = onlyHiddenChars.length;

    const toggleExpanded = useCallback(() => {
        setIsExpanded(prev => !prev);
    }, []);

    /**
     * Renders text content with highlighted characters
     * Processes text sequentially to maintain proper character positions
     */
    const renderText = useCallback(() => {
        if (!text) return null;

        const result = [];
        let lastIndex = 0;

        for (let i = 0; i < hiddenChars.length; i++) {
            const current = hiddenChars[i];

            if (current.index > lastIndex) {
                const textContent = text.substring(lastIndex, current.index);
                result.push(
                    <span key={`text-${i}`}>
                        {textContent}
                    </span>
                );
            }

            result.push(
                <span
                    key={`hidden-${i}`}
                    className={`hidden-char ${current.type}`}
                    title={`${current.code}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`Hidden character at position ${current.index + 1}: ${current.code}`}
                >
                    <span>
                        {current.type === 'newline'
                            ? (current.char === '\r' ? '↵' : '⏎')
                            : current.type === 'tab'
                                ? '↹'  // Tab symbol
                                : '⚠'}
                    </span>
                </span>
            );

            if (current.type === 'newline' && current.char === '\n') {
                result.push(<br key={`br-${i}`} />);
            }

            lastIndex = current.index + 1;
        }

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
            {hiddenCount > 0 && (
                <div className="summary-container">
                    <div
                        className="summary-header"
                        onClick={toggleExpanded}
                        role="button"
                        tabIndex={0}
                        aria-expanded={isExpanded}
                        aria-controls="character-summary-list"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggleExpanded();
                            }
                        }}
                    >
                        <h3>Found {hiddenCount} hidden character{hiddenCount === 1 ? '' : 's'}</h3>
                        <button
                            className={`summary-toggle ${isExpanded ? 'expanded' : ''}`}
                            aria-label={isExpanded ? 'Collapse list' : 'Expand list'}
                        >
                            ▼
                        </button>
                    </div>                    <div className={`summary-content ${isExpanded ? 'expanded' : ''}`}>
                        <ul id="character-summary-list">
                            {onlyHiddenChars.map((char, index) => (
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

export const CharacterDisplay = memo(CharacterDisplayComponent);