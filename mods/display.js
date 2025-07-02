// ==UserScript==
// @name         GG Mod Display
// @description  Display options mod for GeoGuessr
// @version      1.0
// @author       tpebop

// ==/UserScript==

// MOD: Display options.
// ===============================================================================================================================

const _updateTidy = (mod) => {
    const showTidy = getOption(mod, 'tidy');

    const toToggle = [
        getGameControlsDiv(),
        getZoomControlsDiv(),
        getGameStatusDiv(),
        getGameReactionsDiv(),
        getAllGmnoPrints(),
        getAllGoogleMapsHotlinks(),
        getGuessButton(),
    ];
    for (const searchResult of toToggle) {
        if (!searchResult) { // Not found at all.
            continue;
        }
        if (searchResult.length !== null && searchResult.length === 0) { // querySelectorAll returned empty.
            continue;
        }
        const divs = searchResult.length ? searchResult : [searchResult]; // Node or NodeList.
        for (const div of divs) {
            if (showTidy) {
                if (div.classList.toString().includes('sv-links-control')) { // Don't hide the moving arrows.
                    continue;
                }
                div.classList.add('hidden');
            } else {
                div.classList.remove('hidden');
            }
        }
    };
};

const _BASE_COLOR_FILTER = Object.freeze({ // Available filter options for big map. Copy and update this Object to make new modes.
    blur: undefined,
    brightness: undefined,
    contrast: undefined,
    saturate: undefined,
    grayscale: undefined,
    sepia: undefined,
    'hue-rotate': undefined,
    invert: undefined,
    opacity: undefined,
    'drop-shadow': undefined,
});

const _COLOR_FILTERS = {
    grayscale: {
        grayscale: '100%',
    },
    'black and white': { // TODO: does this need to be configurable based on the image?
        grayscale: '100%',
        contrast: '1000%',
        brightness: '70%',
    },
    deuteranopia: {
        'hue-rotate': '-20deg',
        saturate: '60%',
        contrast: '120%',
        sepia: '12%',
        brightness: '105%',
    },
    tritanopia: {
        'hue-rotate': '35deg',
        saturate: '50%',
        contrast: '135%',
        sepia: '20%',
        brightness: '115%',
    },
    dog: {
        'hue-rotate': '62deg',
        saturate: '38%',
        contrast: '88%',
        sepia: '22%',
        brightness: '94%',
        blur: '0.5px',
    },
    cat: {
        'hue-rotate': '50deg',
        saturate: '25%',
        contrast: '75%',
        sepia: '22%',
        brightness: '150%',
        sepia: '15%',
        blur: '0.3px',
    },
    'sea lion': {
        'hue-rotate': '200deg',
        saturate: '10%',
        contrast: '115%',
        sepia: '40%',
        brightness: '80%',
        blur: '1px',
    },
    ant: {
        'hue-rotate': '-40deg',
        saturate: '250%',
        contrast: '180%',
        brightness: '130%',
        blur: '0.8px',
        invert: '20%',
    },
    octopus: {
        saturate: '0%',
        contrast: '250%',
        brightness: '85%',
        blur: '0.1px',
        'drop-shadow': '0 0 3px rgba(255,255,255,0.4)',
    },
};

/**
Most of the formatting here can be done with pure CSS on the canvas,
but for some modes it needs to be an overlay div that modifies the contents under it.
*/
const removeColorOverlay = () => {
    const colorOverlay = document.getElementById('gg-color-overlay');
    if (colorOverlay) {
        colorOverlay.parentElement.removeChild(colorOverlay);
    }
};

const makeColorOverlay = () => {
    removeColorOverlay();

    const bigMapContainer = getBigMapContainer();
    if (!bigMapContainer) {
        return;
    }

    const container = document.createElement('div');
    container.id = 'gg-color-overlay';

    const colorOverlay = document.createElement('div');
    colorOverlay.id = 'gg-color-overlay';

    bigMapContainer.parentElement.insertBefore(colorOverlay, bigMapContainer.parentElement.firstChild);
};

const getFilterStr = (mod) => { // Get string that can be applied to streetview canvas filters.
    const activeFilter = Object.assign({}, _BASE_COLOR_FILTER); // The actual styling that will be applied to the canvas.
    const activeColorMode = getOption(mod, 'colorMode');
    const enabledFilter = _COLOR_FILTERS[activeColorMode] || {};
    if (activeColorMode) {
        Object.assign(activeFilter, enabledFilter);
    }
    /**
      If blur is defined and not 0, apply it on top of the other visual mods, even if they have blur defined.
      Might want to revisit this logic later. For now, the other ones don't implement blur. Maybe set to -1 or something.
    */
    const blurNumber = getOption(mod, 'blur');
    if (blurNumber > 0) {
        activeFilter.blur = `${blurNumber}px`;
    }
    let filterStr = '';
    for (const [key, value] of Object.entries(activeFilter)) {
        if (value == null) {
            continue;
        }
        filterStr += `${key}(${value}) `; // Requires units in value.
    }
    filterStr = filterStr.trim();
    return filterStr;
};

const updateDisplayOptions = (forceState = null) => {
    const mod = MODS.displayOptions;
    const active = updateMod(mod, forceState);

    _updateTidy(mod);

    let filterStr = '';
    let transformStr = '';
    
    if (active) {
        makeColorOverlay(); // TODO: depends on mode.
        filterStr = getFilterStr(mod);
        
        // Handle flip transforms
        const flipVertical = getOption(mod, 'flipVertical');
        const flipHorizontal = getOption(mod, 'flipHorizontal');
        
        const transforms = [];
        if (flipVertical) {
            transforms.push('scaleY(-1)');
        }
        if (flipHorizontal) {
            transforms.push('scaleX(-1)');
        }
        
        if (transforms.length > 0) {
            transformStr = transforms.join(' ');
        }
    } else {
        // When mod is disabled, clear overlays
        removeColorOverlay();
    }
    
    const canvas3d = getBigMapCanvas();
    if (canvas3d) {
        canvas3d.style.filter = filterStr;
        canvas3d.style.transform = transformStr;
    }
};
