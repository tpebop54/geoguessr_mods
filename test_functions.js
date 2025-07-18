// Test script to verify all mod functions are loaded
// Paste this into browser console after the userscript loads

console.log('=== Testing Mod Function Availability ===');

const expectedFunctions = [
    'updateSatView',
    'updateRotateMap', 
    'updateZoomInOnly',
    'updateShowScore',
    'updateFlashlight',
    'updateBopIt',
    'updateInFrame',
    'updateLottery',
    'updatePuzzle',
    'updateTileReveal',
    'updateDisplayOptions',
    'updateScratch'
];

let allFunctionsFound = true;

expectedFunctions.forEach(funcName => {
    const exists = typeof window[funcName] === 'function';
    console.log(`${funcName}: ${exists ? '✓' : '✗'}`);
    if (!exists) {
        allFunctionsFound = false;
    }
});

console.log(`\nAll functions available: ${allFunctionsFound ? '✓' : '✗'}`);

if (allFunctionsFound) {
    console.log('All mod functions are loaded correctly!');
} else {
    console.log('Some mod functions are missing. Check @require lines in installer.');
}

// Also test if MODS object is available
console.log(`\nMODS object available: ${typeof MODS !== 'undefined' ? '✓' : '✗'}`);
if (typeof MODS !== 'undefined') {
    console.log('Available mods:', Object.keys(MODS));
}

console.log('=== Test Complete ===');
