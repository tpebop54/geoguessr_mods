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
Heavy credit to https://miraclewhips.dev/ for geoguessr-event-framework and some essential functions in this script.
*/


// TODO:
// - full reset shortcut for when things go awry.
// - block screen until mods are loaded (e.g. flashlight mode is essentially blink mode first).
// - onApply when the mod is disabled but the settings are open should enable it.
// - figure out why sometimes the map doesn't load properly.



// Mods available in this script.
// ===============================================================================================================================

/**  DEV NOTES:
    - If you want to disable a mod, change 'show' to false for it.
    - Keep same configuration for all mods. Must add to _BINDINGS at the bottom of the file for any new mods.
    - This is a global variable that the script will modify. The saved state will override certain parts of it.
*/

const MODS = {

    satView: {
        show: true, // false to hide this mod from the panel. Mostly used for dev, but you can change it to disable stuff.
        key: 'sat-view', // Used for global state and document elements.
        name: 'Satellite View', // Used for menus.
        tooltip: 'Uses satellite view on the guess map, with no labels.', // Shows when hovering over menu button.
        options: {}, // Used when mod requires or allows configurable values.
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

    hotterColder: {
        show: true,
        key: 'hotter-colder',
        name: 'Hotter/Colder',
        tooltip: 'Shows the would-be score of each click.',
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
    if (typeof storedState !== 'object') {
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

let GG_ROUND; // Current round information. Set on round start, deleted on round end.
let GG_MAP; // Current map info,
let GG_CLICK; // [lat, lng] of latest map click.

let IS_DRAGGING = false;
let GAME_OVERLAY; // Div that is permanently on top of the game, to mess around with stuff. Pointer events will be disabled when

const UPDATE_CALLBACKS = {}; // TODO: move this to some sort of registry function.

// -------------------------------------------------------------------------------------------------------------------------------





// Utility functions.
// ===============================================================================================================================

const getGoogle = () => {
    return window.google || unsafeWindow.google;
}

const getGameContent = () => {
    return document.querySelector('div[class^="game_content__"]');;
};

const getGuessMapContainer = () => {
    return document.querySelector('div[class^="game_guessMap__"]');;
};

const getGuessMap = () => {
    return document.querySelector('div[class^="guess-map_guessMap__"]');
};

const getCanvas = () => {
    return document.querySelector(`div[class^="game_canvas__"]`);
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
    }

    const closePopup = () => {
        popup.remove();
        popup = undefined;
    }

    const onReset = () => {
        for (const [key, type, input] of inputs) {
            input.value = getDefaultOption(mod, key);
        }
    }

    const onClose = () => {
        closePopup();
    }

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
    }

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

const getLatLngBounds = () => {
    const bounds = GOOGLE_MAP.getBounds();
    const latLngBounds = {
        north: bounds.ei.hi,
        south: bounds.ei.lo,
        west: bounds.Gh.lo,
        east: bounds.Gh.hi,
    };
    return latLngBounds;
}

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
        INITIAL_BOUNDS = getLatLngBounds();
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
                    const latLngBounds = getLatLngBounds();
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




// MOD: Hotter/Colder.
// ===============================================================================================================================

const getDistance = (p1, p2) => {
    const google = getGoogle();
    const ll1 = new google.maps.LatLng(p1.lat, p1.lng);
    const ll2 = new google.maps.LatLng(p2.lat, p2.lng);
    const dist = google.maps.geometry.spherical.computeDistanceBetween(ll1, ll2);
    return dist;
};

const getScore = () => {
    if (!GG_CLICK || !GG_ROUND) {
        return;
    }
    const actual = { lat: GG_ROUND.lat, lng: GG_ROUND.lng };
    const guess = GG_CLICK;
    const dist = getDistance(actual, guess);

    // Ref: https://www.plonkit.net/beginners-guide#game-mechanics --> score
    const maxErrorDist = GG_MAP.maxErrorDistance;
    const score = Math.round(5000 * Math.pow(Math.E, -10 * dist / maxErrorDist));
    return score;
};

const scoreListener = (evt) => {
    const score = getScore();
    if (isNaN(score)) {
        return;
    }

    let fadeTarget = document.getElementById('gg-score-div');
    if (!fadeTarget) {
        fadeTarget = document.createElement('div');
        fadeTarget.id = 'gg-score-div';
        document.body.appendChild(fadeTarget);
    }

    fadeTarget.innerHTML = score;
    fadeTarget.style.opacity = 1

    let fadeEffect;
    fadeEffect = setInterval(() => {
        if (fadeTarget.style.opacity > 0) {
            fadeTarget.style.opacity -= 0.05;
        } else {
            clearInterval(fadeEffect);
        }
    }, 30);
};

const updateHotterColder = (forceState = null) => {
    const mod = MODS.hotterColder;
    const active = updateMod(mod, forceState);

    if (active) {
        document.addEventListener('map_click', scoreListener);
    } else {
        document.removeEventListener('map_click', scoreListener, false);
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




// Add bindings and start the script.
// ===============================================================================================================================

// Must add each mod to this list to bind the buttons and hotkeys.
const _BINDINGS = [
    [MODS.satView, updateSatView],
    [MODS.rotateMap, updateRotateMap],
    [MODS.zoomInOnly, updateZoomInOnly],
    [MODS.hotterColder, updateHotterColder],
    [MODS.flashlight, updateFlashlight],
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

/* eslint-disable no-undef */
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
`;

GM_addStyle(style);

// -------------------------------------------------------------------------------------------------------------------------------
