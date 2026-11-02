import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {TextInput} from './TextInput';

function renderInput(overrides: Partial<Parameters<typeof TextInput>[0]> = {}) {
    const props = {
        text: '',
        onTextChange: vi.fn(),
        onOpenFile: vi.fn(),
        onClean: vi.fn(),
        canClean: false,
        isDragging: false,
        isProcessing: false,
        message: null,
        dragHandlers: {onDragOver: vi.fn(), onDragLeave: vi.fn(), onDrop: vi.fn()},
        ...overrides
    };
    const result = render(<TextInput {...props} />);
    return {...result, props};
}

describe('TextInput', () => {
    it('reports typed text', () => {
        const {props} = renderInput();

        fireEvent.change(screen.getByLabelText('Text to inspect'), {target: {value: 'hello'}});

        expect(props.onTextChange).toHaveBeenCalledWith('hello');
    });

    it('only allows cleaning when there is something to clean', () => {
        const {props, rerender} = renderInput();
        const cleanButton = screen.getByRole('button', {name: 'Clean text'});
        expect(cleanButton).toBeDisabled();

        rerender(<TextInput {...props} canClean />);
        fireEvent.click(cleanButton);

        expect(props.onClean).toHaveBeenCalledTimes(1);
    });

    it('opens the chosen file and clears the picker so the same file can be chosen again', () => {
        const {props, container} = renderInput();
        const picker = container.querySelector<HTMLInputElement>('input[type="file"]')!;
        const file = new File(['text'], 'notes.txt', {type: 'text/plain'});

        fireEvent.change(picker, {target: {files: [file]}});

        expect(props.onOpenFile).toHaveBeenCalledWith(file);
        expect(picker.value).toBe('');
    });

    it('shows what is happening while a file is dragged in or processed', () => {
        const {props, rerender} = renderInput({isDragging: true});
        expect(screen.getByText('Drop document here')).toBeInTheDocument();

        rerender(<TextInput {...props} isDragging={false} isProcessing />);

        expect(screen.queryByText('Drop document here')).not.toBeInTheDocument();
        expect(screen.getByText('Processing document...')).toBeInTheDocument();
    });

    it('announces status messages', () => {
        renderInput({message: {text: 'Loaded notes.txt', type: 'success', fadingOut: false}});

        expect(screen.getByRole('status')).toHaveTextContent('Loaded notes.txt');
    });
});
