// ==UserScript==
// @author       tpebop

// ==/UserScript==

// MOD: Satellite view.
// ===============================================================================================================================

const updateSatView = (forceState = null) => {
    const mod = MODS.satView;
    const active = updateMod(mod, forceState);

    waitForMapsReady(() => {
        GOOGLE_MAP.setMapTypeId(active ? 'satellite' : 'roadmap');
    }), {
        timeout: 5000,
        interval: 100,
    };
};
