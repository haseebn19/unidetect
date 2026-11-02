import {act, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {UniDetect} from './UniDetect';

const zeroWidthSpace = '\u200B';

afterEach(() => vi.unstubAllGlobals());

describe('UniDetect', () => {
    it('cleans hidden characters and copies the clean text', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        vi.stubGlobal('navigator', {clipboard: {writeText}});
        render(<UniDetect />);
        const input = screen.getByLabelText<HTMLTextAreaElement>('Text to inspect');

        fireEvent.change(input, {target: {value: `pass${zeroWidthSpace}word`}});
        await act(async () => {
            fireEvent.click(await screen.findByRole('button', {name: 'Clean text'}));
        });

        expect(writeText).toHaveBeenCalledWith('password');
        expect(input.value).toBe('password');
        expect(screen.getByRole('status')).toHaveTextContent(
            'Removed 1 hidden character and copied the text to the clipboard.'
        );
    });

    it('still cleans the text when copying fails', async () => {
        vi.stubGlobal('navigator', {clipboard: {writeText: vi.fn().mockRejectedValue(new Error('denied'))}});
        render(<UniDetect />);
        const input = screen.getByLabelText<HTMLTextAreaElement>('Text to inspect');

        fireEvent.change(input, {target: {value: `a${zeroWidthSpace}${zeroWidthSpace}b`}});
        await act(async () => {
            fireEvent.click(await screen.findByRole('button', {name: 'Clean text'}));
        });

        expect(input.value).toBe('ab');
        expect(screen.getByRole('status')).toHaveTextContent(
            'Removed 2 hidden characters. Copying to the clipboard failed.'
        );
    });
});
