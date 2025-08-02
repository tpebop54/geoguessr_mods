// ==UserScript==
// @author       tpebop

// ==/UserScript==

// Add bindings and start the script.
// ===============================================================================================================================

// Must add each mod to this list to bind the menu button.
let _BINDINGS = null;

// Lazy initialize bindings to avoid dependency loading issues
const getBindings = () => {
    if (_BINDINGS == null || _BINDINGS.length === 0) {
        try {
            _BINDINGS = [
                [MODS.satView, updateSatView],
                [MODS.rotateMap, updateRotateMap],
                [MODS.zoomInOnly, updateZoomInOnly],
                [MODS.showScore, updateShowScore],
                [MODS.flashlight, updateFlashlight],
                [MODS.bopIt, updateBopIt],
                [MODS.inFrame, updateInFrame],
                [MODS.lottery, updateLottery],
                [MODS.puzzle, updatePuzzle],
                [MODS.tileReveal, updateTileReveal],
                [MODS.funFilters, updateFunFilters],
                [MODS.scratch, updateScratch],
            ];
        } catch (err) {
            console.error('Error initializing bindings:', err);
            _BINDINGS = [];
        }
    }
    return _BINDINGS;
};

const bindButtons = () => {
    for (const [mod, callback] of getBindings()) {
        if (!mod.show) {
            continue;
        }
        const button = getModButton(mod);
        if (!button || button._isBound) {
            continue;
        }
        button.addEventListener('click', () => {
            closeOptionMenu();
            callback();
        });
        button._isBound = true;
        UPDATE_CALLBACKS[mod.key] = callback;
    }
};

const addButtons = () => { // Add mod buttons to the active round, with a little button to toggle them.
    try {
        if (!areModsAvailable()) {
            return false;
        }

        const bigMapContainer = getBigMapContainer();
        const modContainer = getModDiv(); // Includes header and buttons.
        if (modContainer || !bigMapContainer) { // Mods already loaded, or map not loaded yet.
            return false;
        }

        const modsContainer = document.createElement('div'); // Header and buttons.
        modsContainer.id = 'gg-mods-container';
        const headerContainer = document.createElement('div'); // Header and button toggle.
        headerContainer.id = 'gg-mods-header-container';
        const headerText = document.createElement('div');
        headerText.id = 'gg-mods-header';
        headerText.textContent = `TPEBOP'S MODS`;
        const version = (typeof MOD_VERSION !== 'undefined') ? MOD_VERSION : 'unknown';
        headerText.title = `Version: ${version}\nPress "Ctrl Shift ." to disable all and refresh.`;
        const modMenuToggle = document.createElement('button');
        modMenuToggle.id = 'gg-mods-container-toggle';
        modMenuToggle.textContent = '▼'; // TODO: load from localStorage.
        headerContainer.appendChild(headerText);
        headerContainer.appendChild(modMenuToggle);

        const buttonContainer = document.createElement('div'); // Mod buttons.
        buttonContainer.id = 'gg-mods-button-container';

        for (const [key, mod] of Object.entries(MODS)) {
            if (!mod.show) {
                continue;
            }
            try {
                const modButton = document.createElement('div');
                modButton.id = getModButtonId(mod);
                modButton.classList.add('gg-mod-button');
                modButton.title = mod.tooltip;
                const buttonText = getButtonText(mod);
                modButton.textContent = buttonText;
                buttonContainer.appendChild(modButton);
            } catch (err) {
                console.error(err);
            }
        }

        modsContainer.appendChild(headerContainer);
        modsContainer.appendChild(buttonContainer);

        const addButtonContainer = () => {
            if (!document.getElementById('gg-mods-container')) {
                bigMapContainer.appendChild(modsContainer);
                const verifyContainer = document.getElementById('gg-mods-container');
                if (verifyContainer) {
                    bindButtons();
                } else {
                    console.error('GeoGuessr MultiMod: Container was not found after append - something went wrong');
                }
            } else {
                bindButtons();
            }
        };

        modMenuToggle.addEventListener('click', function () {
            if (buttonContainer.classList.contains('hidden')) {
                buttonContainer.classList.remove('hidden');
                modMenuToggle.textContent = '▼';
            } else {
                buttonContainer.classList.add('hidden');
                modMenuToggle.textContent = '▶';
            }
        });

        setTimeout(addButtonContainer, 100);
        _MODS_LOADED = true;
        return true;

    } catch (err) {
        console.error('Error creating mod menu:', err);
        return false;
    }
};

const removeModMenu = () => {
    const modContainer = getModDiv();
    if (modContainer) {
        modContainer.remove();
        return true;
    }
    return false;
};

// Initialize the mod system.
// ===============================================================================================================================

let MAP_STATE = {
    map2d: false,
    map3d: false,
    tilesLoaded: false,
    lastRoundStart: 0,
};

