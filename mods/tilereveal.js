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
    
    console.debug('TileReveal: Resetting tile count to:', _TILE_COUNT);
    
    // Update the counter display if it exists
    const counter = document.getElementById('gg-tile-count-value');
    if (counter) {
        counter.innerText = _TILE_COUNT;
        console.debug('TileReveal: Updated counter display to:', _TILE_COUNT);
    } else {
        console.debug('TileReveal: Counter display not found, will be set when created');
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
        console.debug('TileReveal: Not on a game page, skipping tile counter creation. Path:', THE_WINDOW.location.pathname);
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

    // Create container for the tile count display and reset button
    const contentContainer = document.createElement('div');
    contentContainer.id = 'gg-tile-count-container';

    // Create the tile count display
    const countDisplay = document.createElement('div');
    countDisplay.id = 'gg-tile-count-display';

    const label = document.createElement('span');
    label.textContent = 'Tiles remaining: ';

    const count = document.createElement('span');
    count.id = 'gg-tile-count-value';
    count.textContent = getTileCount();

    countDisplay.appendChild(label);
    countDisplay.appendChild(count);

    // Create the reset button
    const resetButton = document.createElement('button');
    resetButton.id = 'gg-tile-reset-button';
    resetButton.textContent = '↺';
    resetButton.title = 'Reset all tiles';

    // Reset button functionality
    const onReset = () => {
        console.debug('TileReveal: Manual reset button clicked');
        
        // Reset the tile count to the original value
        resetTileCount();
        
        // Remove all 'removed' classes from tiles to make them black again
        const tiles = document.querySelectorAll('.gg-tile-block');
        tiles.forEach(tile => {
            tile.classList.remove('removed');
        });
        
        console.debug('TileReveal: Reset completed - all tiles restored and counter reset to:', _TILE_COUNT);
    };
    
    resetButton.addEventListener('click', onReset);
    resetButton.addEventListener('mousedown', (evt) => {
        evt.stopPropagation(); // Prevent dragging when clicking the button
    });

    // Add elements to the content container
    contentContainer.appendChild(countDisplay);
    contentContainer.appendChild(resetButton);
    
    // Add content container to main container
    container.appendChild(contentContainer);
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
        console.debug('TileReveal: Not on a game page, skipping tile creation. Path:', THE_WINDOW.location.pathname);
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
        console.debug('TileReveal: Skipping reset - mod not active');
        return; // Only reset if the mod is active
    }
    
    // Only reset on game pages
    if (!areModsAvailable()) {
        console.debug('TileReveal: Not on a game page, skipping reset. Path:', THE_WINDOW.location.pathname);
        return;
    }
    
    console.debug('TileReveal: Resetting tiles and counter');
    
    // First, forcefully remove any existing tiles
    const existingOverlay = document.getElementById('gg-tile-overlay');
    if (existingOverlay) {
        console.debug('TileReveal: Removing existing tile overlay');
        existingOverlay.remove();
    }
    
    // Reset the counter
    resetTileCount();
    console.debug('TileReveal: Tile count reset to:', _TILE_COUNT);
    
    // Re-create the tiles (this will remove old ones and create fresh ones)
    const nRows = getOption(mod, 'nRows');
    const nCols = getOption(mod, 'nCols');
    console.debug('TileReveal: Creating new tiles grid:', { nRows, nCols });
    makeTiles(nRows, nCols);
    
    // Verify the tiles were created
    const newOverlay = document.getElementById('gg-tile-overlay');
    if (newOverlay) {
        const tiles = newOverlay.querySelectorAll('.gg-tile-block');
        console.debug('TileReveal: Successfully created', tiles.length, 'tiles');
    } else {
        console.warn('TileReveal: Failed to create tile overlay after reset');
    }
};

