// ==UserScript==
// @name         Tpebop's Geoguessr MultiMod V1
// @description  Various mods to make the game interesting in various ways
// @version      1.0
// @author       tpebop
// @match        *://*.geoguessr.com/*
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/gg_evt.js
// @icon         https://www.google.com/s2/favicons?domain=geoguessr.com
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_openInTab

// ==/UserScript==


/**
CREDIT WHERE CREDIT IS DUE
- Heavy credit to https://miraclewhips.dev/ for geoguessr-event-framework and some essential functions in this script.
*/


/**
USER NOTES
- When loading, you may have to refresh the page once or twice.
/*


// TODO:
// - full reset shortcut for when things go awry.
// - block screen until mods are loaded (e.g. flashlight mode is essentially blink mode first).
// - onApply when the mod is disabled but the settings are open should enable it.
// - figure out why sometimes the map doesn't load properly.
// - disable mod should close popup.
// - marker doesn't show on first click. Maybe just click twice?
// - Click twice on load, then remove the marker. Should be pretty unobvious.

// MOD IDEAS
// - image starts blurry and gets less blurry.
// - image starts tiny and grows.
// - custom google maps json import (or store here). e.g. show only the roads and remove everything else.
// - automatically show the flag of the country (requires API key to geoapify or similar). https://developers.google.com/maps/documentation/geocoding/requests-reverse-geocoding



// Mods available in this script.
// ===============================================================================================================================

/**  DEV NOTES:
    - If you want to disable a mod, change 'show' to false for it.
    - Keep same configuration for all mods. Must add to _BINDINGS at the bottom of the file for any new mods.
    - MODS is a global variable that the script will modify. The saved state will override certain parts of it on each page load.
*/

const MODS = {

    satView: {
        show: true, // false to hide this mod from the panel. Mostly used for dev, but you can change it to disable stuff.
        key: 'sat-view', // Used for global state and document elements.
        name: 'Satellite View', // Used for menus.
        tooltip: 'Uses satellite view on the guess map, with no labels.', // Shows when hovering over menu button.
        isScoring: false, // Says whether or not this is a scoring mod (only one scoring mod can be used at a time). Can be null.
        options: {}, // Used when mod requires or allows configurable values. Can be null.
    },

    rotateMap: {
        show: true,
        key: 'rotate-map',
        name: 'Map Rotation',
        tooltip: 'Makes the guess map rotate while you are trying to click.',
        options: {
            every: {
                label: 'Run Every (s)',
                default: 0.05,
                tooltip: 'Rotate the map every X seconds. Lower numbers will reduce choppiness but may also slow the game down.',
            },
            degrees: {
                label: 'Degrees',
                default: 2,
                tooltip: 'Rotate by X degrees at the specified time interval. Positive for clockwise, negative for counter-clockwise.',
            },
            startDegrees: {
                label: 'Start at',
                default: 0,
                tooltip: 'Start at a fixed rotation. Note: "Randomize" will override this, and if you want a static map, set the others to 0.',
            },
            startRandom: {
                label: 'Randomize',
                default: false,
                tooltip: 'Randomize starting position. Note: this will override the "Start at" setting if enabled.',
            },
        },
    },

    zoomInOnly: {
        show: true,
        key: 'zoom-in-only',
        name: 'Zoom In Only',
        tooltip: 'You can only zoom inward.',
        options: {},
    },

    showScore: {
        show: true,
        key: 'show-score',
        name: 'Show Score',
        tooltip: 'Shows the would-be score of each click.',
        scoreMode: true,
        options: {},
    },

    flashlight: {
        show: true,
        key: 'flashlight',
        name: 'Flashlight',
        tooltip: 'Uses cursor as a "flashlight" where you can only see part of the screen',
        options: {
            radius: {
                label: 'Radius',
                default: 100,
                tooltip: 'Radius of flashlight, in pixels.',
            },
            blur: {
                label: 'Blur',
                default: 50,
                tooltip: 'Blur (in pixels) to add to the flashlight. Extends out from the radius.',
            }
        }
    },

    seizure: {
        show: true,
        key: 'seizure',
        name: 'Seizure',
        tooltip: 'Makes large map jitter around. Seizure warning!!',
        options: {
            frequency: {
                label: 'Frequency (Hz)',
                default: 20,
                tooltip: 'How many times per second to make the image move around.',
            },
            distance: {
                label: 'Max Distance',
                default: 30,
                tooltip: 'Maximum distance to jitter each movement (from original location, in pixels).',
            }
        }
    },

    bopIt: {
        show: true,
        key: 'bop-it',
        name: 'Bop It',
        tooltip: `Bop It mode where it tells you the intercardinal direction you need to go from your click. You'll figure it out...`,
        isScoring: true,
        options: {
            threshold: {
                label: 'Bop It Threshold (Points)',
                default: 4900,
                tooltip: 'Bop It when your click will earn this many points. (0 to 5000).',
            },
        }
    },

    inFrame: {
        show: true,
        key: 'in-frame',
        name: 'Show In-Frame',
        tooltip: 'Shows if the location is in or out of your current guess map view.',
        scoreMode: true,
        options: {},
    },

    lottery: {
        show: true,
        key: 'lottery',
        name: 'Lottery',
        tooltip: 'Get a random guess and you have to decide if you want it or not.',
        options: {
            nGuesses: {
                label: 'Max. guesses',
                default: 10,
                tooltip: 'Maximum number of random guesses you get before you have to take the guess.',
            },
            nDegLat: {
                label: 'Latitude margin (deg)',
                default: 180,
                tooltip: 'Guess up to this many degrees latitude away from the target',
            },
            nDegLng: {
                label: 'Longitude margin (deg)',
                default: 180,
                tooltip: 'Guess up to this many degrees longitude away from the target',
            },

        },
    },

};

// -------------------------------------------------------------------------------------------------------------------------------





// Debugging utilities.
// ===============================================================================================================================
// If true, add a right click listener to the guess map that will give you access to JS variables in your browser console.
const DEBUG = true;

const debugMap = (map, evt) => {
    debugger;
};

// -------------------------------------------------------------------------------------------------------------------------------




// Global state. Load from local storage if it exists. Values used in this script will be from this global variable after loading.
// ===============================================================================================================================

