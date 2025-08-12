// ==UserScript==
// @author       tpebop

// ==/UserScript==

// MOD: Puzzle.
// ===============================================================================================================================

/**
 * Unfortunately, we can't use the 3D canvas, so we recreate it as a 2D canvas to make the puzzle.
 * Ref: https://webdesign.tutsplus.com/create-an-html5-canvas-tile-swapping-puzzle--active-10747t
 */

let CANVAS_2D; // 2D canvas element that overlays the 3D one.
let CANVAS_2D_IS_REDRAWING = false; // If we're still redrawing the previous frame, this can brick the site.

let _PUZZLE_TILE_WIDTH;
let _PUZZLE_TILE_HEIGHT;
let _PUZZLE_DRAGGING_TILE;
let _PUZZLE_CURRENT_DROP_TILE;
let _PUZZLE_TILES = [];
let _PUZZLE_HOVER_TINT = '#009900'; // Used for drag and drop formatting.
let _PUZZLE_DRAGGING_IMG; // Draw tile as <img> element so it can be redrawn on the canvas while dragging tiles.
let _PUZZLE_DRAGGING_CANVAS; // Mini canvas to draw _PUZZLE_DRAGGING_IMG on.

let _CANVAS_2D_MOUSEDOWN; // Pointer down listener.
let _CANVAS_2D_MOUSEUP; // Pointer up listener.
let _CANVAS_2D_MOUSEMOVE; // Track all mouse movements on 2D canvas.
let _CANVAS_2D_MOUSE_LOC = { x: 0, y: 0 };

const addCanvas2dMousemove = () => {
    if (_CANVAS_2D_MOUSEMOVE) {
        return;
    }
    _CANVAS_2D_MOUSEMOVE = CANVAS_2D.addEventListener('mousemove', (evt) => {
        _CANVAS_2D_MOUSE_LOC.x = evt.offsetX;
        _CANVAS_2D_MOUSE_LOC.y = evt.offsetY;
    });
};

const getTileSize = () => {
    return {
        width: 512, // Google Street View tiles are 512x512. Maximum is 640x640.
        height: 512,
    };
};

const clearCanvas2d = () => {
    if (CANVAS_2D && _CANVAS_2D_MOUSEMOVE) {
        CANVAS_2D.removeEventListener('mousemove', _CANVAS_2D_MOUSEMOVE);
        _CANVAS_2D_MOUSEMOVE = null;
    }
    if (CANVAS_2D && CANVAS_2D.parentElement) {
        CANVAS_2D.parentElement.removeChild(CANVAS_2D);
        CANVAS_2D = null;
    }
    if (_PUZZLE_DRAGGING_IMG && _PUZZLE_DRAGGING_IMG.parentElement) {
        _PUZZLE_DRAGGING_IMG.parentElement.removeChild(_PUZZLE_DRAGGING_IMG);
        _PUZZLE_DRAGGING_IMG = null;
    }
    if (_PUZZLE_DRAGGING_CANVAS && _PUZZLE_DRAGGING_CANVAS.parentElement) {
        _PUZZLE_DRAGGING_CANVAS.parentElement.removeChild(_PUZZLE_DRAGGING_CANVAS);
        _PUZZLE_DRAGGING_CANVAS = null;
    }
};

/**
 * Redraw the 3D canvas as a 2D canvas so we can mess around with it.
 * We have to extract the image data from the 3D view using Google Maps API.
 * They make it impossible to extract directly from that canvas.
 */
