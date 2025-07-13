// ==UserScript==
// @author       tpebop

// ==/UserScript==

// Mod utility functions.
// ===============================================================================================================================

const getActualLoc = () => {
    const actual = GG_ROUND || GG_LOC; // These are extracted in different ways. May need to clean it up at some point.
    if (!GG_ROUND && !GG_CLICK) {
        return undefined;
    }
    const loc = { lat: actual.lat, lng: actual.lng };
    return loc;
};

const getMapBounds = () => {
    const bounds = GOOGLE_MAP.getBounds();
    const latLngBounds = {
        north: bounds.ei.hi,
        south: bounds.ei.lo,
        west: bounds.Gh.lo,
        east: bounds.Gh.hi,
    };
    return latLngBounds;
};

const getMapCenter = () => {
    const center = GOOGLE_MAP.getCenter();
    const lat = center.lat();
    const lng = center.lng();
    return { lat, lng };
};

const setMapCenter = (lat = null, lng = null, zoom = null) => { // All optional arguments. Use current if null.
    const current = getMapCenter();
    const currentLat = current.lat;
    const currentLng = current.lng;
    const currentZoom = GOOGLE_MAP.getZoom();
    if (lat == null) {
        lat = currentLat;
    }
    if (lng == null) {
        lng = currentLng;
    }
    GOOGLE_MAP.setCenter({ lat, lng });
    if (zoom != null && zoom !== currentZoom) {
        GOOGLE_MAP.setZoom(zoom);
    }
};

const getDistance = (p1, p2) => {
    const google = getGoogle();
    const ll1 = new google.maps.LatLng(p1.lat, p1.lng);
    const ll2 = new google.maps.LatLng(p2.lat, p2.lng);
    const dist = google.maps.geometry.spherical.computeDistanceBetween(ll1, ll2); // meters.
    return dist;
};

const getHeading = (p1, p2) => {
    // Degrees clockwise from true North. [-180, 180) https://developers.google.com/maps/documentation/javascript/reference/geometry
    const google = getGoogle();
    const ll1 = new google.maps.LatLng(p1.lat, p1.lng);
    const ll2 = new google.maps.LatLng(p2.lat, p2.lng);
    const heading = google.maps.geometry.spherical.computeHeading(ll1, ll2);
    return heading;
};

const getScore = () => {
    const actual = getActualLoc();
    if (!actual) {
        console.error('getScore: no actual location available');
        return null;
    }
    const guess = GG_CLICK;
    if (!guess) {
        console.error('getScore: no guess click available');
        return null;
    }
    const dist = getDistance(actual, guess);

    // Use synchronous fallback if GG_MAP isn't loaded yet
    let maxErrorDist;
    if (isGGMapLoaded()) {
        maxErrorDist = GG_MAP.maxErrorDistance;
    } else {
        console.warn('getScore: GG_MAP not loaded, using fallback maxErrorDistance');
        maxErrorDist = 20015086; // Default world map max distance in meters
    }
    
    const score = Math.round(5000 * Math.pow(Math.E, -10 * dist / maxErrorDist));
    return score;
};

// Async version of getScore that waits for GG_MAP to load (for cases where you need accurate data)
const getScoreAsync = async () => {
    const actual = getActualLoc();
    if (!actual) {
        console.error('getScoreAsync: no actual location available');
        return null;
    }
    const guess = GG_CLICK;
    if (!guess) {
        console.error('getScoreAsync: no guess click available');
        return null;
    }
    const dist = getDistance(actual, guess);

    // Get GG_MAP with enhanced fallback handling
    const mapData = await getGGMapWithFallback(2000); // Wait up to 2 seconds
    const maxErrorDist = mapData.maxErrorDistance;
    const score = Math.round(5000 * Math.pow(Math.E, -10 * dist / maxErrorDist));
    
    if (!isGGMapLoaded()) {
        console.warn('getScoreAsync: calculated with fallback maxErrorDistance, score:', score);
    }
    
    return score;
};

