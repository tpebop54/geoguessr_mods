// ==UserScript==
// @name         GG Mod Tile Reveal
// @description  Tile reveal mod for GeoGuessr
// @version      1.0
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
    if (_TILE_COUNT == null) {
        _TILE_COUNT = getOption(MODS.tileReveal, 'nClicks');
    }
    _TILE_COUNT = Math.round(Number(_TILE_COUNT));
    if (isNaN(_TILE_COUNT)) {
        _TILE_COUNT = 0;
    }
    return _TILE_COUNT;
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
    } else {
        removeTiles();
        removeTileCounter();
    }
};
