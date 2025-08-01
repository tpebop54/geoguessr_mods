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
                [MODS.displayOptions, updateDisplayOptions],
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
    _MODS_LOADED = true;
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

        if (typeof MODS !== 'undefined') {
        }

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
                console.error('Error creating mod button for', key, err);
            }
        }

        modsContainer.appendChild(headerContainer);
        modsContainer.appendChild(buttonContainer);

        const addContainerSafely = () => {
            // Double-check that our container won't conflict with React
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

        // Add container with a small delay to avoid React hydration conflicts
        setTimeout(addContainerSafely, 100);

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

const disableModsAsNeeded = () => {
    if (!areModsAvailable()) {
        removeModMenu();
        const allMods = Object.values(MODS);
        disableMods(allMods, false); // false = don't save to localStorage
        return;
    }
};

// Initialize the mod system.
// ===============================================================================================================================

let MAP_STATE = {
    map2d: false,
    map3d: false,
    streetViewReady: false,
    tilesLoaded: false,
    lastRoundStart: 0,
};

const setUpMapEventListeners = () => {
    THE_WINDOW.addEventListener('gg_new_map_instance', (evt) => {
        console.debug('New map instance event: ', evt);
        setTimeout(() => {
            reapplyActiveModsToNewMaps();
        }, 200);
    });

    THE_WINDOW.addEventListener('gg_map_tiles_loaded', () => { // TODO: this is for satView in Opera. Check if it's needed.
        const satViewMod = getBindings().find(([mod]) => mod.key === 'satView');
        if (satViewMod && satViewMod[0].active) {
            setTimeout(() => {
                satViewMod[1](true);
            }, 300);
        }
    });

    THE_WINDOW.addEventListener('gg_map_fully_ready', () => {
        setTimeout(() => {
            reapplyActiveModsToNewMaps();
        }, 500);
    });

    THE_WINDOW.addEventListener('gg_map_2d_ready', () => {
        MAP_STATE.map2d = true;
        MAP_STATE.tilesLoaded = true;
        reapplyActiveModsToNewMaps();
    });

    THE_WINDOW.addEventListener('gg_map_2d_idle', () => {
        MAP_STATE.map2d = true;
        reapplyActiveModsToNewMaps();
    });

    THE_WINDOW.addEventListener('gg_streetview_ready', () => {
        MAP_STATE.map3d = true;
        MAP_STATE.streetViewReady = true;
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
            streetViewReady: false,
            tilesLoaded: false,
            lastRoundStart: Date.now()
        };
    });
};

const bothMapsReady = MAP_STATE.map2d && MAP_STATE.map3d;
if (bothMapsReady) {

    setTimeout(() => {
        if (!getModDiv()) {
            addButtons();
            bindButtons();
        }
        for (const [mod, callback] of getBindings()) {
            if (mod.active && mod.show) {
                try {
                    callback(true);
                } catch (err) {
                    console.error(`Error in event-triggered reactivation of mod ${mod.name}:`, err);
                }
            }
        }
    }, 1000);
};

const reapplyActiveModsToNewMaps = () => {
    const activeMods = getBindings().filter(([mod]) => mod.active && mod.show);
    if (activeMods.length === 0) {
        return;
    }
    if (!getModDiv()) {
        addButtons();
        bindButtons();
    }
    activeMods.forEach(([mod, callback]) => {
        try {
            callback(true);
        } catch (err) {
            console.error(`Error reapplying mod ${mod.name}:`, err);
        }
    });
};

// Monitor URL changes and handle game page logic
const setUpHomepageMonitoring = () => {
    // Subscribe to location changes
    if (THE_WINDOW.GG_LOCATION_TRACKER) {
        THE_WINDOW.GG_LOCATION_TRACKER.subscribe('game-page-monitor', (newUrl, oldUrl) => {

            if (!areModsAvailable()) {
                removeModMenu();

                // Disable all mods temporarily
                const allMods = Object.values(MODS);
                disableMods(allMods, false);
            } else if (oldUrl) {
                const oldPath = new URL(oldUrl).pathname;
                const wasGamePage = areModsAvailable(oldPath);
                if (!wasGamePage) {
                    // Navigated to game page from non-game page - mods can be active again
                    // The normal initialization process will handle re-creating the menu
                }
            }
        }, 1000); // Check every second
    }
};

