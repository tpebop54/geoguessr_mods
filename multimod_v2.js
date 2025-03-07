// ==UserScript==
// @name         Tpebop's Geoguessr MultiMod V1
// @description  Various mods to make the game interesting in various ways
// @version      1.0
// @author       tpebop
// @match        *://*.geoguessr.com/*
// @require      https://miraclewhips.dev/geoguessr-event-framework/geoguessr-event-framework.min.js?v=12
// @icon         https://www.google.com/s2/favicons?domain=geoguessr.com
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_openInTab

// ==/UserScript==



/**
CREDIT WHERE CREDIT IS DUE
Heavy credit to https://miraclewhips.dev/ for geoguessr-event-framework, showing me how to overhaul google maps API behavior,
    and for adding the menu with mod toggles.
*/



// Mods available in this script.
// ===============================================================================================================================

// Keep same configuration for all mods. Must add to _BINDINGS at the bottom of the file for any new mods.
// If you want to disable a mod, change 'show' to false for it.
const MODS = {

    // Satellite view on guess map.
    satView: {
        show: true, // false to hide this mod from the panel. Mostly used for dev, but you can change it to disable stuff.
        key: 'sat-view', // Used for global state and document elements.
        labelEnable: 'Enable Satellite View', // Used for menu buttons.
        labelDisable: 'Disable Satellite View', // Used for menu buttons.
        options: {}, // Used when mod requires or allows configurable values.
    },

    // Guess map rotates while you're trying to click
    rotateMap: {
        show: true,
        key: 'rotate-map',
        labelEnable: 'Enable Map Rotation',
        labelDisable: 'Disable Map Rotation',
        options: {
            'Run every (s)': 0.1,
            'Degrees': 3,
        },
    },

    // You can only pan when the map is fully zoomed out. Once you zoom, you can only zoom in.
    zoomInOnly: {
        show: true,
        key: 'zoom-in-only',
        labelEnable: 'Enable Zoom In Only',
        labelDisable: 'Disable Zoom In Only',
        options: {},
    },
};

// -------------------------------------------------------------------------------------------------------------------------------







// *******************************************************************************************************************************
// *******************************************************************************************************************************

// DON'T CHANGE ANYTHING BELOW HERE UNLESS YOU KNOW WHAT YOU'RE DOING ************************************************************

// *******************************************************************************************************************************
// *******************************************************************************************************************************







// *******************************************************************************************************************************

// Debugging utilities
// If true, add a right click listener to the guess map that will give you access to JS variables in your browser console.
const DEBUG = true;

const debugMap = (map, evt) => {
    debugger;
};

// -------------------------------------------------------------------------------------------------------------------------------




// Global state. Load from local storage if it exists. Values used in this script will be from this global variable after loading.
// ===============================================================================================================================

let GOOGLE_STREETVIEW, GOOGLE_MAP, GOOGLE_SVC; // Set in the google API portion of the script.

const GG_STATE = {
    [MODS.satView.key]: {
        active: false,
        options: {},
    },
    [MODS.rotateMap.key]: {
        active: false,
        options: {
            seconds: Object.assign({}, MODS.rotateMap.options),
        },
    },
    [MODS.zoomInOnly.key]: {
        active: false,
        options: {},
    },
};

const GG_DEFAULT = {} // Used for default options and restoring settings.
for (const mod of Object.values(MODS)) {
    GG_DEFAULT[mod.key] = JSON.parse(JSON.stringify(mod));
}

const STATE_VAR = 'gg_state'; // Key in window.localStorage.

const loadState = () => { // Load state from local storage if it exists, else use default.
    try {
        const stateStr = window.localStorage.getItem(STATE_VAR);
        if (!stateStr) {
            return GG_STATE;
        }
        const storedState = JSON.parse(stateStr);
        Object.assign(GG_STATE, storedState);
    } catch (err) {
        console.err('Failed to load state');
        console.err(err);
        return GG_STATE;
    }
};

const saveState = () => { // State must be updated by calling function, e.g. GG_STATE.something = 1
	window.localStorage.setItem(STATE_VAR, JSON.stringify(GG_STATE));
};

let IS_DRAGGING = false;

// -------------------------------------------------------------------------------------------------------------------------------





// Utility functions.
// ===============================================================================================================================

const getButtonID = (mod) => {
    return `gg-opt-${mod.key}`;
};

const getButtonText = (mod) => {
    const active = GG_STATE[mod.key].active;
    const text = active ? mod.labelDisable : mod.labelEnable;
    return text;
};

const getButton = (mod) => {
    return document.querySelector(`#${getButtonID(mod)}`);
};

const isActive = (mod) => {
    return !!GG_STATE[mod.key].active;
};

const getDefaultOption = (mod, key) => {
    const value = (GG_DEFAULT[mod.key].options || {})[key]
    return value;
};

