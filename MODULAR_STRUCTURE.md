# GeoGuessr Mods - Modular Structure

This document describes the modular file structure for Tpebop's GeoGuessr MultiMod V1.

## File Structure Overview

### Main Entry Point
- `multimod_v1_modular.js` - Main TamperMonkey script that imports all modules

### Core System Files
- `gg_mod_config.js` - Configuration for all mods (MODS object)
- `gg_debug_utils.js` - Debug utilities and development tools
- `gg_global_state.js` - Global state management and localStorage handling
- `gg_dom_utils.js` - DOM manipulation and UI utility functions
- `gg_mod_utils.js` - Common utility functions used by mods
- `gg_script_bindings.js` - Script initialization and button bindings

### Individual Mod Files
- `gg_mod_satellite.js` - Satellite view mod
- `gg_mod_rotate.js` - Map rotation mod
- `gg_mod_zoom.js` - Zoom restriction mod
- `gg_mod_score.js` - Score display mod
- `gg_mod_flashlight.js` - Flashlight effect mod
- `gg_mod_seizure.js` - Seizure effect mod (disabled by default)
- `gg_mod_bopit.js` - Bop It game mod
- `gg_mod_inframe.js` - In-frame detection mod
- `gg_mod_lottery.js` - Lottery guessing mod
- `gg_mod_puzzle.js` - Puzzle mod
- `gg_mod_tilereveal.js` - Tile reveal mod
- `gg_mod_display.js` - Display options and visual effects
- `gg_mod_scratch.js` - Development/testing mod

### System Files
- `gg_cheat_protection.js` - Cheat protection and quote overlay system
- `gg_google_api.js` - Google Maps API interception and Opera compatibility
- `gg_styling.js` - Dynamic CSS styling

### Existing Dependencies (unchanged)
- `gg_evt.js` - Event framework
- `gg_quotes.js` - Quote collections
- `gg_coordinate_extractor.js` - Coordinate extraction system

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
1. Create a new `gg_mod_[name].js` file with the mod implementation
2. Add the mod configuration to `gg_mod_config.js`
3. Add the mod binding to `gg_script_bindings.js`
4. Add the @require line to `multimod_v1_modular.js`

## Opera Browser Compatibility

The modular structure maintains the Opera browser compatibility fix in `gg_google_api.js`, ensuring proper fallback to raster rendering when vector rendering is not supported.
