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
// @grant        GM.xmlHttpRequest
// @grant        GM_xmlhttpRequest

// ==/UserScript==

/**
  USER NOTES
    - When loading, you may occasionally have to refresh the page once or twice.
    - You can disable the quotes if you want via the SHOW_QUOTES variable. Blackout screen is non-negotiable.
    - If things go super bad, press "Alt Shift ." (period is actually a > with Shift active). This will disable all mods and refresh the page.
/*

/**
  DEV NOTES
    - Shout-out to miraclewhips for geoguessr-event-framework and some essential functions in this script.
    - If you want to disable a mod, change 'show' to false for it in MODS.
    - Keep same configuration for all mods. Must add to _BINDINGS at the bottom of the file for any new mods.
    - MODS is a global variable that the script will modify. The saved state will override certain parts of it on each page load.
    - Past that, you're on your own. Use this for good.
*/

/** Google stuff
    - THIS IS OPTIONAL! Some mods use it but most do not.
    - The Google Maps API key allows for some specific functionality. It's complicated, but read through the code if you want.
    - You need to make your own API key if you want to use certain tools. https://developers.google.com/maps/documentation/javascript/get-api-key
    - This will require payment info via Google, but you will NOT be charged unless you exceed 10,000 API calls in a month, which is very unlikely.
    - You should restrict your API key to your personal computer(s). Look up how to do this, but at a minimum, do not show your key publicly.
    - Unless you are using specific mods intensely, you are not going to be anywhere near this limit. You can also check your usage on the Google Cloud Console.
        For example, the puzzle mod will make 4 API calls per movement. If you make 49 movements per round, which I don't know why you would do, that's 200 API calls, so 50 rounds will hit your API limit.
        It is possible to hit your limit, so keep an eye on https://console.cloud.google.com/apis/dashboard. If you are approaching 10k requests, stop using those mods unless you want to start paying.
        You can also swap in a different API key if you want. Google doesn't care about 10k requests, they care about 10M.
*/
const GOOGLE_MAPS_API_KEY = 'AIzaSyDUXpYTJjKCXy256sIdBQQMr2LvVj5d8Nk'; // Put yours here if you know what you're doing. This is restricted to Tpebop's computers, so you need your own.

// Mods available in this script.
// ===============================================================================================================================

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

    seizure: { // This one is disabled by default because it's a little insensitive and not safe for streaming. But try it if you want!
        show: false,
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
                default: 90,
                tooltip: 'Guess up to this many degrees latitude away from the target',
            },
            nDegLng: {
                label: 'Longitude margin (deg)',
                default: 180,
                tooltip: 'Guess up to this many degrees longitude away from the target',
            },

        },
    },

    puzzle: {
        show: !!GOOGLE_MAPS_API_KEY && false, // Not quite working yet :(
        key: 'puzzle',
        name: 'Puzzle',
        tooltip: 'Split up the large map into tiles and rearrange them randomly',
        options: {
            nRows: {
                label: '# Rows',
                default: 4,
                tooltip: 'How many tiles to split up the puzzle into vertically.',
            },
            nCols: {
                label: '# Columns',
                default: 4,
                tooltip: 'How many tiles to split up the puzzle into horizontally.',
            },
        },
    },

    // Miscellaneous display options that don't deserve a full button.
    displayOptions: {
        show: true,
        key: 'display-preferences',
        name: 'Display Preferences',
        tooltip: 'Various display options for page elements, colors, etc. Does not mess with gameplay.',
        options: {
            tidy: {
                label: 'Tidy mode',
                default: false,
                tooltip: 'Hides annoying page elements.',
            },
            blur: {
                label: 'Blur (px)',
                default: 0,
                tooltip: 'Blur radius in pixels of main view.',
            },
            colorMode: {
                label: 'Color Mode',
                default: 'normal',
                tooltip: 'Select color mode for the main view.',
                options: [ // Must update along with _COLOR_FILTERS.
                    'normal',
                    'grayscale',
                    'deuteranopia',
                    'tritanopia',
                    'dog',
                    'cat',
                    'sea lion',
                    'ant',
                    'octopus',
                ],
            },
        },
    },

};

// -------------------------------------------------------------------------------------------------------------------------------



// Debugging utilities.
// ===============================================================================================================================
// If true, add a right click listener to the guess map that will give you access to JS variables in your browser console.
// This also adds a right click listener to the "TPEBOP'S MODS" header because some mods block pointer events on the guess map.
const DEBUG = true;

const debugMap = (map, evt) => {
    debugger;
};

// -------------------------------------------------------------------------------------------------------------------------------




// Global state. Load from local storage if it exists. Values used in this script will be from this global variable after loading.
// ===============================================================================================================================

let GOOGLE_STREETVIEW, GOOGLE_MAP, GOOGLE_SVC; // Assigned in the google API portion of the script.
let PREV_GOOGLE_STREETVIEW_POV, PREV_GOOGLE_STREETVIEW_POSITION; // Stored state of streetview POV and position, used to detect if either has changed.s

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
        console.error(err);
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
let GG_GUESSMAP_BLOCKER; // Div that blocks events to the map. You can still open a debugger by right clicking the menu header.

let IS_DRAGGING_SMALL_MAP = false; // true when user is actively dragging the guessMap. Some of the map events conflict with others.

// On page load, show random quotes, jokes, facts, etc. The blackout screen cannot be turned off without changing code.
const SHOW_QUOTES = {
    inspirational: true,
    heavy: true, // I'll understand if you want to turn this one off.
    media: true, // From movies and stuff. Generally light-hearted.
    jokes: true,
    funFacts: true,
};

/**
  SCORE_FUNC is a function used to display the overlay that shows how well you clicked (score, direction, whatever).
  This can only be used by one mod at a time, so in mods that use it we have to use disableOtherScoreModes to disable the other ones.
  It uses GG_ROUND and GG_CLICK to determine how well you clicked. SCORE_FUNC can be globally set for the active mod.
  By default, it will give the 0-5000 score, but some mods override it.
*/
let SCORE_FUNC;

const UPDATE_CALLBACKS = {};

let _CHEAT_DETECTION = true; // true to perform some actions that will make it obvious that a user is using this mod pack.

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

const getBigMapContainer = () => {
    return document.querySelector(`div[class^="game_canvas__"]`);
};

const getBigMapCanvas = () => {
    const container = getBigMapContainer();
    if (!container) {
        return undefined;
    }
    return container.querySelector('.widget-scene-canvas');
};

const getGameControlsDiv = () => {
    return document.querySelector(`aside[class^="game_controls__"]`);
};

const getZoomControlsDiv = () => {
    return document.querySelector(`div[class^="guess-map_zoomControls__"]`);
};

const getGameStatusDiv = () => {
    return document.querySelector(`div[class^="game_status__"]`);
};

const getGameReactionsDiv = () => {
    return document.querySelector(`div[class^="game-reactions_root__"]`);
};

const getAllGmnoPrints = () => {
    return document.querySelectorAll('div[class^="gmnoprint"]');
};

const getAllGoogleMapsHotlinks = () => {
    return document.querySelectorAll('a[aria-label^="Open this area in Google Maps"]')
};

const getGuessButton = () => {
    return document.querySelector(`button[class^="button_button__"]`);
};

const getModDiv = () => {
    return document.getElementById('gg-mods-container');
};

const getOptionMenu = () => {
    return document.getElementById('gg-option-menu');
};

