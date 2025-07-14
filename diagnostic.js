// Diagnostic script to troubleshoot missing mod menu

// Check if basic elements exist

// Check if mods are loaded

if (typeof MODS !== 'undefined') {
}

// Check if the big map container selectors work
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
});

// Check if script is running in the right context

// Try to manually create mod menu
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
} else {
}

// Function to force reinitialize mods
window.forceReinitializeMods = function() {
    
    // Remove existing mod container if present
    const existing = document.getElementById('gg-mods-container');
    if (existing) {
        existing.remove();
    }
    
    // Try to run addButtons again
    if (typeof addButtons !== 'undefined') {
        const result = addButtons();
    } else {
    }
    
    // Try to rebind buttons
    if (typeof bindButtons !== 'undefined') {
        bindButtons();
    } else {
    }
};