const setUpMapEventListeners = () => {
    THE_WINDOW.addEventListener('gg_new_map_instance', (evt) => {
        console.debug('New map instance event: ', evt);
        setTimeout(() => {
            reapplyActiveModsToNewMaps();
        }, 500);
    });

    THE_WINDOW.addEventListener('gg_map_tiles_loaded', () => { // TODO: this is for satView in Opera. Check if it's still needed.
        const satViewMod = getBindings().find(([mod]) => mod.key === 'satView');
        if (satViewMod && satViewMod[0].active) {
            setTimeout(() => {
                satViewMod[1](true);
            }, 300);
        }
    });

    THE_WINDOW.addEventListener('gg_map_2d_ready', () => {
        MAP_STATE.map2d = true;
        MAP_STATE.tilesLoaded = true;
        reapplyActiveModsToNewMaps();
    });

    THE_WINDOW.addEventListener('gg_streetview_ready', () => {
        MAP_STATE.map3d = true;
        reapplyActiveModsToNewMaps();
    });

    THE_WINDOW.addEventListener('gg_streetview_position_changed', () => {
        MAP_STATE.map3d = true;
        reapplyActiveModsToNewMaps();
    });

    THE_WINDOW.addEventListener('gg_round_start', (evt) => {
        MAP_STATE = {
            map2d: false,
            map3d: false,
            tilesLoaded: false,
            lastRoundStart: Date.now()
        };
    });
};

const reapplyActiveModsToNewMaps = () => {
    const activeMods = getBindings().filter(([mod]) => mod.active && mod.show);
    if (activeMods.length === 0) {
        return;
    }
    if (!getModDiv()) {
        addButtons();
    }
    activeMods.forEach(([mod, callback]) => {
        try {
            callback(true);
        } catch (err) {
            console.error(`Error reapplying mod ${mod.name}:`, err);
        }
    });
};

const activateLoadedMods = () => {  // Refresh state from localStorage and activate mods.
    for (const [mod, callback] of getBindings()) {
        if (mod.show && mod.active) {
            try {
                callback(true); // True because it was loaded from state.
            } catch (err) {
                console.error(`activateLoadedMods: Error activating mod ${mod.name}:`, err);
            }
        }
    }
};

const initializeMods = async () => {
    if (_MODS_LOADED) {
        return;
    }

    const mapsReady = MAP_STATE.map2d && MAP_STATE.map3d;
    if (!mapsReady) {
        console.debug(`Maps not loaded yet; can't activate mods.`);
        setTimeout(initializeMods, 300);
    }

    try {
        loadState();
        activateLoadedMods();
        setUpMapEventListeners();
        addButtons();
        fixFormatting();

        if (!THE_WINDOW.DISABLE_CHEAT_PROTECTION) {
            setTimeout(() => {
                clickGarbage(900);
            }, 500);
        }

        if (DEBUG) {
            addDebugger();
        }

        // Create observer to monitor DOM changes and add buttons when the game interface loads.
        const observer = new MutationObserver(() => {
            try {
                addButtons();
            } catch (err) {
                console.error(err);
            }
        });

        // Start observing the React root element for changes
        const nextElement = document.querySelector('#__next');
        if (nextElement) {
            observer.observe(nextElement, { subtree: true, childList: true });
            addButtons();
        } else {
            const alternatives = ['#root', 'body', 'main'];
            let foundElement = null;

            for (const selector of alternatives) {
                const element = document.querySelector(selector);
                if (element) {
                    foundElement = element;
                    break;
                }
            }

            if (foundElement) {
                observer.observe(foundElement, { subtree: true, childList: true });
                addButtons();
            } else {
                setTimeout(initializeMods, 1000);
            }
        }
    } catch (err) {
        console.error(err);
    }
};

document.addEventListener('gg_maps_ready', () => {
    initializeMods();
});

fetchMapDataWithRetry = async (mapId, maxRetries = 3, retryDelay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            const response = await fetch(`https://www.geoguessr.com/api/maps/${mapId}`, {
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            if (!data) {
                throw new Error(`Invalid map data structure received. Data: ${data}`);
            }
            GG_MAP = data;
            return data;
        } catch (err) {
            console.warn(`GeoGuessr MultiMod: Map data fetch attempt ${attempt} failed:`, err);
            if (attempt === maxRetries) {
                console.error('Failed to fetch map data. Using backup.', err);
                GG_MAP = {
                    id: mapId,
                    maxErrorDistance: 20015086, // Default world map max distance in meters
                    name: 'Unknown Map (Fallback)',
                    description: 'Map data could not be loaded'
                };
                throw err;
            }
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
            }
        }
    }
};


// TODO: reduce bloat below this point -----------------------------------------------------------------------------------

