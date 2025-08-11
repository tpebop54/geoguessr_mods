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

const getTileCount = () => {
    if (isNaN(_TILE_COUNT) || _TILE_COUNT < 0) {
        _TILE_COUNT = getOption(MODS.tileReveal, 'nClicks');
    }
    return _TILE_COUNT;
};

const resetTileCount = () => {
    _TILE_COUNT = getOption(MODS.tileReveal, 'nClicks');
    
    const counter = document.getElementById('gg-tile-count-value');
    if (counter) {
        counter.innerText = getTileCount();
    }
};

const removeTileCounter = () => {
    if (_TILE_COUNT_DISPLAY) {
        _TILE_COUNT_DISPLAY.parentElement.removeChild(_TILE_COUNT_DISPLAY);
        _TILE_COUNT_DISPLAY = undefined;
    }
};

const makeTileCounter = () => {
    if (!areModsAvailable()) {
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

    const contentContainer = document.createElement('div');
    contentContainer.id = 'gg-tile-count-container';

    // Tile count display
    const countDisplay = document.createElement('div');
    countDisplay.id = 'gg-tile-count-display';

    const label = document.createElement('span');
    label.textContent = 'Tiles remaining: ';

    const count = document.createElement('span');
    count.id = 'gg-tile-count-value';
    count.textContent = getTileCount();

    countDisplay.appendChild(label);
    countDisplay.appendChild(count);

    // Reset button
    const resetButton = document.createElement('button');
    resetButton.id = 'gg-tile-reset-button';
    resetButton.classList.add('gg-interactive-button');
    resetButton.textContent = '↺';
    resetButton.title = 'Reset all tiles';

    const onReset = () => {
        resetTileCount();
        const tiles = document.querySelectorAll('.gg-tile-block');
        tiles.forEach(tile => {
            tile.classList.remove('removed');
        });
    };
    
    resetButton.addEventListener('click', onReset);
    resetButton.addEventListener('mousedown', (evt) => {
        evt.stopPropagation(); // Prevent dragging when clicking the button
    });

    contentContainer.appendChild(countDisplay);
    contentContainer.appendChild(resetButton);
    
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
        counter.innerText = getTileCount();
        tile.classList.add('removed');
    }
};

const makeTiles = (nRows, nCols) => {
    if (!areModsAvailable()) {
        return;
    }
    
    removeTiles();

    const bigMapCanvas = getStreetviewCanvas();
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

const updateTileReveal = (forceState = undefined) => {
    const mod = MODS.tileReveal;
    const active = updateMod(mod, forceState);

    if (!active || !areModsAvailable()) {
        removeTiles();
        removeTileCounter();
        return;
    }

    const nRows = getOption(mod, 'nRows');
    const nCols = getOption(mod, 'nCols');
    makeTiles(nRows, nCols);
    makeTileCounter();
    if (getOption(mod, 'resetEachRound')) {
        resetTileCount();
    }
    saveState();
};
