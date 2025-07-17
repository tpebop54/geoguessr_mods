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
        console.debug('GeoGuessr MultiMod: addButtons() called');
        
        // Only show mods menu on game and live-challenge pages
        const currentUrl = window.location.href;
        const currentPath = window.location.pathname;
        
        console.debug('GeoGuessr MultiMod: Current URL:', currentUrl);
        console.debug('GeoGuessr MultiMod: Current path:', currentPath);
        
        // Check if we're on a supported game page
        const isGameUrl = currentPath.includes('/game/') || currentPath.includes('/live-challenge/');
        
        if (!isGameUrl) {
            console.debug('GeoGuessr MultiMod: Not on a game page, not showing mods menu. Path:', currentPath);
            return false;
        }
        
        console.debug('GeoGuessr MultiMod: On game page, attempting to find containers...');
        
        const bigMapContainer = getBigMapContainer();
        const modContainer = getModDiv(); // Includes header and buttons.
        
        console.debug('GeoGuessr MultiMod: bigMapContainer found:', !!bigMapContainer);
        console.debug('GeoGuessr MultiMod: existing modContainer found:', !!modContainer);
        
        if (!bigMapContainer) {
            console.debug('GeoGuessr MultiMod: Game container not found, will retry...');
            return false;
        }
        
        if (modContainer) {
            console.debug('GeoGuessr MultiMod: Mod container already exists');
            return false;
        }

        console.debug('GeoGuessr MultiMod: Creating new mod container...');

        console.debug('GeoGuessr MultiMod: Creating new mod container...');

        const modsContainer = document.createElement('div'); // Header and buttons.
        modsContainer.id = 'gg-mods-container';

        console.debug('GeoGuessr MultiMod: Created modsContainer element');

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

        console.debug('GeoGuessr MultiMod: Created header and button containers');

        let buttonCount = 0;
        
        console.debug('GeoGuessr MultiMod: MODS object available:', typeof MODS !== 'undefined');
        if (typeof MODS !== 'undefined') {
            console.debug('GeoGuessr MultiMod: MODS keys:', Object.keys(MODS));
        }
        
        for (const [key, mod] of Object.entries(MODS)) {
            if (!mod.show) {
                console.debug(`GeoGuessr MultiMod: Skipping mod ${key} (show: false)`);
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

        console.debug(`GeoGuessr MultiMod: Created ${buttonCount} mod buttons`);

        modsContainer.appendChild(headerContainer);
        modsContainer.appendChild(buttonContainer);
        
        console.debug('GeoGuessr MultiMod: Assembled complete mod container');
        

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
        console.debug('GeoGuessr MultiMod: Scheduling container addition with 100ms delay...');
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

// Global keyboard shortcuts - moved to dom_utils.js
// ===============================================================================================================================

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
                console.debug('GeoGuessr MultiMod: React hydration detected, safe to initialize');
                resolve();
            } else {
                // Wait a bit longer for React to finish
                setTimeout(checkHydration, 100);
            }
        };
        
        // Start checking after a minimal delay to let React start
        setTimeout(checkHydration, 500);
    });
};

// Initialize when DOM is ready and React has hydrated
const initializeMods = async () => {
    try {
        // Try immediate initialization first, then wait for React hydration as backup
        console.debug('GeoGuessr MultiMod: Starting immediate initialization attempt');
        
        // Try to add buttons immediately
        const immediateResult = addButtons();
        if (immediateResult) {
            console.debug('GeoGuessr MultiMod: Immediate button creation successful');
            return;
        }
        
        // If immediate attempt failed, wait for React hydration
        await waitForReactHydration();
        
        console.debug('GeoGuessr MultiMod: Starting initialization after React hydration');
        
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
        
        // Global keyboard shortcuts are now handled in dom_utils.js
        
    } catch (err) {
        console.error(err);
    }
};

