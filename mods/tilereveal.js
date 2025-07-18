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
let _LAST_GAME_URL = null; // Track the last game URL to detect actual round changes

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
    // Only show tile counter on game pages
    if (!areModsAvailable()) {
        console.debug('TileReveal: Not on a game page, skipping tile counter creation. Path:', window.location.pathname);
        return;
    }
    
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
    // Only create tiles on game pages
    if (!areModsAvailable()) {
        console.debug('TileReveal: Not on a game page, skipping tile creation. Path:', window.location.pathname);
        return;
    }
    
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
    
    // Only reset on game pages
    if (!areModsAvailable()) {
        console.debug('TileReveal: Not on a game page, skipping reset. Path:', window.location.pathname);
        return;
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
    // Register with the global location tracker but be very conservative about resets
    window.GG_LOCATION_TRACKER.subscribe('tilereveal', (newUrl, oldUrl) => {
        // Extract game identifiers from URLs
        const getGameId = (url) => {
            if (!url) return null;
            const match = url.match(/\/game\/([^\/\?#]+)/);
            return match ? match[1] : null;
        };
        
        const newGameId = getGameId(newUrl);
        const oldGameId = getGameId(oldUrl);
        
        // Only reset if we have a completely different game ID (new game/round)
        if (newGameId && oldGameId && newGameId !== oldGameId) {
            console.debug('TileReveal: New game detected, resetting tiles. Old:', oldGameId, 'New:', newGameId);
            resetTileReveal();
            _LAST_GAME_URL = newUrl;
        } else if (newGameId && !oldGameId) {
            // Entering a game from a non-game page
            console.debug('TileReveal: Entering new game, resetting tiles. Game ID:', newGameId);
            resetTileReveal();
            _LAST_GAME_URL = newUrl;
        }
        
        // Don't reset for URL changes within the same game (like making guesses)
        if (newGameId === oldGameId && newGameId) {
            console.debug('TileReveal: Same game, preserving revealed tiles. Game ID:', newGameId);
        }
    }, 3000); // Check every 3 seconds - less frequent to avoid conflicts
    
    // Add round start listener if not already added - this should be the primary reset trigger
    if (!_ROUND_START_LISTENER_ADDED && typeof GEF !== 'undefined' && GEF.events) {
        GEF.events.addEventListener('round_start', () => {
            console.debug('TileReveal: Round start event received (GEF) - resetting tiles');
            setTimeout(() => {
                resetTileReveal();
            }, 1000); // Longer delay to ensure the round has fully started
        });
        _ROUND_START_LISTENER_ADDED = true;
    }
    
    // Listen for custom round start events - but be very specific
    if (!window._TILE_REVEAL_CUSTOM_LISTENER_ADDED) {
        window.addEventListener('gg_round_start', (evt) => {
            console.debug('TileReveal: Custom round start event received - resetting tiles');
            setTimeout(() => {
                resetTileReveal();
            }, 1000);
        });
        window._TILE_REVEAL_CUSTOM_LISTENER_ADDED = true;
    }
    
    // Listen for mod reactivation events - only reset when mod is reactivated, not other events
    if (!window._TILE_REVEAL_REACTIVATE_LISTENER_ADDED) {
        window.addEventListener('gg_mods_reactivate', (evt) => {
            if (isModActive(MODS.tileReveal)) {
                console.debug('TileReveal: Mod reactivation event received - resetting tiles');
                setTimeout(() => {
                    resetTileReveal();
                }, 1000);
            }
        });
        window._TILE_REVEAL_REACTIVATE_LISTENER_ADDED = true;
    }
    
    // Remove the visibility change listener - it's too aggressive and triggers on tab switches
    // and may be causing resets when clicking on the map
    
    // Add page reload detection only - much more conservative
    if (!window._TILE_REVEAL_RELOAD_LISTENER_ADDED) {
        window.addEventListener('beforeunload', () => {
            // Mark that a page reload is happening
            sessionStorage.setItem('gg_tile_reveal_reloaded', 'true');
        });
        
        // Check if we just reloaded on page load
        if (sessionStorage.getItem('gg_tile_reveal_reloaded') === 'true') {
            sessionStorage.removeItem('gg_tile_reveal_reloaded');
            console.debug('TileReveal: Page reload detected - will reset tiles on next activation');
        }
        
        window._TILE_REVEAL_RELOAD_LISTENER_ADDED = true;
    }
};

const stopTileRevealLocationTracking = () => {
    // Unregister from the global location tracker
    window.GG_LOCATION_TRACKER.unsubscribe('tilereveal');
};

const updateTileReveal = (forceState = undefined) => {
    const mod = MODS.tileReveal;
    const active = updateMod(mod, forceState);
    const isGamePage = areModsAvailable();

    if (active && isGamePage) {
        const nRows = getOption(mod, 'nRows');
        const nCols = getOption(mod, 'nCols');
        makeTiles(nRows, nCols);
        makeTileCounter();
        _TILE_COUNT = getOption(mod, 'nClicks');
        _TILE_COUNT = getTileCount(); // Fix any weird inputs.
        
        // Store the current URL when activating the mod
        _LAST_GAME_URL = window.location.href;
        
        // Start location tracking when the mod is activated
        startTileRevealLocationTracking();
    } else if (active && !isGamePage) {
        // Mod is active but not on a game page - clean up any existing overlays
        removeTiles();
        removeTileCounter();
        stopTileRevealLocationTracking();
        _LAST_GAME_URL = null;
    } else {
        removeTiles();
        removeTileCounter();
        
        // Stop location tracking when the mod is deactivated
        stopTileRevealLocationTracking();
        _LAST_GAME_URL = null;
    }
};
