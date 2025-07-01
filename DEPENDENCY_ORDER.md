# Import Order Dependencies

This document explains the critical import order for the GeoGuessr MultiMod modular structure.

## Dependency Chain

The @require imports must follow this specific order to avoid undefined variable errors:

### 1. Core Framework (Independent)
```javascript
// @require core/evt.js              // Event framework
// @require core/quotes.js           // Loading quotes  
// @require core/coordinate_extractor.js // Coordinate utilities
```

### 2. Configuration (Independent)
```javascript
// @require core/mod_config.js       // Defines MODS object
```

### 3. Global State (Depends on MODS)
```javascript
// @require core/debug_utils.js      // Debug utilities
// @require core/global_state.js     // Uses MODS, defines GG_DEFAULT, saveState, UPDATE_CALLBACKS
```

### 4. Core Utilities (Depend on Global State)
```javascript
// @require core/dom_utils.js        // Uses GG_DEFAULT, saveState, UPDATE_CALLBACKS
// @require core/mod_utils.js        // Utility functions for mods
// @require core/google_api.js       // Google Maps API utilities
// @require core/styling.js          // CSS styles
// @require core/cheat_protection.js // Anti-cheat protection
```

### 5. Individual Mods (Register with UPDATE_CALLBACKS)
```javascript
// @require mods/satellite.js        // Each mod registers itself
// @require mods/rotate.js           // with UPDATE_CALLBACKS
// ... (all other mods)
```

### 6. Script Bindings (Must Come Last)
```javascript
// @require core/script_bindings.js  // Uses MODS and UPDATE_CALLBACKS
```

## Why This Order Matters

- **mod_config.js** must load before **global_state.js** because global_state references the MODS object
- **global_state.js** must load before **dom_utils.js** because dom_utils uses GG_DEFAULT and saveState
- **Individual mods** must load before **script_bindings.js** because script_bindings accesses UPDATE_CALLBACKS that mods populate
- **script_bindings.js** must load last because it binds all the mod update functions

## Error Prevention

Following this order prevents these common errors:
- `MODS is not defined` (when global_state loads before mod_config)
- `GG_DEFAULT is not defined` (when dom_utils loads before global_state)  
- `UPDATE_CALLBACKS is not defined` (when script_bindings loads before mods)
- `updateModName is not defined` (when script_bindings loads before individual mod files)

## Files Updated

This dependency order is implemented in:
- `multimod_installer.js` (main branch)
- `multimod_installer_dev.js` (dev branch)  
- `multimod_v1_modular.js` (static modular version)
