// ==UserScript==
// @author       tpebop

// ==/UserScript==

const headerShadow = 'rgb(204, 48, 46) 2px 0px 0px, rgb(204, 48, 46) 1.75517px 0.958851px 0px, rgb(204, 48, 46) 1.0806px 1.68294px 0px, rgb(204, 48, 46) 0.141474px 1.99499px 0px, rgb(204, 48, 46) -0.832294px 1.81859px 0px, rgb(204, 48, 46) -1.60229px 1.19694px 0px, rgb(204, 48, 46) -1.97998px 0.28224px 0px, rgb(204, 48, 46) -1.87291px -0.701566px 0px, rgb(204, 48, 46) -1.30729px -1.5136px 0px, rgb(204, 48, 46) -0.421592px -1.95506px 0px, rgb(204, 48, 46) 0.567324px -1.91785px 0px, rgb(204, 48, 46) 1.41734px -1.41108px 0px, rgb(204, 48, 46) 1.92034px -0.558831px 0px';
const bodyShadow = '3px 3px 0 #000, 3px 0px 3px #000, 1px 1px 0 #000, 3px 1px 2px #000';
const greenMenuColor = '#006400';

// Generic/Base styles (legacy formatting preserved)
const genericStyles = `
    body {
        overflow: hidden;
    }

    .hidden {
        display: none !important;
    }
`;

// Mod container and button styles (legacy formatting preserved)
const modContainerStyles = `
    #gg-mods-container {
        position: absolute;
        width: 200px;
        top: 40px;
        left: 20px;
        z-index: 9;
        display: flex;
        flex-direction: column;
        color: white;
    }

    #gg-mods-header-container {
        display: flex;
        align-items: center;
        font-size: 18px;
        justify-content: space-between;
        margin-top: 8px;
    }

    #gg-mods-header {
        font-weight: bold;
        text-shadow: ${headerShadow};
        position: relative;
    }

    #gg-mods-container-toggle {
        padding: 0;
        font-size: 16px;
        cursor: pointer;
        text-shadow: ${headerShadow};
    }

    #gg-mods-button-container {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 10px;
        z-index: 9999;
        pointer-events: auto;
    }

    .gg-mod-button {
        background: var(--ds-color-purple-100);
        border-radius: 5px;
        font-size: 14px;
        cursor: pointer;
        opacity: 0.9;
        transition: opacity 0.2s;
        padding: 4px 10px;
        pointer-events: auto;
        user-select: none;
    }

    .gg-mod-button:hover {
        opacity: 1;
    }
`;

// Option menu styles (legacy formatting preserved)
const optionMenuStyles = `
    #gg-option-menu {
        position: fixed;
        top: 50px;
        left: 250px;
        min-width: 300px;
        max-width: 400px;
        padding: 15px;
        background: var(--ds-color-purple-100);
        border-radius: 10px;
        border: 2px solid black;
        color: white;
        font-size: 15px;
        font-weight: bold;
        text-shadow: ${bodyShadow};
        z-index: 10000;
        overflow: hidden;
        cursor: move;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    }

    #gg-option-title {
        padding-top: 5px;
        padding-bottom: 12px;
        text-align: center;
        text-shadow: ${bodyShadow};
        font-size: 18px;
    }

    .gg-option-line {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .gg-option-label {
        white-space: nowrap;
        padding-right: 20px;
    }

    .gg-option-input {
        min-width: 70px;
        max-width: 100px;
        height: 25px;
        border-radius: 20px;
        margin: 5px 0;
        border: none;
    }

    .gg-option-button {
        border-radius: 20px;
        margin: 5px 0;
        height: 30px;
    }

    #gg-option-form-div {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
    }

    .gg-option-form-button {
        width: 80px;
        height: 25px;
        border-radius: 15px;
        color: white;
        shadow: ${bodyShadow};
        padding: 0;
        cursor: pointer;
    }

    #gg-option-close {
       background: red;
    }

    #gg-option-reset {
        background: purple;
        margin: 0 5px;
    }

    #gg-option-apply {
       background: green;
    }

    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    input[type=number] {
        -moz-appearance:textfield;
    }
`;

// Show Score mod styles
const showScoreStyles = `
    #gg-score-div {
        position: absolute;
        top: 50%;
        left: 50%;
        font-size: 60px;
        color: white;
        text-shadow: ${bodyShadow};
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 999999;
    }
`;