const getOption = (mod, key, defaultValue) => {
    let options = GG_STATE[mod.key].options;
    if (typeof options !== 'object') {
        options = GG_STATE[mod.key].options = {};
    }
    let value = options[key];
    if (value === undefined) {
        value = defaultValue !== undefined ? defaultValue : getDefaultOption(mod, key);
    }
    return value;
};

const toggleMod = (mod, options) => {
    if (!GOOGLE_MAP) {
        const err = `Map not loaded. Cannot toggle ${mod.key}`;
        window.alert(err);
        throw new Error(err);
    }
    const previousState = isActive(mod);
    const newState = previousState == null ? true : !previousState;

    GG_STATE[mod.key].active = newState;
    getButton(mod).textContent = getButtonText(mod);
    if (options && typeof options === 'object') {
        if (typeof GG_STATE[mod.key].options !== 'object') {
            GG_STATE[mod.key].options = {};
        }
        Object.assign(GG_STATE[mod.key].options, options);
    }
    saveState();
    return newState;
};

// Selectors for map. These get overwritten on mouseenter/mouseleave and have to be reapplied to the newly sized map.
const getGuessMapContainer = () => {
    const div = document.querySelector('div[class^="game_guessMap__"]');
    if (!div) {
        console.error('Map container div not found.');
        return undefined;
    }
    return div;
};

const getGuessMap = () => {
    const div = document.querySelector('div[class^="guess-map_guessMap__"]');
    if (!div) {
        console.error('Map div not found.');
        return undefined;
    }
    return div;
};

// -------------------------------------------------------------------------------------------------------------------------------





// MOD: Satellite view.
// ===============================================================================================================================

const updateSatView = () => {
    const mod = MODS.satView;
    const active = toggleMod(mod);
    GOOGLE_MAP.setMapTypeId(active ? 'satellite' : 'roadmap');
};

// -------------------------------------------------------------------------------------------------------------------------------




// MOD: Rotating marker map.
// ===============================================================================================================================

const doRotation = (nDegrees) => {
    if (IS_DRAGGING) {
        return; // Drag event gets cut by setHeading.
    }
    GOOGLE_MAP.setHeading((GOOGLE_MAP.getHeading() + nDegrees)) % 360;
};

let ROTATION_INTERVAL;

const updateRotateMap = () => {
    const mod = MODS.rotateMap;
    const active = toggleMod(mod);

    if (active) {
        let nMilliseconds = Number(getOption(mod, 'Run every (s)')) * 1000;
        let nDegrees = Number(getOption(mod, 'Degrees'));
        if (isNaN(nMilliseconds) || isNaN(nDegrees)) {
            window.alert('Invalid interval or amount.');
            return;
        }
        if (ROTATION_INTERVAL) {
            clearInterval(ROTATION_INTERVAL);
        }
        doRotation(nDegrees); // Perform synchronously and then start timer.
        ROTATION_INTERVAL = setInterval(() => {
            doRotation(nDegrees);
        }, nMilliseconds);
    } else if (ROTATION_INTERVAL) {
        clearInterval(ROTATION_INTERVAL);
    }
};

// -------------------------------------------------------------------------------------------------------------------------------




// MOD: Zoom-in only. You can zoom out and
// ===============================================================================================================================

let ZOOM_LISTENER;
let HAS_ZOOMED_IN = false;
let PREV_ZOOM;

const boundToCurrent = () => {
    const bounds = GOOGLE_MAP.getBounds();
    const latLngBounds = {
        north: bounds.Yh.hi,
        south: bounds.Yh.lo,
        west: bounds.Hh.lo,
        east: bounds.Hh.hi,
    };
    const restriction = {
        latLngBounds,
        strictBounds: false,
    };
    GOOGLE_MAP.setRestriction(restriction);
    GOOGLE_MAP.minZoom = GOOGLE_MAP.getZoom();
};

const updateZoomInOnly = () => {
    const mod = MODS.zoomInOnly;
    const active = toggleMod(mod);
    if (PREV_ZOOM === undefined) {
        PREV_ZOOM = GOOGLE_MAP.getZoom();
    }

    if (active) {
        ZOOM_LISTENER = GOOGLE_MAP.addListener('zoom_changed', () => {
            const newZoom = GOOGLE_MAP.getZoom();
            if (newZoom > PREV_ZOOM) {
                HAS_ZOOMED_IN = true;
            }
            if (HAS_ZOOMED_IN) {
                const google = window.google || unsafeWindow.google;
                google.maps.event.addListenerOnce(GOOGLE_MAP, 'idle', () => { // Zoom animation occurs after zoom is set.
                    boundToCurrent();
                });
            }
            PREV_ZOOM = newZoom;
        });
    } else {
        if (ZOOM_LISTENER) {
            GOOGLE_MAP.removeListener(ZOOM_LISTENER);
            ZOOM_LISTENER = undefined;
        }
        GOOGLE_MAP.minZoom = 1;
        HAS_ZOOMED_IN = false;
        PREV_ZOOM = undefined;
    }
};

