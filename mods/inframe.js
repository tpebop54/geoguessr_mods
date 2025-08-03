// ==UserScript==
// @author       tpebop

// ==/UserScript==

// MOD: In frame or not.
// ===============================================================================================================================

let IN_FRAME_INTERVAL;

const showInFrame = () => {
    try {
        const smallMapContainer = getSmallMapContainer();
        const actual = getActualLoc();
        if (!GOOGLE_MAP || !smallMapContainer || !actual) {
            return;
        }
        const currentBounds = getMapBounds();
        if (!currentBounds) {
            return;
        }
        const inFrame = isInBounds(actual, currentBounds);
        const color = inFrame ? 'green' : 'red';

        const smallMapStyle = {
            'box-shadow': `0 0 10px 10px ${color}`,
            'border-radius': '10px',
        };
        Object.assign(smallMapContainer.style, smallMapStyle);
    } catch (err) {
        console.error(err);
    }
};

const updateInFrame = (forceState = undefined) => {
    const mod = MODS.inFrame;
    const active = updateMod(mod, forceState);

    if (IN_FRAME_INTERVAL) {
        clearInterval(IN_FRAME_INTERVAL);
        IN_FRAME_INTERVAL = null;
    }

    if (active) {
        IN_FRAME_INTERVAL = setInterval(showInFrame, 100);
    } else {
        const smallMapContainer = getSmallMapContainer();
        if (smallMapContainer) {
            const smallMapStyle = {
                'box-shadow': '',
                'border-radius': '',
            };
            Object.assign(smallMapContainer.style, smallMapStyle);
        }
    }
    
    if (!active || !areModsAvailable()) {
        if (IN_FRAME_INTERVAL) {
            clearInterval(IN_FRAME_INTERVAL);
            IN_FRAME_INTERVAL = null;
        }
        return;
    }
};