let GOOGLE_STREETVIEW, GOOGLE_MAP, GOOGLE_SVC; // Assigned in the google API portion of the script.

const GG_DEFAULT = {} // Used for default options and restoring options.
for (const mod of Object.values(MODS)) {
    GG_DEFAULT[mod.key] = JSON.parse(JSON.stringify(mod));
}

const STATE_KEY = 'gg_state'; // Key in window.localStorage.

const saveState = () => {
	window.localStorage.setItem(STATE_KEY, JSON.stringify(MODS));
};

const clearState = () => {
    window.localStorage.removeItem(STATE_KEY);
};

const loadState = () => { // Load state from local storage if it exists, else use default.
    const stateStr = window.localStorage.getItem(STATE_KEY);
    let storedState;
    try {
        storedState = JSON.parse(stateStr);
    } catch (err) {
        console.log(err);
    }
    if (!storedState || typeof storedState !== 'object') {
        console.log('Refreshing stored state');
        clearState();
        storedState = {};
    }

    // Create a clean starting state, with the previous state if it existed.
    // Here, we only care about the active/inactive state, and the values of the options. Everything else comes from the default config.
    for (const [key, mod] of Object.entries(MODS)) {
        if (!mod.options) {
            continue;
        }
        const storedMod = storedState[key];
        if (!storedMod) {
            continue;
        }
        mod.active = !!storedMod.active;
        if (typeof storedMod.options !== 'object') {
            storedMod.options = {};
        }
        const validKeys = new Set(Object.keys(mod));
        for (const [key, storedOption] of Object.entries(storedMod.options)) {
            if (validKeys.has(key) && storedOption.value != null) {
                mod.options[key].value = storedOption.value;
            }
        }
    }

    return MODS;
};

let GG_ROUND; // Current round information. This gets set on round start, and deleted on round end.
let GG_MAP; // Current map info.
let GG_CLICK; // { lat, lng } of latest map click.
let GG_CUSTOM_MARKER; // Custom marker. This is not the user click marker. Can only use one at a time. Need to clear/move when used.

let IS_DRAGGING = false;

/**
  SCORE_FUNC is a function used to display the overlay that shows how well you clicked (score, direction, whatever).
  This can only be used by one mod at a time, so in mods that use it we have to use disableOtherScoreModes to disable the other ones.
  It uses GG_ROUND and GG_CLICK to determine how well you clicked. SCORE_FUNC can be globally set for the active mod.
  By default, it will give the 0-5000 score, but some mods override it.
*/
let SCORE_FUNC;

const UPDATE_CALLBACKS = {}; // TODO: move this to some sort of registry function.

// -------------------------------------------------------------------------------------------------------------------------------




// DOM and state utility functions.
// ===============================================================================================================================

const getGoogle = () => {
    return window.google || unsafeWindow.google;
}

const getGameContent = () => {
    return document.querySelector('div[class^="game_content__"]');
};

const getSmallMapContainer = () => {
    return document.querySelector('div[class^="guess-map_canvasContainer__"]');
};

const getSmallMap = () => {
    return document.querySelector('div[class^="guess-map_canvas__"]');
};

const getCanvas = () => {
    return document.querySelector(`div[class^="game_canvas__"]`);
};

const getBigMap = () => {
    const canvas = getCanvas();
    if (!canvas) {
        return undefined;
    }
    return canvas.querySelector('.widget-scene-canvas');
};

const getModDiv = () => {
    return document.getElementById('gg-mod-container');
};

const getOptionMenu = () => {
    return document.getElementById('gg-option-menu');
};

const getButtonID = (mod) => {
    return `gg-opt-${mod.key}`;
};

const getButtonText = (mod) => {
    const active = mod.active;
    const text = `${active ? 'Disable ' : 'Enable '} ${mod.name}`;
    return text;
};

const getButton = (mod) => {
    return document.querySelector(`#${getButtonID(mod)}`);
};

const isActive = (mod) => {
    return !!mod.active;
};

const getDefaultMod = (mod) => {
    for (const defMod of Object.values(GG_DEFAULT)) {
        if (defMod.key === mod.key) {
            return defMod;
        }
    }
    return undefined;
};

const getDefaultOption = (mod, key) => {
    const defMod = getDefaultMod(mod);
    if (!defMod) {
        return undefined;
    }
    const defValue = ((defMod.options || {})[key] || {}).default;
    return defValue;
};

const getOption = (mod, key) => {
    const options = mod.options || {};
    const value = (options[key] || {}).value;
    if (value == null) {
        return getDefaultOption(mod, key);
    }
    return value;
};

const setOption = (mod, key, value, save = true) => {
    mod.options[key] = mod.options[key] || {}; // Assumes that MODS has been sanitized on load.
    mod.options[key].value = value;
    if (save) { // Need to call save in caller function if saving multiple options.
        saveState();
    }
};

