import {memo, useState} from 'react';
import type {TextStats} from '../../types';
import './StatsDisplay.css';

interface StatsDisplayProps {
    stats: TextStats;
}

/**
 * Shows visible and hidden character counts, with more detail on request.
 */
const StatsDisplayComponent = ({stats}: StatsDisplayProps) => {
    const [showDetails, setShowDetails] = useState(false);
    const hasHidden = stats.hiddenChars > 0;

    const details = [
        {label: 'Characters', value: stats.totalChars},
        {label: 'Line breaks', value: stats.newlineChars},
        {label: 'Tabs', value: stats.tabChars},
        {label: 'Spaces', value: stats.spaces},
        {label: 'Bytes', value: stats.bytes}
    ];

    return (
        <section className={`stats-container ${hasHidden ? 'has-hidden' : ''}`} aria-label="Text statistics">
            <button
                type="button"
                className="summary-header"
                aria-expanded={showDetails}
                aria-controls="stats-details"
                onClick={() => setShowDetails((shown) => !shown)}
            >
                <span className="stats-row">
                    <span className="stat-item">
                        <span className="stat-label">Visible</span>
                        <span className="stat-value">{stats.visibleChars}</span>
                    </span>
                    <span className={`stat-item ${hasHidden ? 'has-hidden' : ''}`}>
                        <span className="stat-label">Hidden</span>
                        <span className="stat-value">{stats.hiddenChars}</span>
                    </span>
                </span>
                <span className={`summary-toggle ${showDetails ? 'expanded' : ''}`} aria-hidden="true">
                    ▼
                </span>
                <span className="visually-hidden">{showDetails ? 'Hide details' : 'Show details'}</span>
            </button>

            <dl id="stats-details" className="stats-advanced" hidden={!showDetails}>
                {details.map(({label, value}) => (
                    <div key={label} className="stat-item">
                        <dt className="stat-label">{label}</dt>
                        <dd className="stat-value">{value}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
};

export const StatsDisplay = memo(StatsDisplayComponent);
