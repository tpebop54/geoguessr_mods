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
const _buttonsVisibleKey = 'gg_mod_buttons_visible';
let _BUTTONS_VISIBLE = THE_WINDOW.localStorage.getItem(_buttonsVisibleKey);
_BUTTONS_VISIBLE = _BUTTONS_VISIBLE == 'true' || _BUTTONS_VISIBLE == null;
const _storeButtonsVisible = (visible) => {
    _BUTTONS_VISIBLE = !!visible;
    THE_WINDOW.localStorage.setItem(_buttonsVisibleKey, _BUTTONS_VISIBLE);
};

const addButtons = () => { // Add mod buttons to the active round, with a little button to toggle them.
    try {
        if (!areModsAvailable()) {
            return false;
        }

        const streetviewContainer = getStreetviewContainer();
        const modContainer = getModsContainer(); // Includes header and buttons.
        if (modContainer || !streetviewContainer) { // Mods already loaded, or map not loaded yet.
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
                streetviewContainer.appendChild(modsContainer);
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
            _storeButtonsVisible(show);
        };

        modMenuToggle.addEventListener('click', function () {
            _BUTTONS_VISIBLE = !_BUTTONS_VISIBLE;
            setMenuVisible(_BUTTONS_VISIBLE);
        });
        setMenuVisible(!!_BUTTONS_VISIBLE);

        setTimeout(addButtonContainer, 100);
        _MODS_READY = true;
        return true;

    } catch (err) {
        console.error('Error creating mod menu:', err);
        return false;
    }
};

const removeModMenu = () => {
    const modContainer = getModsContainer();
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

const initMods = () => {
    if (_MODS_READY) {
        return;
    }

    const modsLoaded = waitForMapsReady();
    if (!modsLoaded) {
        console.error('Failed to load mods.');
        return;
    }

    loadState();
    saveState();
    activateLoadedMods();
    setUpMapEventListeners();
    addButtons();
    fixFormatting();

    if (DEBUG) {
        addDebugger();
    }

    _MODS_READY = true;
};

document.addEventListener('gg_maps_ready', initMods); // After additional GEF setup has been done.

const reactivateMods = () => {
    waitForMapsReady();
    if (!getModsContainer()) {
        addButtons();
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
};

const onRoundStartSingleplayer = (evt) => { // Singleplayer only. TODO: clean up, share with duels logic if possible.
    _MODS_READY = false;
    THE_WINDOW.localStorage.setItem(STATE_KEY, JSON.stringify(MODS));

    createLoadOverlay();

    try {
        const round = evt.detail.rounds[evt.detail.rounds.length - 1];
        GG_ROUND = round;
        const mapID = evt.detail.map.id;
        fetch(`https://www.geoguessr.com/api/maps/${mapID}`)
            .then(data => data.json())
            .then(data => {
                GG_GUESSMAP = data;
            });
    } catch (err) {
        console.err(err);
    }

    waitForMapsReady(reactivateMods);

    THE_WINDOW.dispatchEvent(new CustomEvent('gg_round_start', {
        detail: evt.detail || {}
    }));
};

// Note: GG_GUESSMAP is the small guess map, GOOGLE_MAP is used for pulling funtionality from Google's map functions.
const onRoundEndSingleplayer = (evt) => { // Singleplayer only. TODO: clean up, share with duels logic if possible.
    GG_ROUND = undefined;
    GG_CLICK = undefined;
    GG_GUESSMAP = undefined;
    _MODS_READY = false;
};

const onRoundStartMultiplayer = () => {
    waitForMapsReady(reactivateMods);
    fixFormatting();
};

const onRoundEndMultiplayer = () => {
    waitForMapsReady(reactivateMods);
};

GEF.events.addEventListener('round_start', (evt) => {
    onRoundStartSingleplayer();
});
GEF.events.addEventListener('round_end', (evt) => {
    onRoundEndSingleplayer();
});

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
            evt.preventDefault()
            debugMap(this, evt);
        });
    }
};

const setupGlobalKeyBindings = () => {
    document.addEventListener('keydown', (evt) => {
        // Check if user is interacting with form elements or options menu.
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

        // Don't process hotkeys if user is in a form element or options menu.
        if (isFormElement || isInOptionsMenu) {
            return;
        }

        // Nuclear option to disable all mods if things get out of control.
        if (evt.ctrlKey && evt.shiftKey && evt.key === '>') {
            console.log('Nuclear option triggered: disabling all mods');
            clearState();
            THE_WINDOW.location.reload();
        }

        // Open debugger.
        if (evt.ctrlKey && evt.shiftKey && evt.key === '<') {
            debugMap();
        }
    });
};

// Initialize global keybindings when DOM is ready, which it may be already.
const initializeGlobalKeybindings = () => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupGlobalKeyBindings);
    } else {
        setupGlobalKeyBindings();
    }
};
initializeGlobalKeybindings();

// For reloading mods on new rounds, we need to watch for the disappearance of specific elements
// that indicate a new round is starting.
let _RESULT_MAP = null;
let _ROUND_STARTING_WRAPPER = null;

const watchRoundEnd = () => {
    const prepNewRound = () => {
        if (_IS_DUEL) {
            const currentWrapper = getRoundStartingWrapper();
            if (currentWrapper) {
                _ROUND_STARTING_WRAPPER = currentWrapper;
            } else if (_ROUND_STARTING_WRAPPER) {
                _ROUND_STARTING_WRAPPER = null; // Wrapper disappeared, new round starting.
                onRoundStartMultiplayer();
            }
        } else {
            const currentResultMap = getResultMap();
            if (currentResultMap) {
                _RESULT_MAP = currentResultMap;
            } else if (_RESULT_MAP) {
                _RESULT_MAP = null; // Result map disappeared, new round starting.
                onRoundStarSingleplayer();
            }
        }
    };

    const onEndGame = () => {
        const endGameOverlay = getSingleplayerGameResultsDiv();
        if (endGameOverlay) {
            for (const container of document.querySelectorAll('.gg-persistent-container')) {
                container.parentElement.removeChild(container);
            }
        }
    };

    const observer = new MutationObserver(() => {
        prepNewRound();
        onEndGame();
    });
    observer.observe(document.body, { childList: true, subtree: true });
}
watchRoundEnd();
