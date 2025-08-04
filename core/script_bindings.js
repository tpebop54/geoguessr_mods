// ==UserScript==
// @author       tpebop

// ==/UserScript==

// Add bindings and start the script.
// ===============================================================================================================================

// Must add each mod to this list to bind the menu button.
let _BINDINGS = null;

// Lazy initialize bindings to avoid dependency loading issues
const getBindings = () => {
    if (_BINDINGS == null || _BINDINGS.length === 0) {
        try {
            _BINDINGS = [
                [MODS.rotateMap, updateRotateMap],
                [MODS.zoomInOnly, updateZoomInOnly],
                [MODS.showScore, updateShowScore],
                [MODS.flashlight, updateFlashlight],
                [MODS.bopIt, updateBopIt],
                [MODS.inFrame, updateInFrame],
                [MODS.lottery, updateLottery],
                [MODS.puzzle, updatePuzzle],
                [MODS.tileReveal, updateTileReveal],
                [MODS.funFilters, updateFunFilters],
                [MODS.scratch, updateScratch],
            ];
        } catch (err) {
            console.error('Error initializing bindings:', err);
            _BINDINGS = [];
        }
    }
    return _BINDINGS;
};

const bindButtons = () => {
    for (const [mod, callback] of getBindings()) {
        if (!mod.show) {
            continue;
        }
        const button = getModButton(mod);
        if (!button || button._isBound) {
            continue;
        }
        button.addEventListener('click', () => {
            closeOptionMenu();
            callback();
        });
        button._isBound = true;
        UPDATE_CALLBACKS[mod.key] = callback;
    }
};

// Keep the button menu open or closed between page change or refresh.
let _MENU_VISIBLE = true;
const _menuVisibleKey = 'gg_mods_menu_visible';
const _storeMenuVisible = (visible) => {
    _MENU_VISIBLE = visible;
    localStorage.setItem(_menuVisibleKey, JSON.stringify(!!visible));
};

const _IS_DUEL = window.location.pathname.includes('/live-challenge/') || window.location.pathname.includes('/multiplayer/');

const addButtons = () => { // Add mod buttons to the active round, with a little button to toggle them.
    try {
        if (!areModsAvailable()) {
            return false;
        }

        const bigMapContainer = getStreetviewContainer();
        const modContainer = getModDiv(); // Includes header and buttons.
        if (modContainer || !bigMapContainer) { // Mods already loaded, or map not loaded yet.
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
        headerText.title = `Version: ${version}\nPress "Ctrl Shift ." to disable all and refresh.`;
        const modMenuToggle = document.createElement('button');
        modMenuToggle.id = 'gg-mods-container-toggle';
        modMenuToggle.textContent = '▼';
        headerContainer.appendChild(headerText);
        headerContainer.appendChild(modMenuToggle);

        const buttonContainer = document.createElement('div'); // Mod buttons.
        buttonContainer.id = 'gg-mods-button-container';

        for (const mod of Object.values(MODS)) {
            if (!mod.show) {
                continue;
            }
            if (_IS_DUEL && !mod.allowInDuels) {
                continue;
            }
            try {
                const modButton = document.createElement('div');
                modButton.id = getModButtonId(mod);
                modButton.classList.add('gg-mod-button');
                modButton.title = mod.tooltip;
                const buttonText = getButtonText(mod);
                modButton.textContent = buttonText;
                buttonContainer.appendChild(modButton);
            } catch (err) {
                console.error(err);
            }
        }

        modsContainer.appendChild(headerContainer);
        modsContainer.appendChild(buttonContainer);

        const addButtonContainer = () => {
            if (!document.getElementById('gg-mods-container')) {
                bigMapContainer.appendChild(modsContainer);
                const verifyContainer = document.getElementById('gg-mods-container');
                if (verifyContainer) {
                    bindButtons();
                } else {
                    console.error('Container was not found after append - something went wrong');
                }
            } else {
                bindButtons();
            }
        };

        const setMenuVisible = (show) => {
            if (show) {
                buttonContainer.classList.remove('hidden');
                modMenuToggle.textContent = '▼';
            } else {
                buttonContainer.classList.add('hidden');
                modMenuToggle.textContent = '▶';
            }
            _storeMenuVisible(show);
        };

        modMenuToggle.addEventListener('click', function () {
            _MENU_VISIBLE = !_MENU_VISIBLE;
            setMenuVisible(_MENU_VISIBLE);
        });
        setMenuVisible(window.localStorage.getItem(_menuVisibleKey) === 'true' || _MENU_VISIBLE);

        setTimeout(addButtonContainer, 100);
        _MODS_LOADED = true;
        return true;

    } catch (err) {
        console.error('Error creating mod menu:', err);
        return false;
    }
};

const removeModMenu = () => {
    const modContainer = getModDiv();
    if (modContainer) {
        modContainer.remove();
        return true;
    }
    return false;
};

// Initialize the mod system.
// ===============================================================================================================================

let MAP_STATE = {
    map2d: false,
    map3d: false,
    tilesLoaded: false,
    roundStart: 0,
};

const setUpMapEventListeners = () => {
    THE_WINDOW.addEventListener('gg_map_2d_ready', () => {
        MAP_STATE.map2d = true;
        MAP_STATE.tilesLoaded = true;
    });

    THE_WINDOW.addEventListener('gg_streetview_ready', () => {
        MAP_STATE.map3d = true;
    });

    THE_WINDOW.addEventListener('gg_streetview_position_changed', () => {
        MAP_STATE.map3d = true;
    });

    THE_WINDOW.addEventListener('gg_map_tiles_loaded', () => {
        MAP_STATE.tilesLoaded = true;
    });

    THE_WINDOW.addEventListener('gg_round_start', (evt) => {
        MAP_STATE = {
            map2d: false,
            map3d: false,
            tilesLoaded: false,
            roundStart: Date.now()
        };
    });
};

const activateLoadedMods = () => {  // Refresh state from localStorage and activate mods.
    for (const [mod, callback] of getBindings()) {
        if (mod.show && mod.active) {
            try {
                callback(true); // True because it was loaded from state.
            } catch (err) {
                console.error(`activateLoadedMods: Error activating mod ${mod.name}:`, err);
            }
        }
    }
};

const initializeMods = async () => {
    if (_MODS_LOADED) {
        return;
    }

    const mapsReady = MAP_STATE.map2d && MAP_STATE.map3d;
    if (!mapsReady) {
        console.debug(`Maps not loaded yet; can't activate mods.`);
        setTimeout(initializeMods, 300);
    }

    try {
        loadState();
        activateLoadedMods();
        setUpMapEventListeners();
        addButtons();
        fixFormatting();

        if (THE_WINDOW.CHEAT_PROTECTION) { // This is disabled by default but left for potential future use.
            setTimeout(() => {
                clickGarbage(900);
            }, 500);
        }

        if (DEBUG) {
            addDebugger();
        }

        // Create observer to monitor DOM changes and add buttons when the game interface loads.
        const observer = new MutationObserver(() => {
            try {
                addButtons();
            } catch (err) {
                console.error(err);
            }
        });

        // Start observing the React root element for changes
        const nextElement = document.querySelector('#__next');
        if (nextElement) {
            observer.observe(nextElement, { subtree: true, childList: true });
            addButtons();
        } else {
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
                setTimeout(initializeMods, 1000);
            }
        }
    } catch (err) {
        console.error(err);
    }
};

