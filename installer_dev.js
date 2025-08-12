// ==UserScript==
// @name         Tpebop's GeoGuessr Mods (DEV 5.0.0)
// @description  Various mods to make the game interesting in various ways
// @version      5.0.0
// @author       tpebop
// @match        *://*.geoguessr.com/*
// @icon         https://www.google.com/s2/favicons?domain=geoguessr.com
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        GM.xmlHttpRequest
// @updateURL    https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/installer_dev.js
// @downloadURL  https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/installer_dev.js

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/_version.js?v=5.0.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/evt_framework.js?v=5.0.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/quotes.js?v=5.0.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/coordinate_extractor.js?v=5.0.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/debug_utils.js?v=5.0.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/dom_utils.js?v=5.0.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/mod_config.js?v=5.0.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/global_state.js?v=5.0.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/mod_utils.js?v=5.0.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/google_api.js?v=5.0.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/styling.js?v=5.0.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/loading_screen.js?v=5.0.0

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/rotate.js?v=5.0.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/zoom.js?v=5.0.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/score.js?v=5.0.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/flashlight.js?v=5.0.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/bopit.js?v=5.0.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/inframe.js?v=5.0.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/lottery.js?v=5.0.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/puzzle.js?v=5.0.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/tilereveal.js?v=5.0.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/funfilters.js?v=5.0.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/scratch.js?v=5.0.0

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/script_bindings.js?v=5.0.0

// ==/UserScript==

// Configuration - see here for detailed setup instructions: https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/README.md

let GOOGLE_MAPS_API_KEY = ''; // Optional: Add your Google Maps API key here for enhanced features. See README.md for details.
let ENABLE_QUOTES = false; // On the loading screen, show random quotes instead of "Loading...".

Object.assign(THE_WINDOW, { GOOGLE_MAPS_API_KEY, ENABLE_QUOTES });
console.log(`Tpebop's mods loaded. (DEV ${MOD_VERSION})`);