// Periodic check to ensure GG_MAP is loaded properly
const ensureGGMapLoaded = () => {
    if (GG_ROUND && (!GG_MAP || !GG_MAP.maxErrorDistance)) {
        console.warn('GeoGuessr MultiMod: GG_MAP not loaded properly, attempting reload...');
        const mapID = GG_ROUND.map?.id || (GG_ROUND.mapId);
        if (mapID) {
            fetchMapDataWithRetry(mapID).catch(err => {
                console.error('GeoGuessr MultiMod: Retry map data fetch failed:', err);
            });
        }
    }
};

const isGoogleReady = () => {
    try {
        const google = getGoogle();
        if (!google || !google.maps) {
            return false;
        }
        const map2dReady = GOOGLE_MAP && getSmallMap();
        const map3dReady = GOOGLE_STREETVIEW && getBigMapCanvas();
        return map2dReady && map3dReady;
    } catch (err) {
        console.error('Error checking map readiness:', err);
        return false;
    }
};

const reactivateMods = () => {
    if (!isGoogleReady()) {
        return;
    }

    if (!getModDiv()) {
        const buttonsAdded = addButtons();
        if (buttonsAdded) {
            bindButtons();
        }
    }

    for (const [mod, callback] of getBindings()) {
        if (mod.active && mod.show) {
            try {
                callback(true);
            } catch (err) {
                console.error(`Error reactivating mod ${mod.name}:`, err);
            }
        }
    }

    THE_WINDOW.dispatchEvent(new CustomEvent('gg_mods_reactivate', { detail: { timestamp: Date.now() } }));
};

const onRoundStart = (evt) => {
    _MODS_LOADED = false;
    THE_WINDOW.localStorage.setItem(STATE_KEY, JSON.stringify(MODS));

    createQuoteOverlay();

    THE_WINDOW.dispatchEvent(new CustomEvent('gg_round_start', {
        detail: evt.detail || {}
    }));

    // Delay mod reactivation to allow maps to fully load
    // Use multiple attempts with increasing delays
    setTimeout(() => {
        reactivateMods();
    }, 3000); // Increased initial delay to 3 seconds

    try {
        let round, mapID;

        // Extract round and map data from event
        if (evt.detail && evt.detail.rounds) {
            round = evt.detail.rounds[evt.detail.rounds.length - 1];
            mapID = evt.detail.map?.id;
        } else if (evt.detail && evt.detail.game) {
            // Alternative structure
            round = evt.detail.game.round || evt.detail.game;
            mapID = evt.detail.game.map?.id || evt.detail.game.mapId;
        } else if (evt.detail) {
            // Direct structure
            round = evt.detail;
            mapID = evt.detail.map?.id || evt.detail.mapId;
        }

        if (!round) {
            console.warn('GeoGuessr MultiMod: Could not extract round data from event');
            return;
        }

        if (!mapID) {
            console.warn('GeoGuessr MultiMod: Could not extract map ID from event');
            return;
        }

        GG_ROUND = round;

        fetchMapDataWithRetry(mapID).catch(err => {
            console.error('GeoGuessr MultiMod: Final map data fetch failed:', err);
        });

    } catch (err) {
        console.error('GeoGuessr MultiMod: Error in round_start handler:', err);
    }
};

const onRoundEnd = (evt) => {
    GG_ROUND = undefined;
    GG_CLICK = undefined;
    GG_MAP = undefined;
}

const fetchMapDataWithRetry = async (mapId, maxRetries = 3, retryDelay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(`https://www.geoguessr.com/api/maps/${mapId}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            if (!data || typeof data.maxErrorDistance === 'undefined') {
                throw new Error('Invalid map data structure received');
            }

            GG_MAP = data;
            return data;

        } catch (err) {
            console.warn(`GeoGuessr MultiMod: Map data fetch attempt ${attempt} failed:`, err);

            if (attempt === maxRetries) {
                console.error('GeoGuessr MultiMod: Failed to fetch map data after all retries:', err);
                // Set a fallback GG_MAP with reasonable defaults
                GG_MAP = {
                    id: mapId,
                    maxErrorDistance: 20015086, // Default world map max distance in meters
                    name: 'Unknown Map (Fallback)',
                    description: 'Map data could not be loaded'
                };
                console.warn('GeoGuessr MultiMod: Using fallback GG_MAP:', GG_MAP);
                throw err;
            }

            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
            }
        }
    }
};

document.addEventListener('gg_round_start', (evt) => {
    debugger
});

const initGEF = () => {
    const GEF = THE_WINDOW.GeoGuessrEventFramework;
    if (!GEF) {
        console.error('GEF not loaded.');
        return;
    }
    GEF.events.addEventListener('gg_round_start', onRoundStart);
    GEF.events.addEventListener('gg_round_end', onRoundEnd);
};
initGEF();

const addKeyBindings = () => {
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

        // Handle hotkeys for mods
        for (const [mod, callback] of getBindings()) {
            if (mod.hotkey && evt.code === mod.hotkey) {
                evt.preventDefault();
                closeOptionMenu();
                callback();
                break;
            }
        }
    });
};
addKeyBindings();
