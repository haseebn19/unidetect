import {useCallback, useEffect, useRef, useState} from 'react';
import type {MessageType} from '../types';

const VISIBLE_MS = 3000;
// Matches the fadeOut animation in index.css.
const FADE_MS = 300;

export interface StatusMessage {
    text: string;
    type: MessageType;
    fadingOut: boolean;
}

/**
 * A short-lived status message that fades out after a few seconds.
 * Showing a new message replaces the current one and restarts the timer.
 */
export const useStatusMessage = () => {
    const [message, setMessage] = useState<StatusMessage | null>(null);
    const timers = useRef<number[]>([]);

    const clearTimers = useCallback(() => {
        timers.current.forEach((timer) => window.clearTimeout(timer));
        timers.current = [];
    }, []);

    const showMessage = useCallback(
        (text: string, type: MessageType) => {
            clearTimers();
            setMessage({text, type, fadingOut: false});
            timers.current = [
                window.setTimeout(() => setMessage((current) => current && {...current, fadingOut: true}), VISIBLE_MS),
                window.setTimeout(() => setMessage(null), VISIBLE_MS + FADE_MS)
            ];
        },
        [clearTimers]
    );

    useEffect(() => clearTimers, [clearTimers]);

    return {message, showMessage};
};