async function drawCanvas2d() {
    CANVAS_2D_IS_REDRAWING = true;

    try {
        if (!GOOGLE_STREETVIEW) {
            throw new Error('GOOGLE_STREETVIEW not available');
        }
        
        const loc = GOOGLE_STREETVIEW.getPosition();
        if (!loc) {
            throw new Error('Street view position not available');
        }
        
        const lat = loc.lat();
        const lng = loc.lng();
        const pov = GOOGLE_STREETVIEW.getPov();
        if (!pov) {
            throw new Error('Street view POV not available');
        }
        
        const zoom = pov.zoom;

        // Calculate tile dimensions based on zoom level
        const tileSize = getTileSize();
        const nCols = Math.ceil(Math.pow(2, zoom + 1));
        const nRows = Math.ceil(Math.pow(2, zoom));

        clearCanvas2d();
        const canvas3d = getStreetviewCanvas();
        CANVAS_2D = document.createElement('canvas');
        CANVAS_2D.id = 'gg-big-canvas-2d';
        CANVAS_2D.width = nCols * tileSize.width;
        CANVAS_2D.height = nRows * tileSize.height;
        const ctx2d = CANVAS_2D.getContext('2d');
        const panoID = GOOGLE_STREETVIEW.getPano();
        if (!panoID) {
            throw new Error('Street view panorama ID not available');
        }

        let tilesLoaded = 0;
        const totalTiles = nCols * nRows;

        const loadTile = (x, y) => { // Load single tile at row x, column y.
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    const drawX = x * tileSize.width;
                    const drawY = y * tileSize.height;
                    ctx2d.drawImage(img, drawX, drawY);
                    tilesLoaded++;
                    resolve();
                };
                img.onerror = () => {
                    reject(new Error(`Failed to load tile ${x},${y}`));
                };

                // Zoom Level 0: 360 degrees of the panorama. 1: 180 deg. 2: 90 deg. 3: 45 deg.
                const fovZoom = 3;
                
                // Build URL with API key if available for better reliability
                let tileUrl;
                if (hasGoogleApiKey()) {
                    // Use the tiles API with user's API key for better rate limits
                    tileUrl = buildGoogleApiUrl('https://streetviewpixels-pa.googleapis.com/v1/tile', {
                        cb_client: 'apiv3',
                        panoid: panoID,
                        output: 'tile',
                        x: x,
                        y: y,
                        zoom: fovZoom,
                        nbt: 1,
                        fover: 2
                    });
                } else {
                    // Fallback to internal API (may have rate limits)
                    tileUrl = `https://streetviewpixels-pa.googleapis.com/v1/tile?cb_client=apiv3&panoid=${panoID}&output=tile&x=${x}&y=${y}&zoom=${fovZoom}&nbt=1&fover=2`;
                    
                    // Only warn once per session
                    if (!THE_WINDOW._puzzleApiKeyWarned) {
                        warnMissingApiKey('Puzzle mod');
                        THE_WINDOW._puzzleApiKeyWarned = true;
                    }
                }
                img.src = tileUrl;
            });
        };

        // Load all tiles.
        const tilePromises = [];
        for (let y = 0; y < nRows; y++) {
            for (let x = 0; x < nCols; x++) {
                tilePromises.push(loadTile(x, y));
            }
        }
        await Promise.all(tilePromises);

        // Put 2D canvas on top of 3D and block pointer events to the 3D.
        const mapParent = canvas3d.parentElement.parentElement;
        mapParent.insertBefore(CANVAS_2D, mapParent.firstChild);
        CANVAS_2D_IS_REDRAWING = false;
        addCanvas2dMousemove();
    } catch (err) {
        console.error('Error drawing 2D canvas:', err);
        CANVAS_2D_IS_REDRAWING = false;
        clearCanvas2d();
    }
}

const scatterCanvas2d = (nRows, nCols) => {
    const ctx2d = CANVAS_2D.getContext('2d');
    const tileWidth = CANVAS_2D.width / nCols;
    const tileHeight = CANVAS_2D.height / nRows;

    // Split 2D image into tiles.
    const tiles = [];
    for (let row = 0; row < nRows; row++) {
        for (let col = 0; col < nCols; col++) {
            const sx = col * tileWidth;
            const sy = row * tileHeight;
            const tile = ctx2d.getImageData(sx, sy, tileWidth, tileHeight);
            tiles.push({ imageData: tile, sx, sy, originalRow: row, originalCol: col });
        }
    }

    // Scramble the tiles and draw on the 2D canvas.
    _PUZZLE_TILES = shuffleArray(tiles);
    const locations = Object.values(_PUZZLE_TILES).map(tile => { return { sx: tile.sx, sy: tile.sy } });
    for (const tile of tiles) {
        const newLoc = locations.pop();
        Object.assign(tile, newLoc);
    }

    // Remove the original pasted image and redraw as scrambled tiles.
    ctx2d.clearRect(0, 0, CANVAS_2D.width, CANVAS_2D.height);
    for (const tile of _PUZZLE_TILES) {
        const { imageData, sx, sy } = tile;
        if (!imageData) {
            console.error('No image data loaded yet.');
            return null;
        }
        ctx2d.putImageData(imageData, sx, sy);
    }

    return {
        tileWidth,
        tileHeight,
        tiles,
    };
};

const pasteToDraggingImage = () => { // Paste image to temporary small canvas for dragging animation.
    if (!_PUZZLE_DRAGGING_TILE) {
        return;
    }
    if (!_PUZZLE_DRAGGING_CANVAS) {
        _PUZZLE_DRAGGING_CANVAS = document.createElement('canvas');
    }
    if (!_PUZZLE_DRAGGING_IMG) {
        _PUZZLE_DRAGGING_IMG = document.createElement('img');
    }
    const ctx2d = _PUZZLE_DRAGGING_CANVAS.getContext('2d');
    const imageData = _PUZZLE_DRAGGING_TILE.imageData;
    _PUZZLE_DRAGGING_CANVAS.width = imageData.width;
    _PUZZLE_DRAGGING_CANVAS.height = imageData.height;
    ctx2d.putImageData(imageData, 0, 0);
    _PUZZLE_DRAGGING_IMG.src = _PUZZLE_DRAGGING_CANVAS.toDataURL();
};

