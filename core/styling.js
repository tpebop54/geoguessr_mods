// ==UserScript==
// @name         GG Styling
// @description  CSS styling for GeoGuessr mods
// @version      1.0
// @author       tpebop

// ==/UserScript==

// Dynamic styling.
// ===============================================================================================================================

const headerShadow = 'rgb(204, 48, 46) 2px 0px 0px, rgb(204, 48, 46) 1.75517px 0.958851px 0px, rgb(204, 48, 46) 1.0806px 1.68294px 0px, rgb(204, 48, 46) 0.141474px 1.99499px 0px, rgb(204, 48, 46) -0.832294px 1.81859px 0px, rgb(204, 48, 46) -1.60229px 1.19694px 0px, rgb(204, 48, 46) -1.97998px 0.28224px 0px, rgb(204, 48, 46) -1.87291px -0.701566px 0px, rgb(204, 48, 46) -1.30729px -1.5136px 0px, rgb(204, 48, 46) -0.421592px -1.95506px 0px, rgb(204, 48, 46) 0.567324px -1.91785px 0px, rgb(204, 48, 46) 1.41734px -1.41108px 0px, rgb(204, 48, 46) 1.92034px -0.558831px 0px';
const bodyShadow = '3px 3px 0 #000, 3px 0px 3px #000, 1px 1px 0 #000, 3px 1px 2px #000';
const greenMenuColor = '#006400';

// Apply CSS styles
const applyModStyles = () => {
    const style = `
        body {
            overflow: hidden;
        }

        .hidden {
            display: none !important;
        }

        #gg-mods-container {
            position: absolute !important;
            width: 200px !important;
            top: 40px !important;
            left: 20px !important;
            z-index: 9 !important;
            display: flex !important;
            flex-direction: column !important;
        }

        #gg-mods-header-container {
            display: flex;
            align-items: center;
            font-size: 18px;
            justify-content: space-between;
        }

        #gg-mods-header {
            font-weight: bold !important;
            text-shadow: ${headerShadow} !important;
            position: relative !important;
        }

        #gg-mods-container-toggle {
            padding: 0 !important;
            font-size: 16px !important;
            cursor: pointer !important;
            text-shadow: ${headerShadow} !important;
        }

        #gg-mods-button-container {
            display: flex !important;
            flex-direction: column !important;
            gap: 6px !important;
            margin-top: 10px !important;
            z-index: 9999 !important;
        }

        .gg-mod-button {
            background: var(--ds-color-purple-100) !important;
            border-radius: 5px !important;
            font-size: 14px !important;
            cursor: pointer !important;
            opacity: 0.9 !important;
            transition: opacity 0.2s !important;
            padding: 4px 10px !important;
        }

        .gg-mod-button:hover {
            opacity: 1 !important;
        }

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

        #gg-option-menu {
            position: absolute;
            left: 110%;
            min-width: 300px;
            padding: 15px;
            background: var(--ds-color-purple-100, #8e44ad);
            border-radius: 10px;
            border: 2px solid black;
            color: white;
            font-size: 15px;
            font-weight: bold;
            text-shadow: ${bodyShadow};
            z-index: 9999;
            overflow: hidden;
            cursor: move;
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
            text-shadow: none;
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
            text-shadow: ${bodyShadow};
            padding: 0;
            cursor: pointer;
            border: none;
            font-weight: bold;
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

        #gg-color-overlay {
            position: absolute;
            width: 100vw;
            height: 100vh;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 2;
        }

        /* TODO: can this be merged with the lottery CSS? and also some of it with gg-option-menu */
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

    if (typeof GM_addStyle !== 'undefined') {
        GM_addStyle(style);
    } else {
        // Fallback if GM_addStyle is not available
        const styleSheet = document.createElement('style');
        styleSheet.textContent = style;
        document.head.appendChild(styleSheet);
    }
};

// Apply styles when this file loads
applyModStyles();
