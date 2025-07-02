// ==UserScript==
// @name         GG Cheat Protection
// @description  Cheat protection system for GeoGuessr mods
// @version      1.0
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
    
    // Make sure SHOW_QUOTES is available
    if (typeof SHOW_QUOTES === 'undefined') {
        console.warn('SHOW_QUOTES not defined, using defaults');
        return;
    }
    
    for (const [key, value] of Object.entries(SHOW_QUOTES)) {
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

const getRandomQuote = () => {
    if (!SHOW_QUOTES || !_QUOTES_FLAT.length) {
        return 'Loading...';
    }
    const ix = Math.floor(Math.random() * _QUOTES_FLAT.length);
    const quote = _QUOTES_FLAT[ix];
    return quote;
};

/** Split the quote and the author into a String[]. Must include the dash character to split it. */
const splitQuote = (quote) => {
    const parts = quote.split('—').map(part => part.trim());
    return parts;
};

const clearCheatOverlay = () => {
    if (_CHEAT_OVERLAY) {
        _CHEAT_OVERLAY.parentElement.removeChild(_CHEAT_OVERLAY);
        _CHEAT_OVERLAY = undefined;
    }
};

const createQuoteOverlay = () => {
    clearCheatOverlay();
    
    // Initialize quotes if needed - wait a bit for quotes to be available
    if (!window._QUOTES || _QUOTES_FLAT.length === 0) {
        setTimeout(() => {
            initQuotesFlat();
            createQuoteOverlayNow();
        }, 100);
        return;
    }
    
    createQuoteOverlayNow();
};

const createQuoteOverlayNow = () => {
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
    _CHEAT_OVERLAY = document.body.insertBefore(cheatOverlay, document.body.firstChild);

    // Other measures are taken, but no matter what we can't let this div brick the entire site,
    //   e.g. if they change the URL naming scheme. Race condition with map loading, but so be it.
    // This also should allow ample time for mods to load after the initial GOOGLE_MAP load. There may be a better way to do this.
    setTimeout(clearCheatOverlay, 5000);
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

// Initialize cheat protection with window load event (matches legacy implementation)
window.addEventListener('load', () => {
    initCheatProtection();
});