const makeOptionMenu = (mod) => {
    if (document.getElementById('gg-option-menu')) {
        return;
    }

    let popup = document.createElement('div');
    popup.id = 'gg-option-menu';

    const title = document.createElement('div');
    title.id = 'gg-option-title';
    title.innerHTML = `${mod.name} Options`;
    popup.appendChild(title);

    const defaults = getDefaultMod(mod).options || {};

    const inputs = []; // Array of [key, type, input element].
    for (const [key, option] of Object.entries(defaults)) {
        const value = getOption(mod, key);

        const lineDiv = document.createElement('div'); // Label and input.
        const label = document.createElement('div');
        label.innerHTML = option.label;
        lineDiv.appendChild(label);
        lineDiv.classList.add('gg-option-line');
        if (option.tooltip) {
            label.title = option.tooltip;
        }

        const defaultVal = getDefaultOption(mod, key);
        let input;
        let type;
        if (typeof defaultVal === 'number') {
            type = Number;
            input = document.createElement('input');
            Object.assign(input, { type: 'number', value, className: 'gg-option-input' });
        } else if (typeof defaultVal === 'string') {
            type = String;
            input = document.createElement('input');
            Object.assign(input, { type: 'string', value, className: 'gg-option-input' });
        } else if (typeof defaultVal === 'boolean') {
            type = Boolean;
            input = document.createElement('input');
            Object.assign(input, { type: 'checkbox', value, className: 'gg-option-input' });
        } else {
            throw new Error(`Invalid option specification: ${key} is of type ${typeof defaultVal}`);
        }
        lineDiv.appendChild(input);
        inputs.push([key, type, input]);

        popup.appendChild(lineDiv);
    };

    const closePopup = () => {
        popup.remove();
        popup = undefined;
    };

    const onReset = () => {
        for (const [key, type, input] of inputs) {
            input.value = getDefaultOption(mod, key);
        }
    };

    const onClose = () => {
        closePopup();
    };

    const onApply = () => {
        for (const [key, type, input] of inputs) {
            let value;
            if (type === Boolean) {
                value = !!input.checked;
            } else {
                value = type(input.value);
            }
            setOption(mod, key, value, false);
        }
        saveState();
        UPDATE_CALLBACKS[mod.key](mod.active);
    };

    const formDiv = document.createElement('div');
    formDiv.id = 'gg-option-form-div';
    for (const [label, callback] of [
            ['Close', onClose],
            ['Reset', onReset],
            ['Apply', onApply],
        ]) {
        const button = document.createElement('button');
        button.id = `gg-option-${label.toLowerCase()}`;
        button.classList.add('gg-option-label');
        button.classList.add('gg-option-form-button');
        button.innerHTML = label;
        button.addEventListener('click', callback);
        formDiv.appendChild(button);
    };

    const modDiv = getModDiv();
    popup.appendChild(formDiv);
    modDiv.appendChild(popup);
};

const updateMod = (mod, forceState = null) => {
    if (!GOOGLE_MAP) {
        const err = `Map did not load properly for the script. Try refreshing the page and making sure the map loads fully before you do anything. Reload the page in a new tab if this fails.`;
        window.alert(err);
        throw new Error(err);
    }
    const previousState = isActive(mod);
    const newState = forceState != null ? forceState : !previousState;

    // If there are configurable options for this mod, open a popup.
    if (newState && !forceState) {
        const options = mod.options;
        if (options && typeof options === 'object' && Object.keys(options).length) {
            makeOptionMenu(mod);
        }
    }

    mod.active = newState;
    getButton(mod).textContent = getButtonText(mod);

    saveState();
    return newState;
};

const mapClickListener = (func, enable = true) => {
    if (enable) {
        document.addEventListener('map_click', func);
    } else {
        document.removeEventListener('map_click', func, false);
    }
};

const disableMods = (mods) => {
    if (!Array.isArray(mods)) {
        mods = [mods];
    }
    for (const mod of mods) {
        try {
            updateMod(mod, false);
        } catch (err) {
            console.log(err);
        }
    }
};

const isScoringMod = (mod) => {
    return !!mod.isScoring;
};

const disableOtherScoreMods = (mod) => { // This function needs to be called prior to defining SCORE_FUNC when a scoring mod is enabled.
    SCORE_FUNC = undefined;
    for (const other of Object.values(MODS)) {
        if (mod === other) {
            continue;
        }
        if (isScoringMod(other)) {
            disableMods(other);
        }
    }
};

// -------------------------------------------------------------------------------------------------------------------------------




// Mod utility functions.
// ===============================================================================================================================

const getCurrentLoc = () => {
    if (!GG_ROUND) {
        return undefined;
    }
    const loc = { lat: GG_ROUND.lat, lng: GG_ROUND.lng };
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
    if (zoom == null) {
        zoom = currentZoom;
    }
    GOOGLE_MAP.setCenter(lat, lng, zoom);
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
    if (!GG_CLICK || !GG_ROUND) {
        return;
    }
    const actual = getCurrentLoc();
    const guess = GG_CLICK;
    const dist = getDistance(actual, guess);

    // Ref: https://www.plonkit.net/beginners-guide#game-mechanics --> score
    const maxErrorDist = GG_MAP.maxErrorDistance;
    const score = Math.round(5000 * Math.pow(Math.E, -10 * dist / maxErrorDist));
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
const scoreListener = (evt) => {
    let scoreString;
    if (SCORE_FUNC) { // See note about SCORE_FUNC in the globals.
        scoreString = SCORE_FUNC(evt);
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
            fadeTarget.style.opacity -= 0.05;
        } else {
            clearInterval(fadeEffect);
        }
    }, 50);
};

// TODO: take mins and maxes
const getRandomLoc = (minLat = null, maxLat = null, minLng = null, maxLng = null) => {
    const lat = (Math.random() - 0.5) * 180;
    const lng = (Math.random() - 0.5) * 180;
    return { lat, lng };
};

