// ==UserScript==
// @author       tpebop

// ==/UserScript==

// MOD: Lottery.
// ===============================================================================================================================
// 
// Lottery mod allows players to place random guesses within a specified radius of the actual location.
// Uses sinusoidal projection for token distribution to ensure even spread across the Earth's surface,
// avoiding the clustering near poles that occurs with uniform lat/lng distribution (Mercator issue).
// 
// NEW FEATURES:
// - "Only Street View": Ensures generated locations have official Google Street View coverage (requires API key)
// - "Only Land": Ensures generated locations are on land, not in water (requires API key)
// Both features use Google Maps APIs for location validation and will fall back gracefully without API key.
//

let _LOTTERY_DISPLAY; // Display elements for lottery mod. (counter and button).
let _LOTTERY_COUNT; // How many remaining guesses you have.
let _LOTTERY_DRAGGING = false; // Makes lottery display draggable because it overlaps the menu.
let _LOTTERY_DRAGGING_OFFSET_X; // X offset from mouse to element edge when dragging starts.
let _LOTTERY_DRAGGING_OFFSET_Y; // Y offset from mouse to element edge when dragging starts.

// Initialize the flag to control programmatic clicks
window._LOTTERY_ALLOWING_CLICK = false;

const removeLotteryDisplay = () => {
    if (_LOTTERY_DISPLAY) {
        _LOTTERY_DISPLAY.parentElement.removeChild(_LOTTERY_DISPLAY);
        _LOTTERY_DISPLAY = undefined;
    }
};

