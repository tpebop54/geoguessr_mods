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
    const restriction = {
        latLngBounds,
        strictBounds: false,
    };
    GOOGLE_MAP.setOptions({ restriction: restriction, minZoom: zoom });
};

const updateZoomInOnly = (forceState = null) => {
    const mod = MODS.zoomInOnly;
    const active = updateMod(mod, forceState);
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
    } else {
        if (ZOOM_LISTENER) {
            const google = getGoogle();
            google.maps.event.removeListener(ZOOM_LISTENER);
            ZOOM_LISTENER = undefined;
        }
        HAS_ZOOMED_IN = false;
        PREV_ZOOM = undefined;
        setRestriction(INITIAL_BOUNDS, 1); // The maps API seems to only allow zooming back out the level when mod was disabled.
    }
};