// Wait for React hydration to complete before initializing
const waitForReactHydration = () => {
    return new Promise((resolve) => {
        // Check if React has finished hydrating
        const checkHydration = () => {
            // Look for signs that React has finished hydrating
            const reactRoot = document.querySelector('#__next');
            if (!reactRoot) {
                // React root not found yet, wait longer
                setTimeout(checkHydration, 100);
                return;
            }

            // Check if React has added its event listeners (sign of hydration completion)
            const hasReactListeners = reactRoot._reactInternalFiber ||
                reactRoot._reactInternalInstance ||
                reactRoot._reactInternals ||
                reactRoot.__reactInternalInstance;

            if (hasReactListeners) {
                resolve();
            } else {
                setTimeout(checkHydration, 100);
            }
        };
        setTimeout(checkHydration, 500);
    });
};

// Activate mods that were loaded from localStorage
const activateLoadedMods = () => {
    try {
        for (const [mod, callback] of getBindings()) {
            if (mod.show && mod.active) {
                try {
                    callback(true); // True because it was loaded from state.
                } catch (err) {
                    console.error(`activateLoadedMods: Error activating mod ${mod.name}:`, err);
                }
            }
        }
        console.debug('activateLoadedMods: Completed mod activation');
    } catch (err) {
        console.error('activateLoadedMods: Error during mod activation:', err);
    }
};

// Initialize when DOM is ready and React has hydrated
const initializeMods = async () => {
    try {
        await waitForReactHydration();
        setUpMapEventListeners();
        setUpHomepageMonitoring();
        enforceCheatProtection();
        loadState(); // From localStorage, if available.
        disableModsAsNeeded();
        activateLoadedMods();
        fixFormatting();

        if (_CHEAT_DETECTION) {
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
                bindButtons();
            } catch (err) {
                console.error(err);
            }
        });

        // Start observing the React root element for changes
        const nextElement = document.querySelector('#__next');
        if (nextElement) {
            observer.observe(nextElement, { subtree: true, childList: true });
            addButtons();
            bindButtons();
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
                bindButtons();
            } else {
                setTimeout(initializeMods, 1000);
            }
        }
    } catch (err) {
        console.error(err);
    }
};

document.addEventListener('gg_maps_ready', () => { 
    debugger
});

// Start initialization when DOM is ready, but wait for React hydration
if (document.readyState === 'loading') {
    document.addEventListener('gg_maps_ready', () => {
        initializeMods().catch(err => {
            console.error('Mod nitialization failed:', err);
        });
    });
} else {
    initializeMods().catch(err => {
        console.error('Mod nitialization failed:', err);
    });
}

// Global variables and functions for round detection
let handleRoundStart, fetchMapDataWithRetry, mapDataCheckInterval;

const simulateRoundStart = () => {
    // Try to get game data from various sources
    let gameData = null;

    // Method 1: Check if GEF has current game data
    if (typeof GeoGuessrEventFramework !== 'undefined' && GeoGuessrEventFramework.game) {
        gameData = GeoGuessrEventFramework.game;
    }

    // Method 2: Try to extract from window objects
    if (!gameData && THE_WINDOW.__NEXT_DATA__) {
        try {
            const nextData = THE_WINDOW.__NEXT_DATA__;
            if (nextData.props && nextData.props.pageProps) {
                gameData = nextData.props.pageProps.game || nextData.props.pageProps;
            }
        } catch (err) {
        }
    }

    if (gameData && handleRoundStart) {
        handleRoundStart({ detail: gameData });
    } else {
        console.warn('GeoGuessr MultiMod: Could not find game data for simulation or handleRoundStart not defined');
    }
};

