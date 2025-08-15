// ==UserScript==
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
    'black and white': {
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

    const streetviewContainer = getStreetviewContainer();
    if (!streetviewContainer) {
        return;
    }

    const container = document.createElement('div');
    container.id = 'gg-color-overlay';

    const colorOverlay = document.createElement('div');
    colorOverlay.id = 'gg-color-overlay';

    streetviewContainer.parentElement.insertBefore(colorOverlay, streetviewContainer.parentElement.firstChild);
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

    // For Opera, use more performance-friendly filters
    if (IS_OPERA) {
        // Limit filters to basic ones that perform better in Opera
        const operaFriendlyFilters = ['blur', 'brightness', 'contrast', 'saturate', 'grayscale'];
        for (const key of Object.keys(activeFilter)) {
            if (!operaFriendlyFilters.includes(key)) {
                delete activeFilter[key];
            }
        }
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

const applyScreenScaling = (percentage) => {
    const streetviewCanvas = getStreetviewCanvas();
    if (!streetviewCanvas) {
        return;
    }

    if (percentage === 100 || !percentage || percentage <= 0) {
        // Reset canvas to original state
        streetviewCanvas.style.width = '';
        streetviewCanvas.style.height = '';
        streetviewCanvas.style.position = '';
        streetviewCanvas.style.top = '';
        streetviewCanvas.style.left = '';
        streetviewCanvas.style.transformOrigin = '';

        // Store that we're not scaling anymore
        streetviewCanvas.dataset.isScaled = 'false';
        streetviewCanvas.dataset.scalePercentage = '100';
    } else {
        const scale = percentage / 100;

        const originalWidth = streetviewCanvas.width || streetviewCanvas.offsetWidth;
        const originalHeight = streetviewCanvas.height || streetviewCanvas.offsetHeight;

        streetviewCanvas.style.transformOrigin = 'center center';

        streetviewCanvas.style.position = 'fixed';
        streetviewCanvas.style.top = '50%';
        streetviewCanvas.style.left = '50%';

        streetviewCanvas.dataset.isScaled = 'true';
        streetviewCanvas.dataset.scalePercentage = percentage.toString();

        if (originalWidth && originalHeight) {
            streetviewCanvas.style.width = `${originalWidth}px`;
            streetviewCanvas.style.height = `${originalHeight}px`;
        }
    }
};

const applyDisplayFilters = (filterStr, transformStr) => {
    const canvas3d = getStreetviewCanvas();
    if (!canvas3d) {
        // Retry after a short delay if canvas is not available
        setTimeout(() => applyDisplayFilters(filterStr, transformStr), 200);
        return;
    }

    // Build the complete transform string combining scaling and flip transforms
    const transforms = [];
    const isScaled = canvas3d.dataset.isScaled === 'true';
    const scalePercentage = parseInt(canvas3d.dataset.scalePercentage) || 100;
    if (isScaled && scalePercentage !== 100) {
        const scale = scalePercentage / 100;
        transforms.push('translate(-50%, -50%)');
        transforms.push(`scale(${scale})`);
    }
    if (transformStr && transformStr.trim()) {
        transforms.push(transformStr);
    }
    const finalTransform = transforms.join(' ');
    canvas3d.style.filter = filterStr;
    canvas3d.style.transform = finalTransform;
};

const updateFunFilters = (forceState = undefined) => {
    const mod = MODS.funFilters;
    const active = updateMod(mod, forceState);

    _updateTidy(mod);

    const satView = getOption(mod, 'satView');
    const mapType = active && satView ? 'satellite' : 'roadmap';
    GOOGLE_MAP.setMapTypeId(mapType);

    let filterStr = '';
    let transformStr = '';

    if (active) {
        makeColorOverlay();
        filterStr = getFilterStr(mod);

        // Handle flip transforms (these go on the canvas, not the container)
        const flipVertical = getOption(mod, 'flipVertical');
        const flipHorizontal = getOption(mod, 'flipHorizontal');
        const streetviewSize = getOption(mod, 'streetviewSize');

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
        applyScreenScaling(streetviewSize);
    } else {
        removeColorOverlay();
        const canvas3d = getStreetviewCanvas();
        if (canvas3d && IS_OPERA) {
            canvas3d.classList.remove('opera-friendly-filter');
        }
        applyScreenScaling(100); // This will reset scaling and dataset attributes
    }

    // Satellite mod is a special case, because the same 2d map object is used during the round end screen.
    // When the score page shows, something is forcing it back to roadmap view, so we need to revert that if satView is enabled.
    runOnInterval(
        () => {
            const mapTypeId = isModActive(mod) && getOption(mod, 'satView') ? 'satellite': 'roadmap';
            GOOGLE_MAP.setMapTypeId(mapTypeId);
        },
        200,
        5000,
    );

    // Apply the filters and transforms (these go on the canvas)
    applyDisplayFilters(filterStr, transformStr);
};