/** Show if loc is within the given lat/long bounds. bounds from getMapBounds, loc from any { lat, lng } source. */
const isInBounds = (loc, bounds) => {
    let { north, east, south, west } = bounds;
    let { lat, lng } = loc;

    // The map can cross the prime meridian, but it cannot cross the poles.
    // Longitude bounds can span more than the entire world. These come through as [-180, 180].
    // If necessary shift the longitudes to check if loc is between them.
    if (Math.sign(west) !== Math.sign(east)) {
        west += 180;
        east += 180;
        lng += 180;
    }

    if (lat <= south || lat >= north) {
        return false;
    }
    if (lng <= west || lng >= east) {
        return false;
    }
    return true;
};

/**
  N, S, SW, SSW, etc... Angle is in degrees, true heading (degrees clockwise from true North).
  Level 0 is for NESW, Level 1 includes NE, SE, etc., level 2 includes NNW, ESE, etc.
*/
const getCardinalDirection = (degrees, level = 0) => {
    degrees = degrees % 360;
    if (degrees < 0) {
        degrees += 360;
    }
    let directions, index, cardinalDirection;
    switch (level) {
        case 2:
            directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
            index = Math.round(degrees / 22.5) % 16;
            cardinalDirection = directions[index < 0 ? index + 16 : index];
            break;
        case 1:
            directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
            index = Math.round(degrees / 45) % 8;
            cardinalDirection = directions[index < 0 ? index + 8 : index];
            break;
        default:
            directions = ['N', 'E', 'S', 'W'];
            index = Math.round(degrees / 90) % 4;
            cardinalDirection = directions[index < 0 ? index + 4 : index];
            break;
    }
    return cardinalDirection;
};

/**
  Map click listener. For scoring mods, SCORE_FUNC needs to be defined and then cleared when the mod is deactivated.
*/
const scoreListener = async (evt) => {
    let scoreString;
    if (SCORE_FUNC) { // See note about SCORE_FUNC in the globals.
        const result = SCORE_FUNC(evt);
        // Handle both sync and async score functions
        if (result && typeof result.then === 'function') {
            scoreString = String(await result);
        } else {
            scoreString = String(result);
        }
    } else {
        scoreString = String(getScore()); // Use synchronous version by default
    }

    let fadeTarget = document.getElementById('gg-score-div');
    if (!fadeTarget) {
        fadeTarget = document.createElement('div');
        fadeTarget.id = 'gg-score-div';
        document.body.appendChild(fadeTarget);
    }

    fadeTarget.innerHTML = scoreString;
    fadeTarget.style.opacity = 1

    let fadeEffect;
    fadeEffect = setInterval(() => {
        if (fadeTarget.style.opacity > 0) {
            fadeTarget.style.opacity = parseFloat(fadeTarget.style.opacity) - 0.05;
        } else {
            clearInterval(fadeEffect);
        }
    }, 50);
};

const getRandomLat = (lat1, lat2) => {
    if (lat1 == null || lat2 == null) {
        return Math.random() * 180 - 90;
    }
    if (lat1 === lat2) {
        return lat1;
    }
    lat1 = Math.max(-90, Math.min(90, lat1));
    lat2 = Math.max(-90, Math.min(90, lat2));
    if (lat1 > lat2) {
        [lat1, lat2] = [lat2, lat1];
    }
    const lat = Math.random() * (lat2 - lat1) + lat1;
    return lat
};

