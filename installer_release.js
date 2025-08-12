// ==UserScript==
// @name         Tpebop's GeoGuessr Mods (RELEASE 7.0.3)
// @description  Various mods to make the game interesting in various ways
// @version      7.0.3
// @author       tpebop
// @match        *://*.geoguessr.com/*
// @icon         https://www.google.com/s2/favicons?domain=geoguessr.com
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        GM.xmlHttpRequest
// @updateURL    https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/installer_release.js
// @downloadURL  https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/installer_release.js

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/_version.js?v=7.0.3
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/evt_framework.js?v=7.0.3
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/quotes.js?v=7.0.3
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/coordinate_extractor.js?v=7.0.3
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/debug_utils.js?v=7.0.3
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/dom_utils.js?v=7.0.3
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/mod_config.js?v=7.0.3
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/global_state.js?v=7.0.3
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/mod_utils.js?v=7.0.3
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/google_api.js?v=7.0.3
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/styling.js?v=7.0.3
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/loading_screen.js?v=7.0.3

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/rotate.js?v=7.0.3
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/zoom.js?v=7.0.3
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/score.js?v=7.0.3
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/flashlight.js?v=7.0.3
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/bopit.js?v=7.0.3
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/inframe.js?v=7.0.3
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/lottery.js?v=7.0.3
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/puzzle.js?v=7.0.3
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/tilereveal.js?v=7.0.3
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/funfilters.js?v=7.0.3
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/mods/scratch.js?v=7.0.3

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/release/core/script_bindings.js?v=7.0.3

// ==/UserScript==

// Configuration - see here for detailed setup instructions: https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/README.md

let GOOGLE_MAPS_API_KEY = ''; // Optional: Add your Google Maps API key here for enhanced features. See README.md for details.
let ENABLE_QUOTES = false; // On the loading screen, show random quotes instead of "Loading...".

Object.assign(THE_WINDOW, { GOOGLE_MAPS_API_KEY, ENABLE_QUOTES });
console.log(`Tpebop's mods loaded. (RELEASE ${MOD_VERSION})`);
