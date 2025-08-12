// ==UserScript==
// @author       tpebop

// ==/UserScript==

// Global state. Load from local storage if it exists. Values used in this script will be from this global variable after loading.
// ===============================================================================================================================

let GOOGLE_STREETVIEW, GOOGLE_MAP, GOOGLE_SVC; // Assigned in the google API portion of the script.
let PREV_GOOGLE_STREETVIEW_POV, PREV_GOOGLE_STREETVIEW_POSITION; // Stored state of streetview POV and position, used to detect if either has changed.s

const STATE_KEY = 'gg_state'; // Key in THE_WINDOW.localStorage.

let GG_ROUND; // Current round information. This gets set on round start, and deleted on round end.
let GG_LOC; // This is intercepted from Google Maps API. It contains the lat, lng, and countryCode.
let GG_GUESSMAP; // Current map info.
let GG_CLICK; // { lat, lng } of latest map click.
let GG_CUSTOM_MARKER; // Custom marker. This is not the user click marker. Can only use one at a time. Need to clear/move when used.

let _IS_DRAGGING_GUESSMAP = false; // true when user is actively dragging the guessMap. Some of the map events conflict with others.

/**
  SCORE_FUNC is a function used to display the overlay that shows how well you clicked (score, direction, whatever).
  This can only be used by one mod at a time, so in mods that use it we have to use disableOtherisScorings to disable the other ones.
  It uses GG_ROUND, GG_LOC, and GG_CLICK to determine how well you clicked. SCORE_FUNC can be globally set for the active mod.
  By default, it will give the 0-5000 score, but some mods override it.
*/
let SCORE_FUNC;

let _MODS_READY = false;

const saveState = () => {
    const newState = JSON.stringify(MODS);
    THE_WINDOW.localStorage.setItem(STATE_KEY, newState);
};

const clearState = () => {
    THE_WINDOW.localStorage.removeItem(STATE_KEY);
};

const getState = () => {
    const stateStr = THE_WINDOW.localStorage.getItem(STATE_KEY);
    
    let stateObj;
    try {
        stateObj = JSON.parse(stateStr);
        if (!stateObj || typeof stateObj !== 'object') {
            console.log('Loading default state. Existing state was either cleared or invalid.')
            clearState();
            stateObj = {};
        }
    } catch (err) {
        console.error('Error parsing stored state:', err);
        clearState();
        stateObj = {};
    }
    return stateObj;
};

const loadState = () => { // Load state from local storage if it exists, else use default.
    let stateObj = getState();

    // Create a clean starting state, with the previous state if it existed.
    // Here, we only care about the active/inactive state, and the values of the options. Everything else comes from the default config.
    for (const [key, mod] of Object.entries(MODS)) {
        const storedMod = stateObj[key];
        if (!storedMod) {
            continue;
        }
        
        mod.active = !!storedMod.active;
        
        if (mod.options) {
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
    }
    return MODS;
};

const compareState = (newState = null) => { // Used for debugging.
    const oldState = getState();
    newState = newState == null ? MODS : newState;
    
    const findDifferences = (oldObj, newObj, path = '') => {
        const changes = [];
        
        const allKeys = new Set([
            ...Object.keys(oldObj || {}),
            ...Object.keys(newObj || {}),
        ]);
        
        for (const key of allKeys) {
            const currentPath = path ? `${path}.${key}` : key;
            const oldValue = oldObj?.[key];
            const newValue = newObj?.[key];
            
            // Check if key was added.
            if (!(key in (oldObj || {})) && key in (newObj || {})) {
                changes.push({
                    type: 'added',
                    path: currentPath,
                    newValue: newValue,
                });
            }
            // Check if key was removed.
            else if (key in (oldObj || {}) && !(key in (newObj || {}))) {
                changes.push({
                    type: 'removed',
                    path: currentPath,
                    oldValue: oldValue,
                });
            }
            // Check if both values exist
            else if (key in (oldObj || {}) && key in (newObj || {})) {
                // If both are objects (and not null/arrays), recurse.
                if (isObject(oldValue) && isObject(newValue)) {
                    const nestedChanges = findDifferences(oldValue, newValue, currentPath);
                    changes.push(...nestedChanges);
                }
                // If values are different (primitive comparison or different types).
                else if (!deepEqual(oldValue, newValue)) {
                    changes.push({
                        type: 'modified',
                        path: currentPath,
                        oldValue: oldValue,
                        newValue: newValue,
                    });
                }
            }
        }
        
        return changes;
    };
    
    // Helper function to check if value is a plain object.
    const isObject = (value) => {
        return value !== null && 
               typeof value === 'object' && 
               !Array.isArray(value) && 
               !(value instanceof Date) &&
               !(value instanceof RegExp);
    };
    
    // Helper function for deep equality check (for primitives and arrays).
    const deepEqual = (a, b) => {
        if (a === b) return true;
        
        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) return false;
            for (let i = 0; i < a.length; i++) {
                if (!deepEqual(a[i], b[i])) return false;
            }
            return true;
        }
        
        if (a instanceof Date && b instanceof Date) {
            return a.getTime() === b.getTime();
        }
        
        return false;
    };
    
    const differences = findDifferences(oldState, newState);
    
    if (differences.length === 0) {
        console.debug('State comparison: No changes detected');
    } else {
        console.debug('State changes detected:', {
            totalChanges: differences.length,
            changes: differences,
        });
        
        // Also log a summary for easier reading
        differences.forEach(change => {
            switch (change.type) {
                case 'added':
                    console.debug(`+ Added: ${change.path} = ${JSON.stringify(change.newValue)}`);
                    break;
                case 'removed':
                    console.debug(`- Removed: ${change.path} (was ${JSON.stringify(change.oldValue)})`);
                    break;
                case 'modified':
                    console.debug(`~ Modified: ${change.path} | ${JSON.stringify(change.oldValue)} → ${JSON.stringify(change.newValue)}`);
                    break;
            }
        });
    }

    return differences;
};

THE_WINDOW.compareState = compareState; // Added here so TamperMonkey doesn't auto remove it.
