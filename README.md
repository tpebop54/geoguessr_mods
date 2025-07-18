# Tpebop's GeoGuessr Mods

Various mods to make GeoGuessr more interesting and challenging in different ways.

## Installation

Install via Tampermonkey/Greasemonkey using one of these scripts:
- **Release version**: [installer.js](installer.js) - Stable version
- **Development version**: [installer_dev.js](installer_dev.js) - Latest features

## Configuration

### Loading Screen Quotes
- Set `ENABLE_QUOTES = true` to show random quotes/facts during loading screens
- Set `ENABLE_QUOTES = false` (default) for simple "Loading..." text
- See documentation below for quote categories available

### Google Maps API Key (Optional)
- Some mods use Google Maps API but most do not
- Mods requiring API key will be automatically disabled if no key is provided
- See documentation below for setup instructions

## Version Management

Currently, the version has to be updated in 3 places:
- `_version.js`
- `installer.js` 
- `installer_dev.js`

To prevent browser caching, the `?v=` part at the end of each `@require` line should be updated if that particular dependency is updated. The versions don't have to match the master version, they just need to update so the browser doesn't use a cached file.

## Loading Screen Configuration

### Quote System
`quotes.js` includes a variety of quotes, jokes, facts, and conversation starters. The screen blacks out until the maps are loaded for the mods to work properly. 

**Quote Categories Available:**
- **inspirational**: Motivational and life quotes
- **heavy**: Thought-provoking philosophical quotes  
- **media**: Fun quotes from movies, TV, and celebrities
- **jokes**: Dad jokes and puns
- **funFacts**: Interesting facts about the world
- **tongueTwisters**: Try to say these fast!
- **questions**: Conversation starters and silly questions

When `ENABLE_QUOTES = true`, all categories are shown. When `false`, simple "Loading..." text is displayed.

## Google Maps API Key Setup (Optional)

Most mods work without this, but some features require a Google Maps API key. Using this mod pack is very unlikely to hit your free usage limits, but you should still monitor your usage.

### How to Get a Google Maps API Key:
1. Go to https://console.cloud.google.com/
2. Create a new project or select an existing one
3. Enable the following APIs (in "APIs & Services" → "Library"):
   - Maps JavaScript API
   - Street View Static API
4. Go to "APIs & Services" → "Credentials" → "Create Credentials" → "API key"
5. Copy your API key and paste it in the installer file
6. **RECOMMENDED**: Click "Restrict Key" and add these restrictions:
   - Application restrictions: HTTP referrers
   - Add referrer: `*.geoguessr.com/*`
   - API restrictions: Select the APIs you enabled above

### Security Notes:
- Keep your API key private! Don't share your userscript file with others if it contains your key
- Consider setting up billing alerts in Google Cloud Console to monitor usage
- The free tier includes generous limits that should be sufficient for personal use (10,000 requests per month for the Maps JavaScript API)

## Global Keybindings

- **`Ctrl Shift .`** - Reset all mods to default state. If you get in a pickle, either disable the mod via TamperMonkey or use this shortcut
- **`Ctrl [`** - Open actual location in Google Maps (standard view). Requires Google Maps API key and lottery mod with "Only Land" or "Only Street View" enabled
- **`Ctrl ]`** - Open aerial view (if "Only Land") or Street View (if "Only Street View" or both enabled). Requires Google Maps API key and lottery mod
