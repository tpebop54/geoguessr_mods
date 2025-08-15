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

const _LOTTERY_LOCS = [].concat(...Object.values(THE_WINDOW.latlngs)) // Override this to test out specific sub-maps.
// const _LOTTERY_LOCS = THE_WINDOW.latlngs.europe;

const removeLotteryDisplay = () => {
    if (_LOTTERY_DISPLAY) {
        _LOTTERY_DISPLAY.parentElement.removeChild(_LOTTERY_DISPLAY);
        _LOTTERY_DISPLAY = undefined;
    }
};

const getLotteryCounter = () => {
    return document.getElementById('gg-lottery-counter');
};

const insertToken = () => {
    if (_LOTTERY_COUNT === 0) {
        return;
    }
    const mod = MODS.lottery;
    let useMap = getOption(mod, 'useCoverageMap');
    let randomPct = getOption(mod, 'randomPct');
    const loc = getWeightedOrRandomLoc(_LOTTERY_LOCS, useMap, randomPct, 0);
    let { lat, lng } = loc;

    lat = Math.max(_MERCATOR_LAT_MIN, Math.min(_MERCATOR_LAT_MAX, lat));
    lng = Math.max(_MERCATOR_LNG_MIN, Math.min(_MERCATOR_LNG_MAX, lng));

    _LOTTERY_COUNT -= 1;
    const counter = getLotteryCounter();
    if (counter) {
        counter.innerText = _LOTTERY_COUNT;
    }
    saveState();
    clickAt(lat, lng);
    setMapCenter(lat, lng);
};

const resetTokens = () => {
    const mod = MODS.lottery;
    _LOTTERY_COUNT = getOption(mod, 'nTokens');
    const counter = getLotteryCounter();
    if (counter) {
        counter.innerText = _LOTTERY_COUNT;
    }
    saveState();
};

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

    const insertButton = document.createElement('button');
    insertButton.id = 'gg-lottery-button';
    insertButton.classList.add('gg-interactive-button');
    insertButton.textContent = 'Insert token';
    insertButton.addEventListener('mousedown', (evt) => { // Disable dragging.
        evt.stopPropagation();
    });
    insertButton.addEventListener('click', insertToken);

    const resetButton = document.createElement('button');
    resetButton.id = 'gg-lottery-reset-button';
    resetButton.classList.add('gg-interactive-button');
    resetButton.classList.add('gg-reset-button');
    resetButton.innerHTML = '↻';
    resetButton.title = 'Reset token count';
    resetButton.addEventListener('mousedown', (evt) => { // Disble dragging.
        evt.stopPropagation();
    });
    resetButton.addEventListener('click', resetTokens);

    // Button container to hold both buttons side by side.
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'gg-lottery-button-container';
    buttonContainer.appendChild(insertButton);
    buttonContainer.appendChild(resetButton);

    container.appendChild(counterDiv);
    container.appendChild(buttonContainer);
    document.body.appendChild(container);

    _LOTTERY_DISPLAY = container;
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
    if (_LOTTERY_COUNT == null) {
        _LOTTERY_COUNT = getOption(mod, 'nTokens');
    }
    makeLotteryDisplay();
    waitForMapsReady();
    saveState();
};
