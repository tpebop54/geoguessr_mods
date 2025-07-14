// ==UserScript==
// @name         Tpebop's GeoGuessr Mods
// @description  Various mods to make the game interesting in various ways
// @version      1.0.8
// @author       tpebop
// @match        *://*.geoguessr.com/*
// @icon         https://www.google.com/s2/favicons?domain=geoguessr.com
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        GM.xmlHttpRequest
// @updateURL    https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/installer.js
// @downloadURL  https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/installer.js

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/_version.js?v=1.0.8
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/evt_framework.js?v=1.0.8
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/location_tracker.js?v=1.0.8
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/quotes.js?v=1.0.8
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/coordinate_extractor.js?v=1.0.8
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/debug_utils.js?v=1.0.8
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/dom_utils.js?v=1.0.8
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/mod_config.js?v=1.0.8
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/global_state.js?v=1.0.8
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/mod_utils.js?v=1.0.8
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/google_api.js?v=1.0.8
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/styling.js?v=1.0.8
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/cheat_protection.js?v=1.0.8

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/satellite.js?v=1.0.8
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/rotate.js?v=1.0.8
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/zoom.js?v=1.0.8
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/score.js?v=1.0.8
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/flashlight.js?v=1.0.8
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/seizure.js?v=1.0.8
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/bopit.js?v=1.0.8
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/inframe.js?v=1.0.8
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/lottery.js?v=1.0.8
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/puzzle.js?v=1.0.8
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/tilereveal.js?v=1.0.8
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/display.js?v=1.0.8
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/scratch.js?v=1.0.8

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/script_bindings.js?v=1.0.8

// ==/UserScript==

/* LOADING SCREEN CONFIGURATION ===================================================================================
 * 
 * ENABLE_QUOTES: Set to true to show random quotes/facts during loading screens, or false for simple "Loading..." text
 * SHOW_QUOTES: Configure which categories of quotes to show (only applies if ENABLE_QUOTES is true)
 * 
 * Categories available:
 * - inspirational: Motivational and life quotes
 * - heavy: Thought-provoking philosophical quotes
 * - media: Fun quotes from movies, TV, and celebrities
 * - jokes: Dad jokes and puns
 * - funFacts: Interesting facts about the world
 * - tongueTwisters: Try to say these fast!
 * - questions: Conversation starters and silly questions
 */

// Configure loading screen quotes system
if (typeof window.ENABLE_QUOTES === 'undefined') {
    window.ENABLE_QUOTES = false; // Set to false to disable quotes and show simple "Loading..." message
}

// Configure which quote categories to show during loading screens (only applies if ENABLE_QUOTES is true)
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

/* GOOGLE MAPS API KEY CONFIGURATION (OPTIONAL) ==================================================================
 * 
 * This is OPTIONAL. Some mods use it but most do not. Any that use it will be automatically disabled if you don't have a key.
 * Using this mod pack is very unlikely to hit your limits for free usage, but you should still monitor your usage (instructions below).
 *
 * HOW TO GET A GOOGLE MAPS API KEY:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project or select an existing one
 * 3. Enable the following APIs (in "APIs & Services" → "Library"):
 *    - Maps JavaScript API
 *    - Street View Static API
 * 4. Go to "APIs & Services" → "Credentials" → "Create Credentials" → "API key"
 * 5. Copy your API key and paste it below between the quotes
 * 6. RECOMMENDED: Click "Restrict Key" and add these restrictions:
 *    - Application restrictions: HTTP referrers
 *    - Add referrer: *.geoguessr.com/*
 *    - API restrictions: Select the APIs you enabled above
 * 
 * SECURITY NOTES:
 * - Keep your API key private! Don't share your userscript file with others if it contains your key.
 * - Consider setting up billing alerts in Google Cloud Console to monitor usage.
 * - The free tier includes generous limits that should be sufficient for personal use. Specifically, 10,000 requests per month for the Maps JavaScript API.
 */

let GOOGLE_MAPS_API_KEY = ''; // Replace with your Google Maps API key (optional)

/** GLOBAL KEYBINDINGS ADDED BY THIS MOD =============================================================================
 * 
 * - `Alt Shift >` - Reset all mods to default state. If you get in a pickle, either disable the mod via TamperMonkey or use this shortcut.
 * - `Ctrl [` : Open actual location in Google Maps (standard view). Requires Google Maps API key and lottery mod with "Only Land" or "Only Street View" enabled.
 * - `Ctrl ]` : Open aerial view (if "Only Land") or Street View (if "Only Street View" or both enabled). Requires Google Maps API key and lottery mod.
 */

if (typeof window !== 'undefined') {
    window.GOOGLE_MAPS_API_KEY = GOOGLE_MAPS_API_KEY; // Make API key globally available
}

console.log(`Tpebop's mods loaded.`);