// Enhanced map data fetching with retry logic
fetchMapDataWithRetry = async (mapId, maxRetries = 3, retryDelay = 1000) => {

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch(`https://www.geoguessr.com/api/maps/${mapId}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Validate that we got the expected data structure
            if (!data || typeof data.maxErrorDistance === 'undefined') {
                throw new Error(`Invalid map data structure received. Data: ${JSON.stringify(data)}`);
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

            // Wait before retrying
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
            }
        }
    }
};

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

// Function to reactivate all currently active mods
const reactivateActiveMods = () => {

    // Dispatch a custom event that mods can listen for
    const reactivationEvent = new CustomEvent('gg_mods_reactivate', {
        detail: { timestamp: Date.now() }
    });
    THE_WINDOW.dispatchEvent(reactivationEvent);

    // Log which mods are active and should be reactivated
    const activeMods = getBindings().filter(([mod]) => mod.active && mod.show).map(([mod]) => mod.name);

    // Enhanced map readiness detection
    const checkAdvancedMapReadiness = () => {
        try {
            // Check for Google API availability
            const google = getGoogle();
            if (!google || !google.maps) {
                return false;
            }

            // Check for 2D map readiness with enhanced detection
            const map2dReady = (
                GOOGLE_MAP &&
                GOOGLE_MAP.getBounds &&
                typeof GOOGLE_MAP.getBounds === 'function' &&
                GOOGLE_MAP.getBounds() &&
                GOOGLE_MAP.getCenter &&
                typeof GOOGLE_MAP.getCenter === 'function' &&
                // Also check DOM elements
                document.querySelector('.gm-style') &&
                document.querySelector('div[class^="guess-map_canvas__"]')
            );

            // Check for 3D map readiness with enhanced detection
            const map3dReady = (
                GOOGLE_STREETVIEW &&
                GOOGLE_STREETVIEW.getPosition &&
                typeof GOOGLE_STREETVIEW.getPosition === 'function' &&
                // Check for street view canvas
                document.querySelector('.widget-scene-canvas') &&
                // Check that the panorama is actually loaded
                document.querySelector('[data-qa="panorama"]')
            );

            return map2dReady && map3dReady;
        } catch (err) {
            console.error('Error checking map readiness:', err);
            return false;
        }
    };

    // Ensure buttons are available before reactivation
    const ensureButtonsAndReactivate = () => {
        // First try to add buttons if they don't exist
        if (!getModDiv()) {
            const buttonsAdded = addButtons();
            if (buttonsAdded) {
                bindButtons();
            }
        }

        // Use enhanced map readiness checking
        const attemptReactivation = (attempt = 1, maxAttempts = 40) => {
            if (checkAdvancedMapReadiness()) {

                // Add a small additional delay to ensure everything is stable
                setTimeout(() => {
                    for (const [mod, callback] of getBindings()) {
                        if (mod.active && mod.show) {
                            try {
                                // Force reactivation by setting forceState to true
                                callback(true);
                            } catch (err) {
                                console.error(`Error reactivating mod ${mod.name}:`, err);
                            }
                        }
                    }
                }, 500); // Small additional delay for stability

                return;
            }

            if (attempt >= maxAttempts) {
                console.warn(`Map readiness timeout after ${attempt} attempts, forcing mod reactivation`);

                // Force reactivation even if maps aren't fully ready
                for (const [mod, callback] of getBindings()) {
                    if (mod.active && mod.show) {
                        try {
                            callback(true);
                        } catch (err) {
                            console.error(`Error force reactivating mod ${mod.name}:`, err);
                        }
                    }
                }
                return;
            }

            // Log progress every few attempts
            if (attempt % 10 === 0) {
            }

            // Try again after a short delay
            setTimeout(() => attemptReactivation(attempt + 1, maxAttempts), 250);
        };

        attemptReactivation();
    };

    // Schedule reactivation with increased delays
    setTimeout(ensureButtonsAndReactivate, 2000);  // Wait 2 seconds initially
    setTimeout(ensureButtonsAndReactivate, 4000);  // Retry after 4 seconds
    setTimeout(ensureButtonsAndReactivate, 6000);  // Final retry after 6 seconds
};

// Round start event handler
handleRoundStart = (evt) => {

    // Reset mod button binding state for new round
    _MODS_LOADED = false;

    // Clear any existing interval
    if (mapDataCheckInterval) {
        clearInterval(mapDataCheckInterval);
    }

    // Start periodic check for GG_MAP
    mapDataCheckInterval = setInterval(ensureGGMapLoaded, 3000); // Check every 3 seconds

    // Save current state to localStorage
    saveState();

    // Dispatch round_start as a window event so mods can listen for it
    THE_WINDOW.dispatchEvent(new CustomEvent('gg_round_start', {
        detail: evt.detail || {}
    }));

    // Re-activate all currently active mods (waitForMapsReady is called inside)
    reactivateActiveMods();

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

        // Additional debugging for map ID extraction
        if (evt.detail) {
            if (evt.detail.map) {
            }
            if (evt.detail.game && evt.detail.game.map) {
            }
        }

        if (!round) {
            console.warn('GeoGuessr MultiMod: Could not extract round data from event');
            return;
        }

        if (!mapID) {
            console.warn('GeoGuessr MultiMod: Could not extract map ID from event');
            console.warn('GeoGuessr MultiMod: Available event structure:', evt.detail);

            // Fallback: try legacy approach
            try {
                if (evt.detail && evt.detail.map && evt.detail.map.id) {
                    mapID = evt.detail.map.id;
                }
            } catch (fallbackErr) {
            }

            if (!mapID) {
                return;
            }
        }

        GG_ROUND = round;

        fetchMapDataWithRetry(mapID).catch(err => {
            console.error('GeoGuessr MultiMod: Final map data fetch failed:', err);

            // Legacy fallback approach - simple fetch without retries
            fetch(`https://www.geoguessr.com/api/maps/${mapID}`)
                .then(response => response.json())
                .then(data => {
                    if (data && typeof data.maxErrorDistance !== 'undefined') {
                        GG_MAP = data;
                    } else {
                        console.warn('GeoGuessr MultiMod: Legacy fallback returned invalid data');
                    }
                })
                .catch(legacyErr => {
                    console.error('GeoGuessr MultiMod: Legacy fallback also failed:', legacyErr);
                });
        });

    } catch (err) {
        console.error('GeoGuessr MultiMod: Error in round_start handler:', err);
    }
};

