// ==UserScript==
// @author       tpebop

// ==/UserScript==

// MOD: Show Score.
// ===============================================================================================================================

// Unique score listener for showScore mod to avoid conflicts
const showScoreListener = async (evt) => {
    console.debug('showScoreListener triggered - mod should be active');
    
    let scoreString;
    if (SCORE_FUNC) {
        const result = SCORE_FUNC(evt);
        // Handle both sync and async score functions
        if (result && typeof result.then === 'function') {
            scoreString = String(await result);
        } else {
            scoreString = String(result);
        }
    } else {
        scoreString = String(getScore());
    }

    let fadeTarget = document.getElementById('gg-score-div');
    if (!fadeTarget) {
        fadeTarget = document.createElement('div');
        fadeTarget.id = 'gg-score-div';
        document.body.appendChild(fadeTarget);
    }

    fadeTarget.innerHTML = scoreString;
    fadeTarget.style.opacity = 1

    let fadeEffect;
    fadeEffect = setInterval(() => {
        if (fadeTarget.style.opacity > 0) {
            fadeTarget.style.opacity = parseFloat(fadeTarget.style.opacity) - 0.05;
        } else {
            clearInterval(fadeEffect);
        }
    }, 50);
};

const updateShowScore = (forceState = undefined) => {
    const mod = MODS.showScore;
    const active = updateMod(mod, forceState);
    
    console.debug(`updateShowScore called: active=${active}, forceState=${forceState}`);

    if (active) {
        console.debug('Enabling show score mod');
        disableConflictingMods(mod);
        SCORE_FUNC = getScore;
        mapClickListener(showScoreListener, true);
    } else {
        console.debug('Disabling show score mod');
        mapClickListener(showScoreListener, false);
        
        // Clean up the score display div when disabling
        const scoreDiv = document.getElementById('gg-score-div');
        if (scoreDiv) {
            scoreDiv.remove();
            console.debug('Removed score display div');
        }
        
        // Clear the global score function if this mod was using it
        if (SCORE_FUNC === getScore) {
            SCORE_FUNC = undefined;
        }
        console.debug('Cleared SCORE_FUNC');
    }
};
