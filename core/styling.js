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
            position: absolute;
            width: 200px;
            top: 20px;
            left: 20px;
            z-index: 999999;
            display: flex;
            flex-direction: column;
            background: rgba(0, 0, 0, 0.1);
            border-radius: 10px;
            padding: 10px;
        }

        #gg-mods-header-container {
            display: flex;
            align-items: center;
            font-size: 18px;
            justify-content: space-between;
        }

        #gg-mods-header {
            font-weight: bold;
            text-shadow: ${headerShadow};
            position: relative;
            color: white;
        }

        #gg-mods-container-toggle {
            padding: 2px 6px;
            font-size: 16px;
            cursor: pointer;
            text-shadow: ${headerShadow};
            background: none;
            border: none;
            color: white;
            font-weight: bold;
        }

        #gg-mods-button-container {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-top: 10px;
            z-index: 9999;
        }

        .gg-mod-button {
            background: var(--ds-color-purple-100, #8e44ad);
            border-radius: 5px;
            font-size: 14px;
            cursor: pointer;
            opacity: 0.9;
            transition: opacity 0.2s;
            padding: 4px 10px;
            color: white;
            font-weight: bold;
            text-shadow: ${bodyShadow};
            border: 1px solid #666;
        }

        .gg-mod-button:hover {
            opacity: 1;
            background: var(--ds-color-purple-200, #9b59b6);
        }

        .gg-mod-button.active {
            background: ${greenMenuColor};
            opacity: 1;
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
            border-radius: 20px;
            height: 30px;
            border: none;
            cursor: pointer;
            font-weight: bold;
        }

        #gg-flashlight-div {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(
                circle at var(--flashlight-x-pos, 50%) var(--flashlight-y-pos, 50%),
                transparent var(--flashlight-radius, 100px),
                rgba(0, 0, 0, 0.95) var(--flashlight-blur, 150px)
            );
            pointer-events: none;
            z-index: 999998;
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
    
    console.log('GeoGuessr MultiMod: CSS styles applied');
};

// Apply styles when this file loads
applyModStyles();
