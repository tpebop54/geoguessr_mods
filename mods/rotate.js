// ==UserScript==
// @author       tpebop

// ==/UserScript==

// MOD: Rotating guessmap.
// ===============================================================================================================================

const setHeading = (nDegrees) => {
    if (!GOOGLE_MAP) {
        console.warn('Rotate map: GOOGLE_MAP not available');
        return;
    }
    try {
        const heading = ((nDegrees % 360) + 360) % 360;
        GOOGLE_MAP.setHeading(heading);
    } catch (err) {
        console.error('Rotate map: Error setting heading:', err);
    }
};

const doRotation = (nDegrees) => {
    if (_IS_DRAGGING_SMALL_MAP) {
        return; // Drag event gets cut by setHeading.
    }
    if (!GOOGLE_MAP) {
        console.warn('Rotate map: GOOGLE_MAP not available for rotation');
        return;
    }
    try {
        setHeading(GOOGLE_MAP.getHeading() + nDegrees);
    } catch (err) {
        console.error('Rotate map: Error during rotation:', err);
    }
};

let ROTATION_INTERVAL;

const updateRotateMapLogic = (forceState = undefined) => {
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
        console.debug('Rotate map: Started with', startDegrees, 'degrees initial rotation');
    } else {
        if (ROTATION_INTERVAL) {
            clearInterval(ROTATION_INTERVAL);
            console.debug('Rotate map: Stopped rotation interval');
        }
    }
};

const updateRotateMap = createMapSafeModUpdate(updateRotateMapLogic, {
    require2D: true,
    require3D: false,
    modName: 'Rotate map',
    timeout: 5000
});