const makeLotteryDisplay = () => { // Make the div and controls for the lottery.
    // Only show lottery display on game pages
    if (!areModsAvailable()) {
        console.debug('Lottery: Not on a game page, skipping lottery display creation. Path:', window.location.pathname);
        return;
    }
    
    removeLotteryDisplay();

    const container = document.createElement('div'); // Contains the full lottery display.
    container.id = 'gg-lottery';

    /* eslint-disable no-return-assign */
    container.addEventListener('mousedown', (evt) => {
        _LOTTERY_DRAGGING = true;
        
        // Convert CSS positioning to absolute pixel positioning before dragging
        const rect = container.getBoundingClientRect();
        container.style.left = rect.left + 'px';
        container.style.top = rect.top + 'px';
        
        // Now calculate the offset based on the actual position
        _LOTTERY_DRAGGING_OFFSET_X = evt.clientX - rect.left;
        _LOTTERY_DRAGGING_OFFSET_Y = evt.clientY - rect.top;
        evt.preventDefault(); // Prevent text selection during drag
    });
    document.addEventListener('mousemove', (evt) => {
        if (_LOTTERY_DRAGGING) {
            container.style.left = evt.clientX - _LOTTERY_DRAGGING_OFFSET_X + 'px';
            container.style.top = evt.clientY - _LOTTERY_DRAGGING_OFFSET_Y + 'px';
            evt.preventDefault(); // Prevent text selection during drag
        }
    });
    document.addEventListener('mouseup', () => {
        _LOTTERY_DRAGGING = false;
        _LOTTERY_DRAGGING_OFFSET_X = undefined;
        _LOTTERY_DRAGGING_OFFSET_Y = undefined;
    });
    /* eslint-enable no-return-assign */

    // Set up display for the lottery counter and button.
    const counterLabel = document.createElement('div'); // Text label.
    counterLabel.textContent = 'Tokens remaining:';
    const counter = document.createElement('div'); // How many guesses you have left, will update each click.
    counter.id = 'gg-lottery-counter';
    counter.innerText = _LOTTERY_COUNT;
    const counterDiv = document.createElement('div'); // Contains the above two items side by side.
    counterDiv.id = 'gg-lottery-counter-div';
    counterDiv.appendChild(counterLabel);
    counterDiv.appendChild(counter);

    const button = document.createElement('button');
    button.id = 'gg-lottery-button';
    button.textContent = 'Insert token';
    
    // Prevent dragging when clicking the button
    button.addEventListener('mousedown', (evt) => {
        evt.stopPropagation();
    });

    // Create reset button with circular arrow symbol
    const resetButton = document.createElement('button');
    resetButton.id = 'gg-lottery-reset-button';
    resetButton.innerHTML = '↻'; // Circular arrow reset symbol
    resetButton.title = 'Reset token count'; // Tooltip
    
    // Prevent dragging when clicking the reset button
    resetButton.addEventListener('mousedown', (evt) => {
        evt.stopPropagation();
    });

    // Create a button container to hold both buttons side by side
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'gg-lottery-button-container';
    buttonContainer.appendChild(button);
    buttonContainer.appendChild(resetButton);

    container.appendChild(counterDiv);
    container.appendChild(buttonContainer);
    document.body.appendChild(container);

    _LOTTERY_DISPLAY = container;

    // Bind stuff.
    const onClick = async () => {
        if (_LOTTERY_COUNT === 0) {
            return;
        }
        
        const mod = MODS.lottery;
        const nDegLat = getOption(mod, 'nDegLat');
        const nDegLng = getOption(mod, 'nDegLng');
        const onlyStreetView = getOption(mod, 'onlyStreetView');
        const onlyLand = getOption(mod, 'onlyLand');
        const actual = getActualLoc();
        
        // Validate that we have a valid actual location
        if (!actual || isNaN(actual.lat) || isNaN(actual.lng)) {
            console.error('Lottery: Invalid actual location:', actual);
            button.textContent = 'Location error';
            setTimeout(() => {
                button.textContent = 'Insert token';
            }, 2000);
            return;
        }
        
        // Validate options are valid numbers
        if (isNaN(nDegLat) || isNaN(nDegLng) || nDegLat <= 0 || nDegLng <= 0) {
            console.error('Lottery: Invalid degree options:', { nDegLat, nDegLng });
            button.textContent = 'Config error';
            setTimeout(() => {
                button.textContent = 'Insert token';
            }, 2000);
            return;
        }
        
        // Calculate latitude bounds and clamp to safe Mercator projection limits
        // This ensures we never try to generate coordinates outside the visible map
        const mercator_lat_min = -85.05112878;
        const mercator_lat_max = 85.05112878;
        
        const rawMinLat = actual.lat - nDegLat;
        const rawMaxLat = actual.lat + nDegLat;
        let minLat = Math.max(mercator_lat_min, rawMinLat);
        let maxLat = Math.min(mercator_lat_max, rawMaxLat);

        // Ensure we have valid latitude bounds
        if (minLat >= maxLat) {
            console.debug('Lottery: Invalid latitude bounds, using fallback');
            minLat = Math.max(mercator_lat_min, actual.lat - 10);
            maxLat = Math.min(mercator_lat_max, actual.lat + 10);
        }

        // The logic gets confusing across the prime meridian with large lng ranges.
        // Just assume that [-180, 180] means the entire world's longitude. Should be fine.
        let minLng, maxLng;
        if (nDegLng === 180) {
            minLng = -179.9999;
            maxLng = 179.9999;
        } else {
            const normalizedLng = ((actual.lng + 180) % 360 + 360) % 360 - 180;
            minLng = Math.max(minLng, normalizedLng - nDegLng);
            maxLng = Math.min(maxLng, normalizedLng + nDegLng);
        }
        
        // Generate location with criteria if any special options are enabled
        let location;
        if (onlyStreetView || onlyLand) {
            // Check if API key is available for these features
            const hasApiKey = window.GOOGLE_MAPS_API_KEY && window.GOOGLE_MAPS_API_KEY.trim().length > 0;
            if (!hasApiKey) {
                console.warn('Lottery mod: API-dependent features (Only Street View/Only Land) attempted without Google Maps API key');
                button.textContent = 'API key required';
                button.disabled = true;
                setTimeout(() => {
                    button.textContent = 'TAKE IT';
                    button.disabled = false;
                }, 2000);
                return;
            }
            
            // Show loading indicator with more specific message
            const criteria = [];
            if (onlyLand) criteria.push('land');
            if (onlyStreetView) criteria.push('Street View');
            
            button.textContent = `Finding ${criteria.join(' + ')}...`;
            button.disabled = true;
            
            try {
                // Add timeout protection (30 seconds max)
                location = await Promise.race([
                    getRandomLocationWithCriteria(
                        minLat, maxLat, minLng, maxLng,
                        onlyStreetView, onlyLand
                    ),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Location search timed out')), 30000)
                    )
                ]);
                
                if (!location) {
                    console.warn('Lottery: Could not find location meeting criteria, using fallback');
                    location = getRandomLocSinusoidal(minLat, maxLat, minLng, maxLng);
                }
            } catch (error) {
                console.error('Lottery: Error generating location with criteria:', error);
                location = getRandomLocSinusoidal(minLat, maxLat, minLng, maxLng);
                
                // Show brief error message to user
                button.textContent = 'Error - using fallback';
                setTimeout(() => {
                    button.textContent = 'Insert token';
                }, 1500);
            } finally {
                // Restore button (unless we're showing error message)
                if (!button.textContent.includes('Error')) {
                    button.textContent = 'Insert token';
                }
                button.disabled = false;
            }
        } else {
            // Use simple random location generation
            location = getRandomLocSinusoidal(minLat, maxLat, minLng, maxLng);
        }
        
        const { lat, lng } = location;
        
        // Final safety check: ensure coordinates are within valid map bounds
        // Use the constants defined at the beginning of the function
        const safeLat = Math.max(mercator_lat_min, Math.min(mercator_lat_max, lat));
        const safeLng = Math.max(-180, Math.min(180, lng));
        
        // Additional check: ensure the coordinates are not exactly at the poles or extreme edges
        // which could cause issues with map projection
        const finalLat = Math.max(-85, Math.min(85, safeLat));
        const finalLng = Math.max(-179.99, Math.min(179.99, safeLng));
        
        // Validate that coordinates are valid numbers before proceeding
        if (isNaN(finalLat) || isNaN(finalLng)) {
            console.error('Lottery: Generated invalid coordinates:', { finalLat, finalLng, originalLocation: location });
            button.textContent = 'Coordinate error';
            setTimeout(() => {
                button.textContent = 'Insert token';
            }, 2000);
            return;
        }
        
        console.debug('Lottery: Using coordinates:', { finalLat, finalLng });
        
        _LOTTERY_COUNT -= 1;
        counter.innerText = _LOTTERY_COUNT;
        
        // Temporarily disable click blocking for this programmatic click
        window._LOTTERY_ALLOWING_CLICK = true;
        clickAt(finalLat, finalLng);
        // Re-enable click blocking after a short delay
        setTimeout(() => {
            window._LOTTERY_ALLOWING_CLICK = false;
        }, 100);
        
        setMapCenter(finalLat, finalLng);
    };
    button.addEventListener('click', onClick);

    // Reset button functionality
    const onReset = () => {
        const mod = MODS.lottery;
        _LOTTERY_COUNT = getOption(mod, 'nGuesses'); // Reset to original amount
        counter.innerText = _LOTTERY_COUNT;
    };
    resetButton.addEventListener('click', onReset);
};

