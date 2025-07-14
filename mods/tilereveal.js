// ==UserScript==
// @author       tpebop

// ==/UserScript==

// MOD: Tile reveal.
// ===============================================================================================================================

let _TILE_COUNT_DISPLAY; // Div for showing the number of remaining tiles.
let _TILE_COUNT; // How many remaining tiles the user has.
let _TILE_COUNT_DRAGGING = false;
let _TILE_COUNT_OFFSET_X = 0;
let _TILE_COUNT_OFFSET_Y = 0;
let _ROUND_START_LISTENER_ADDED = false; // Track if round start listener is added

const getTileCount = () => {
    if (_TILE_COUNT == null) {
        _TILE_COUNT = getOption(MODS.tileReveal, 'nClicks');
    }
    _TILE_COUNT = Math.round(Number(_TILE_COUNT));
    if (isNaN(_TILE_COUNT)) {
        _TILE_COUNT = 0;
    }
    return _TILE_COUNT;
};

const resetTileCount = () => {
    _TILE_COUNT = getOption(MODS.tileReveal, 'nClicks');
    _TILE_COUNT = getTileCount(); // Normalize the value
    
    // Update the counter display if it exists
    const counter = document.getElementById('gg-tile-count-value');
    if (counter) {
        counter.innerText = _TILE_COUNT;
    }
};

const removeTileCounter = () => {
    if (_TILE_COUNT_DISPLAY) {
        _TILE_COUNT_DISPLAY.parentElement.removeChild(_TILE_COUNT_DISPLAY);
        _TILE_COUNT_DISPLAY = undefined;
    }
};

const makeTileCounter = () => {
    removeTileCounter();

    const container = document.createElement('div');
    container.id = 'gg-tile-count';

    container.onmousedown = (evt) => {
        _TILE_COUNT_DRAGGING = true;
        _TILE_COUNT_OFFSET_X = evt.clientX - container.offsetLeft;
        _TILE_COUNT_OFFSET_Y = evt.clientY - container.offsetTop;
    };

    document.onmousemove = (evt) => {
        if (_TILE_COUNT_DRAGGING) {
            container.style.left = `${evt.clientX - _TILE_COUNT_OFFSET_X}px`;
            container.style.top = `${evt.clientY - _TILE_COUNT_OFFSET_Y}px`;
        }
    };

    document.onmouseup = () => {
        _TILE_COUNT_DRAGGING = false;
    };

    const label = document.createElement('span');
    label.textContent = 'Tiles remaining: ';

    const count = document.createElement('span');
    count.id = 'gg-tile-count-value';
    count.textContent = getTileCount();

    container.appendChild(label);
    container.appendChild(count);
    document.body.appendChild(container);

    _TILE_COUNT_DISPLAY = container;
};

const removeTiles = () => {
    const tileOverlay = document.getElementById('gg-tile-overlay');
    if (tileOverlay) {
        tileOverlay.parentElement.removeChild(tileOverlay);
    }
};

const onClickTile = (evt) => {
    const tile = evt.target;
    evt.preventDefault();
    evt.stopPropagation();
    evt.stopImmediatePropagation();

    _TILE_COUNT = getTileCount();
    if (_TILE_COUNT > 0) {
        _TILE_COUNT -= 1;
        const counter = document.getElementById('gg-tile-count-value');
        counter.innerText = _TILE_COUNT;
        tile.classList.add('removed');
    }
};

const makeTiles = (nRows, nCols) => {
    removeTiles();

    const bigMapCanvas = getBigMapCanvas();
    if (!bigMapCanvas) {
        return;
    }

    const tileOverlay = document.createElement('div');
    tileOverlay.id = 'gg-tile-overlay';
    tileOverlay.style.gridTemplateRows = `repeat(${nRows}, 1fr)`;
    tileOverlay.style.gridTemplateColumns = `repeat(${nCols}, 1fr)`;

    for (let i = 0; i < nRows * nCols; i++) {
        const tile = document.createElement('div');
        tile.className = 'gg-tile-block';
        tile.addEventListener('click', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            onClickTile(evt);
        });
        tile.addEventListener('mousedown', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
        });
        tile.addEventListener('mouseup', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
        });
        tileOverlay.appendChild(tile);
    }

    bigMapCanvas.parentElement.insertBefore(tileOverlay, bigMapCanvas.parentElement.firstChild);
};

