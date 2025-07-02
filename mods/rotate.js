// ==UserScript==
// @author       tpebop

// ==/UserScript==

// MOD: Rotating guessmap.
// ===============================================================================================================================

const setHeading = (nDegrees) => {
    const heading = ((nDegrees % 360) + 360) % 360;
    GOOGLE_MAP.setHeading(heading);
};

const doRotation = (nDegrees) => {
    if (_IS_DRAGGING_SMALL_MAP) {
        return; // Drag event gets cut by setHeading.
    }
    setHeading(GOOGLE_MAP.getHeading() + nDegrees);
};

let ROTATION_INTERVAL;

const updateRotateMap = (forceState = null) => {
    const mod = MODS.rotateMap;
    const active = updateMod(mod, forceState);

    if (active) {
        const startRandom = getOption(mod, 'startRandom');
        let startDegrees = Number(getOption(mod, 'startDegrees'));
        if (startRandom) {
            startDegrees = Math.random() * 360;
        }
        if (isNaN(startDegrees)) {
            startDegrees = 0;
        }
        const nMilliseconds = Number(getOption(mod, 'every')) * 1000;
        const nDegrees = Number(getOption(mod, 'degrees'));
        if (isNaN(nMilliseconds) || isNaN(nDegrees) || nMilliseconds < 0) {
            window.alert('Invalid interval or amount.');
            return;
        }
        if (ROTATION_INTERVAL) {
            clearInterval(ROTATION_INTERVAL);
        }
        setHeading(startDegrees); // Set initial rotation and then start interval.
        if (nDegrees && nMilliseconds) {
            ROTATION_INTERVAL = setInterval(() => {
                doRotation(nDegrees);
            }, nMilliseconds);
        }
    } else if (ROTATION_INTERVAL) {
        clearInterval(ROTATION_INTERVAL);
    }
};