// Initialize GeoGuessrEventFramework after a small delay to ensure all modules are loaded
let initRetryCount = 0;
const maxRetries = 10;

setTimeout(() => {
    initializeEventFramework();
}, 1000); // Increased delay for better compatibility

function initializeEventFramework() {
    // Initialize GeoGuessrEventFramework for round events and map data
    try {
        // Try to find GeoGuessrEventFramework from multiple sources
        let GEF = null;
        if (typeof GeoGuessrEventFramework !== 'undefined') {
            GEF = GeoGuessrEventFramework;
        } else if (typeof THE_WINDOW.GeoGuessrEventFramework !== 'undefined') {
            GEF = THE_WINDOW.GeoGuessrEventFramework;
        } else if (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.GeoGuessrEventFramework !== 'undefined') {
            GEF = unsafeWindow.GeoGuessrEventFramework;
        } else {
        }

        if (!GEF) {
            initRetryCount++;
            if (initRetryCount >= maxRetries) {
                console.error('GeoGuessr MultiMod: Failed to initialize GeoGuessrEventFramework after maximum retries');
                return;
            }
            console.error('GeoGuessr MultiMod: GeoGuessrEventFramework is not defined, retrying in 2 seconds...');
            setTimeout(initializeEventFramework, 2000); // Increased retry delay
            return;
        }

        // Additional validation - ensure GEF has the events property
        if (!GEF.events || typeof GEF.events.addEventListener !== 'function') {
            initRetryCount++;
            if (initRetryCount >= maxRetries) {
                console.error('GeoGuessr MultiMod: GeoGuessrEventFramework found but not properly initialized after maximum retries');
                return;
            }
            console.error('GeoGuessr MultiMod: GeoGuessrEventFramework found but not properly initialized, retrying in 2 seconds...');
            setTimeout(initializeEventFramework, 2000);
            return;
        }

        // Start global background map loading
        startGlobalMapLoading();

        // Now set up the event listeners with proper handlers
        const setupEventListeners = () => {
            try {
                // Add the main event listeners
                GEF.events.addEventListener('round_start', handleRoundStart);

                GEF.events.addEventListener('round_end', (evt) => {
                    // Clear the periodic check interval
                    if (mapDataCheckInterval) {
                        clearInterval(mapDataCheckInterval);
                        mapDataCheckInterval = null;
                    }

                    // Reset global map loading state
                    lastAttemptedMapId = null;

                    GG_ROUND = undefined;
                    GG_CLICK = undefined;
                });

                // Test listener to verify events are working
                GEF.events.addEventListener('guess', (evt) => {
                });
            } catch (err) {
                console.error('GeoGuessr MultiMod: Failed to add event listeners:', err);
            }
        };

        setupEventListeners();

        // Set up DOM observer for fallback detection
        setupDOMObserver();

        // Alternative: Monitor for round changes using URL and DOM changes
        let currentUrl = THE_WINDOW.location.href;
        let roundChangeDetected = false;

        const detectRoundChange = () => {
            const newUrl = THE_WINDOW.location.href;
            if (newUrl !== currentUrl) {
                currentUrl = newUrl;

                // Check if this looks like a game URL
                if (newUrl.includes('/game/') || newUrl.includes('/challenge/')) {
                    roundChangeDetected = true;

                    // Try to extract game data from the page
                    setTimeout(() => {
                        try {
                            simulateRoundStart();
                        } catch (err) {
                            console.error('GeoGuessr MultiMod: Error in simulated round start:', err);
                        }
                    }, 2000); // Give the page time to load
                }
            }
        };

        // Monitor URL changes
        setInterval(detectRoundChange, 1000);

        // Also listen for navigation events
        THE_WINDOW.addEventListener('popstate', detectRoundChange);
        THE_WINDOW.addEventListener('pushstate', detectRoundChange);
        THE_WINDOW.addEventListener('replacestate', detectRoundChange);

        // Periodic check to ensure GG_MAP is loaded properly
        let mapDataCheckInterval;
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

        handleRoundStart = (evt) => {

            // Reset mod button binding state for new round
            _MODS_LOADED = false;

            // Clear any existing interval
            if (mapDataCheckInterval) {
                clearInterval(mapDataCheckInterval);
            }

            // Start periodic check for GG_MAP
            mapDataCheckInterval = setInterval(ensureGGMapLoaded, 3000); // Check every 3 seconds

            THE_WINDOW.localStorage.setItem(STATE_KEY, JSON.stringify(MODS));

            // Dispatch round_start as a window event so mods can listen for it
            THE_WINDOW.dispatchEvent(new CustomEvent('gg_round_start', {
                detail: evt.detail || {}
            }));

            // Delay mod reactivation to allow maps to fully load
            // Use multiple attempts with increasing delays
            setTimeout(() => {
                reactivateActiveMods();
            }, 3000); // Increased initial delay to 3 seconds

            // Backup reactivation attempt in case the first one fails
            setTimeout(() => {
                reactivateActiveMods();
            }, 6000); // Backup attempt after 6 seconds

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

        // Enhanced map data fetching with retry logic (moved outside event handler)
        fetchMapDataWithRetry = async (mapId, maxRetries = 3, retryDelay = 1000) => {
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

                    const response = await fetch(`https://www.geoguessr.com/api/maps/${mapId}`, {
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    const data = await response.json();

                    // Validate that we got the expected data structure
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

                    // Wait before retrying
                    if (attempt < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
                    }
                }
            }
        };

        GEF.events.addEventListener('round_start', handleRoundStart);

        GEF.events.addEventListener('round_end', (evt) => {
            // Clear the periodic check interval
            if (mapDataCheckInterval) {
                clearInterval(mapDataCheckInterval);
                mapDataCheckInterval = null;
            }

            // Reset global map loading state
            lastAttemptedMapId = null;

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
    } catch (err) {
        console.error('GeoGuessr MultiMod: Exception during GeoGuessrEventFramework setup:', err);
        initRetryCount++;
        if (initRetryCount < maxRetries) {
            // Retry if there was an exception
            setTimeout(initializeEventFramework, 2000);
        } else {
            console.error('GeoGuessr MultiMod: Failed to initialize GeoGuessrEventFramework after maximum retries');
        }
    }
    /* eslint-enable no-undef */
}

// Additional DOM-based round detection as fallback
const setupDOMObserver = () => {
    const gameObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            // Look for game-related elements being added
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Check for street view container or game canvas
                    if (node.querySelector && (
                        node.querySelector('[data-qa="panorama"]') ||
                        node.querySelector('[data-qa="guess-map"]') ||
                        node.querySelector('.widget-scene-canvas') ||
                        node.id === 'street-view-container'
                    )) {
                        // Delay to let the game fully initialize
                        setTimeout(() => {
                            if (!GG_ROUND) {
                                simulateRoundStart();
                            }
                        }, 3000);
                    }
                }
            }
        }
    });

    // Observe the main container for changes
    const container = document.querySelector('#__next') || document.body;
    gameObserver.observe(container, {
        childList: true,
        subtree: true
    });
};

// Global GG_MAP loading with background retries
let globalMapLoadInterval;
let lastAttemptedMapId = null;

const startGlobalMapLoading = () => {
    if (globalMapLoadInterval) {
        clearInterval(globalMapLoadInterval);
    }

    globalMapLoadInterval = setInterval(() => {
        // Only attempt if we have round data but no map data
        if (GG_ROUND && (!GG_MAP || !GG_MAP.maxErrorDistance)) {
            const mapId = GG_ROUND.map?.id || GG_ROUND.mapId;

            // Don't keep retrying the same failed map
            if (mapId && mapId !== lastAttemptedMapId) {
                lastAttemptedMapId = mapId;

                fetchMapDataWithRetry(mapId, 2, 2000).catch(err => {
                    console.warn('GeoGuessr MultiMod: Background map load failed:', err);
                });
            }
        }
    }, 5000); // Check every 5 seconds
};
