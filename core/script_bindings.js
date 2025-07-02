// ==UserScript==
// @name         GG Script Bindings
// @description  Script bindings and initialization for GeoGuessr mods
// @version      1.0
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
    if (_MODS_LOADED) {
        return;
    }
    for (const [mod, callback] of _BINDINGS) {
        if (!mod.show) {
            continue;
        }
        UPDATE_CALLBACKS[mod.key] = callback;
        const button = getModButton(mod);
        if (!button) {
            console.error(`Mod ${mod.key} not found.`);
            continue;
        }
        // If option menu is open, close it. If enabling a mod, open the option menu.
        button.addEventListener('click', () => {
            closeOptionMenu();
            callback();
        });
    }
    _MODS_LOADED = true;
};

const addButtons = () => { // Add mod buttons to the active round, with a little button to toggle them.
    try {
        const bigMapContainer = getBigMapContainer();
        const modContainer = getModDiv(); // Includes header and buttons.
        
        if (!bigMapContainer) {
            return false;
        }
        
        if (modContainer) {
            return false;
        }

        const modsContainer = document.createElement('div'); // Header and buttons.
        modsContainer.id = 'gg-mods-container';

        const headerContainer = document.createElement('div'); // Header and button toggle.
        headerContainer.id = 'gg-mods-header-container';
        const headerText = document.createElement('div');
        headerText.id = 'gg-mods-header';
        headerText.textContent = `TPEBOP'S MODS`;

        const version = (THE_WINDOW || {}).MOD_VERSION;;
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
                    background: var(--ds-color-purple-100) !important;
                    border-radius: 5px !important;
                    font-size: 14px !important;
                    cursor: pointer !important;
                    opacity: 0.9 !important;
                    padding: 4px 10px !important;
                    margin: 2px 0 !important;
                `;
                
                buttonContainer.appendChild(modButton);
                buttonCount++;
            } catch (err) {
                console.error(err);
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
            z-index: 9 !important;
            display: flex !important;
            flex-direction: column !important;
        `;
        
        headerContainer.style.cssText = `
            display: flex !important;
            align-items: center !important;
            font-size: 18px !important;
            justify-content: space-between !important;
        `;
        
        headerText.style.cssText = `
            font-weight: bold !important;
        `;
        
        modMenuToggle.style.cssText = `
            padding: 0 !important;
            font-size: 16px !important;
            cursor: pointer !important;
        `;
        
        buttonContainer.style.cssText = `
            display: flex;
            flex-direction: column !important;
            gap: 6px !important;
            margin-top: 10px !important;
        `;
        
        bindButtons();

        // Button menu toggler - use cssText to override everything for Opera compatibility
        let isMenuVisible = true; // Track state explicitly
        modMenuToggle.addEventListener('click', function () {
            console.log('Toggle clicked, current state:', isMenuVisible); // Debug log
            if (isMenuVisible) {
                buttonContainer.style.cssText = `
                    display: none !important;
                    flex-direction: column !important;
                    gap: 6px !important;
                    margin-top: 10px !important;
                `;
                modMenuToggle.textContent = '▶';
                isMenuVisible = false;
                console.log('Hidden menu'); // Debug log
            } else {
                buttonContainer.style.cssText = `
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 6px !important;
                    margin-top: 10px !important;
                `;
                modMenuToggle.textContent = '▼';
                isMenuVisible = true;
                console.log('Showed menu'); // Debug log
            }
        });
        return true;
    } catch (err) {
        console.error(err);
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
            MODS.showScore,
            MODS.bopIt,
        ], true);
    }
};

// Initialize the mod system
// ===============================================================================================================================

// Initialize when DOM is ready
const initializeMods = () => {
    try {
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

// Round start event handler
handleRoundStart = (evt) => {
    console.log('GeoGuessr MultiMod: Round start detected:', evt);
    
    // Clear any existing interval
    if (mapDataCheckInterval) {
        clearInterval(mapDataCheckInterval);
    }
    
    // Start periodic check for GG_MAP
    mapDataCheckInterval = setInterval(ensureGGMapLoaded, 3000); // Check every 3 seconds
    
    window.localStorage.setItem(STATE_KEY, JSON.stringify(MODS));
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
            console.log('GeoGuessr MultiMod: Setting up event listeners...');
            
            try {
                // Add the main event listeners
                GEF.events.addEventListener('round_start', handleRoundStart);
                console.log('GeoGuessr MultiMod: round_start listener added');
                
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
                console.log('GeoGuessr MultiMod: round_end listener added');
                
                // Test listener to verify events are working
                GEF.events.addEventListener('guess', (evt) => {
                    console.log('GeoGuessr MultiMod: guess event detected:', evt);
                });
                console.log('GeoGuessr MultiMod: guess listener added');
                
                console.log('GeoGuessr MultiMod: All event listeners added successfully');
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
            
            // Clear any existing interval
            if (mapDataCheckInterval) {
                clearInterval(mapDataCheckInterval);
            }
            
            // Start periodic check for GG_MAP
            mapDataCheckInterval = setInterval(ensureGGMapLoaded, 3000); // Check every 3 seconds
            
            window.localStorage.setItem(STATE_KEY, JSON.stringify(MODS));
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
            if (document.activeElement.tagName === 'INPUT') {
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
                        console.log('GeoGuessr MultiMod: Game elements detected in DOM, potential round start');
                        
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
    
    console.log('GeoGuessr MultiMod: DOM observer set up for game detection');
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
    
    console.log('GeoGuessr MultiMod: Started global background map loading');
};

const stopGlobalMapLoading = () => {
    if (globalMapLoadInterval) {
        clearInterval(globalMapLoadInterval);
        globalMapLoadInterval = null;
        lastAttemptedMapId = null;
        console.log('GeoGuessr MultiMod: Stopped global background map loading');
    }
};
