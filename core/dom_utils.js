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
    return THE_WINDOW.google || unsafeWindow.google;
};

const isOperaBrowser = () => { // Check if current browser is Opera (has WebGL/Vector rendering issues)
    return (!!THE_WINDOW.opr && !!opr.addons) || !!THE_WINDOW.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
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

const getGuessmapContainer = () => {
    return document.querySelector('div[class^="guess-map_canvasContainer__"]');
};

const getGuessmap = () => {
    return document.querySelector('div[class^="guess-map_canvas__"]');
};

const getStreetviewContainer = () => {
    return document.querySelector(`div[class^="game_status__"]`);
};

const getStreetviewCanvas = () => {
    const container = getStreetviewContainer();
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

let _OPTION_MENU;
let _OPTION_MENU_DRAGGING = false;
let _OPTION_MENU_DRAGGING_MOUSEDOWN;
let _OPTION_MENU_DRAGGING_MOUSEMOVE;
let _OPTION_MENU_DRAGGING_MOUSEUP;
let _OPTION_MENU_DRAGGING_OFFSET_X; // Needed for offsetting the drag element from the client.
let _OPTION_MENU_DRAGGING_OFFSET_Y;

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

const getOptionInput = (key) => { // Will only check actively open option menu.
    if (!_OPTION_MENU) {
        return null;
    }
    return _OPTION_MENU.querySelector(`[data-key="${key}"]`);
};

const isArrayOption = (mod, key) => {
    if (!mod.options || !mod.options[key]) {
        return false;
    }
    return Array.isArray(mod.options[key].options);
};

const makeOptionMenu = (mod) => {
    
    // Close any existing option menu first
    closeOptionMenu();

    _OPTION_MENU = document.createElement('div');
    _OPTION_MENU.id = 'gg-option-menu';
    

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
        const hasApiKey = THE_WINDOW.GOOGLE_MAPS_API_KEY && THE_WINDOW.GOOGLE_MAPS_API_KEY.trim().length > 0;
        
        if (isApiDependentOption && !hasApiKey) {
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
            Object.assign(input, { type: 'checkbox', checked: !!value, className: 'gg-option-input' });
        } else {
            throw new Error(`Invalid option specification: ${key} is of type ${typeof defaultVal}`);
        }
        input.setAttribute(`data-key`, key);
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
        for (const key of Object.keys(mod.options)) {
            const defaultValue = getDefaultOption(mod, key);
            setOption(mod, key, defaultValue);
            const input = getOptionInput(key);
            if (!input) {
                console.warn(`No input found for option: ${key}`);
                continue;
            }
            if (input.type === 'checkbox') {
                input.checked = defaultValue;
            } else {
                input.value = defaultValue;
            }
        }
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
        button.classList.add('gg-interactive-button');
        button.innerHTML = label;
        
        // Wrap the callback to add click animation
        const animatedCallback = (evt) => {
            button.classList.add('click-animation');
            setTimeout(() => {
                button.classList.remove('click-animation');
            }, 300);
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
        }
    };
    
    // Add menu with a small delay to be safe with React
    setTimeout(addMenuSafely, 50);
    
    // Add some visual debugging and ensure visibility
    _OPTION_MENU.style.display = 'block';
    _OPTION_MENU.style.visibility = 'visible';
    
    
    // Verify it's in the DOM after a short delay
    setTimeout(() => {
        const menuInDOM = document.getElementById('gg-option-menu');
        if (menuInDOM) {
        } else {
            console.error('✗ Option menu NOT found in DOM after creation');
        }
    }, 100);
};

const updateMod = (mod, forceState = undefined) => {
    const previousState = isModActive(mod);
    const newState = forceState !== undefined ? forceState : !previousState;

    // Handle options menu display logic
    if (newState && !previousState) {
        // Mod is being enabled (going from inactive to active)
        if (forceState === undefined) {
            // This is a user-initiated activation (button click)
            const options = mod.options;
            
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
        }
    } else if (!newState && previousState) {
        // Mod is being disabled (going from active to inactive)
        closeOptionMenu();
    }

    mod.active = newState;
    
    const button = getModButton(mod);
    if (button) {
        const newText = getButtonText(mod);
        button.textContent = newText;
    }

    saveState();
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
    } else {
        document.removeEventListener('map_click', func, false);
        _MAP_CLICK_LISTENERS.delete(func);
    }
};

