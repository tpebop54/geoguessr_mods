// ==UserScript==
// @author       tpebop

// ==/UserScript==

// MOD: Scratch and test work.
// ===============================================================================================================================

const updateScratch = (forceState = null) => {
    const mod = MODS.scratch;
    const active = updateMod(mod, forceState);
    console.log('yo');
};
