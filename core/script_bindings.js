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
        console.log('GeoGuessr MultiMod: addButtons() called');
        
        const bigMapContainer = getBigMapContainer();
        console.log('GeoGuessr MultiMod: bigMapContainer =', bigMapContainer);
        
        const modContainer = getModDiv(); // Includes header and buttons.
        console.log('GeoGuessr MultiMod: modContainer =', modContainer);
        
        if (!bigMapContainer) {
            console.log('GeoGuessr MultiMod: bigMapContainer not found, skipping button creation');
            return false;
        }
        
        if (modContainer) {
            console.log('GeoGuessr MultiMod: modContainer already exists, skipping button creation');
            return false;
        }

        console.log('GeoGuessr MultiMod: Creating mod container...');

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

        console.log('GeoGuessr MultiMod: Creating mod buttons...');
        console.log('GeoGuessr MultiMod: Available mods:', Object.keys(MODS));
        
        let buttonCount = 0;
        for (const [key, mod] of Object.entries(MODS)) {
            console.log(`GeoGuessr MultiMod: Processing mod ${key}:`, mod);
            
            if (!mod.show) {
                console.log(`GeoGuessr MultiMod: Skipping mod ${key} (show: false)`);
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
                    background: #8e44ad !important;
                    border-radius: 5px !important;
                    font-size: 14px !important;
                    cursor: pointer !important;
                    opacity: 0.9 !important;
                    padding: 8px 10px !important;
                    color: white !important;
                    font-weight: bold !important;
                    border: 1px solid #666 !important;
                    display: block !important;
                    text-align: center !important;
                    margin: 2px 0 !important;
                `;
                
                buttonContainer.appendChild(modButton);
                buttonCount++;
                console.log(`GeoGuessr MultiMod: Created button for ${key}: ${modButton.textContent}`);
            } catch (err) {
                console.error(`GeoGuessr MultiMod: Error creating button for ${key}:`, err);
            }
        }
        console.log(`GeoGuessr MultiMod: Created ${buttonCount} mod buttons`);

        modsContainer.appendChild(headerContainer);
        modsContainer.appendChild(buttonContainer);
        bigMapContainer.appendChild(modsContainer);
        
        console.log('GeoGuessr MultiMod: Mod container added to DOM');
        
        // Force apply critical styles directly to ensure visibility
        modsContainer.style.cssText = `
            position: fixed !important;
            width: 200px !important;
            top: 20px !important;
            left: 20px !important;
            z-index: 999999 !important;
            display: flex !important;
            flex-direction: column !important;
            background: rgba(142, 68, 173, 0.95) !important;
            border-radius: 10px !important;
            padding: 10px !important;
            border: 2px solid #fff !important;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3) !important;
        `;
        
        headerContainer.style.cssText = `
            display: flex !important;
            align-items: center !important;
            font-size: 18px !important;
            justify-content: space-between !important;
        `;
        
        headerText.style.cssText = `
            font-weight: bold !important;
            color: white !important;
            font-size: 16px !important;
        `;
        
        modMenuToggle.style.cssText = `
            padding: 2px 6px !important;
            font-size: 16px !important;
            cursor: pointer !important;
            background: none !important;
            border: none !important;
            color: white !important;
            font-weight: bold !important;
        `;
        
        buttonContainer.style.cssText = `
            display: flex !important;
            flex-direction: column !important;
            gap: 6px !important;
            margin-top: 10px !important;
        `;
        
        console.log('GeoGuessr MultiMod: Inline styles applied');
        
        console.log('GeoGuessr MultiMod: Container styles:', window.getComputedStyle(modsContainer));
        console.log('GeoGuessr MultiMod: Container dimensions:', {
            width: modsContainer.offsetWidth,
            height: modsContainer.offsetHeight,
            top: modsContainer.offsetTop,
            left: modsContainer.offsetLeft
        });
        console.log('GeoGuessr MultiMod: Container visibility:', {
            display: window.getComputedStyle(modsContainer).display,
            visibility: window.getComputedStyle(modsContainer).visibility,
            opacity: window.getComputedStyle(modsContainer).opacity,
            zIndex: window.getComputedStyle(modsContainer).zIndex
        });
        
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
        
        console.log('GeoGuessr MultiMod: Button creation successful!');
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
        // Load configuration from localStorage
        loadState();
        
        // Disable mods as needed based on current page
        disableModsAsNeeded();

        // Create observer to monitor DOM changes and add buttons when the game interface loads
        const observer = new MutationObserver(() => {
            try {
                console.log('GeoGuessr MultiMod: MutationObserver triggered');
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
            console.log('GeoGuessr MultiMod: Observer started successfully, watching element:', nextElement);
            
            // Also try to add buttons immediately in case the page is already loaded
            console.log('GeoGuessr MultiMod: Attempting immediate button creation...');
            addButtons();
        } else {
            console.error('GeoGuessr MultiMod: Could not find #__next element, trying alternative selectors...');
            
            // Try alternative selectors
            const alternatives = ['#root', 'body', 'main'];
            let foundElement = null;
            
            for (const selector of alternatives) {
                const element = document.querySelector(selector);
                if (element) {
                    console.log(`GeoGuessr MultiMod: Found alternative element: ${selector}`);
                    foundElement = element;
                    break;
                }
            }
            
            if (foundElement) {
                observer.observe(foundElement, { subtree: true, childList: true });
                console.log('GeoGuessr MultiMod: Observer started with alternative selector');
                addButtons();
            } else {
                console.error('GeoGuessr MultiMod: No suitable DOM element found for observation');
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
