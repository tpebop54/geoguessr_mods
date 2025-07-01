# Installer Files Guide

This document explains the different installer options available for Tpebop's GeoGuessr MultiMod V1.

## Available Installers

### 1. `multimod_installer.js` - Main Branch (Stable)
**Recommended for most users**

- **Branch**: main (stable)
- **Structure**: Modular 
- **@require lines**: 25 (all individual modules)
- **Dependencies**: All individual core and mod files
- **Auto-updates**: Yes
- **Best for**: Regular users who want stable, working mods with better maintainability

### 2. `multimod_installer_dev.js` - Dev Branch (Latest)
**For testers and enthusiasts**

- **Branch**: dev (cutting-edge)
- **Structure**: Modular
- **@require lines**: 25 (complete module loading)
- **Dependencies**: All individual core and mod files
- **Auto-updates**: Yes  
- **Best for**: Users who want the latest features and don't mind potential bugs

## Installation Instructions

1. Open TamperMonkey dashboard
2. Click "Create a new script"
3. Copy and paste the contents of your chosen installer file
4. Save the script
5. Navigate to geoguessr.com and the mods will load automatically

## Updating

Both installers are configured to auto-update from their respective GitHub branches. If you need to manually update:

1. Go to TamperMonkey dashboard
2. Find your script
3. Click the "Externals" tab
4. Click "Update" for each dependency

## Switching Between Versions

To switch from one installer to another:

1. Disable or delete your current script in TamperMonkey
2. Install the new installer following the installation instructions above

## Troubleshooting

- **Mods not loading**: Check the TamperMonkey console for errors
- **Outdated mods**: Manually update externals in TamperMonkey
- **Performance issues**: Both installers now use the same modular structure for consistency
- **Missing features**: Try the dev branch installer for latest features
- **Legacy support**: Use `multimod_v1.js` if you need the old monolithic structure

## For Developers

If you're developing new mods or modifying existing ones:
- Use `multimod_v1_modular.js` directly (not an installer)
- This gives you full control over which modules to load
- You can easily disable specific mods by commenting out @require lines
