// ==UserScript==
// @name         Tpebop's Geoguessr MultiMod V1 (Main - Stable)
// @description  Various mods to make the game interesting in various ways (Auto-updating Main Branch)
// @version      1.0
// @author       tpebop
// @match        *://*.geoguessr.com/*
// @icon         https://www.google.com/s2/favicons?domain=geoguessr.com
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        GM.xmlHttpRequest
// @updateURL    https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/multimod_installer.js
// @downloadURL  https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/multimod_installer.js
// Core system files (in dependency order)
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/evt.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/quotes.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/coordinate_extractor.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/mod_config.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/debug_utils.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/global_state.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/dom_utils.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/mod_utils.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/google_api.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/styling.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/cheat_protection.js

// Individual mods (register UPDATE_CALLBACKS)
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/satellite.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/rotate.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/zoom.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/score.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/flashlight.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/seizure.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/bopit.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/inframe.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/lottery.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/puzzle.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/tilereveal.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/display.js
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/scratch.js

// Script bindings (must come after mods to access UPDATE_CALLBACKS)
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/script_bindings.js

// ==/UserScript==

console.log(`Tpebop's mods loaded (main branch - modular version).`);