document.addEventListener('gg_maps_ready', () => { // After additional GEF setup has been done.
    initializeMods();
});

const isGoogleReady = () => {
    try {
        const google = getGoogle();
        if (!google || !google.maps) {
            return false;
        }
        const map2dReady = GOOGLE_MAP && getGuessmap();
        const map3dReady = GOOGLE_STREETVIEW && getStreetviewCanvas();
        return map2dReady && map3dReady;
    } catch (err) {
        console.error('Error checking map readiness:', err);
        return false;
    }
};

const reactivateMods = () => {
    if (!isGoogleReady()) {
        return;
    }
    if (!getModDiv()) {
        const buttonsAdded = addButtons();
        if (buttonsAdded) {
            bindButtons();
        }
    }
    for (const [mod, callback] of getBindings()) {
        if (mod.active && mod.show) {
            try {
                callback(true);
            } catch (err) {
                console.error(`Error reactivating mod ${mod.name}:`, err);
            }
        }
    }
    THE_WINDOW.dispatchEvent(new CustomEvent('gg_mods_reactivate', { detail: { timestamp: Date.now() } }));
};

const onRoundStart = (evt) => {
    _MODS_LOADED = false;
    THE_WINDOW.localStorage.setItem(STATE_KEY, JSON.stringify(MODS));

    createLoadOverlay();

    try {
        const round = evt.detail.rounds[evt.detail.rounds.length - 1];
        GG_ROUND = round;
        const mapID = evt.detail.map.id;
        fetch(`https://www.geoguessr.com/api/maps/${mapID}`)
            .then(data => data.json())
            .then(data => {
                GG_MAP = data;
            });
    } catch (err) {
        console.err(err);
    }

    waitForMapsReady(() => {
        reactivateMods();
    });

    THE_WINDOW.dispatchEvent(new CustomEvent('gg_round_start', {
        detail: evt.detail || {}
    }));
};

const onRoundEnd = (evt) => {
    GG_ROUND = undefined;
    GG_CLICK = undefined;
    GG_MAP = undefined;
}

GEF = GeoGuessrEventFramework;
GEF.init().then(GEF => { // Note: GG_MAP is the min-map, GOOGLE_MAP is used for pulling funtionality from Google's map functions.
    GEF.events.addEventListener('round_start', (evt) => onRoundStart(evt));
    GEF.events.addEventListener('round_end', (evt) => onRoundEnd(evt));
}).catch(err => {
    console.error(err);
});

const addKeyBindings = () => {
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
};
addKeyBindings();
