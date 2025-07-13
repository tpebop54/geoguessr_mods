// ==UserScript==
// @author       tpebop

// ==/UserScript==

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
    let boundCount = 0;
    
    for (const [mod, callback] of _BINDINGS) {
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

        console.log('🎯 GeoGuessr MultiMod: Creating mod menu in container:', bigMapContainer);

        const modsContainer = document.createElement('div'); // Header and buttons.
        modsContainer.id = 'gg-mods-container';

        const headerContainer = document.createElement('div'); // Header and button toggle.
        headerContainer.id = 'gg-mods-header-container';
        const headerText = document.createElement('div');
        headerText.id = 'gg-mods-header';
        headerText.textContent = `TPEBOP'S MODS`;
        const version = (typeof MOD_VERSION !== 'undefined') ? MOD_VERSION : ((THE_WINDOW || {}).MOD_VERSION || 'unknown');
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
                modButton.textContent = getButtonText(mod);
                
                // Apply inline styles to ensure visibility
                modButton.style.cssText = `
                    background: var(--ds-color-purple-100, #8B5CF6) !important;
                    border-radius: 5px !important;
                    font-size: 14px !important;
                    cursor: pointer !important;
                    opacity: 0.9 !important;
                    padding: 4px 10px !important;
                    margin: 2px 0 !important;
                    color: white !important;
                    text-align: center !important;
                    user-select: none !important;
                `;
                
                buttonContainer.appendChild(modButton);
                buttonCount++;
            } catch (err) {
                console.error('Error creating mod button for', key, err);
            }
        }

        modsContainer.appendChild(headerContainer);
        modsContainer.appendChild(buttonContainer);
        bigMapContainer.appendChild(modsContainer);
        
        // Force apply critical styles directly to ensure visibility
        modsContainer.style.cssText = `
            position: absolute !important;
            width: 200px !important;
            top: 40px !important;
            left: 20px !important;
            z-index: 9999 !important;
            display: flex !important;
            flex-direction: column !important;
            background: rgba(0, 0, 0, 0.8) !important;
            border-radius: 8px !important;
            padding: 8px !important;
            color: white !important;
            font-family: Arial, sans-serif !important;
        `;
        
        headerContainer.style.cssText = `
            display: flex !important;
            align-items: center !important;
            font-size: 16px !important;
            justify-content: space-between !important;
            margin-bottom: 8px !important;
        `;
        
        headerText.style.cssText = `
            font-weight: bold !important;
            color: white !important;
        `;
        
        modMenuToggle.style.cssText = `
            padding: 2px 6px !important;
            font-size: 14px !important;
            cursor: pointer !important;
            background: rgba(255, 255, 255, 0.2) !important;
            border: none !important;
            border-radius: 3px !important;
            color: white !important;
        `;
        
        buttonContainer.style.cssText = `
            display: flex !important;
            flex-direction: column !important;
            gap: 4px !important;
        `;
        
        console.log(`✅ GeoGuessr MultiMod: Successfully created mod menu with ${buttonCount} buttons`);
        
        bindButtons();

        // Button menu toggler - Opera-compatible approach with onclick attribute
        let isMenuVisible = true;
        
        // Set onclick directly on the element for maximum compatibility
        modMenuToggle.onclick = function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            const container = document.getElementById('gg-mods-button-container');
            if (!container) {
                console.error('Button container not found!');
                return;
            }
            
            if (isMenuVisible) {
                // Hide the menu
                container.style.setProperty('display', 'none', 'important');
                modMenuToggle.textContent = '▶';
                isMenuVisible = false;
            } else {
                // Show the menu
                container.style.setProperty('display', 'flex', 'important');
                modMenuToggle.textContent = '▼';
                isMenuVisible = true;
            }
        };
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
    if (pathname.indexOf('live-challenge') !== -1) {
        disableMods([
        ], true);
    }
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
        console.log(`🗺️ GeoGuessr MultiMod: New ${type} map instance detected, reapplying mods immediately`);
        
        // Immediately reapply all active mods to the new map instance
        setTimeout(() => {
            reapplyActiveModsToNewMaps();
        }, 200); // Short delay to ensure map is fully initialized
    });
    
    // Listen for map tiles being fully loaded (important for satellite view)
    window.addEventListener('gg_map_tiles_loaded', () => {
        console.debug('GeoGuessr MultiMod: Map tiles loaded, checking for satellite view mod');
        // Specifically reapply satellite view if it's active
        const satViewMod = _BINDINGS.find(([mod]) => mod.key === 'satView');
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
        console.log('GeoGuessr MultiMod: Both maps are ready, activating mods now!');
        
        // Small delay to ensure everything is settled
        setTimeout(() => {
            // Ensure buttons exist
            if (!getModDiv()) {
                addButtons();
                bindButtons();
            }
            
            // Reactivate all active mods
            for (const [mod, callback] of _BINDINGS) {
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
    console.log('🔄 GeoGuessr MultiMod: Reapplying active mods to new map instances');
    
    // Get list of currently active mods
    const activeMods = _BINDINGS.filter(([mod]) => mod.active && mod.show);
    
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
    
    console.log('✅ GeoGuessr MultiMod: Finished reapplying active mods to new maps');
};

// Initialize when DOM is ready
const initializeMods = () => {
    try {
        // Setup enhanced map event listeners first
        setupMapEventListeners();
        
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
        console.log('GEF Game data loaded.');
    }
    
    // Method 2: Try to extract from window objects
    if (!gameData && window.__NEXT_DATA__) {
        try {
            const nextData = window.__NEXT_DATA__;
            if (nextData.props && nextData.props.pageProps) {
                gameData = nextData.props.pageProps.game || nextData.props.pageProps;
                console.log('GeoGuessr MultiMod: Found game data from __NEXT_DATA__');
            }
        } catch (err) {
            console.debug('GeoGuessr MultiMod: Could not extract from __NEXT_DATA__:', err);
        }
    }
    
    if (gameData && handleRoundStart) {
        console.log('GeoGuessr MultiMod: Simulating round_start with data:', gameData);
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
    console.log('GeoGuessr MultiMod: Reactivating active mods after round start');
    
    // Dispatch a custom event that mods can listen for
    const reactivationEvent = new CustomEvent('gg_mods_reactivate', {
        detail: { timestamp: Date.now() }
    });
    window.dispatchEvent(reactivationEvent);
    
    // Log which mods are active and should be reactivated
    const activeMods = _BINDINGS.filter(([mod]) => mod.active && mod.show).map(([mod]) => mod.name);
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
                    for (const [mod, callback] of _BINDINGS) {
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
                for (const [mod, callback] of _BINDINGS) {
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
    console.log('GeoGuessr MultiMod: Round start detected:', evt);
    
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
        console.log('GeoGuessr MultiMod: GeoGuessrEventFramework successfully initialized');
        
        // Start global background map loading
        startGlobalMapLoading();
        
        // Now set up the event listeners with proper handlers
        const setupEventListeners = () => {
            try {
                // Add the main event listeners
                GEF.events.addEventListener('round_start', handleRoundStart);
                
                GEF.events.addEventListener('round_end', (evt) => {
                    console.log('GeoGuessr MultiMod: round_end event detected');
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
                    console.log('GeoGuessr MultiMod: guess event detected:', evt);
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
                console.log('GeoGuessr MultiMod: URL change detected:', currentUrl, '->', newUrl);
                currentUrl = newUrl;
                
                // Check if this looks like a game URL
                if (newUrl.includes('/game/') || newUrl.includes('/challenge/')) {
                    console.log('GeoGuessr MultiMod: Game URL detected, simulating round_start');
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
            console.log('GeoGuessr MultiMod: Round start detected:', evt);
            
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
                console.log('GeoGuessr MultiMod: First reactivation attempt...');
                reactivateActiveMods();
            }, 3000); // Increased initial delay to 3 seconds
            
            // Backup reactivation attempt in case the first one fails
            setTimeout(() => {
                console.log('GeoGuessr MultiMod: Backup reactivation attempt...');
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
            for (const [mod, callback] of _BINDINGS) {
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
                                console.log('GeoGuessr MultiMod: No round data from GEF, attempting DOM-based detection');
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
                console.log('GeoGuessr MultiMod: Background attempting to load GG_MAP for mapId:', mapId);
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
        console.log('GeoGuessr MultiMod: Stopped global background map loading');
    }
};

// Enhanced debugging for mod activation issues
const debugModActivation = () => {
    console.group('🔧 GeoGuessr MultiMod Debug Information');
    
    console.log('📍 Current Location:', window.location.href);
    console.log('🎯 Game Elements Check:');
    console.log('  - Big Map Container:', !!getBigMapContainer());
    console.log('  - Small Map Container:', !!getSmallMapContainer());
    console.log('  - Game Content:', !!getGameContent());
    console.log('  - Panorama Element:', !!document.querySelector('[data-qa="panorama"]'));
    console.log('  - Canvas Element:', !!document.querySelector('.widget-scene-canvas'));
    
    console.log('🗺️ Google Maps State:');
    console.log('  - GOOGLE_MAP exists:', !!GOOGLE_MAP);
    if (GOOGLE_MAP) {
        try {
            console.log('  - GOOGLE_MAP has getBounds:', typeof GOOGLE_MAP.getBounds === 'function');
            console.log('  - GOOGLE_MAP bounds:', GOOGLE_MAP.getBounds ? GOOGLE_MAP.getBounds() : 'N/A');
            console.log('  - GOOGLE_MAP center:', GOOGLE_MAP.getCenter ? GOOGLE_MAP.getCenter() : 'N/A');
            console.log('  - GOOGLE_MAP heading:', GOOGLE_MAP.getHeading ? GOOGLE_MAP.getHeading() : 'N/A');
            console.log('  - GOOGLE_MAP mapTypeId:', GOOGLE_MAP.getMapTypeId ? GOOGLE_MAP.getMapTypeId() : 'N/A');
        } catch (err) {
            console.log('  - Error checking GOOGLE_MAP:', err.message);
        }
    }
    
    console.log('  - GOOGLE_STREETVIEW exists:', !!GOOGLE_STREETVIEW);
    if (GOOGLE_STREETVIEW) {
        try {
            console.log('  - GOOGLE_STREETVIEW has getPosition:', typeof GOOGLE_STREETVIEW.getPosition === 'function');
            console.log('  - GOOGLE_STREETVIEW position:', GOOGLE_STREETVIEW.getPosition ? GOOGLE_STREETVIEW.getPosition() : 'N/A');
            console.log('  - GOOGLE_STREETVIEW pov:', GOOGLE_STREETVIEW.getPov ? GOOGLE_STREETVIEW.getPov() : 'N/A');
        } catch (err) {
            console.log('  - Error checking GOOGLE_STREETVIEW:', err.message);
        }
    }
    
    console.log('🎮 Game State:');
    console.log('  - GG_ROUND:', !!GG_ROUND);
    console.log('  - GG_MAP:', !!GG_MAP);
    console.log('  - Map Readiness State:', mapReadinessState);
    
    console.log('🔲 Mod Buttons:');
    console.log('  - Mod container exists:', !!getModDiv());
    console.log('  - Button count:', document.querySelectorAll('.gg-mod-button').length);
    console.log('  - _MODS_LOADED:', _MODS_LOADED);
    
    console.log('🎛️ Active Mods:');
    const activeMods = _BINDINGS.filter(([mod]) => mod.active && mod.show);
    activeMods.forEach(([mod]) => {
        console.log(`  - ${mod.name}: ${mod.active ? '✅' : '❌'} (Button state: ${mod.active ? 'enabled' : 'disabled'})`);
        
        // Show specific mod effects for debugging
        if (mod.key === 'satView' && GOOGLE_MAP) {
            try {
                console.log(`    Current mapTypeId: ${GOOGLE_MAP.getMapTypeId()}`);
            } catch (err) {
                console.log(`    Error getting mapTypeId: ${err.message}`);
            }
        }
        if (mod.key === 'rotateMap' && GOOGLE_MAP) {
            try {
                console.log(`    Current heading: ${GOOGLE_MAP.getHeading()}`);
            } catch (err) {
                console.log(`    Error getting heading: ${err.message}`);
            }
        }
    });
    
    console.groupEnd();
};

// Add debug command to global scope for easy access
window.debugGGMods = debugModActivation;

// Manual reactivation function for debugging
window.reactivateGGMods = () => {
    console.log('🔄 Manually triggering mod reactivation...');
    debugModActivation();
    reactivateActiveMods();
};

// Function to force check map readiness
window.checkGGMapsReady = () => {
    console.log('🔍 Checking map readiness...');
    debugModActivation();
    checkAndActivateModsIfReady();
};

// Function to manually reapply mods to current maps
window.reapplyGGMods = () => {
    console.log('🔧 Manually reapplying mods to current maps...');
    debugModActivation();
    reapplyActiveModsToNewMaps();
};

// Debug function specifically for satellite view issues
window.debugSatelliteView = () => {
    console.group('🛰️ Satellite View Debug Information');
    
    const satViewMod = MODS.satView;
    console.log('Satellite view mod state:', {
        active: satViewMod?.active,
        show: satViewMod?.show,
        key: satViewMod?.key
    });
    
    if (GOOGLE_MAP) {
        try {
            console.log('Current map state:', {
                mapTypeId: GOOGLE_MAP.getMapTypeId(),
                hasGetBounds: typeof GOOGLE_MAP.getBounds === 'function',
                hasBounds: !!GOOGLE_MAP.getBounds(),
                hasGetCenter: typeof GOOGLE_MAP.getCenter === 'function',
                hasCenter: !!GOOGLE_MAP.getCenter(),
                hasMapDiv: !!GOOGLE_MAP.getDiv(),
                hasTiles: !!GOOGLE_MAP.getDiv()?.querySelector('.gm-style img')
            });
            
            // Try to manually set satellite view
            console.log('Attempting manual satellite view activation...');
            GOOGLE_MAP.setMapTypeId('satellite');
            
            setTimeout(() => {
                console.log('After manual activation:', {
                    mapTypeId: GOOGLE_MAP.getMapTypeId()
                });
            }, 1000);
            
        } catch (err) {
            console.error('Error in satellite view debug:', err);
        }
    } else {
        console.log('GOOGLE_MAP not available');
    }
    
    console.groupEnd();
};

// Function to manually force satellite view reapplication
window.forceSatelliteView = () => {
    console.log('🛰️ Manually forcing satellite view reapplication...');
    const satViewBinding = _BINDINGS.find(([mod]) => mod.key === 'satView');
    if (satViewBinding) {
        satViewBinding[1](true); // Force reapply
    } else {
        console.warn('Satellite view binding not found');
    }
};

// Manual recovery functions for troubleshooting
window.debugModsState = () => {
    console.log('🔍 GeoGuessr Mods Debug Information');
    console.log('=== DOM Elements ===');
    console.log('getBigMapContainer():', getBigMapContainer());
    console.log('getModDiv():', getModDiv());
    console.log('Game container selectors test:');
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
        console.log(`  ${selector}:`, element ? 'FOUND' : 'NOT FOUND');
    });
    
    console.log('=== Mods State ===');
    console.log('MODS defined:', typeof MODS !== 'undefined');
    if (typeof MODS !== 'undefined') {
        console.log('Available mods:', Object.keys(MODS));
        console.log('Mods to show:', Object.values(MODS).filter(mod => mod.show).map(mod => mod.key));
    }
    console.log('_MODS_LOADED:', typeof _MODS_LOADED !== 'undefined' ? _MODS_LOADED : 'undefined');
    
    console.log('=== Functions Available ===');
    console.log('addButtons:', typeof addButtons !== 'undefined');
    console.log('bindButtons:', typeof bindButtons !== 'undefined');
    console.log('initializeMods:', typeof initializeMods !== 'undefined');
};

window.forceRecreateModMenu = () => {
    console.log('🔧 Forcing recreation of mod menu...');
    
    // Remove existing mod container
    const existing = document.getElementById('gg-mods-container');
    if (existing) {
        existing.remove();
        console.log('✅ Removed existing mod container');
    }
    
    // Try to add buttons
    const result = addButtons();
    console.log('addButtons result:', result);
    
    if (result) {
        console.log('✅ Successfully recreated mod menu');
        bindButtons();
    } else {
        console.log('❌ Failed to recreate mod menu');
        debugModsState();
    }
    
    return result;
};

window.forceModsInit = () => {
    console.log('🚀 Forcing complete mods reinitialization...');
    initializeMods();
    
    // Try manual recreation after short delay
    setTimeout(() => {
        if (!getModDiv()) {
            console.log('⚠️ Still no mod menu after init, trying manual recreation...');
            forceRecreateModMenu();
        }
    }, 2000);
};
