// ==UserScript==
// @author       tpebop

// ==/UserScript==

// MOD: In frame or not.
// ===============================================================================================================================

let IN_FRAME_INTERVAL;
let IN_FRAME_ROUND_START_LISTENER_ADDED = false;

const updateInFrameLogic = (forceState = undefined) => {
    const mod = MODS.inFrame;
    const active = updateMod(mod, forceState);

    const smallMapContainer = getSmallMapContainer();
    
    // Clear any existing interval
    if (IN_FRAME_INTERVAL) {
        clearInterval(IN_FRAME_INTERVAL);
        IN_FRAME_INTERVAL = null;
    }

    if (active && smallMapContainer) {
        if (!GOOGLE_MAP) {
            console.warn('InFrame: GOOGLE_MAP not available');
            return;
        }
        
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
            }
        };
        
        IN_FRAME_INTERVAL = setInterval(showInFrame, 100);
    } else {
        // Clean up styling when disabled
        if (smallMapContainer) {
            const smallMapStyle = {
                'box-shadow': '',
                'border-radius': '',
            };
            Object.assign(smallMapContainer.style, smallMapStyle);
        }
    }
};

const updateInFrame = (forceState = undefined) => {
    // Add round start listener if not already added and mod is being activated
    if (!IN_FRAME_ROUND_START_LISTENER_ADDED && typeof GEF !== 'undefined' && GEF.events) {
        GEF.events.addEventListener('round_start', () => {
            if (MODS.inFrame.active) {
                setTimeout(() => {
                    waitForMapsReady(() => {
                        updateInFrameLogic();
                    }, {
                        require2D: true,
                        require3D: false,
                        modName: 'InFrame (round start)',
                        timeout: 5000
                    });
                }, 1000); // Wait a bit for round to fully initialize
            }
        });
        IN_FRAME_ROUND_START_LISTENER_ADDED = true;
    }
    
    // Add custom round start event listener
    THE_WINDOW.addEventListener('gg_round_start', (evt) => {
        if (MODS.inFrame.active) {
            setTimeout(() => {
                waitForMapsReady(() => {
                    updateInFrameLogic();
                }, {
                    require2D: true,
                    require3D: false,
                    modName: 'InFrame (custom round start)',
                    timeout: 5000
                });
            }, 1000);
        }
    });
    
  
    THE_WINDOW.addEventListener('gg_mods_reactivate', (evt) => {
        if (MODS.inFrame.active) {
            setTimeout(() => {
                waitForMapsReady(() => {
                    updateInFrameLogic();
                }, {
                    require2D: true,
                    require3D: false,
                    modName: 'InFrame (reactivation)',
                    timeout: 5000
                });
            }, 1000);
        }
    });
    
    // Use the map-safe update system
    if (forceState === false) {
        // Deactivating - no need to wait for maps
        updateInFrameLogic(forceState);
    } else {
        // Activating or toggling - wait for maps
        waitForMapsReady(() => {
            updateInFrameLogic(forceState);
        }, {
            require2D: true,
            require3D: false,
            modName: 'InFrame',
            timeout: 5000
        });
    }
};
