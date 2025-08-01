/**
 * Provides shared functionality for detecting page/location changes
 */

class LocationTracker {
    constructor() {
        this.subscribers = new Map(); // Map of trackerId -> callback function
        this.intervals = new Map();   // Map of trackerId -> interval ID
        this.lastKnownUrl = THE_WINDOW.location.href;
        this.isGlobalTracking = false;
        this.globalInterval = null;
    }

    /**
     * Register a callback to be notified when location changes
     * @param {string} trackerId - Unique identifier for this tracker
     * @param {function} callback - Function to call when location changes
     * @param {number} pollInterval - How often to check for changes (ms), default 1000
     */
    subscribe(trackerId, callback, pollInterval = 1000) {
        if (this.subscribers.has(trackerId)) {
            this.unsubscribe(trackerId);
        }

        this.subscribers.set(trackerId, {
            callback: callback,
            lastUrl: THE_WINDOW.location.href
        });

        // Start individual polling for this subscriber
        const intervalId = setInterval(() => {
            this.checkLocationChange(trackerId);
        }, pollInterval);

        this.intervals.set(trackerId, intervalId);
    }

    /**
     * Unregister a location change callback
     * @param {string} trackerId - Unique identifier for the tracker to remove
     */
    unsubscribe(trackerId) {
        if (this.intervals.has(trackerId)) {
            clearInterval(this.intervals.get(trackerId));
            this.intervals.delete(trackerId);
        }

        if (this.subscribers.has(trackerId)) {
            this.subscribers.delete(trackerId);
        }
    }

    /**
     * Check for location changes for a specific tracker
     * @param {string} trackerId - The tracker to check
     */
    checkLocationChange(trackerId) {
        const subscriber = this.subscribers.get(trackerId);
        if (!subscriber) return;

        const currentUrl = THE_WINDOW.location.href;
        if (currentUrl !== subscriber.lastUrl) {
            subscriber.lastUrl = currentUrl;

            try {
                subscriber.callback(currentUrl, subscriber.lastUrl);
            } catch (error) {
                console.error(`Error in location tracker callback for '${trackerId}':`, error);
            }
        }
    }

    /**
     * Start global location tracking that notifies all subscribers
     * More efficient when multiple mods need location tracking
     */
    startGlobalTracking(pollInterval = 1000) {
        if (this.isGlobalTracking) return;

        this.isGlobalTracking = true;
        this.globalInterval = setInterval(() => {
            const currentUrl = THE_WINDOW.location.href;
            if (currentUrl !== this.lastKnownUrl) {
                const previousUrl = this.lastKnownUrl;
                this.lastKnownUrl = currentUrl;

                // Notify all subscribers
                for (const [trackerId, subscriber] of this.subscribers) {
                    if (currentUrl !== subscriber.lastUrl) {
                        subscriber.lastUrl = currentUrl;
                        try {
                            subscriber.callback(currentUrl, previousUrl);
                        } catch (error) {
                            console.error(`Error in global location tracker callback for '${trackerId}':`, error);
                        }
                    }
                }
            }
        }, pollInterval);

    }

    /**
     * Stop global location tracking
     */
    stopGlobalTracking() {
        if (this.globalInterval) {
            clearInterval(this.globalInterval);
            this.globalInterval = null;
        }
        this.isGlobalTracking = false;
    }

    /**
     * Get the current URL
     */
    getCurrentUrl() {
        return THE_WINDOW.location.href;
    }

    /**
     * Check if a URL represents a different location/round
     * Useful for detecting round changes vs. just parameter changes
     */
    isSignificantLocationChange(oldUrl, newUrl) {
        try {
            const oldParsed = new URL(oldUrl);
            const newParsed = new URL(newUrl);

            // Check if pathname changed (different page/round)
            if (oldParsed.pathname !== newParsed.pathname) {
                return true;
            }

            // Check if key parameters that indicate round changes have changed
            const oldParams = oldParsed.searchParams;
            const newParams = newParsed.searchParams;

            // Round ID or game ID changes are significant
            if (oldParams.get('round') !== newParams.get('round') ||
                oldParams.get('game') !== newParams.get('game')) {
                return true;
            }

            return false;
        } catch (error) {
            // If URL parsing fails, assume it's significant
            console.warn('Error parsing URLs for location change detection:', error);
            return true;
        }
    }

    /**
     * Clean up all tracking
     */
    destroy() {
        // Clear all individual intervals
        for (const intervalId of this.intervals.values()) {
            clearInterval(intervalId);
        }
        this.intervals.clear();

        // Clear global tracking
        this.stopGlobalTracking();

        // Clear all subscribers
        this.subscribers.clear();

    }
}

// Create global instance
if (typeof THE_WINDOW.GG_LOCATION_TRACKER === 'undefined') {
    THE_WINDOW.GG_LOCATION_TRACKER = new LocationTracker();
}

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocationTracker;
}
