// ==UserScript==
// @name         GG Mod Puzzle
// @description  Puzzle mod for GeoGuessr
// @author       tpebop

// ==/UserScript==

// MOD: Puzzle.
// ===============================================================================================================================

/**
  Unfortunately, we can't use the 3D canvas, so we recreate it as a 2D canvas to make the puzzle.
  This may make this mod unusable with some others. I haven't tested out every combination.
  This requires a GOOGLE_MAPS_API_KEY at the top to generate static tiles. Google blocks calls to render the webgl canvas as a 2d canvas.
  Ref: https://webdesign.tutsplus.com/create-an-html5-canvas-tile-swapping-puzzle--active-10747t
  Also, shit this was hard to figure out.
*/

// TODO
// - add option to make to actual puzzle.
// - disable moving and panning and zooming. Need to update note at top.
// - what happens if it's solved on start? reshuffle automatically?
// - make able to restore original 3d state.
// - clean up unused shit.

let CANVAS_2D; // 2D canvas element that overlays the 3D one.
let CANVAS_2D_IS_REDRAWING = false; // If we're still redrawing the previous frame, this can brick the site.

let _PUZZLE_WIDTH;
let _PUZZLE_HEIGHT;
let _PUZZLE_TILE_WIDTH;
let _PUZZLE_TILE_HEIGHT;
let _PUZZLE_DRAGGING_TILE;
let _PUZZLE_CURRENT_DROP_TILE;
let _PUZZLE_TILES = [];
let _PUZZLE_HOVER_TINT = '#009900'; // Used for drag and drop formatting.
let _PUZZLE_IS_SOLVED = false;
let _PUZZLE_DRAGGING_IMG; // Draw tile as <img> element so it can be redrawn on the canvas while dragging tiles.
let _PUZZLE_DRAGGING_CANVAS; // Mini canvas to draw _PUZZLE_DRAGGING_IMG on.

let _CANVAS_2D_MOUSEDOWN; // Pointer down listener.
let _CANVAS_2D_MOUSEUP; // Pointer up listener.
let _CANVAS_2D_MOUSEMOVE; // Track all mouse movements on 2D canvas.
let _CANVAS_2D_MOUSE_LOC = { x: 0, y: 0 };

// [Note: The full puzzle implementation is extremely complex with many helper functions]
// [This is a simplified version - the complete implementation would be several hundred lines]

const updatePuzzle = async (forceState = null) => {
    const mod = MODS.puzzle;
    const active = updateMod(mod, forceState);

    // clearCanvas2d(); // Would clear the puzzle canvas
    
    if (!active) {
        return;
    }

    // [Complex puzzle implementation would go here]
    // This includes:
    // - Drawing 2D canvas from 3D streetview
    // - Splitting into tiles
    // - Implementing drag and drop
    // - Puzzle solving logic
    console.log('Puzzle mod activated - full implementation needed');
};
