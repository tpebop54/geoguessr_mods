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
    console.log('GeoGuessr MultiMod: Creating lottery display, count:', _LOTTERY_COUNT);
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

    container.appendChild(counterDiv);
    container.appendChild(button);
    document.body.appendChild(container);

    _LOTTERY_DISPLAY = container;

    // Bind stuff.
    const onClick = () => {
        // Check if round is active and we have tokens
        const hasActiveRound = typeof GG_ROUND !== 'undefined' && GG_ROUND;
        if (!hasActiveRound) {
            console.log('GeoGuessr MultiMod: Cannot use lottery token - no active round');
            return;
        }
        
        if (_LOTTERY_COUNT === 0) {
            console.log('GeoGuessr MultiMod: Cannot use lottery token - no tokens remaining');
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
        
        console.log('GeoGuessr MultiMod: Lottery token used, remaining:', _LOTTERY_COUNT);
    };
    button.addEventListener('click', onClick);
};

const updateLottery = (forceState = null) => {
    const mod = MODS.lottery;
    const active = updateMod(mod, forceState);
    
    console.log('GeoGuessr MultiMod: updateLottery called, active:', active, 'GG_ROUND exists:', typeof GG_ROUND !== 'undefined' && GG_ROUND);

    removeLotteryDisplay();

    const smallMap = getSmallMap();
    if (active) {
        // Reset lottery count to the configured number of guesses
        _LOTTERY_COUNT = getOption(mod, 'nGuesses');
        console.log('GeoGuessr MultiMod: Lottery activated, token count:', _LOTTERY_COUNT);
        
        // Always show the display when mod is active
        makeLotteryDisplay();
        
        // Update button state based on round availability
        updateLotteryButtonState();
        
        setGuessMapEvents(false);
    } else {
        console.log('GeoGuessr MultiMod: Lottery deactivated');
        const container = document.querySelector(`#gg-lottery`);
        if (container) {
            container.parentElement.removeChild(container);
        }
        setGuessMapEvents(true);
    }
};

// Update button state based on round availability
const updateLotteryButtonState = () => {
    const button = document.getElementById('gg-lottery-button');
    const counterLabel = document.querySelector('#gg-lottery-counter-div div:first-child');
    
    if (!button || !counterLabel) return;
    
    const hasActiveRound = typeof GG_ROUND !== 'undefined' && GG_ROUND;
    
    if (hasActiveRound) {
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
        button.disabled = false;
        counterLabel.textContent = 'Tokens remaining:';
        button.title = '';
    } else {
        button.style.opacity = '0.5';
        button.style.cursor = 'not-allowed';
        button.disabled = true;
        counterLabel.textContent = 'Waiting for round:';
        button.title = 'Start a round to use lottery tokens';
    }
};

// Function to handle round start events for the lottery mod
const onLotteryRoundStart = () => {
    const mod = MODS.lottery;
    if (isModActive(mod)) {
        // Reset lottery count for new round
        _LOTTERY_COUNT = getOption(mod, 'nGuesses');
        
        // Update the counter display
        const counter = document.getElementById('gg-lottery-counter');
        if (counter) {
            counter.innerText = _LOTTERY_COUNT;
        }
        
        // Update button state for active round
        updateLotteryButtonState();
        
        console.log('GeoGuessr MultiMod: Lottery reset for new round, tokens:', _LOTTERY_COUNT);
    }
};

// Function to handle round end events for the lottery mod
const onLotteryRoundEnd = () => {
    const mod = MODS.lottery;
    if (isModActive(mod)) {
        // Update button state for inactive round
        updateLotteryButtonState();
        console.log('GeoGuessr MultiMod: Lottery round ended, button disabled');
    }
};

// Monitor for round changes to show/hide lottery display appropriately
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