const startTileRevealLocationTracking = () => {
    // Register with the global location tracker but be very conservative about resets
    THE_WINDOW.GG_LOCATION_TRACKER.subscribe('tilereveal', (newUrl, oldUrl) => {
        console.debug('TileReveal: URL change detected:', { oldUrl, newUrl });
        
        // Extract game identifiers from URLs
        const getGameId = (url) => {
            if (!url) return null;
            const match = url.match(/\/game\/([^\/\?#]+)/);
            return match ? match[1] : null;
        };
        
        const newGameId = getGameId(newUrl);
        const oldGameId = getGameId(oldUrl);
        
        console.debug('TileReveal: Game ID comparison:', { oldGameId, newGameId });
        
        // Only reset if we have a completely different game ID (new game/round)
        if (newGameId && oldGameId && newGameId !== oldGameId) {
            console.debug('TileReveal: New game detected, resetting tiles. Old:', oldGameId, 'New:', newGameId);
            setTimeout(() => {
                resetTileReveal();
            }, 200); // Quick reset for URL-based detection
            _LAST_GAME_URL = newUrl;
        } else if (newGameId && !oldGameId) {
            // Entering a game from a non-game page
            console.debug('TileReveal: Entering new game, resetting tiles. Game ID:', newGameId);
            setTimeout(() => {
                resetTileReveal();
            }, 200);
            _LAST_GAME_URL = newUrl;
        } else {
            console.debug('TileReveal: Same game or non-game URL change, preserving tiles');
        }
        
        // Don't reset for URL changes within the same game (like making guesses)
        if (newGameId === oldGameId && newGameId) {
            console.debug('TileReveal: Same game, preserving revealed tiles. Game ID:', newGameId);
        }
    }, 3000); // Check every 3 seconds - less frequent to avoid conflicts
    
    // Add round start listener if not already added - this should be the primary reset trigger
    if (!_ROUND_START_LISTENER_ADDED && typeof GEF !== 'undefined' && GEF.events) {
        GEF.events.addEventListener('round_start', () => {
            console.debug('TileReveal: GEF round_start event received - resetting tiles');
            setTimeout(() => {
                console.debug('TileReveal: Executing delayed reset from GEF round_start');
                resetTileReveal();
            }, 500); // Shorter delay for better responsiveness
        });
        _ROUND_START_LISTENER_ADDED = true;
        console.debug('TileReveal: GEF round_start event listener added');
    } else if (!_ROUND_START_LISTENER_ADDED) {
        console.debug('TileReveal: GEF not available, skipping GEF event listener');
    }
    
    // Listen for custom round start events - but be very specific
    if (!THE_WINDOW._TILE_REVEAL_CUSTOM_LISTENER_ADDED) {
        THE_WINDOW.addEventListener('gg_round_start', (evt) => {
            console.debug('TileReveal: gg_round_start event received:', evt.detail);
            // Add a small delay to ensure the round is fully initialized
            setTimeout(() => {
                console.debug('TileReveal: Executing delayed reset from gg_round_start');
                resetTileReveal();
            }, 500); // Shorter delay to be more responsive
        });
        THE_WINDOW._TILE_REVEAL_CUSTOM_LISTENER_ADDED = true;
        console.debug('TileReveal: gg_round_start event listener added');
    }
    
    // Listen for mod reactivation events - only reset when mod is reactivated, not other events
    if (!THE_WINDOW._TILE_REVEAL_REACTIVATE_LISTENER_ADDED) {
        THE_WINDOW.addEventListener('gg_mods_reactivate', (evt) => {
            console.debug('TileReveal: Mod reactivation event received');
            if (isModActive(MODS.tileReveal)) {
                console.debug('TileReveal: TileReveal mod is active - resetting tiles');
                setTimeout(() => {
                    resetTileReveal();
                }, 100); // Very short delay
            } else {
                console.debug('TileReveal: TileReveal mod is not active - skipping reset');
            }
        });
        THE_WINDOW._TILE_REVEAL_REACTIVATE_LISTENER_ADDED = true;
        console.debug('TileReveal: gg_mods_reactivate event listener added');
    }
    
    // Remove the visibility change listener - it's too aggressive and triggers on tab switches
    // and may be causing resets when clicking on the map
    
    // Add page reload detection only - much more conservative
    if (!THE_WINDOW._TILE_REVEAL_RELOAD_LISTENER_ADDED) {
        THE_WINDOW.addEventListener('beforeunload', () => {
            // Mark that a page reload is happening
            sessionStorage.setItem('gg_tile_reveal_reloaded', 'true');
        });
        
        // Check if we just reloaded on page load
        if (sessionStorage.getItem('gg_tile_reveal_reloaded') === 'true') {
            sessionStorage.removeItem('gg_tile_reveal_reloaded');
            console.debug('TileReveal: Page reload detected - will reset tiles on next activation');
        }
        
        THE_WINDOW._TILE_REVEAL_RELOAD_LISTENER_ADDED = true;
    }
};

const stopTileRevealLocationTracking = () => {
    // Unregister from the global location tracker
    THE_WINDOW.GG_LOCATION_TRACKER.unsubscribe('tilereveal');
};

const updateTileReveal = (forceState = undefined) => {
    const mod = MODS.tileReveal;
    const active = updateMod(mod, forceState);
    const isGamePage = areModsAvailable();

    if (active && isGamePage) {
        console.debug('TileReveal: Activating mod on game page');
        
        // Ensure we start fresh - explicitly reset everything
        const nRows = getOption(mod, 'nRows');
        const nCols = getOption(mod, 'nCols');
        
        // Remove any existing tiles first
        removeTiles();
        
        // Create fresh tiles
        makeTiles(nRows, nCols);
        makeTileCounter();
        
        // Reset the tile count properly
        resetTileCount();
        
        // Update the counter display with the fresh count
        const counter = document.getElementById('gg-tile-count-value');
        if (counter) {
            counter.innerText = _TILE_COUNT;
        }
        
        // Store the current URL when activating the mod
        _LAST_GAME_URL = THE_WINDOW.location.href;
        
        // Start location tracking when the mod is activated
        startTileRevealLocationTracking();
        
        console.debug('TileReveal: Mod activated with', _TILE_COUNT, 'tiles available');
    } else if (active && !isGamePage) {
        // Mod is active but not on a game page - clean up any existing overlays
        console.debug('TileReveal: Mod active but not on game page, cleaning up');
        removeTiles();
        removeTileCounter();
        stopTileRevealLocationTracking();
        _LAST_GAME_URL = null;
    } else {
        console.debug('TileReveal: Deactivating mod');
        removeTiles();
        removeTileCounter();
        
        // Stop location tracking when the mod is deactivated
        stopTileRevealLocationTracking();
        _LAST_GAME_URL = null;
    }
};
