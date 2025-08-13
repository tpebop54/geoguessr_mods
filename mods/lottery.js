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

function generateRandomCoordinates() { // Generate uniform distribution within Mercator bounds.
    const minLat = -85.05112878;
    const maxLat = 85.05112878;
    const u = Math.random() * (Math.sin(maxLat * Math.PI / 180) - Math.sin(minLat * Math.PI / 180)) + Math.sin(minLat * Math.PI / 180);
    const lat = Math.asin(u) * (180 / Math.PI);
    const lng = (Math.random() * 360) - 180;
    return { lat, lng };
};

const generateWeightedCoordinates = () => { // Uses pre-generated map distribution of a large number of coordinates to pick randomly from.
    if (!LOTTERY_LATLNGS) {
        debugger;
    }
    return LOTTERY_LATLNGS[Math.floor(Math.random() * LOTTERY_LATLNGS.length)];
};

const generateLotteryCoordinates = (useMap, randomPct) => {
    if (useMap) {
        const random = Math.random() * randomPct;
        if (random < percentage) {
            return generateRandomCoordinates();
        } else {
            return generateWeightedCoordinates();
        }
    }
};

const onClick = () => {
    if (_LOTTERY_COUNT === 0) {
        return;
    }

    const mod = MODS.lottery;
    const nDegLat = getOption(mod, 'nDegLat');
    const nDegLng = getOption(mod, 'nDegLng');

    const actual = getActualLoc();
    if (!actual || nDegLat < 0 || nDegLat > 90) {
        nDegLat = 0;
    }
    if (!actual || nDegLng < 0 || nDegLng > 180) {
        nDegLng = 0;
    }

    // Calculate latitude bounds and clamp to safe Mercator projection limits
    let minLat = Math.max(_MERCATOR_LAT_MIN, actual.lat - nDegLat);
    let maxLat = Math.min(_MERCATOR_LAT_MAX, actual.lat + nDegLat);

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
    if (sNaN(minLng) || isNaN(maxLng)) {
        minLng = -179.9999;
        maxLng = 179.9999;
    }

    let location;
    location = getRandomLocSinusoidal(minLat, maxLat, minLng, maxLng);

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

    clickAt(finalLat, finalLng);

    setMapCenter(finalLat, finalLng);
};
button.addEventListener('click', onClick);

const onReset = () => {
    const mod = MODS.lottery;
    _LOTTERY_COUNT = getOption(mod, 'nTokens');
    counter.innerText = _LOTTERY_COUNT;
};
resetButton.addEventListener('click', onReset);

const makeLotteryDisplay = () => { // Make the div and controls for the lottery.
    if (!areModsAvailable()) {
        return;
    }

    removeLotteryDisplay();

    const container = document.createElement('div'); // Contains the full lottery display.
    container.id = 'gg-lottery';
    container.classList.add('gg-persistent-container');

    container.addEventListener('mousedown', (evt) => {
        _LOTTERY_DRAGGING = true;
        const rect = container.getBoundingClientRect();
        container.style.left = rect.left + 'px';
        container.style.top = rect.top + 'px';
        _LOTTERY_DRAGGING_OFFSET_X = evt.clientX - rect.left;
        _LOTTERY_DRAGGING_OFFSET_Y = evt.clientY - rect.top;
        evt.preventDefault(); // Prevent text selection during drag.
    });
    document.addEventListener('mousemove', (evt) => {
        if (_LOTTERY_DRAGGING) {
            container.style.left = evt.clientX - _LOTTERY_DRAGGING_OFFSET_X + 'px';
            container.style.top = evt.clientY - _LOTTERY_DRAGGING_OFFSET_Y + 'px';
            evt.preventDefault(); // Prevent text selection during drag.
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
    resetButton.innerHTML = '↻';
    resetButton.title = 'Reset token count';

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
};

const resetTokens = () => {
    const mod = MODS.lottery;
    _LOTTERY_COUNT = getOption(mod, 'nTokens');

    // Update the counter display if it exists
    const counter = document.getElementById('gg-lottery-counter');
    if (counter) {
        counter.innerText = _LOTTERY_COUNT;
    }
    saveState();
};

const updateLottery = (forceState = undefined) => {
    const mod = MODS.lottery;
    const active = updateMod(mod, forceState);

    if (!active || !areModsAvailable()) {
        removeLotteryDisplay();
        return;
    }

    disableConflictingMods(mod);

    if (getOption(mod, 'resetEachRound')) {
        resetTokens();
    }

    if (!_LOTTERY_DISPLAY) {
        _LOTTERY_COUNT = getOption(mod, 'nTokens');
        makeLotteryDisplay();
    }

    waitForMapsReady();

    saveState();
};
