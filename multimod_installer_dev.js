// ==UserScript==
// @name         Tpebop's Geoguessr MultiMod V1 (Dev - Modular)
// @description  Various mods to make the game interesting in various ways (Auto-updating Dev Branch)
// @version      1.0
// @author       tpebop
// @match        *://*.geoguessr.com/*
// @icon         https://www.google.com/s2/favicons?domain=geoguessr.com
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        GM.xmlHttpRequest
// @updateURL    https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/multimod_installer_dev.js
// @downloadURL  https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/multimod_installer_dev.js
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

console.log(`Tpebop's mods loaded (dev branch - modular version).`);
