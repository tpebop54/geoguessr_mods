// ==UserScript==
// @name         Tpebop's GeoGuessr Mods 1.2.0
// @description  Various mods to make the game interesting in various ways
// @version      1.2.0
// @author       tpebop
// @match        *://*.geoguessr.com/*
// @icon         https://www.google.com/s2/favicons?domain=geoguessr.com
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        GM.xmlHttpRequest
// @updateURL    https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/installer.js
// @downloadURL  https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/installer.js

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/_version.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/evt_framework.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/location_tracker.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/quotes.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/coordinate_extractor.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/debug_utils.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/dom_utils.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/mod_config.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/global_state.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/mod_utils.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/google_api.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/styling.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/cheat_protection.js?v=1.2.0

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/satellite.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/rotate.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/zoom.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/score.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/flashlight.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/bopit.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/inframe.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/lottery.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/puzzle.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/tilereveal.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/funfilters.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/scratch.js?v=1.2.0

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/script_bindings.js?v=1.2.0

// ==/UserScript==

// Configuration - see README.md for detailed setup instructions
if (typeof THE_WINDOW.ENABLE_QUOTES === 'undefined') {
    THE_WINDOW.ENABLE_QUOTES = false; // Set to true to show random quotes during loading, false for "Loading..."
}

let GOOGLE_MAPS_API_KEY = ''; // Optional: Add your Google Maps API key here for enhanced features. See README.md for details.
let ON_MY_HONOR = ''; // Type 'on my honor' here to disable cheat protection. The mod still works but could get you banned from competitive duels if you cheat.

if (typeof window !== 'undefined') {
    THE_WINDOW.GOOGLE_MAPS_API_KEY = GOOGLE_MAPS_API_KEY;
    THE_WINDOW.ON_MY_HONOR = ON_MY_HONOR;
}

console.log(`Tpebop's mods loaded (${MOD_VERSION}).`);