// Diagnostic script to troubleshoot missing mod menu
console.log('🔍 GeoGuessr Mods Diagnostics');

// Check if basic elements exist
console.log('=== DOM Element Check ===');
console.log('getBigMapContainer:', document.querySelector('div[class^="game_canvas__"]'));
console.log('getModDiv:', document.getElementById('gg-mods-container'));
console.log('__next element:', document.querySelector('#__next'));

// Check if mods are loaded
console.log('=== Mods State Check ===');
console.log('MODS object exists:', typeof MODS !== 'undefined');
console.log('_MODS_LOADED:', typeof _MODS_LOADED !== 'undefined' ? _MODS_LOADED : 'undefined');

if (typeof MODS !== 'undefined') {
    console.log('Available mods:', Object.keys(MODS));
    console.log('Mods to show:', Object.values(MODS).filter(mod => mod.show).map(mod => mod.key));
}

// Check if the big map container selectors work
console.log('=== Container Selector Test ===');
const selectors = [
    `div[class^="game_canvas__"]`,
    `#panorama-container`,
    `div[class*="game-layout_panoramaContainer"]`,
    `div[class*="game_panoramaContainer"]`,
    `div[class*="panorama"]`,
    `.game-layout__panorama-container`,
    `[data-qa="panorama"]`,
];

selectors.forEach(selector => {
    const element = document.querySelector(selector);
    console.log(`${selector}:`, element ? 'FOUND' : 'NOT FOUND');
});

// Check if script is running in the right context
console.log('=== Context Check ===');
console.log('Current URL:', window.location.href);
console.log('Current pathname:', window.location.pathname);
console.log('Is GeoGuessr game page:', window.location.hostname.includes('geoguessr.com'));

// Try to manually create mod menu
console.log('=== Manual Menu Creation Test ===');
const testContainer = document.querySelector('div[class^="game_canvas__"]') || document.body;
if (testContainer) {
    const testDiv = document.createElement('div');
    testDiv.id = 'gg-mods-diagnostic';
    testDiv.style.cssText = `
        position: fixed !important;
        top: 10px !important;
        right: 10px !important;
        background: red !important;
        color: white !important;
        padding: 10px !important;
        z-index: 9999 !important;
        font-size: 12px !important;
    `;
    testDiv.textContent = 'DIAGNOSTIC: Mods system active';
    testContainer.appendChild(testDiv);
    console.log('✅ Successfully created diagnostic element');
} else {
    console.log('❌ Could not find container for diagnostic element');
}

// Function to force reinitialize mods
window.forceReinitializeMods = function() {
    console.log('🔄 Forcing mods reinitialization...');
    
    // Remove existing mod container if present
    const existing = document.getElementById('gg-mods-container');
    if (existing) {
        existing.remove();
        console.log('Removed existing mod container');
    }
    
    // Try to run addButtons again
    if (typeof addButtons !== 'undefined') {
        const result = addButtons();
        console.log('addButtons result:', result);
    } else {
        console.log('addButtons function not available');
    }
    
    // Try to rebind buttons
    if (typeof bindButtons !== 'undefined') {
        bindButtons();
        console.log('Attempted to rebind buttons');
    } else {
        console.log('bindButtons function not available');
    }
};

console.log('🔍 Diagnostics complete. Run forceReinitializeMods() to try manual fix.');
