# Tpebop's GeoGuessr Multi### Quick Comparison

| Option | Branch | Structure | @require Lines | Auto-update | Best For |
|--------|--------|-----------|----------------|-------------|----------|
| `multimod_installer.js` | main | Modular | 25 | ✅ | Most users |
| `multimod_installer_dev.js` | dev | Modular | 25 | ✅ | Testers |
| `legacy/multimod_v1.js` | any | Monolithic | 3 | ❌ | Legacy/offline |
| `multimod_v1_modular.js` | any | Modular | 25 | ❌ | Developers |A collection of mods to make GeoGuessr more interesting and challenging in various ways.

## Installation

### Option 1: Auto-updating Installer - Main Branch (Recommended for Users)
Install the script by copying the contents of `multimod_installer.js` directly to a TamperMonkey script. This version:
- Uses the stable main branch
- Uses the modular structure for better maintainability
- Requires 25 @require lines (all individual modules)
- Automatically stays up to date

### Option 2: Auto-updating Installer - Dev Branch (For Testing)
Install the script by copying the contents of `multimod_installer_dev.js` for the latest features. This version:
- Uses the development branch with latest features
- Uses the same modular structure as main
- Requires 25 @require lines (all individual modules)
- May have experimental or unstable features

### Option 3: Static Version - Monolithic (Legacy)
Install `legacy/multimod_v1.js` for a static monolithic version that won't automatically update. **Note**: This is deprecated in favor of the modular approach.

### Option 4: Static Version - Modular (For Developers)
Install `multimod_v1_modular.js` for the modular structure without auto-updates.

### Quick Comparison

| Option | Branch | Structure | @require Lines | Auto-update | Best For |
|--------|--------|-----------|----------------|-------------|----------|
| `multimod_installer.js` | main | Monolithic | 4 | ✅ | Most users |
| `multimod_installer_dev.js` | dev | Modular | 25+ | ✅ | Testers |
| `multimod_v1.js` | any | Monolithic | 3 | ❌ | Offline use |
| `multimod_v1_modular.js` | any | Modular | 25+ | ❌ | Developers |

## Project Structure

The project has been refactored into a modular structure for better maintainability:

```
/
├── multimod_installer.js       # Main branch auto-updating installer
├── multimod_installer_dev.js   # Dev branch auto-updating installer  
├── multimod_v1_modular.js      # Static modular entry point
├── /core/                      # Core system files and utilities
│   ├── mod_config.js          # Mod configuration
│   ├── debug_utils.js         # Debug utilities
│   ├── global_state.js        # Global state management
│   ├── dom_utils.js           # DOM utilities
│   ├── mod_utils.js           # Mod utility functions
│   ├── script_bindings.js     # Event bindings
│   ├── cheat_protection.js    # Anti-cheat protection
│   ├── google_api.js          # Google Maps API utilities
│   ├── styling.js             # CSS styles
│   ├── evt.js                 # Event framework
│   ├── coordinate_extractor.js # Coordinate utilities
│   └── quotes.js              # Loading quotes
├── /mods/                      # Individual mod implementations
│   ├── satellite.js           # Satellite view mod
│   ├── rotate.js              # Map rotation mod
│   ├── zoom.js                # Zoom controls mod
│   ├── score.js               # Score modification mod
│   ├── flashlight.js          # Flashlight effect mod
│   ├── seizure.js             # Screen shake/seizure effect mod
│   ├── bopit.js               # Bop-it style controls mod
│   ├── inframe.js             # Internal frame display mod
│   ├── lottery.js             # Lottery-style scoring mod
│   ├── puzzle.js              # Puzzle pieces mod
│   ├── tilereveal.js          # Tile reveal animation mod
│   ├── display.js             # Display modifications mod
│   └── scratch.js             # Scratch-off effect mod
└── /legacy/                    # Legacy files (deprecated)
    └── multimod_v1.js         # Original monolithic script
```

## Troubleshooting

If it is not updating properly, you may need to go to the "Externals" tab for the TamperMonkey script and click "Update" for each of the dependencies.

## Browser Compatibility

- **Chrome/Firefox**: Full support with vector rendering
- **Opera**: Limited support with raster rendering fallback due to WebGL limitations

## Development

See `MODULAR_STRUCTURE.md` for detailed information about the modular architecture and how to add new mods.

## Modular Architecture Benefits

Now that both installers use the modular structure, we get these benefits:

- **Consistency**: Both main and dev branches use the same architecture
- **Maintainability**: Each mod is in its own file, making updates easier
- **Debugging**: Issues can be traced to specific modules
- **Selective Loading**: Easy to disable specific mods by commenting out @require lines
- **Development**: Easier for multiple developers to work on different mods
- **Testing**: Individual mods can be tested in isolation

## Legacy Files

The following files are maintained for backward compatibility but are no longer the primary approach:

- `legacy/multimod_v1.js` - Original monolithic script (deprecated)
- Consider migrating to the modular installers for better long-term support
