Currently, the version has to be updated in 3 places.

_version.js
installer.js
installer_dev.js

To prevent browser caching, the `?v=` part at the end of each `@require` line should be updated if that particular dependency is updated.
The versions don't have to match the master version, they just need to update so the browser doesn't use a cached file.

`quotes.js` includes a bunch of quotes, jokes, etc.
The screen has to black out until the maps are loaded for the mods to work properly. The quotes can be disabled and it will just say "Loading..."
