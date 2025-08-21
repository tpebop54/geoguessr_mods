// ==UserScript==
// @author       tpebop

// ==/UserScript==// Create and add the settings toggle button


function createSettingsToggleButton() {
    const buttonContainer = document.querySelector('.gg-mods-button-container');
    if (!buttonContainer) return;

    const settingsButton = document.createElement('button');
    settingsButton.className = 'gg-mod-button gg-mods-settings-toggle';
    settingsButton.textContent = 'Settings';
    settingsButton.setAttribute('data-tooltip', 'Open GeoGuessr Mods Settings');
    
    // Insert at the top of the button container
    buttonContainer.insertBefore(settingsButton, buttonContainer.firstChild);
    
    // Add click event listener
    settingsButton.addEventListener('click', toggleSettingsMenu);
}

// Create the settings menu
function createSettingsMenu() {
    const settingsMenu = document.createElement('div');
    settingsMenu.className = 'gg-option-menu gg-mods-settings-menu';
    settingsMenu.style.display = 'none';
    
    // Add menu header
    const menuHeader = document.createElement('div');
    menuHeader.className = 'gg-option-menu-header';
    menuHeader.textContent = 'GeoGuessr Mods Settings';
    settingsMenu.appendChild(menuHeader);
    
    // Add menu content container
    const menuContent = document.createElement('div');
    menuContent.className = 'gg-option-menu-content';
    settingsMenu.appendChild(menuContent);
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'gg-option-menu-close';
    closeButton.textContent = '×';
    closeButton.addEventListener('click', closeSettingsMenu);
    settingsMenu.appendChild(closeButton);
    
    // Append to body
    document.body.appendChild(settingsMenu);
}

// Toggle settings menu visibility
function toggleSettingsMenu() {
    const menu = document.querySelector('.gg-mods-settings-menu');
    if (!menu) {
        createSettingsMenu();
        return;
    }
    
    const isVisible = menu.style.display !== 'none';
    if (isVisible) {
        closeSettingsMenu();
    } else {
        openSettingsMenu();
    }
}

// Open settings menu
function openSettingsMenu() {
    const menu = document.querySelector('.gg-mods-settings-menu');
    if (menu) {
        menu.style.display = 'block';
        document.body.classList.add('gg-menu-open');
    }
}

// Close settings menu
function closeSettingsMenu() {
    const menu = document.querySelector('.gg-mods-settings-menu');
    if (menu) {
        menu.style.display = 'none';
        document.body.classList.remove('gg-menu-open');
    }
}

// Initialize settings menu functionality
function initializeSettingsMenu() {
    // Wait for the button container to be available
    const checkForContainer = setInterval(() => {
        const container = document.querySelector('.gg-mods-button-container');
        if (container) {
            clearInterval(checkForContainer);
            createSettingsToggleButton();
        }
    }, 100);
    
    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
        const menu = document.querySelector('.gg-mods-settings-menu');
        const button = document.querySelector('.gg-mods-settings-toggle');
        
        if (menu && menu.style.display !== 'none') {
            if (!menu.contains(event.target) && !button.contains(event.target)) {
                closeSettingsMenu();
            }
        }
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeSettingsMenu();
        }
    });
}

// Auto-initialize when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSettingsMenu);
} else {
    initializeSettingsMenu();
}

// Export functions for external use
window.GGModsSettings = {
    openMenu: openSettingsMenu,
    closeMenu: closeSettingsMenu,
    toggleMenu: toggleSettingsMenu
};