const clickAt = (lat, lng) => { // Trigger actual click on guessMap at { lat, lng }.
    if (!GOOGLE_MAP) {
        console.log('Map not loaded yet for click event.');
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

// -------------------------------------------------------------------------------------------------------------------------------



// MOD: Satellite view.
// ===============================================================================================================================

const updateSatView = (forceState = null) => {
    const mod = MODS.satView;
    const active = updateMod(mod, forceState);
    GOOGLE_MAP.setMapTypeId(active ? 'satellite' : 'roadmap');
};

// -------------------------------------------------------------------------------------------------------------------------------




// MOD: Rotating guessmap.
// ===============================================================================================================================

const setHeading = (nDegrees) => {
    GOOGLE_MAP.setHeading(nDegrees) % 360;
};

const doRotation = (nDegrees) => {
    if (IS_DRAGGING) {
        return; // Drag event gets cut by setHeading.
    }
    setHeading(GOOGLE_MAP.getHeading() + nDegrees);
};

let ROTATION_INTERVAL;

const updateRotateMap = (forceState = null) => {
    const mod = MODS.rotateMap;
    const active = updateMod(mod, forceState);

    if (active) {
        const startRandom = getOption(mod, 'startRandom');
        let startDegrees = Number(getOption(mod, 'startDegrees'));
        if (startRandom) {
            startDegrees = Math.random() * 360;
        }
        if (isNaN(startDegrees)) {
            startDegrees = 0;
        }
        const nMilliseconds = Number(getOption(mod, 'every')) * 1000;
        const nDegrees = Number(getOption(mod, 'degrees'));
        if (isNaN(nMilliseconds) || isNaN(nDegrees) || nMilliseconds < 0) {
            window.alert('Invalid interval or amount.');
            return;
        }
        if (ROTATION_INTERVAL) {
            clearInterval(ROTATION_INTERVAL);
        }
        setHeading(startDegrees); // Set initial rotation and then start interval.
        if (nDegrees && nMilliseconds) {
            ROTATION_INTERVAL = setInterval(() => {
                doRotation(nDegrees);
            }, nMilliseconds);
        }
    } else if (ROTATION_INTERVAL) {
        clearInterval(ROTATION_INTERVAL);
    }
};

// -------------------------------------------------------------------------------------------------------------------------------




// MOD: Zoom-in only.
// ===============================================================================================================================

let ZOOM_LISTENER;
let HAS_ZOOMED_IN = false;
let PREV_ZOOM;
let INITIAL_BOUNDS;

const setRestriction = (latLngBounds, zoom) => {
    const restriction = {
        latLngBounds,
        strictBounds: false,
    };
    GOOGLE_MAP.setRestriction(restriction);
    GOOGLE_MAP.minZoom = zoom;
};

const updateZoomInOnly = (forceState = null) => {
    const mod = MODS.zoomInOnly;
    const active = updateMod(mod, forceState);
    if (PREV_ZOOM === undefined) {
        PREV_ZOOM = GOOGLE_MAP.getZoom();
    }
    if (!INITIAL_BOUNDS) {
        INITIAL_BOUNDS = getMapBounds();
    }

    if (active) {
        ZOOM_LISTENER = GOOGLE_MAP.addListener('zoom_changed', () => {
            const newZoom = GOOGLE_MAP.getZoom();
            if (newZoom > PREV_ZOOM) {
                HAS_ZOOMED_IN = true;
            }
            if (HAS_ZOOMED_IN) {
                const google = getGoogle();
                google.maps.event.addListenerOnce(GOOGLE_MAP, 'idle', () => { // Zoom animation occurs after zoom is set.
                    const latLngBounds = getMapBounds();
                    setRestriction(latLngBounds, GOOGLE_MAP.getZoom());
                });
            }
            PREV_ZOOM = newZoom;
        });
    } else {
        if (ZOOM_LISTENER) {
            const google = getGoogle();
            google.maps.event.removeListener(ZOOM_LISTENER);
            ZOOM_LISTENER = undefined;
        }
        HAS_ZOOMED_IN = false;
        PREV_ZOOM = undefined;
        setRestriction(INITIAL_BOUNDS, 1); // The maps API seems to only allow zooming back out the level when mod was disabled.
    }
};

// -------------------------------------------------------------------------------------------------------------------------------




// MOD: Show Score.
// ===============================================================================================================================

const updateShowScore = (forceState = null) => {
    const mod = MODS.showScore;
    const active = updateMod(mod, forceState);

    if (active) {
        disableOtherScoreMods(mod);
        SCORE_FUNC = getScore;
        mapClickListener(scoreListener, true);
    } else {
        disableOtherScoreMods();
        mapClickListener(scoreListener, false);
    }
};

// -------------------------------------------------------------------------------------------------------------------------------



// MOD: Flashlight.
// ===============================================================================================================================

let FLASHLIGHT_MOUSEMOVE;

// ref: https://stackoverflow.com/questions/77333080/flashlight-effect-with-custom-cursor-img
const updateFlashlight = (forceState = null) => {
    const mod = MODS.flashlight;
    const active = updateMod(mod, forceState);

    // Opaque div will cover entire screen. Behavior doesn't work well with covering canvas only.
    const body = document.body;
    let flashlightDiv = document.getElementById('gg-flashlight-div'); // Opaque div.
    let flashlight = document.getElementById('gg-flashlight'); // Flashlight.
    if (flashlightDiv) {
        flashlightDiv.parentElement.removeChild(flashlightDiv);
    }
    if (flashlight) {
        flashlight.parentElement.removeChild(flashlight);
    }
    if (FLASHLIGHT_MOUSEMOVE) {
        body.removeEventListener(FLASHLIGHT_MOUSEMOVE);
    }

    if (active) {
        body.style.overflow = 'hidden'; // Seems like the GeoGuessr code is overwriting the custom body CSS, so set it manually.

        flashlightDiv = document.createElement('div');
        flashlightDiv.id = 'gg-flashlight-div';

        flashlight = document.createElement('h1');
        flashlight.id = 'gg-flashlight';
        flashlightDiv.appendChild(flashlight);

        const innerRadius = Number(getOption(mod, 'radius'));
        const blur = Number(getOption(mod, 'blur'));
        const outerRadius = innerRadius + blur;
        flashlightDiv.style.setProperty('--flashlight-radius', `${innerRadius}px`);
        flashlightDiv.style.setProperty('--flashlight-blur', `${outerRadius}px`);

        FLASHLIGHT_MOUSEMOVE = body.addEventListener('mousemove', (evt) => {
            const rect = flashlightDiv.getBoundingClientRect();
            const x = evt.clientX - rect.left;
            const y = evt.clientY - rect.top;
            flashlightDiv.style.setProperty('--flashlight-x-pos', `${x - rect.width / 2}px`);
            flashlightDiv.style.setProperty('--flashlight-y-pos', `${y - rect.height / 2}px`);
        });
        body.insertBefore(flashlightDiv, body.firstChild);
    }
};

// -------------------------------------------------------------------------------------------------------------------------------




// MOD: Seizure.
// ===============================================================================================================================

let SEIZURE_INTERVAL;

const updateSeizure = (forceState = null) => {
    const mod = MODS.seizure;
    const active = updateMod(mod, forceState);

    const bigMap = getBigMap();

    if (!active) {
        if (SEIZURE_INTERVAL) {
            clearInterval(SEIZURE_INTERVAL);
        }
        bigMap.style.setProperty('left', '0px');
        bigMap.style.setProperty('top', '0px');
        return;
    }

    const frequency = getOption(mod, 'frequency');
    const nMilliseconds = 1000 / frequency;
    const nPixels = getOption(mod, 'distance');

    SEIZURE_INTERVAL = setInterval(() => {
        const offsetX = Math.ceil((Math.random() * nPixels));
        const offsetY = Math.ceil((Math.random() * nPixels));
        const hDir = Math.random();
        const vDir = Math.random();
        bigMap.style.setProperty('left', `${hDir < 0.5 ? '-' : ''}${offsetX}px`);
        bigMap.style.setProperty('top', `${vDir < 0.5 ? '-' : ''}${offsetY}px`);
    }, nMilliseconds);
};

// -------------------------------------------------------------------------------------------------------------------------------




// MOD: Bop It.
// ===============================================================================================================================

const updateBopIt = (forceState = null) => {
    const mod = MODS.bopIt;
    const active = updateMod(mod, forceState);

    const getBopIt = () => {
        const heading = getHeading(GG_CLICK, GG_ROUND);
        const direction = getCardinalDirection(heading, 1);
        const score = getScore();
        const bopThreshold = Number(getOption(mod, 'threshold'));

        const controls = {
            twist: 'Twist It!', // Top left (NW).
            flick: 'Flick It!', // Top right (NE).
            spin: 'Spin It!', // Bottom right (SE).
            pull: 'Pull It!', // Bottom left (SW).
            bop: 'Bop It!', // User has clicked within the configured score zone.
        };

        let label;

        if (score >= bopThreshold) {
            label = controls.bop;
        } else {
            switch (direction) {
                case 'N':
                    label = direction < 22.5 ? controls.flick : controls.twist;
                    break;
                case 'NE':
                    label = controls.flick;
                    break;
                case 'E':
                    label = direction < 90 ? controls.flick : controls.spin;
                    break;
                case 'SE':
                    label = controls.spin;
                    break;
                case 'S':
                    label = direction < 180 ? controls.spin : controls.pull;
                    break;
                case 'SW':
                    label = controls.pull;
                    break;
                case 'W':
                    label = direction < 270 ? controls.pull : controls.twist;
                    break;
                case 'NW':
                    label = controls.twist;
                    break;
                default:
                    console.error(`Failed to get direction for heading ${heading} direction ${direction}`);
                    label = 'Error';
                    break;
            }
        }
        return label;
    };

    if (active) {
        disableOtherScoreMods(mod);
        SCORE_FUNC = getBopIt;
        mapClickListener(scoreListener, true);
    } else {
        disableOtherScoreMods();
        mapClickListener(scoreListener, false);
    }
};

// -------------------------------------------------------------------------------------------------------------------------------




// MOD: In frame or not.
// ===============================================================================================================================

/**
Runs in a loop to tell if the target is in view.
This is a pretty expensive function, but it's easier than triggering it based on dragstart, zoomend, etc. Deal with it.
*/
let IN_FRAME_INTERVAL;

const updateInFrame = (forceState = null) => {
    const mod = MODS.inFrame;
    const active = updateMod(mod, forceState);

    const loc = getCurrentLoc();
    const smallMapContainer = getSmallMapContainer();

    if (IN_FRAME_INTERVAL) {
        clearInterval(IN_FRAME_INTERVAL);
    }

    if (active) {
        const showInFrame = () => {
            const currentBounds = getMapBounds();
            const inFrame = isInBounds(loc, currentBounds);
            const color = inFrame ? 'green' : 'red';

            const smallMapStyle = {
                'box-shadow': `0 0 10px 10px ${color}`,
                'border-radius': '10px',
            };
            Object.assign(smallMapContainer.style, smallMapStyle);
        };
        IN_FRAME_INTERVAL = setInterval(showInFrame, 100);
    } else {
        const smallMapStyle = {
            'box-shadow': '',
            'border-radius': '',
        };
        Object.assign(smallMapContainer.style, smallMapStyle);
    }
};

// -------------------------------------------------------------------------------------------------------------------------------



// MOD: Lottery.
// ===============================================================================================================================

let LOTTERY_DISPLAY; // Display elements for lottery mod. (counter and button).
let LOTTERY_COUNT; // How many remaining guesses you have.

// TODO: add map click blocker.
// TODO: set longitude to center on marker so it can't go off screen.
// TODO: add options for making it within a certain lat/lng range.
// TODO: first click registers but doesn't place the marker. click twice?

const makeLotteryDisplay = () => { // Make the div and controls for the lottery.
    const container = document.createElement('div'); // Contains the full lottery display.
    container.id = 'gg-lottery';

    // Set up display for the lottery counter and button.
    const counterLabel = document.createElement('div'); // Text label.
    counterLabel.textContent = 'Remaining guesses:';
    const counter = document.createElement('div'); // How many guesses you have left, will update each click.
    counter.id = 'gg-lottery-counter';
    counter.innerText = LOTTERY_COUNT;
    const counterDiv = document.createElement('div'); // Contains the above two items side by side.
    counterDiv.id = 'gg-lottery-counter-div';
    counterDiv.appendChild(counterLabel);
    counterDiv.appendChild(counter);

    const button = document.createElement('button');
    button.id = 'gg-lottery-button';
    button.textContent = 'Try my luck';
    button.addEventListener('click', guessRandom);

    container.appendChild(counterDiv);
    container.appendChild(button);
    document.body.appendChild(container);

    const guessRandom = () => { // TODO: make this take mins and maxes from options.
        const { lat, lng } = getRandomLoc();
        clickAt(lat, lng);
    };

    // Bind stuff.
    const onClick = () => {
        if (LOTTERY_COUNT === 0) {
            return;
        }
        const { lat, lng } = guessRandom();
        LOTTERY_COUNT -= 1;
        counter.innerText = LOTTERY_COUNT;
        setMapCenter(lat, lng); // Keep current zoom level. TODO: this is not working
    };
    button.addEventListener('click', onClick);
};

const updateLottery = (forceState = null) => {
    const mod = MODS.lottery;
    const active = updateMod(mod, forceState);

    if (LOTTERY_DISPLAY) {
        LOTTERY_DISPLAY.parentElement.removeChild(LOTTERY_DISPLAY);
        LOTTERY_DISPLAY = undefined;
    }
    LOTTERY_COUNT = getOption(mod, 'nGuesses');

    if (active) {
        makeLotteryDisplay();
    }
};

// -------------------------------------------------------------------------------------------------------------------------------




// Add bindings and start the script.
// ===============================================================================================================================

// Must add each mod to this list to bind the buttons and hotkeys.
const _BINDINGS = [
    [MODS.satView, updateSatView],
    [MODS.rotateMap, updateRotateMap],
    [MODS.zoomInOnly, updateZoomInOnly],
    [MODS.showScore, updateShowScore],
    [MODS.flashlight, updateFlashlight],
    [MODS.seizure, updateSeizure],
    [MODS.bopIt, updateBopIt],
    [MODS.inFrame, updateInFrame],
    [MODS.lottery, updateLottery],
];

const bindButtons = () => {
    for (const [mod, callback] of _BINDINGS) {
        if (!mod.show) {
            continue;
        }
        UPDATE_CALLBACKS[mod.key] = callback;
        const button = getButton(mod);
        if (!button) {
            console.error(`Mod ${mod.key} not found.`);
            continue;
        }
        button.addEventListener('click', () => callback()); // Don't pass the click event since updateMod doesn't need it.
    }
};

const addButtons = () => { // Add mod buttons to the active round.
	const canvas = getCanvas();
	if (!canvas || getModDiv()) {
        return;
    }

    const buttonClass = 'gg-mod';
    const element = document.createElement('div');
    element.id = 'gg-mod-container';

    let innerHTML = `<div class="gg-title">TPEBOP'S MODS</div>`;
    for (const mod of Object.values(MODS)) {
        if (!mod.show) {
            continue;
        }
        innerHTML = innerHTML + `\n<div class="${buttonClass}" id="${getButtonID(mod)}" title="${mod.tooltip}">${getButtonText(mod)}</div>`;
    }
	element.innerHTML = innerHTML;

	canvas.appendChild(element);
	bindButtons();
};

// -------------------------------------------------------------------------------------------------------------------------------




// Cheat blockers.
// ===============================================================================================================================

// The goal of this is fuck up the replay file and distract the user by blacking out the screen for the first second or two and clicking around.
// Should make it obvious if someone is using this mod pack.
// Advanced coders could figure it out if they want, but with compiled code and intentional obfuscation here, it will be difficult.
// Credit to Bennett Foddy for assembling many of these quotes and for a few himself, from my favorite game (Getting Over It with Bennett Foddy).

const _QUOTES = [

    `This thing that we call failure is not the falling down, but the staying down. — Mary Pickford`,
    `The soul would have no rainbow had the eyes no tears. — John Vance Cheney`,
    `The pain I feel now is the happiness I had before. That's the deal. — C.S. Lewis`,
    `I feel within me a peace above all earthly dignities, a still and quiet consciences. — William Shakespeare`,
    `You cannot believe now that you'll ever feel better. But this is not true. You are sure to be happy again. Knowing this, truly believing it, will make you less miserable now. — Abraham Lincoln`,
    `Do not stand at my grave and cry, I am not there, I did not die. — Mary Frye`,
    `To live is to suffer. To survive is to find meaning in the suffering. — Friedrich Nietzsche`,
    `Of all sad words of tongue or pen, the saddest are these, 'It might have been'. — John Greenleaf Whittier`,
    `If you try to please audiences, uncritically accepting their tastes, it can only mean that you have no respect for them. — Andrei Tarkovsky`,
    `Don't hate the player; hate the game. — Ice-T`,
    `It is in falling short of your own goals that you will surpass those who exceed theirs. — Tokugawa Ieyasu`,
    `In the end… We only regret the chances we didn’t take. — Lewis Carroll`,
    `There are no regrets in life, just lessons. — Jennifer Aniston`,
    `There’s no feeling more intense than starting over. Starting over is harder than starting up. — Bennett Foddy`,
    `Imaginary mountains build themselves from our efforts to climb them, and it's our repeated attempts to reach the summit that turns those mountains into something real. — Bennett Foddy`,
    `A quick fix for the fickle, some tricks for the clicks of the feckless — Bennett Foddy`,
    `I only want the bitterness. — Bennett Foddy`,
    `If you love life do not waste time, for time is what life is made up of — Bruce Lee`,
    `Don't let the fear of the time it will take to accomplish something stand in the way of doing it. The time will pass anyway; we might just as well put that passing time to the best possible use. — Earl Nightingale`,
    `Spend so much time on the improvement of yourself that you have no time to criticize others — Christian Larson`,
    `The magic you are looking for is in the work you are avoiding — Unknown`,
    `The grass is greenest where you water it — Unknown`,
    `People fear what they don't understand and hate what they can't conquer — Andrew Smith`,
    `You miss 100 % of the shots you don’t take. — Michael Scott`,
    `Be who you needed when you were younger. — Unknown`,
    `If you don't know what you want, you end up with a lot you don't. — Tyler Durden`,
    `There is no hopeless situation, only hopeless people. — Atatürk`,
    `A ship in port is safe, but that’s not why ships are built — Unknown`,
];

const getRandomQuote = () => {
    const ix = Math.floor(Math.random() * _QUOTES.length);
    const quote = _QUOTES[ix];
    return quote;
};

let _CHEAT_OVERLAY; // Div to block view.
let _CHEAT_DETECTION_INTERVAL; // Interval function looking for map load, will self-cancel if map fails to load.

const clearCheatOverlay = () => {
    if (_CHEAT_OVERLAY) {
        _CHEAT_OVERLAY.parentElement.removeChild(_CHEAT_OVERLAY);
        _CHEAT_OVERLAY = undefined;
    }
};

window.addEventListener('load', () => {
    clearCheatOverlay();
    const cheatOverlay = document.createElement('div'); // Opaque black div that covers everything while the page loads.
    Object.assign(cheatOverlay.style, { // Intentionally not in CSS to make it harder for people to figure out.
        height: '100vh',
        width: '100vw',
        background: 'black',
        'z-index': '99999999',
    });
    const quoteDiv = document.createElement('div');
    const quote = getRandomQuote();
    quoteDiv.innerText = quote;
    Object.assign(quoteDiv.style, { // Same thing, make it hard for people trying to dissect this code.
        position: 'absolute',
        top: '50%',
        left: '50%',
        'font-size': '60px',
        color: 'white',
        transform: 'translate(-50%, -50%)',
        'pointer-events': 'none',
    });

    // On page load, black out everything. Then, we listen for the google map load event, add a time buffer, and remove it after that.
    // We have to have the map loaded to do the anti-cheat clicks. This is done down below in the map load event bubble.
    cheatOverlay.appendChild(quoteDiv);
    _CHEAT_OVERLAY = document.body.insertBefore(cheatOverlay, document.body.firstChild);
});

/**
Click around the map *after* it is loaded and the screen is blacked out.
This will be a callback in the google maps section of this script.
This will completely mess up the replay file. We have 1 second to do this.
Always end with a click at { lat: 0, lng: 0 }. This will be extremely obvious in replays.
This function is sloppy, but it doesn't really matter as long as we screw up the replay.
*/
const clickGarbage = (nMilliseconds = 900) => {
    const nClicks = 20; // Approximately...
    const start = Date.now(); // Unix epoch ms.
    const end = start + nMilliseconds; // Stop clicking after this time (epoch ms).
    for (let _ = 0; _ <= nClicks; _++) {
        if (Date.now() > end) {
            break;
        }
        const { lat, lng } = getRandomLoc();
        clickAt(lat, lng);
    }
    clickAt(0, 0); // Race condition, but whatever.
};



// -------------------------------------------------------------------------------------------------------------------------------




// Intercept google maps API files so we can add custom map behavior. Configure GeoGuessr framework.
// ===============================================================================================================================

// Script injection, extracted from unityscript extracted from extenssr:
// https://gitlab.com/nonreviad/extenssr/-/blob/main/src/injected_scripts/maps_api_injecter.ts
const overrideOnLoad = (googleScript, observer, overrider) => {
	const oldOnload = googleScript.onload;
	googleScript.onload = (event) => {
		const google = getGoogle();
		if (google) {
			observer.disconnect();
			overrider(google);
		}
		if (oldOnload) {
			oldOnload.call(googleScript, event);
		}
	}
}

const grabGoogleScript = (mutations) => {
	for (const mutation of mutations) {
		for (const newNode of mutation.addedNodes) {
			const asScript = newNode;
			if (asScript && asScript.src && asScript.src.startsWith('https://maps.googleapis.com/')) {
				return asScript;
			}
		}
	}
	return null;
}

const injecter = (overrider) => {
	new MutationObserver((mutations, observer) => {
		const googleScript = grabGoogleScript(mutations);
		if (googleScript) {
			overrideOnLoad(googleScript, observer, overrider);
		}
	}).observe(document.documentElement, { childList: true, subtree: true });
}

const initMods = () => { // Enable mods that were already enabled via localStorage.
    for (const [mod, callback] of _BINDINGS) {
        if (mod.show && isActive(mod)) {
            callback(true);
        }
    }
};

const initModsCallback = () => {
    if (GOOGLE_MAP) {
        const google = getGoogle();
        google.maps.event.addListenerOnce(GOOGLE_MAP, 'idle', () => { // Actions on initial guess map load.
            initMods();
            console.log('GeoGuessr mods initialized.');
        });
    };
};

const onMapClick = (evt) => {
    const lat = evt.latLng.lat();
    const lng = evt.latLng.lng();
    GG_CLICK = { lat, lng };
    const event = new CustomEvent('map_click', { detail: GG_CLICK });
    /* eslint-disable no-undef */
    document.dispatchEvent(event, { bubbles: true });
};

// -------------------------------------------------------------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', (event) => {
	injecter(() => {
		const google = getGoogle();
		if (!google) {
            return;
        }

		google.maps.StreetViewPanorama = class extends google.maps.StreetViewPanorama {
			constructor(...args) {
				super(...args);
				GOOGLE_STREETVIEW = this;
			}
		}

		google.maps.Map = class extends google.maps.Map {
			constructor(...args) {
				super(...args);
                this.setRenderingType(google.maps.RenderingType.VECTOR); // Must be a vector map for some additional controls.
                this.setHeadingInteractionEnabled(true);
                this.setTiltInteractionEnabled(true);

				GOOGLE_SVC = new google.maps.ImageMapType({
					getTileUrl: (point, zoom) => `https://www.google.com/maps/vt?pb=!1m7!8m6!1m3!1i${zoom}!2i${point.x}!3i${point.y}!2i9!3x1!2m8!1e2!2ssvv!4m2!1scc!2s*211m3*211e2*212b1*213e2*212b1*214b1!4m2!1ssvl!2s*211b0*212b1!3m8!2sen!3sus!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m4!1e0!8m2!1e1!1e1!6m6!1e12!2i2!11e0!39b0!44e0!50e`,
					tileSize: new google.maps.Size(256, 256),
					maxZoom: 9,
					minZoom: 0,
				});
				google.maps.event.addListenerOnce(this, 'idle', () => { // Actions on initial guess map load.
                    initMods();
                    console.log('GeoGuessr mods initialized.');
                    setTimeout(clearCheatOverlay, 1000);
                    clickGarbage(900);
				});

                google.maps.event.addListener(this, 'dragstart', () => {
					IS_DRAGGING = true;
				});
                google.maps.event.addListener(this, 'dragend', () => {
					IS_DRAGGING = false;
				});
                google.maps.event.addListener(this, 'click', (evt) => {
					onMapClick(evt);
				});

                if (DEBUG) {
                    this.addListener('contextmenu', (evt) => {
                        debugMap(this, evt);
                    });
                }

                GOOGLE_MAP = this; // Store globally for use in other functions once this is instantiated.
			}
		}
	});
});

