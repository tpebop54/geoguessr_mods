# Tpebop's GeoGuessr Mods

This is a mod-pack of various scripts to mess with the Geoguessr gameplay in fun ways.

Some of the mods are helpful, some make it much harder.



## Installation

Install via Tampermonkey/Greasemonkey using one of these scripts. Simply copy and paste the text file to a new TamperMonkey script.

- **Main version**: [installer.js](https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/installer.js) - Stable version. For public use.
- **Release version**: [installer_release.js](https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/installer_release.js) - Release candidate, used for inal testing before pushing to main.
- **Development version**: [installer_dev.js](https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/installer_dev.js) - Latest features; dev work and will be frequently broken. Versions may not match.


## Updates

By default, auto-update should be enabled, but it may not run at a regular interval.

To make sure that you have the latest version: open the script in TamperMonkey, go to the Settings menu (for the script, not the overall settings menu), then under "Updates" click "Check for userscript updates"

When you refresh your GeoGuessr page, you can check that the new version is active by hovering over the "Tpebop's Mods" header in the upper left, and it will display the version. If the new version is not active, try deleting and recreating the TamperMonkey script.




## Configuration

#### GOOGLE_MAPS_API_KEY

- This is an optional value to enable a few additional features. Some mods use Google Maps API but most do not.
- Mods requiring API key will be automatically disabled if no key is provided.
- See documentation below for setup instructions.

#### DISABLE_CHEAT_PROTECTION

- By default, the script will mess up the replay files so that it's obvious that a script is being used.
- You can disable this by setting this value to true in the TamperMonkey file. Just promise to only use the script for good.

#### ENABLE_QUOTES

- The map has to be blacked out on loading so the mods can load properly.
- By default, it just says "Loading...", but if you set this value to `true`, it will display a random quote/fact/joke/etc. instead.




## Version Management

The version is used in many places both for clarity and cache breaking. When updating the version, just do a find-and-replace-all to the new version, e.g. `1.1.0` -> `1.2.0`
Occasionally in dev work, the minor increment (`1.1.x`) fails to clear the cache, so the major or intermediate increment (`1.2.0`) will break the browser cache. You may also have to delete and re-paste the TamperMonkey installer.

To prevent browser caching, the `?v=` part at the end of each `@require` line should be updated if that particular dependency is updated. The versions don't have to match the master version, they just need to update so the browser doesn't use a cached file.





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

- Keep your API key private! Don't share your userscript file with others if it contains your key.
- Consider setting up billing alerts in Google Cloud Console to monitor usage.
- The free tier includes generous limits that should be sufficient for personal use (10,000 requests per month for the Maps JavaScript API).

## Global Keybindings

- **`Ctrl Shift .`** - Reset all mods to default state. If you get in a pickle, either disable the mod via TamperMonkey or use this shortcut.
- **`Ctrl [`** - Open actual location in Google Maps (standard view). Requires Google Maps API key.
- **`Ctrl ]`** - Open aerial view (if "Only Land") or Street View (if "Only Street View" or both enabled).