// Start initialization when DOM is ready, but wait for React hydration
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeMods().catch(err => {
            console.error('GeoGuessr MultiMod: Initialization failed:', err);
        });
    });
} else {
    // DOM is already ready
    initializeMods().catch(err => {
        console.error('GeoGuessr MultiMod: Initialization failed:', err);
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
    console.debug(`GeoGuessr MultiMod: fetchMapDataWithRetry called with mapId: ${mapId}`);
    
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
            console.debug(`GeoGuessr MultiMod: Received map data:`, data);
            console.debug(`GeoGuessr MultiMod: maxErrorDistance value:`, data?.maxErrorDistance);
            
            // Validate that we got the expected data structure
            if (!data || typeof data.maxErrorDistance === 'undefined') {
                throw new Error(`Invalid map data structure received. Data: ${JSON.stringify(data)}`);
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
        
        console.debug('GeoGuessr MultiMod: Round start event detail:', evt.detail);
        
        // Extract round and map data from event
        if (evt.detail && evt.detail.rounds) {
            round = evt.detail.rounds[evt.detail.rounds.length - 1];
            mapID = evt.detail.map?.id;
            console.debug('GeoGuessr MultiMod: Method 1 - rounds structure, mapID:', mapID);
        } else if (evt.detail && evt.detail.game) {
            // Alternative structure
            round = evt.detail.game.round || evt.detail.game;
            mapID = evt.detail.game.map?.id || evt.detail.game.mapId;
            console.debug('GeoGuessr MultiMod: Method 2 - game structure, mapID:', mapID);
        } else if (evt.detail) {
            // Direct structure
            round = evt.detail;
            mapID = evt.detail.map?.id || evt.detail.mapId;
            console.debug('GeoGuessr MultiMod: Method 3 - direct structure, mapID:', mapID);
        }
        
        // Additional debugging for map ID extraction
        if (evt.detail) {
            console.debug('GeoGuessr MultiMod: Event detail keys:', Object.keys(evt.detail));
            if (evt.detail.map) {
                console.debug('GeoGuessr MultiMod: Map object:', evt.detail.map);
            }
            if (evt.detail.game && evt.detail.game.map) {
                console.debug('GeoGuessr MultiMod: Game.map object:', evt.detail.game.map);
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
                    console.debug('GeoGuessr MultiMod: Using legacy fallback mapID:', mapID);
                }
            } catch (fallbackErr) {
                console.debug('GeoGuessr MultiMod: Legacy fallback also failed:', fallbackErr);
            }
            
            if (!mapID) {
                return;
            }
        }
        
        GG_ROUND = round;
        console.debug('GeoGuessr MultiMod: Round data set:', GG_ROUND);
        console.debug('GeoGuessr MultiMod: Fetching map data for mapID:', mapID);
        
        fetchMapDataWithRetry(mapID).catch(err => {
            console.error('GeoGuessr MultiMod: Final map data fetch failed:', err);
            
            // Legacy fallback approach - simple fetch without retries
            console.debug('GeoGuessr MultiMod: Trying legacy fallback fetch approach');
            fetch(`https://www.geoguessr.com/api/maps/${mapID}`)
                .then(response => response.json())
                .then(data => {
                    if (data && typeof data.maxErrorDistance !== 'undefined') {
                        GG_MAP = data;
                        console.debug('GeoGuessr MultiMod: Legacy fallback successful, GG_MAP loaded:', GG_MAP);
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
    console.log('=== FORCE MODS INIT DEBUG ===');
    
    initializeMods();
    
    // Try manual recreation after short delay
    setTimeout(() => {
        if (!getModDiv()) {
            console.log('Container still not found, trying forceRecreateModMenu...');
            forceRecreateModMenu();
        } else {
            console.log('Container found after initializeMods!');
        }
    }, 2000);
};

// Add a comprehensive debugging function
window.debugModsDetailed = () => {
    console.log('=== DETAILED MODS DEBUG ===');
    
    // Check current page
    console.log('Current URL:', window.location.href);
    console.log('Current path:', window.location.pathname);
    
    // Check if on game page
    const currentPath = window.location.pathname;
    const isGameUrl = currentPath.includes('/game/') || currentPath.includes('/live-challenge/');
    console.log('Is game URL:', isGameUrl);
    
    // Check MODS object
    console.log('MODS object exists:', typeof MODS !== 'undefined');
    if (typeof MODS !== 'undefined') {
        console.log('MODS keys:', Object.keys(MODS));
        console.log('MODS count:', Object.keys(MODS).length);
        
        // Check which mods are set to show
        const showingMods = Object.entries(MODS).filter(([key, mod]) => mod.show);
        console.log('Mods set to show:', showingMods.map(([key, mod]) => `${key}: ${mod.name}`));
    }
    
    // Check containers
    const bigMapContainer = getBigMapContainer();
    console.log('bigMapContainer found:', !!bigMapContainer);
    if (bigMapContainer) {
        console.log('bigMapContainer tagName:', bigMapContainer.tagName);
        console.log('bigMapContainer className:', bigMapContainer.className);
        console.log('bigMapContainer id:', bigMapContainer.id);
    }
    
    const modContainer = getModDiv();
    console.log('modContainer found:', !!modContainer);
    
    // Check React root
    const reactRoot = document.querySelector('#__next');
    console.log('React root found:', !!reactRoot);
    
    // Try to call addButtons manually
    console.log('Attempting manual addButtons call...');
    try {
        const result = addButtons();
        console.log('addButtons result:', result);
    } catch (err) {
        console.error('addButtons error:', err);
    }
    
    console.log('=== DEBUG COMPLETE ===');
};

// ...existing code...