GeoGuessrEventFramework.init().then(GEF => {

    GEF.events.addEventListener('round_start', (evt) => {
        window.localStorage.setItem(STATE_KEY, JSON.stringify(MODS));
        try {
            const round = evt.detail.rounds[evt.detail.rounds.length - 1];
            GG_ROUND = round;
            const mapID = evt.detail.map.id;
            /* eslint-disable no-return-assign */
            fetch(`https://www.geoguessr.com/api/maps/${mapID}`).then(data => data.json()).then(data => GG_MAP = data);
        } catch (err) {
            console.err(err);
        }
        initModsCallback();
    });

    GEF.events.addEventListener('round_end', (evt) => {
        GG_ROUND = undefined;
        GG_CLICK = undefined;
    });

	document.addEventListener('keypress', (e) => {
		if (document.activeElement.tagName === 'INPUT') {
            return;
        }
        if (e.key === ',' && GOOGLE_MAP && !isActive(MODS.zoomInOnly)) {
            GOOGLE_MAP.setZoom(GOOGLE_MAP.getZoom() - 0.6);

        }
        if (e.key === '.' && GOOGLE_MAP) {
            GOOGLE_MAP.setZoom(GOOGLE_MAP.getZoom() + 0.6);
        }
	});

});

loadState();

const observer = new MutationObserver(() => {
	addButtons(); // TODO: this gets called way too much.
});