// Remove all lottery click blockers from the map
const removeAllLotteryClickBlockers = () => {
    console.debug('Lottery: Removing all click blockers');
    
    // Clear the programmatic click flag
    window._LOTTERY_ALLOWING_CLICK = false;
    
    // Remove lottery overlays from all possible containers
    const containers = [
        getSmallMapContainer(),
        getSmallMap(),
        document.querySelector('[data-qa="guess-map"]'),
        document.querySelector('.guess-map'),
        document.querySelector('#__next [role="region"]'),
        document.body
    ].filter(Boolean);
    
    containers.forEach(container => {
        // Remove lottery overlays
        const overlays = container.querySelectorAll('.gg-lottery-overlay');
        overlays.forEach(overlay => {
            // Clean up overlay-specific event listeners before removing
            if (overlay._overlayEventListeners) {
                overlay._overlayEventListeners.forEach(({ event, handler, options }) => {
                    overlay.removeEventListener(event, handler, options);
                });
            }
            overlay.remove();
        });
        
        // Remove stored click handlers
        if (container._lotteryClickHandler) {
            container.removeEventListener('click', container._lotteryClickHandler, true);
            delete container._lotteryClickHandler;
        }
        
        // Remove any additional event listeners that might be blocking clicks
        if (container._lotteryEventListeners) {
            container._lotteryEventListeners.forEach(({ event, handler, options }) => {
                container.removeEventListener(event, handler, options);
            });
            delete container._lotteryEventListeners;
        }
    });
    
    // Remove any globally added click blockers
    document.querySelectorAll('.gg-lottery-overlay, [class*="lottery-click-block"]').forEach(el => el.remove());
};