// Clear all registered map click listeners (useful for cleanup)
const clearAllMapClickListeners = () => {
    for (const func of _MAP_CLICK_LISTENERS) {
        document.removeEventListener('map_click', func, false);
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
    
    for (const other of Object.values(MODS)) {
        if (mod === other) {
            continue;
        }
        if (isScoringMod(other)) {
            disableMods(other);
        }
    }
};

const closeOptionMenu = () => {
    const menu = document.querySelector('#gg-option-menu');
    if (menu) {
        menu.parentElement.removeChild(menu);
    } else {
    }
    
    // Clear the global reference
    _OPTION_MENU = null;
};

/**
 * Removes overlays for specific mods that have draggable displays/overlays
 */
const removeModOverlays = (mod) => {
    
    try {
        // Handle lottery mod overlays
        if (mod.key === 'lottery') {
            // Remove lottery display
            if (typeof removeLotteryDisplay === 'function') {
                removeLotteryDisplay();
            }
            // Remove lottery map overlays
            if (typeof removeClickBlock === 'function') {
                removeClickBlock();
            }
        }
        
        // Handle tilereveal mod overlays
        if (mod.key === 'tilereveal') {
            // Remove tile counter
            if (typeof removeTileCounter === 'function') {
                removeTileCounter();
            }
            // Remove tiles
            if (typeof removeTiles === 'function') {
                removeTiles();
            }
        }
        
        // Handle flashlight mod overlays - call the update function with false to disable
        if (mod.key === 'flashlight') {
            if (typeof updateFlashlight === 'function') {
                updateFlashlight(false);
            }
        }
        
        // Handle display mod overlays
        if (mod.key === 'fun-filters') {
            if (typeof removeColorOverlay === 'function') {
                removeColorOverlay();
            }
        }
        
        // Handle puzzle mod overlays - call the update function with false to disable
        if (mod.key === 'puzzle') {
            if (typeof updatePuzzle === 'function') {
                updatePuzzle(false);
            }
        }
        
        // Generic DOM-based cleanup for any remaining overlays
        const modSpecificSelectors = {
            lottery: ['.gg-lottery-display', '.gg-lottery-overlay', '[class*="lottery-click-block"]'],
            tilereveal: ['#gg-tile-counter', '#gg-tile-overlay', '.gg-tile'],
            flashlight: ['#gg-flashlight-div', '#gg-flashlight'],
            'fun-filters': ['.gg-color-overlay'],
            puzzle: ['#gg-canvas-2d', '.gg-puzzle-tile', '.gg-puzzle-dragging'],
            // Add more as needed
        };
        
        const selectors = modSpecificSelectors[mod.key];
        if (selectors) {
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    element.remove();
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
    
    const isLottery = activatingMod?.key === 'lottery';
    const isScoring = isScoringMod(activatingMod);
    
    if (isLottery) {
        // Lottery is being enabled - disable all scoring mods
        for (const other of Object.values(MODS)) {
            if (other === activatingMod) continue;
            if (isScoringMod(other)) {
                disableMods(other);
                removeModOverlays(other);
            }
        }
    } else if (isScoring) {
        // Scoring mod is being enabled - disable lottery and other scoring mods, remove all incompatible overlays
        for (const other of Object.values(MODS)) {
            if (other === activatingMod) continue;
            if (isScoringMod(other) || other.key === 'lottery') {
                disableMods(other);
                removeModOverlays(other);
            }
        }
        
        // Remove overlays from other mods that might interfere with scoring
        const modsWithOverlays = ['tilereveal', 'flashlight', 'fun-filters', 'puzzle'];
        for (const other of Object.values(MODS)) {
            if (other === activatingMod) continue;
            if (modsWithOverlays.includes(other.key)) {
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
    const guessmapContainer = getGuessmapContainer();
    if (guessmapContainer) {
        guessmapContainer.addEventListener('contextmenu', (evt) => {
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
            THE_WINDOW.location.reload();
        }

        // Google Maps integration - only enabled if API key is configured
        const hasApiKey = !!THE_WINDOW.GOOGLE_MAPS_API_KEY;
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
        return;
    }

    const onlyLand = getOption(lotteryMod, 'onlyLand');
    const onlyStreetView = getOption(lotteryMod, 'onlyStreetView');
    
    // Check if either special option is enabled
    if (!onlyLand && !onlyStreetView) {
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
    } else if (key === ']') {
        // Ctrl+] - Open aerial view of nearest land location OR street view if both are enabled
        let mapsUrl;
        
        if (onlyStreetView && onlyLand) {
            // Both enabled - open Street View location (as per user requirement)
            mapsUrl = `https://www.google.com/maps/@${lat},${lng},3a,75y,90t/data=!3m1!1e1`;
        } else if (onlyStreetView) {
            // Only Street View enabled - open Street View
            mapsUrl = `https://www.google.com/maps/@${lat},${lng},3a,75y,90t/data=!3m1!1e1`;
        } else if (onlyLand) {
            // Only Land enabled - open aerial view of nearest land location
            mapsUrl = `https://www.google.com/maps/@${lat},${lng},15z/data=!3m1!1e3`;
        }
        
        if (mapsUrl) {
            GM_openInTab(mapsUrl, false);
        }
    }
};

// Initialize global keybindings when DOM is ready
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