/**
  Get random longitude. This one is complicated because it can cross the prime meridian.
  Thank you ChatGPT... I am so screwed as a software engineer.
*/
const getRandomLng = (lng1, lng2) => {
    if (Math.abs(lng1) === 180 && Math.abs(lng2) === 180) { // If both +-180, we'll assume it's [-180, 180].
        lng1 = undefined;
        lng2 = undefined;
    }
    if (lng1 == null || lng2 == null) {
        return Math.random() * 360 - 180;
    }
    if (lng1 === lng2) {
        return lng1;
    }

    // Normalize to [-180, 180].
    lng1 = ((lng1 + 180) % 360 + 360) % 360 - 180;
    lng2 = ((lng2 + 180) % 360 + 360) % 360 - 180;

    // If lng1 > lng2, it overlaps the prime meridian and we pick a side randomly.
    // If both are on the same side, it's straightforward.
    // This logic will weight how much area is on each side of the prime meridian so it should behave the same anywhere.
    if (lng1 > lng2) {
        const range1Start = lng1;
        const range1End = 180;
        const range2Start = -180;
        const range2End = lng2;

        const width1 = range1End - range1Start; // e.g. 180 - 170 = 10
        const width2 = range2End - range2Start; // e.g. -170 - (-180) = 10
        const totalWidth = width1 + width2;

        // Decide which segment to pick from.
        const rand = Math.random();
        if (rand < width1 / totalWidth) {
            return Math.random() * width1 + range1Start;
        } else {
            return Math.random() * width2 + range2Start;
        }
    } else {
        return Math.random() * (lng2 - lng1) + lng1;
    }
};

/**
  Get random { lat, lng } between the given bounds, or for the full Earth if bounds are not provided.
  lat is [-90, 90], lng is [-180, 180]. Negative is south and west, positive is north and east.
*/
const getRandomLoc = (minLat = null, maxLat = null, minLng = null, maxLng = null) => {
    const lat = getRandomLat(minLat, maxLat);
    const lng = getRandomLng(minLng, maxLng);
    return { lat, lng };
};

const clickAt = (lat, lng) => { // Trigger actual click on guessMap at { lat, lng }.
    if (!GOOGLE_MAP) {
        console.error('Map not loaded yet for click event.');
        return;
    }
    const google = getGoogle();
    const click = {
        latLng: new google.maps.LatLng(lat, lng),
    };
    google.maps.event.trigger(GOOGLE_MAP, 'click', click);
};

const clearMarker = () => {
    if (!GG_CUSTOM_MARKER) {
        return;
    }
    GG_CUSTOM_MARKER.position = undefined;
    GG_CUSTOM_MARKER = undefined;
};

const addMarkerAt = (lat, lng, title = null) => {
    if (!GOOGLE_MAP) {
        return;
    }
    if (isNaN(lat) || isNaN(lng)) {
        return;
    }
    clearMarker();
    const google = getGoogle();
    GG_CUSTOM_MARKER = new google.maps.Marker({
        position: { lat, lng },
        map: GOOGLE_MAP,
        title: title == null ? '' : title,
    });
};

