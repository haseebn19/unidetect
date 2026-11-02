import {useTextProcessor} from '../../hooks/useTextProcessor';
import {useFileExtraction} from '../../hooks/useFileExtraction';
import {useStatusMessage} from '../../hooks/useStatusMessage';
import {StatsDisplay} from '../StatsDisplay/StatsDisplay';
import {CharacterDisplay} from '../CharacterDisplay/CharacterDisplay';
import {TextInput} from '../TextInput/TextInput';
import {plural} from '../../utils/plural';
import './UniDetect.css';

/**
 * The UniDetect page: text input, statistics, highlighted text, and the hidden character list.
 */
export const UniDetect = () => {
    const {text, setText, analyzedText, hiddenChars, textStats, cleanCurrentText} = useTextProcessor();
    const {message, showMessage} = useStatusMessage();
    const {isExtracting, isDragging, dragHandlers, loadFile} = useFileExtraction(setText, showMessage);

    const handleClean = async () => {
        const {cleaned, removedCount} = cleanCurrentText();
        const removed = `Removed ${plural(removedCount, 'hidden character')}`;
        try {
            await navigator.clipboard.writeText(cleaned);
            showMessage(`${removed} and copied the text to the clipboard.`, 'success');
        } catch {
            showMessage(`${removed}. Copying to the clipboard failed.`, 'error');
        }
    };

    return (
        <div className="UniDetect">
            <main className="UniDetect-main">
                <h1>UniDetect</h1>
                <p className="subtitle">Find and clean hidden Unicode characters in your text</p>
                <div className="input-container">
                    <StatsDisplay stats={textStats} />
                    <TextInput
                        text={text}
                        onTextChange={setText}
                        onOpenFile={loadFile}
                        onClean={handleClean}
                        canClean={textStats.hiddenChars > 0}
                        isDragging={isDragging}
                        isProcessing={isExtracting}
                        message={message}
                        dragHandlers={dragHandlers}
                    />
                    <CharacterDisplay text={analyzedText} hiddenChars={hiddenChars} />
                </div>
            </main>
            <footer className="footer">
                <span className="privacy-notice">Everything runs in your browser.</span>
                <span className="separator" aria-hidden="true">
                    •
                </span>
                <a
                    href="https://github.com/haseebn19/unidetect"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="github-link"
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                            d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
                            fill="currentColor"
                        />
                    </svg>
                    Source
                </a>
            </footer>
        </div>
    );
};
