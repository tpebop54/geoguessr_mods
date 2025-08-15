// ==UserScript==
// @author       tpebop

// ==/UserScript==

// Intercept google maps API files so we can add custom map behavior. Configure GeoGuessr framework.
// ===============================================================================================================================

// Script injection, extracted from extenssr:
// https://gitlab.com/nonreviad/extenssr/-/blob/main/src/injected_scripts/maps_api_injecter.ts
const overrideOnLoad = (googleScript, observer, overrider) => {
    const oldOnload = googleScript.onload;
    googleScript.onload = (event) => {
        const google = getGoogle();
        if (google) {
            observer.disconnect();
            overrider(google);
        }
        if (oldOnload) {
            oldOnload.call(googleScript, event);
        }
    }
}

const grabGoogleScript = (mutations) => {
    for (const mutation of mutations) {
        for (const newNode of mutation.addedNodes) {
            const asScript = newNode;
            if (asScript && asScript.src && asScript.src.startsWith('https://maps.googleapis.com/')) {
                return asScript;
            }
        }
    }
    return null;
};

const injecter = (overrider) => {
    new MutationObserver((mutations, observer) => {
        const googleScript = grabGoogleScript(mutations);
        if (googleScript) {
            overrideOnLoad(googleScript, observer, overrider);
        }
    }).observe(document.documentElement, { childList: true, subtree: true });
};

const onMapClick = (evt) => {
    const lat = evt.latLng.lat();
    const lng = evt.latLng.lng();
    GG_CLICK = { lat, lng };
    const event = new CustomEvent('map_click', { detail: GG_CLICK });
    document.dispatchEvent(event, { bubbles: true });
};

const initGoogle = () => {
    const google = getGoogle();
    if (!google) {
        const err = 'Google was not initialized properly. Refresh the page.';
        throw new Error(err);
    }
    GOOGLE_SVC = new google.maps.ImageMapType({
        getTileUrl: (point, zoom) => `https://www.google.com/maps/vt?pb=!1m7!8m6!1m3!1i${zoom}!2i${point.x}!3i${point.y}!2i9!3x1!2m8!1e2!2ssvv!4m2!1scc!2s*211m3*211e2*212b1*213e2*212b1*214b1!4m2!1ssvl!2s*211b0*212b1!3m8!2sen!3sus!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m4!1e0!8m2!1e1!1e1!6m6!1e12!2i2!11e0!39b0!44e0!50e`,
        tileSize: new google.maps.Size(256, 256),
        maxZoom: 9,
        minZoom: 0,
    });
};

const isMapReady = (map) => {
    const google = getGoogle();
    if (!map || !google) {
        return false;
    }
    try {
        if (map.constructor === google.maps.Map || map.constructor.isPrototypeOf(google.maps.Map)) {
            const mapDiv = map.getDiv();
            return !!mapDiv;
        }
        else if (map.constructor === google.maps.StreetViewPanorama || map.constructor.isPrototypeOf(google.maps.StreetViewPanorama)) {
            const visible = map.getVisible();
            return !!visible;
        } else {
            console.error(`Unknown map constructor ${map.constructor}`);
            return false;
        }
    } catch (err) {
        console.error(err);
        return false;
    }
};

