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

        const bigMapContainer = getStreetviewContainer();
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
                    console.error('Container was not found after append - something went wrong');
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
    roundStart: 0,
};

const setUpMapEventListeners = () => {
    THE_WINDOW.addEventListener('gg_map_2d_ready', () => {
        MAP_STATE.map2d = true;
        MAP_STATE.tilesLoaded = true;
    });

    THE_WINDOW.addEventListener('gg_streetview_ready', () => {
        MAP_STATE.map3d = true;
    });

    THE_WINDOW.addEventListener('gg_streetview_position_changed', () => {
        MAP_STATE.map3d = true;
    });

    THE_WINDOW.addEventListener('gg_map_tiles_loaded', () => {
        MAP_STATE.tilesLoaded = true;
    });

    THE_WINDOW.addEventListener('gg_round_start', (evt) => {
        MAP_STATE = {
            map2d: false,
            map3d: false,
            tilesLoaded: false,
            roundStart: Date.now()
        };
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

// Avoid trying multiple fetches for map data, but allow retries.
let _currentMapFetch;

const fetchMap = async (mapId, maxRetries = 5, retryDelay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(`https://www.geoguessr.com/api/maps/${mapId}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(response);
            }
            const data = await response.json();
            if (!data || !data.id) {
                throw new Error('Invalid map data structure received');
            }
            GG_MAP = data;
            return data;
        } catch (err) {
            console.error(err);
            if (attempt === maxRetries) {
                console.error('Failed to fetch map data after all retries:', err);
                GG_MAP = { // Set a fallback GG_MAP with reasonable defaults
                    id: mapId,
                    maxErrorDistance: 20015086, // Default world map max distance in meters
                    name: 'Unknown Map (Fallback)',
                    description: 'Map data could not be loaded'
                };
                console.warn('Using fallback GG_MAP:', GG_MAP);
                throw err;
            }
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
    }
};

const fetchMapWithRetry = async (mapId, maxRetries = 5, retryDelay = 1000) => {
    if (GG_MAP && GG_MAP.id) {
        return GG_MAP;
    }
    if (!mapId) {
        return;
    }
    if (_currentMapFetch && _currentMapId === mapId) { // No concurrent fetches.
        try {
            return await _currentMapFetch;
        } catch (err) {
            console.error(err);
        }
    }
    _currentMapFetch = fetchMap(mapId, maxRetries, retryDelay);
    try {
        const result = await _currentMapFetch;
        return result;
    } finally {
        _currentMapFetch = null;
    }
};

const startMapDataMonitoring = () => {
    if (_mapCheckInterval) {
        clearInterval(_mapCheckInterval);
    }
    
    // Check every 2 seconds, but only if needed
    _mapCheckInterval = setInterval(() => {
        ensureGGMapLoaded();
    }, 2000);
};

const stopMapDataMonitoring = () => {
    if (_mapCheckInterval) {
        clearInterval(_mapCheckInterval);
        _mapCheckInterval = null;
    }
};

const isGoogleReady = () => {
    try {
        const google = getGoogle();
        if (!google || !google.maps) {
            return false;
        }
        const map2dReady = GOOGLE_MAP && getGuessmap();
        const map3dReady = GOOGLE_STREETVIEW && getStreetviewCanvas();
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
            console.warn('Could not extract round data from event', evt.detail);
            return;
        }

        if (!mapID) {
            console.warn('Could not extract map ID from event', evt.detail);
            return;
        }

        // Set round data first
        GG_ROUND = round;

        // Initiate map data fetch with proper error handling
        fetchMapWithRetry(mapID)
            .then(mapData => {
                console.debug('Map data loaded successfully for round start:', mapData.id);
            })
            .catch(err => {
                console.error('onRoundStart: Map data fetch failed:', err);
                // Even if map data fails, we continue with the round
            });

    } catch (err) {
        console.error('Error in round_start handler:', err);
    }

    THE_WINDOW.dispatchEvent(new CustomEvent('gg_round_start', {
        detail: evt.detail || {}
    }));

    // Start monitoring map data after round start
    startMapDataMonitoring();

    waitForMapsReady(() => {
        reactivateMods();
    });
};

const onRoundEnd = (evt) => {
    // Stop monitoring map data
    stopMapDataMonitoring();
    
    GG_ROUND = undefined;
    GG_CLICK = undefined;
    GG_MAP = undefined;
    
    // Clear any ongoing map fetch
    _currentMapFetch = null;
    _currentMapId = null;
}

document.addEventListener('gg_round_start', (evt) => {
    debugger
});

const initGEF = () => {
    const GEF = THE_WINDOW.GeoGuessrEventFramework;
    if (!GEF) {
        console.error('GEF not loaded.');
        return;
    }
    GEF.events.addEventListener('round_start', onRoundStart);
    GEF.events.addEventListener('round_end', onRoundEnd);
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
