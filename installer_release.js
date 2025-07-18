// ==UserScript==
// @name         Tpebop's GeoGuessr Mods (RELEASE 1.0.1)
// @description  Various mods to make the game interesting in various ways
// @version      1.0.1
// @author       tpebop
// @match        *://*.geoguessr.com/*
// @icon         https://www.google.com/s2/favicons?domain=geoguessr.com
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        GM.xmlHttpRequest
// @updateURL    https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/installer_release.js
// @downloadURL  https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/installer_release.js

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/_version.js?v=1.0.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/evt_framework.js?v=1.0.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/location_tracker.js?v=1.0.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/quotes.js?v=1.0.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/coordinate_extractor.js?v=1.0.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/debug_utils.js?v=1.0.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/dom_utils.js?v=1.0.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/mod_config.js?v=1.0.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/global_state.js?v=1.0.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/mod_utils.js?v=1.0.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/google_api.js?v=1.0.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/styling.js?v=1.0.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/cheat_protection.js?v=1.0.1

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/satellite.js?v=1.0.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/rotate.js?v=1.0.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/zoom.js?v=1.0.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/score.js?v=1.0.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/flashlight.js?v=1.0.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/bopit.js?v=1.0.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/inframe.js?v=1.0.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/lottery.js?v=1.0.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/puzzle.js?v=1.0.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/tilereveal.js?v=1.0.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/display.js?v=1.0.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/scratch.js?v=1.0.1

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/script_bindings.js?v=1.0.1

// ==/UserScript==

// Configuration - see README.md for detailed setup instructions
if (typeof window.ENABLE_QUOTES === 'undefined') {
    window.ENABLE_QUOTES = false; // Set to true to show random quotes during loading, false for "Loading..."
}

let GOOGLE_MAPS_API_KEY = ''; // Optional: Add your Google Maps API key here for enhanced features. See README.md for details.
let ON_MY_HONOR = ''; // Type 'on my honor' here to disable cheat protection. The mod still works but could get you banned from competitive duels if you cheat.

if (typeof window !== 'undefined') {
    window.GOOGLE_MAPS_API_KEY = GOOGLE_MAPS_API_KEY;
    window.ON_MY_HONOR = ON_MY_HONOR;
}

console.log(`Tpebop's mods loaded. (DEV)`);