const setGuessMapEvents = (enabled = true) => {
    const container = getSmallMapContainer();
    if (enabled) {
        container.style.pointerEvents = 'auto';
        const overlay = container.querySelector('.gg-contextmenu-overlay');
        if (overlay) {
            overlay.remove();
        }
    } else {
        container.style.pointerEvents = 'none';
        
        // Add a transparent overlay to capture contextmenu events
        if (!container.querySelector('.gg-contextmenu-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'gg-contextmenu-overlay';
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                pointer-events: auto;
                background: transparent;
                z-index: 1000;
            `;
            
            // Only capture contextmenu events, let everything else pass through
            overlay.addEventListener('contextmenu', (evt) => {
                debugMap(null, evt);
            });
            
            // Prevent other interactions on the overlay
            overlay.addEventListener('click', (evt) => evt.preventDefault());
            overlay.addEventListener('mousedown', (evt) => evt.preventDefault());
            overlay.addEventListener('mouseup', (evt) => evt.preventDefault());
            
            container.appendChild(overlay);
        }
    }
};

// Utility function to check if GG_MAP is properly loaded
const isGGMapLoaded = () => {
    return GG_MAP && typeof GG_MAP.maxErrorDistance !== 'undefined' && GG_MAP.maxErrorDistance > 0;
};

// Get GG_MAP with fallback - waits for a reasonable time if not loaded yet
const getGGMapWithFallback = async (maxWaitTime = 5000) => {
    if (isGGMapLoaded()) {
        return GG_MAP;
    }
    
    // Wait for GG_MAP to load with timeout
    const startTime = Date.now();
    while (!isGGMapLoaded() && (Date.now() - startTime) < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (isGGMapLoaded()) {
        return GG_MAP;
    }
    
    // Return fallback if still not loaded
    console.warn('GG_MAP not loaded within timeout, using fallback');
    return {
        maxErrorDistance: 20015086, // Default world map max distance
        name: 'Fallback Map',
        id: 'fallback'
    };
};

// Utility function for mods to wait for both 2D and 3D maps to be ready
const waitForMapsReady = (callback, options = {}) => {
    const {
        timeout = 10000,       // Increased timeout to 10 seconds
        intervalMs = 200,
        require2D = true,
        require3D = true,
        modName = 'Unknown'
    } = options;

    const startTime = Date.now();
    
    const checkMapsReady = () => {
        try {
            // Check Google API availability first
            const google = getGoogle();
            if (!google || !google.maps) {
                return false;
            }
            
            // Enhanced 2D map detection with multiple fallbacks
            let map2dReady = !require2D;
            if (require2D) {
                map2dReady = (
                    // Primary check: Google Map object with proper methods and data
                    (GOOGLE_MAP && 
                     GOOGLE_MAP.getBounds && 
                     typeof GOOGLE_MAP.getBounds === 'function' &&
                     GOOGLE_MAP.getCenter &&
                     typeof GOOGLE_MAP.getCenter === 'function' &&
                     GOOGLE_MAP.getBounds() && 
                     GOOGLE_MAP.getCenter()) ||
                    // Secondary check: Map DOM elements with actual content
                    (document.querySelector('.gm-style') && 
                     document.querySelector('.guess-map_canvas__') &&
                     document.querySelector('.gm-style img')) // Check for actual map tiles
                );
            }
            
            // Enhanced 3D map detection with multiple fallbacks
            let map3dReady = !require3D;
            if (require3D) {
                map3dReady = (
                    // Primary check: Google StreetView object with proper methods and data
                    (GOOGLE_STREETVIEW && 
                     GOOGLE_STREETVIEW.getPosition && 
                     typeof GOOGLE_STREETVIEW.getPosition === 'function' &&
                     GOOGLE_STREETVIEW.getPov &&
                     typeof GOOGLE_STREETVIEW.getPov === 'function' &&
                     GOOGLE_STREETVIEW.getPosition()) ||
                    // Secondary check: Street view canvas with actual content
                    (document.querySelector('.widget-scene-canvas') &&
                     document.querySelector('[data-qa="panorama"]') &&
                     // Check that the canvas has actual rendering
                     (() => {
                         const canvas = document.querySelector('.widget-scene-canvas');
                         return canvas && canvas.width > 0 && canvas.height > 0;
                     })())
                );
            }
            
            // Additional check: ensure basic game elements are present
            const gameElementsReady = (
                document.querySelector('div[class^="game_content__"]') ||
                document.querySelector('[data-qa="panorama"]')
            );
            
            const allReady = map2dReady && map3dReady && gameElementsReady;
            
            if (allReady) {
                console.debug(`${modName}: All maps ready, executing callback`);
                callback();
                return true;
            }
            
            // Enhanced logging for debugging
            const elapsed = Date.now() - startTime;
            if (elapsed > 2000 && elapsed % 2000 < intervalMs) {
                console.debug(`${modName}: Still waiting for maps: 2D=${map2dReady}, 3D=${map3dReady}, gameElements=${gameElementsReady}, elapsed=${elapsed}ms`);
                
                // Additional debugging info
                if (!map2dReady && require2D) {
                    console.debug(`${modName}: 2D map issues - GOOGLE_MAP exists: ${!!GOOGLE_MAP}, getBounds: ${!!(GOOGLE_MAP && GOOGLE_MAP.getBounds)}, DOM: ${!!document.querySelector('.gm-style')}`);
                }
                if (!map3dReady && require3D) {
                    console.debug(`${modName}: 3D map issues - GOOGLE_STREETVIEW exists: ${!!GOOGLE_STREETVIEW}, getPosition: ${!!(GOOGLE_STREETVIEW && GOOGLE_STREETVIEW.getPosition)}, Canvas: ${!!document.querySelector('.widget-scene-canvas')}`);
                }
            }
            
            if (elapsed > timeout) {
                console.warn(`${modName}: Timeout waiting for maps after ${timeout}ms, executing callback anyway`);
                console.warn(`${modName}: Final state - 2D ready: ${map2dReady}, 3D ready: ${map3dReady}, gameElements: ${gameElementsReady}`);
                callback();
                return true;
            }
            
            return false;
        } catch (err) {
            console.error(`${modName}: Error checking map readiness:`, err);
            // Continue waiting rather than failing completely, but log the error
            return false;
        }
    };

    // Check immediately first
    if (checkMapsReady()) {
        return;
    }

    // If not ready, start interval checking
    console.debug(`${modName}: Maps not ready, starting wait cycle...`);
    const checkInterval = setInterval(() => {
        if (checkMapsReady()) {
            clearInterval(checkInterval);
        }
    }, intervalMs);
};

// Helper to create a map-safe mod update function
const createMapSafeModUpdate = (originalUpdateFunction, options = {}) => {
    const { 
        require2D = true, 
        require3D = false, 
        modName = 'Unknown',
        timeout = 5000
    } = options;

    return (forceState = null) => {
        // If mod is being disabled, execute immediately without waiting
        if (forceState === false) {
            console.debug(`${modName}: Deactivating, no need to wait for maps`);
            originalUpdateFunction(forceState);
            return;
        }

        // Check if maps are immediately available for instant execution
        const mapsInstantlyAvailable = (
            (!require2D || (GOOGLE_MAP && GOOGLE_MAP.getBounds && GOOGLE_MAP.getCenter)) &&
            (!require3D || (GOOGLE_STREETVIEW && GOOGLE_STREETVIEW.getPosition))
        );
        
        if (mapsInstantlyAvailable) {
            console.debug(`${modName}: Maps immediately available, executing without wait`);
            originalUpdateFunction(forceState);
            return;
        }

        // For enabling or toggling when maps aren't immediately ready, wait for them
        console.debug(`${modName}: Maps not immediately ready, waiting...`);
        waitForMapsReady(() => {
            console.debug(`${modName}: Maps became ready, executing now`);
            originalUpdateFunction(forceState);
        }, { require2D, require3D, modName, timeout });
    };
};

/**
 * Get random latitude using sinusoidal projection for more even distribution.
 * This compensates for the fact that lines of longitude converge at the poles,
 * so uniform random lat/lng would cluster points near the poles.
 */
const getRandomLatSinusoidal = (lat1, lat2) => {
    if (lat1 == null || lat2 == null) {
        // For full world, use inverse sine to compensate for pole clustering
        // Generate uniform random in [-1, 1] and apply asin to get lat in radians
        const u = Math.random() * 2 - 1; // Uniform in [-1, 1]
        return Math.asin(u) * (180 / Math.PI); // Convert to degrees
    }
    if (lat1 === lat2) {
        return lat1;
    }
    
    // Clamp to valid latitude range
    lat1 = Math.max(-90, Math.min(90, lat1));
    lat2 = Math.max(-90, Math.min(90, lat2));
    if (lat1 > lat2) {
        [lat1, lat2] = [lat2, lat1];
    }
    
    // Convert to radians for calculation
    const lat1Rad = lat1 * (Math.PI / 180);
    const lat2Rad = lat2 * (Math.PI / 180);
    
    // Convert to sine space for uniform distribution
    const sin1 = Math.sin(lat1Rad);
    const sin2 = Math.sin(lat2Rad);
    
    // Generate uniform random in sine space
    const u = Math.random();
    const sinLat = sin1 + u * (sin2 - sin1);
    
    // Convert back to latitude in degrees
    const latRad = Math.asin(Math.max(-1, Math.min(1, sinLat)));
    return latRad * (180 / Math.PI);
};

/**
 * Get random location using sinusoidal projection for more even distribution.
 * This creates a more uniform distribution over the Earth's surface compared to
 * uniform random lat/lng which clusters points near the poles.
 */
const getRandomLocSinusoidal = (minLat = null, maxLat = null, minLng = null, maxLng = null) => {
    const lat = getRandomLatSinusoidal(minLat, maxLat);
    const lng = getRandomLng(minLng, maxLng); // Longitude distribution is fine as-is
    return { lat, lng };
};

/**
 * Build a Google Maps API URL with the user's API key if available.
 * Falls back to the original URL if no API key is provided.
 * 
 * @param {string} baseUrl - The base URL for the API call
 * @param {Object} params - Additional parameters to add to the URL
 * @returns {string} The complete URL with API key if available
 */
const buildGoogleApiUrl = (baseUrl, params = {}) => {
    const url = new URL(baseUrl);
    
    // Add API key if available
    if (window.GOOGLE_MAPS_API_KEY && window.GOOGLE_MAPS_API_KEY.trim() !== '') {
        url.searchParams.set('key', window.GOOGLE_MAPS_API_KEY);
    }
    
    // Add additional parameters
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
    });
    
    return url.toString();
};

/**
 * Check if Google Maps API key is available and valid
 * @returns {boolean} True if API key is configured
 */
const hasGoogleApiKey = () => {
    return window.GOOGLE_MAPS_API_KEY && 
           window.GOOGLE_MAPS_API_KEY.trim() !== '' && 
           window.GOOGLE_MAPS_API_KEY.length > 10; // Basic validation
};

/**
 * Log a warning about missing API key for specific features
 * @param {string} feature - The feature that needs the API key
 */
const warnMissingApiKey = (feature) => {
    console.warn(`${feature}: Google Maps API key not configured. Some features may be limited. See installer comments for setup instructions.`);
};

/**
 * Validate Google Maps API key format
 * @param {string} apiKey - The API key to validate
 * @returns {boolean} True if the API key appears to be valid format
 */
const validateGoogleApiKey = (apiKey) => {
    if (!apiKey || typeof apiKey !== 'string') return false;
    
    // Basic format validation for Google API keys
    // They are typically 39 characters long and contain alphanumeric characters and hyphens/underscores
    const apiKeyPattern = /^[A-Za-z0-9_-]{30,50}$/;
    return apiKeyPattern.test(apiKey.trim());
};

/**
 * Initialize and validate the Google Maps API key
 */
const initializeGoogleApiKey = () => {
    if (window.GOOGLE_MAPS_API_KEY && window.GOOGLE_MAPS_API_KEY.trim() !== '') {
        const apiKey = window.GOOGLE_MAPS_API_KEY.trim();
        
        if (validateGoogleApiKey(apiKey)) {
            console.log('GeoGuessr Mods: Google Maps API key configured and validated');
            return true;
        } else {
            console.warn('GeoGuessr Mods: Google Maps API key appears to be invalid format. Please check your key.');
            return false;
        }
    } else {
        console.info('GeoGuessr Mods: No Google Maps API key configured. Some features may be limited.');
        return false;
    }
};

// Initialize API key on load
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        setTimeout(initializeGoogleApiKey, 1000);
    });
}

/**
 * Show a configuration dialog for users to enter their Google Maps API key
 */
const showApiKeyConfigDialog = () => {
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 2px solid #333;
        border-radius: 8px;
        padding: 20px;
        z-index: 10000;
        max-width: 500px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        font-family: Arial, sans-serif;
    `;
    
    dialog.innerHTML = `
        <h3 style="margin-top: 0;">Configure Google Maps API Key</h3>
        <p>Some features work better with a Google Maps API key. This is optional.</p>
        <p><a href="https://console.cloud.google.com/" target="_blank">Get your API key here</a></p>
        <input type="text" id="gg-api-key-input" placeholder="Enter your API key (optional)" 
               style="width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #ccc; border-radius: 4px;">
        <div style="text-align: right; margin-top: 15px;">
            <button id="gg-api-key-cancel" style="margin-right: 10px; padding: 8px 16px; border: 1px solid #ccc; background: #f5f5f5; border-radius: 4px; cursor: pointer;">Skip</button>
            <button id="gg-api-key-save" style="padding: 8px 16px; border: none; background: #4CAF50; color: white; border-radius: 4px; cursor: pointer;">Save</button>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    const input = dialog.querySelector('#gg-api-key-input');
    const saveBtn = dialog.querySelector('#gg-api-key-save');
    const cancelBtn = dialog.querySelector('#gg-api-key-cancel');
    
    // Pre-fill with current key if any
    if (window.GOOGLE_MAPS_API_KEY) {
        input.value = window.GOOGLE_MAPS_API_KEY;
    }
    
    const cleanup = () => {
        document.body.removeChild(dialog);
    };
    
    saveBtn.addEventListener('click', () => {
        const newKey = input.value.trim();
        window.GOOGLE_MAPS_API_KEY = newKey;
        
        if (newKey) {
            if (validateGoogleApiKey(newKey)) {
                console.log('GeoGuessr Mods: API key updated and validated');
                alert('API key saved! Note: This will only persist for this session. To make it permanent, edit the userscript file.');
            } else {
                alert('Warning: The API key format appears invalid. It was saved anyway - please verify it\'s correct.');
            }
        } else {
            console.log('GeoGuessr Mods: API key cleared');
        }
        
        cleanup();
    });
    
    cancelBtn.addEventListener('click', cleanup);
    
    // Close on ESC key
    const handleKeyPress = (e) => {
        if (e.key === 'Escape') {
            cleanup();
            document.removeEventListener('keydown', handleKeyPress);
        }
    };
    document.addEventListener('keydown', handleKeyPress);
    
    input.focus();
};

// Add a way to access the config dialog (could be called from console or a button)
window.configureGoogleApiKey = showApiKeyConfigDialog;

/**
 * Check if Street View is available at a given location using Google Street View API
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radius - Search radius in meters (default 50m)
 * @returns {Promise<boolean>} True if Street View is available
 */
const checkStreetViewAvailability = async (lat, lng, radius = 50) => {
    if (!hasGoogleApiKey()) {
        console.warn('Street View check requires Google Maps API key');
        return false;
    }
    
    return queueApiCall(async () => {
        try {
            const url = buildGoogleApiUrl('https://maps.googleapis.com/maps/api/streetview/metadata', {
                location: `${lat},${lng}`,
                radius: radius,
                source: 'outdoor' // Only official Street View imagery
            });
            
            const response = await fetch(url);
            const data = await response.json();
            
            return data.status === 'OK';
        } catch (error) {
            console.error('Error checking Street View availability:', error);
            return false;
        }
    });
};

/**
 * Find the nearest location with Street View coverage
 * @param {number} lat - Target latitude
 * @param {number} lng - Target longitude
 * @param {number} maxRadius - Maximum search radius in meters
 * @param {number} maxAttempts - Maximum number of search attempts
 * @returns {Promise<{lat: number, lng: number} | null>} Nearest Street View location or null
 */
const findNearestStreetView = async (lat, lng, maxRadius = 1000, maxAttempts = 10) => {
    if (!hasGoogleApiKey()) {
        warnMissingApiKey('Street View location search');
        return { lat, lng }; // Return original location if no API key
    }
    
    // First check the exact location
    if (await checkStreetViewAvailability(lat, lng)) {
        return { lat, lng };
    }
    
    // Search in expanding circles
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const searchRadius = (maxRadius / maxAttempts) * attempt;
        
        // Try multiple points in a circle around the target
        const points = 8; // 8 points around the circle
        for (let i = 0; i < points; i++) {
            const angle = (2 * Math.PI * i) / points;
            const offsetLat = (searchRadius / 111000) * Math.cos(angle); // ~111km per degree lat
            const offsetLng = (searchRadius / (111000 * Math.cos(lat * Math.PI / 180))) * Math.sin(angle);
            
            const testLat = lat + offsetLat;
            const testLng = lng + offsetLng;
            
            if (await checkStreetViewAvailability(testLat, testLng)) {
                return { lat: testLat, lng: testLng };
            }
        }
    }
    
    console.warn(`No Street View found within ${maxRadius}m of ${lat}, ${lng}`);
    return null;
};

/**
 * Check if a location is on land (not water) using reverse geocoding
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<boolean>} True if location is on land
 */
const checkIsOnLand = async (lat, lng) => {
    if (!hasGoogleApiKey()) {
        console.warn('Land check requires Google Maps API key');
        return true; // Assume land if no API key
    }
    
    return queueApiCall(async () => {
        try {
            const url = buildGoogleApiUrl('https://maps.googleapis.com/maps/api/geocode/json', {
                latlng: `${lat},${lng}`,
                result_type: 'natural_feature|country|administrative_area_level_1'
            });
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status === 'OK' && data.results.length > 0) {
                // If we get any geocoding results, it's likely on land
                return true;
            }
            
            // If no results, might be in water - try a broader search
            const broadUrl = buildGoogleApiUrl('https://maps.googleapis.com/maps/api/geocode/json', {
                latlng: `${lat},${lng}`
            });
            
            const broadResponse = await fetch(broadUrl);
            const broadData = await broadResponse.json();
            
            // If we get any address components, it's on land
            return broadData.status === 'OK' && broadData.results.length > 0;
            
        } catch (error) {
            console.error('Error checking if location is on land:', error);
            return true; // Assume land on error
        }
    });
};

/**
 * Generate a random location that meets the specified criteria
 * @param {number} minLat - Minimum latitude
 * @param {number} maxLat - Maximum latitude  
 * @param {number} minLng - Minimum longitude
 * @param {number} maxLng - Maximum longitude
 * @param {boolean} requireStreetView - Require Street View availability
 * @param {boolean} requireLand - Require location to be on land
 * @param {number} maxAttempts - Maximum attempts to find valid location
 * @returns {Promise<{lat: number, lng: number} | null>} Valid location or null
 */
const getRandomLocationWithCriteria = async (minLat, maxLat, minLng, maxLng, requireStreetView = false, requireLand = false, maxAttempts = 20) => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Generate random location using sinusoidal projection
        let location = getRandomLocSinusoidal(minLat, maxLat, minLng, maxLng);
        
        // Check land requirement first (cheaper API call)
        if (requireLand) {
            const isOnLand = await checkIsOnLand(location.lat, location.lng);
            if (!isOnLand) {
                continue; // Try again
            }
        }
        
        // Check Street View requirement
        if (requireStreetView) {
            const streetViewLocation = await findNearestStreetView(location.lat, location.lng);
            if (!streetViewLocation) {
                continue; // Try again
            }
            location = streetViewLocation;
        }
        
        return location;
    }
    
    console.warn(`Failed to find location meeting criteria after ${maxAttempts} attempts`);
    // Return a basic random location as fallback
    return getRandomLocSinusoidal(minLat, maxLat, minLng, maxLng);
};

// Rate limiting for API calls to avoid quota issues
let _apiCallQueue = [];
let _isProcessingQueue = false;
const API_CALL_DELAY = 100; // 100ms between API calls

/**
 * Add an API call to the rate-limited queue
 * @param {Function} apiCall - Function that returns a Promise for the API call
 * @returns {Promise} Promise that resolves with the API call result
 */
const queueApiCall = (apiCall) => {
    return new Promise((resolve, reject) => {
        _apiCallQueue.push({ call: apiCall, resolve, reject });
        processApiQueue();
    });
};

/**
 * Process the API call queue with rate limiting
 */
const processApiQueue = async () => {
    if (_isProcessingQueue || _apiCallQueue.length === 0) {
        return;
    }
    
    _isProcessingQueue = true;
    
    while (_apiCallQueue.length > 0) {
        const { call, resolve, reject } = _apiCallQueue.shift();
        
        try {
            const result = await call();
            resolve(result);
        } catch (error) {
            reject(error);
        }
        
        // Wait before next API call to avoid rate limits
        if (_apiCallQueue.length > 0) {
            await new Promise(resolve => setTimeout(resolve, API_CALL_DELAY));
        }
    }
    
    _isProcessingQueue = false;
};