// Flashlight mod styles
const flashlightStyles = `
    #gg-flashlight-div {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 200%;
        height: 200%;
        padding: 5rem;
        pointer-events: none;
        overflow: hidden;
        position: absolute;
        z-index: 99999;
        --flashlight-y-pos: -50%;
        --flashlight-x-pos: -50%;
        --flashlight-inset: -300px;
    }

    #gg-flashlight-div::before {
        content: "";
        position: absolute;
        inset: var(--flashlight-inset);
        background-image: radial-gradient(
            circle, 
            transparent 0%, 
            rgba(47,52,2,0.4) var(--flashlight-radius), 
            black var(--flashlight-blur), 
            black 100%
        );
        background-position: var(--flashlight-x-pos) var(--flashlight-y-pos);
        background-repeat: no-repeat;
        pointer-events: none;
    }

    #gg-flashlight-div::after {
        content: "";
        position: absolute;
        transform: translate(var(--flashlight-x-pos), var(--flashlight-y-pos));
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
    }
`;

// Display Options mod styles
const displayOptionsStyles = `
    #gg-color-overlay {
        position: absolute;
        width: 100vw;
        height: 100vh;
        top: 0;
        left: 0;
        pointer-events: none;
        z-index: 2;
    }
`;

// Opera-specific performance optimizations for display filters
const operaOptimizationStyles = `
    /* Opera-specific optimizations for better filter performance */
    canvas, 
    .widget-panorama-canvas,
    .widget-panorama-compass,
    .map-canvas {
        will-change: filter, transform;
        backface-visibility: hidden;
        perspective: 1000px;
        transform: translateZ(0);
    }
    
    /* Reduce composite layers in Opera for better performance */
    .opera-friendly-filter {
        transform: translateZ(0);
        will-change: filter;
    }
`;

// Tile Reveal mod styles
const tileRevealStyles = `
    #gg-tile-count {
        position: fixed;
        display: flex;
        justify-content: space-between;
        font-size: 24px;
        background: ${greenMenuColor} !important;
        top: 10%;
        left: 50%;
        transform: translate(-50%, -50%);
        min-width: 225px;
        padding: 15px;
        background: var(--ds-color-purple-100);
        border-radius: 10px;
        border: 2px solid black;
        color: white;
        font-weight: bold;
        text-shadow: ${bodyShadow};
        z-index: 9999;
        overflow: hidden;
        cursor: move;
        opacity: 0.9;
    }

    #gg-tile-count-value {
        padding-left: 0.5em;
        pointer-events: none;
    }

    #gg-tile-overlay {
        position: relative;
        width: 100vw;
        height: 100vh;
        background: transparent;
        display: grid;
        z-index: 1000;
        pointer-events: none;
    }

    .gg-tile-block {
        background: black;
        border: 1px solid #333;
        cursor: pointer;
        transition: opacity 0.3s ease;
        pointer-events: all;
    }

    .gg-tile-block:hover {
        background: #222;
    }

    .gg-tile-block.removed {
        pointer-events: none;
        background: transparent !important;
        border: none;
    }
`;

// Lottery mod styles
const lotteryStyles = `
    #gg-lottery {
        display: flex;
        flex-direction: column;
        width: 330px;
        align-items: center;
        position: absolute;
        top: 13%;
        left: calc(50% - 165px);
        font-size: 30px;
        color: white;
        text-shadow: ${bodyShadow};
        background-color: rgba(0, 100, 0, 0.8);
        padding: 0.5em;
        border-radius: 10px;
        z-index: 9999;
        cursor: move;
    }

    #gg-lottery-counter-div {
        display: flex;
        justify-content: space-between;
    }

    #gg-lottery-counter {
        padding-left: 0.5em;
    }

    #gg-lottery-button {
        font-size: 25px;
        border-radius: 10px;
        padding: 5px 20px;
        color: white;
        background: black;
        opacity: 75%;
        cursor: pointer;
        border: none;
    }

    #gg-lottery-button-container {
        display: flex;
        gap: 10px;
        align-items: center;
        margin-top: 0.5em;
    }

    #gg-lottery-reset-button {
        font-size: 25px;
        border-radius: 10px;
        padding: 5px 12px;
        color: white;
        background: #c41e3a;
        opacity: 75%;
        cursor: pointer;
        border: none;
        transition: opacity 0.2s ease;
    }

    #gg-lottery-reset-button:hover {
        opacity: 90%;
    }
`;

// Utility styles (used by multiple mods)
const utilityStyles = `
    #gg-guessmap-blocker {
        width: 100%;
        height: 100%;
        position: absolute;
        pointer-events: none;
        z-index: 99999999;
    }
`;

// Combine and apply CSS styles
const applyModStyles = () => {
    const combinedStyles = 
        genericStyles +
        modContainerStyles +
        optionMenuStyles +
        showScoreStyles +
        flashlightStyles +
        displayOptionsStyles +
        (IS_OPERA ? operaOptimizationStyles : '') +
        tileRevealStyles +
        lotteryStyles +
        utilityStyles;
        
    GM_addStyle(combinedStyles);
};

applyModStyles();
