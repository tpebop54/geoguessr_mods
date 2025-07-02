// ==UserScript==
// @name         Tpebop's Geoguessr Mods (DEV)
// @description  Various mods to make the game interesting in various ways (Auto-updating Dev Branch)
// @version      0.9.3
// @author       tpebop
// @match        *://*.geoguessr.com/*
// @icon         https://www.google.com/s2/favicons?domain=geoguessr.com
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        GM.xmlHttpRequest
// @updateURL    https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/multimod_installer_dev.js
// @downloadURL  https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/multimod_installer_dev.js

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/_version.js?v=1.4
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/evt_framework.js?v=1.4
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/quotes.js?v=1.4
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/coordinate_extractor.js?v=1.4
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/debug_utils.js?v=1.4
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/dom_utils.js?v=1.4
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/mod_config.js?v=1.4
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/global_state.js?v=1.4
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/mod_utils.js?v=1.4
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/google_api.js?v=1.4
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/styling.js?v=1.4
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/cheat_protection.js?v=1.4

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/satellite.js?v=1.4
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/rotate.js?v=1.4
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/zoom.js?v=1.4
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/score.js?v=1.4
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/flashlight.js?v=1.4
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/seizure.js?v=1.4
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/bopit.js?v=1.4
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/inframe.js?v=1.4
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/lottery.js?v=1.4
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/puzzle.js?v=1.4
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/tilereveal.js?v=1.4
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/display.js?v=1.4
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/mods/scratch.js?v=1.4

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/dev/core/script_bindings.js?v=1.4

// ==/UserScript==

// Configure which quote categories to show during loading screens
if (typeof window.SHOW_QUOTES === 'undefined') {
    window.SHOW_QUOTES = {
        inspirational: true,  // Motivational and inspirational quotes
        heavy: true,          // Thought provoking stuff, nothing morbid
        media: true,          // Quotes from movies, TV shows, celebrities - generally light-hearted
        jokes: true,          // Dad jokes and puns
        funFacts: true,       // Interesting facts
        tongueTwisters: true, // See if you can say them...
        questions: true,      // Mostly silly questions, some real ones
    };
}

console.log(`Tpebop's mods loaded (DEV).`);
