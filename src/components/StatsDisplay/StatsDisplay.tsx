import React, {memo} from 'react';
import {TextStats} from '../../types';
import './StatsDisplay.css';

/**
 * Props for the StatsDisplay component
 */
interface StatsDisplayProps {
    stats: TextStats;
}

/**
 * Component for displaying text analysis statistics
 * Shows character counts, visible/hidden characters, spaces, and byte size
 */
const StatsDisplayComponent: React.FC<StatsDisplayProps> = ({stats}) => {
    return (
        <div className="stats-container">
            <div className="stat-item">
                <span className="stat-label">Characters:</span>
                <span className="stat-value">{stats.totalChars}</span>
            </div>
            <div className="stat-item">
                <span className="stat-label">Visible:</span>
                <span className="stat-value">{stats.visibleChars}</span>
            </div>
            <div className="stat-item">
                <span className="stat-label">Hidden:</span>
                <span className="stat-value">{stats.hiddenChars}</span>
            </div>
            <div className="stat-item">
                <span className="stat-label">Newlines:</span>
                <span className="stat-value">{stats.newlineChars}</span>
            </div>
            <div className="stat-item">
                <span className="stat-label">Spaces:</span>
                <span className="stat-value">{stats.spaces}</span>
            </div>
            <div className="stat-item">
                <span className="stat-label">Bytes:</span>
                <span className="stat-value">{stats.bytes}</span>
            </div>
        </div>
    );
};

export const StatsDisplay = memo(StatsDisplayComponent);