const getCurrentMouseTile = () => { // Tile that the mouse is currently over. Doesn't matter if user is dragging a tile or not.
    if (!_CANVAS_2D_MOUSE_LOC || !_PUZZLE_TILES) {
        return null;
    }
    const { x, y } = _CANVAS_2D_MOUSE_LOC;
    if (x == null || y == null) {
        return null;
    }
    for (const tile of _PUZZLE_TILES) {
        const leftX = tile.sx;
        const rightX = leftX + tile.imageData.width;
        const topY = tile.sy;
        const bottomY = topY + tile.imageData.height;
        if (x >= leftX && x <= rightX && y >= topY && y <= bottomY) {
            return tile;
        }
    }
    return null;
};

const onDropTile = () => { // When mouse is released, drop the dragged tile at the location, and swap them.
    if (!_PUZZLE_DRAGGING_TILE || !_PUZZLE_CURRENT_DROP_TILE) {
        console.error('Drag or drop tile is missing.');
        _PUZZLE_DRAGGING_TILE = null;
        _PUZZLE_CURRENT_DROP_TILE = null;
        return;
    }

    // Swap the x and y indices of the dragging tile and the dropping tile.
    const tmp = {
        sx: _PUZZLE_DRAGGING_TILE.sx,
        sy: _PUZZLE_DRAGGING_TILE.sy
    };
    _PUZZLE_DRAGGING_TILE.sx = _PUZZLE_CURRENT_DROP_TILE.sx;
    _PUZZLE_DRAGGING_TILE.sy = _PUZZLE_CURRENT_DROP_TILE.sy;
    _PUZZLE_CURRENT_DROP_TILE.sx = tmp.sx;
    _PUZZLE_CURRENT_DROP_TILE.sy = tmp.sy;

    // Draw the drag tile in the drop spot, and vice versa.
    const ctx2d = CANVAS_2D.getContext('2d');

    let toDrawOnDrop; // imageData that we are going to draw on the tile that we drop on.
    let toDrawOnDrag; // imageData for the tile we dragged from.

    if (_PUZZLE_DRAGGING_TILE === _PUZZLE_CURRENT_DROP_TILE) { // Dropped within the same tile as it was dragged from.
        toDrawOnDrag = _PUZZLE_DRAGGING_IMG; // We dropped on the same tile we dragged from.
        toDrawOnDrop = null; // No need to draw it twice.
    } else {
        const tileSize = getTileSize();
        toDrawOnDrag = ctx2d.getImageData(
            _PUZZLE_CURRENT_DROP_TILE.sx, _PUZZLE_CURRENT_DROP_TILE.sy, tileSize.width, tileSize.height);
        toDrawOnDrop = _PUZZLE_DRAGGING_IMG;
    }

    // Always have to redraw the drag tile.
    if (toDrawOnDrag) {
        ctx2d.putImageData(toDrawOnDrag, _PUZZLE_DRAGGING_TILE.sx, _PUZZLE_DRAGGING_TILE.sy);
    }

    // Have to redraw the drop tile only if it is different than the drag tile.
    if (toDrawOnDrop) {
        ctx2d.drawImage(
            toDrawOnDrop,
            _PUZZLE_CURRENT_DROP_TILE.sx,
            _PUZZLE_CURRENT_DROP_TILE.sy,
            _PUZZLE_TILE_WIDTH,
            _PUZZLE_TILE_HEIGHT
        );
    }

    _PUZZLE_DRAGGING_TILE = null;
    _PUZZLE_CURRENT_DROP_TILE = null;
};

const onPuzzleMousemove = () => {
    if (!CANVAS_2D || !_PUZZLE_DRAGGING_TILE) {
        return; // User has not clicked yet. Mouse movements are tracked after first click.
    }
    const ctx2d = CANVAS_2D.getContext('2d');

    _PUZZLE_CURRENT_DROP_TILE = getCurrentMouseTile();
    
    // Redraw all tiles except the one being dragged
    for (const tile of _PUZZLE_TILES) {
        if (tile === _PUZZLE_DRAGGING_TILE) {
            continue;
        }
        ctx2d.putImageData(tile.imageData, tile.sx, tile.sy);
    }
    
    // Highlight the drop target if hovering over a different tile
    if (_PUZZLE_CURRENT_DROP_TILE && _PUZZLE_CURRENT_DROP_TILE !== _PUZZLE_DRAGGING_TILE) {
        ctx2d.save();
        ctx2d.globalAlpha = 0.4;
        ctx2d.fillStyle = _PUZZLE_HOVER_TINT;
        ctx2d.fillRect(
            _PUZZLE_CURRENT_DROP_TILE.sx,
            _PUZZLE_CURRENT_DROP_TILE.sy,
            _PUZZLE_TILE_WIDTH,
            _PUZZLE_TILE_HEIGHT
        );
        ctx2d.restore();
    }
    
    // Draw the dragged tile following the mouse
    ctx2d.save();
    ctx2d.globalAlpha = 0.6;
    ctx2d.drawImage(
        _PUZZLE_DRAGGING_IMG,
        _CANVAS_2D_MOUSE_LOC.x - _PUZZLE_TILE_WIDTH / 2,
        _CANVAS_2D_MOUSE_LOC.y - _PUZZLE_TILE_HEIGHT / 2,
        _PUZZLE_TILE_WIDTH,
        _PUZZLE_TILE_HEIGHT
    );
    ctx2d.restore();
};