// Set lottery-specific map interaction mode (allow zoom/pan, block clicks)
const setLotteryMapMode = (enabled = true) => {
    // Only create lottery overlays on game pages
    if (enabled && !areModsAvailable()) {
        console.debug('Lottery: Not on a game page, skipping lottery map mode. Path:', window.location.pathname);
        return;
    }
    
    const container = getSmallMapContainer();
    if (!container) return;
    
    if (enabled) {
        // First remove any existing blockers to avoid duplicates
        removeAllLotteryClickBlockers();
        
        // Lottery mode: allow zoom/pan but block clicks
        container.style.pointerEvents = 'auto';
        
        // Add lottery-specific overlay that intercepts click events
        const overlay = document.createElement('div');
        overlay.className = 'gg-lottery-overlay';
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            background: transparent;
            z-index: 1000;
        `;
        
        // Only block click events, allow all other interactions (drag, zoom, etc.)
        const overlayClickHandler = (evt) => {
            // Only block actual clicks, not mousedown events that start drags
            if (evt.type === 'click') {
                // Allow programmatic clicks from lottery
                if (window._LOTTERY_ALLOWING_CLICK) {
                    return; // Allow programmatic clicks
                }
                
                evt.preventDefault();
                evt.stopPropagation();
            }
        };
        
        // Enable pointer events only for click blocking
        overlay.style.pointerEvents = 'auto';
        overlay.addEventListener('click', overlayClickHandler, true);
        
        // Define and store the container click handler that's more selective
        const containerClickHandler = (evt) => {
            // Only block click events, not mousedown/mousemove for dragging
            if (evt.type === 'click') {
                // Allow programmatic clicks from lottery
                if (window._LOTTERY_ALLOWING_CLICK) {
                    return; // Allow programmatic clicks
                }
                
                // Additional check: don't block if this click is part of a drag operation
                if (!evt.target.closest('.gg-lottery-overlay-dragging')) {
                    evt.preventDefault();
                    evt.stopPropagation();
                }
            }
        };
        
        // Add the click handler to the container
        container.addEventListener('click', containerClickHandler, true);
        
        // Track drag state to allow drag operations
        let isDragging = false;
        let dragStartTime = 0;
        
        const mouseDownHandler = (evt) => {
            isDragging = false;
            dragStartTime = Date.now();
            overlay.classList.add('gg-lottery-overlay-dragging');
        };
        
        const mouseMoveHandler = (evt) => {
            if (Date.now() - dragStartTime > 100) { // 100ms threshold for drag detection
                isDragging = true;
            }
        };
        
        const mouseUpHandler = (evt) => {
            setTimeout(() => {
                isDragging = false;
                overlay.classList.remove('gg-lottery-overlay-dragging');
            }, 50); // Small delay to ensure click event sees the drag state
        };
        
        // Add drag detection listeners
        overlay.addEventListener('mousedown', mouseDownHandler, true);
        overlay.addEventListener('mousemove', mouseMoveHandler, true);
        overlay.addEventListener('mouseup', mouseUpHandler, true);
        
        // Store overlay event listeners for cleanup
        overlay._overlayEventListeners = [
            { event: 'click', handler: overlayClickHandler, options: true },
            { event: 'mousedown', handler: mouseDownHandler, options: true },
            { event: 'mousemove', handler: mouseMoveHandler, options: true },
            { event: 'mouseup', handler: mouseUpHandler, options: true }
        ];
        
        // Store references for cleanup
        container._lotteryClickHandler = containerClickHandler;
        if (!container._lotteryEventListeners) {
            container._lotteryEventListeners = [];
        }
        container._lotteryEventListeners.push(
            { event: 'click', handler: containerClickHandler, options: true },
            { event: 'mousedown', handler: mouseDownHandler, options: true },
            { event: 'mousemove', handler: mouseMoveHandler, options: true },
            { event: 'mouseup', handler: mouseUpHandler, options: true }
        );
        
        container.appendChild(overlay);
    } else {
        // Normal mode: remove all lottery click blockers
        removeAllLotteryClickBlockers();
        
        // Restore normal pointer events
        container.style.pointerEvents = 'auto';
    }
};

const resetLotteryCount = () => {
    const mod = MODS.lottery;
    if (!mod.active) {
        return; // Only reset if the mod is active
    }
    
    // Only reset on game pages
    if (!areModsAvailable()) {
        console.debug('Lottery: Not on a game page, skipping reset. Path:', window.location.pathname);
        return;
    }
    
    console.debug('Lottery: Resetting counter');
    
    // Reset the counter
    _LOTTERY_COUNT = getOption(mod, 'nGuesses');
    
    // Update the counter display if it exists
    const counter = document.getElementById('gg-lottery-counter');
    if (counter) {
        counter.innerText = _LOTTERY_COUNT;
    }
};

const startLotteryLocationTracking = () => {
    // Register with the global location tracker
    window.GG_LOCATION_TRACKER.subscribe('lottery', (newUrl, oldUrl) => {
        // Check if this is a significant location change (new round/page)
        if (window.GG_LOCATION_TRACKER.isSignificantLocationChange(oldUrl, newUrl)) {
            resetLotteryCount();
        }
    }, 2000); // Check every 2 seconds
    
    // Add beforeunload listener for page refresh detection
    window.addEventListener('beforeunload', () => {
    });
    
    // Add visibility change listener for tab focus/reload detection
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // Page became visible again, trigger a check
            setTimeout(() => {
                const currentUrl = window.GG_LOCATION_TRACKER.getCurrentUrl();
                resetLotteryCount();
            }, 100);
        }
    });
};

const stopLotteryLocationTracking = () => {
    // Unregister from the global location tracker
    window.GG_LOCATION_TRACKER.unsubscribe('lottery');
};

const updateLottery = (forceState = undefined) => {
    const mod = MODS.lottery;
    const active = updateMod(mod, forceState);
    const isGamePage = areModsAvailable();

    // Handle conflicts with scoring mods
    if (active) {
        disableConflictingMods(mod);
    }

    // Only remove the display if we're deactivating
    if (!active) {
        removeLotteryDisplay();
        // Ensure all click blockers are removed when lottery is disabled
        removeAllLotteryClickBlockers();
    }

    const smallMap = getSmallMap();
    if (active && isGamePage) {
        // Use waitForMapsReady to ensure the 2D map is ready before proceeding
        waitForMapsReady(() => {
            // If display doesn't exist, create it
            if (!_LOTTERY_DISPLAY) {
                _LOTTERY_COUNT = getOption(mod, 'nGuesses'); // Reset lottery count to the configured number of guesses
                makeLotteryDisplay();
            }
            
            // Ensure lottery map mode is properly set
            setLotteryMapMode(true); // Enable lottery mode (zoom/pan allowed, clicks blocked)
            
            // Start location tracking when the mod is activated
            startLotteryLocationTracking();
            
            // Update the counter display to reflect current state
            const counter = document.getElementById('gg-lottery-counter');
            if (counter) {
                counter.innerText = _LOTTERY_COUNT;
            }
            
            // Check if requirements are met for special options
            checkLotteryRequirements();
        }, {
            require2D: true,
            require3D: false,
            modName: 'Lottery',
            timeout: 8000
        });
    } else if (active && !isGamePage) {
        // Mod is active but not on a game page - clean up any existing overlays
        console.debug('Lottery: Mod active but not on game page, cleaning up overlays');
        removeLotteryDisplay();
        removeAllLotteryClickBlockers();
        setLotteryMapMode(false);
        stopLotteryLocationTracking();
    } else {
        const container = document.querySelector(`#gg-lottery`);
        if (container) {
            container.parentElement.removeChild(container);
        }
        setLotteryMapMode(false); // Restore normal map mode
        
        // Stop location tracking when the mod is deactivated
        stopLotteryLocationTracking();
    }
    
    // Save state after updating
    saveState();
};

