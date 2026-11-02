import {memo, useMemo, useState} from 'react';
import type {ReactNode} from 'react';
import type {HiddenChar} from '../../types';
import {plural} from '../../utils/plural';
import './CharacterDisplay.css';

interface CharacterDisplayProps {
    text: string;
    hiddenChars: HiddenChar[];
}

const markerFor = ({type, char}: HiddenChar): string => {
    if (type === 'newline') return char === '\r' ? '↵' : '⏎';
    if (type === 'tab') return '↹';
    return '⚠';
};

/**
 * Splits text into plain runs and markers, one marker per hidden character, line break, or tab.
 * Indexes are code point positions, so the text is split with Array.from rather than by UTF-16 unit.
 */
const renderHighlightedText = (text: string, hiddenChars: HiddenChar[]): ReactNode[] => {
    const chars = Array.from(text);
    const parts: ReactNode[] = [];
    let lastIndex = 0;

    hiddenChars.forEach((current, i) => {
        if (current.index > lastIndex) {
            parts.push(<span key={`text-${i}`}>{chars.slice(lastIndex, current.index).join('')}</span>);
        }
        parts.push(
            <span key={`mark-${i}`} className={`hidden-char ${current.type}`} role="img" aria-label={current.label}>
                <span>{markerFor(current)}</span>
            </span>
        );
        if (current.char === '\n') {
            parts.push(<br key={`br-${i}`} />);
        }
        lastIndex = current.index + 1;
    });

    if (lastIndex < chars.length) {
        parts.push(<span key="text-end">{chars.slice(lastIndex).join('')}</span>);
    }

    return parts;
};

/**
 * Shows the analyzed text with hidden characters marked, followed by a list of every hidden character.
 */
const CharacterDisplayComponent = ({text, hiddenChars}: CharacterDisplayProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const highlightedText = useMemo(() => renderHighlightedText(text, hiddenChars), [text, hiddenChars]);
    const hiddenOnly = useMemo(() => hiddenChars.filter((char) => char.type === 'hidden'), [hiddenChars]);

    return (
        <>
            <div className="result-container">{text ? highlightedText : 'Paste some text to analyze...'}</div>
            {hiddenOnly.length > 0 && (
                <section className="summary-container">
                    <h2 className="summary-heading">
                        <button
                            type="button"
                            className="summary-header"
                            aria-expanded={isExpanded}
                            aria-controls="character-summary-list"
                            onClick={() => setIsExpanded((expanded) => !expanded)}
                        >
                            <span>Found {plural(hiddenOnly.length, 'hidden character')}</span>
                            <span className={`summary-toggle ${isExpanded ? 'expanded' : ''}`} aria-hidden="true">
                                ▼
                            </span>
                        </button>
                    </h2>
                    <ul id="character-summary-list" className="summary-content" hidden={!isExpanded}>
                        {hiddenOnly.map((char) => (
                            <li key={char.index}>
                                Position {char.index + 1}: {char.label}
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </>
    );
};

export const CharacterDisplay = memo(CharacterDisplayComponent);