observer.observe(document.querySelector('#__next'), { subtree: true, childList: true });

// -------------------------------------------------------------------------------------------------------------------------------




// Global/Static styling.
// ===============================================================================================================================

const headerShadow = 'rgb(204, 48, 46) 2px 0px 0px, rgb(204, 48, 46) 1.75517px 0.958851px 0px, rgb(204, 48, 46) 1.0806px 1.68294px 0px, rgb(204, 48, 46) 0.141474px 1.99499px 0px, rgb(204, 48, 46) -0.832294px 1.81859px 0px, rgb(204, 48, 46) -1.60229px 1.19694px 0px, rgb(204, 48, 46) -1.97998px 0.28224px 0px, rgb(204, 48, 46) -1.87291px -0.701566px 0px, rgb(204, 48, 46) -1.30729px -1.5136px 0px, rgb(204, 48, 46) -0.421592px -1.95506px 0px, rgb(204, 48, 46) 0.567324px -1.91785px 0px, rgb(204, 48, 46) 1.41734px -1.41108px 0px, rgb(204, 48, 46) 1.92034px -0.558831px 0px'
const bodyShadow = '3px 3px 0 #000, 3px 0px 3px #000, 1px 1px 0 #000, 3px 1px 2px #000';

// Dynamic styling.
const flashlightRadius = getOption(MODS.flashlight, 'radius');
const flashlightBlur = getOption(MODS.flashlight, 'blur');