const resetTileReveal = () => {
    const mod = MODS.tileReveal;
    if (!mod.active) {
        return; // Only reset if the mod is active
    }
    
    console.debug('TileReveal: Resetting tiles and counter');
    
    // Reset the counter
    resetTileCount();
    
    // Re-create the tiles (this will remove old ones and create fresh ones)
    const nRows = getOption(mod, 'nRows');
    const nCols = getOption(mod, 'nCols');
    makeTiles(nRows, nCols);
};

const startTileRevealLocationTracking = () => {
    // Register with the global location tracker with less aggressive checking
    window.GG_LOCATION_TRACKER.subscribe('tilereveal', (newUrl, oldUrl) => {
        // Only reset on actual round changes, not minor URL updates
        const newPath = new URL(newUrl).pathname;
        const oldPath = oldUrl ? new URL(oldUrl).pathname : '';
        
        // Check if this is a genuine game/round change
        const isNewGame = newPath.includes('/game/') && !oldPath.includes('/game/');
        const isNewChallenge = newPath.includes('/live-challenge/') && !oldPath.includes('/live-challenge/');
        
        if (isNewGame || isNewChallenge) {
            console.debug('TileReveal: Detected new game/challenge, resetting');
            resetTileReveal();
        }
    }, 5000); // Reduced frequency: Check every 5 seconds instead of 2
    
    // Add round start listener if not already added
    if (!_ROUND_START_LISTENER_ADDED && typeof GEF !== 'undefined' && GEF.events) {
        GEF.events.addEventListener('round_start', () => {
            console.debug('TileReveal: Round start event received (GEF)');
            setTimeout(() => {
                resetTileReveal();
            }, 500); // Small delay to ensure everything is loaded
        });
        _ROUND_START_LISTENER_ADDED = true;
    }
    
    // Also listen for our custom round start event (with duplicate prevention)
    if (!window._TILE_REVEAL_CUSTOM_LISTENER_ADDED) {
        window.addEventListener('gg_round_start', (evt) => {
            console.debug('TileReveal: Custom round start event received');
            setTimeout(() => {
                resetTileReveal();
            }, 500);
        });
        window._TILE_REVEAL_CUSTOM_LISTENER_ADDED = true;
    }
    
    // Listen for mod reactivation events (with duplicate prevention)
    if (!window._TILE_REVEAL_REACTIVATE_LISTENER_ADDED) {
        window.addEventListener('gg_mods_reactivate', (evt) => {
            console.debug('TileReveal: Mod reactivation event received');
            if (isModActive(MODS.tileReveal)) {
                setTimeout(() => {
                    resetTileReveal();
                }, 500);
            }
        });
        window._TILE_REVEAL_REACTIVATE_LISTENER_ADDED = true;
    }
    
    // Add beforeunload listener for page refresh detection
    window.addEventListener('beforeunload', () => {
    });
    
    // Add visibility change listener for page reload detection only (with duplicate prevention)
    if (!window._TILE_REVEAL_VISIBILITY_LISTENER_ADDED) {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Only reset if we detect this might be a page reload (not just tab switching)
                // Check if the tile overlay still exists - if not, the page was likely reloaded
                const existingOverlay = document.getElementById('gg-tile-overlay');
                if (!existingOverlay && isModActive(MODS.tileReveal)) {
                    console.debug('TileReveal: Page visibility change detected, tiles missing, resetting');
                    setTimeout(() => {
                        resetTileReveal();
                    }, 100);
                }
            }
        });
        window._TILE_REVEAL_VISIBILITY_LISTENER_ADDED = true;
    }
};

const stopTileRevealLocationTracking = () => {
    // Unregister from the global location tracker
    window.GG_LOCATION_TRACKER.unsubscribe('tilereveal');
};

const updateTileReveal = (forceState = undefined) => {
    const mod = MODS.tileReveal;
    const active = updateMod(mod, forceState);

    if (active) {
        const nRows = getOption(mod, 'nRows');
        const nCols = getOption(mod, 'nCols');
        makeTiles(nRows, nCols);
        makeTileCounter();
        _TILE_COUNT = getOption(mod, 'nClicks');
        _TILE_COUNT = getTileCount(); // Fix any weird inputs.
        
        // Start location tracking when the mod is activated
        startTileRevealLocationTracking();
    } else {
        removeTiles();
        removeTileCounter();
        
        // Stop location tracking when the mod is deactivated
        stopTileRevealLocationTracking();
    }
};
