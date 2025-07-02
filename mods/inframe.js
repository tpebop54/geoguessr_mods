// ==UserScript==
// @author       tpebop

// ==/UserScript==

// MOD: In frame or not.
// ===============================================================================================================================

let IN_FRAME_INTERVAL;
let IN_FRAME_INITIALIZATION_ATTEMPTS = 0;
const MAX_INITIALIZATION_ATTEMPTS = 50; // 5 seconds worth of attempts
let IN_FRAME_ROUND_START_LISTENER_ADDED = false;

const isInFrameReady = () => {
    const smallMapContainer = getSmallMapContainer();
    const hasGoogleMap = typeof GOOGLE_MAP !== 'undefined' && GOOGLE_MAP;
    const hasActualLoc = getActualLoc();
    
    return smallMapContainer && hasGoogleMap && hasActualLoc;
};

const initializeInFrame = (forceState = null) => {
    if (!isInFrameReady()) {
        IN_FRAME_INITIALIZATION_ATTEMPTS++;
        if (IN_FRAME_INITIALIZATION_ATTEMPTS < MAX_INITIALIZATION_ATTEMPTS) {
            console.debug(`InFrame: Dependencies not ready, attempt ${IN_FRAME_INITIALIZATION_ATTEMPTS}/${MAX_INITIALIZATION_ATTEMPTS}`);
            setTimeout(() => initializeInFrame(forceState), 100);
            return;
        } else {
            console.warn('InFrame: Max initialization attempts reached, some dependencies may not be available');
        }
    }
    
    console.debug('InFrame: Initializing with dependencies ready');
    updateInFrameLogic(forceState);
};

const updateInFrameLogic = (forceState = null) => {
    const mod = MODS.inFrame;
    const active = updateMod(mod, forceState);

    const smallMapContainer = getSmallMapContainer();
    
    // Clear any existing interval
    if (IN_FRAME_INTERVAL) {
        clearInterval(IN_FRAME_INTERVAL);
        IN_FRAME_INTERVAL = null;
    }

    if (active && smallMapContainer) {
        const showInFrame = () => {
            try {
                const actual = getActualLoc();
                if (!actual || !GOOGLE_MAP) {
                    return; // Skip this iteration if dependencies aren't ready
                }
                
                const currentBounds = getMapBounds();
                if (!currentBounds) {
                    return; // Skip this iteration if bounds aren't available
                }
                
                const inFrame = isInBounds(actual, currentBounds);
                const color = inFrame ? 'green' : 'red';

                const smallMapStyle = {
                    'box-shadow': `0 0 10px 10px ${color}`,
                    'border-radius': '10px',
                };
                Object.assign(smallMapContainer.style, smallMapStyle);
            } catch (err) {
                console.debug('InFrame: Error in showInFrame:', err);
            }
        };
        
        IN_FRAME_INTERVAL = setInterval(showInFrame, 100);
        console.debug('InFrame: Interval started');
    } else {
        // Clean up styling when disabled
        if (smallMapContainer) {
            const smallMapStyle = {
                'box-shadow': '',
                'border-radius': '',
            };
            Object.assign(smallMapContainer.style, smallMapStyle);
        }
        console.debug('InFrame: Disabled and cleaned up');
    }
};

const updateInFrame = (forceState = null) => {
    // Reset initialization attempts for each activation
    IN_FRAME_INITIALIZATION_ATTEMPTS = 0;
    
    // Check if this is an activation and dependencies aren't ready
    const mod = MODS.inFrame;
    const wouldBeActive = forceState !== null ? forceState : !mod.active;
    
    // Add round start listener if not already added and mod is being activated
    if (wouldBeActive && !IN_FRAME_ROUND_START_LISTENER_ADDED && typeof GEF !== 'undefined' && GEF.events) {
        GEF.events.addEventListener('round_start', () => {
            console.debug('InFrame: Round start detected, re-initializing');
            if (MODS.inFrame.active) {
                setTimeout(() => {
                    IN_FRAME_INITIALIZATION_ATTEMPTS = 0;
                    initializeInFrame();
                }, 1000); // Wait a bit for round to fully initialize
            }
        });
        IN_FRAME_ROUND_START_LISTENER_ADDED = true;
        console.debug('InFrame: Round start listener added');
    }
    
    if (wouldBeActive && !isInFrameReady()) {
        console.debug('InFrame: Mod being activated but dependencies not ready, starting initialization');
        initializeInFrame(forceState);
    } else {
        // Dependencies are ready or we're deactivating, proceed normally
        updateInFrameLogic(forceState);
    }
};
