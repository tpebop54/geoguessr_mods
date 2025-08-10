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

const createVersionDiv = () => {
    const versionDiv = document.createElement('div');
    versionDiv.id = 'loading-screen-version-div';
    versionDiv.innerText = `v${MOD_VERSION}`;
    Object.assign(versionDiv.style, {
        position: 'fixed',
        bottom: '0px',
        right: '15px',
        'z-index': '10000000',
        'pointer-events': 'none',
        transform: 'translate(-50%, -50%)',
        color: 'white',
    });
    return versionDiv;
};

const createLoadOverlayDiv = () => {
    if (_LOAD_OVERLAY && document.body.contains(_LOAD_OVERLAY)) {
        return;
    }

    const loadOverlay = document.createElement('div'); // Opaque black div that covers everything while the page loads.
    loadOverlay.id = 'loading-screen-div';
    Object.assign(loadOverlay.style, { // Intentionally not in CSS to make it harder for people to figure out.
        height: '100vh',
        width: '100vw',
        background: 'black',
        'z-index': '99999999',
        position: 'fixed',
        top: '0',
        left: '0',
        'overflow-wrap': 'break-word',
        'pointer-events': 'none',
        transition: 'opacity 0.5s ease-out', // Smooth fade-out transition
    });

    const textDiv = document.createElement('div');
    const text = getOverlayText();
    let parts;
    try {
        parts = splitQuote(text);
    } catch (err) {
        parts = [text];
    }

    Object.assign(textDiv.style, { // Style for div that contains quote and author. Again, done via JS to obfuscate the code.
        position: 'absolute',
        top: '50%',
        left: '50%',
        'font-size': '60px',
        color: 'white',
        transform: 'translate(-50%, -50%)',
        'pointer-events': 'none',
        display: 'flex',
        'flex-direction': 'column',
        'text-align': 'center',
        'align-items': 'center',
    });

    const textStyle = { // Styling for just the text.
        'font-size': '40px',
    };
    const authorStyle = { // Styling for just the author.
        'margin-top': '10px',
        'font-size': '20px',
    };

    for (const [ix, part] of Object.entries(parts)) {
        const div = document.createElement('div');
        if (Number(ix) === parts.length - 1 && parts.length > 1) {
            div.innerText = '— ' + part;
            Object.assign(div.style, authorStyle);
        } else {
            div.innerText = part;
            Object.assign(div.style, textStyle);
        }
        textDiv.appendChild(div);
    }

    // On page load, black out everything. Then, we listen for the google map load event, add a time buffer, and remove it after that.
    // We have to have the map loaded to do the anti-cheat clicks. This is done down below in the map load event bubble.
    loadOverlay.appendChild(textDiv);
    loadOverlay.appendChild(createVersionDiv());

    // First check if body is available
    if (document.body) {
        _LOAD_OVERLAY = document.body.insertBefore(loadOverlay, document.body.firstChild);
    } else {
        // If body is not available yet, wait for it
        const bodyCheckInterval = setInterval(() => {
            if (document.body) {
                clearInterval(bodyCheckInterval);
                _LOAD_OVERLAY = document.body.insertBefore(loadOverlay, document.body.firstChild);
            }
        }, 50);
    }

    // Use our map waiting utility instead of a simple interval
    const checkMapsReadyAndRemoveOverlay = () => {
        try {
            // Define which elements to look for to determine map readiness
            const googleLoaded = typeof getGoogle === 'function' && getGoogle();
            const googleMapsReady = typeof GOOGLE_MAP !== 'undefined' && GOOGLE_MAP && GOOGLE_MAP.getBounds;
            const googleStreetViewReady = typeof GOOGLE_STREETVIEW !== 'undefined' && GOOGLE_STREETVIEW && GOOGLE_STREETVIEW.getPosition;
            const canvasElements = document.querySelectorAll('.gm-style, canvas, .widget-scene-canvas');
            const domElementsReady = canvasElements && canvasElements.length > 0;

            // Multiple detection strategies for better reliability
            const strategy1 = googleLoaded && (googleMapsReady || googleStreetViewReady);
            const strategy2 = domElementsReady;

            if (strategy1 || strategy2) {
                setTimeout(() => {
                    clearLoadOverlay();
                }, 1000); // Wait 1 second after map is detected
                return true;
            }

            return false;
        } catch (err) {
            return false;
        }
    };

    // Check immediately first
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
