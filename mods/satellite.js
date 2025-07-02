// ==UserScript==
// @author       tpebop

// ==/UserScript==

// MOD: Satellite view.
// ===============================================================================================================================

const updateSatView = (forceState = null) => {
    const mod = MODS.satView;
    const active = updateMod(mod, forceState);
    GOOGLE_MAP.setMapTypeId(active ? 'satellite' : 'roadmap');
};