// Function to handle round start events for the lottery mod
const onLotteryRoundStart = () => {
    const mod = MODS.lottery;
    if (isModActive(mod)) {
        // Wait for maps to be ready before applying changes
        waitForMapsReady(() => {
            // Reset lottery count for new round
            _LOTTERY_COUNT = getOption(mod, 'nGuesses');
            
            // Update the counter display
            const counter = document.getElementById('gg-lottery-counter');
            if (counter) {
                counter.innerText = _LOTTERY_COUNT;
            }
            
            // Ensure lottery map mode is properly set
            setLotteryMapMode(true);
            
        }, {
            require2D: true,
            require3D: false,
            modName: 'Lottery-RoundStart',
            timeout: 8000
        });
    }
};

// Function to handle round end events for the lottery mod
const onLotteryRoundEnd = () => {
    const mod = MODS.lottery;
    if (isModActive(mod)) {
    }
};

// Connect to global event system for round events
window.addEventListener('gg_round_start', (evt) => {
    onLotteryRoundStart();
});

// Listen for mod reactivation events
window.addEventListener('gg_mods_reactivate', (evt) => {
    if (isModActive(MODS.lottery)) {
        onLotteryRoundStart();
    }
});

// For backward compatibility, also keep the monitor in place
const monitorRoundStateForLottery = () => {
    let lastRoundState = typeof GG_ROUND !== 'undefined' && GG_ROUND;
    
    setInterval(() => {
        const mod = MODS.lottery;
        if (!isModActive(mod)) return;
        
        const currentRoundState = typeof GG_ROUND !== 'undefined' && GG_ROUND;
        
        // Round just started
        if (!lastRoundState && currentRoundState) {
            onLotteryRoundStart();
        }
        // Round just ended
        else if (lastRoundState && !currentRoundState) {
            onLotteryRoundEnd();
        }
        
        lastRoundState = currentRoundState;
    }, 1000); // Check every second
};

