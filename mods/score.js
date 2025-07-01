// ==UserScript==
// @name         GG Mod Score
// @description  Score display mod for GeoGuessr
// @version      1.0
// @author       tpebop

// ==/UserScript==

// MOD: Show Score.
// ===============================================================================================================================

const updateShowScore = (forceState = null) => {
    const mod = MODS.showScore;
    const active = updateMod(mod, forceState);

    if (active) {
        disableOtherScoreMods(mod);
        SCORE_FUNC = getScore;
        mapClickListener(scoreListener, true);
    } else {
        disableOtherScoreMods();
        mapClickListener(scoreListener, false);
    }
};
