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
