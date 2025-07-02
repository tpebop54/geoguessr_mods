// ==UserScript==
// @author       tpebop

// ==/UserScript==

// MOD: In frame or not.
// ===============================================================================================================================

/*
This is a pretty expensive function, but it's easier than triggering it based on dragstart, zoomend, etc. Deal with it.
*/
let IN_FRAME_INTERVAL;

const updateInFrame = (forceState = null) => {
    const mod = MODS.inFrame;
    const active = updateMod(mod, forceState);

    const actual = getActualLoc();
    const smallMapContainer = getSmallMapContainer();

    if (IN_FRAME_INTERVAL) {
        clearInterval(IN_FRAME_INTERVAL);
    }

    if (active) {
        const showInFrame = () => {
            const currentBounds = getMapBounds();
            const inFrame = isInBounds(actual, currentBounds);
            const color = inFrame ? 'green' : 'red';

            const smallMapStyle = {
                'box-shadow': `0 0 10px 10px ${color}`,
                'border-radius': '10px',
            };
            Object.assign(smallMapContainer.style, smallMapStyle);
        };
        IN_FRAME_INTERVAL = setInterval(showInFrame, 100);
    } else {
        const smallMapStyle = {
            'box-shadow': '',
            'border-radius': '',
        };
        Object.assign(smallMapContainer.style, smallMapStyle);
    }
};
