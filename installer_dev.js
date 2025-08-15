// ==UserScript==
// @name         Tpebop's GeoGuessr Mods (DEV 1.2.0)
// @description  Various mods to make the game interesting in various ways
// @version      1.2.0
// @author       tpebop
// @match        *://*.geoguessr.com/*
// @icon         https://www.google.com/s2/favicons?domain=geoguessr.com
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        GM.xmlHttpRequest
// @updateURL    https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/installer_dev.js
// @downloadURL  https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/installer_dev.js

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/_version.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/evt_framework.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/quotes.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/coordinate_extractor.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/debug_utils.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/dom_utils.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/mod_config.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/global_state.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/mod_utils.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/google_api.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/styling.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/loading_screen.js?v=1.2.0

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/data/lottery/heatmaps/world.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/data/lottery/heatmaps/europe.js?v=1.2.0

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/rotate.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/score.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/flashlight.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/inframe.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/lottery.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/tilereveal.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/funfilters.js?v=1.2.0
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/scratch.js?v=1.2.0

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/script_bindings.js?v=1.2.0

// ==/UserScript==

// Configuration - see here for detailed setup instructions: https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/README.md

let ENABLE_QUOTES = false; // On the loading screen, show random quotes instead of "Loading...".

Object.assign(THE_WINDOW, { ENABLE_QUOTES });
console.log(`Tpebop's mods loaded. (DEV ${MOD_VERSION})`);
