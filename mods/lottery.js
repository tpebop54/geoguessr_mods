// ==UserScript==
// @author       tpebop

// ==/UserScript==

// MOD: Lottery.
// ===============================================================================================================================

// TODO:
// - API stuff
// - Boolean to reset between rounds or not

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
    if (!areModsAvailable()) {
        return;
    }

    removeLotteryDisplay();

    const container = document.createElement('div'); // Contains the full lottery display.
    container.id = 'gg-lottery';
    container.classList.add('gg-persistent-container');

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

    // Lottery counter and button.
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
    button.classList.add('gg-interactive-button');
    button.textContent = 'Insert token';

    // Prevent dragging when clicking the button
    button.addEventListener('mousedown', (evt) => {
        evt.stopPropagation();
    });

    // Reset button with circular arrow symbol
    const resetButton = document.createElement('button');
    resetButton.id = 'gg-lottery-reset-button';
    resetButton.classList.add('gg-interactive-button');
    resetButton.innerHTML = '↻'; // Circular arrow reset symbol
    resetButton.title = 'Reset token count'; // Tooltip

    // Prevent dragging when clicking the reset button
    resetButton.addEventListener('mousedown', (evt) => {
        evt.stopPropagation();
    });

    // Button container to hold both buttons side by side.
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
            console.error('Lottery: Location variables state:', {
                GG_ROUND_exists: typeof GG_ROUND !== 'undefined',
                GG_LOC_exists: typeof GG_LOC !== 'undefined',
                GG_CLICK_exists: typeof GG_CLICK !== 'undefined'
            });

            // Try to wait a bit and retry
            button.textContent = 'Waiting for location...';
            button.disabled = true;

            setTimeout(async () => {
                const retryActual = getActualLoc();
                if (!retryActual || isNaN(retryActual.lat) || isNaN(retryActual.lng)) {
                    console.error('Lottery: Location still not available after retry');
                    button.textContent = 'Location error';
                    setTimeout(() => {
                        button.textContent = 'Insert token';
                        button.disabled = false;
                    }, 2000);
                    return;
                } else {
                    // Continue with the retry actual location
                    continueWithLocation(retryActual);
                }
            }, 1000);
            return;
        }

        // Continue with the main logic
        continueWithLocation(actual);

        async function continueWithLocation(actual) {

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
            const rawMinLat = actual.lat - nDegLat;
            const rawMaxLat = actual.lat + nDegLat;
            let minLat = Math.max(_MERCATOR_LAT_MIN, rawMinLat);
            let maxLat = Math.min(_MERCATOR_LAT_MAX, rawMaxLat);

            // Ensure we have valid latitude bounds
            if (minLat >= maxLat) {
                minLat = Math.max(_MERCATOR_LAT_MIN, actual.lat - 10);
                maxLat = Math.min(_MERCATOR_LAT_MAX, actual.lat + 10);
            }

            // The logic gets confusing across the prime meridian with large lng ranges.
            // Just assume that [-180, 180] means the entire world's longitude. Should be fine.
            let minLng, maxLng;
            if (nDegLng === 180) {
                minLng = -179.9999;
                maxLng = 179.9999;
            } else {
                const normalizedLng = ((actual.lng + 180) % 360 + 360) % 360 - 180;
                minLng = normalizedLng - nDegLng;
                maxLng = normalizedLng + nDegLng;
            }

            // Validate longitude bounds
            if (minLng == null || maxLng == null || isNaN(minLng) || isNaN(maxLng)) {
                console.warn('Lottery: Invalid longitude bounds detected, using fallback');
                minLng = -179.9999;
                maxLng = 179.9999;
            }

            // Generate location with criteria if any special options are enabled
            let location;
            if (onlyStreetView || onlyLand) {
                // Check if API key is available for these features
                if (!hasGoogleApiKey()) {
                    console.warn('Lottery mod: API-dependent features (Only Street View/Only Land) attempted without Google Maps API key');
                    button.textContent = 'API key required';
                    button.disabled = true;
                    setTimeout(() => {
                        button.textContent = 'Insert token';
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
                location = getRandomLocSinusoidal(minLat, maxLat, minLng, maxLng);
            }

            const { lat, lng } = location;

            // Must be within Mercator bounds.
            const finalLat = Math.max(_MERCATOR_LAT_MIN, Math.min(_MERCATOR_LAT_MAX, lat));
            const finalLng = Math.max(_MERCATOR_LNG_MIN, Math.min(_MERCATOR_LNG_MAX, lng));

            // Validate that coordinates are valid numbers before proceeding
            if (isNaN(finalLat) || isNaN(finalLng)) {
                button.textContent = 'Coordinate error';
                setTimeout(() => {
                    button.textContent = 'Insert token';
                }, 2000);
                return;
            }

            _LOTTERY_COUNT -= 1;
            counter.innerText = _LOTTERY_COUNT;

            // Temporarily disable click blocking for this programmatic click
            THE_WINDOW._LOTTERY_ALLOWING_CLICK = true;
            clickAt(finalLat, finalLng);
            // Re-enable click blocking after a short delay
            setTimeout(() => {
                THE_WINDOW._LOTTERY_ALLOWING_CLICK = false;
            }, 100);

            setMapCenter(finalLat, finalLng);
        } // End of continueWithLocation function
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

const removeClickBlock = () => {
    const container = getGuessmapContainer();
    if (!container) {
        return;
    }
    const overlay = container.querySelector('.gg-lottery-overlay');
    if (!overlay) {
        return;
    }
    if (overlay._overlayEventListeners) {
        overlay._overlayEventListeners.forEach(({ event, handler, options }) => {
            overlay.removeEventListener(event, handler, options);
        });
    }
    overlay.remove();
};

const addClickBlock = () => {
    removeClickBlock();

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
        if (evt.type === 'click') {
            evt.preventDefault();
            evt.stopPropagation();
        }
    };
    overlay.style.pointerEvents = 'auto';
    overlay.addEventListener('click', overlayClickHandler, true);

    const container = getGuessmapContainer();
    container.insertBefore(overlay, container.firstChild);
};

const resetTokens = () => {
    const mod = MODS.lottery;
    _LOTTERY_COUNT = getOption(mod, 'nGuesses');

    // Update the counter display if it exists
    const counter = document.getElementById('gg-lottery-counter');
    if (counter) {
        counter.innerText = _LOTTERY_COUNT;
    }
};

const updateLottery = (forceState = undefined) => {
    const mod = MODS.lottery;
    const active = updateMod(mod, forceState);

    if (!active || !areModsAvailable()) {
        removeLotteryDisplay();
        removeClickBlock();
        return;
    }

    disableConflictingMods(mod);

    if (!_LOTTERY_DISPLAY) {
        _LOTTERY_COUNT = getOption(mod, 'nGuesses');
        makeLotteryDisplay();
    }
    const counter = document.getElementById('gg-lottery-counter');
    counter.innerText = _LOTTERY_COUNT

    if (getOption(mod, 'resetEachRound')) {
        resetTokens();
    }
    addClickBlock();

    saveState();
};
