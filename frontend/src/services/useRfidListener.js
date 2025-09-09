import { useState, useEffect, useCallback } from 'react';

/**
 * A custom React hook to listen for input from a keyboard-wedge RFID scanner.
 * @param {object} options - Configuration options.
 * @param {boolean} options.disabled - If true, the listener will be inactive.
 * @returns {[string|null, () => void]} A tuple containing the scanned RFID string and a function to reset it.
 */
function useRfidListener({ disabled = false } = {}) {
    const [scannedRfid, setScannedRfid] = useState(null);

    // A function to manually reset the scannedRfid state to null
    const resetScannedRfid = useCallback(() => {
        setScannedRfid(null);
    }, []);

    useEffect(() => {
        // If the listener is explicitly disabled, do nothing.
        if (disabled) {
            return;
        }

        let rfidBuffer = [];
        let lastKeystrokeTime = Date.now();

        const handleKeyDown = (event) => {
            // Prevent interference with form inputs
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return;
            }

            const currentTime = Date.now();
            if (currentTime - lastKeystrokeTime > 100) {
                rfidBuffer = []; // Reset buffer on pause
            }
            lastKeystrokeTime = currentTime;

            if (event.key === 'Enter') {
                event.preventDefault();
                if (rfidBuffer.length > 0) {
                    const finalRfid = rfidBuffer.join('');
                    setScannedRfid(finalRfid); // Set the completed RFID
                }
                rfidBuffer = [];
            } else if (event.key.length === 1) {
                rfidBuffer.push(event.key);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        // Cleanup function to remove the listener
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [disabled]); // This effect re-runs ONLY when the 'disabled' prop changes

    return [scannedRfid, resetScannedRfid];
}

export default useRfidListener;