const style = `

    body: {
        overflow: hidden;
    }

    #gg-mod-container {
        position: absolute;
        top: 2.5rem;
        left: 1rem;
        z-index: 9;	display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .gg-title {
        font-size: 15px;
        font-weight: bold;
        text-shadow: ${headerShadow};
        position: relative;
        z-index: 1;
        padding-top: 15px;
    }

    .gg-mod {
        background: var(--ds-color-purple-100);
        padding: 6px 10px;
        border-radius: 5px;
        font-size: 12px;
        cursor: pointer;
        opacity: 0.75;
        transition: opacity 0.2s;
    }

    .gg-mod:hover {
        opacity: 1;
    }

    #gg-score-div {
        position: absolute;
        top: 50%;
        left: 50%;
        font-size: 60px;
        color: white;
        text-shadow: ${bodyShadow};
        transform: translate(-50%, -50%);
        pointer-events: none;
    }

    #gg-option-menu {
        position: absolute;
        left: 110%;
        padding: 15px;
        background: var(--ds-color-purple-100);
        border-radius: 10px;
        border: 2px solid black;
        color: white;
        font-size: 15px;
        font-weight: bold;
        text-shadow: ${bodyShadow};
        z-index: 1;
    }

    #gg-option-title {
        padding-top: 5px;
        padding-bottom: 12px;
        text-align: center;
        text-shadow: ${bodyShadow};
        font-size: 18px;
    }

    .gg-option-line {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .gg-option-label {
        white-space: nowrap;
        padding-right: 20px;
    }

    .gg-option-input {
        width: 70px;
        height: 25px;
        border-radius: 20px;
        margin: 5px 0;
    }

    .gg-option-button {
        border-radius: 20px;
        margin: 5px 0;
        height: 30px;
    }

    #gg-option-form-div {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
    }

    .gg-option-form-button {
        width: 80px;
        height: 25px;
        border-radius: 15px;
        color: white;
        shadow: ${bodyShadow};
        padding: 0;
        cursor: pointer;
    }

    #gg-option-close {
       background: red;
    }

    #gg-option-reset {
        background: purple;
        margin: 0 5px;
    }

    #gg-option-apply {
       background: green;
    }

    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    input[type=number] {
        -moz-appearance:textfield;
    }

    #gg-flashlight-div {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 200%;
        height: 200%;
        padding: 5rem;
        pointer-events: none;

        overflow: hidden;
        position: absolute;
        z-index: 99999;

        --flashlight-y-pos: -50%;
        --flashlight-x-pos: -50%;
        --flashlight-inset: -300px;
        --flashlight-radius: ${flashlightRadius}px;
        --flashlight-blur: ${flashlightRadius + flashlightBlur}px;
    }

    #gg-flashlight-div::before {
        content: "";
        position: absolute;
        inset: var(--flashlight-inset);
        background-image: radial-gradient(circle, transparent 0%, rgba(47,52,2,0.4) var(--flashlight-radius), black var(--flashlight-blur), black 100%);
        background-position: var(--flashlight-x-pos) var(--flashlight-y-pos);
        background-repeat: no-repeat;
        pointer-events: none;
    }

    #gg-flashlight-div::after {
        content: "";
        position: absolute;
        transform: translate(var(--flashlight-x-pos), var(--flashlight-y-pos));
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
    }

    #gg-lottery {
        position: absolute;
        top: 13%;
        left: 50%;
        font-size: 30px;
        color: white;
        text-shadow: ${bodyShadow};
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        background-color: rgba(0, 255, 0, 0.8);
        padding: 0.5em;
        border-radius: 10px;
    }

    #gg-lottery-counter-div {
        display: flex;
        justify-content: space-between;
    }

    #gg-lottery-counter {
        padding-left: 0.5em;
    }

    #gg-lottery-button {
        font-size: 25px;
        margin-top: 0.5em;
        border-radius: 10px;
        padding: 5px 20px;
        color: white;
        background: black;
        opacity: 75%;
        cursor: pointer;
    }
`;

GM_addStyle(style);

// -------------------------------------------------------------------------------------------------------------------------------
