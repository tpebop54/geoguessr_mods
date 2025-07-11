// ==UserScript==
// @author       tpebop

// ==/UserScript==

// MOD: Lottery.
// ===============================================================================================================================

let _LOTTERY_DISPLAY; // Display elements for lottery mod. (counter and button).
let _LOTTERY_COUNT; // How many remaining guesses you have.
let _LOTTERY_DRAGGING = false; // Makes lottery display draggable because it overlaps the menu.
let _LOTTERY_DRAGGING_OFFSET_X; // X offset from mouse to element edge when dragging starts.
let _LOTTERY_DRAGGING_OFFSET_Y; // Y offset from mouse to element edge when dragging starts.

const removeLotteryDisplay = () => {
    if (_LOTTERY_DISPLAY) {
        _LOTTERY_DISPLAY.parentElement.removeChild(_LOTTERY_DISPLAY);
        _LOTTERY_DISPLAY = undefined;
    }
};

const makeLotteryDisplay = () => { // Make the div and controls for the lottery.
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
    const onClick = () => {
        if (_LOTTERY_COUNT === 0) {
            return;
        }
        
        const mod = MODS.lottery;
        const nDegLat = getOption(mod, 'nDegLat');
        const nDegLng = getOption(mod, 'nDegLng');
        const actual = getActualLoc();
        const minLat = actual.lat - nDegLat;
        const maxLat = actual.lat + nDegLat;

        // The logic gets confusing across the prime meridian with large lng ranges.
        // Just assume that [-180, 180] means the entire world's longitude. Should be fine.
        // There may be some flaws in the logic here, but it's okay for now.
        let minLng, maxLng;
        if (nDegLng === 180) {
            minLng = -180;
            maxLng = 180;
        } else {
            const normalizedLng = ((actual.lng + 180) % 360 + 360) % 360 - 180;
            minLng = normalizedLng - nDegLng;
            maxLng = normalizedLng + nDegLng;
        }
        const { lat, lng } = getRandomLoc(minLat, maxLat, minLng, maxLng);
        _LOTTERY_COUNT -= 1;
        counter.innerText = _LOTTERY_COUNT;
        clickAt(lat, lng);
        setMapCenter(lat, lng);
    };
    button.addEventListener('click', onClick);

    // Reset button functionality
    const onReset = () => {
        const mod = MODS.lottery;
        _LOTTERY_COUNT = getOption(mod, 'nGuesses'); // Reset to original amount
        counter.innerText = _LOTTERY_COUNT;
        console.log('Lottery: Token count reset to', _LOTTERY_COUNT);
    };
    resetButton.addEventListener('click', onReset);
};

// Set lottery-specific map interaction mode (allow zoom/pan, block clicks)
const setLotteryMapMode = (enabled = true) => {
    const container = getSmallMapContainer();
    if (!container) return;
    
    if (enabled) {
        // Lottery mode: allow zoom/pan but block clicks
        container.style.pointerEvents = 'auto';
        
        // Remove any existing lottery overlay
        const existingOverlay = container.querySelector('.gg-lottery-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        // Add lottery-specific overlay that only intercepts click events
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
        
        // Only enable pointer events for specific interactions we want to block
        overlay.addEventListener('click', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
        }, true);
        
        // Override the click behavior at the container level instead of using overlay
        container.addEventListener('click', (evt) => {
            // Block clicks that would place markers
            evt.preventDefault();
            evt.stopPropagation();
        }, true);
        
        // Store reference to the click handler so we can remove it later
        container._lotteryClickHandler = (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
        };
        
        container.appendChild(overlay);
    } else {
        // Normal mode: remove lottery overlay and click handler
        container.style.pointerEvents = 'auto';
        const overlay = container.querySelector('.gg-lottery-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        // Remove the click handler
        if (container._lotteryClickHandler) {
            container.removeEventListener('click', container._lotteryClickHandler, true);
            delete container._lotteryClickHandler;
        }
    }
};

const resetLotteryCount = () => {
    const mod = MODS.lottery;
    if (!mod.active) {
        return; // Only reset if the mod is active
    }
    
    console.log('Lottery: Resetting count due to page/location change');
    
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
        console.log('Lottery: Page unload detected, will reset on next load');
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

const updateLottery = (forceState = null) => {
    const mod = MODS.lottery;
    const active = updateMod(mod, forceState);

    // Only remove the display if we're deactivating
    if (!active) {
        removeLotteryDisplay();
    }

    const smallMap = getSmallMap();
    if (active) {
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
        }, {
            require2D: true,
            require3D: false,
            modName: 'Lottery',
            timeout: 8000
        });
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
            
            console.log('GeoGuessr MultiMod: Lottery reset for new round, tokens:', _LOTTERY_COUNT);
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
        console.log('GeoGuessr MultiMod: Lottery round ended');
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
