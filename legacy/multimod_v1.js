// ==UserScript==
// @name         Tpebop's Geoguessr MultiMod V1
// @description  Various mods to make the game interesting in various ways
// @version      1.0
// @author       tpebop
// @match        *://*.geoguessr.com/*
// @icon         https://www.google.com/s2/favicons?domain=geoguessr.com
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        GM.xmlHttpRequest
// @updateURL    https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/multimod_v1.js
// @downloadURL  https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/multimod_v1.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/gg_evt.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/gg_quotes.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/gg_coordinate_extractor.js

// ==/UserScript==


/**
  TECHNICAL DEBT
   - Sometimes the click events are being blocked on the button menu, but then it works if you refresh.
   - Tiles remaining thing stays on pages that it shouldn't.
*/


/**
  USER NOTES
    - Sadly, you have to disable ad blockers for this to work. I tried so hard to allow them, but it blocks stuff at a level that I can't undo with TamperMonkey. Sorry.
    - When loading, you may occasionally have to refresh the page once or twice.
    - You can disable the quotes if you want via the SHOW_QUOTES variable. Blackout screen is non-negotiable, it's needed to make sure everything loads.
    - If things go super bad, press "Alt Shift ." (period is actually a > with Shift active). This will disable all mods and refresh the page.
    - If you want to toggle a mod, change 'show' to true or false for it in MODS.
    - Opera browser compatibility: Due to WebGL limitations, Opera uses raster map rendering instead of vector rendering. Therefore, certain mods might be disabled in Opera.
/*

/**
  DEV NOTES
    - Shout-out to miraclewhips for geoguessr-event-framework and some essential functions in this script.
    - Keep same configuration for all mods. Must add to _BINDINGS at the bottom of the file for any new mods.
    - MODS is a global variable that the script will modify. The saved state will override certain parts of it on each page load.
    - Past that, you're on your own. Use this for good.
*/

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

    zoomInOnly: { // This one is alright, but just not really good content quality. Try it out if you want!
        show: false,
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
        show: false, // Doesn't work in duels.
        key: 'in-frame',
        name: 'Show In-Frame',
        tooltip: 'Shows if the location is in or out of your current guess map view.',
        scoreMode: true,
        options: {},
    },

    lottery: {
        show: false, // This is broken for duels. Need lat lng for the margins.
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
        show: false, // Almost working...
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

    tileReveal: {
        show: true,
        key: 'tile-reveal',
        name: 'Tile Reveal',
        tooltip: 'Overlay big map with tiles and you can click to reveal them.',
        options: {
            nRows: {
                label: '# Rows',
                default: 4,
                tooltip: 'How many rows of tiles for you to select from.',
            },
            nCols: {
                label: '# Columns',
                default: 4,
                tooltip: 'How many columns of titles for you to select from.',
            },
            nClicks: {
                label: 'Max. clicks',
                default: 4,
                tooltip: 'How many tiles you are allowed to reveal for a given round.',
            },
        },
    },

    displayOptions: { // Miscellaneous display options that don't deserve a full button.
        show: true, // Broken in duels.
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
                    'black and white',
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

    scratch: {
        show: false, // Used for dev work.
        key: 'scratch',
        name: 'Show Scratch',
        tooltip: 'For dev.',
        scoreMode: false,
        options: {},
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
let GG_LOC; // This is intercepted from Google Maps API. It contains the lat, lng, and countryCode.
let GG_MAP; // Current map info.
let GG_CLICK; // { lat, lng } of latest map click.
let GG_CUSTOM_MARKER; // Custom marker. This is not the user click marker. Can only use one at a time. Need to clear/move when used.
let GG_GUESSMAP_BLOCKER; // Div that blocks events to the map. You can still open a debugger by right clicking the menu header.

let _IS_DRAGGING_SMALL_MAP = false; // true when user is actively dragging the guessMap. Some of the map events conflict with others.

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
  It uses GG_ROUND, GG_LOC, and GG_CLICK to determine how well you clicked. SCORE_FUNC can be globally set for the active mod.
  By default, it will give the 0-5000 score, but some mods override it.
*/
let SCORE_FUNC;

const UPDATE_CALLBACKS = {};

let _CHEAT_DETECTION = true; // true to perform some actions that will make it obvious that a user is using this mod pack.
let _MODS_LOADED = false;

// -------------------------------------------------------------------------------------------------------------------------------




// DOM and state utility functions.
// ===============================================================================================================================

const _tryMultiple = (selectors) => { // Different modes, different versions, GeoGuessr changing around stuff, etc.
    let element;
    for (const selector of selectors) {
        element = document.querySelector(selector);
        if (element) {
            return element;
        }
    }
    return null;
};

const getGoogle = () => { // Used to interact with the panorama and mini-map.
    return window.google || unsafeWindow.google;
};

const isOperaBrowser = () => { // Check if current browser is Opera (has WebGL/Vector rendering issues)
    return (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
};

const getTicketBar = () => { // Top header.This shows up for unregistered players to display that they need an account.
    return document.querySelector('div[class^="ticket-bar-view_"]');
};

const getGGHeader = () => { // GG icon header in upper left.
    return document.querySelector('img[alt="GeoGuessr"]');
};

const getNonProHeader = () => { // Header that shows for non-pro accounts.
    return document.querySelector('div[class^="ticket-bar-view_root__"]');
};

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
    const selectors = [
        `div[class^="game_canvas__"]`,
        `#panorama-container`,
    ];
    return _tryMultiple(selectors);
};

const getBigMapCanvas = () => {
    const container = getBigMapContainer();
    if (!container) {
        return undefined;
    }
    return container.querySelector('.widget-scene-canvas');
};

const getGameControlsDiv = () => {
    const selectors = [
        `aside[class^="game_controls__"]`,
        `aside[class^="game-panorama_controls__"]`,
    ];
    return _tryMultiple(selectors);
};

const getZoomControlsDiv = () => {
    return document.querySelector(`div[class^="guess-map_zoomControls__"]`);
};

const getGameStatusDiv = () => {
    return document.querySelector(`div[class^="game_status__"]`);
};

const getGameReactionsDiv = () => {
    const selectors = [
        `div[class^="game-reactions_root__"]`,
        `div[class^="chat-input_root__"]`,
    ];
    return _tryMultiple(selectors);
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

const getModButtonId = (mod) => {
    return `gg-opt-${mod.key}`;
};

const getDropdownID = (mod, key) => { // Dropdown element for mod+option.
    return `${getModButtonId(mod)}-${key}`;
};

const getButtonText = (mod) => {
    const active = mod.active;
    const text = `${active ? 'Disable ' : 'Enable '} ${mod.name}`;
    return text;
};

const getModButton = (mod) => {
    return document.querySelector(`#${getModButtonId(mod)}`);
};

const isModActive = (mod) => {
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
    if (!mod.options || !mod.options[key]) {
        return false;
    }
    return Array.isArray(mod.options[key].options);
};

let _OPTION_MENU;
let _OPTION_MENU_DRAGGING = false;
let _OPTION_MENU_DRAGGING_MOUSEDOWN;
let _OPTION_MENU_DRAGGING_MOUSEMOVE;
let _OPTION_MENU_DRAGGING_MOUSEUP;
let _OPTION_MENU_DRAGGING_OFFSET_X; // Needed for offsetting the drag element from the client.
let _OPTION_MENU_DRAGGING_OFFSET_Y;

const makeOptionMenu = (mod) => {
    if (document.getElementById('gg-option-menu')) {
        return;
    }

    let _OPTION_MENU = document.createElement('div');
    _OPTION_MENU.id = 'gg-option-menu';

    /* eslint-disable no-return-assign */
    _OPTION_MENU_DRAGGING_MOUSEDOWN = _OPTION_MENU.addEventListener('mousedown', (evt) => {
        _OPTION_MENU_DRAGGING = true;
        _OPTION_MENU_DRAGGING_OFFSET_X = evt.clientX - _OPTION_MENU.offsetLeft;
        _OPTION_MENU_DRAGGING_OFFSET_Y = evt.clientY - _OPTION_MENU.offsetTop;
    });
    _OPTION_MENU_DRAGGING_MOUSEMOVE = _OPTION_MENU.addEventListener('mousemove', (evt) => {
        _OPTION_MENU_DRAGGING && (
            _OPTION_MENU.style.left = evt.clientX - _OPTION_MENU_DRAGGING_OFFSET_X + 'px', _OPTION_MENU.style.top = evt.clientY - _OPTION_MENU_DRAGGING_OFFSET_Y + 'px');
    });
    _OPTION_MENU_DRAGGING_MOUSEUP = _OPTION_MENU.addEventListener('mouseup', (evt) => {
        _OPTION_MENU_DRAGGING = false;
        _OPTION_MENU_DRAGGING_OFFSET_X = undefined;
        _OPTION_MENU_DRAGGING_OFFSET_Y = undefined;
    });
    /* eslint-enable no-return-assign */

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

        _OPTION_MENU.appendChild(lineDiv);
    };

    const onReset = () => {
        for (const key of Object.entries(mod.options)) {
            setOption(mod, key, getDefaultOption(mod, key));
        }
        input.value = getDefaultOption(mod, key);
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
    _OPTION_MENU.appendChild(formDiv);
    modDiv.appendChild(_OPTION_MENU);
};

const updateMod = (mod, forceState = null) => {
    if (!_MODS_LOADED) {
        return;
    }

    const previousState = isModActive(mod);
    const newState = forceState != null ? forceState : !previousState;

    // If there are configurable options for this mod, open a popup.
    if (newState && !forceState) {
        const options = mod.options;
        if (options && typeof options === 'object' && Object.keys(options).length) {
            makeOptionMenu(mod);
        }
    }

    mod.active = newState;
    getModButton(mod).textContent = getButtonText(mod);

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

const disableMods = (mods, forceHide = false) => {
    if (!Array.isArray(mods)) {
        mods = [mods];
    }
    for (const mod of mods) {
        try {
            updateMod(mod, false);
            if (forceHide) {
                mod.show = false;
            }
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
        return;
    }
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
    const heading = ((nDegrees % 360) + 360) % 360;
    GOOGLE_MAP.setHeading(heading);
};

const doRotation = (nDegrees) => {
    if (_IS_DRAGGING_SMALL_MAP) {
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
    GOOGLE_MAP.setOptions({ restriction: restriction, minZoom: zoom });
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
        body.removeEventListener('mousemove', FLASHLIGHT_MOUSEMOVE);
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
        const actual = getActualLoc();
        const heading = getHeading(GG_CLICK, actual);
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

let _LOTTERY_DISPLAY; // Display elements for lottery mod. (counter and button).
let _LOTTERY_COUNT; // How many remaining guesses you have.
let _LOTTERY_DRAGGING = false; // Makes lottery display draggable because it overlaps the menu.

const removeLotteryDisplay = () => {
    if (_LOTTERY_DISPLAY) {
        _LOTTERY_DISPLAY.parentElement.removeChild(_LOTTERY_DISPLAY);
        _LOTTERY_DISPLAY = undefined;
    }
};

const makeLotteryDisplay = () => { // Make the div and controls for the lottery.
    removeLotteryDisplay();

    const container = document.createElement('div'); // Contains the full lottery display.
    container.id = 'gg-lottery';

    /* eslint-disable no-return-assign */
    container.onmousedown = () => _LOTTERY_DRAGGING = true;
    document.onmousemove = (evt) => _LOTTERY_DRAGGING && (container.style.left = evt.clientX - 50 + 'px', container.style.top = evt.clientY - 25 + 'px');
    document.onmouseup = () => _LOTTERY_DRAGGING = false;
    /* eslint-enable no-return-assign */

    // Set up display for the lottery counter and button.
    const counterLabel = document.createElement('div'); // Text label.
    counterLabel.textContent = 'Tokens remaining:';
    const counter = document.createElement('div'); // How many guesses you have left, will update each click.
    counter.id = 'gg-lottery-counter';
    counter.innerText = _LOTTERY_COUNT;
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

    _LOTTERY_DISPLAY = container;

    // Bind stuff.
    const onClick = () => {
        if (_LOTTERY_COUNT === 0) {
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
        _LOTTERY_COUNT -= 1;
        counter.innerText = _LOTTERY_COUNT;
        clickAt(lat, lng);
        setMapCenter(lat, lng);
    };
    button.addEventListener('click', onClick);
};

// Set lottery-specific map interaction mode (allow zoom/pan, block clicks)
const setLotteryMapMode = (enabled = true) => {
    const container = getSmallMapContainer();
    if (!container) return;
    
    if (enabled) {
        // Lottery mode: allow zoom/pan but block clicks
        container.style.pointerEvents = 'auto';
        
        // Remove any existing lottery overlay
        const existingOverlay = container.querySelector('.gg-lottery-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        // Add lottery-specific overlay that only intercepts click events
        const overlay = document.createElement('div');
        overlay.className = 'gg-lottery-overlay';
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            background: transparent;
            z-index: 1000;
        `;
        
        // Only enable pointer events for specific interactions we want to block
        overlay.addEventListener('click', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
        }, true);
        
        // Override the click behavior at the container level instead of using overlay
        container.addEventListener('click', (evt) => {
            // Block clicks that would place markers
            evt.preventDefault();
            evt.stopPropagation();
            console.log('GeoGuessr MultiMod: Lottery mode blocked map click');
        }, true);
        
        // Store reference to the click handler so we can remove it later
        container._lotteryClickHandler = (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            console.log('GeoGuessr MultiMod: Lottery mode blocked map click');
        };
        
        container.appendChild(overlay);
    } else {
        // Normal mode: remove lottery overlay and click handler
        container.style.pointerEvents = 'auto';
        const overlay = container.querySelector('.gg-lottery-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        // Remove the click handler
        if (container._lotteryClickHandler) {
            container.removeEventListener('click', container._lotteryClickHandler, true);
            delete container._lotteryClickHandler;
        }
    }
};

const updateLottery = (forceState = null) => {
    const mod = MODS.lottery;
    const active = updateMod(mod, forceState);

    removeLotteryDisplay();

    const smallMap = getSmallMap();
    if (active) {
        // Reset lottery count to the configured number of guesses
        _LOTTERY_COUNT = getOption(mod, 'nGuesses');
        
        // Always show the display when mod is active
        makeLotteryDisplay();
        setLotteryMapMode(true); // Enable lottery mode (zoom/pan allowed, clicks blocked)
    } else {
        const container = document.querySelector(`#gg-lottery`);
        if (container) {
            container.parentElement.removeChild(container);
        }
        setLotteryMapMode(false); // Restore normal map mode
    }
};

// Function to handle round start events for the lottery mod
const onLotteryRoundStart = () => {
    const mod = MODS.lottery;
    if (isModActive(mod)) {
        // Reset lottery count for new round
        _LOTTERY_COUNT = getOption(mod, 'nGuesses');
        
        // Remove existing display and create new one
        removeLotteryDisplay();
        makeLotteryDisplay();
        
        // Update the counter display
        const counter = document.getElementById('gg-lottery-counter');
        if (counter) {
            counter.innerText = _LOTTERY_COUNT;
        }
        
        console.log('GeoGuessr MultiMod: Lottery reset for new round, tokens:', _LOTTERY_COUNT);
    }
};

// Function to handle round end events for the lottery mod
const onLotteryRoundEnd = () => {
    const mod = MODS.lottery;
    if (isModActive(mod)) {
        // Hide the display when round ends
        removeLotteryDisplay();
        console.log('GeoGuessr MultiMod: Lottery display hidden for round end');
    }
};

// Monitor for round changes to show/hide lottery display appropriately
const monitorRoundStateForLottery = () => {
    let lastRoundState = typeof GG_ROUND !== 'undefined' && GG_ROUND;
    
    setInterval(() => {
        const mod = MODS.lottery;
        if (!isModActive(mod)) return;
        
        const currentRoundState = typeof GG_ROUND !== 'undefined' && GG_ROUND;
        
        // Round just started
        if (!lastRoundState && currentRoundState) {
            onLotteryRoundStart();
        }
        // Round just ended
        else if (lastRoundState && !currentRoundState) {
            onLotteryRoundEnd();
        }
        
        lastRoundState = currentRoundState;
    }, 1000); // Check every second
};

// Start monitoring when this module loads
if (typeof GG_ROUND !== 'undefined') {
    monitorRoundStateForLottery();
} else {
    // If GG_ROUND isn't defined yet, wait a bit and try again
    setTimeout(() => {
        if (typeof GG_ROUND !== 'undefined') {
            monitorRoundStateForLottery();
        }
    }, 2000);
}

// -------------------------------------------------------------------------------------------------------------------------------



// MOD: Puzzle.
// ===============================================================================================================================

/**
  Unfortunately, we can't use the 3D canvas, so we recreate it as a 2D canvas to make the puzzle.
  This may make this mod unusable with some others. I haven't tested out every combination.
  This requires a GOOGLE_MAPS_API_KEY at the top to generate static tiles. Google blocks calls to render the webgl canvas as a 2d canvas.
  Ref: https://webdesign.tutsplus.com/create-an-html5-canvas-tile-swapping-puzzle--active-10747t
  Also, shit this was hard to figure out.
*/

// TODO
// - add option to make to actual puzzle.
// - disable moving and panning and zooming. Need to update note at top.
// - what happens if it's solved on start? reshuffle automatically?
// - make able to restore original 3d state.
// - clean up unused shit.

let CANVAS_2D; // 2D canvas element that overlays the 3D one.
let CANVAS_2D_IS_REDRAWING = false; // If we're still redrawing the previous frame, this can brick the site.

let _PUZZLE_WIDTH;
let _PUZZLE_HEIGHT;
let _PUZZLE_TILE_WIDTH;
let _PUZZLE_TILE_HEIGHT;
let _PUZZLE_DRAGGING_TILE;
let _PUZZLE_CURRENT_DROP_TILE;
let _PUZZLE_TILES = [];
let _PUZZLE_HOVER_TINT = '#009900'; // Used for drag and drop formatting.
let _PUZZLE_IS_SOLVED = false;
let _PUZZLE_DRAGGING_IMG; // Draw tile as <img> element so it can be redrawn on the canvas while dragging tiles.
let _PUZZLE_DRAGGING_CANVAS; // Mini canvas to draw _PUZZLE_DRAGGING_IMG on.

let _CANVAS_2D_MOUSEDOWN; // Pointer down listener.
let _CANVAS_2D_MOUSEUP; // Pointer up listener.
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

const getTileSize = () => { // TODO: way to adjust this to window size?
    return {
        width: 512, // Google Street View tiles are 512x512. Maximum is 640x640.
        height: 512,
    };
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
  We have to extract the image data from the 3D view using Google Maps API.
  They make it impossible to extract directly from that canvas.
*/
async function drawCanvas2d() {
    CANVAS_2D_IS_REDRAWING = true;

    try {
        const loc = GOOGLE_STREETVIEW.getPosition();
        const lat = loc.lat();
        const lng = loc.lng();
        const pov = GOOGLE_STREETVIEW.getPov();
        const zoom = pov.zoom; // TODO: where is it getting the actual zoom level from?

        // TODO: is this correct? Maybe need to scale the canvas on screen size or something? Or max it out, puzzle will be unsolvable if stuff goes off screen.
        // Calculate tile dimensions based on zoom level
        const tileSize = getTileSize();
        const nCols = Math.ceil(Math.pow(2, zoom + 1));
        const nRows = Math.ceil(Math.pow(2, zoom));

        clearCanvas2d();
        const canvas3d = getBigMapCanvas();
        CANVAS_2D = document.createElement('canvas');
        CANVAS_2D.id = 'gg-big-canvas-2d';
        CANVAS_2D.width = nCols * tileSize.width;
        CANVAS_2D.height = nRows * tileSize.height;
        const ctx2d = CANVAS_2D.getContext('2d');
        const panoID = GOOGLE_STREETVIEW.getPano();

        const loadedTiles = [];
        let tilesLoaded = 0;
        const totalTiles = nCols * nRows;

        const loadTile = (x, y) => { // Load single tile at row x, column y.
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    const drawX = x * tileSize.width;
                    const drawY = y * tileSize.height;
                    ctx2d.drawImage(img, drawX, drawY);
                    tilesLoaded++;
                    // console.log(`Loaded tile ${x},${y} (${tilesLoaded}/${totalTiles})`); // Kept for debugging.
                    resolve();
                };
                img.onerror = (err) => {
                    reject(new Error(`Failed to load tile ${x},${y}`));
                };

                // Zoom Level 0: 360 degrees of the panorama. 1: 180 deg. 2: 90 deg. 3: 45 deg.
                const fovZoom = 3;
                const tileUrl = `https://streetviewpixels-pa.googleapis.com/v1/tile?cb_client=apiv3&panoid=${panoID}&output=tile&x=${x}&y=${y}&zoom=${fovZoom}&nbt=1&fover=2`;
                img.src = tileUrl;
            });
        };

        // Load all tiles.
        const tilePromises = [];
        for (let y = 0; y < nRows; y++) {
            for (let x = 0; x < nCols; x++) {
                tilePromises.push(loadTile(x, y));
            }
        }
        await Promise.all(tilePromises);

        // Put 2D canvas on top of 3D and block pointer events to the 3D. This is up here so we can watch it draw the canvas in debug mode.
        const mapParent = canvas3d.parentElement.parentElement;
        mapParent.insertBefore(CANVAS_2D, mapParent.firstChild);
        CANVAS_2D_IS_REDRAWING = false;
        addCanvas2dMousemove()
    } catch (err) {
        console.error(err);
        CANVAS_2D_IS_REDRAWING = false;
        clearCanvas2d();
    }
}

const scatterCanvas2d = (nRows, nCols) => { // TODO: can maybe deal with width and height here.
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

const pasteToDraggingImage = () => { // Paste image to temporary small canvas for dragging animation.
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
    _PUZZLE_DRAGGING_IMG.src = _PUZZLE_DRAGGING_CANVAS.toDataURL(); // TODO: not working.
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

const onDropTile = (evt) => { // When mouse is released, drop the dragged tile at the location, and swap them.
    if (!_PUZZLE_DRAGGING_TILE || !_PUZZLE_CURRENT_DROP_TILE) {
        console.error('Drag or drop tile is missing.');
        _PUZZLE_DRAGGING_TILE = null;
        _PUZZLE_CURRENT_DROP_TILE = null;
        return;
    }

    // Swap the x and y indices of the dragging tile and the dropping tile.
    const tmp = {
        sx: _PUZZLE_DRAGGING_TILE.sx,
        sy: _PUZZLE_DRAGGING_TILE.sy
    };
    _PUZZLE_DRAGGING_TILE.sx = _PUZZLE_CURRENT_DROP_TILE.sx;
    _PUZZLE_DRAGGING_TILE.sy = _PUZZLE_CURRENT_DROP_TILE.sy;
    _PUZZLE_CURRENT_DROP_TILE.sx = tmp.sx;
    _PUZZLE_CURRENT_DROP_TILE.sy = tmp.sy;

    // Draw the drag tile in the drop spot, and vice versa.
    const ctx2d = CANVAS_2D.getContext('2d');
    const tileSize = getTileSize();

    let toDrawOnDrop; // imageData that we are going to draw on the tile that we drop on.
    let toDrawOnDrag; // imageData for the tile we dragged from.

    if (_PUZZLE_DRAGGING_TILE === _PUZZLE_CURRENT_DROP_TILE) { // Dropped within the same tile as it was dragged from.
        toDrawOnDrag = _PUZZLE_DRAGGING_IMG; // We dropped on the same tile we dragged from.
        toDrawOnDrop = null; // No need to draw it twice.
    } else {
        toDrawOnDrag = ctx2d.getImageData(
            _PUZZLE_CURRENT_DROP_TILE.sx, _PUZZLE_CURRENT_DROP_TILE.sy, tileSize.width, tileSize.height).data;
        toDrawOnDrop = _PUZZLE_DRAGGING_IMG;
    }

    // Always have to redraw the drag tile.
    ctx2d.drawImage(
        toDrawOnDrag,
        _PUZZLE_DRAGGING_TILE.sx,
        _PUZZLE_DRAGGING_TILE.sy,
        _PUZZLE_TILE_WIDTH,
        _PUZZLE_TILE_HEIGHT,
        _PUZZLE_DRAGGING_TILE.sy,
        _PUZZLE_TILE_WIDTH,
        _PUZZLE_TILE_HEIGHT,
    );

    // Have to redraw the drop tile only if it is different than the drag tile.
    if (toDrawOnDrop) {
        ctx2d.drawImage(
            toDrawOnDrop,
            _PUZZLE_CURRENT_DROP_TILE.sx,
            _PUZZLE_CURRENT_DROP_TILE.sy,
            _PUZZLE_TILE_WIDTH,
            _PUZZLE_TILE_HEIGHT,
            _PUZZLE_CURRENT_DROP_TILE.sx,
            _PUZZLE_CURRENT_DROP_TILE.sy,
            _PUZZLE_TILE_WIDTH,
            _PUZZLE_TILE_HEIGHT,
        );
    }

    _PUZZLE_DRAGGING_TILE = undefined;
    _PUZZLE_CURRENT_DROP_TILE = undefined;

    // checkSolved(); // TODO
};

const onPuzzleMousemove = () => {
    if (!CANVAS_2D || !_PUZZLE_DRAGGING_TILE) {
        return; // User has not clicked yet. Mouse movements are tracked after first click.
    }
    const ctx2d = CANVAS_2D.getContext('2d');

    _PUZZLE_CURRENT_DROP_TILE = undefined;
    for (const tile of _PUZZLE_TILES) {
        if (tile === _PUZZLE_DRAGGING_TILE) {
            continue;
        }
        ctx2d.drawImage(
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
        ctx2d.save();
        ctx2d.globalAlpha = 0.4;
        ctx2d.fillStyle = _PUZZLE_HOVER_TINT;
        ctx2d.fillRect(
            _PUZZLE_CURRENT_DROP_TILE.sx,
            _PUZZLE_CURRENT_DROP_TILE.sy,
            _PUZZLE_TILE_WIDTH,
            _PUZZLE_TILE_HEIGHT
        );
        ctx2d.restore();
    }
    ctx2d.save();
    ctx2d.globalAlpha = 0.6;
    ctx2d.drawImage(
        _PUZZLE_DRAGGING_IMG,
        _PUZZLE_DRAGGING_TILE.sx,
        _PUZZLE_DRAGGING_TILE.sy,
        _PUZZLE_TILE_WIDTH,
        _PUZZLE_TILE_HEIGHT,
        _CANVAS_2D_MOUSE_LOC.x - _PUZZLE_TILE_WIDTH / 2,
        _CANVAS_2D_MOUSE_LOC.y - _PUZZLE_TILE_HEIGHT / 2,
        _PUZZLE_TILE_WIDTH,
        _PUZZLE_TILE_HEIGHT,
    );
    ctx2d.restore();
};

const removeCanvas2dListeners = () => {
    if (!CANVAS_2D) {
        return;
    }
    if (_CANVAS_2D_MOUSEDOWN) {
        CANVAS_2D.removeEventListener(_CANVAS_2D_MOUSEDOWN);
    }
    if (_CANVAS_2D_MOUSEMOVE) {
        CANVAS_2D.removeEventListener(_CANVAS_2D_MOUSEMOVE);
    }
    if (_CANVAS_2D_MOUSEUP) {
        CANVAS_2D.removeEventListener(_CANVAS_2D_MOUSEUP);
    }
};

const addCanvas2dListeners = () => {
    if (!CANVAS_2D) {
        return;
    }
    removeCanvas2dListeners();
    _CANVAS_2D_MOUSEDOWN = CANVAS_2D.addEventListener('pointerup', _CANVAS_2D_MOUSEDOWN);
    _CANVAS_2D_MOUSEMOVE = CANVAS_2D.addEventListener('mousemove', _CANVAS_2D_MOUSEDOWN);
    _CANVAS_2D_MOUSEUP = CANVAS_2D.addEventListener('pointerup', _CANVAS_2D_MOUSEDOWN);
};

const onPuzzleClick = () => {
    _PUZZLE_DRAGGING_TILE = getCurrentMouseTile();
    _PUZZLE_CURRENT_DROP_TILE = _PUZZLE_DRAGGING_TILE; // Always same on initial click.
    pasteToDraggingImage(); // Paste clicked tile to draggable canvas.

    const ctx2d = CANVAS_2D.getContext('2d');
    if (_PUZZLE_DRAGGING_TILE) {
        ctx2d.clearRect(
            _PUZZLE_DRAGGING_TILE.sx,
            _PUZZLE_DRAGGING_TILE.sy,
            _PUZZLE_TILE_WIDTH,
            _PUZZLE_TILE_HEIGHT,
        );
        ctx2d.save();
        ctx2d.globalAlpha = 0.9;
        ctx2d.drawImage(
            _PUZZLE_DRAGGING_IMG,
            _PUZZLE_DRAGGING_TILE.sx,
            _PUZZLE_DRAGGING_TILE.sy,
            _PUZZLE_TILE_WIDTH,
            _PUZZLE_TILE_HEIGHT,
            _CANVAS_2D_MOUSE_LOC.x - _PUZZLE_TILE_WIDTH / 2,
            _CANVAS_2D_MOUSE_LOC.y - _PUZZLE_TILE_HEIGHT / 2,
            _PUZZLE_TILE_WIDTH,
            _PUZZLE_TILE_HEIGHT,
        );
        ctx2d.restore();
        CANVAS_2D.onpointermove = onPuzzleMousemove; // TODO: what happens if dropped on a button or mini map or something?
        CANVAS_2D.onpointerup = onDropTile;
    }
};

async function updatePuzzle(forceState = null) {
    const mod = MODS.puzzle;
    const active = updateMod(mod, forceState);

    clearCanvas2d();

    if (!active) {
        return;
    }

    const nRows = getOption(mod, 'nRows');
    const nCols = getOption(mod, 'nCols');

    async function makePuzzle() {
        try {
            await drawCanvas2d();
        } catch (err) {
            console.error(err);
            return;
        }
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

    const ctx = CANVAS_2D.getContext('2d');

    const checkSolved = () => { // TODO: decide how to handle when puzzle is solved.
        const solved = false;
        if (solved) {
            document.onpointerdown = null;
            document.onpointermove = null;
            document.onpointerup = null;
        }
    }

    CANVAS_2D.onpointerdown = onPuzzleClick;

};

// -------------------------------------------------------------------------------------------------------------------------------




// MOD: Tile reveal.
// ===============================================================================================================================

let _TILE_COUNT_DISPLAY; // Div for showing the number of remaining tiles.
let _TILE_COUNT; // How many remaining tiles the user has.
let _TILE_COUNT_DRAGGING = false;
let _TILE_COUNT_OFFSET_X = 0;
let _TILE_COUNT_OFFSET_Y = 0;

const getTileCount = () => {
    if (_TILE_COUNT == null) {
        _TILE_COUNT = getOption(MODS.tileReveal, 'nClicks');
    }
    _TILE_COUNT = Math.round(Number(_TILE_COUNT));
    if (isNaN(_TILE_COUNT)) {
        _TILE_COUNT = 0;
    }
    return _TILE_COUNT;
};

const removeTileCounter = () => {
    if (_TILE_COUNT_DISPLAY) {
        _TILE_COUNT_DISPLAY.parentElement.removeChild(_TILE_COUNT_DISPLAY);
        _TILE_COUNT_DISPLAY = undefined;
    }
};

const makeTileCounter = () => {
    removeTileCounter();

    const container = document.createElement('div');
    container.id = 'gg-tile-count';

    container.onmousedown = (evt) => {
        _TILE_COUNT_DRAGGING = true;
        _TILE_COUNT_OFFSET_X = evt.clientX - container.offsetLeft;
        _TILE_COUNT_OFFSET_Y = evt.clientY - container.offsetTop;
    };

    document.onmousemove = (evt) => {
        if (_TILE_COUNT_DRAGGING) {
            container.style.left = `${evt.clientX - _TILE_COUNT_OFFSET_X}px`;
            container.style.top = `${evt.clientY - _TILE_COUNT_OFFSET_Y}px`;
        }
    };

    document.onmouseup = () => {
        _TILE_COUNT_DRAGGING = false;
    };

    const label = document.createElement('span');
    label.textContent = 'Tiles remaining: ';

    const count = document.createElement('span');
    count.id = 'gg-tile-count-value';
    count.textContent = getTileCount();

    container.appendChild(label);
    container.appendChild(count);
    document.body.appendChild(container);

    _TILE_COUNT_DISPLAY = container;
};

const removeTiles = () => {
    const tileOverlay = document.getElementById('gg-tile-overlay');
    if (tileOverlay) {
        tileOverlay.parentElement.removeChild(tileOverlay);
    }
};

const onClickTile = (evt) => {
    const tile = evt.target;
    evt.preventDefault();
    evt.stopPropagation();
    evt.stopImmediatePropagation();

    _TILE_COUNT = getTileCount();
    if (_TILE_COUNT > 0) {
        _TILE_COUNT -= 1;
        const counter = document.getElementById('gg-tile-count-value');
        counter.innerText = _TILE_COUNT;
        tile.classList.add('removed');
    }
};

const makeTiles = (nRows, nCols) => {
    removeTiles();

    const bigMapCanvas = getBigMapCanvas();
    if (!bigMapCanvas) {
        return;
    }

    const tileOverlay = document.createElement('div');
    tileOverlay.id = 'gg-tile-overlay';
    tileOverlay.style.gridTemplateRows = `repeat(${nRows}, 1fr)`;
    tileOverlay.style.gridTemplateColumns = `repeat(${nCols}, 1fr)`;

    for (let i = 0; i < nRows * nCols; i++) {
        const tile = document.createElement('div');
        tile.className = 'gg-tile-block';
        tile.addEventListener('click', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            onClickTile(evt);
        });
        tile.addEventListener('mousedown', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
        });
        tile.addEventListener('mouseup', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
        });
        tileOverlay.appendChild(tile);
    }

    bigMapCanvas.parentElement.insertBefore(tileOverlay, bigMapCanvas.parentElement.firstChild);
};

const updateTileReveal = (forceState = null) => {
    const mod = MODS.tileReveal;
    const active = updateMod(mod, forceState);

    if (active) {
        const nRows = getOption(mod, 'nRows');
        const nCols = getOption(mod, 'nCols');
        makeTiles(nRows, nCols);
        makeTileCounter();
        _TILE_COUNT = getOption(mod, 'nClicks');
        _TILE_COUNT = getTileCount(); // Fix any weird inputs.
    } else {
        removeTiles();
        removeTileCounter();
    }
};

// -------------------------------------------------------------------------------------------------------------------------------




// MOD: Display options.
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
    'black and white': { // TODO: does this need to be configurable based on the image?
        grayscale: '100%',
        contrast: '1000%',
        brightness: '70%',
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
    },
};

/**
Most of the formatting here can be done with pure CSS on the canvas,
but for some modes it needs to be an overlay div that modifies the contents under it.
*/
const removeColorOverlay = () => {
    const colorOverlay = document.getElementById('gg-color-overlay');
    if (colorOverlay) {
        colorOverlay.parentElement.removeChild(colorOverlay);
    }
};

const makeColorOverlay = () => {
    removeColorOverlay();

    const bigMapContainer = getBigMapContainer();
    if (!bigMapContainer) {
        return;
    }

    const container = document.createElement('div');
    container.id = 'gg-color-overlay';

    const colorOverlay = document.createElement('div');
    colorOverlay.id = 'gg-color-overlay';

    bigMapContainer.parentElement.insertBefore(colorOverlay, bigMapContainer.parentElement.firstChild);
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
            continue;
        }
        filterStr += `${key}(${value}) `; // Requires units in value.
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
        makeColorOverlay(); // TODO: depends on mode.
        filterStr = getFilterStr(mod);
    }
    const canvas3d = getBigMapCanvas();
    canvas3d.style.filter = filterStr;
};

// -------------------------------------------------------------------------------------------------------------------------------




// MOD: Scratch and test work.
// ===============================================================================================================================

const updateScratch = (forceState = null) => {
    const mod = MODS.scratch;
    const active = updateMod(mod, forceState);
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
    [MODS.tileReveal, updateTileReveal],
    [MODS.displayOptions, updateDisplayOptions],
    [MODS.scratch, updateScratch],
];

const bindButtons = () => {
    if (_MODS_LOADED) {
        return;
    }
    for (const [mod, callback] of _BINDINGS) {
        if (!mod.show) {
            continue;
        }
        UPDATE_CALLBACKS[mod.key] = callback;
        const button = getModButton(mod);
        if (!button) {
            console.error(`Mod ${mod.key} not found.`);
            continue;
        }
        // If option menu is open, close it. If enabling a mod, open the option menu.
        button.addEventListener('click', () => {
            closeOptionMenu();
            callback();
        });
    }
    _MODS_LOADED = true;
};

const addButtons = () => { // Add mod buttons to the active round, with a little button to toggle them.
    try {
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
        const version = (typeof MOD_VERSION !== 'undefined') ? MOD_VERSION : 'unknown';
        headerText.title = `Version: ${version}`;
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
            modButton.id = getModButtonId(mod);
            modButton.classList.add('gg-mod-button');
            modButton.title = mod.tooltip;
            modButton.textContent = getButtonText(mod);
            buttonContainer.appendChild(modButton);
        }

        modsContainer.appendChild(headerContainer);
        modsContainer.appendChild(buttonContainer);
        bigMapContainer.appendChild(modsContainer);
        bindButtons();

        modMenuToggle.addEventListener('click', function () {
            if (buttonContainer.classList.contains('hidden')) {
                buttonContainer.classList.remove('hidden');
                modMenuToggle.textContent = '▼';
            } else {
                buttonContainer.classList.add('hidden');
                modMenuToggle.textContent = '▶';
            }
        });
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
};

/**
 Some mods currently don't work with competitive games.
 Disable those conditionally. This will be fixed in the future.
 */
const disableModsAsNeeded = () => {
    const pathname = window.location.pathname;
    if (pathname.indexOf('live-challenge') !== -1) {
        disableMods([
            MODS.showScore,
            MODS.bopIt,
        ], true);
    }
};

// -------------------------------------------------------------------------------------------------------------------------------



// C hee tah blockers.
// ===============================================================================================================================

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
    disableModsAsNeeded();
    if (_CH_EA_AT_DE_TE_CT_IO_N || !_CH_EA_AT_DE_TE_CT_IO_N) {
        // Yeah, yeah. If you made it this far in the c ode, you can c h eat if you really want. You'll get caught.
    }
    clearCh_eatOverlay();
    const che_atOverlay = document.createElement('div'); // Opaque black div that covers everything while the page loads.
    che_atOverlay.id = 'on-your-honor';
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
    // This also should allow ample time for mods to load after the initial GOOGLE_MAP load. There may be a better way to do this.
    setTimeout(clearCh_eatOverlay, 5000);
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
};;

const injecter = (overrider) => {
    new MutationObserver((mutations, observer) => {
        const googleScript = grabGoogleScript(mutations);
        if (googleScript) {
            overrideOnLoad(googleScript, observer, overrider);
        }
    }).observe(document.documentElement, { childList: true, subtree: true });
};

const initMods = () => { // Enable mods that were already enabled via localStorage.
    for (const [mod, callback] of _BINDINGS) {
        if (mod.show && isModActive(mod)) {
            callback(true);
        }
    }
};

const onMapClick = (evt) => {
    const lat = evt.latLng.lat();
    const lng = evt.latLng.lng();
    GG_CLICK = { lat, lng };
    const event = new CustomEvent('map_click', { detail: GG_CLICK });
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
                    () => new Set(madeYouLook()).has([...Array(5)].map((_, i) => i).filter(x => x < 5).reduce((a, b) => a + (b === 0 ? 0 : 1), 0) + ([] + [])[1] || +!![] + +!![] + +!![] + +!![]),
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
        return i === 'A' || (!!(void (+(~(1 << 30) & (1 >> 1) | (([] + [])[1] ?? 0))) === 1));
    } catch (k) {
        return false;
    }
};

const initGoogle = () => {
    const google = getGoogle();
    if (!google) {
        const err = 'Google was not initialized proeprly. Refresh the page.';
        throw new Error(err);
        window.alert(err);
    }
    GOOGLE_SVC = new google.maps.ImageMapType({
        getTileUrl: (point, zoom) => `https://www.google.com/maps/vt?pb=!1m7!8m6!1m3!1i${zoom}!2i${point.x}!3i${point.y}!2i9!3x1!2m8!1e2!2ssvv!4m2!1scc!2s*211m3*211e2*212b1*213e2*212b1*214b1!4m2!1ssvl!2s*211b0*212b1!3m8!2sen!3sus!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m4!1e0!8m2!1e1!1e1!6m6!1e12!2i2!11e0!39b0!44e0!50e`,
        tileSize: new google.maps.Size(256, 256),
        maxZoom: 9,
        minZoom: 0,
    });
};

const onDomReady = (callback) => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
};

/**
 Some formatting is different between modes and browsers.
 Things in here are likely to change over time.
 */
const fixFormatting = () => {
    const ticketBar = getTicketBar();
    if (ticketBar) {
        const ggHeader = getGGHeader();
        if (ggHeader) {
            Object.assign(ggHeader.style, {
                position: 'absolute',
                top: '-35px',
            });
        }
    };
};


const addDebugger = () => {
    const smallMapContainer = getSmallMapContainer();
    if (smallMapContainer) {
        smallMapContainer.addEventListener('contextmenu', (evt) => {
            debugMap(this, evt);
        });
    }
    const modHeader = document.querySelector('#gg-mods-header');
    if (modHeader) {
        modHeader.addEventListener('contextmenu', (evt) => {
            debugMap(this, evt);
        });
    }
};

onDomReady(() => {
    if (!_CHEAT_DETECTION) {
        return; // Get outta 'ere
    }
    if (_YOURE_LOOKING_AT_MY_CODE()) {
        return; // Get outta 'ere
    }
    document.addEventListener('ggCoordinates', (evt) => { // Used for duels.
        GG_LOC = evt.detail;
    });
    injecter(() => {
        const google = getGoogle();
        if (!google) {
            return;
        }
        google.maps.Map = class extends google.maps.Map {
            constructor(...args) {
                super(...args);
                
                // Check if Opera browser - it has issues with Vector rendering
                const isOpera = isOperaBrowser();
                
                try {
                    if (isOpera) {
                        console.log('Opera browser detected. Some mods will be disabled due to rendering issues.');
                        this.setRenderingType(google.maps.RenderingType.RASTER);
                    } else {
                        this.setRenderingType(google.maps.RenderingType.VECTOR);
                    }
                } catch (err) {
                    try {
                        this.setRenderingType(google.maps.RenderingType.RASTER);
                    } catch (fallbackErr) {
                        console.error('Fallback to raster failed:', fallbackErr);
                    }
                }
                
                this.setHeadingInteractionEnabled(true);
                this.setTiltInteractionEnabled(true);
                GOOGLE_MAP = this; // This is used for map functions that have nothing to do with the active map. GG_MAP is used for the active round.

                // Add event listeners to THIS map instance
                google.maps.event.addListener(this, 'dragstart', () => {
                    _IS_DRAGGING_SMALL_MAP = true;
                });
                google.maps.event.addListener(this, 'dragend', () => {
                    _IS_DRAGGING_SMALL_MAP = false;
                });
                google.maps.event.addListener(this, 'click', (evt) => {
                    onMapClick(evt);
                });
            }
        }

        google.maps.StreetViewPanorama = class extends google.maps.StreetViewPanorama {
            constructor(...args) {
                super(...args);
                GOOGLE_STREETVIEW = this;
            }
        };

        const isMapReady = (map) => {
            if (!map) {
                return false;
            }
            try {
                if (map.constructor === google.maps.Map) {
                    const mapBounds = map.getBounds();
                    const mapDiv = map.getDiv();
                    return mapBounds && mapDiv;
                }
                if (map.constructor === google.maps.StreetViewPanorama) {
                    const loc = map.getLocation();
                    const visible = map.getVisible();
                    return loc && visible;
                }
            } catch (err) {
                console.error('Error checking map readiness:', err);
                return false;
            }
        };

        const waitForMapsToLoad = (callback, intervalMs = 100, timeout = 5000) => {
            const startTime = Date.now();
            const checkInterval = setInterval(() => {
                const map2dReady = GOOGLE_MAP && isMapReady(GOOGLE_MAP);
                const map3dReady = GOOGLE_STREETVIEW && isMapReady(GOOGLE_STREETVIEW);
                if (map2dReady && map3dReady) {
                    clearInterval(checkInterval);
                    callback();
                    return;
                }
                if (Date.now() - startTime > timeout) {
                    clearInterval(checkInterval);
                    console.warn('Timeout: Maps did not become ready within expected time');
                }
            }, intervalMs);
        };

        waitForMapsToLoad(initMods);
        waitForMapsToLoad(() => {
            fixFormatting();
            if (DEBUG) {
                addDebugger();
            }
        });
        initGoogle();
    });
});

/* eslint-disable no-undef */
GeoGuessrEventFramework.init().then(GEF => { // Note: GG_MAP is the min-map, GOOGLE_MAP is used for pulling funtionality from Google's map functions.
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
    });
    GEF.events.addEventListener('round_end', (evt) => {
        GG_ROUND = undefined;
        GG_CLICK = undefined;
    });
    document.addEventListener('keydown', (evt) => { // Custom hotkeys.
        // Check if user is interacting with form elements or options menu
        const activeElement = document.activeElement;
        const isInOptionsMenu = activeElement && activeElement.closest('#gg-option-menu');
        const isFormElement = activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'SELECT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.tagName === 'BUTTON' ||
            activeElement.contentEditable === 'true' ||
            activeElement.classList.contains('gg-option-input')
        );
        
        // Don't process hotkeys if user is in a form element or options menu
        if (isFormElement || isInOptionsMenu) {
            return;
        }
        
        if (evt.key === ',' && GOOGLE_MAP && !isModActive(MODS.zoomInOnly)) {
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

const observer = new MutationObserver(() => {
    const buttonsAdded = addButtons();
    // I think this is an anti-c h eat method from Geoguessr. It's annoying, so it's gone.
    const reactionsDiv = getGameReactionsDiv();
    if (reactionsDiv) {
        reactionsDiv.parentElement.removeChild(reactionsDiv);
    }
    return buttonsAdded;
});

observer.observe(document.querySelector('#__next'), { subtree: true, childList: true });

// -------------------------------------------------------------------------------------------------------------------------------




// Global/Static styling.
// ===============================================================================================================================

const headerShadow = 'rgb(204, 48, 46) 2px 0px 0px, rgb(204, 48, 46) 1.75517px 0.958851px 0px, rgb(204, 48, 46) 1.0806px 1.68294px 0px, rgb(204, 48, 46) 0.141474px 1.99499px 0px, rgb(204, 48, 46) -0.832294px 1.81859px 0px, rgb(204, 48, 46) -1.60229px 1.19694px 0px, rgb(204, 48, 46) -1.97998px 0.28224px 0px, rgb(204, 48, 46) -1.87291px -0.701566px 0px, rgb(204, 48, 46) -1.30729px -1.5136px 0px, rgb(204, 48, 46) -0.421592px -1.95506px 0px, rgb(204, 48, 46) 0.567324px -1.91785px 0px, rgb(204, 48, 46) 1.41734px -1.41108px 0px, rgb(204, 48, 46) 1.92034px -0.558831px 0px'
const bodyShadow = '3px 3px 0 #000, 3px 0px 3px #000, 1px 1px 0 #000, 3px 1px 2px #000';
const greenMenuColor = '#006400';

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
        width: 200px;
        top: 40px;
        left: 20px;
        z-index: 9;
        display: flex;
        flex-direction: column;
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
        z-index: 9999;
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
        min-width: 300px;
        padding: 15px;
        background: var(--ds-color-purple-100);
        border-radius: 10px;
        border: 2px solid black;
        color: white;
        font-size: 15px;
        font-weight: bold;
        text-shadow: ${bodyShadow};
        z-index: 9999;
        overflow: hidden;
        cursor: move;
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
        display: flex;
        flex-direction: column;
        width: 330px;
        align-items: center;
        position: absolute;
        top: 13%;
        left: 50%;
        font-size: 30px;
        color: white;
        text-shadow: ${bodyShadow};
        transform: translate(-50%, -50%);
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

    /* TODO: can this be merged with the lottery CSS? and also some of it with gg-option-menu */
    #gg-tile-count {
        position: fixed;
        display: flex;
        justify-content: space-between;
        font-size: 24px;
        background: ${greenMenuColor} !important;
        top: 10%;
        left: 50%;
        transform: translate(-50%, -50%);
        min-width: 225px;
        padding: 15px;
        background: var(--ds-color-purple-100);
        border-radius: 10px;
        border: 2px solid black;
        color: white;
        font-weight: bold;
        text-shadow: ${bodyShadow};
        z-index: 9999;
        overflow: hidden;
        cursor: move;
    }

    #gg-tile-count-value {
        padding-left: 0.5em;
        pointer-events: none;
    }

    #gg-tile-overlay {
        position: relative;
        width: 100vw;
        height: 100vh;
        background: transparent;
        display: grid;
        z-index: 1000;
        pointer-events: none;
    }

    .gg-tile-block {
        background: black;
        border: 1px solid #333;
        cursor: pointer;
        transition: opacity 0.3s ease;
        pointer-events: all;
    }

    .gg-tile-block:hover {
        background: #222;
    }

    .gg-tile-block.removed {
        pointer-events: none;
        background: transparent !important;
        border: none;
    }

    #gg-color-overlay {
        position: absolute;
        width: 100vw;
        height: 100vh;
        top: 0;
        left: 0;
        pointer-events: none;
        z-index: 2;
    }

`;

GM_addStyle(style);

// -------------------------------------------------------------------------------------------------------------------------------