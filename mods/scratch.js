// ==UserScript==
// @name         GG Mod Scratch
// @description  Scratch/test mod for GeoGuessr
// @version      1.0
// @author       tpebop

// ==/UserScript==

// MOD: Scratch and test work.
// ===============================================================================================================================

const updateScratch = (forceState = null) => {
    const mod = MODS.scratch;
    const active = updateMod(mod, forceState);
};
