// ==UserScript==
// @author       tpebop

// ==/UserScript==

// Loading page overlay and cheat protection (unless disabled in installer file).
// ===============================================================================================================================


let _QUOTES_FLAT; // String[] of overlay quotes, used only if enabled.
let _LOAD_OVERLAY; // Div to block view.

const initQuotesFlat = () => {
    if (_QUOTES_FLAT) {
        return;
    }
    _QUOTES_FLAT = [];
    for (const quotesThisCategory of Object.values(THE_WINDOW._QUOTES || {})) {
        _QUOTES_FLAT.push(...quotesThisCategory);
    }
};
initQuotesFlat();

function isChromiumBased() {
    const ua = navigator.userAgent;
    const isChromium = ua.includes('Chrome') || ua.includes('Chromium');
    if (ua.includes('Edg')) return [isChromium, 'Edge'];
    if (ua.includes('OPR') || ua.includes('Opera')) return [isChromium, 'Opera'];
    if (ua.includes('Chrome')) return [isChromium, 'Chrome'];
    if (ua.includes('Safari') && !ua.includes('Chrome')) return [false, 'Safari'];
    if (ua.includes('Firefox')) return [false, 'Firefox'];
    return [isChromium, 'Unknown'];
}

const getOverlayText = () => {
    if (!!THE_WINDOW.ENABLE_QUOTES) {
        const ix = Math.floor(Math.random() * _QUOTES_FLAT.length);
        const quote = _QUOTES_FLAT[ix];
        return quote;
    }
    return 'Loading...';
};

const splitQuote = (quote) => {  // Split the quote and the author by the dash character.
    const parts = quote.split('—').map(part => part.trim());
    return parts;
};

const clearLoadOverlay = () => {
    if (_LOAD_OVERLAY && document.body.contains(_LOAD_OVERLAY)) {
        _LOAD_OVERLAY.style.transition = 'opacity 0.3s ease-out';
        _LOAD_OVERLAY.style.opacity = '0';

        setTimeout(() => {
            if (_LOAD_OVERLAY && document.body.contains(_LOAD_OVERLAY)) {
                try {
                    _LOAD_OVERLAY.parentElement.removeChild(_LOAD_OVERLAY);
                } catch (err) {
                    try {
                        document.body.removeChild(_LOAD_OVERLAY);
                    } catch (err2) {
                        _LOAD_OVERLAY.style.display = 'none';
                        _LOAD_OVERLAY.style.visibility = 'hidden';
                    }
                }
                _LOAD_OVERLAY = undefined;
            }
        }, 300);
    }
};

const createTextDiv = () => { // Loading... or a quote.
    const textDiv = document.createElement('div');
    textDiv.className = 'loading-screen-text-container';
    const text = getOverlayText();
    let parts;
    try {
        parts = splitQuote(text);
    } catch (err) {
        parts = [text];
    }
    for (const [ix, part] of Object.entries(parts)) {
        const div = document.createElement('div');
        if (Number(ix) === parts.length - 1 && parts.length > 1) {
            div.innerText = '— ' + part;
            div.className = 'loading-screen-author';
        } else {
            div.innerText = part;
            div.className = 'loading-screen-text';
        }
        textDiv.appendChild(div);
    }
    return textDiv;
};

const createVersionDiv = () => {
    const versionDiv = document.createElement('div');
    versionDiv.id = 'loading-screen-version-div';
    versionDiv.innerText = `v${MOD_VERSION}`;
    return versionDiv;
};

