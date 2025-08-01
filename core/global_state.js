// ==UserScript==
// @author       tpebop

// ==/UserScript==

// Global state. Load from local storage if it exists. Values used in this script will be from this global variable after loading.
// ===============================================================================================================================

let GOOGLE_STREETVIEW, GOOGLE_MAP, GOOGLE_SVC; // Assigned in the google API portion of the script.
let PREV_GOOGLE_STREETVIEW_POV, PREV_GOOGLE_STREETVIEW_POSITION; // Stored state of streetview POV and position, used to detect if either has changed.s

const STATE_KEY = 'gg_state'; // Key in THE_WINDOW.localStorage.

const saveState = () => {
    try {
        const stateToSave = JSON.stringify(MODS);
        THE_WINDOW.localStorage.setItem(STATE_KEY, stateToSave);
        
        // Add detailed logging for active states
        const activeStates = {};
        for (const [key, mod] of Object.entries(MODS)) {
            activeStates[key] = mod.active;
        }
        
        // Verify the save worked by reading it back
        const verification = THE_WINDOW.localStorage.getItem(STATE_KEY);
        if (verification === stateToSave) {
        } else {
            console.error('State save verification: FAILED - data mismatch');
        }
    } catch (error) {
        console.error('Error saving state to localStorage:', error);
    }
};

const clearState = () => {
    THE_WINDOW.localStorage.removeItem(STATE_KEY);
};

const loadState = () => { // Load state from local storage if it exists, else use default.
    const stateStr = THE_WINDOW.localStorage.getItem(STATE_KEY);
    
    let storedState;
    try {
        storedState = JSON.parse(stateStr);
    } catch (err) {
        console.error('Error parsing stored state:', err);
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
        
        const wasActive = mod.active;
        mod.active = !!storedMod.active;
        
        if (typeof storedMod.options !== 'object') {
            storedMod.options = {};
        }
        const validKeys = new Set(Object.keys(mod.options));
        for (const [optKey, storedOption] of Object.entries(storedMod.options)) {
            if (validKeys.has(optKey) && storedOption.value != null) {
                mod.options[optKey].value = storedOption.value;
            } else if (!validKeys.has(optKey)) {
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

/**
  SCORE_FUNC is a function used to display the overlay that shows how well you clicked (score, direction, whatever).
  This can only be used by one mod at a time, so in mods that use it we have to use disableOtherScoreModes to disable the other ones.
  It uses GG_ROUND, GG_LOC, and GG_CLICK to determine how well you clicked. SCORE_FUNC can be globally set for the active mod.
  By default, it will give the 0-5000 score, but some mods override it.
*/
let SCORE_FUNC;

let _MODS_LOADED = false;

// Add a verification function to check if display options were properly restored
const verifyDisplayOptions = () => {
    const displayMod = MODS.displayOptions;
    if (!displayMod) {
        console.warn("Display options mod not found!");
        return;
    }
};

// Call verification after state is loaded
const originalLoadState = loadState;
THE_WINDOW.loadState = function() {
    const result = originalLoadState.apply(this, arguments);
    
    // Verify display options specifically
    setTimeout(() => {
        verifyDisplayOptions();
    }, 500);
    
    return result;
};
