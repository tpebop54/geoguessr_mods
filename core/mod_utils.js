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
