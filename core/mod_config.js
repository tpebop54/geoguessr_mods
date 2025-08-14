// ==UserScript==
// @author       tpebop

// ==/UserScript==

// Mods available in this script.
// ===============================================================================================================================

const _isOpera = () => { // Opera can't render the 2D map as vector, so disable mods that require that.
    return (!!THE_WINDOW.opr && !!opr.addons) || !!THE_WINDOW.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
};
const IS_OPERA = _isOpera();

/** 
    COMMON CONFIGURATION FOR MODS
    
    show: true, // false to hide this mod from the panel. Mostly used for dev, but you can change it to disable stuff.
    key: 'some-key', // Used for global state and document elements.
    name: 'Name in Menu', // Used for menus.
    tooltip: 'Brief explanation of the mod for the menu tooltip', // Shows when hovering over menu button.
    isScoring: false, // Says whether or not this is a scoring mod (only one scoring mod can be used at a time). Can be null.
    allowInDuels: true, // True to allow in duels and multiplayer, false if only for single player.
    options: {}, // Used when mod requires or allows configurable values. Can be null.
        Some additional configurations can be put in individual options to show or hide them in certain circumstances.
            - allowInDuels: some options may not work in duels, e.g. if knowing the coordinates is required. Default false.
*/

const MODS = {

    funFilters: {
        show: true,
        key: 'fun-filters',
        name: 'Fun Filters',
        tooltip: 'Various display options for page elements, colors, etc.',
        allowInDuels: true,
        options: {
            satView: {
                label: 'Satellite View',
                default: false,
                tooltip: 'Use satellite view instead of roadmap view.',
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
            streetviewSize: {
                label: 'Streetview Size (%)',
                default: 100,
                tooltip: 'How big the streetview appears on your screen.',
            },
            tidy: {
                label: 'Tidy mode',
                default: false,
                tooltip: 'Hides annoying page elements.',
            },
        },
    },

    lottery: {
        show: true,
        key: 'lottery',
        name: 'Lottery',
        tooltip: 'Get a random guess and you have to decide if you want it or not.',
        allowInDuels: true,
        options: {
            nTokens: {
                label: 'Num. tokens',
                default: 10,
                tooltip: 'Maximum number of random guesses you get before you have to take the guess.',
            },
            resetEachRound: {
                label: 'Reset each round',
                default: true,
                tooltip: 'Reset the number of tokens for each round. If disabled, you have this many tokens for the full game.',
            },
            useCoverageMap: {
                label: 'Use coverage map',
                default: true,
                tooltip: 'If enabled, use a guess distribution tailored to global world GeoGuessr coverage.\nIf disabled, guess anywhere.',
            },
            randomPct: {
                label: 'Randomization (0-100%)',
                default: 0,
                tooltip: 'This percent (0-100) of your guesses will not use the coverage map.',
            },
        },
    },

    tileReveal: {
        show: true,
        key: 'tile-reveal',
        name: 'Tile Reveal',
        tooltip: 'Overlay big map with tiles and you can click to reveal them.',
        allowInDuels: true,
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
            resetEachRound: {
                label: 'Reset each round',
                default: true,
                tooltip: 'Reset the number of clicks allowed for each round.',
            },
        },
    },

    flashlight: {
        show: true,
        key: 'flashlight',
        name: 'Flashlight',
        tooltip: 'Uses cursor as a "flashlight" where you can only see part of the screen',
        allowInDuels: true,
        options: {
            radius: {
                label: 'Radius',
                default: 120,
                tooltip: 'Radius of flashlight, in pixels.',
            },
            blur: {
                label: 'Blur',
                default: 30,
                tooltip: 'Blur (in pixels) to add to the flashlight. Extends out from the radius.',
            }
        }
    },

    rotateMap: {
        show: !IS_OPERA,
        key: 'rotate-map',
        name: 'Map Rotation',
        tooltip: 'Makes the guess map rotate while you are trying to click.',
        allowInDuels: true,
        options: {
            degrees: {
                label: 'Degrees',
                default: 2,
                tooltip: 'Rotate by X degrees at the specified time interval. Positive for clockwise, negative for counter-clockwise.',
            },
            hz: {
                label: 'Rotation rate (Hz)',
                default: 20,
                tooltip: 'Rotate the map this many times at the specified degrees interval.',
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

    showScore: {
        show: true,
        key: 'show-score',
        name: 'Show Score',
        tooltip: 'Shows the would-be score of each click.',
        isScoring: true,
        allowInDuels: false,
        options: {},
    },

    bopIt: {
        show: true,
        key: 'bop-it',
        name: 'Bop It',
        tooltip: `Bop It mode where it tells you the intercardinal direction you need to go from your click. You'll figure it out...`,
        isScoring: true,
        allowInDuels: false,
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
        name: 'In-Frame',
        tooltip: 'Shows if the location is in or out of your current guess map view.',
        isScoring: true,
        allowInDuels: false,
        options: {},
    },

    puzzle: {
        show: false, // Almost working...
        key: 'puzzle',
        name: 'Puzzle',
        tooltip: 'Split up the large map into tiles and rearrange them randomly',
        disableInOpera: true, // Disable in Opera due to complex DOM manipulation and rendering issues
        allowInDuels: true,
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

    zoomInOnly: { // This one is alright, but just not really good content quality. Try it out if you want!
        show: false,
        key: 'zoom-in-only',
        name: 'Zoom In Only',
        tooltip: 'You can only zoom inward.',
        allowInDuels: true,
        options: {},
    },

    scratch: {
        show: false, // Used for dev work.
        key: 'scratch',
        name: 'Show Scratch',
        tooltip: 'For dev.',
        isScoring: false,
        allowInDuels: true,
        options: {},
    },

};

// Default configuration for options restoration.
const GG_DEFAULT = {}
for (const mod of Object.values(MODS)) {
    GG_DEFAULT[mod.key] = JSON.parse(JSON.stringify(mod));
}

// Callback registry for mod updates
const UPDATE_CALLBACKS = {};
