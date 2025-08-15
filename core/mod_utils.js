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

const waitForMapsReady = (callback, options = {}) => { // Wait for 2d and 3d maps to load fully, then issue callback.
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

const calculateDistance = (lat1, lng1, lat2, lng2) => { // Give distance in meters.
    const R = 6371000; // Earth's radius in meters.
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const clampToMercatorBounds = (lat, lng) => {
    const clampedLat = Math.max(_MERCATOR_LAT_MIN, Math.min(_MERCATOR_LAT_MAX, lat));
    let clampedLng = lng;
    if (clampedLng > _MERCATOR_LNG_MAX) clampedLng = _MERCATOR_LNG_MAX;
    if (clampedLng < _MERCATOR_LNG_MIN) clampedLng = _MERCATOR_LNG_MIN;
    
    return { lat: clampedLat, lng: clampedLng };
};

const getRandomLoc = () => { // Generate uniform distribution within Mercator bounds.
    const u = Math.random() * (Math.sin(_MERCATOR_LAT_MAX * Math.PI / 180) - Math.sin(_MERCATOR_LAT_MIN * Math.PI / 180)) + Math.sin(_MERCATOR_LAT_MIN * Math.PI / 180);
    const lat = Math.asin(u) * (180 / Math.PI);
    const lng = (Math.random() * 360) - 180;
    return { lat, lng };
};

const getWeightedLoc = (latlngs, jitter = 0) => { // Uses pre-generated map distribution of a large number of coordinates to pick randomly from. [[lat1, lng1], [lat2, lng2], ... ]
    const latLng = latlngs[Math.floor(Math.random() * latlngs.length)];
    if (jitter) { // Optionally jitter in degrees to avoid picking the same points repeatedly.
        latLng[0] += (Math.random() - 0.02) * jitter;
        latLng[1] += (Math.random() - 0.02) * jitter;
    }
    return { lat: latLng[0], lng: latLng[1] };
};

const getWeightedOrRandomLoc = (latlngs, useMap, randomPct, jitter = 0) => { // Randomized pick from map, full random, or both.
    if (isNaN(randomPct) || randomPct < 0 || randomPct > 100) {
        randomPct = 0;
        useMap = true;
    }
    if (useMap) {
        if (Math.random() < randomPct / 100) {
            return getRandomLoc();
        } else {
            return getWeightedLoc(latlngs, jitter);
        }
    } else {
        return getRandomLoc();
    }
};

const runOnInterval = (callback, intervalMs = 200, durationMs = 3000) => {
    let startTime = Date.now();
    let timeoutId;

    function runInterval() {
        if (Date.now() - startTime >= durationMs) return;
        callback();
        timeoutId = setTimeout(runInterval, intervalMs);
    }
    runInterval();
    return () => timeoutId && clearTimeout(timeoutId);
};