const getButtonID = (mod) => {
    return `gg-opt-${mod.key}`;
};

const getDropdownID = (mod, key) => { // Dropdown element for mod+option.
    return `${getButtonID(mod)}-${key}`;
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
    if (Array.isArray(value)) {
        return value[0]; // May add support for multiselect at some point, but not yet.
    }
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

const isArrayOption = (mod, key) => {
    if (!mod.options ||!mod.options[key]) {
        return false;
    }
    return Array.isArray(mod.options[key].options);
};

const makeOptionMenu = (mod) => {
    if (document.getElementById('gg-option-menu')) {
        return;
    }

    let menu = document.createElement('div');
    menu.id = 'gg-option-menu';

    const title = document.createElement('div');
    title.id = 'gg-option-title';
    title.innerHTML = `${mod.name} Options`;
    menu.appendChild(title);

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
        if (isArrayOption(mod, key)) {
            type = Array; // It's a string, but differentiate it here.
            input = document.createElement('select');
            input.id = getDropdownID(mod, key);
            for (const option of mod.options[key].options) {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                input.appendChild(optionElement);
            }
            Object.assign(input, { value, className: 'gg-option-input' });
        } else if (typeof defaultVal === 'number') {
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

        menu.appendChild(lineDiv);
    };

    const onReset = () => {
        for (const [key, type, input] of inputs) {
            input.value = getDefaultOption(mod, key);
        }
    };

    const onClose = () => {
        closeOptionMenu();
    };

    const onApply = () => {
        for (const [key, type, input] of inputs) {
            let value;
            if (type === Array) {
                const dropdown = document.querySelector(`#${getDropdownID(mod, key)}`);
                value = dropdown.value;
            }
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
    menu.appendChild(formDiv);
    modDiv.appendChild(menu);
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
            console.error(err);
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

const closeOptionMenu = () => {
    const menu = document.querySelector('#gg-option-menu');
    if (menu) {
        menu.parentElement.removeChild(menu);
    }
};

// -------------------------------------------------------------------------------------------------------------------------------




// Mod utility functions.
// ===============================================================================================================================

const getActualLoc = () => {
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
    GOOGLE_MAP.setCenter({ lat, lng });
    if (zoom != null && zoom !==currentZoom) {
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
    if (!GG_CLICK || !GG_ROUND) {
        return;
    }
    const actual = getActualLoc();
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
    container.style.pointerEvents = enabled ? 'auto' : 'none';
};

const shuffleArray = (arr, inPlace = false) => {
    const shuffled = inPlace ? arr : [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
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
    if (IS_DRAGGING_SMALL_MAP) {
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

    const bigMap = getBigMapContainer();

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

    const actual = getActualLoc();
    const smallMapContainer = getSmallMapContainer();

    if (IN_FRAME_INTERVAL) {
        clearInterval(IN_FRAME_INTERVAL);
    }

    if (active) {
        const showInFrame = () => {
            const currentBounds = getMapBounds();
            const inFrame = isInBounds(actual, currentBounds);
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

const removeLotteryDisplay = () => {
    if (LOTTERY_DISPLAY) {
        LOTTERY_DISPLAY.parentElement.removeChild(LOTTERY_DISPLAY);
        LOTTERY_DISPLAY = undefined;
    }
};

const makeLotteryDisplay = () => { // Make the div and controls for the lottery.
    removeLotteryDisplay();

    const container = document.createElement('div'); // Contains the full lottery display.
    container.id = 'gg-lottery';

    // Set up display for the lottery counter and button.
    const counterLabel = document.createElement('div'); // Text label.
    counterLabel.textContent = 'Tokens remaining:';
    const counter = document.createElement('div'); // How many guesses you have left, will update each click.
    counter.id = 'gg-lottery-counter';
    counter.innerText = LOTTERY_COUNT;
    const counterDiv = document.createElement('div'); // Contains the above two items side by side.
    counterDiv.id = 'gg-lottery-counter-div';
    counterDiv.appendChild(counterLabel);
    counterDiv.appendChild(counter);

    const button = document.createElement('button');
    button.id = 'gg-lottery-button';
    button.textContent = 'Insert token';

    container.appendChild(counterDiv);
    container.appendChild(button);
    document.body.appendChild(container);

    LOTTERY_DISPLAY = container;

    // Bind stuff.
    const onClick = () => {
        if (LOTTERY_COUNT === 0) {
            return;
        }
        const mod = MODS.lottery;
        const nDegLat = getOption(mod, 'nDegLat');
        const nDegLng = getOption(mod, 'nDegLng');
        const actual = getActualLoc();
        const minLat = actual.lat - nDegLat;
        const maxLat = actual.lat + nDegLat;

        // The logic gets confusing across the prime meridian with large lng ranges.
        // Just assume that [-180, 180] means the entire world's longitude. Should be fine.
        // There may be some flaws in the logic here, but it's okay for now.
        let minLng, maxLng;
        if (nDegLng === 180) {
            minLng = -180;
            maxLng = 180;
        } else {
            const normalizedLng = ((actual.lng + 180) % 360 + 360) % 360 - 180;
            minLng = normalizedLng - nDegLng;
            maxLng = normalizedLng + nDegLng;
        }
        const { lat, lng } = getRandomLoc(minLat, maxLat, minLng, maxLng);
        LOTTERY_COUNT -= 1;
        counter.innerText = LOTTERY_COUNT;
        clickAt(lat, lng);
        setMapCenter(lat, lng);
    };
    button.addEventListener('click', onClick);
};

const updateLottery = (forceState = null) => {
    const mod = MODS.lottery;
    const active = updateMod(mod, forceState);

    removeLotteryDisplay();
    LOTTERY_COUNT = getOption(mod, 'nGuesses');

    const smallMap = getSmallMap();
    if (active) {
        makeLotteryDisplay();
        setGuessMapEvents(false);
    } else {
        const container = document.querySelector(`#gg-lottery`);
        if (container) {
            container.parentElement.removeChild(container);
        }
        setGuessMapEvents(true);
    }
};

// -------------------------------------------------------------------------------------------------------------------------------



// MOD: Puzzle.
// ===============================================================================================================================

/**
  Unfortunately, we can't use the 3D canvas, so we recreate it as a 2D canvas to make the puzzle.
  This may make this mod unusable with some others. I haven't tested out every combination.
  This requires a GOOGLE_MAPS_API_KEY at the top to generate static tiles. Google blocks calls to render the webgl canvas as a 2d canvas.
  Ref: // ref: https://webdesign.tutsplus.com/create-an-html5-canvas-tile-swapping-puzzle--active-10747t
  Also, shit this was hard to figure out.
*/

// TODO
// - block tiling until first render.
// - add option to make to actual puzzle.
// - maybe disable moving and panning. Need to update note at top if so.

// https://developers.google.com/maps/documentation/tile/streetview#street_view_image_tiles
// https://developers.google.com/maps/documentation/javascript/coordinates#tile-coordinates

let CANVAS_2D; // canvas element that overlays the 3D one.
let CANVAS_2D_IS_REDRAWING = false; // If we're still redrawing the previous frame, this can brick the site.

let _PUZZLE_WIDTH;
let _PUZZLE_HEIGHT;
let _PUZZLE_TILE_WIDTH;
let _PUZZLE_TILE_HEIGHT;
let _PUZZLE_DRAGGING_TILE;
let _PUZZLE_CURRENT_DROP_TILE;
let _PUZZLE_TILES = [];
let _PUZZLE_HOVER_TINT = '#009900'; // Used for drag and drop formatting.
let _PUZZLE_IS_SOLVED = false; // TODO: what happens if it is solved on start?
let _PUZZLE_DRAGGING_IMG; // Draw tile as <img> element so it can be redrawn on the canvas while dragging tiles.
let _PUZZLE_DRAGGING_CANVAS; // Mini canvas to draw _PUZZLE_DRAGGING_IMG on.

let _STREETVIEW_LISTENER; // Listener to trigger redraw on moving, panning, or zooming. TODO: will this trigger too many redraws and potentially hit API limits?
let _CANVAS_2D_MOUSEMOVE; // Track all mouse movements on 2D canvas.
let _CANVAS_2D_MOUSE_LOC = { x: 0, y: 0 };

const addCanvas2dMousemove = () => {
    if (_CANVAS_2D_MOUSEMOVE) {
        return;
    }
    _CANVAS_2D_MOUSEMOVE = CANVAS_2D.addEventListener('mousemove', (evt) => {
        _CANVAS_2D_MOUSE_LOC.x = evt.offsetX - CANVAS_2D.offsetLeft;
        _CANVAS_2D_MOUSE_LOC.y = evt.offsetY - CANVAS_2D.offsetTop;
    });
};

const clearCanvas2d = () => {
    if (CANVAS_2D && _CANVAS_2D_MOUSEMOVE) {
        CANVAS_2D.removeListener(_CANVAS_2D_MOUSEMOVE);
        _CANVAS_2D_MOUSEMOVE = undefined;
    }
    if (CANVAS_2D && CANVAS_2D.parentElement) {
        CANVAS_2D.parentElement.removeChild(CANVAS_2D);
        CANVAS_2D = undefined;
    }
    if (_PUZZLE_DRAGGING_IMG) {
        _PUZZLE_DRAGGING_IMG.parentElement.removeChild(_PUZZLE_DRAGGING_IMG);
        _PUZZLE_DRAGGING_IMG = undefined;
    }
    if (_PUZZLE_DRAGGING_CANVAS) {
        _PUZZLE_DRAGGING_CANVAS.parentElement.removeChild(_PUZZLE_DRAGGING_CANVAS);
        _PUZZLE_DRAGGING_CANVAS = undefined;
    }
    CANVAS_2D = undefined;
};

/**
  Redraw the 3D canvas as a 2D canvas so we can mess around with it.
  We have to extract the image data from the 3D view using Google Maps API. They make it impossible to extract directly from that canvas.
  Return true if the canvas was redrawn, else false.
*/
async function drawCanvas2d() {
    CANVAS_2D_IS_REDRAWING = true;

    try {
        const loc = GOOGLE_STREETVIEW.getPosition();
        const lat = loc.lat();
        const lng = loc.lng();

        // We are going to take the original heading and pitch, and generate 4 images from it.
        // Would be nice to do this in one go, but the max resolution for free accounts is 640x640.
        // We will limit the dimensions of the stitched image to the screen size, whichever (width or height) is the limiter.
        // We then stitch those together on a 2D canvas, then we can mess with it.
        // ref: https://developers.google.com/maps/documentation/javascript/streetview
        const center = GOOGLE_STREETVIEW.getPov();
        const centerHeading = center.heading;
        const centerPitch = center.pitch;
        const zoom = center.zoom;
        const fov = 360 / Math.pow(2, zoom); // TODO: is this correct?
        const size = 640; // max size for Street View Static API.
        const offsetHeading = fov / 4; // How much to offset each quadrant from center.
        const offsetPitch = fov / 4; // How much to offset pitch up/down.

        // Define the 4 quadrants relative to current view.
        const quadrants = [
            {
                name: 'top-left',
                heading: centerHeading - offsetHeading,
                pitch: centerPitch + offsetPitch
            },
            {
                name: 'top-right',
                heading: centerHeading + offsetHeading,
                pitch: centerPitch + offsetPitch
            },
            {
                name: 'bottom-left',
                heading: centerHeading - offsetHeading,
                pitch: centerPitch - offsetPitch
            },
            {
                name: 'bottom-right',
                heading: centerHeading + offsetHeading,
                pitch: centerPitch - offsetPitch
            }
        ];

        const fetchImageBlob = (url) => {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({ // Requires GM_ or else it will hit a 403.
                    method: 'GET',
                    url: url,
                    responseType: 'blob',
                    onload: function(response) {
                        const blobUrl = URL.createObjectURL(response.response);
                        const img = new Image();
                        img.onload = () => {
                            URL.revokeObjectURL(blobUrl);
                            resolve(img);
                        };
                        img.onerror = reject;
                        img.src = blobUrl;
                    },
                    onerror: reject
                });
            });
        };

        const fetchTile = async (tileHeading, tilePitch, tileZoom) => {
            const url = `https://maps.googleapis.com/maps/api/streetview?size=${size}x${size}` +
                `&location=${lat},${lng}` +
                `&heading=${tileHeading}` +
                `&pitch=${tilePitch}` +
                `&zoom-${tileZoom}` +
                `&fov=90` +
                `&key=${GOOGLE_MAPS_API_KEY}`;
            return await fetchImageBlob(url);
        };

        const tilesToFetch = quadrants.map(quadrant => [quadrant.heading, quadrant.pitch, zoom]);
        const tilePromises = [];
        for (const tileToFetch of tilesToFetch) {
            tilePromises.push(fetchTile(tileToFetch[0], tileToFetch[1], tileToFetch[2]));
        }
        const images = await Promise.all(tilePromises);

        clearCanvas2d();
        const canvas3d = getBigMapCanvas();
        CANVAS_2D = document.createElement('canvas');
        CANVAS_2D.id = 'gg-big-canvas-2d';
        CANVAS_2D.width = canvas3d.width;
        CANVAS_2D.height = canvas3d.height;

        // Put 2D canvas on top of 3D and allow pointer events to the 3D. This is up here so we can watch it draw the canvas in debug mode.
        const mapParent = canvas3d.parentElement.parentElement;
        mapParent.insertBefore(CANVAS_2D, mapParent.firstChild);
        CANVAS_2D_IS_REDRAWING = false;
        addCanvas2dMousemove()

        // Draw 2x2 grid. Sadly, we're limited to a square image with a maximum resolution. Google made it impossible to clone the 3D canvas with CORS restrictions.
        // TODO: need to rescale to window size, whichever dimension is the limiting one.
        const ctx = CANVAS_2D.getContext('2d');
        ctx.clearRect(0, 0, CANVAS_2D.width, CANVAS_2D.height);
        ctx.drawImage(images[0], 0, 0, size, size); // Top left.
        ctx.drawImage(images[1], size, 0, size, size); // Top right.
        ctx.drawImage(images[2], 0, size, size, size); // Bottom left.
        ctx.drawImage(images[3], size, size, size, size); // Bottom right.

        if (!_STREETVIEW_LISTENER) {
            _STREETVIEW_LISTENER = GOOGLE_STREETVIEW.addListener('position_changed', () => { // TODO: needs zoom and pan.
                drawCanvas2d(_STREETVIEW_LISTENER, GOOGLE_MAPS_API_KEY);
            });
        }

    } catch (err) {
        console.error(err);
        CANVAS_2D_IS_REDRAWING = false;
        clearCanvas2d();
    }
}

const scatterCanvas2d = (nRows, nCols) => {
    const ctx2d = CANVAS_2D.getContext('2d');
    const tileWidth = CANVAS_2D.width / nCols;
    const tileHeight = CANVAS_2D.height / nRows;

    // Split 2D image into tiles.
    const tiles = [];
    for (let row = 0; row < nRows; row++) {
        for (let col = 0; col < nCols; col++) {
            const sx = col * tileWidth;
            const sy = row * tileHeight;
            const tile = ctx2d.getImageData(sx, sy, tileWidth, tileHeight);
            tiles.push({ imageData: tile, sx, sy, originalRow: row, originalCol: col });
        }
    }

    // Scramble the tiles and draw on the 2D canvas.
    // TODO: something is still messed up with the scaling here. Some tiles are showing parts of other tiles. Might be related to FOV.
    _PUZZLE_TILES = shuffleArray(tiles);
    const locations = Object.values(_PUZZLE_TILES).map(tile => { return { sx: tile.sx, sy: tile.sy } });
    for (const tile of tiles) {
        const newLoc = locations.pop();
        Object.assign(tile, newLoc);
    }

    // Remove the original pasted image and redraw as scrambled tiles.
    ctx2d.clearRect(0, 0, CANVAS_2D.width, CANVAS_2D.height);
    for (const tile of _PUZZLE_TILES) {
        const { imageData, sx, sy } = tile;
        if (!imageData) {
            console.error('No image data loaded yet.');
            return undefined;
        }
        ctx2d.putImageData(imageData, sx, sy);
    }

    return {
        tileWidth,
        tileHeight,
        tiles,
    };
};

// TODO: something is fucked up here
const pasteToDraggingImage = () => { // Used for showing the tile image while dragging.
    if (!_PUZZLE_DRAGGING_TILE) {
        return;
    }
    if (!_PUZZLE_DRAGGING_CANVAS) {
        _PUZZLE_DRAGGING_CANVAS = document.createElement('canvas');
    }
    if (!_PUZZLE_DRAGGING_IMG) {
        _PUZZLE_DRAGGING_IMG = document.createElement('img');
    }
    const ctx2d = _PUZZLE_DRAGGING_CANVAS.getContext('2d');
    const imageData = _PUZZLE_DRAGGING_TILE.imageData;
    _PUZZLE_DRAGGING_CANVAS.width = imageData.width;
    _PUZZLE_DRAGGING_CANVAS.height = imageData.height;
    ctx2d.putImageData(imageData, 0, 0);
    _PUZZLE_DRAGGING_IMG.src = _PUZZLE_DRAGGING_CANVAS.toDataURL();
};

// TODO: something is fucked up here
const updatePuzzleTiles = () => {
    if (!CANVAS_2D || !_PUZZLE_DRAGGING_TILE) {
        return; // User has not clicked yet. Mouse movements are tracked after first click.
    }
    const ctx = CANVAS_2D.getContext('2d');

    _PUZZLE_CURRENT_DROP_TILE = null;
    ctx.clearRect(0, 0, _PUZZLE_WIDTH, _PUZZLE_HEIGHT); // TODO: remove?
    pasteToDraggingImage();
    for (const tile of _PUZZLE_TILES) {
        if (tile === _PUZZLE_DRAGGING_TILE) {
            continue;
        }
        ctx.drawImage(
            _PUZZLE_DRAGGING_IMG,
            tile.sx,
            tile.sy,
            _PUZZLE_TILE_WIDTH,
            _PUZZLE_TILE_HEIGHT,
            tile.sx,
            tile.sy,
            _PUZZLE_TILE_WIDTH,
            _PUZZLE_TILE_HEIGHT
        );
        _PUZZLE_CURRENT_DROP_TILE = getCurrentMouseTile();
        if (!_PUZZLE_CURRENT_DROP_TILE) {
            return;
        }
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = _PUZZLE_HOVER_TINT;
        ctx.fillRect(
            _PUZZLE_CURRENT_DROP_TILE.sx,
            _PUZZLE_CURRENT_DROP_TILE.sy,
            _PUZZLE_TILE_WIDTH,
            _PUZZLE_TILE_HEIGHT
        );
        ctx.restore();
    }
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.drawImage(
        _PUZZLE_DRAGGING_IMG,
        _PUZZLE_DRAGGING_TILE.sx,
        _PUZZLE_DRAGGING_TILE.sy,
        _PUZZLE_TILE_WIDTH,
        _PUZZLE_TILE_HEIGHT,
        _CANVAS_2D_MOUSE_LOC .x - _PUZZLE_TILE_WIDTH / 2,
        _CANVAS_2D_MOUSE_LOC .y - _PUZZLE_TILE_HEIGHT / 2,
        _PUZZLE_TILE_WIDTH,
        _PUZZLE_TILE_HEIGHT,
    );
    ctx.restore();
};

// TODO: something is fucked up here
const onDropTile = (evt) => { // When mouse is released, drop the dragged tile at the location, and swap them.
    if (!_PUZZLE_DRAGGING_TILE || !_PUZZLE_CURRENT_DROP_TILE) {
        console.error('Drag or drop tile is missing.');
        _PUZZLE_DRAGGING_TILE = null;
        _PUZZLE_CURRENT_DROP_TILE = null;
        return;
    }
    const tmp = {
        sx: _PUZZLE_DRAGGING_TILE.sx,
        sy: _PUZZLE_DRAGGING_TILE.sy
    };
    _PUZZLE_DRAGGING_TILE.sx = _PUZZLE_CURRENT_DROP_TILE.sy;
    _PUZZLE_DRAGGING_TILE.sy = _PUZZLE_CURRENT_DROP_TILE.sy;
    _PUZZLE_CURRENT_DROP_TILE.sx = tmp.sx;
    _PUZZLE_CURRENT_DROP_TILE.sy = tmp.sy;

    _PUZZLE_DRAGGING_TILE = undefined;
    _PUZZLE_CURRENT_DROP_TILE = undefined;

    // checkSolved(); // TODO
    console.log('tile dropped');
};

const getCurrentMouseTile = () => { // Tile that the mouse is currently over. Doesn't matter if user is dragging a tile or not.
    if (!_CANVAS_2D_MOUSE_LOC || !_PUZZLE_TILES) {
        return null;
    }
    const { x, y } = _CANVAS_2D_MOUSE_LOC;
    if (x == null || y == null) {
        return null;
    }
    for (const tile of _PUZZLE_TILES) {
        const leftX = tile.sx;
        const rightX = leftX + tile.imageData.width;
        const topY = tile.sy;
        const bottomY = topY + tile.imageData.height;
        if (x >= leftX && x <= rightX && y >= topY && y <= bottomY) {
            return tile;
        }
    }
    return null;
};

// TODO: something is fucked up here. Deletes the tile
const onPuzzleClick = () => {
    if (!CANVAS_2D) {
        drawCanvas2d(); // TODO: this is sloppy
    }
    const ctx = CANVAS_2D.getContext('2d');

    _PUZZLE_DRAGGING_TILE = getCurrentMouseTile();
    if (!_PUZZLE_DRAGGING_TILE) {
        console.error('Failed to get drag tile.'); // TODO
        return;
    }
    pasteToDraggingImage();

    if (_PUZZLE_DRAGGING_TILE) {
        ctx.clearRect(
            _PUZZLE_DRAGGING_TILE.sx,
            _PUZZLE_DRAGGING_TILE.sy,
            _PUZZLE_TILE_WIDTH,
            _PUZZLE_TILE_HEIGHT,
        );
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.drawImage(
            _PUZZLE_DRAGGING_IMG,
            _PUZZLE_DRAGGING_TILE.sx,
            _PUZZLE_DRAGGING_TILE.sy,
            _PUZZLE_TILE_WIDTH,
            _PUZZLE_TILE_HEIGHT,
            _CANVAS_2D_MOUSE_LOC .x - _PUZZLE_TILE_WIDTH / 2,
            _CANVAS_2D_MOUSE_LOC .y - _PUZZLE_TILE_HEIGHT / 2,
            _PUZZLE_TILE_WIDTH,
            _PUZZLE_TILE_HEIGHT,
        );
        ctx.restore();
        document.onpointermove = updatePuzzleTiles; // TODO: these should be on the canvas, not the document.
        document.onpointerup = onDropTile;
    }
};

// TODO: something is fucked up here
async function updatePuzzle(forceState = null) {
    const mod = MODS.puzzle;
    const active = updateMod(mod, forceState);

    clearCanvas2d();

    if (!active) {
        if (_STREETVIEW_LISTENER) {
            const google = getGoogle();
            google.maps.event.clearListeners(_STREETVIEW_LISTENER, 'position_changed'); // TODO: other listeners
            _STREETVIEW_LISTENER = undefined;
        }
        return;
    }

    const nRows = getOption(mod, 'nRows');
    const nCols = getOption(mod, 'nCols');

    async function makePuzzle() {
        await drawCanvas2d();
        const scattered = scatterCanvas2d(nRows, nCols);
        if (!scattered) {
            return;
        }
        _PUZZLE_TILES = scattered.tiles;
        _PUZZLE_TILE_WIDTH = scattered.tileWidth;
        _PUZZLE_TILE_HEIGHT = scattered.tileHeight;
    };

    await makePuzzle();

    if (!CANVAS_2D) {
        console.error(`Canvas is not loaded yet. Can't initiate puzzle.`);
        updateMod(mod, false);
        return;
    }

    _STREETVIEW_LISTENER = CANVAS_2D.addEventListener('load', makePuzzle);

    const ctx = CANVAS_2D.getContext('2d');

    const checkSolved = () => { // TODO: decide how to handle when puzzle is solved.
        const solved = false;
        if (solved) {
            document.onpointerdown = null;
            document.onpointermove = null;
            document.onpointerup = null;
        }
    }

    document.onpointerdown = onPuzzleClick; // TODO: should be canvas only.

};

// -------------------------------------------------------------------------------------------------------------------------------




// MOD: Display options
// ===============================================================================================================================

const _updateTidy = (mod) => {
    const showTidy = getOption(mod, 'tidy');

    const toToggle = [
        getGameControlsDiv(),
        getZoomControlsDiv(),
        getGameStatusDiv(),
        getGameReactionsDiv(),
        getAllGmnoPrints(),
        getAllGoogleMapsHotlinks(),
        getGuessButton(),
    ];
    for (const searchResult of toToggle) {
        if (!searchResult) { // Not found at all.
            continue;
        }
        if (searchResult.length !== null && searchResult.length === 0) { // querySelectorAll returned empty.
            continue;
        }
        const divs = searchResult.length ? searchResult : [searchResult]; // Node or NodeList.
        for (const div of divs) {
            if (showTidy) {
                if (div.classList.toString().includes('sv-links-control')) { // Don't hide the moving arrows.
                    continue;
                }
                div.classList.add('hidden');
            } else {
                div.classList.remove('hidden');
            }
        }
    };
};

const _BASE_COLOR_FILTER = Object.freeze({ // Available filter options for big map. Copy and update this Object to make new modes.
    blur: undefined,
    brightness: undefined,
    contrast: undefined,
    saturate: undefined,
    grayscale: undefined,
    sepia: undefined,
    'hue-rotate': undefined,
    invert: undefined,
    opacity: undefined,
    'drop-shadow': undefined,
});

const _COLOR_FILTERS = {
    grayscale: {
        grayscale: '100%',
    },
    deuteranopia: {
        'hue-rotate': '-20deg',
        saturate: '60%',
        contrast: '120%',
        sepia: '12%',
        brightness: '105%',
    },
    tritanopia: {
        'hue-rotate': '35deg',
        saturate: '50%',
        contrast: '135%',
        sepia: '20%',
        brightness: '115%',
    },
    dog: {
        'hue-rotate': '62deg',
        saturate: '38%',
        contrast: '88%',
        sepia: '22%',
        brightness: '94%',
        blur: '0.5px',
    },
    cat: {
        'hue-rotate': '50deg',
        saturate: '25%',
        contrast: '75%',
        sepia: '22%',
        brightness: '150%',
        sepia: '15%',
        blur: '0.3px',
    },
    'sea lion': {
        'hue-rotate': '200deg',
        saturate: '10%',
        contrast: '115%',
        sepia: '40%',
        brightness: '80%',
        blur: '1px',
    },
    ant: {
        'hue-rotate': '-40deg',
        saturate: '250%',
        contrast: '180%',
        brightness: '130%',
        blur: '0.8px',
        invert: '20%',
    },
    octopus: {
        saturate: '0%',
        contrast: '250%',
        brightness: '85%',
        blur: '0.1px',
        'drop-shadow': '0 0 3px rgba(255,255,255,0.4)',
    }

};

const getFilterStr = (mod) => { // Get string that can be applied to streetview canvas filters.
    const activeFilter = Object.assign({}, _BASE_COLOR_FILTER); // The actual styling that will be applied to the canvas.
    const activeColorMode = getOption(mod, 'colorMode');
    const enabledFilter = _COLOR_FILTERS[activeColorMode] || {};
    if (activeColorMode) {
        Object.assign(activeFilter, enabledFilter);
    }
    /**
      If blur is defined and not 0, apply it on top of the other visual mods, even if they have blur defined.
      Might want to revisit this logic later. For now, the other ones don't implement blur. Maybe set to -1 or something.
    */
    const blurNumber = getOption(mod, 'blur');
    if (blurNumber > 0) {
        activeFilter.blur = `${blurNumber}px`;
    }
    let filterStr = '';
    for (const [key, value] of Object.entries(activeFilter)) {
        if (value == null) {
            continue
        }
        filterStr += `${key}(${value})` ; // Requires units in value.
    }
    filterStr = filterStr.trim();
    return filterStr;
};

const updateDisplayOptions = (forceState = null) => {
    const mod = MODS.displayOptions;
    const active = updateMod(mod, forceState);

    _updateTidy(mod);

    let filterStr = '';
    if (active) {
        filterStr = getFilterStr(mod);
    }
    const canvas3d = getBigMapCanvas();
    canvas3d.style.filter = filterStr;
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
    [MODS.puzzle, updatePuzzle],
    [MODS.displayOptions, updateDisplayOptions],
];

const closePopup = (evt) => { // Always close the popup menu when disabling a mod.

};

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
        // If option menu is open, close it. If enabling a mod, open the option menu.
        button.addEventListener('click', () => {
            closeOptionMenu(); // Synchronous.
            setTimeout(callback, 0); // Async, must happen after closing menu.
        });
    }
};

const addButtons = () => { // Add mod buttons to the active round, with a little button to toggle them.
	const bigMapContainer = getBigMapContainer();
    const modContainer = getModDiv(); // Includes header and buttons.
	if (!bigMapContainer || modContainer) { // Page not loaded, or modContainer is already rendered.
        return;
    }

    const modsContainer = document.createElement('div'); // Header and buttons.
    modsContainer.id = 'gg-mods-container';

    const headerContainer = document.createElement('div'); // Header and button toggle.
    headerContainer.id = 'gg-mods-header-container';
    const headerText = document.createElement('div');
    headerText.id = 'gg-mods-header';
    headerText.textContent = `TPEBOP'S MODS`;
    const modMenuToggle = document.createElement('button');
    modMenuToggle.id = 'gg-mods-container-toggle';
    modMenuToggle.textContent = '▼'; // TODO: load from localStorage.
    headerContainer.appendChild(headerText);
    headerContainer.appendChild(modMenuToggle);

    const buttonContainer = document.createElement('div'); // Mod buttons.
    buttonContainer.id = 'gg-mods-button-container';

    for (const mod of Object.values(MODS)) {
        if (!mod.show) {
            continue;
        }
        const modButton = document.createElement('div');
        modButton.id = getButtonID(mod);
        modButton.classList.add('gg-mod-button');
        modButton.title = mod.tooltip;
        modButton.textContent = getButtonText(mod);
        buttonContainer.appendChild(modButton);
    }

    modsContainer.appendChild(headerContainer);
    modsContainer.appendChild(buttonContainer);
	bigMapContainer.appendChild(modsContainer);
	bindButtons();

    modMenuToggle.addEventListener('click', function() {
        if (buttonContainer.classList.contains('hidden')) {
            buttonContainer.classList.remove('hidden');
            modMenuToggle.textContent = '▼';
        } else {
            buttonContainer.classList.add('hidden');
            modMenuToggle.textContent = '▶';
        }
    });
};

// -------------------------------------------------------------------------------------------------------------------------------



// C hee tah blockers.
// ===============================================================================================================================

// The goal of this is to fuck up the r eplay file and distract the user by blacking out the screen for the first second or two and clicking around.
// Should make it obvious in the repl ay and stream if someone is using this mod pack.
// Coders could figure it out if they want, but with compiled code and intentional obfuscation here, it will be difficult.
// Credit to Bennett Foddy for assembling several of these quotes and for a few himself, from my favorite game (Getting Over It with Bennett Foddy).
// Use the — character (dash, not hyphen) to apply a quote credit, which will show up as a smaller text under the quote.

const _QUOTES = {

    inspirational: [
        `It is in falling short of your own goals that you will surpass those who exceed theirs. — Tokugawa Ieyasu`,
        `If you love life, do not waste time- for time is what life is made up of — Bruce Lee`,
        `Don't let the fear of the time it will take to accomplish something stand in the way of doing it. The time will pass anyway... — Earl Nightingale`,
        `Spend so much time on the improvement of yourself that you have no time to criticize others — Christian Larson`,
        `This too shall pass. — Unknown`,
        `No one can make you feel inferior without your consent — Eleanor Roosevelt`,
        `Never interrupt your enemy when he is making a mistake. — Napoleon Bonaparte`,
        `The magic you are looking for is in the work you are avoiding — Unknown`,
        `The grass is greenest where you water it — Unknown`,
        `People fear what they don't understand and hate what they can't conquer — Andrew Smith`,
        `Be who you needed when you were younger. — Unknown`,
        `A ship in harbor is safe, but that is not what ships are built for. — John A. Shedd`,
        `There is no hopeless situation, only hopeless people. — Atatürk`,
        `And those who were seen dancing were thought to be insane by those who could not hear the music. — Friedrich Nietzsche`,
        `There are no regrets in life, just lessons. — Jennifer Aniston`,
        `You must be the change you wish to see in the world. — Mahatma Gandhi`,
        `Don’t count the days, make the days count. — Muhammad Ali`,
        `I have not failed. I've just found 10,000 ways that won't work. — Thomas Edison`,
        `Don’t watch the clock. Do what it does. Keep going. — Sam Levenson`,
        `The best way to predict the future is to create it. — Peter Drucker`,
        `Do not go where the path may lead, go instead where there is no path and leave a trail. — Ralph Waldo Emerson`,
        `Those who mind don't matter, those who matter don't mind. — Dr. Seuss`,
        `Never stop never stopping.`,

        /** Turning these off for now because I don't know if bias toward certain languages would be an issue, and I can't do every language. Safer to just do English until I think about it more.

        // German.
        `Träume nicht dein Leben, sondern lebe deinen Traum.`,
        `Auch der weiteste Weg beginnt mit einem ersten Schritt. — Laozi`
        `Man entdeckt keine neuen Erdteile, ohne den Mut zu haben, alte Küsten aus den Augen zu verlieren. — André Gide`,
        `Es ist nicht wenig Zeit, die wir haben, sondern es ist viel Zeit, die wir nicht nutzen. — Seneca`

        // Polish.
        `Największą mądrością jest umieć cieszyć się chwilą. — Stanisław Lem`,
        `Lepiej zapalić świecę, niż przeklinać ciemność. — Jerzy Popiełuszko`,

        */
    ],

    heavy: [
        `This thing that we call failure is not the falling down, but the staying down. — Mary Pickford`,
        `The soul would have no rainbow had the eyes no tears. — John Vance Cheney`,
        `The pain I feel now is the happiness I had before. That's the deal. — C.S. Lewis`,
        `I feel within me a peace above all earthly dignities, a still and quiet consciences. — William Shakespeare`,
        `You cannot believe now that you'll ever feel better. But this is not true. You are sure to be happy again. Knowing this, truly believing it, will make you less miserable now. — Abraham Lincoln`,
        `Do not stand at my grave and cry, I am not there, I did not die. — Mary Frye`,
        `To live is to suffer. To survive is to find meaning in the suffering. — Friedrich Nietzsche`,
        `Of all sad words of tongue or pen, the saddest are these, 'It might have been. — John Greenleaf Whittier`,
        `If you try to please audiences, uncritically accepting their tastes, it can only mean that you have no respect for them. — Andrei Tarkovsky`,
        `In the end… We only regret the chances we didn’t take. — Lewis Carroll`,
        `There’s no feeling more intense than starting over. Starting over is harder than starting up. — Bennett Foddy`,
        `Imaginary mountains build themselves from our efforts to climb them, and it's our repeated attempts to reach the summit that turns those mountains into something real. — Bennett Foddy`,
        `Be yourself. Everyone else is already taken. — Oscar Wilde`,
        `Whether you think you can or you think you can’t, you’re right. — Henry Ford`,
        `The only true wisdom is in knowing you know nothing. — Socrates`,
        `Painting is silent poetry, and poetry is painting that speaks. — Plutarch`,
        `Muddy water is best cleared by leaving it alone. — Alan Watts`,
        `Do not go gentle into that good night. Old age should burn and rave at close of day. Rage, rage against the dying of the light. — Dylan Thomas`,
        `You can be mad as a mad dog at the way things went. You could swear, and curse the fates. But when it comes to the end, you have to let go. — Benjamin Button`,
        `It's a funny thing about comin' home. Looks the same, smells the same, feels the same. You'll realize what's changed is you. — Benjamin Button`,
        `Do you consider your big toe to be your pointer toe or your thumb toe? — Tpebop`,
    ],

    media: [ // Funny, light-hearted, or from movies/TV/celebrities. Some of the heavy stuff is also from media, but they belong in the heavy section.
        `Don't hate the player. Hate the game. — Ice-T`,
        `I came here to chew bubblegum and kick [butt], and I'm all out of bubblegum — Roddy Piper`,
        `That rug really tied the room together. — The Dude`,
        `If you don't know what you want, you end up with a lot you don't. — Tyler Durden`,
        `Do. Or do not. There is no try. — Yoda`,
        `Big Gulps, huh? Alright! Welp, see ya later! — Lloyd Christmas`,
        `You are tearing me apart, Lisa! — Johnny (Tommy Wiseau)`,
        `I'm Ron Burgundy? — Ron Burgundy`,
        `You're out of your element, Donny! — Walter Sobchak`,
        `I have had it with these [gosh darn] snakes on this [gosh darn] plane — Neville Flynn`,
        `Welcome to CostCo. I love you. — Unknown (2505)`,
        `Brawndo's got what plants crave. It's got electrolytes. — Secretary of State (2505)`,
        `So you're telling me there's a chance! — Lloyd Christmas`,
        `I am serious, and don't call me Shirley. — Steve McCroskey`,
        `What is this, a center for ants? ... The center has to be at least three times bigger than this. — Derek Zoolander`,
        `Did we just become best friends? YUP!! — Dale Doback, Brennan Huff`,
        `I said "A" "L" "B" "U" .... .... "QUERQUE" — Weird Al`,
        `Badgers? Badgers? We don't need no stinking badgers! — Raul Hernandez`,
        `Time to deliver a pizza ball! — Eric Andre`,
    ],

    jokes: [
        `When birds fly in V-formation, one side is usually longer. Know why? That side has more birds on it.`,
        `I broke my leg in two places. My doctor told me to stop going to those places.`,
        `Why do birds fly south in the winter? Because it's too far to walk.`,
        `Orion's Belt is a massive waist of space.`,
        `Do your shoes have holes in them? No? Then how did you get your feet in them?`,
        `A magician was walking down the street. Then he turned into a grocery store.`,
        `Why do scuba divers fall backward off the boat? If they fell forward, they'd still be in the boat.`,
        `Did the old lady fall down the well because she didn't see that well, or that well because she didn't see the well?`,
        `In the vacuum of space, no one can hear you get mad at your GeoGuessr game.`,
    ],

    funFacts: [
        `Sloths can hold their breath longer than dolphins.`,
        `Koalas have fingerprints so similar to humans that they can confuse crime scene investigators.`,
        `The pistol shrimp snaps its claw so fast it creates a bubble hotter than the surface of the sun.`,
        `Dogs' nose prints are as unique as human fingerprints.`,
        `Sharks existed before trees.`,
        `Jupiter has the shortest day of any planet in our solar system.`,
        `There are more permutations of a deck of playing cards than stars in the obervable universe. Like, a lot more.`,
        `Earth would turn into a black hole if condensed into a 0.87cm radius.`,
        `Elephants have about 3 times as many neurons as humans.`,
        `Scientists simulated a fruit fly brain fully. This has 140k neurons (humans have 86 billion)`,
        `On average, Mercury is closer to Earth than Venus.`,
        `The Jamaican flag is the only country flag that does not contain red, white, or blue.`,
        `Nintendo was founded before the fall of the Ottoman Empire.`,
        `The fax machine was invented before the telephone.`,
        `The Titanic sank before the invention of sunscreen.`,
        `The first transatlantic telephone call was the same year that Winnie-the-Pooh was published (1926)`,
        `The first moon landing was 66 years after the first Wright brothers' flight of 12 seconds.`,
        `A cheap Casio watch or an Arduino Uno have the computing power of the first lunar lander. $10-$20.`,
        `The inventor of the glue used in Post-Its intended to make a very strong glue but accidentally made a very weak glue.`,
        `Popsicles were invented by an 11-year-old.`,
    ],

};

// Can be configured toward the top of the file. If you don't like jokes or something.
const _QUOTES_FLAT = [];
for (const [key, value] of Object.entries(SHOW_QUOTES)) {
    if (value) {
        const quotesThisCategory = _QUOTES[key];
        if (!quotesThisCategory) {
            continue;
        }
        _QUOTES_FLAT.push(...quotesThisCategory);
    }
}

const getRandomQuote = () => {
    if (!SHOW_QUOTES || !_QUOTES_FLAT.length) {
        return 'Loading...';
    }
    const ix = Math.floor(Math.random() * _QUOTES_FLAT.length);
    const quote = _QUOTES_FLAT[ix];
    return quote;
};

/** Split the quote and the author into a String[]. Must include the dash character to split it. */
const splitQuote = (quote) => {
    const parts = quote.split('—').map(part => part.trim());
    return parts;
};

let _CHEA_T_OVERLAY; // Div to block view.

const clearCh_eatOverlay = () => {
    if (_CHEA_T_OVERLAY) {
        _CHEA_T_OVERLAY.parentElement.removeChild(_CHEA_T_OVERLAY);
        _CHEA_T_OVERLAY = undefined;
    }
};

let _CH_EA_AT_DE_TE_CT_IO_N = 'on your honor';

window.addEventListener('load', () => {
    if (_CH_EA_AT_DE_TE_CT_IO_N || !_CH_EA_AT_DE_TE_CT_IO_N) {
        // Yeah, yeah. If you made it this far in the c ode, you can c h eat if you really want. You'll get caught.
    }
    clearCh_eatOverlay();
    const che_atOverlay = document.createElement('div'); // Opaque black div that covers everything while the page loads.
    Object.assign(che_atOverlay.style, { // Intentionally not in C SS to make it harder for people to figure out.
        height: '100vh',
        width: '100vw',
        background: 'black',
        'z-index': '99999999',
    });
    const quoteDiv = document.createElement('div');
    const quote = getRandomQuote();
    let parts;
    try {
        parts = splitQuote(quote);
    } catch (err) {
        console.error(err);
        parts = [quote];
    }
    Object.assign(quoteDiv.style, { // Style for div that contains quote and author. Again, done via JS to obfuscate the code.
        position: 'absolute',
        top: '50%',
        left: '50%',
        'font-size': '60px',
        color: 'white',
        transform: 'translate(-50%, -50%)',
        'pointer-events': 'none',
        display: 'flex',
        'flex-direction': 'column',
        'text-align': 'center',
        'align-items': 'center',
    });
    const quoteStyle = { // Styling for just the quote.
        'font-size': '40px',
    };
    const authorStyle = { // Styling for just the author.
        'margin-top': '10px',
        'font-size': '20px',
    };
    for (const [ix, part] of Object.entries(parts)) {
        const div = document.createElement('div');
        if (Number(ix) === parts.length - 1 && parts.length > 1) {
            div.innerText = '— ' + part;
            Object.assign(div.style, authorStyle);
        } else {
            div.innerText = part;
            Object.assign(div.style, quoteStyle);
        }
        quoteDiv.appendChild(div);
    }

    // On page load, black out everything. Then, we listen for the google map load event, add a time buffer, and remove it after that.
    // We have to have the map loaded to do the anti-c_h_eat clicks. This is done down below in the map load event bubble.
    che_atOverlay.appendChild(quoteDiv);
    _CHEA_T_OVERLAY = document.body.insertBefore(che_atOverlay, document.body.firstChild);

    // Other measures are taken, but no matter what we can't let this div brick thie entire site,
    //   e.g. if they change the URL naming scheme. Race condition with map loading, but so be it.
    setTimeout(clearCh_eatOverlay, 3000);
});

/**
  Click around the map *after* it is loaded and idle, and the screen is blacked out.
  This will be a callback in the google maps section of this script.
  This will completely mess up the repl ay file. We have 1 second to do this.
  Always end with a click at { lat: 0, lng: 0 }. This will be extremely obvious in r eplays, both for streaming and the actual re play files.
  This function is sloppy, but it doesn't really matter as long as we screw up the repl ay.
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
            console.log(`Tpebop's mods initialized.`);
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

_CHEAT_DETECTION = true; // I freaking dare you.

const _getIsCheatingOrMaybeNotCheating = () => {
    const t = 30,
          e = Math.floor(0.5 * t),
          n = Math.floor(0.3 * t),
          r = t - e - n;
    const a = new Set();
    while (a.size < 8) {
        const x = Math.floor(100 * Math.random()) + 1;
        if (x !== 4 && x % 10 === 4) a.add(x);
    }
    const i = new Set();
    while (i.size < 4) {
        const y = Math.floor(9 * Math.random()) + 1;
        if (y !== 4) i.add(y);
    }
    const s = new Set();
    while (s.size < 16) {
        const z = Math.floor(100 * Math.random()) + 1;
        if (z !== 4 && z % 10 !== 4 && !a.has(z) && !i.has(z)) s.add(z);
    }

    let hash = r * Math.random() * Date.now();
    const cheaterStr = r.toString();
    for (let i = 0; i < cheaterStr.length; i++) {
        hash ^= cheaterStr.charCodeAt(i);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    const cheaterHash = (hash >>> 0).toString(16);

    if (!_CHEAT_DETECTION) {
        window.alert(`No cheating, user ${cheaterHash}!`);
    }

    const o = [...a, ...i, ...s];
    for (let _ = o.length - 1; _ > 0; _--) {
        const e = Math.floor(Math.random() * (_ + 1));
        [o[_], o[e]] = [o[e], o[_]];
    }
    return cheaterHash << o;
};

const _YOURE_LOOKING_AT_MY_CODE = (v) => {
    try {
        const a = (function () {
            return function (b) {
                const c = typeof b;
                const d = b === null;
                const madeYouLook = _getIsCheatingOrMaybeNotCheating;
                const e = [
                    () => Boolean(c.match(/.+/)),
                    () => [null, undefined, NaN, 0, '', false].includes(b),
                    () => new Set(madeYouLook()).has([...Array(5)].map((_,i) => i).filter(x => x < 5).reduce((a,b) => a + (b === 0 ? 0 : 1), 0) + ([] + [])[1] || +!![] + +!![] + +!![] + +!![]),
                    () => Object.is(b, null)
                ];
                for (let f = 0; f < e.length; f++) {
                    void e[f]();
                }
                const g = !!(d && !1 || !0 && !0 || !0);
                const h = new Proxy({}, {
                    get: () => () => g
                });
                return h.x()() ? 'A' : 'B';
            };
        })();
        const i = a(v);
        [...'x'].forEach(j => j.charCodeAt(0) * Math.random());
        return i === 'A' || (!!(void (+(~(1 << 30) & (1 >> 1) | (([] + [])[1] ?? 0)))));
    } catch (k) {
        return false;
    }
};

document.addEventListener('DOMContentLoaded', (event) => {

    if (!_CHEAT_DETECTION) {
        return; // Get outta 'ere
    }

    if (_YOURE_LOOKING_AT_MY_CODE()) {
        return; // Get outta 'ere
    }

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
                    setTimeout(clearCh_eatOverlay, 1000);
                    clickGarbage(900);
				});
                google.maps.event.addListener(this, 'dragstart', () => {
					IS_DRAGGING_SMALL_MAP = true;
				});
                google.maps.event.addListener(this, 'dragend', () => {
					IS_DRAGGING_SMALL_MAP = false;
				});
                google.maps.event.addListener(this, 'click', (evt) => {
					onMapClick(evt);
				});

                if (DEBUG) {
                    this.addListener('contextmenu', (evt) => { // Add right click listener to guess map for debugging.
                        debugMap(this, evt);
                    });
                    const modHeader = document.querySelector('#tpebops-mods-header');
                    if (modHeader) {
                        modHeader.addEventListener('contextmenu', (evt) => {
                            evt.preventDefault();
                            debugMap(this, evt);
                        });
                    }
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

	document.addEventListener('keydown', (evt) => {
		if (document.activeElement.tagName === 'INPUT') {
            return;
        }
        if (evt.key === ',' && GOOGLE_MAP && !isActive(MODS.zoomInOnly)) {
            GOOGLE_MAP.setZoom(GOOGLE_MAP.getZoom() - 0.6);
        }
        if (evt.key === '.' && GOOGLE_MAP) {
            GOOGLE_MAP.setZoom(GOOGLE_MAP.getZoom() + 0.6);
        }

        // Nuclear option to disable all mods if things get out of control.
        if (evt.altKey && evt.shiftKey && evt.key === '>') {
            clearState();
            window.location.reload();
        }
	});

});

loadState();

const observer = new MutationObserver(() => { // TODO: this gets called way too much.
	addButtons();
    // I think this is an anti-c h eat method from Geoguessr. It's annoying, so it's gone.
    const reactionsDiv = getGameReactionsDiv();
    if (reactionsDiv) {
        reactionsDiv.parentElement.removeChild(reactionsDiv);
    }
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

    .hidden {
        display: none !important;
    }

    #gg-mods-container {
        position: absolute;
        top: 40px;
        left: 20px;
        z-index: 9;	display: flex;
        flex-direction: column;
        min-width: 175px;
    }

    #gg-mods-header-container {
        display: flex;
        align-items: center;
        font-size: 18px;
        justify-content: space-between;
    }

    #gg-mods-header {
        font-weight: bold;
        text-shadow: ${headerShadow};
        position: relative;
    }

    #gg-mods-container-toggle {
        padding: 0;
        font-size: 16px;
        cursor: pointer;
        text-shadow: ${headerShadow};
    }

    #gg-mods-button-container {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 10px;
    }

    .gg-mod-button {
        background: var(--ds-color-purple-100);
        border-radius: 5px;
        font-size: 14px;
        cursor: pointer;
        opacity: 0.9;
        transition: opacity 0.2s;
        padding: 4px 10px;
    }

    .gg-mod-button:hover {
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
        min-width: 70px;
        max-width: 100px;
        height: 25px;
        border-radius: 20px;
        margin: 5px 0;
        border: none;
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
        background-color: rgba(0, 100, 0, 0.8);
        padding: 0.5em;
        border-radius: 10px;
        z-index: 9999;
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

    #gg-guessmap-blocker {
        width: 100%;
        height: 100%;
        position: absolute;
        pointer-events: none;
        z-index: 99999999;
    }

`;

GM_addStyle(style);

// -------------------------------------------------------------------------------------------------------------------------------


/**
  TPEBOP'S NOTES
  - Look into https://gitlab.com/nonreviad/extenssr/-/tree/main/src?ref_type=heads this is some legit stuff and can be a Chrome extension.
  - https://openuserjs.org/scripts/drparse/GeoFilter/source for messing around with colors and crap.
  - Figure out if it's detecting scripts; it's randomly triggering emotes.
*/