# Tpebop's GeoGuessr Mods

This is a mod-pack of various scripts to mess with the Geoguessr gameplay in fun ways.

Some of the mods are helpful, some make it much harder.



## Installation

Install via Tampermonkey/Greasemonkey using one of these scripts. Simply copy and paste the text file to a new TamperMonkey script.

- **Main version**: [installer.js](https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/installer.js) - Stable version. For public use.
- **Release version**: [installer_release.js](https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/installer_release.js) - Release candidate, used for initial testing before pushing to main.
- **Development version**: [installer_dev.js](https://raw.githubusercontent.com/tpebop54/geoguessr_mods/refs/heads/main/installer_dev.js) - Latest features; dev work and will be frequently broken. Versions may not match.


## Updates

By default, auto-update should be enabled at a 1-day interval.

To make sure that you have the latest version: open the script in TamperMonkey, go to the Settings menu (for the script, not the overall settings menu), then under "Updates" click "Check for userscript updates"

When you refresh your GeoGuessr page, you can check that the new version is active by hovering over the "Tpebop's Mods" header in the upper left, and it will display the version. If the new version is not active, try deleting and recreating the TamperMonkey script.




## Configuration (installer file)

#### ENABLE_QUOTES

- The map has to be blacked out on loading so the mods can load properly.
- By default, it just says "Loading...", but if you set this value to `true`, it will display a random quote/fact/joke/etc. instead.


## Version Management

The version is used in many places both for clarity and cache breaking. When updating the version, just do a find-and-replace-all to the new version, e.g. `4.0.2` -> `1.2.0`
Occasionally in dev work, the minor increment (`1.1.x`) fails to clear the cache, so the major or intermediate increment (`1.2.0`) will break the browser cache. You may also have to delete and re-paste the TamperMonkey installer.

To prevent browser caching, the `?v=` part at the end of each `@require` line should be updated if that particular dependency is updated. The versions don't have to match the master version, they just need to update so the browser doesn't use a cached file.




## Global Keybindings

- **`Ctrl Shift .`** - Reset all mods to default state. If you get in a pickle, either disable the mod via TamperMonkey or use this shortcut.
- **`Ctrl Shift .`** - Open debugger (requires console open).

