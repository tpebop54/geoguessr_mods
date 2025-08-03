// ==UserScript==
// @name         Tpebop's GeoGuessr Mods (RELEASE 1.4.18)
// @description  Various mods to make the game interesting in various ways
// @version      1.4.18
// @author       tpebop
// @match        *://*.geoguessr.com/*
// @icon         https://www.google.com/s2/favicons?domain=geoguessr.com
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        GM.xmlHttpRequest
// @updateURL    https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/installer_release.js
// @downloadURL  https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/installer_release.js

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/_version.js?v=1.4.18
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/evt_framework.js?v=1.4.18
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/location_tracker.js?v=1.4.18
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/quotes.js?v=1.4.18
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/coordinate_extractor.js?v=1.4.18
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/debug_utils.js?v=1.4.18
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/dom_utils.js?v=1.4.18
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/mod_config.js?v=1.4.18
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/global_state.js?v=1.4.18
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/mod_utils.js?v=1.4.18
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/google_api.js?v=1.4.18
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/styling.js?v=1.4.18
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/loading_screen.js?v=1.4.18

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/satellite.js?v=1.4.18
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/rotate.js?v=1.4.18
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/zoom.js?v=1.4.18
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/score.js?v=1.4.18
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/flashlight.js?v=1.4.18
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/bopit.js?v=1.4.18
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/inframe.js?v=1.4.18
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/lottery.js?v=1.4.18
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/puzzle.js?v=1.4.18
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/tilereveal.js?v=1.4.18
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/funfilters.js?v=1.4.18
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/scratch.js?v=1.4.18

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/script_bindings.js?v=1.4.18

// ==/UserScript==

// Configuration - see here for detailed setup instructions: https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/README.md

let GOOGLE_MAPS_API_KEY = ''; // Optional: Add your Google Maps API key here for enhanced features. See README.md for details.
let DISABLE_CHEAT_PROTECTION = false; // Set to true if you promise not to use this to cheat in competitive duels. All other modes are fine.
let ENABLE_QUOTES = false; // On the loading screen, show random quotes instead of "Loading...".

Object.assign(THE_WINDOW, { GOOGLE_MAPS_API_KEY, DISABLE_CHEAT_PROTECTION, ENABLE_QUOTES });
console.log(`Tpebop's mods loaded. (RELEASE ${MOD_VERSION})`);