const removeCanvas2dListeners = () => {
    if (!CANVAS_2D) {
        return;
    }
    if (_CANVAS_2D_MOUSEDOWN) {
        CANVAS_2D.removeEventListener('pointerdown', _CANVAS_2D_MOUSEDOWN);
        _CANVAS_2D_MOUSEDOWN = null;
    }
    if (_CANVAS_2D_MOUSEMOVE) {
        CANVAS_2D.removeEventListener('mousemove', _CANVAS_2D_MOUSEMOVE);
        _CANVAS_2D_MOUSEMOVE = null;
    }
    if (_CANVAS_2D_MOUSEUP) {
        CANVAS_2D.removeEventListener('pointerup', _CANVAS_2D_MOUSEUP);
        _CANVAS_2D_MOUSEUP = null;
    }
    
    // Clean up direct event handlers
    CANVAS_2D.onpointerdown = null;
    CANVAS_2D.onpointermove = null;
    CANVAS_2D.onpointerup = null;
};

const onPuzzleClick = () => {
    _PUZZLE_DRAGGING_TILE = getCurrentMouseTile();
    _PUZZLE_CURRENT_DROP_TILE = _PUZZLE_DRAGGING_TILE; // Always same on initial click.
    pasteToDraggingImage(); // Paste clicked tile to draggable canvas.

    const ctx2d = CANVAS_2D.getContext('2d');
    if (_PUZZLE_DRAGGING_TILE) {
        ctx2d.clearRect(
            _PUZZLE_DRAGGING_TILE.sx,
            _PUZZLE_DRAGGING_TILE.sy,
            _PUZZLE_TILE_WIDTH,
            _PUZZLE_TILE_HEIGHT,
        );
        ctx2d.save();
        ctx2d.globalAlpha = 0.9;
        ctx2d.drawImage(
            _PUZZLE_DRAGGING_IMG,
            _CANVAS_2D_MOUSE_LOC.x - _PUZZLE_TILE_WIDTH / 2,
            _CANVAS_2D_MOUSE_LOC.y - _PUZZLE_TILE_HEIGHT / 2,
            _PUZZLE_TILE_WIDTH,
            _PUZZLE_TILE_HEIGHT,
        );
        ctx2d.restore();
        CANVAS_2D.onpointermove = onPuzzleMousemove;
        CANVAS_2D.onpointerup = onDropTile;
    }
};

const updatePuzzleLogic = async (forceState = undefined) => {
    const mod = MODS.puzzle;
    const active = updateMod(mod, forceState);

    removeCanvas2dListeners();
    clearCanvas2d();

    if (!active) {
        return;
    }

    if (!GOOGLE_STREETVIEW) {
        console.warn('Puzzle: GOOGLE_STREETVIEW not available');
        return;
    }

    const nRows = getOption(mod, 'nRows');
    const nCols = getOption(mod, 'nCols');

    const makePuzzle = async () => {
        try {
            await drawCanvas2d();
        } catch (err) {
            console.error('Puzzle: Error creating puzzle:', err);
            return;
        }
        const scattered = scatterCanvas2d(nRows, nCols);
        if (!scattered) {
            return;
        }
        _PUZZLE_TILES = scattered.tiles;
        _PUZZLE_TILE_WIDTH = scattered.tileWidth;
        _PUZZLE_TILE_HEIGHT = scattered.tileHeight;
    };

    await makePuzzle();

    if (!CANVAS_2D) {
        console.error(`Puzzle: Canvas is not loaded yet. Can't initiate puzzle.`);
        updateMod(mod, false);
        return;
    }

    CANVAS_2D.onpointerdown = onPuzzleClick;
};

const updatePuzzle = (forceState = undefined) => {
    // Convert to sync wrapper since we need async inside but the mod system expects sync
    waitForMapsReady(() => {
        updatePuzzleLogic(forceState);
    });
};
