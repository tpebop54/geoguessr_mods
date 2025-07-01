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
// Core system files
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/gg_evt.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/gg_quotes.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/gg_coordinate_extractor.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/gg_mod_config.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/gg_debug_utils.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/gg_global_state.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/gg_dom_utils.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/gg_mod_utils.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/gg_script_bindings.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/gg_cheat_protection.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/gg_google_api.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/gg_styling.js

// Individual mods
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/gg_mod_satellite.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/gg_mod_rotate.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/gg_mod_zoom.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/gg_mod_score.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/gg_mod_flashlight.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/gg_mod_seizure.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/gg_mod_bopit.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/gg_mod_inframe.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/gg_mod_lottery.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/gg_mod_puzzle.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/gg_mod_tilereveal.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/gg_mod_display.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/gg_mod_scratch.js

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
