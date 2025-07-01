// ==UserScript==
// @name         GG Mod Flashlight
// @description  Flashlight effect mod for GeoGuessr
// @version      1.0
// @author       tpebop

// ==/UserScript==

// MOD: Flashlight.
// ===============================================================================================================================

let FLASHLIGHT_MOUSEMOVE;

// ref: https://stackoverflow.com/questions/77333080/flashlight-effect-with-custom-cursor-img
const updateFlashlight = (forceState = null) => {
    const mod = MODS.flashlight;
    const active = updateMod(mod, forceState);

    // Opaque div will cover entire screen. Behavior doesn't work well with covering canvas only.
    const body = document.body;
    let flashlightDiv = document.getElementById('gg-flashlight-div'); // Opaque div.
    let flashlight = document.getElementById('gg-flashlight'); // Flashlight.
    if (flashlightDiv) {
        flashlightDiv.parentElement.removeChild(flashlightDiv);
    }
    if (flashlight) {
        flashlight.parentElement.removeChild(flashlight);
    }
    if (FLASHLIGHT_MOUSEMOVE) {
        body.removeEventListener('mousemove', FLASHLIGHT_MOUSEMOVE);
    }

    if (active) {
        body.style.overflow = 'hidden'; // Seems like the GeoGuessr code is overwriting the custom body CSS, so set it manually.

        flashlightDiv = document.createElement('div');
        flashlightDiv.id = 'gg-flashlight-div';

        flashlight = document.createElement('h1');
        flashlight.id = 'gg-flashlight';
        flashlightDiv.appendChild(flashlight);

        const innerRadius = Number(getOption(mod, 'radius'));
        const blur = Number(getOption(mod, 'blur'));
        const outerRadius = innerRadius + blur;
        flashlightDiv.style.setProperty('--flashlight-radius', `${innerRadius}px`);
        flashlightDiv.style.setProperty('--flashlight-blur', `${outerRadius}px`);

        FLASHLIGHT_MOUSEMOVE = body.addEventListener('mousemove', (evt) => {
            const rect = flashlightDiv.getBoundingClientRect();
            const x = evt.clientX - rect.left;
            const y = evt.clientY - rect.top;
            flashlightDiv.style.setProperty('--flashlight-x-pos', `${x - rect.width / 2}px`);
            flashlightDiv.style.setProperty('--flashlight-y-pos', `${y - rect.height / 2}px`);
        });
        body.insertBefore(flashlightDiv, body.firstChild);
    }
};