// -------------------------------------------------------------------------------------------------------------------------------




// Intercept google maps API files so we can add custom map behavior.
// ===============================================================================================================================

// Script injection, extracted from unityscript extracted from extenssr:
// https://gitlab.com/nonreviad/extenssr/-/blob/main/src/injected_scripts/maps_api_injecter.ts
const overrideOnLoad = (googleScript, observer, overrider) => {
	const oldOnload = googleScript.onload;
	googleScript.onload = (event) => {
		const google = window.google || unsafeWindow.google;
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

document.addEventListener('DOMContentLoaded', (event) => {
	injecter(() => {
		const google = window['google'] || unsafeWindow['google'];
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
					updateSatView();
				});

                google.maps.event.addListener(this, 'dragstart', () => {
					IS_DRAGGING = true;
				});
                google.maps.event.addListener(this, 'dragend', () => {
					IS_DRAGGING = false;
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

// -------------------------------------------------------------------------------------------------------------------------------





// Add bindings and start the script.
// ===============================================================================================================================

// Must add each mod to this list to bind the buttons and hotkeys.
const _BINDINGS = [
    [MODS.satView, updateSatView],
    [MODS.rotateMap, updateRotateMap],
    [MODS.zoomInOnly, updateZoomInOnly],
];

const bindButtons = () => {
    for (const [mod, callback] of _BINDINGS) {
        if (!mod.show) { // Allow users to disable stuff.
            continue;
        }
        const button = getButton(mod);
        if (!button) {
            console.error(`Mod ${mod.key} not found.`);
            continue;
        }
        button.addEventListener('click', callback);
    }
};

const addButtons = () => { // Add settings buttons to the active round.
	const container = document.querySelector(`div[class^="game_canvas__"]`);
	if (!container || document.getElementById('gg-settings-buttons')) {
        return;
    }

    const buttonClass = 'gg-settings-option';
	const element = document.createElement('div');
	element.id = 'gg-settings-buttons';
    element.className = 'gg-settings extra-pad';

    let innerHTML = `<div class="gg-title">TPEBOP'S MODS</div>`;
    for (const mod of Object.values(MODS)) {
        if (!mod.show) {
            continue;
        }
        innerHTML = innerHTML + `\n<div class="${buttonClass}" id="${getButtonID(mod)}">${getButtonText(mod)}</div>`;
    }
	element.innerHTML = innerHTML;

	container.appendChild(element);
	bindButtons();
};

/* eslint-disable no-undef */
GeoGuessrEventFramework.init().then(GEF => {
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

const observer = new MutationObserver(() => {
	addButtons();
});

loadState();
observer.observe(document.querySelector('#__next'), { subtree: true, childList: true });

// -------------------------------------------------------------------------------------------------------------------------------




// Global/Static styling.
// ===============================================================================================================================

const buttonMenuStyle = `
    .gg-settings {
        position: absolute;
        top: 1rem;
        left: 1rem;
        z-index: 9;	display: flex;
        flex-direction: column;
        gap: 5px;
        align-items: flex-start;
    }

    .gg-settings.extra-pad {
        top: 2.5rem;
    }

    .gg-title {
        font-size: 15px;
        font-weight: bold;
        text-shadow: rgb(204, 48, 46) 2px 0px 0px, rgb(204, 48, 46) 1.75517px 0.958851px 0px, rgb(204, 48, 46) 1.0806px 1.68294px 0px, rgb(204, 48, 46) 0.141474px 1.99499px 0px, rgb(204, 48, 46) -0.832294px 1.81859px 0px, rgb(204, 48, 46) -1.60229px 1.19694px 0px, rgb(204, 48, 46) -1.97998px 0.28224px 0px, rgb(204, 48, 46) -1.87291px -0.701566px 0px, rgb(204, 48, 46) -1.30729px -1.5136px 0px, rgb(204, 48, 46) -0.421592px -1.95506px 0px, rgb(204, 48, 46) 0.567324px -1.91785px 0px, rgb(204, 48, 46) 1.41734px -1.41108px 0px, rgb(204, 48, 46) 1.92034px -0.558831px 0px;
        position: relative;
        z-index: 1;
        padding-top: 15px;
    }

    .gg-settings-option {
        background: var(--ds-color-purple-100);
        padding: 6px 10px;
        border-radius: 5px;
        font-size: 12px;
        cursor: pointer;
        opacity: 0.75;
        transition: opacity 0.2s;
    }

    .gg-settings-option:hover {
        opacity: 1;
    }
`;

GM_addStyle(buttonMenuStyle);

// -------------------------------------------------------------------------------------------------------------------------------

console.log('GeoGuessr mods initialized.');
