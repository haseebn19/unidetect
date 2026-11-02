import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import type {TextStats} from '../../types';
import {StatsDisplay} from './StatsDisplay';

const stats: TextStats = {
    totalChars: 12,
    visibleChars: 10,
    hiddenChars: 2,
    newlineChars: 1,
    tabChars: 0,
    bytes: 16,
    spaces: 3
};

describe('StatsDisplay', () => {
    it('shows the visible and hidden counts, and flags hidden characters', () => {
        const {container} = render(<StatsDisplay stats={stats} />);

        expect(screen.getByText('Visible').nextSibling).toHaveTextContent('10');
        expect(screen.getByText('Hidden').nextSibling).toHaveTextContent('2');
        expect(container.querySelector('.stats-container')).toHaveClass('has-hidden');
    });

    it('does not flag text without hidden characters', () => {
        const {container} = render(<StatsDisplay stats={{...stats, hiddenChars: 0}} />);

        expect(container.querySelector('.stats-container')).not.toHaveClass('has-hidden');
    });

    it('shows the detailed counts on request', () => {
        render(<StatsDisplay stats={stats} />);
        const toggle = screen.getByRole('button', {name: /show details/i});
        const details = document.getElementById('stats-details')!;
        expect(details).not.toBeVisible();

        fireEvent.click(toggle);

        expect(toggle).toHaveAttribute('aria-expanded', 'true');
        expect(details).toBeVisible();
        expect(screen.getByText('Bytes').nextSibling).toHaveTextContent('16');
        expect(screen.getByText('Spaces').nextSibling).toHaveTextContent('3');
    });
});