const initGmapsIntegration = () => {
    document.addEventListener('ggCoordinates', (evt) => { // Used for duels.
        GG_LOC = evt.detail;
    });

    injecter(() => {
        const google = getGoogle();
        if (!google) {
            return;
        }

        google.maps.Map = class extends google.maps.Map {
            constructor(...args) {
                super(...args);

                // Check if Opera browser - it has issues with Vector rendering
                const isOpera = typeof isOperaBrowser === 'function' ? isOperaBrowser() :
                    ((!!THE_WINDOW.opr && !!opr.addons) || !!THE_WINDOW.opera || navigator.userAgent.indexOf(' OPR/') >= 0);

                try {
                    if (isOpera) {
                        // Opera fallback: use raster rendering
                        console.debug('Opera browser detected, using raster rendering for map compatibility');
                        this.setRenderingType(google.maps.RenderingType.RASTER);
                    } else {
                        // Other browsers: use vector rendering
                        this.setRenderingType(google.maps.RenderingType.VECTOR);
                    }
                } catch (err) {
                    console.debug('Error setting rendering type, falling back to raster:', err);
                    // Fallback to raster if vector fails
                    try {
                        this.setRenderingType(google.maps.RenderingType.RASTER);
                    } catch (fallbackErr) {
                        console.error('Fallback to raster also failed:', fallbackErr);
                    }
                }

                this.setHeadingInteractionEnabled(true);
                this.setTiltInteractionEnabled(true);
                GOOGLE_MAP = this; // GG_GUESSMAP is used for the active round, this is used for the Google map event listeners.

                google.maps.event.addListener(this, 'dragstart', () => {
                    _IS_DRAGGING_GUESSMAP = true;
                });
                google.maps.event.addListener(this, 'dragend', () => {
                    _IS_DRAGGING_GUESSMAP = false;
                });
                google.maps.event.addListener(this, 'click', (evt) => {
                    onMapClick(evt);
                });
                google.maps.event.addListener(this, 'tilesloaded', () => {
                    THE_WINDOW.dispatchEvent(new CustomEvent('gg_map_tiles_loaded', { detail: this }));
                });
                google.maps.event.addListenerOnce(this, 'idle', () => {
                    THE_WINDOW.dispatchEvent(new CustomEvent('gg_map_2d_ready', { detail: this }));
                });
                google.maps.event.addListener(this, 'idle', () => {
                    THE_WINDOW.dispatchEvent(new CustomEvent('gg_map_2d_idle', { detail: this }));
                });
                google.maps.event.addListener(this, 'bounds_changed', () => {
                    THE_WINDOW.dispatchEvent(new CustomEvent('gg_map_bounds_changed', { detail: this }));
                });
                setTimeout(() => {
                    THE_WINDOW.dispatchEvent(new CustomEvent('gg_new_map_instance', {
                        detail: { type: '2d', map: this }
                    }));
                }, 100);
            }
        }

        google.maps.StreetViewPanorama = class extends google.maps.StreetViewPanorama {
            constructor(...args) {
                super(...args);
                GOOGLE_STREETVIEW = this;
                THE_WINDOW.dispatchEvent(new CustomEvent('gg_streetview_ready', { detail: this }));

                google.maps.event.addListener(this, 'position_changed', () => {
                    THE_WINDOW.dispatchEvent(new CustomEvent('gg_streetview_position_changed', { detail: this }));
                });

                google.maps.event.addListener(this, 'pano_changed', () => {
                    THE_WINDOW.dispatchEvent(new CustomEvent('gg_streetview_pano_changed', { detail: this }));
                });
                this.addListener('status_changed', () => {
                    if (this.getStatus() === google.maps.StreetViewStatus.OK) {
                        THE_WINDOW.dispatchEvent(new CustomEvent('gg_streetview_ready', { detail: this }));
                    }
                });
                setTimeout(() => {
                    THE_WINDOW.dispatchEvent(new CustomEvent('gg_new_map_instance', {
                        detail: { type: '3d', streetview: this }
                    }));
                }, 100);
            }
        };

        const waitForMapsToLoad = (callback, intervalMs = 100, timeout = 5000) => {
            const startTime = Date.now();
            const checkInterval = setInterval(() => {
                const map2dReady = GOOGLE_MAP && isMapReady(GOOGLE_MAP);

                // TODO: figure out why this is flaky. For now we'll just look at the 2D map,
                //     which should be fine because we don't directly interact with the StreetViewPanorama.
                // const map3dReady = GOOGLE_STREETVIEW && isMapReady(GOOGLE_STREETVIEW);
                const map3dReady = true;

                if (map2dReady && map3dReady) {
                    clearInterval(checkInterval);
                    callback();
                    return;
                }
                if (Date.now() - startTime > timeout) {
                    clearInterval(checkInterval);
                    console.warn('Timeout: Maps did not become ready within expected time');
                }
            }, intervalMs);
        };
        waitForMapsToLoad(() => {
            const event = new CustomEvent('gg_maps_ready');
            document.dispatchEvent(event, { bubbles: true });
        });
        initGoogle();
    });
};

// Start the Google Maps integration when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGmapsIntegration);
} else {
    initGmapsIntegration();
}
