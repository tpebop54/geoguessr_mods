// ==UserScript==
// @name         Tpebop's GeoGuessr Mods (1.2.2)
// @description  Various mods to make the game interesting in various ways
// @version      1.2.2
// @author       tpebop
// @match        *://*.geoguessr.com/*
// @icon         https://www.google.com/s2/favicons?domain=geoguessr.com
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        GM.xmlHttpRequest
// @updateURL    https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/master/installer_main.js
// @downloadURL  https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/master/installer_main.js

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/master/core/_version.js?v=1.2.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/master/core/evt_framework.js?v=1.2.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/master/core/quotes.js?v=1.2.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/master/core/coordinate_extractor.js?v=1.2.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/master/core/debug_utils.js?v=1.2.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/master/core/dom_utils.js?v=1.2.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/master/core/mod_config.js?v=1.2.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/master/core/global_state.js?v=1.2.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/master/core/mod_utils.js?v=1.2.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/master/core/google_api.js?v=1.2.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/master/core/styling.js?v=1.2.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/master/core/loading_screen.js?v=1.2.2

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/master/data/lottery/heatmaps/world.js?v=1.2.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/master/data/lottery/heatmaps/europe.js?v=1.2.2

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/master/mods/rotate.js?v=1.2.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/master/mods/score.js?v=1.2.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/master/mods/flashlight.js?v=1.2.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/master/mods/inframe.js?v=1.2.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/master/mods/lottery.js?v=1.2.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/master/mods/tilereveal.js?v=1.2.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/master/mods/funfilters.js?v=1.2.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/master/mods/scratch.js?v=1.2.2

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/master/core/script_bindings.js?v=1.2.2

// ==/UserScript==

// Configuration - see here for detailed setup instructions: https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/master/README.md

let ENABLE_QUOTES = false; // On the loading screen, show random quotes instead of "Loading...".

Object.assign(THE_WINDOW, { ENABLE_QUOTES });
console.log(`Tpebop's mods loaded. (${MOD_VERSION})`);
