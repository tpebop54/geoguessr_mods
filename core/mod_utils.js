// ==UserScript==
// @author       tpebop

// ==/UserScript==

// Mod utility functions.
// ===============================================================================================================================

// Global Mercator projection constants - shared across mods
const _MERCATOR_LAT_MIN = -85.05112878;
const _MERCATOR_LAT_MAX = 85.05112878;
const _MERCATOR_LNG_MIN = -180;
const _MERCATOR_LNG_MAX = 180;

const areModsAvailable = (path) => {
    path = path || THE_WINDOW.location.pathname;
    if (path.includes('/multiplayer')) {
        return false;
    }
    return path.includes('/game/') || path.includes('/challenge/') ||path.includes('/live-challenge/') || path.includes('/multiplayer');
};

const getActualLoc = () => {
    const actual = GG_ROUND || GG_LOC; // These are extracted in different ways. May need to clean it up at some point.
    if (!actual) {
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

const getDistance = (p1, p2) => { // Meters.
    const google = getGoogle();
    const ll1 = new google.maps.LatLng(p1.lat, p1.lng);
    const ll2 = new google.maps.LatLng(p2.lat, p2.lng);
    const dist = google.maps.geometry.spherical.computeDistanceBetween(ll1, ll2);
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

// Ref: https://www.plonkit.net/beginners-guide
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

    let maxErrorDist;
    if (isGGMapLoaded()) {
        maxErrorDist = GG_GUESSMAP.maxErrorDistance;
    } else {
        console.warn('getScore: GG_GUESSMAP not loaded, using fallback maxErrorDistance');
        maxErrorDist = 20015086; // Default world map max distance in meters
    }
    
    const score = Math.round(5000 * Math.pow(Math.E, -10 * dist / maxErrorDist));
    return score;
};

const isScoringMod = (mod) => {
    if (!mod) {
        return false;
    }
    return !!(mod.isScoring || mod.isScoring);
};

const disableConflictingMods = (activatingMod) => {
    if (isScoringMod(activatingMod)) {
        SCORE_FUNC = undefined;
        for (const other of Object.values(MODS)) {
            if (activatingMod === other) {
                continue;
            }
            if (isScoringMod(other)) {
                disableMods(other);
            }
        }
    }
};

// TODO: is this necessary?
// Async version of getScore that waits for GG_GUESSMAP to load (for cases where you need accurate data)
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

    const mapData = await getGGMapWithFallback(2000);
    const maxErrorDist = mapData.maxErrorDistance;
    const score = Math.round(5000 * Math.pow(Math.E, -10 * dist / maxErrorDist));
    
    if (!isGGMapLoaded()) {
        console.warn('getScoreAsync: calculated with fallback maxErrorDistance, score:', score);
    }
    
    return score;
};

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

// Map click listener. For scoring mods, SCORE_FUNC needs to be defined and then cleared when the mod is deactivated.
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
        scoreString = String(getScore());
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

// Get random longitude. This one is complicated because it can cross the prime meridian.
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

// Get random { lat, lng } between the given bounds, or for the full Mercator projection if bounds are not provided.
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
    
    if (isNaN(lat) || isNaN(lng)) {
        console.error('Invalid coordinates provided to clickAt:', lat, lng);
        return;
    }
    
    // Clamp coordinates to safe Mercator bounds to prevent off-map clicks
    const safeLat = Math.max(_MERCATOR_LAT_MIN, Math.min(_MERCATOR_LAT_MAX, lat));
    const safeLng = Math.max(-180, Math.min(180, lng));
        
    const google = getGoogle();
    const click = {
        latLng: new google.maps.LatLng(safeLat, safeLng),
    };
    google.maps.event.trigger(GOOGLE_MAP, 'click', click);
    GG_CLICK = { lat: safeLat, lng: safeLng };
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
    const container = getGuessmapContainer();
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

const isGGMapLoaded = () => {
    return GG_GUESSMAP && typeof GG_GUESSMAP.maxErrorDistance !== 'undefined' && GG_GUESSMAP.maxErrorDistance > 0;
};

// Get GG_GUESSMAP with fallback - waits for a reasonable time if not loaded yet
const getGGMapWithFallback = async (maxWaitTime = 5000) => {
    if (isGGMapLoaded()) {
        return GG_GUESSMAP;
    }
    
    // Wait for GG_GUESSMAP to load with timeout
    const startTime = Date.now();
    while (!isGGMapLoaded() && (Date.now() - startTime) < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (isGGMapLoaded()) {
        return GG_GUESSMAP;
    }
    
    console.warn('GG_GUESSMAP not loaded within timeout, using fallback');
    return {
        maxErrorDistance: 20015086, // Default world map max distance
        name: 'Fallback Map',
        id: 'fallback'
    };
};

// Utility function for mods to wait for both 2D and 3D maps to be ready.
const waitForMapsReady = (callback, options = {}) => {
    options = Object.assign(
        {},
        {
            timeout: 10000,
            intervalMs: 200,
        },
        options || {},
    );
    
    const checkMapsReady = () => {
        try {
            const google = getGoogle();
            if (!google || !google.maps) {
                return false;
            }         
            const map2dReady = GOOGLE_MAP && isMapReady(GOOGLE_MAP);
            const map3dReady = GOOGLE_STREETVIEW && isMapReady(GOOGLE_STREETVIEW);
            return map2dReady && map3dReady;
        } catch (err) {
            console.error('Error checking maps readiness:', err);
            return false;
        }
    };

    callback = callback || (() => { return true; }); // Can pass null for callback to synchronously wait for maps to load.

    if (checkMapsReady()) {
        callback(true);
        return true;
    }
    
    const startTime = Date.now();
    const intervalId = setInterval(() => {
        if (checkMapsReady()) {
            clearInterval(intervalId);
            callback(true);
            return;
        }
        if (Date.now() - startTime >= options.timeout) {
            clearInterval(intervalId);
            console.error('waitForMapsReady: Unable to load mods. Requires debugging.');
        }
    }, options.intervalMs);
    
    return false;
};

/**
 * Get random latitude using sinusoidal projection for more even distribution.
 * This compensates for the fact that lines of longitude converge at the poles,
 * so uniform random lat/lng would cluster points near the poles.
 * Now uses safe Mercator bounds when no limits are specified.
 */
const getRandomLatSinusoidal = (lat1, lat2) => {
    if (lat1 == null || lat2 == null) {
        // For full world, use safe Mercator bounds instead of poles
        // Generate uniform random and apply asin transformation within Mercator limits
        const maxSin = Math.sin(_MERCATOR_LAT_MAX * (Math.PI / 180));
        const minSin = Math.sin(_MERCATOR_LAT_MIN * (Math.PI / 180));
        
        const u = Math.random(); // Uniform in [0, 1]
        const sinLat = minSin + u * (maxSin - minSin);
        return Math.asin(sinLat) * (180 / Math.PI);
    }
    if (lat1 === lat2) {
        return lat1;
    }
    
    // Clamp to valid Mercator latitude range
    lat1 = Math.max(_MERCATOR_LAT_MIN, Math.min(_MERCATOR_LAT_MAX, lat1));
    lat2 = Math.max(_MERCATOR_LAT_MIN, Math.min(_MERCATOR_LAT_MAX, lat2));
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
 * Automatically clamps to safe Mercator projection bounds.
 */
const getRandomLocSinusoidal = (minLat = null, maxLat = null, minLng = null, maxLng = null) => {
    // Apply Mercator bounds to input parameters to ensure we never generate invalid coordinates
    
    // Clamp input bounds to Mercator limits
    if (minLat !== null) minLat = Math.max(_MERCATOR_LAT_MIN, Math.min(_MERCATOR_LAT_MAX, minLat));
    if (maxLat !== null) maxLat = Math.max(_MERCATOR_LAT_MIN, Math.min(_MERCATOR_LAT_MAX, maxLat));
    
    // If no bounds specified, use safe Mercator bounds instead of full globe
    if (minLat === null && maxLat === null) {
        minLat = _MERCATOR_LAT_MIN;
        maxLat = _MERCATOR_LAT_MAX;
    }
    
    const lat = getRandomLatSinusoidal(minLat, maxLat);
    const lng = getRandomLng(minLng, maxLng); // Longitude distribution is fine as-is
    
    // Double-check and clamp the result to be absolutely sure
    return clampToMercatorBounds(lat, lng);
};

/**
 * Calculate distance between two coordinates in meters using Haversine formula
 * @param {number} lat1 - First latitude
 * @param {number} lng1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lng2 - Second longitude
 * @returns {number} Distance in meters
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Clamp coordinates to safe Mercator projection bounds to ensure they never
 * fall outside the visible map area in standard world view.
 * 
 * @param {number} lat - Latitude in degrees
 * @param {number} lng - Longitude in degrees
 * @returns {Object} Clamped coordinates {lat, lng}
 */
const clampToMercatorBounds = (lat, lng) => {
    // Standard Web Mercator projection limits to avoid poles and ensure visibility
    
    // Clamp latitude to Mercator bounds
    const clampedLat = Math.max(_MERCATOR_LAT_MIN, Math.min(_MERCATOR_LAT_MAX, lat));
    
    // Clamp longitude to valid range
    let clampedLng = lng;
    if (clampedLng > _MERCATOR_LNG_MAX) clampedLng = _MERCATOR_LNG_MAX;
    if (clampedLng < _MERCATOR_LNG_MIN) clampedLng = _MERCATOR_LNG_MIN;
    
    return { lat: clampedLat, lng: clampedLng };
};