// Start monitoring when this module loads
if (typeof GG_ROUND !== 'undefined') {
    monitorRoundStateForLottery();
} else {
    // If GG_ROUND isn't defined yet, wait a bit and try again
    setTimeout(() => {
        if (typeof GG_ROUND !== 'undefined') {
            monitorRoundStateForLottery();
        }
    }, 2000);
}

// Start tracking location changes
startLotteryLocationTracking();

/**
 * Check if lottery mod requirements are met and show warnings if needed
 */
const checkLotteryRequirements = () => {
    const mod = MODS.lottery;
    if (!isModActive(mod)) return;
    
    const onlyStreetView = getOption(mod, 'onlyStreetView');
    const onlyLand = getOption(mod, 'onlyLand');
    
    if ((onlyStreetView || onlyLand) && !hasGoogleApiKey()) {
        console.warn('Lottery: "Only Street View" and "Only Land" options require a Google Maps API key');
        
        // Show user-friendly notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff9800;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 9999;
            max-width: 300px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        notification.innerHTML = `
            <strong>Lottery Mod Warning</strong><br>
            "Only Street View" and "Only Land" options require a Google Maps API key.<br>
            <small>See installer comments for setup instructions or type <code>configureGoogleApiKey()</code> in console.</small>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove notification after 8 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }
        }, 8000);
    }
};

// Check requirements initially
checkLotteryRequirements();

// Note: updateLottery() is called during mod initialization via script_bindings.js
// Do not call it here as it would override the saved state from localStorage
