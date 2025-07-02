// ==UserScript==
// @name         GG Script Bindings
// @description  Script bindings and initialization for GeoGuessr mods
// @version      1.0
// @author       tpebop

// ==/UserScript==

console.log('GeoGuessr MultiMod: script_bindings.js loading...');

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
                console.error(`GeoGuessr MultiMod: Error creating button for ${key}:`, err);
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
            display: flex !important;
            flex-direction: column !important;
            gap: 6px !important;
            margin-top: 10px !important;
        `;
        
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
        console.error('GeoGuessr MultiMod: Error in addButtons():', err);
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
                console.error('GeoGuessr MultiMod: Error in MutationObserver:', err);
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
        console.error('GeoGuessr MultiMod: Initialization failed:', err);
    }
};

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMods);
} else {
    // DOM is already ready
    initializeMods();
}

// Initialize GeoGuessrEventFramework immediately - no delay needed since we need to catch early events
let initRetryCount = 0;
const maxRetries = 10;

initializeEventFramework();

function initializeEventFramework() {
    // Initialize GeoGuessrEventFramework for round events and map data
    /* eslint-disable no-undef */
    try {
        console.log(`GeoGuessr MultiMod: Attempting to initialize GeoGuessrEventFramework... (attempt ${initRetryCount + 1}/${maxRetries})`);
        
        // Debug: Check what's available in the global scope
        console.log('GeoGuessr MultiMod: Checking global scope...');
        console.log('typeof GeoGuessrEventFramework:', typeof GeoGuessrEventFramework);
        console.log('window.GeoGuessrEventFramework:', typeof window.GeoGuessrEventFramework);
        console.log('unsafeWindow.GeoGuessrEventFramework:', typeof (typeof unsafeWindow !== 'undefined' ? unsafeWindow.GeoGuessrEventFramework : 'unsafeWindow not available'));
        console.log('Browser user agent:', navigator.userAgent);
        console.log('Current URL:', window.location.href);
        
        // Try to find GeoGuessrEventFramework from multiple sources
        let GEF = null;
        if (typeof GeoGuessrEventFramework !== 'undefined') {
            GEF = GeoGuessrEventFramework;
            console.log('GeoGuessr MultiMod: Found GeoGuessrEventFramework in global scope');
        } else if (typeof window.GeoGuessrEventFramework !== 'undefined') {
            GEF = window.GeoGuessrEventFramework;
            console.log('GeoGuessr MultiMod: Found GeoGuessrEventFramework in window');
        } else if (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.GeoGuessrEventFramework !== 'undefined') {
            GEF = unsafeWindow.GeoGuessrEventFramework;
            console.log('GeoGuessr MultiMod: Found GeoGuessrEventFramework in unsafeWindow');
        } else {
            console.log('GeoGuessr MultiMod: GeoGuessrEventFramework not found in any context');
        }
        
        if (!GEF) {
            initRetryCount++;
            if (initRetryCount >= maxRetries) {
                console.error('GeoGuessr MultiMod: Failed to initialize GeoGuessrEventFramework after maximum retries');
                return;
            }
            console.error('GeoGuessr MultiMod: GeoGuessrEventFramework is not defined, retrying in 100ms...');
            setTimeout(initializeEventFramework, 100); // Much shorter retry delay to catch early events
            return;
        }
        
        // Additional validation - ensure GEF has the events property
        if (!GEF.events || typeof GEF.events.addEventListener !== 'function') {
            initRetryCount++;
            if (initRetryCount >= maxRetries) {
                console.error('GeoGuessr MultiMod: GeoGuessrEventFramework found but not properly initialized after maximum retries');
                return;
            }
            console.error('GeoGuessr MultiMod: GeoGuessrEventFramework found but not properly initialized, retrying in 100ms...');
            setTimeout(initializeEventFramework, 100);
            return;
        }
        
        // The GeoGuessrEventFramework is already initialized in its constructor
        // So we can use it directly without calling init() again
        console.log('GeoGuessr MultiMod: GeoGuessrEventFramework found and ready');
        console.log('GeoGuessr MultiMod: GEF object:', GEF);
        console.log('GeoGuessr MultiMod: GEF.events:', GEF.events);
        
        GEF.events.addEventListener('round_start', (evt) => {
            console.log('GeoGuessr MultiMod: Round start event received at:', new Date().toISOString());
            console.log('GeoGuessr MultiMod: Round start event detail:', evt.detail);
            window.localStorage.setItem(STATE_KEY, JSON.stringify(MODS));
            try {
                const round = evt.detail.rounds[evt.detail.rounds.length - 1];
                GG_ROUND = round;
                const mapID = evt.detail.map.id;
                console.log('GeoGuessr MultiMod: Fetching map data for mapID:', mapID);
                
                fetch(`https://www.geoguessr.com/api/maps/${mapID}`)
                    .then(data => data.json())
                    .then(data => {
                        GG_MAP = data;
                        console.log('GeoGuessr MultiMod: GG_MAP loaded successfully:', GG_MAP);
                    })
                    .catch(err => {
                        console.error('GeoGuessr MultiMod: Failed to fetch map data:', err);
                    });
            } catch (err) {
                console.error('GeoGuessr MultiMod: Error in round_start handler:', err);
            }
        });
        
        GEF.events.addEventListener('round_end', (evt) => {
            console.log('GeoGuessr MultiMod: Round end event received at:', new Date().toISOString());
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
        
        console.log('GeoGuessr MultiMod: Event listeners successfully registered at:', new Date().toISOString());
        
        // Check if we're already in a game/round and need to catch up with current state
        if (GEF.state && GEF.state.round_in_progress) {
            console.log('GeoGuessr MultiMod: Detected ongoing round, syncing state...');
            // Simulate a round_start event with current state to sync our mods
            try {
                GG_ROUND = GEF.state.rounds[GEF.state.current_round - 1];
                if (GEF.state.map && GEF.state.map.id) {
                    const mapID = GEF.state.map.id;
                    console.log('GeoGuessr MultiMod: Fetching map data for current game mapID:', mapID);
                    
                    fetch(`https://www.geoguessr.com/api/maps/${mapID}`)
                        .then(data => data.json())
                        .then(data => {
                            GG_MAP = data;
                            console.log('GeoGuessr MultiMod: GG_MAP loaded for current game:', GG_MAP);
                        })
                        .catch(err => {
                            console.error('GeoGuessr MultiMod: Failed to fetch map data for current game:', err);
                        });
                }
            } catch (err) {
                console.error('GeoGuessr MultiMod: Error syncing with current game state:', err);
            }
        } else {
            console.log('GeoGuessr MultiMod: No ongoing round detected, waiting for new game events...');
        }
        
        // Additional fallback: Set up a delayed check to see if we missed any events
        setTimeout(() => {
            if (!GG_ROUND && !GG_MAP) {
                console.log('GeoGuessr MultiMod: No round data detected after 5 seconds, checking if we missed events...');
                // Check if we're on a game page but missed the events
                const currentUrl = window.location.href;
                if (currentUrl.includes('/game/') || currentUrl.includes('/challenge/') || currentUrl.includes('/duels/')) {
                    console.log('GeoGuessr MultiMod: On a game page but no round data - attempting to sync with current state');
                    if (GEF.state && GEF.state.rounds && GEF.state.rounds.length > 0) {
                        // Try to recover from GEF state
                        GG_ROUND = GEF.state.rounds[GEF.state.current_round - 1];
                        console.log('GeoGuessr MultiMod: Recovered round data from GEF state:', GG_ROUND);
                    }
                }
            }
        }, 5000);
        
    } catch (err) {
        console.error('GeoGuessr MultiMod: Exception during GeoGuessrEventFramework setup:', err);
        initRetryCount++;
        if (initRetryCount < maxRetries) {
            // Retry if there was an exception
            setTimeout(initializeEventFramework, 100);
        } else {
            console.error('GeoGuessr MultiMod: Failed to initialize GeoGuessrEventFramework after maximum retries');
        }
    }
    /* eslint-enable no-undef */
}

console.log('GeoGuessr MultiMod: script_bindings.js loaded successfully');
