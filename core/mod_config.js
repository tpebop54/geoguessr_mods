// ==UserScript==
// @author       tpebop

// ==/UserScript==

// Browser detection for conditional mod disabling.
// This is required because Opera has issues with vector rendering of the 2D map, so they are totally unworkable in Opera.
// ===============================================================================================================================

const _isOpera = () => {
    return (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
};

const IS_OPERA = _isOpera();

const valueUnlessOpera = (value = true) => {
    if (IS_OPERA) {
        return false;
    }
    return !!value;
};


// Mods available in this script.
// ===============================================================================================================================

const MODS = {

    satView: {
        show: true, // false to hide this mod from the panel. Mostly used for dev, but you can change it to disable stuff.
        key: 'sat-view', // Used for global state and document elements.
        name: 'Satellite View', // Used for menus.
        tooltip: 'Uses satellite view on the guess map, with no labels.', // Shows when hovering over menu button.
        isScoring: false, // Says whether or not this is a scoring mod (only one scoring mod can be used at a time). Can be null.
        options: {}, // Used when mod requires or allows configurable values. Can be null.
    },

    rotateMap: {
        show: valueUnlessOpera(true),
        key: 'rotate-map',
        name: 'Map Rotation',
        tooltip: 'Makes the guess map rotate while you are trying to click.',
        disableInOpera: true, // Disable in Opera due to WebGL/Vector rendering issues
        options: {
            every: {
                label: 'Run Every (s)',
                default: 0.05,
                tooltip: 'Rotate the map every X seconds. Lower numbers will reduce choppiness but may also slow the game down.',
            },
            degrees: {
                label: 'Degrees',
                default: 2,
                tooltip: 'Rotate by X degrees at the specified time interval. Positive for clockwise, negative for counter-clockwise.',
            },
            startDegrees: {
                label: 'Start at',
                default: 0,
                tooltip: 'Start at a fixed rotation. Note: "Randomize" will override this, and if you want a static map, set the others to 0.',
            },
            startRandom: {
                label: 'Randomize',
                default: false,
                tooltip: 'Randomize starting position. Note: this will override the "Start at" setting if enabled.',
            },
        },
    },

    zoomInOnly: { // This one is alright, but just not really good content quality. Try it out if you want!
        show: false,
        key: 'zoom-in-only',
        name: 'Zoom In Only',
        tooltip: 'You can only zoom inward.',
        options: {},
    },

    showScore: {
        show: true,
        key: 'show-score',
        name: 'Show Score',
        tooltip: 'Shows the would-be score of each click.',
        scoreMode: true,
        options: {},
    },

    flashlight: {
        show: true,
        key: 'flashlight',
        name: 'Flashlight',
        tooltip: 'Uses cursor as a "flashlight" where you can only see part of the screen',
        options: {
            radius: {
                label: 'Radius',
                default: 100,
                tooltip: 'Radius of flashlight, in pixels.',
            },
            blur: {
                label: 'Blur',
                default: 50,
                tooltip: 'Blur (in pixels) to add to the flashlight. Extends out from the radius.',
            }
        }
    },

    seizure: { // This one is disabled by default because it's a little insensitive and not safe for streaming. But try it if you want!
        show: false,
        key: 'seizure',
        name: 'Seizure',
        tooltip: 'Makes large map jitter around. Seizure warning!!',
        disableInOpera: true, // Disable in Opera due to performance and rendering issues
        options: {
            frequency: {
                label: 'Frequency (Hz)',
                default: 20,
                tooltip: 'How many times per second to make the image move around.',
            },
            distance: {
                label: 'Max Distance',
                default: 30,
                tooltip: 'Maximum distance to jitter each movement (from original location, in pixels).',
            }
        }
    },

    bopIt: {
        show: true,
        key: 'bop-it',
        name: 'Bop It',
        tooltip: `Bop It mode where it tells you the intercardinal direction you need to go from your click. You'll figure it out...`,
        isScoring: true,
        options: {
            threshold: {
                label: 'Bop It Threshold (Points)',
                default: 4900,
                tooltip: 'Bop It when your click will earn this many points. (0 to 5000).',
            },
        }
    },

    inFrame: {
        show: true,
        key: 'in-frame',
        name: 'Show In-Frame',
        tooltip: 'Shows if the location is in or out of your current guess map view.',
        scoreMode: true,
        options: {},
    },

    lottery: {
        show: true,
        key: 'lottery',
        name: 'Lottery',
        tooltip: 'Get a random guess and you have to decide if you want it or not.',
        options: {
            nGuesses: {
                label: 'Max. guesses',
                default: 10,
                tooltip: 'Maximum number of random guesses you get before you have to take the guess.',
            },
            nDegLat: {
                label: 'Latitude margin (deg)',
                default: 90,
                tooltip: 'Guess up to this many degrees latitude away from the target',
            },
            nDegLng: {
                label: 'Longitude margin (deg)',
                default: 180,
                tooltip: 'Guess up to this many degrees longitude away from the target',
            },

        },
    },

    puzzle: {
        show: false, // Almost working...
        key: 'puzzle',
        name: 'Puzzle',
        tooltip: 'Split up the large map into tiles and rearrange them randomly',
        disableInOpera: true, // Disable in Opera due to complex DOM manipulation and rendering issues
        options: {
            nRows: {
                label: '# Rows',
                default: 4,
                tooltip: 'How many tiles to split up the puzzle into vertically.',
            },
            nCols: {
                label: '# Columns',
                default: 4,
                tooltip: 'How many tiles to split up the puzzle into horizontally.',
            },
        },
    },

    tileReveal: {
        show: true,
        key: 'tile-reveal',
        name: 'Tile Reveal',
        tooltip: 'Overlay big map with tiles and you can click to reveal them.',
        options: {
            nRows: {
                label: '# Rows',
                default: 4,
                tooltip: 'How many rows of tiles for you to select from.',
            },
            nCols: {
                label: '# Columns',
                default: 4,
                tooltip: 'How many columns of titles for you to select from.',
            },
            nClicks: {
                label: 'Max. clicks',
                default: 4,
                tooltip: 'How many tiles you are allowed to reveal for a given round.',
            },
        },
    },

    displayOptions: { // Miscellaneous display options that don't deserve a full button.
        show: true, // Broken in duels.
        key: 'display-preferences',
        name: 'Display Preferences',
        tooltip: 'Various display options for page elements, colors, etc. Does not mess with gameplay.',
        // Note: CSS filters may have issues in Opera, but transforms work fine
        options: {
            tidy: {
                label: 'Tidy mode',
                default: false,
                tooltip: 'Hides annoying page elements.',
            },
            blur: {
                label: 'Blur (px)',
                default: 0,
                tooltip: 'Blur radius in pixels of main view.',
            },
            colorMode: {
                label: 'Color Mode',
                default: 'normal',
                tooltip: 'Select color mode for the main view.',
                options: [ // Must update along with _COLOR_FILTERS.
                    'normal',
                    'grayscale',
                    'black and white',
                    'deuteranopia',
                    'tritanopia',
                    'dog',
                    'cat',
                    'sea lion',
                    'ant',
                    'octopus',
                ],
            },
            flipVertical: {
                label: 'Flip Vertical',
                default: false,
                tooltip: 'Flip the main view vertically (upside down).',
            },
            flipHorizontal: {
                label: 'Flip Horizontal',
                default: false,
                tooltip: 'Flip the main view horizontally (left-right mirror).',
            },
        },
    },

    scratch: {
        show: false, // Used for dev work.
        key: 'scratch',
        name: 'Show Scratch',
        tooltip: 'For dev.',
        scoreMode: false,
        options: {},
    },

};

// Apply Opera-specific mod disabling
// ===============================================================================================================================

if (IS_OPERA) {
    let disabledCount = 0;

    for (const [modKey, mod] of Object.entries(MODS)) {
        if (mod.disableInOpera) {
            const wasEnabled = mod.enabled;
            mod.show = false;
            mod.enabled = false;
            mod.tooltip = `${mod.tooltip} [DISABLED IN OPERA]`;
            disabledCount++;
        }
    }
}

// Default configuration for options restoration
const GG_DEFAULT = {} // Used for default options and restoring options.
for (const mod of Object.values(MODS)) {
    GG_DEFAULT[mod.key] = JSON.parse(JSON.stringify(mod));
}

// On page load, show random quotes, jokes, facts, etc. The blackout screen cannot be turned off without changing code.
const SHOW_QUOTES = {
    inspirational: true,
    heavy: true, // I'll understand if you want to turn this one off.
    media: true, // From movies and stuff. Generally light-hearted.
    jokes: true,
    funFacts: true,
    tongueTwisters: true,
    questions: true,
};

// Callback registry for mod updates
const UPDATE_CALLBACKS = {};
