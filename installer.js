// ==UserScript==
// @name         Tpebop's GeoGuessr Mods
// @description  Various mods to make the game interesting in various ways
// @version      0.9.1
// @author       tpebop
// @match        *://*.geoguessr.com/*
// @icon         https://www.google.com/s2/favicons?domain=geoguessr.com
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        GM.xmlHttpRequest
// @updateURL    https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/installer.js
// @downloadURL  https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/installer.js

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/_version.js?v=0.9.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/evt_framework.js?v=0.9.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/location_tracker.js?v=0.9.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/quotes.js?v=0.9.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/coordinate_extractor.js?v=0.9.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/debug_utils.js?v=0.9.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/dom_utils.js?v=0.9.7
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/mod_config.js?v=0.9.4
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/global_state.js?v=0.9.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/mod_utils.js?v=0.9.6
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/google_api.js?v=0.9.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/styling.js?v=0.9.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/cheat_protection.js?v=0.9.1

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/satellite.js?v=0.9.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/rotate.js?v=0.9.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/zoom.js?v=0.9.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/score.js?v=0.9.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/flashlight.js?v=0.9.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/seizure.js?v=0.9.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/bopit.js?v=0.9.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/inframe.js?v=0.9.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/lottery.js?v=0.9.5
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/puzzle.js?v=0.9.3
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/tilereveal.js?v=0.9.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/display.js?v=0.9.1
// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/mods/scratch.js?v=0.9.1

// @require      https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/core/script_bindings.js?v=0.9.7

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

/* ===============================================================================================================================
 * GOOGLE MAPS API KEY CONFIGURATION (OPTIONAL)
 * ===============================================================================================================================
 * 
 * Some features (like the Puzzle mod) may require a Google Maps API key for enhanced functionality.
 * This is OPTIONAL - the mods will work without it, but some features may be limited or rate-limited.
 * 
 * HOW TO GET A GOOGLE MAPS API KEY:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project or select an existing one
 * 3. Enable the following APIs (in "APIs & Services" → "Library"):
 *    - Maps JavaScript API
 *    - Street View Static API (for puzzle mod tiles)
 * 4. Go to "APIs & Services" → "Credentials" → "Create Credentials" → "API key"
 * 5. Copy your API key and paste it below between the quotes
 * 6. RECOMMENDED: Click "Restrict Key" and add these restrictions:
 *    - Application restrictions: HTTP referrers
 *    - Add referrer: *.geoguessr.com/*
 *    - API restrictions: Select the APIs you enabled above
 * 
 * SECURITY NOTES:
 * - Keep your API key private! Don't share your userscript file with others if it contains your key.
 * - Consider setting up billing alerts in Google Cloud Console to monitor usage
 * - The free tier includes generous limits that should be sufficient for personal use
 * 
 * EXAMPLE: GOOGLE_MAPS_API_KEY = "AIzaSyBnX1xX2xX3xX4xX5xX6xX7xX8xX9xX0xX1";
 * 
 * To add your API key, replace the empty string below with your key:
 * 
 * ALTERNATIVE: You can also configure the API key at runtime by opening the browser console
 * and typing: configureGoogleApiKey() - though this won't persist between sessions.
 */
let GOOGLE_MAPS_API_KEY = ""; // Replace with your Google Maps API key (optional)

// Make API key globally available
if (typeof window !== 'undefined') {
    window.GOOGLE_MAPS_API_KEY = GOOGLE_MAPS_API_KEY;
}

/* =============================================================================================================================== */
