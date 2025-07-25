// @author       tpebop

// ==/UserScript==

// DOM and state utility functions.
// ===============================================================================================================================

const _tryMultiple = (selectors) => { // Different modes, different versions, GeoGuessr changing around stuff, etc.
    let element;
    for (const selector of selectors) {
        element = document.querySelector(selector);
        if (element) {
            return element;
        }
    }
    return null;
};

const getGoogle = () => { // Used to interact with the panorama and mini-map.
    return window.google || unsafeWindow.google;
};

const isOperaBrowser = () => { // Check if current browser is Opera (has WebGL/Vector rendering issues)
    return (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
};

const getTicketBar = () => { // Top header.This shows up for unregistered players to display that they need an account.
    return document.querySelector('div[class^="ticket-bar-view_"]');
};

const getGGHeader = () => { // GG icon header in upper left.
    return document.querySelector('img[alt="GeoGuessr"]');
};

const getNonProHeader = () => { // Header that shows for non-pro accounts.
    return document.querySelector('div[class^="ticket-bar-view_root__"]');
};

const getGameContent = () => {
    return document.querySelector('div[class^="game_content__"]');
};

const getSmallMapContainer = () => {
    return document.querySelector('div[class^="guess-map_canvasContainer__"]');
};

const getSmallMap = () => {
    return document.querySelector('div[class^="guess-map_canvas__"]');
};

const getBigMapContainer = () => {
    const selectors = [
        `div[class^="game_canvas__"]`,
        `div[class*="game_canvas"]`,
        `#panorama-container`,
        `div[class*="game-layout_panoramaContainer"]`,
        `div[class*="game_panoramaContainer"]`,
        `div[class*="panorama"]`,
        `.game-layout__panorama-container`,
        `[data-qa="panorama"]`,
        `div[class*="game-layout_content"]`,
        `div[class*="game_content"]`,
        `main[class*="game"]`,
        `div[id*="panorama"]`,
        `div[class*="street-view"]`,
        `div[class*="streetview"]`,
        // Fallback to any div that contains Street View canvas
        `div:has(.widget-scene-canvas)`,
        `div:has(canvas)`,
    ];
    
    // First try the specific selectors
    for (const selector of selectors) {
        try {
            const element = document.querySelector(selector);
            if (element) {
                console.debug(`Found game container with selector: ${selector}`);
                return element;
            }
        } catch (err) {
            // Some selectors might not be supported in all browsers
            continue;
        }
    }
    
    // Fallback: look for any div containing a canvas (likely the game view)
    const canvasContainers = document.querySelectorAll('div');
    for (const container of canvasContainers) {
        if (container.querySelector('canvas') && container.offsetWidth > 400 && container.offsetHeight > 300) {
            console.debug('Found game container via canvas fallback');
            return container;
        }
    }
    
    console.warn('Could not find game container with any selector');
    return null;
};

const getBigMapCanvas = () => {
    const container = getBigMapContainer();
    if (!container) {
        return undefined;
    }
    return container.querySelector('.widget-scene-canvas');
};

const getGameControlsDiv = () => {
    const selectors = [
        `aside[class^="game_controls__"]`,
        `aside[class^="game-panorama_controls__"]`,
    ];
    return _tryMultiple(selectors);
};

const getZoomControlsDiv = () => {
    return document.querySelector(`div[class^="guess-map_zoomControls__"]`);
};

const getGameStatusDiv = () => {
    return document.querySelector(`div[class^="game_status__"]`);
};

const getGameReactionsDiv = () => {
    const selectors = [
        `div[class^="game-reactions_root__"]`,
        `div[class^="chat-input_root__"]`,
    ];
    return _tryMultiple(selectors);
};

const getAllGmnoPrints = () => {
    return document.querySelectorAll('div[class^="gmnoprint"]');
};

const getAllGoogleMapsHotlinks = () => {
    return document.querySelectorAll('a[aria-label^="Open this area in Google Maps"]')
};

const getGuessButton = () => {
    return document.querySelector(`button[class^="button_button__"]`);
};

const getModDiv = () => {
    return document.getElementById('gg-mods-container');
};

const getOptionMenu = () => {
    return document.getElementById('gg-option-menu');
};

const getModButtonId = (mod) => {
    return `gg-opt-${mod.key}`;
};

const getDropdownID = (mod, key) => { // Dropdown element for mod+option.
    return `${getModButtonId(mod)}-${key}`;
};

const getButtonText = (mod) => {
    const active = mod.active;
    const text = `${active ? 'Disable ' : 'Enable '} ${mod.name}`;
    return text;
};

const getModButton = (mod) => {
    return document.querySelector(`#${getModButtonId(mod)}`);
};

const isModActive = (mod) => {
    return !!mod.active;
};

const getDefaultMod = (mod) => {
    for (const defMod of Object.values(GG_DEFAULT)) {
        if (defMod.key === mod.key) {
            return defMod;
        }
    }
    return undefined;
};

const getDefaultOption = (mod, key) => {
    const defMod = getDefaultMod(mod);
    if (!defMod) {
        return undefined;
    }
    const defValue = ((defMod.options || {})[key] || {}).default;
    return defValue;
};

const getOption = (mod, key) => {
    const options = mod.options || {};
    const value = (options[key] || {}).value;
    if (Array.isArray(value)) {
        return value[0]; // May add support for multiselect at some point, but not yet.
    }
    if (value == null) {
        return getDefaultOption(mod, key);
    }
    return value;
};

const setOption = (mod, key, value, save = true) => {
    mod.options[key] = mod.options[key] || {}; // Assumes that MODS has been sanitized on load.
    mod.options[key].value = value;
    if (save) { // Need to call save in caller function if saving multiple options.
        saveState();
    }
};

const isArrayOption = (mod, key) => {
    if (!mod.options || !mod.options[key]) {
        return false;
    }
    return Array.isArray(mod.options[key].options);
};

let _OPTION_MENU;
let _OPTION_MENU_DRAGGING = false;
let _OPTION_MENU_DRAGGING_MOUSEDOWN;
let _OPTION_MENU_DRAGGING_MOUSEMOVE;
let _OPTION_MENU_DRAGGING_MOUSEUP;
let _OPTION_MENU_DRAGGING_OFFSET_X; // Needed for offsetting the drag element from the client.
let _OPTION_MENU_DRAGGING_OFFSET_Y;

const makeOptionMenu = (mod) => {
    console.debug(`makeOptionMenu called for mod: ${mod.name}`);
    
    // Close any existing option menu first
    closeOptionMenu();

    _OPTION_MENU = document.createElement('div');
    _OPTION_MENU.id = 'gg-option-menu';
    
    console.debug(`Created option menu element with ID: ${_OPTION_MENU.id}`);

    // Add title div to match legacy formatting
    const titleDiv = document.createElement('div');
    titleDiv.id = 'gg-option-title';
    titleDiv.textContent = mod.name;
    _OPTION_MENU.appendChild(titleDiv);

    /* eslint-disable no-return-assign */
    _OPTION_MENU_DRAGGING_MOUSEDOWN = _OPTION_MENU.addEventListener('mousedown', (evt) => {
        _OPTION_MENU_DRAGGING = true;
        _OPTION_MENU_DRAGGING_OFFSET_X = evt.clientX - _OPTION_MENU.offsetLeft;
        _OPTION_MENU_DRAGGING_OFFSET_Y = evt.clientY - _OPTION_MENU.offsetTop;
    });
    _OPTION_MENU_DRAGGING_MOUSEMOVE = _OPTION_MENU.addEventListener('mousemove', (evt) => {
        _OPTION_MENU_DRAGGING && (
            _OPTION_MENU.style.left = evt.clientX - _OPTION_MENU_DRAGGING_OFFSET_X + 'px', _OPTION_MENU.style.top = evt.clientY - _OPTION_MENU_DRAGGING_OFFSET_Y + 'px');
    });
    _OPTION_MENU_DRAGGING_MOUSEUP = _OPTION_MENU.addEventListener('mouseup', (evt) => {
        _OPTION_MENU_DRAGGING = false;
        _OPTION_MENU_DRAGGING_OFFSET_X = undefined;
        _OPTION_MENU_DRAGGING_OFFSET_Y = undefined;
    });
    /* eslint-enable no-return-assign */

    const defaults = getDefaultMod(mod).options || {};

    const inputs = []; // Array of [key, type, input element].
    for (const [key, option] of Object.entries(defaults)) {
        // Skip Google Maps API-dependent options if no API key is configured
        const isApiDependentOption = (mod.key === 'lottery' && (key === 'onlyStreetView' || key === 'onlyLand'));
        const hasApiKey = window.GOOGLE_MAPS_API_KEY && window.GOOGLE_MAPS_API_KEY.trim().length > 0;
        
        if (isApiDependentOption && !hasApiKey) {
            console.debug(`Skipping API-dependent option '${key}' for lottery mod - no API key configured`);
            continue;
        }

        const value = getOption(mod, key);

        const lineDiv = document.createElement('div'); // Label and input.
        const label = document.createElement('div');
        label.innerHTML = option.label;
        label.classList.add('gg-option-label');
        lineDiv.appendChild(label);
        lineDiv.classList.add('gg-option-line');
        if (option.tooltip) {
            label.title = option.tooltip;
        }

        const defaultVal = getDefaultOption(mod, key);
        let input;
        let type;
        if (isArrayOption(mod, key)) {
            type = Array; // It's a string, but differentiate it here.
            input = document.createElement('select');
            input.id = getDropdownID(mod, key);
            for (const option of mod.options[key].options) {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                input.appendChild(optionElement);
            }
            Object.assign(input, { value, className: 'gg-option-input' });
        } else if (typeof defaultVal === 'number') {
            type = Number;
            input = document.createElement('input');
            Object.assign(input, { type: 'number', value, className: 'gg-option-input' });
        } else if (typeof defaultVal === 'string') {
            type = String;
            input = document.createElement('input');
            Object.assign(input, { type: 'string', value, className: 'gg-option-input' });
        } else if (typeof defaultVal === 'boolean') {
            type = Boolean;
            input = document.createElement('input');
            Object.assign(input, { type: 'checkbox', value, className: 'gg-option-input' });
        } else {
            throw new Error(`Invalid option specification: ${key} is of type ${typeof defaultVal}`);
        }
        lineDiv.appendChild(input);
        inputs.push([key, type, input]);

        // Safety check before appending to menu
        if (_OPTION_MENU) {
            _OPTION_MENU.appendChild(lineDiv);
        } else {
            console.error('Option menu container is null, cannot add option line');
        }
    };

    const onReset = () => {
        for (const key of Object.entries(mod.options)) {
            setOption(mod, key, getDefaultOption(mod, key));
        }
        input.value = getDefaultOption(mod, key);
    };

    const onClose = () => {
        closeOptionMenu();
    };

    const onApply = () => {
        for (const [key, type, input] of inputs) {
            let value;
            if (type === Array) {
                const dropdown = document.querySelector(`#${getDropdownID(mod, key)}`);
                value = dropdown.value;
            }
            if (type === Boolean) {
                value = !!input.checked;
            } else {
                value = type(input.value);
            }
            setOption(mod, key, value, false);
        }
        saveState();
        UPDATE_CALLBACKS[mod.key](mod.active);
    };

    const formDiv = document.createElement('div');
    formDiv.id = 'gg-option-form-div';
    for (const [label, callback] of [
        ['Close', onClose],
        ['Reset', onReset],
        ['Apply', onApply],
    ]) {
        const button = document.createElement('button');
        button.id = `gg-option-${label.toLowerCase()}`;
        button.classList.add('gg-option-label');
        button.classList.add('gg-option-form-button');
        button.innerHTML = label;
        
        // Wrap the callback to add click animation
        const animatedCallback = (evt) => {
            // Add animation class
            button.classList.add('click-animation');
            
            // Remove animation class after animation completes
            setTimeout(() => {
                button.classList.remove('click-animation');
            }, 300); // Match animation duration
            
            // Call the original callback
            callback(evt);
        };
        
        button.addEventListener('click', animatedCallback);
        formDiv.appendChild(button);
    };

    const modDiv = getModDiv();
    _OPTION_MENU.appendChild(formDiv);
    
    // Always append to body with fixed positioning for better visibility
    // Use a React-friendly approach that doesn't interfere with React's DOM management
    const addMenuSafely = () => {
        // Make sure we're not duplicating
        const existingMenu = document.getElementById('gg-option-menu');
        if (!existingMenu) {
            document.body.appendChild(_OPTION_MENU);
            console.debug(`Option menu created and added to DOM for mod: ${mod.name}`);
        }
    };
    
    // Add menu with a small delay to be safe with React
    setTimeout(addMenuSafely, 50);
    
    // Add some visual debugging and ensure visibility
    _OPTION_MENU.style.display = 'block';
    _OPTION_MENU.style.visibility = 'visible';
    
    console.debug(`Option menu created and added to DOM for mod: ${mod.name}`);
    console.debug('Option menu element:', _OPTION_MENU);
    console.debug('Option menu position:', {
        top: _OPTION_MENU.style.top || 'default',
        left: _OPTION_MENU.style.left || 'default',
        display: _OPTION_MENU.style.display,
        visibility: _OPTION_MENU.style.visibility
    });
    
    // Verify it's in the DOM after a short delay
    setTimeout(() => {
        const menuInDOM = document.getElementById('gg-option-menu');
        if (menuInDOM) {
            console.debug('✓ Option menu confirmed in DOM');
        } else {
            console.error('✗ Option menu NOT found in DOM after creation');
        }
    }, 100);
};

const updateMod = (mod, forceState = undefined) => {
    // If mods aren't loaded, log a warning but continue with the update
    // This allows mods to be activated during round transitions
    if (!_MODS_LOADED) {
        console.debug(`Warning: Updating mod ${mod.name} while _MODS_LOADED is false. This may indicate a round transition.`);
    }

    const previousState = isModActive(mod);
    const newState = forceState !== undefined ? forceState : !previousState;

    // Handle options menu display logic
    if (newState && !previousState) {
        // Mod is being enabled (going from inactive to active)
        if (forceState === undefined) {
            // This is a user-initiated activation (button click)
            console.debug(`Opening options menu for ${mod.name} (user-initiated activation)`);
            const options = mod.options;
            
            // Debug options for all mods to help troubleshoot option menu issues
            console.debug(`OPTIONS DEBUG for ${mod.name}:`, {
                modKey: mod.key,
                modName: mod.name,
                hasOptions: !!options,
                optionsType: typeof options,
                optionKeys: options ? Object.keys(options) : 'none',
                optionCount: options ? Object.keys(options).length : 0,
                fullOptions: options
            });
            
            if (options && typeof options === 'object' && Object.keys(options).length) {
                // Check if mod container exists before creating option menu
                const modDiv = getModDiv();
                if (modDiv || document.body) {
                    try {
                        makeOptionMenu(mod);
                    } catch (err) {
                        console.error(`Error creating option menu for ${mod.name}:`, err);
                    }
                } else {
                    console.warn(`Cannot create option menu for ${mod.name}: no container available`);
                }
            }
        } else {
            // This is a programmatic activation (reactivation, force state, etc.)
            console.debug(`Skipping options menu for ${mod.name} (programmatic activation)`);
        }
    } else if (!newState && previousState) {
        // Mod is being disabled (going from active to inactive)
        console.debug(`Closing options menu for ${mod.name} (mod disabled)`);
        closeOptionMenu();
    } else if (newState && previousState) {
        console.debug(`Mod ${mod.name} was already active, no options menu change needed`);
    } else {
        console.debug(`Mod ${mod.name} was already inactive, no options menu change needed`);
    }

    mod.active = newState;
    
    // Safety check: only try to update button text if the button exists
    const button = getModButton(mod);
    if (button) {
        const newText = getButtonText(mod);
        button.textContent = newText;
        console.debug(`Updated button text for ${mod.name}: "${newText}" (active: ${newState})`);
    } else {
        console.debug(`Button for mod ${mod.name} not found, may be during round transition`);
    }

    saveState();
    console.debug(`Mod ${mod.name} state changed to ${newState ? 'active' : 'inactive'}`);
    return newState;
};

// Track registered map click listeners to avoid conflicts
const _MAP_CLICK_LISTENERS = new Set();

const mapClickListener = (func, enable = true) => {
    if (enable) {
        // Remove if already exists to prevent duplicates
        if (_MAP_CLICK_LISTENERS.has(func)) {
            document.removeEventListener('map_click', func, false);
        }
        document.addEventListener('map_click', func);
        _MAP_CLICK_LISTENERS.add(func);
        console.debug('Added map click listener:', func.name || 'anonymous');
    } else {
        document.removeEventListener('map_click', func, false);
        _MAP_CLICK_LISTENERS.delete(func);
        console.debug('Removed map click listener:', func.name || 'anonymous');
    }
};

// Clear all registered map click listeners (useful for cleanup)
const clearAllMapClickListeners = () => {
    for (const func of _MAP_CLICK_LISTENERS) {
        document.removeEventListener('map_click', func, false);
        console.debug('Cleared map click listener:', func.name || 'anonymous');
    }
    _MAP_CLICK_LISTENERS.clear();
};

const disableMods = (mods, forceHide = false) => {
    if (!Array.isArray(mods)) {
        mods = [mods];
    }
    for (const mod of mods) {
        try {
            updateMod(mod, false);
            if (forceHide) {
                mod.show = false;
            }
        } catch (err) {
            console.error(err);
        }
    }
};

const isScoringMod = (mod) => {
    if (!mod) {
        return false;
    }
    return !!(mod.isScoring || mod.scoreMode);
};

const disableOtherScoreMods = (mod) => { // This function needs to be called prior to defining SCORE_FUNC when a scoring mod is enabled.
    SCORE_FUNC = undefined;
    console.debug('Disabling other scoring mods, keeping active:', mod?.name || 'none');
    
    for (const other of Object.values(MODS)) {
        if (mod === other) {
            continue;
        }
        if (isScoringMod(other)) {
            console.debug('Disabling scoring mod:', other.name);
            disableMods(other);
        }
    }
};

const closeOptionMenu = () => {
    const menu = document.querySelector('#gg-option-menu');
    if (menu) {
        console.debug('Closing option menu');
        menu.parentElement.removeChild(menu);
    } else {
        console.debug('No option menu found to close');
    }
    
    // Clear the global reference
    _OPTION_MENU = null;
};

/**
 * Removes overlays for specific mods that have draggable displays/overlays
 */
const removeModOverlays = (mod) => {
    console.debug('Attempting to remove overlays for mod:', mod.name);
    
    try {
        // Handle lottery mod overlays
        if (mod.key === 'lottery') {
            // Remove lottery display
            if (typeof removeLotteryDisplay === 'function') {
                removeLotteryDisplay();
                console.debug('Removed lottery display overlay');
            }
            // Remove lottery map overlays
            if (typeof removeAllLotteryClickBlockers === 'function') {
                removeAllLotteryClickBlockers();
                console.debug('Removed lottery map overlays');
            }
        }
        
        // Handle tilereveal mod overlays
        if (mod.key === 'tilereveal') {
            // Remove tile counter
            if (typeof removeTileCounter === 'function') {
                removeTileCounter();
                console.debug('Removed tile counter overlay');
            }
            // Remove tiles
            if (typeof removeTiles === 'function') {
                removeTiles();
                console.debug('Removed tile overlays');
            }
        }
        
        // Handle flashlight mod overlays - call the update function with false to disable
        if (mod.key === 'flashlight') {
            if (typeof updateFlashlight === 'function') {
                updateFlashlight(false);
                console.debug('Removed flashlight overlay');
            }
        }
        
        // Handle display mod overlays
        if (mod.key === 'display-preferences') {
            if (typeof removeColorOverlay === 'function') {
                removeColorOverlay();
                console.debug('Removed color overlay');
            }
        }
        
        // Handle puzzle mod overlays - call the update function with false to disable
        if (mod.key === 'puzzle') {
            if (typeof updatePuzzle === 'function') {
                updatePuzzle(false);
                console.debug('Removed puzzle overlay');
            }
        }
        
        // Generic DOM-based cleanup for any remaining overlays
        const modSpecificSelectors = {
            lottery: ['.gg-lottery-display', '.gg-lottery-overlay', '[class*="lottery-click-block"]'],
            tilereveal: ['#gg-tile-counter', '#gg-tile-overlay', '.gg-tile'],
            flashlight: ['#gg-flashlight-div', '#gg-flashlight'],
            'display-preferences': ['.gg-color-overlay'],
            puzzle: ['#gg-canvas-2d', '.gg-puzzle-tile', '.gg-puzzle-dragging'],
            // Add more as needed
        };
        
        const selectors = modSpecificSelectors[mod.key];
        if (selectors) {
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    element.remove();
                    console.debug(`Removed element with selector: ${selector}`);
                });
            });
        }
        
    } catch (err) {
        console.error('Error removing overlays for mod:', mod.name, err);
    }
};

