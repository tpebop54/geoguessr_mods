// ==UserScript==
// @name         Tpebop's Geoguessr MultiMod V1
// @description  Various mods to make the game interesting in various ways
// @version      1.0
// @author       tpebop
// @match        *://*.geoguessr.com/*
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/gg_evt_temp0.js
// @icon         https://www.google.com/s2/favicons?domain=geoguessr.com
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_openInTab

// ==/UserScript==


// TODO:
// - Break this off into a base util thing
// - Figure out how to properly reset map bounds. Might have to reload the whole map or (hopefully not) page
// - Configuration menus for rotation and zoom
// - Tooltips
// - Disclaimer that using certain tools is cheating
// - Clean up GG_STATE initialization
// - Add event listeners to configs?
// - Scoring algorithm: https://www.plonkit.net/beginners-guide#game-mechanics
//      Likely have to pull map info from https://www.geoguessr.com/api/maps/62a44b22040f04bd36e8a914 -> bounds and maxErrorDistance
// - Clean up const google = ...


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
        tooltip: 'Change guess map to satellite view. This will also remove all labels from the map.',
        options: {}, // Used when mod requires or allows configurable values.
    },

    // Guess map rotates while you're trying to click.
    rotateMap: {
        show: true,
        key: 'rotate-map',
        labelEnable: 'Enable Map Rotation',
        labelDisable: 'Disable Map Rotation',
        tooltip: 'Makes the guess map rotate while you are trying to click. Rotational speed can be configured.',
        options: {
            'Run every (s)': 0.1,
            'Degrees': 3,
        },
    },

    // You will only be able to zoom in (no panning either).
    zoomInOnly: {
        show: true,
        key: 'zoom-in-only',
        labelEnable: 'Enable Zoom In Only',
        labelDisable: 'Disable Zoom In Only',
        tooltip: 'Allows you to only zoom in. This prevents scanning unless you are in the right area at the right zoom level.',
        options: {},
    },

    // Show distance, would-be score, and/or hotter/colder as you click around.
    hotterColder: {
        show: true,
        key: 'hotter-colder',
        labelEnable: 'Enable Hotter/Colder',
        labelDisable: 'Disable Hotter/Colder',
        tooltip: 'When you make a guess, you will see the distance from the target, and/or it will tell you hotter/colder.',
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

let GOOGLE_STREETVIEW, GOOGLE_MAP, GOOGLE_SVC; // Assigned in the google API portion of the script.

const GG_STATE = { // TODO: clean this up.
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
    [MODS.hotterColder.key]: {
        active: false,
        options: {},
    },
};

const GG_DEFAULT = {} // Used for default options and restoring settings.
for (const mod of Object.values(MODS)) {
    GG_DEFAULT[mod.key] = JSON.parse(JSON.stringify(mod));
}

const STATE_KEY = 'gg_state'; // Key in window.localStorage.

const loadState = () => { // Load state from local storage if it exists, else use default.
    try {
        const stateStr = window.localStorage.getItem(STATE_KEY);
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

let GG_ROUND; // Current round information. Set on round start, deleted on round end.
let GG_MAP; // Current map info,
let GG_CLICK; // [lat, lng] of latest map click.

const saveState = () => { // State must be updated by calling function, e.g. GG_STATE.something = 1
	window.localStorage.setItem(STATE_KEY, JSON.stringify(GG_STATE));
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

const toggleMod = (mod, options, forceState = null) => {
    if (!GOOGLE_MAP) {
        const err = `Map not loaded. Cannot toggle ${mod.key}. Try refreshing the page and make sure to let it fully load.`;
        window.alert(err);
        throw new Error(err);
    }
    const previousState = isActive(mod);
    const newState = forceState != null ? forceState : !previousState;

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

const updateSatView = (forceState = null) => {
    const mod = MODS.satView;
    const active = toggleMod(mod, {}, forceState);8
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

const updateRotateMap = (forceState = null) => {
    const mod = MODS.rotateMap;
    const active = toggleMod(mod, {}, forceState);

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




// MOD: Zoom-in only.
// ===============================================================================================================================

let ZOOM_LISTENER;
let HAS_ZOOMED_IN = false;
let PREV_ZOOM;
let INITIAL_BOUNDS;

const getLatLngBounds = () => {
    const bounds = GOOGLE_MAP.getBounds();
    const latLngBounds = {
        north: bounds.Yh.hi,
        south: bounds.Yh.lo,
        west: bounds.Hh.lo,
        east: bounds.Hh.hi,
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
    const active = toggleMod(mod, {}, forceState);
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
                const google = window.google || unsafeWindow.google;
                google.maps.event.addListenerOnce(GOOGLE_MAP, 'idle', () => { // Zoom animation occurs after zoom is set.
                    const latLngBounds = getLatLngBounds();
                    setRestriction(latLngBounds, GOOGLE_MAP.getZoom());
                });
            }
            PREV_ZOOM = newZoom;
        });
    } else {
        if (ZOOM_LISTENER) {
            const google = window.google || unsafeWindow.google;
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
    const google = window.google || unsafeWindow.google;
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

    let fadeTarget = document.getElementById('score_div');
    if (!fadeTarget) {
        fadeTarget = document.createElement('div');
        fadeTarget.id = 'score_div';
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
    }, 40);
};

const updateHotterColder = (forceState = null) => {
    const mod = MODS.hotterColder;
    const active = toggleMod(mod, {}, forceState);

    if (active) {
        document.addEventListener('map_click', scoreListener);
    } else {
        document.removeEventListener('map_click', scoreListener, false);
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
];

const bindButtons = () => {
    for (const [mod, callback] of _BINDINGS) {
        if (!mod.show) {
            continue;
        }
        const button = getButton(mod);
        if (!button) {
            console.error(`Mod ${mod.key} not found.`);
            continue;
        }
        button.addEventListener('click', () => callback()); // Don't pass the click event since toggleMod doesn't need it.
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

// -------------------------------------------------------------------------------------------------------------------------------




// Intercept google maps API files so we can add custom map behavior. Configure GeoGuessr framework.
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

const initMods = () => { // Enable mods that were already enabled via localStorage.
    for (const [mod, callback] of _BINDINGS) {
        if (mod.show && isActive(mod)) {
            callback(true);
        }
    }
};

const initModsCallback = () => {
    if (GOOGLE_MAP) {
        const google = window.google || unsafeWindow.google;
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
		const google = window.google || unsafeWindow.google;
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
        window.localStorage.setItem(STATE_KEY, JSON.stringify(GG_STATE));
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

    #score_div {
        position: absolute;
        top: 50%;
        left: 50%;
        font-size: 60px;
        color: white;
        text-shadow: 3px 3px 0 #000, 3px 0px 3px #000, 1px 1px 0 #000, 3px 1px 2px #000;
        transform: translate(-50%, -50%);
    }
`;

GM_addStyle(buttonMenuStyle);

// -------------------------------------------------------------------------------------------------------------------------------
