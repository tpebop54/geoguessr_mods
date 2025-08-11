// ==UserScript==
// @author       tpebop

// ==/UserScript==

// MOD: Bop It.
// ===============================================================================================================================

const bopItListener = async (evt) => {
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

const updateBopIt = (forceState = undefined) => {
    const mod = MODS.bopIt;
    const active = updateMod(mod, forceState);

    const getBopIt = () => {
        const actual = getActualLoc();
        const heading = getHeading(GG_CLICK, actual);
        const direction = getCardinalDirection(heading, 1);
        const score = getScore();
        const bopThreshold = Number(getOption(mod, 'threshold'));

        const controls = {
            twist: 'Twist It!', // Top left (NW).
            flick: 'Flick It!', // Top right (NE).
            spin: 'Spin It!', // Bottom right (SE).
            pull: 'Pull It!', // Bottom left (SW).
            bop: 'Bop It!', // User has clicked within the configured score zone.
        };

        let label;

        if (score >= bopThreshold) {
            label = controls.bop;
        } else {
            switch (direction) {
                case 'N':
                    label = direction < 22.5 ? controls.flick : controls.twist;
                    break;
                case 'NE':
                    label = controls.flick;
                    break;
                case 'E':
                    label = direction < 90 ? controls.flick : controls.spin;
                    break;
                case 'SE':
                    label = controls.spin;
                    break;
                case 'S':
                    label = direction < 180 ? controls.spin : controls.pull;
                    break;
                case 'SW':
                    label = controls.pull;
                    break;
                case 'W':
                    label = direction < 270 ? controls.pull : controls.twist;
                    break;
                case 'NW':
                    label = controls.twist;
                    break;
                default:
                    console.error(`Failed to get direction for heading ${heading} direction ${direction}`);
                    label = 'Error';
                    break;
            }
        }
        return label;
    };

    if (active) {
        disableConflictingMods(mod);
        SCORE_FUNC = getBopIt;
        mapClickListener(bopItListener, true);
    } else {
        mapClickListener(bopItListener, false);
        if (SCORE_FUNC === getBopIt) {
            SCORE_FUNC = undefined;
        }
    }
};
