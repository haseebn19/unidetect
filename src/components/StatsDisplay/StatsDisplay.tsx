import React, {memo, useState} from 'react';
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
 * Shows simplified stats by default with an option to expand for more details
 */
const StatsDisplayComponent: React.FC<StatsDisplayProps> = ({stats}) => {
    const [showAdvanced, setShowAdvanced] = useState(false);
    
    const toggleAdvanced = () => {
        setShowAdvanced(prev => !prev);
    };

    return (
        <div className="stats-container">
            {/* Main stats display - always shown */}
            <div 
                className="summary-header stats-header"
                onClick={toggleAdvanced}
                role="button"
                tabIndex={0}
                aria-expanded={showAdvanced}
                aria-controls="stats-details"
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleAdvanced();
                    }
                }}
            >
                <div className="stats-row">
                    <div className="stat-item">
                        <span className="stat-label">Non-Hidden:</span>
                        <span className="stat-value">{stats.visibleChars}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Hidden:</span>
                        <span className="stat-value">{stats.hiddenChars}</span>
                    </div>
                </div>
                <button 
                    className={`summary-toggle ${showAdvanced ? 'expanded' : ''}`}
                    aria-label={showAdvanced ? 'Hide Details' : 'Show Details'}
                >
                    ▼
                </button>
            </div>
            
            <div className={`summary-content ${showAdvanced ? 'expanded' : ''}`}>
                <div className="stats-advanced">
                    <div className="stat-item">
                        <span className="stat-label">Total Chars:</span>
                        <span className="stat-value">{stats.totalChars}</span>
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
            </div>
        </div>
    );
};

export const StatsDisplay = memo(StatsDisplayComponent);