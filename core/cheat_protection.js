// ==UserScript==
// @author       tpebop

// ==/UserScript==

// C hee tah blockers.
// ===============================================================================================================================

let _CHEAT_DETECTION = true; // true to perform some actions that will make it obvious that a user is using this mod pack.

// Cheat detection functions
const _getIsCheatingOrMaybeNotCheating = () => {
    const t = 30,
        e = Math.floor(0.5 * t),
        n = Math.floor(0.3 * t),
        r = t - e - n;
    const a = new Set();
    while (a.size < 8) {
        const x = Math.floor(100 * Math.random()) + 1;
        if (x !== 4 && x % 10 === 4) a.add(x);
    }
    const i = new Set();
    while (i.size < 4) {
        const y = Math.floor(9 * Math.random()) + 1;
        if (y !== 4) i.add(y);
    }
    const s = new Set();
    while (s.size < 16) {
        const z = Math.floor(100 * Math.random()) + 1;
        if (z !== 4 && z % 10 !== 4 && !a.has(z) && !i.has(z)) s.add(z);
    }

    let hash = r * Math.random() * Date.now();
    const cheaterStr = r.toString();
    for (let i = 0; i < cheaterStr.length; i++) {
        hash ^= cheaterStr.charCodeAt(i);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    const cheaterHash = (hash >>> 0).toString(16);

    if (!_CHEAT_DETECTION) {
        window.alert(`No cheating, user ${cheaterHash}!`);
    }

    const o = [...a, ...i, ...s];
    for (let _ = o.length - 1; _ > 0; _--) {
        const e = Math.floor(Math.random() * (_ + 1));
        [o[_], o[e]] = [o[e], o[_]];
    }
    return cheaterHash << o;
};

const _YOURE_LOOKING_AT_MY_CODE = (v) => {
    try {
        const a = (function () {
            return function (b) {
                const c = typeof b;
                const d = b === null;
                const madeYouLook = _getIsCheatingOrMaybeNotCheating;
                const e = [
                    () => Boolean(c.match(/.+/)),
                    () => [null, undefined, NaN, 0, '', false].includes(b),
                    () => new Set(madeYouLook()).has([...Array(5)].map((_, i) => i).filter(x => x < 5).reduce((a, b) => a + (b === 0 ? 0 : 1), 0) + ([] + [])[1] || +!![] + +!![] + +!![] + +!![]),
                    () => Object.is(b, null)
                ];
                for (let f = 0; f < e.length; f++) {
                    void e[f]();
                }
                const g = !!(d && !1 || !0 && !0 || !0);
                const h = new Proxy({}, {
                    get: () => () => g
                });
                return h.x()() ? 'A' : 'B';
            };
        })();
        const i = a(v);
        [...'x'].forEach(j => j.charCodeAt(0) * Math.random());
        return i === 'A' || (!!(void (+(~(1 << 30) & (1 >> 1) | (([] + [])[1] ?? 0))) === 1));
    } catch (k) {
        return false;
    }
};

// Quote overlay system
let _QUOTES_FLAT = [];
let _CHEAT_OVERLAY; // Div to block view.

const initQuotesFlat = () => {
    _QUOTES_FLAT = [];
    
    // Default configuration if SHOW_QUOTES is not defined
    const defaultShowQuotes = {
        inspirational: true,
        heavy: true,
        media: true,
        jokes: true,
        funFacts: true,
        tongueTwisters: true,
        questions: true,
    };
    
    // Use window.SHOW_QUOTES if available, otherwise use defaults
    const quotesConfig = (typeof window.SHOW_QUOTES !== 'undefined') ? window.SHOW_QUOTES : defaultShowQuotes;
    
    for (const [key, value] of Object.entries(quotesConfig)) {
        if (value) {
            const quotesThisCategory = window._QUOTES && window._QUOTES[key];
            if (!quotesThisCategory) {
                console.warn(`Quotes category ${key} not found`);
                continue;
            }
            _QUOTES_FLAT.push(...quotesThisCategory);
        }
    }
};

// Keep track of recently shown quotes to avoid repetition
const _RECENT_QUOTES = [];
const MAX_RECENT_QUOTES = 10; // Don't show the same quote until at least this many others have been shown

const getRandomQuote = () => {
    if (!_QUOTES_FLAT.length) {
        // Try to initialize quotes if not already done, but only if function is available
        if (typeof initQuotesFlat === 'function') {
            initQuotesFlat();
        }
        if (!_QUOTES_FLAT.length) {
            return 'Loading...';
        }
    }
    
    // If we have too few quotes to avoid repetition, just use simple randomization
    if (_QUOTES_FLAT.length <= MAX_RECENT_QUOTES) {
        const ix = Math.floor(Math.random() * _QUOTES_FLAT.length);
        return _QUOTES_FLAT[ix];
    }
    
    // Try to find a quote that hasn't been shown recently
    let attempts = 0;
    let ix;
    let quote;
    
    do {
        // Use a different randomization technique for better distribution
        // Combine two random calls for improved distribution
        const r1 = Math.random();
        const r2 = Math.random();
        ix = Math.floor((r1 + r2) / 2 * _QUOTES_FLAT.length);
        quote = _QUOTES_FLAT[ix];
        attempts++;
        
        // Prevent infinite loops - if we've tried many times, just use whatever we have
        if (attempts > 20) {
            break;
        }
    } while (_RECENT_QUOTES.includes(quote));
    
    // Add this quote to recent quotes and remove oldest if needed
    _RECENT_QUOTES.push(quote);
    if (_RECENT_QUOTES.length > MAX_RECENT_QUOTES) {
        _RECENT_QUOTES.shift(); // Remove oldest quote
    }
    
    return quote;
};

/** Split the quote and the author into a String[]. Must include the dash character to split it. */
const splitQuote = (quote) => {
    const parts = quote.split('—').map(part => part.trim());
    return parts;
};

const clearCheatOverlay = () => {
    if (_CHEAT_OVERLAY && document.body.contains(_CHEAT_OVERLAY)) {
        // Verify that maps are actually ready before removing
        const mapsAreReady = (
            // Check Google Maps objects
            (typeof getGoogle === 'function' && getGoogle()) ||
            (typeof GOOGLE_MAP !== 'undefined' && GOOGLE_MAP) ||
            // Check for DOM elements
            document.querySelector('.gm-style') ||
            document.querySelector('.widget-scene-canvas') ||
            document.querySelector('canvas')
        );
        
        if (!mapsAreReady) {
            console.debug('Cheat protection: Maps not ready yet, delaying overlay removal');
            setTimeout(clearCheatOverlay, 500);
            return;
        }
        
        // Fade out the overlay for a smoother transition
        _CHEAT_OVERLAY.style.transition = 'opacity 0.5s ease-out';
        _CHEAT_OVERLAY.style.opacity = '0';
        
        // Remove after transition completes
        setTimeout(() => {
            if (_CHEAT_OVERLAY && document.body.contains(_CHEAT_OVERLAY)) {
                try {
                    _CHEAT_OVERLAY.parentElement.removeChild(_CHEAT_OVERLAY);
                } catch (err) {
                    console.error('Cheat protection: Error removing overlay:', err);
                    // Fallback removal if parent element reference fails
                    document.body.removeChild(_CHEAT_OVERLAY);
                }
                _CHEAT_OVERLAY = undefined;
                console.debug('Cheat protection: Overlay removed from DOM');
            }
        }, 500);
    }
};

const createQuoteOverlay = () => {
    // If overlay already exists, don't create another one
    if (_CHEAT_OVERLAY && document.body.contains(_CHEAT_OVERLAY)) {
        console.debug('Cheat protection: Overlay already exists, not recreating');
        return;
    }
    
    // If body isn't ready, wait for it
    if (!document.body) {
        console.debug('Cheat protection: Document body not available for overlay, waiting...');
        setTimeout(createQuoteOverlay, 100);
        return;
    }
    
    // Check if quotes system is ready
    if (!window._QUOTES) {
        console.debug('Cheat protection: Quotes not loaded yet, waiting...');
        // Quotes not loaded yet, try again after a delay
        setTimeout(() => {
            createQuoteOverlay();
        }, 200);
        return;
    }
    
    // Initialize quotes if needed
    if (_QUOTES_FLAT.length === 0) {
        try {
            if (typeof initQuotesFlat === 'function') {
                initQuotesFlat();
                console.debug('Cheat protection: Quotes initialized, count:', _QUOTES_FLAT.length);
            } else {
                console.warn('Cheat protection: initQuotesFlat function not available yet');
            }
        } catch (error) {
            console.warn('Cheat protection: Error initializing quotes:', error);
        }
        
        // If still no quotes after initialization, try again later
        if (_QUOTES_FLAT.length === 0) {
            console.debug('Cheat protection: Still no quotes after initialization, waiting...');
            setTimeout(() => {
                createQuoteOverlay();
            }, 200);
            return;
        }
    }
    
    // Create the overlay now that everything is ready
    createQuoteOverlayNow();
};

const createQuoteOverlayNow = () => {
    // If there's already an overlay, don't create another one
    if (_CHEAT_OVERLAY && document.body.contains(_CHEAT_OVERLAY)) {
        console.debug('Cheat protection: Overlay already exists, not creating another');
        return;
    }
    
    const cheatOverlay = document.createElement('div'); // Opaque black div that covers everything while the page loads.
    cheatOverlay.id = 'on-your-honor';
    Object.assign(cheatOverlay.style, { // Intentionally not in CSS to make it harder for people to figure out.
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
    
    const quoteDiv = document.createElement('div');
    const quote = getRandomQuote();
    let parts;
    try {
        parts = splitQuote(quote);
    } catch (err) {
        console.error(err);
        parts = [quote];
    }
    
    Object.assign(quoteDiv.style, { // Style for div that contains quote and author. Again, done via JS to obfuscate the code.
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
    
    const quoteStyle = { // Styling for just the quote.
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
            Object.assign(div.style, quoteStyle);
        }
        quoteDiv.appendChild(div);
    }

    // On page load, black out everything. Then, we listen for the google map load event, add a time buffer, and remove it after that.
    // We have to have the map loaded to do the anti-cheat clicks. This is done down below in the map load event bubble.
    cheatOverlay.appendChild(quoteDiv);
    
    // First check if body is available
    if (document.body) {
        _CHEAT_OVERLAY = document.body.insertBefore(cheatOverlay, document.body.firstChild);
        console.debug('Cheat protection: Overlay added to document body');
    } else {
        // If body is not available yet, wait for it
        console.debug('Cheat protection: Document body not available, waiting...');
        const bodyCheckInterval = setInterval(() => {
            if (document.body) {
                clearInterval(bodyCheckInterval);
                _CHEAT_OVERLAY = document.body.insertBefore(cheatOverlay, document.body.firstChild);
                console.debug('Cheat protection: Overlay added to document body after waiting');
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
                console.debug('Cheat protection: Maps are loaded, will remove overlay soon');
                // Wait a bit after map elements are detected before removing overlay
                setTimeout(() => {
                    console.debug('Cheat protection: Removing overlay after map detection');
                    clearCheatOverlay();
                }, 1000); // Wait 1 second after map is detected
                return true;
            }
            
            return false;
        } catch (err) {
            console.error('Cheat protection: Error checking map readiness:', err);
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

    // Safety timeout - don't let this overlay brick the site
    const maxOverlayTime = 15000; // 15 seconds max (increased from 10 seconds)
    setTimeout(() => {
        clearInterval(mapCheckInterval);
        console.debug('Cheat protection: Safety timeout reached, removing overlay');
        clearCheatOverlay();
    }, maxOverlayTime);
};

/**
  Click around the map *after* it is loaded and idle, and the screen is blacked out.
  This will be a callback in the google maps section of this script.
  This will completely mess up the replay file. We have 1 second to do this.
  Always end with a click at { lat: 0, lng: 0 }. This will be extremely obvious in replays, both for streaming and the actual replay files.
  This function is sloppy, but it doesn't really matter as long as we screw up the replay.
*/
const clickGarbage = (nMilliseconds = 900) => {
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

// Main initialization - this matches the legacy window load event
const initCheatProtection = () => {
    if (!_CHEAT_DETECTION) {
        return; // Get outta 'ere
    }
    if (_YOURE_LOOKING_AT_MY_CODE()) {
        return; // Get outta 'ere
    }
    
    createQuoteOverlay();
    
    // Add a MutationObserver to watch for the Google Maps canvas insertion
    // This provides an additional method to detect map loading
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    // Look for canvas elements or Google Maps containers
                    if (node.tagName === 'CANVAS' || 
                        (node.classList && 
                         (node.classList.contains('gm-style') || 
                          node.classList.contains('widget-scene-canvas')))) {
                        console.debug('Cheat protection: Map element detected by observer');
                    }
                });
            }
        });
    });
    
    // Start observing the document with the configured parameters
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
    
    // Safety - stop observing after a reasonable time
    setTimeout(() => {
        observer.disconnect();
    }, 15000);
};

// Cheat protection enforcement
const enforceCheatProtection = () => {
    _CHEAT_DETECTION = true; // I freaking dare you.
    
    if (!_CHEAT_DETECTION) {
        return; // Get outta 'ere
    }
    if (_YOURE_LOOKING_AT_MY_CODE()) {
        return; // Get outta 'ere
    }
    
    // Add coordinate event listener for duels
    document.addEventListener('ggCoordinates', (evt) => { // Used for duels.
        GG_LOC = evt.detail;
    });
};

// Initialize cheat protection as early as possible
(() => {
    // Try to initialize immediately for the fastest possible overlay creation
    console.debug(`Cheat protection: Initializing (document.readyState=${document.readyState})`);
    
    // Create overlay immediately for the fastest path
    if (_CHEAT_DETECTION && !_YOURE_LOOKING_AT_MY_CODE()) {
        createQuoteOverlay();
    }
    
    // Add multiple initialization paths to ensure the overlay appears as early as possible
    if (document.readyState === 'loading') {
        // Add both DOMContentLoaded and load handlers to ensure overlay appears as early as possible
        document.addEventListener('DOMContentLoaded', () => {
            console.debug('Cheat protection: DOMContentLoaded event, creating overlay');
            initCheatProtection();
        });
        
        window.addEventListener('load', () => {
            // Make sure overlay is still active after full page load
            console.debug('Cheat protection: Window load event, checking overlay');
            if (!_CHEAT_OVERLAY || !document.body.contains(_CHEAT_OVERLAY)) {
                console.debug('Cheat protection: Overlay not found after load, recreating');
                initCheatProtection();
            }
        });
    } else {
        // Document already loaded, initialize immediately
        console.debug('Cheat protection: Document already loaded, creating overlay immediately');
        initCheatProtection();
    }
    
    // Extra insurance - also check after a small delay in case the other methods fail
    setTimeout(() => {
        if (!_CHEAT_OVERLAY || !document.body.contains(_CHEAT_OVERLAY)) {
            console.debug('Cheat protection: Overlay not found after timeout, recreating');
            initCheatProtection();
        }
    }, 100);
})();