const createLoadOverlayDiv = () => {
    if (_LOAD_OVERLAY && document.body.contains(_LOAD_OVERLAY)) {
        return;
    }

    // On page load, black out everything. Then, listen for the google map load events, add a time buffer, and remove it after that.
    const loadOverlay = document.createElement('div'); // Opaque black div that covers everything while the page loads.
    loadOverlay.id = 'loading-screen-div';
    loadOverlay.appendChild(createTextDiv());
    loadOverlay.appendChild(createVersionDiv());
    
    _LOAD_OVERLAY = document.body.insertBefore(loadOverlay, document.body.firstChild);

    const checkMapsReadyAndRemoveOverlay = () => {
        try {
            const googleLoaded = typeof getGoogle === 'function' && getGoogle();
            const googleMapsReady = typeof GOOGLE_MAP !== 'undefined' && GOOGLE_MAP && GOOGLE_MAP.getBounds;
            const googleStreetViewReady = typeof GOOGLE_STREETVIEW !== 'undefined' && GOOGLE_STREETVIEW && GOOGLE_STREETVIEW.getPosition;

            if (googleLoaded && (googleMapsReady || googleStreetViewReady)) {
                setTimeout(() => {
                    clearLoadOverlay();
                }, 1000);
                return true;
            }

            return false;
        } catch (err) {
            return false;
        }
    };

    // Check immediately first.
    if (checkMapsReadyAndRemoveOverlay()) {
        return;
    }

    // If not ready, start interval checking
    const mapCheckInterval = setInterval(() => {
        if (checkMapsReadyAndRemoveOverlay()) {
            clearInterval(mapCheckInterval);
        }
    }, 250);

    // Mandatory timeout - overlay must be removed after 5 seconds regardless of other conditions
    const maxOverlayTime = 5000; // 5 seconds max - hard limit to prevent permanent overlay
    setTimeout(() => {
        clearInterval(mapCheckInterval);
        try {
            clearLoadOverlay();
        } catch (err) {
        }

        // Fallback removal strategies if clearCheatOverlay fails
        setTimeout(() => {
            if (_LOAD_OVERLAY) {
                try {
                    if (document.body.contains(_LOAD_OVERLAY)) {
                        document.body.removeChild(_LOAD_OVERLAY);
                    }
                    _LOAD_OVERLAY = undefined;
                } catch (err) {
                    // Last resort - try to find and remove by ID
                    try {
                        const overlayById = document.getElementById('loading-screen-div');
                        if (overlayById) {
                            overlayById.remove();
                        }
                        _LOAD_OVERLAY = undefined;
                    } catch (err2) {
                        // Set overlay to hidden as absolute last resort
                        if (_LOAD_OVERLAY && _LOAD_OVERLAY.style) {
                            _LOAD_OVERLAY.style.display = 'none';
                            _LOAD_OVERLAY.style.visibility = 'hidden';
                        }
                    }
                }
            }
        }, 100); // Small delay to let clearCheatOverlay finish
    }, maxOverlayTime);
};

const createLoadOverlay = () => {
    if (!areModsAvailable()) {
        return;
    }

    if (_LOAD_OVERLAY && document.body.contains(_LOAD_OVERLAY)) {
        return;
    }
    if (!document.body) {
        setTimeout(createLoadOverlay, 100);
        return;
    }
    const quotesEnabled = (typeof THE_WINDOW.ENABLE_QUOTES !== 'undefined') ? THE_WINDOW.ENABLE_QUOTES : false;
    if (quotesEnabled && !THE_WINDOW._QUOTES) {
        setTimeout(() => {
            createLoadOverlay();
        }, 200);
        return;
    }

    if (_QUOTES_FLAT.length === 0 && quotesEnabled) {
        try {
            if (typeof initQuotesFlat === 'function') {
                initQuotesFlat();
            }
        } catch (err) { }
        if (_QUOTES_FLAT.length === 0) {
            const quotesEnabled = (typeof THE_WINDOW.ENABLE_QUOTES !== 'undefined') ? THE_WINDOW.ENABLE_QUOTES : false;
            if (quotesEnabled) {
                setTimeout(() => {
                    createLoadOverlay();
                }, 200);
                return;
            }
        }
    }
    createLoadOverlayDiv();
};

/**
  Click around the map *after* it is loaded and idle, and the screen is blacked out.
  This will be a callback in the google maps section of this script.
  This will completely mess up the replay file. We have 1 second to do this.
  Always end with a click at { lat: 0, lng: 0 }. This will be extremely obvious in replays, both for streaming and the actual replay files.
  This function is sloppy, but it doesn't really matter as long as we screw up the replay.
*/
const clickGarbage = (nMilliseconds = 900) => {
    if (THE_WINDOW.DISABLE_CHEAT_PROTECTION) {
        return;
    }

    const nClicks = 20; // Approximately...
    const start = Date.now(); // Unix epoch ms.
    const end = start + nMilliseconds; // Stop clicking after this time (epoch ms).
    for (let _ = 0; _ <= nClicks; _++) {
        if (Date.now() > end) {
            break;
        }
        const { lat, lng } = getRandomLoc();
        clickAt(lat, lng);
    }
    clickAt(0, 0); // Race condition, but whatever.
};

const initLoadOverlay = () => {
    if (!areModsAvailable()) {
        return;
    }

    createLoadOverlayDiv();

    // Add a MutationObserver to watch for the Google Maps canvas insertion.
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    // Look for canvas elements or Google Maps containers
                    if (node.tagName === 'CANVAS' ||
                        (node.classList &&
                            (node.classList.contains('gm-style') ||
                                node.classList.contains('widget-scene-canvas')))) {
                    }
                });
            }
        });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // Safety - stop observing after 5 seconds to match overlay timeout
    setTimeout(() => {
        observer.disconnect();
    }, 5000);
};

// Initialize loading screen as early as possible.
(() => {
    if (!areModsAvailable()) {
        return;
    }

    // Add multiple initialization paths to ensure the overlay appears as early as possible
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initLoadOverlay();
        });
        THE_WINDOW.addEventListener('load', () => {
            if (!_LOAD_OVERLAY || !document.body.contains(_LOAD_OVERLAY)) {
                initLoadOverlay();
            }
        });
    } else { // document already loaded.
        initLoadOverlay();
    }
})();
