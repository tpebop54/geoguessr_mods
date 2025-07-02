// ==UserScript==
// @author       tpebop

// ==/UserScript==

// MOD: Zoom-in only.
// ===============================================================================================================================

let ZOOM_LISTENER;
let HAS_ZOOMED_IN = false;
let PREV_ZOOM;
let INITIAL_BOUNDS;

const setRestriction = (latLngBounds, zoom) => {
    if (!GOOGLE_MAP) {
        console.warn('Zoom mod: GOOGLE_MAP not available');
        return;
    }
    try {
        const restriction = {
            latLngBounds,
            strictBounds: false,
        };
        GOOGLE_MAP.setOptions({ restriction: restriction, minZoom: zoom });
    } catch (err) {
        console.error('Zoom mod: Error setting restriction:', err);
    }
};

const updateZoomInOnlyLogic = (forceState = null) => {
    const mod = MODS.zoomInOnly;
    const active = updateMod(mod, forceState);
    
    if (!GOOGLE_MAP) {
        console.warn('Zoom mod: GOOGLE_MAP not available');
        return;
    }
    
    try {
        if (PREV_ZOOM === undefined) {
            PREV_ZOOM = GOOGLE_MAP.getZoom();
        }
        if (!INITIAL_BOUNDS) {
            INITIAL_BOUNDS = getMapBounds();
        }

        if (active) {
            ZOOM_LISTENER = GOOGLE_MAP.addListener('zoom_changed', () => {
                const newZoom = GOOGLE_MAP.getZoom();
                if (newZoom > PREV_ZOOM) {
                    HAS_ZOOMED_IN = true;
                }
                if (HAS_ZOOMED_IN) {
                    const google = getGoogle();
                    google.maps.event.addListenerOnce(GOOGLE_MAP, 'idle', () => { // Zoom animation occurs after zoom is set.
                        const latLngBounds = getMapBounds();
                        setRestriction(latLngBounds, GOOGLE_MAP.getZoom());
                    });
                }
                PREV_ZOOM = newZoom;
            });
            console.debug('Zoom mod: Enabled zoom-in only mode');
        } else {
            if (ZOOM_LISTENER) {
                const google = getGoogle();
                google.maps.event.removeListener(ZOOM_LISTENER);
                ZOOM_LISTENER = undefined;
            }
            HAS_ZOOMED_IN = false;
            PREV_ZOOM = undefined;
            setRestriction(INITIAL_BOUNDS, 1); // The maps API seems to only allow zooming back out the level when mod was disabled.
            console.debug('Zoom mod: Disabled zoom-in only mode');
        }
    } catch (err) {
        console.error('Zoom mod: Error in update logic:', err);
    }
};

const updateZoomInOnly = createMapSafeModUpdate(updateZoomInOnlyLogic, {
    require2D: true,
    require3D: false,
    modName: 'Zoom mod',
    timeout: 5000
});
