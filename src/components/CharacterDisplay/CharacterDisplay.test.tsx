import {render} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {CharacterDisplay} from './CharacterDisplay';

describe('CharacterDisplay', () => {
    it('renders hidden character highlights at code point positions', () => {
        const {container} = render(
            <CharacterDisplay
                text={'\u{1F600}a\u200Bb'}
                hiddenChars={[
                    {
                        char: '\u200B',
                        label: 'Zero Width Space (U+200B)',
                        index: 2,
                        type: 'hidden'
                    }
                ]}
            />
        );

        const resultContainer = container.querySelector('.result-container');
        const hiddenMarker = container.querySelector('.hidden-char.hidden');

        expect(resultContainer?.textContent).toBe('\u{1F600}a\u26A0b');
        expect(hiddenMarker?.previousSibling?.textContent).toBe('\u{1F600}a');
        expect(hiddenMarker?.nextSibling?.textContent).toBe('b');
    });
});
