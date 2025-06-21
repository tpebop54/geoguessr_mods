// ==UserScript==
// @name         GG Coordinate Extractor
// @description  GG Coordinate Extractor
// @version      1.0
// @author       tpebop
// @match        *://*.geoguessr.com/*
// @icon         https://www.google.com/s2/favicons?domain=geoguessr.com
// @updateURL    https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/gg_coordinate_extractor.js
// @downloadURL  https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/gg_coordinate_extractor.js
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        GM.xmlHttpRequest

// ==/UserScript==


// Thank you AI :(
// Listens for page loading events and extracts coordinates with country codes

class CoordinateDetector {
    constructor() {
        this.currentLocation = null;
        this.callbacks = [];
        this.isMonitoring = false;
    }

    onCoordinatesDetected(callback) { // Add callback for when coordinates are detected
        this.callbacks.push(callback);
    }

    startMonitoring() {
        if (this.isMonitoring) return;

        this.isMonitoring = true;
        this.setupNetworkInterception();
    }

    stopMonitoring() {
        this.isMonitoring = false;
    }

    setupNetworkInterception() {
        const self = this;

        // Override XMLHttpRequest
        const originalXHROpen = window.XMLHttpRequest.prototype.open;
        window.XMLHttpRequest.prototype.open = function (...args) {
            const xhr = this;

            xhr.addEventListener('load', function () {
                try {
                    if (xhr.responseText && xhr.responseURL.includes('google.internal.maps.mapsjs')) {
                        const data = JSON.parse(xhr.responseText);
                        self.analyzeResponseForCoordinates(data);
                    }
                } catch (e) {
                    // Ignore parsing errors
                }
            });

            return originalXHROpen.apply(this, args);
        };

        // Override fetch
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const response = await originalFetch(...args);

            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('json')) {
                    const clonedResponse = response.clone();
                    const data = await clonedResponse.json();
                    self.analyzeResponseForCoordinates(data);
                }
            } catch (e) { }

            return response;
        };
    }

    // Analyze response data for coordinates
    analyzeResponseForCoordinates(jsonData) {
        try {
            const result = this.extractCoordinatesAndCountry(jsonData);
            if (result && this.validateResult(result)) {
                this.handleCoordinatesFound(result);
            }
        } catch (error) {
            // Silently ignore extraction errors
        }
    }

    // Extract coordinates and country code from JSON data
    extractCoordinatesAndCountry(jsonData) {
        // Strategy 1: Direct path extraction
        const directResult = this.tryDirectExtraction(jsonData);
        if (directResult) return directResult;

        // Strategy 2: Recursive search
        const recursiveResult = this.tryRecursiveSearch(jsonData);
        if (recursiveResult) {
            recursiveResult.countryCode = this.findCountryCode(jsonData);
            return recursiveResult;
        }

        // Strategy 3: Pattern matching
        const coordinates = this.findCoordinateStructures(jsonData);
        if (coordinates.length > 0) {
            return {
                lat: coordinates[0].lat,
                lng: coordinates[0].lng,
                countryCode: this.findCountryCode(jsonData)
            };
        }

        return null;
    }

    // Direct extraction based on known structure
    tryDirectExtraction(data) {
        try {
            const mainSection = data[1];
            if (!mainSection || !Array.isArray(mainSection)) return null;

            for (let i = 0; i < mainSection.length; i++) {
                const section = mainSection[i];
                if (!Array.isArray(section)) continue;

                for (let j = 0; j < section.length; j++) {
                    const subsection = section[j];
                    if (!Array.isArray(subsection) || subsection.length < 2) continue;

                    const coordSection = subsection[1];
                    if (!Array.isArray(coordSection)) continue;

                    const coordArray = coordSection[0];
                    if (Array.isArray(coordArray) &&
                        coordArray.length >= 4 &&
                        coordArray[0] === null &&
                        coordArray[1] === null &&
                        typeof coordArray[2] === 'number' &&
                        typeof coordArray[3] === 'number') {

                        const lat = coordArray[2];
                        const lng = coordArray[3];

                        let countryCode = null;
                        if (coordSection.length > 4 && typeof coordSection[4] === 'string') {
                            countryCode = coordSection[4];
                        }

                        return { lat, lng, countryCode };
                    }
                }
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    // Recursive search for coordinate patterns
    tryRecursiveSearch(obj, depth = 0, maxDepth = 10) {
        if (depth > maxDepth) return null;

        if (Array.isArray(obj)) {
            // Look for coordinate pattern: [null, null, number, number]
            if (obj.length >= 4 &&
                obj[0] === null &&
                obj[1] === null &&
                typeof obj[2] === 'number' &&
                typeof obj[3] === 'number' &&
                Math.abs(obj[2]) <= 90 &&
                Math.abs(obj[3]) <= 180) {

                return {
                    lat: obj[2],
                    lng: obj[3],
                    countryCode: null
                };
            }

            // Search array elements
            for (let i = 0; i < obj.length; i++) {
                const result = this.tryRecursiveSearch(obj[i], depth + 1, maxDepth);
                if (result) return result;
            }
        }

        return null;
    }

    // Find country code in data
    findCountryCode(obj, depth = 0, maxDepth = 10) {
        if (depth > maxDepth) return null;

        if (typeof obj === 'string' &&
            obj.length === 2 &&
            /^[A-Z]{2}$/.test(obj)) {
            return obj;
        }

        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
                const result = this.findCountryCode(obj[i], depth + 1, maxDepth);
                if (result) return result;
            }
        } else if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
                const result = this.findCountryCode(obj[key], depth + 1, maxDepth);
                if (result) return result;
            }
        }

        return null;
    }

    // Find coordinate structures in data
    findCoordinateStructures(obj) {
        const results = [];

        const search = (current) => {
            if (Array.isArray(current)) {
                if (current.length >= 4 &&
                    current[0] === null &&
                    current[1] === null &&
                    typeof current[2] === 'number' &&
                    typeof current[3] === 'number') {

                    const lat = current[2];
                    const lng = current[3];

                    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
                        results.push({ lat, lng });
                    }
                }

                current.forEach(item => search(item));
            } else if (typeof current === 'object' && current !== null) {
                Object.values(current).forEach(value => search(value));
            }
        };

        search(obj);
        return results;
    }

    // Validate extracted coordinates
    validateResult(result) {
        if (!result || typeof result !== 'object') return false;

        const { lat, lng, countryCode } = result;

        // Validate latitude
        if (typeof lat !== 'number' || lat < -90 || lat > 90) return false;

        // Validate longitude
        if (typeof lng !== 'number' || lng < -180 || lng > 180) return false;

        // Validate country code (optional)
        if (countryCode !== null && countryCode !== undefined) {
            if (typeof countryCode !== 'string' || !/^[A-Z]{2}$/.test(countryCode)) {
                return false;
            }
        }

        return true;
    }

    // Handle when coordinates are found
    handleCoordinatesFound(coordinates) {
        // Avoid duplicate notifications
        if (this.currentLocation &&
            this.currentLocation.lat === coordinates.lat &&
            this.currentLocation.lng === coordinates.lng) {
            return;
        }

        this.currentLocation = coordinates;

        const coords = {
            lat: coordinates.lat,
            lng: coordinates.lng,
            countryCode: coordinates.countryCode || 'Unknown',
        };

        // Notify all callbacks
        this.callbacks.forEach(callback => {
            try {
                callback(coords);
            } catch (e) {
                console.error('Error in coordinate callback:', e);
            }
        });
    }

    // Get current coordinates
    getCurrentCoordinates() {
        return this.currentLocation;
    }
}

// Initialize and start monitoring
function initCoordinateDetection() {
    const detector = new CoordinateDetector();

    detector.onCoordinatesDetected((coordinates) => {
        const customEvent = new CustomEvent('ggCoordinates', {
            detail: coordinates,
        });
        document.dispatchEvent(customEvent);
    });

    detector.startMonitoring();
    window.coordinateDetector = detector; // Make available globally
    return detector;
}

// Auto-initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCoordinateDetection);
} else {
    initCoordinateDetection();
}