/**
 * Disable scoring mods when lottery is enabled, and disable lottery when scoring mods are enabled
 * This prevents conflicts between lottery and scoring functionality
 */
const disableConflictingMods = (activatingMod) => {
    console.debug('Checking for conflicting mods with:', activatingMod?.name || 'none');
    
    const isLottery = activatingMod?.key === 'lottery';
    const isScoring = isScoringMod(activatingMod);
    
    if (isLottery) {
        // Lottery is being enabled - disable all scoring mods
        console.debug('Lottery enabled: disabling all scoring mods');
        for (const other of Object.values(MODS)) {
            if (other === activatingMod) continue;
            if (isScoringMod(other)) {
                console.debug('Disabling scoring mod due to lottery:', other.name);
                disableMods(other);
                removeModOverlays(other);
            }
        }
    } else if (isScoring) {
        // Scoring mod is being enabled - disable lottery and other scoring mods, remove all incompatible overlays
        console.debug('Scoring mod enabled: disabling lottery and other scoring mods, removing overlays');
        for (const other of Object.values(MODS)) {
            if (other === activatingMod) continue;
            if (isScoringMod(other) || other.key === 'lottery') {
                console.debug('Disabling conflicting mod:', other.name);
                disableMods(other);
                removeModOverlays(other);
            }
        }
        
        // Remove overlays from other mods that might interfere with scoring
        const modsWithOverlays = ['tilereveal', 'flashlight', 'display-preferences', 'puzzle'];
        for (const other of Object.values(MODS)) {
            if (other === activatingMod) continue;
            if (modsWithOverlays.includes(other.key)) {
                console.debug('Removing overlays from mod:', other.name);
                removeModOverlays(other);
            }
        }
        
        // Clear the score function for proper reinitialization
        SCORE_FUNC = undefined;
    }
};

