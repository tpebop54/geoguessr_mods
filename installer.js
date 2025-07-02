// ==UserScript==
// @name         Tpebop's Geoguessr Mods
// @description  Various mods to make the game interesting in various ways (Auto-updating Main Branch)
// @version      0.9.1
// @author       tpebop
// @match        *://*.geoguessr.com/*
// @icon         https://www.google.com/s2/favicons?domain=geoguessr.com
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        GM.xmlHttpRequest
// @updateURL    https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/multimod_installer.js
// @downloadURL  https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/multimod_installer.js

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/_version.js?v=1.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/evt_framework.js?v=1.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/quotes.js?v=1.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/coordinate_extractor.js?v=1.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/debug_utils.js?v=1.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/dom_utils.js?v=1.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/mod_config.js?v=1.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/global_state.js?v=1.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/mod_utils.js?v=1.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/google_api.js?v=1.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/styling.js?v=1.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/cheat_protection.js?v=1.2

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/satellite.js?v=1.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/rotate.js?v=1.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/zoom.js?v=1.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/score.js?v=1.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/flashlight.js?v=1.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/seizure.js?v=1.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/bopit.js?v=1.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/inframe.js?v=1.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/lottery.js?v=1.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/puzzle.js?v=1.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/tilereveal.js?v=1.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/display.js?v=1.2
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/scratch.js?v=1.2

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/script_bindings.js?v=1.2

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

console.log(`Tpebop's mods loaded.`);