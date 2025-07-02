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
let _TILEREVEAL_CURRENT_LOCATION = window.location.href; // Track current location for reset detection
let _LOCATION_CHECK_INTERVAL; // Interval for checking location changes
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
    
    console.log('Resetting tile reveal mod due to page/location change');
    
    // Reset the counter
    resetTileCount();
    
    // Re-create the tiles (this will remove old ones and create fresh ones)
    const nRows = getOption(mod, 'nRows');
    const nCols = getOption(mod, 'nCols');
    makeTiles(nRows, nCols);
    
    // Update current location tracking
    _TILEREVEAL_CURRENT_LOCATION = window.location.href;
};

const checkForLocationChange = () => {
    if (window.location.href !== _TILEREVEAL_CURRENT_LOCATION) {
        resetTileReveal();
    }
};

const startLocationTracking = () => {
    // Clear any existing interval
    if (_LOCATION_CHECK_INTERVAL) {
        clearInterval(_LOCATION_CHECK_INTERVAL);
    }
    
    // Start checking for location changes every 2 seconds
    _LOCATION_CHECK_INTERVAL = setInterval(checkForLocationChange, 2000);
    
    // Add round start listener if not already added
    if (!_ROUND_START_LISTENER_ADDED && typeof GEF !== 'undefined' && GEF.events) {
        GEF.events.addEventListener('round_start', () => {
            console.log('Tile reveal: Round start detected, resetting tiles');
            setTimeout(() => {
                resetTileReveal();
            }, 500); // Small delay to ensure everything is loaded
        });
        _ROUND_START_LISTENER_ADDED = true;
        console.log('Tile reveal: Round start listener added');
    }
    
    // Add beforeunload listener for page refresh detection
    window.addEventListener('beforeunload', () => {
        console.log('Tile reveal: Page unload detected, will reset on next load');
    });
    
    // Add visibility change listener for tab focus/reload detection
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // Page became visible again, check if we need to reset
            setTimeout(checkForLocationChange, 100);
        }
    });
};

const stopLocationTracking = () => {
    if (_LOCATION_CHECK_INTERVAL) {
        clearInterval(_LOCATION_CHECK_INTERVAL);
        _LOCATION_CHECK_INTERVAL = null;
    }
};

const updateTileReveal = (forceState = null) => {
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
        startLocationTracking();
        
        // Update current location
        _TILEREVEAL_CURRENT_LOCATION = window.location.href;
    } else {
        removeTiles();
        removeTileCounter();
        
        // Stop location tracking when the mod is deactivated
        stopLocationTracking();
    }
};
