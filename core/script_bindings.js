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

// Initialize GeoGuessrEventFramework for round events and map data
/* eslint-disable no-undef */
GeoGuessrEventFramework.init().then(GEF => { // Note: GG_MAP is the min-map, GOOGLE_MAP is used for pulling functionality from Google's map functions.
    GEF.events.addEventListener('round_start', (evt) => {
        window.localStorage.setItem(STATE_KEY, JSON.stringify(MODS));
        try {
            const round = evt.detail.rounds[evt.detail.rounds.length - 1];
            GG_ROUND = round;
            const mapID = evt.detail.map.id;
            /* eslint-disable no-return-assign */
            fetch(`https://www.geoguessr.com/api/maps/${mapID}`).then(data => data.json()).then(data => GG_MAP = data);
        } catch (err) {
            console.error('Error fetching map data:', err);
        }
    });
    GEF.events.addEventListener('round_end', (evt) => {
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
}).catch(err => {
    console.error('GeoGuessr MultiMod: Failed to initialize GeoGuessrEventFramework:', err);
});
/* eslint-enable no-undef */
