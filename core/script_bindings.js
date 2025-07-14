// ==UserScript==
// @author       tpebop

// ==/UserScript==

// Add bindings and start the script.
// ===============================================================================================================================

// Must add each mod to this list to bind the buttons and hotkeys.
let _BINDINGS = null;

// Lazy initialize bindings to avoid dependency loading issues
const getBindings = () => {
    if (_BINDINGS === null) {
        try {
            _BINDINGS = [
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
        } catch (err) {
            console.error('Error initializing bindings:', err);
            _BINDINGS = []; // Fallback to empty array
        }
    }
    return _BINDINGS;
};

const bindButtons = () => {
    let boundCount = 0;
    
    for (const [mod, callback] of getBindings()) {
        if (!mod.show) {
            continue;
        }
        UPDATE_CALLBACKS[mod.key] = callback;
        const button = getModButton(mod);
        if (!button) {
            console.debug(`Mod button ${mod.key} not found, skipping binding.`);
            continue;
        }
        
        // Check if button already has event listeners by checking for a custom property
        if (button._ggModsBound) {
            continue; // Skip if already bound
        }
        
        // If option menu is open, close it. If enabling a mod, open the option menu.
        button.addEventListener('click', () => {
            closeOptionMenu();
            callback();
        });
        
        // Mark this button as bound
        button._ggModsBound = true;
        boundCount++;
    }
    
    if (boundCount > 0) {
        console.debug(`Bound ${boundCount} mod buttons`);
        _MODS_LOADED = true;
    }
};

const addButtons = () => { // Add mod buttons to the active round, with a little button to toggle them.
    try {
        // Only show mods menu on game and live-challenge pages
        const currentUrl = window.location.href;
        const currentPath = window.location.pathname;
        
        // Check if we're on a supported game page
        const isGameUrl = currentPath.includes('/game/') || currentPath.includes('/live-challenge/');
        
        if (!isGameUrl) {
            console.debug('GeoGuessr MultiMod: Not on a game page, not showing mods menu. Path:', currentPath);
            return false;
        }
        
        const bigMapContainer = getBigMapContainer();
        const modContainer = getModDiv(); // Includes header and buttons.
        
        if (!bigMapContainer) {
            console.debug('GeoGuessr MultiMod: Game container not found, will retry...');
            return false;
        }
        
        if (modContainer) {
            console.debug('GeoGuessr MultiMod: Mod container already exists');
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
        headerText.title = `Version: ${version}`;
        const modMenuToggle = document.createElement('button');
        modMenuToggle.id = 'gg-mods-container-toggle';
        modMenuToggle.textContent = '▼'; // TODO: load from localStorage.
        headerContainer.appendChild(headerText);
        headerContainer.appendChild(modMenuToggle);

        const buttonContainer = document.createElement('div'); // Mod buttons.
        buttonContainer.id = 'gg-mods-button-container';

        let buttonCount = 0;
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
                console.debug(`Created button for ${mod.name} with text: "${buttonText}" (active: ${mod.active})`);
                
                buttonContainer.appendChild(modButton);
                buttonCount++;
            } catch (err) {
                console.error('Error creating mod button for', key, err);
            }
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
        console.error('Error creating mod menu:', err);
        return false;
    }
};

/**
 Some mods currently don't work with competitive games.
 Disable those conditionally. This will be fixed in the future.
 */
const disableModsAsNeeded = () => {
    const pathname = window.location.pathname;
    const currentUrl = window.location.href;
    
    // Only enable mods on game and live-challenge pages
    const isGameUrl = pathname.includes('/game/') || pathname.includes('/live-challenge/');
    
    if (!isGameUrl) {
        console.debug('GeoGuessr MultiMod: Not on a game page, disabling all mods and hiding menu. Path:', pathname);
        
        // Remove any existing mod menu
        removeModMenu();
        
        // Disable all mods temporarily for this session
        const allMods = Object.values(MODS);
        disableMods(allMods, false); // false = don't save to localStorage
        return;
    }
    
    // Additional specific mod restrictions for live challenges can be added here if needed
    // (Currently no specific restrictions for live challenges)
};

// Initialize the mod system
// ===============================================================================================================================

// Track map readiness states
let mapReadinessState = {
    map2d: false,
    map3d: false,
    streetViewReady: false,
    tilesLoaded: false,
    lastRoundStart: 0
};

// Enhanced map event listeners for more reliable mod activation
const setupMapEventListeners = () => {
    // Listen for new map instances being created (most important for immediate mod reapplication)
    window.addEventListener('gg_new_map_instance', (evt) => {
        const { type, map, streetView } = evt.detail;
        
        // Immediately reapply all active mods to the new map instance
        setTimeout(() => {
            reapplyActiveModsToNewMaps();
        }, 200); // Short delay to ensure map is fully initialized
    });
    
    // Listen for map tiles being fully loaded (important for satellite view)
    window.addEventListener('gg_map_tiles_loaded', () => {
        console.debug('GeoGuessr MultiMod: Map tiles loaded, checking for satellite view mod');
        // Specifically reapply satellite view if it's active
        const satViewMod = getBindings().find(([mod]) => mod.key === 'satView');
        if (satViewMod && satViewMod[0].active) {
            console.debug('GeoGuessr MultiMod: Reapplying satellite view after tiles loaded');
            setTimeout(() => {
                satViewMod[1](true); // Force reapply satellite view
            }, 300);
        }
    });
    
    // Listen for map being fully ready (backup for all mods)
    window.addEventListener('gg_map_fully_ready', () => {
        console.debug('GeoGuessr MultiMod: Map fully ready, doing final mod check');
        setTimeout(() => {
            // Final reapplication of all active mods
            reapplyActiveModsToNewMaps();
        }, 500);
    });
    
    // Listen for 2D map events
    window.addEventListener('gg_map_2d_ready', () => {
        console.debug('GeoGuessr MultiMod: 2D map ready event received');
        mapReadinessState.map2d = true;
        mapReadinessState.tilesLoaded = true;
        checkAndActivateModsIfReady();
    });
    
    window.addEventListener('gg_map_2d_idle', () => {
        console.debug('GeoGuessr MultiMod: 2D map idle event received');
        mapReadinessState.map2d = true;
        checkAndActivateModsIfReady();
    });
    
    // Listen for Street View events
    window.addEventListener('gg_streetview_ready', () => {
        console.debug('GeoGuessr MultiMod: Street View ready event received');
        mapReadinessState.map3d = true;
        mapReadinessState.streetViewReady = true;
        checkAndActivateModsIfReady();
    });
    
    window.addEventListener('gg_streetview_position_changed', () => {
        console.debug('GeoGuessr MultiMod: Street View position changed');
        mapReadinessState.map3d = true;
        checkAndActivateModsIfReady();
    });
    
    // Listen for round start events to reset state
    window.addEventListener('gg_round_start', (evt) => {
        console.debug('GeoGuessr MultiMod: Round start event - resetting map readiness state');
        mapReadinessState = {
            map2d: false,
            map3d: false,
            streetViewReady: false,
            tilesLoaded: false,
            lastRoundStart: Date.now()
        };
    });
};

// Check if both maps are ready and activate mods if needed
const checkAndActivateModsIfReady = () => {
    // Only proceed if we've had a recent round start
    if (Date.now() - mapReadinessState.lastRoundStart > 30000) {
        return; // Too old, ignore
    }
    
    const bothMapsReady = mapReadinessState.map2d && mapReadinessState.map3d;
    
    console.debug('GeoGuessr MultiMod: Map readiness check:', {
        map2d: mapReadinessState.map2d,
        map3d: mapReadinessState.map3d,
        bothReady: bothMapsReady,
        timeSinceRoundStart: Date.now() - mapReadinessState.lastRoundStart
    });
    
    if (bothMapsReady) {
        
        // Small delay to ensure everything is settled
        setTimeout(() => {
            // Ensure buttons exist
            if (!getModDiv()) {
                addButtons();
                bindButtons();
            }
            
            // Reactivate all active mods
            for (const [mod, callback] of getBindings()) {
                if (mod.active && mod.show) {
                    console.debug(`Event-triggered reactivation of mod: ${mod.name}`);
                    try {
                        callback(true);
                    } catch (err) {
                        console.error(`Error in event-triggered reactivation of mod ${mod.name}:`, err);
                    }
                }
            }
        }, 1000); // 1 second delay for stability
    }
};

// Immediately reapply active mods to newly created map instances
const reapplyActiveModsToNewMaps = () => {
    
    // Get list of currently active mods
    const activeMods = getBindings().filter(([mod]) => mod.active && mod.show);
    
    if (activeMods.length === 0) {
        console.debug('No active mods to reapply');
        return;
    }
    
    console.debug(`Reapplying ${activeMods.length} active mods to new maps:`, activeMods.map(([mod]) => mod.name));
    
    // Ensure mod buttons exist first
    if (!getModDiv()) {
        addButtons();
        bindButtons();
    }
    
    // Reapply each active mod immediately
    activeMods.forEach(([mod, callback]) => {
        console.debug(`🔧 Reapplying mod: ${mod.name}`);
        try {
            // Force the mod to reapply by calling with true
            callback(true);
        } catch (err) {
            console.error(`❌ Error reapplying mod ${mod.name}:`, err);
        }
    });
    
};

// Global keyboard shortcuts
// ===============================================================================================================================

const setupGlobalKeyBindings = () => {
    document.addEventListener('keydown', (evt) => {
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
        
        // Zoom controls (legacy compatibility)
        if (evt.key === ',' && GOOGLE_MAP && !isModActive(MODS.zoomInOnly)) {
            GOOGLE_MAP.setZoom(GOOGLE_MAP.getZoom() - 0.6);
        }
        if (evt.key === '.' && GOOGLE_MAP) {
            GOOGLE_MAP.setZoom(GOOGLE_MAP.getZoom() + 0.6);
        }

        // Google Maps integration for lottery mod locations
        if (evt.ctrlKey && (evt.key === '{' || evt.key === ']')) {
            evt.preventDefault(); // Prevent browser shortcuts
            handleGoogleMapsShortcut(evt.key);
        }

        // Nuclear option to disable all mods if things get out of control
        if (evt.altKey && evt.shiftKey && evt.key === '>') {
            clearState();
            window.location.reload();
        }
    });
};

const handleGoogleMapsShortcut = (key) => {
    const lotteryMod = MODS.lottery;
    if (!lotteryMod || !isModActive(lotteryMod)) {
        console.debug('Google Maps shortcuts require lottery mod to be active');
        return;
    }

    const onlyLand = getOption(lotteryMod, 'onlyLand');
    const onlyStreetView = getOption(lotteryMod, 'onlyStreetView');
    
    // Check if either special option is enabled
    if (!onlyLand && !onlyStreetView) {
        console.debug('Google Maps shortcuts require "Only Land" or "Only Street View" options to be enabled');
        return;
    }

    // Get the actual location
    const actualLoc = getActualLoc();
    if (!actualLoc) {
        console.warn('Cannot open Google Maps: actual location not available');
        return;
    }

    const lat = actualLoc.lat;
    const lng = actualLoc.lng;
    
    if (key === '{') {
        // Ctrl+[ - Open actual location in Google Maps (standard view)
        const mapsUrl = `https://www.google.com/maps/@${lat},${lng},15z`;
        GM_openInTab(mapsUrl, false);
        console.debug(`Opened actual location in Google Maps: ${lat}, ${lng}`);
    } else if (key === ']') {
        // Ctrl+] - Open aerial view of nearest land location OR street view if both are enabled
        let mapsUrl;
        
        if (onlyStreetView && onlyLand) {
            // Both enabled - open Street View location (as per user requirement)
            mapsUrl = `https://www.google.com/maps/@${lat},${lng},3a,75y,90t/data=!3m1!1e1`;
            console.debug(`Opened Street View location (both options enabled): ${lat}, ${lng}`);
        } else if (onlyStreetView) {
            // Only Street View enabled - open Street View
            mapsUrl = `https://www.google.com/maps/@${lat},${lng},3a,75y,90t/data=!3m1!1e1`;
            console.debug(`Opened Street View location: ${lat}, ${lng}`);
        } else if (onlyLand) {
            // Only Land enabled - open aerial view of nearest land location
            mapsUrl = `https://www.google.com/maps/@${lat},${lng},15z/data=!3m1!1e3`;
            console.debug(`Opened aerial view of nearest land location: ${lat}, ${lng}`);
        }
        
        if (mapsUrl) {
            GM_openInTab(mapsUrl, false);
        }
    }
};

// Initialize when DOM is ready
const initializeMods = () => {
    try {
        // Setup enhanced map event listeners first
        setupMapEventListeners();
        
        // Setup game page monitoring for URL changes
        setupHomepageMonitoring();
        
        // Enforce cheat protection
        enforceCheatProtection();
        
        // Load configuration from localStorage
        loadState();
        
        // Disable mods as needed based on current page
        disableModsAsNeeded();

        // Create observer to monitor DOM changes and add buttons when the game interface loads
        const observer = new MutationObserver(() => {
            try {
                const buttonsAdded = addButtons();
                
                // Ensure buttons are bound even if they were already created
                if (!buttonsAdded) {
                    bindButtons(); // Try to bind existing buttons
                }
                
                // Remove game reactions div (anti-cheat method from GeoGuessr that's annoying)
                const reactionsDiv = getGameReactionsDiv();
                if (reactionsDiv) {
                    reactionsDiv.parentElement.removeChild(reactionsDiv);
                }
                return buttonsAdded;
            } catch (err) {
                console.error(err);
            }
        });

        // Start observing the React root element for changes
        const nextElement = document.querySelector('#__next');
        if (nextElement) {
            observer.observe(nextElement, { subtree: true, childList: true });
            
            // Also try to add buttons immediately in case the page is already loaded
            addButtons();
        } else {
            
            // Try alternative selectors
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
                // Retry after a short delay
                setTimeout(initializeMods, 1000);
            }
        }
        
        // Set up periodic button binding check to ensure buttons remain clickable
        setInterval(() => {
            try {
                bindButtons();
            } catch (err) {
                console.debug('Error in periodic button binding check:', err);
            }
        }, 5000); // Check every 5 seconds
        
        // Setup global keyboard shortcuts
        setupGlobalKeyBindings();
        
    } catch (err) {
        console.error(err);
    }
};

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMods);
} else {
    // DOM is already ready
    initializeMods();
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
    if (!gameData && window.__NEXT_DATA__) {
        try {
            const nextData = window.__NEXT_DATA__;
            if (nextData.props && nextData.props.pageProps) {
                gameData = nextData.props.pageProps.game || nextData.props.pageProps;
            }
        } catch (err) {
            console.debug('GeoGuessr MultiMod: Could not extract from __NEXT_DATA__:', err);
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
            console.debug(`GeoGuessr MultiMod: Fetching map data attempt ${attempt}/${maxRetries}`);
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
            console.debug('GeoGuessr MultiMod: GG_MAP loaded successfully:', GG_MAP);
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
    window.dispatchEvent(reactivationEvent);
    
    // Log which mods are active and should be reactivated
    const activeMods = getBindings().filter(([mod]) => mod.active && mod.show).map(([mod]) => mod.name);
    console.debug('Active mods to reactivate:', activeMods);
    
    // Enhanced map readiness detection
    const checkAdvancedMapReadiness = () => {
        try {
            // Check for Google API availability
            const google = getGoogle();
            if (!google || !google.maps) {
                console.debug('Google Maps API not available yet');
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
            
            console.debug(`Map readiness check: 2D=${map2dReady}, 3D=${map3dReady}`);
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
                console.debug('Created and bound mod buttons before reactivation');
            }
        }
        
        // Use enhanced map readiness checking
        const attemptReactivation = (attempt = 1, maxAttempts = 40) => {
            if (checkAdvancedMapReadiness()) {
                console.debug('Maps fully ready, reactivating active mods now');
                
                // Add a small additional delay to ensure everything is stable
                setTimeout(() => {
                    for (const [mod, callback] of getBindings()) {
                        if (mod.active && mod.show) {
                            console.debug(`Reactivating mod: ${mod.name}`);
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
                        console.debug(`Force reactivating mod: ${mod.name}`);
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
                console.debug(`Still waiting for maps to be ready, attempt ${attempt}/${maxAttempts}`);
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
    window.dispatchEvent(new CustomEvent('gg_round_start', { 
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
        
        if (!round) {
            console.warn('GeoGuessr MultiMod: Could not extract round data from event');
            return;
        }
        
        if (!mapID) {
            console.warn('GeoGuessr MultiMod: Could not extract map ID from event');
            return;
        }
        
        GG_ROUND = round;
        console.debug('GeoGuessr MultiMod: Round data set:', GG_ROUND);
        console.debug('GeoGuessr MultiMod: Fetching map data for mapID:', mapID);
        
        fetchMapDataWithRetry(mapID).catch(err => {
            console.error('GeoGuessr MultiMod: Final map data fetch failed:', err);
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
    /* eslint-disable no-undef */
    try {
        // Try to find GeoGuessrEventFramework from multiple sources
        let GEF = null;
        if (typeof GeoGuessrEventFramework !== 'undefined') {
            GEF = GeoGuessrEventFramework;
        } else if (typeof window.GeoGuessrEventFramework !== 'undefined') {
            GEF = window.GeoGuessrEventFramework;
        } else if (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.GeoGuessrEventFramework !== 'undefined') {
            GEF = unsafeWindow.GeoGuessrEventFramework;
        } else {
            console.debug('GeoGuessr MultiMod: GeoGuessrEventFramework not found in any context');
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
        let currentUrl = window.location.href;
        let roundChangeDetected = false;
        
        const detectRoundChange = () => {
            const newUrl = window.location.href;
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
        window.addEventListener('popstate', detectRoundChange);
        window.addEventListener('pushstate', detectRoundChange);
        window.addEventListener('replacestate', detectRoundChange);
                
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
            
            window.localStorage.setItem(STATE_KEY, JSON.stringify(MODS));
            
            // Dispatch round_start as a window event so mods can listen for it
            window.dispatchEvent(new CustomEvent('gg_round_start', { 
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
                console.debug('GeoGuessr MultiMod: Round data set:', GG_ROUND);
                console.debug('GeoGuessr MultiMod: Fetching map data for mapID:', mapID);
                
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
                    console.debug(`GeoGuessr MultiMod: Fetching map data attempt ${attempt}/${maxRetries}`);
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
                    console.debug('GeoGuessr MultiMod: GG_MAP loaded successfully:', GG_MAP);
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

const stopGlobalMapLoading = () => {
    if (globalMapLoadInterval) {
        clearInterval(globalMapLoadInterval);
        globalMapLoadInterval = null;
        lastAttemptedMapId = null;
    }
};

// Enhanced debugging for mod activation issues
const debugModActivation = () => {
    console.group('🔧 GeoGuessr MultiMod Debug Information');
    
    
    if (GOOGLE_MAP) {
        try {
        } catch (err) {
        }
    }
    
    if (GOOGLE_STREETVIEW) {
        try {
        } catch (err) {
        }
    }
    
    
    
    const activeMods = getBindings().filter(([mod]) => mod.active && mod.show);
    activeMods.forEach(([mod]) => {
        
        // Show specific mod effects for debugging
        if (mod.key === 'satView' && GOOGLE_MAP) {
            try {
            } catch (err) {
            }
        }
        if (mod.key === 'rotateMap' && GOOGLE_MAP) {
            try {
            } catch (err) {
            }
        }
    });
    
    console.groupEnd();
};

// Add debug command to global scope for easy access
window.debugGGMods = debugModActivation;

// Manual reactivation function for debugging
window.reactivateGGMods = () => {
    debugModActivation();
    reactivateActiveMods();
};

// Function to force check map readiness
window.checkGGMapsReady = () => {
    debugModActivation();
    checkAndActivateModsIfReady();
};

// Function to manually reapply mods to current maps
window.reapplyGGMods = () => {
    debugModActivation();
    reapplyActiveModsToNewMaps();
};

// Debug function specifically for satellite view issues
window.debugSatelliteView = () => {
    console.group('🛰️ Satellite View Debug Information');
    
    const satViewMod = MODS.satView;
    
    if (GOOGLE_MAP) {
        try {
            // Try to manually set satellite view
            GOOGLE_MAP.setMapTypeId('satellite');
            
            setTimeout(() => {
                // Check if satellite view was applied
            }, 1000);
            
        } catch (err) {
            console.error('Error in satellite view debug:', err);
        }
    }
    
    console.groupEnd();
};

// Function to manually force satellite view reapplication
window.forceSatelliteView = () => {
    const satViewBinding = getBindings().find(([mod]) => mod.key === 'satView');
    if (satViewBinding) {
        satViewBinding[1](true); // Force reapply
    } else {
        console.warn('Satellite view binding not found');
    }
};

// Manual recovery functions for troubleshooting
window.debugModsState = () => {
    const selectors = [
        `div[class^="game_canvas__"]`,
        `div[class*="game_canvas"]`,
        `#panorama-container`,
        `div[class*="panorama"]`,
        `div[class*="game-layout_content"]`,
        `div[class*="game_content"]`,
    ];
    selectors.forEach(selector => {
        const element = document.querySelector(selector);
    });
    
    if (typeof MODS !== 'undefined') {
    }
    
};

window.forceRecreateModMenu = () => {
    
    // Remove existing mod container
    const existing = document.getElementById('gg-mods-container');
    if (existing) {
        existing.remove();
    }
    
    // Try to add buttons
    const result = addButtons();
    
    if (result) {
        bindButtons();
    } else {
        debugModsState();
    }
    
    return result;
};

window.forceModsInit = () => {
    initializeMods();
    
    // Try manual recreation after short delay
    setTimeout(() => {
        if (!getModDiv()) {
            forceRecreateModMenu();
        }
    }, 2000);
};

/**
 * Remove the mod menu completely from the page
 */
const removeModMenu = () => {
    const modContainer = getModDiv();
    if (modContainer) {
        console.debug('GeoGuessr MultiMod: Removing mod menu from page');
        modContainer.remove();
        return true;
    }
    return false;
};

/**
 * Monitor URL changes and handle game page logic
 */
const setupHomepageMonitoring = () => {
    // Subscribe to location changes
    if (window.GG_LOCATION_TRACKER) {
        window.GG_LOCATION_TRACKER.subscribe('game-page-monitor', (newUrl, oldUrl) => {
            const newPath = new URL(newUrl).pathname;
            const isGamePage = newPath.includes('/game/') || newPath.includes('/live-challenge/');
            
            if (!isGamePage) {
                console.debug('GeoGuessr MultiMod: Navigated away from game page, removing mod menu');
                removeModMenu();
                
                // Disable all mods temporarily
                const allMods = Object.values(MODS);
                disableMods(allMods, false);
            } else if (oldUrl) {
                const oldPath = new URL(oldUrl).pathname;
                const wasGamePage = oldPath.includes('/game/') || oldPath.includes('/live-challenge/');
                
                if (!wasGamePage) {
                    // Navigated to game page from non-game page - mods can be active again
                    console.debug('GeoGuessr MultiMod: Navigated to game page, mods can be active again');
                    // The normal initialization process will handle re-creating the menu
                }
            }
        }, 1000); // Check every second
    }
};

// ...existing code...
