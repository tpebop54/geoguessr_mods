# GeoGuessr Mods - Modular Structure

This document describes the modular file structure for Tpebop's GeoGuessr MultiMod V1.

## File Structure Overview

### Main Entry Point
- `multimod_v1_modular.js` - Main TamperMonkey script that imports all modules

### Core System Files (`/core/`)
- `gg_mod_config.js` - Mod configuration and settings
- `gg_debug_utils.js` - Debugging utilities and functions
- `gg_global_state.js` - Global state management
- `gg_dom_utils.js` - DOM manipulation utilities
- `gg_mod_utils.js` - Utility functions for mod operations
- `gg_script_bindings.js` - Keyboard and event bindings
- `gg_cheat_protection.js` - Anti-cheat detection and protection
- `gg_google_api.js` - Google Maps API interception and utilities
- `gg_styling.js` - CSS styles for the mods
- `gg_evt.js` - Event handling framework
- `gg_coordinate_extractor.js` - Coordinate extraction utilities
- `gg_quotes.js` - Loading screen quotes

### Individual Mods (`/mods/`)
- `gg_mod_satellite.js` - Satellite view mod
- `gg_mod_rotate.js` - Map rotation mod
- `gg_mod_zoom.js` - Zoom controls mod
- `gg_mod_score.js` - Score modification mod
- `gg_mod_flashlight.js` - Flashlight effect mod
- `gg_mod_seizure.js` - Screen shake/seizure effect mod
- `gg_mod_bopit.js` - Bop-it style controls mod
- `gg_mod_inframe.js` - Internal frame display mod
- `gg_mod_lottery.js` - Lottery-style scoring mod
- `gg_mod_puzzle.js` - Puzzle pieces mod
- `gg_mod_tilereveal.js` - Tile reveal animation mod
- `gg_mod_display.js` - Display modifications mod
- `gg_mod_scratch.js` - Scratch-off effect mod

## Benefits of Modular Structure

1. **Maintainability** - Each mod is isolated in its own file
2. **Development** - Easier to work on individual features
3. **Testing** - Can test mods independently
4. **Collaboration** - Multiple developers can work on different mods
5. **Selective Loading** - Can easily disable specific mods by commenting out @require lines
6. **Organization** - Clear separation of concerns

## Usage

To use the modular version:
1. Install `multimod_v1_modular.js` in TamperMonkey
2. Ensure all required files are accessible via the GitHub URLs in the @require directives
3. The system will automatically load and initialize all mods

## Adding New Mods

To add a new mod:
1. Create a new `gg_mod_[name].js` file in the `/mods/` directory with the mod implementation
2. Add the mod configuration to `/core/gg_mod_config.js`
3. Add the mod binding to `/core/gg_script_bindings.js`
4. Add the @require line to `multimod_v1_modular.js` in the "Individual mods" section

## Opera Browser Compatibility

The modular structure maintains the Opera browser compatibility fix in `/core/gg_google_api.js`, ensuring proper fallback to raster rendering when vector rendering is not supported.
