// ==UserScript==
// @author       tpebop

// ==/UserScript==

// MOD: Satellite view.
// ===============================================================================================================================

const updateSatViewLogic = (forceState = null) => {
    const mod = MODS.satView;
    const active = updateMod(mod, forceState);
    
    if (!GOOGLE_MAP) {
        console.warn('Satellite view: GOOGLE_MAP not available');
        return;
    }
    
    try {
        GOOGLE_MAP.setMapTypeId(active ? 'satellite' : 'roadmap');
        console.debug(`Satellite view: Set to ${active ? 'satellite' : 'roadmap'}`);
    } catch (err) {
        console.error('Satellite view: Error setting map type:', err);
    }
};

const updateSatView = createMapSafeModUpdate(updateSatViewLogic, {
    require2D: true,
    require3D: false,
    modName: 'Satellite view',
    timeout: 5000
});
