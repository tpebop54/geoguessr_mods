// ==UserScript==
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
    if (document.getElementById('gg-option-menu')) {
        return;
    }

    let _OPTION_MENU = document.createElement('div');
    _OPTION_MENU.id = 'gg-option-menu';

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
        const value = getOption(mod, key);

        const lineDiv = document.createElement('div'); // Label and input.
        const label = document.createElement('div');
        label.innerHTML = option.label;
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
        button.addEventListener('click', callback);
        formDiv.appendChild(button);
    };

    const modDiv = getModDiv();
    _OPTION_MENU.appendChild(formDiv);
    
    // Safety check: ensure modDiv exists before trying to append
    if (modDiv) {
        modDiv.appendChild(_OPTION_MENU);
    } else {
        console.warn('Mod container not found, trying to append option menu to body as fallback');
        // Fallback: append to body with absolute positioning
        _OPTION_MENU.style.cssText = `
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            z-index: 10000 !important;
            background: rgba(0, 0, 0, 0.9) !important;
            border: 2px solid #333 !important;
            border-radius: 8px !important;
            padding: 15px !important;
            color: white !important;
            font-family: Arial, sans-serif !important;
            min-width: 300px !important;
        `;
        document.body.appendChild(_OPTION_MENU);
    }
};

const updateMod = (mod, forceState = null) => {
    // If mods aren't loaded, log a warning but continue with the update
    // This allows mods to be activated during round transitions
    if (!_MODS_LOADED) {
        console.debug(`Warning: Updating mod ${mod.name} while _MODS_LOADED is false. This may indicate a round transition.`);
    }

    const previousState = isModActive(mod);
    const newState = forceState != null ? forceState : !previousState;

    // If there are configurable options for this mod, open a popup.
    if (newState && !forceState) {
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
    }

    mod.active = newState;
    
    // Safety check: only try to update button text if the button exists
    const button = getModButton(mod);
    if (button) {
        button.textContent = getButtonText(mod);
    } else {
        console.debug(`Button for mod ${mod.name} not found, may be during round transition`);
    }

    saveState();
    return newState;
};

const mapClickListener = (func, enable = true) => {
    if (enable) {
        document.addEventListener('map_click', func);
    } else {
        document.removeEventListener('map_click', func, false);
    }
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
    return !!mod.isScoring;
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

