# Tpebop's GeoGuessr MultiMod V1

A collection of mods to make GeoGuessr more interesting and challenging in various ways.

## Installation

### Option 1: Auto-updating Installer (Recommended)
Install the script by copying the contents of `multimod_installer.js` directly to a TamperMonkey script through your TamperMonkey browser extension. This version will automatically stay up to date.

### Option 2: Static Version
Install `multimod_v1.js` for a static version that won't automatically update.

### Option 3: Modular Version (For Developers)
Install `multimod_v1_modular.js` for the new modular structure that loads components from separate files.

## Project Structure

The project has been refactored into a modular structure for better maintainability:

```
/
├── multimod_v1.js              # Original monolithic script
├── multimod_v1_modular.js      # New modular entry point
├── multimod_installer.js       # Auto-updating installer
├── /core/                      # Core system files and utilities
│   ├── gg_mod_config.js       # Mod configuration
│   ├── gg_debug_utils.js      # Debug utilities
│   ├── gg_global_state.js     # Global state management
│   ├── gg_dom_utils.js        # DOM utilities
│   ├── gg_mod_utils.js        # Mod utility functions
│   ├── gg_script_bindings.js  # Event bindings
│   ├── gg_cheat_protection.js # Anti-cheat protection
│   ├── gg_google_api.js       # Google Maps API utilities
│   ├── gg_styling.js          # CSS styles
│   ├── gg_evt.js              # Event framework
│   ├── gg_coordinate_extractor.js # Coordinate utilities
│   └── gg_quotes.js           # Loading quotes
└── /mods/                      # Individual mod implementations
    ├── gg_mod_satellite.js    # Satellite view mod
    ├── gg_mod_rotate.js       # Map rotation mod
    ├── gg_mod_zoom.js         # Zoom controls mod
    ├── gg_mod_score.js        # Score modification mod
    ├── gg_mod_flashlight.js   # Flashlight effect mod
    ├── gg_mod_seizure.js      # Screen shake/seizure effect mod
    ├── gg_mod_bopit.js        # Bop-it style controls mod
    ├── gg_mod_inframe.js      # Internal frame display mod
    ├── gg_mod_lottery.js      # Lottery-style scoring mod
    ├── gg_mod_puzzle.js       # Puzzle pieces mod
    ├── gg_mod_tilereveal.js   # Tile reveal animation mod
    ├── gg_mod_display.js      # Display modifications mod
    └── gg_mod_scratch.js      # Scratch-off effect mod
```

## Troubleshooting

If it is not updating properly, you may need to go to the "Externals" tab for the TamperMonkey script and click "Update" for each of the dependencies.

## Browser Compatibility

- **Chrome/Firefox**: Full support with vector rendering
- **Opera**: Limited support with raster rendering fallback due to WebGL limitations

## Development

See `MODULAR_STRUCTURE.md` for detailed information about the modular architecture and how to add new mods.