// Additional utility functions
// ===============================================================================================================================

const fixFormatting = () => {
    const ticketBar = getTicketBar();
    if (ticketBar) {
        const ggHeader = getGGHeader();
        if (ggHeader) {
            Object.assign(ggHeader.style, {
                position: 'absolute',
                top: '-35px',
            });
        }
    };
};

const addDebugger = () => {
    const smallMapContainer = getSmallMapContainer();
    if (smallMapContainer) {
        smallMapContainer.addEventListener('contextmenu', (evt) => {
            debugMap(this, evt);
        });
    }
    const modHeader = document.querySelector('#gg-mods-header');
    if (modHeader) {
        modHeader.addEventListener('contextmenu', (evt) => {
            debugMap(this, evt);
        });
    }
};

/**
 * Sets up global keyboard shortcuts that are available throughout the application
 */
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

        // Nuclear option to disable all mods if things get out of control
        if (evt.ctrlKey && evt.shiftKey && evt.key === '>') {
            console.log('Nuclear option triggered: disabling all mods');
            clearState();
            window.location.reload();
        }

        // Google Maps integration - only enabled if API key is configured
        const hasApiKey = !!window.GOOGLE_MAPS_API_KEY;
        if (hasApiKey && evt.ctrlKey && (evt.key === '[' || evt.key === ']')) {
            evt.preventDefault(); // Prevent browser shortcuts
            handleGoogleMapsShortcut(evt.key);
        }
    });
};

/**
 * Handles Google Maps shortcuts for opening actual location
 */
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
    
    if (key === '[') {
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

/**
 * Initialize global keybindings when DOM is ready
 */
const initializeGlobalKeybindings = () => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupGlobalKeyBindings);
    } else {
        // DOM is already ready
        setupGlobalKeyBindings();
    }
};

// Initialize global keybindings immediately
initializeGlobalKeybindings();

