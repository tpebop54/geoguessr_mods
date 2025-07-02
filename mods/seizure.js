// ==UserScript==
// @author       tpebop

// ==/UserScript==

// MOD: Seizure.
// ===============================================================================================================================

let SEIZURE_INTERVAL;

const updateSeizure = (forceState = null) => {
    const mod = MODS.seizure;
    const active = updateMod(mod, forceState);

    const bigMap = getBigMapContainer();

    if (!active) {
        if (SEIZURE_INTERVAL) {
            clearInterval(SEIZURE_INTERVAL);
        }
        bigMap.style.setProperty('left', '0px');
        bigMap.style.setProperty('top', '0px');
        return;
    }

    const frequency = getOption(mod, 'frequency');
    const nMilliseconds = 1000 / frequency;
    const nPixels = getOption(mod, 'distance');

    SEIZURE_INTERVAL = setInterval(() => {
        const offsetX = Math.ceil((Math.random() * nPixels));
        const offsetY = Math.ceil((Math.random() * nPixels));
        const hDir = Math.random();
        const vDir = Math.random();
        bigMap.style.setProperty('left', `${hDir < 0.5 ? '-' : ''}${offsetX}px`);
        bigMap.style.setProperty('top', `${vDir < 0.5 ? '-' : ''}${offsetY}px`);
    }, nMilliseconds);
};
