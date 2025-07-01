// ==UserScript==
// @name         Tpebop's Geoguessr MultiMod V1
// @description  Various mods to make the game interesting in various ways
// @version      1.0
// @author       tpebop
// @match        *://*.geoguessr.com/*
// @icon         https://www.google.com/s2/favicons?domain=geoguessr.com
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        GM.xmlHttpRequest
// @updateURL    https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/multimod_v1.js
// @downloadURL  https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/multimod_v1.js
// Core system files (in dependency order)
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/evt.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/quotes.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/coordinate_extractor.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/mod_config.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/debug_utils.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/global_state.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/dom_utils.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/mod_utils.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/google_api.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/styling.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/cheat_protection.js

// Individual mods (register UPDATE_CALLBACKS)
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/satellite.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/rotate.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/zoom.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/score.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/flashlight.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/seizure.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/bopit.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/inframe.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/lottery.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/puzzle.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/tilereveal.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/display.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/scratch.js

// Script bindings (must come after mods to access UPDATE_CALLBACKS)
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/script_bindings.js

// ==/UserScript==

/**
  TECHNICAL DEBT
   - Sometimes the click events are being blocked on the button menu, but then it works if you refresh.
   - Tiles remaining thing stays on pages that it shouldn't.
*/

/**
  USER NOTES
    - Sadly, you have to disable ad blockers for this to work. I tried so hard to allow them, but it blocks stuff at a level that I can't undo with TamperMonkey. Sorry.
    - When loading, you may occasionally have to refresh the page once or twice.
    - You can disable the quotes if you want via the SHOW_QUOTES variable. Blackout screen is non-negotiable, it's needed to make sure everything loads.
    - If things go super bad, press "Alt Shift ." (period is actually a > with Shift active). This will disable all mods and refresh the page.
    - If you want to toggle a mod, change 'show' to true or false for it in MODS.
    - Opera browser compatibility: Due to WebGL limitations, Opera uses raster map rendering instead of vector rendering. Therefore, certain mods might be disabled in Opera.
*/

/**
  DEV NOTES
    - Shout-out to miraclewhips for geoguessr-event-framework and some essential functions in this script.
    - Keep same configuration for all mods. Must add to _BINDINGS at the bottom of the file for any new mods.
    - MODS is a global variable that the script will modify. The saved state will override certain parts of it on each page load.
    - Past that, you're on your own. Use this for good.
*/

console.log(`Tpebop's mods loaded (modular version).`);
