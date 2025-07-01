// ==UserScript==
// @name         GG Mod Lottery
// @description  Lottery guessing mod for GeoGuessr
// @version      1.0
// @author       tpebop

// ==/UserScript==

// MOD: Lottery.
// ===============================================================================================================================

let _LOTTERY_DISPLAY; // Display elements for lottery mod. (counter and button).
let _LOTTERY_COUNT; // How many remaining guesses you have.
let _LOTTERY_DRAGGING = false; // Makes lottery display draggable because it overlaps the menu.

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
    container.onmousedown = () => _LOTTERY_DRAGGING = true;
    document.onmousemove = (evt) => _LOTTERY_DRAGGING && (container.style.left = evt.clientX - 50 + 'px', container.style.top = evt.clientY - 25 + 'px');
    document.onmouseup = () => _LOTTERY_DRAGGING = false;
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

    container.appendChild(counterDiv);
    container.appendChild(button);
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
};

const updateLottery = (forceState = null) => {
    const mod = MODS.lottery;
    const active = updateMod(mod, forceState);

    removeLotteryDisplay();
    _LOTTERY_COUNT = getOption(mod, 'nGuesses');

    const smallMap = getSmallMap();
    if (active) {
        makeLotteryDisplay();
        setGuessMapEvents(false);
    } else {
        const container = document.querySelector(`#gg-lottery`);
        if (container) {
            container.parentElement.removeChild(container);
        }
        setGuessMapEvents(true);
    }
};
