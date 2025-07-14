// ==UserScript==
// @author       tpebop

// ==/UserScript==

// MOD: Satellite view.
// ===============================================================================================================================

const updateSatViewLogic = (forceState = undefined) => {
    console.debug(`updateSatViewLogic called with forceState: ${forceState}`);
    const mod = MODS.satView;
    const active = updateMod(mod, forceState);
    
    if (!GOOGLE_MAP) {
        console.warn('Satellite view: GOOGLE_MAP not available');
        return;
    }
    
    // Enhanced readiness check for satellite view
    const ensureMapReady = () => {
        try {
            // Check if map has bounds and center (indicating it's fully loaded)
            if (!GOOGLE_MAP.getBounds || !GOOGLE_MAP.getCenter || !GOOGLE_MAP.getBounds() || !GOOGLE_MAP.getCenter()) {
                console.debug('Satellite view: Map not fully ready, waiting...');
                return false;
            }
            
            // Additional check: ensure map has rendered tiles
            const mapDiv = GOOGLE_MAP.getDiv();
            if (!mapDiv || !mapDiv.querySelector('.gm-style img')) {
                console.debug('Satellite view: Map tiles not loaded yet, waiting...');
                return false;
            }
            
            return true;
        } catch (err) {
            console.debug('Satellite view: Error checking map readiness:', err);
            return false;
        }
    };
    
    const applyMapType = () => {
        try {
            const targetMapType = active ? 'satellite' : 'roadmap';
            GOOGLE_MAP.setMapTypeId(targetMapType);
            console.debug(`Satellite view: Successfully set to ${targetMapType}`);
            
            // Verify the change took effect
            setTimeout(() => {
                const currentMapType = GOOGLE_MAP.getMapTypeId();
                if (currentMapType !== targetMapType) {
                    console.warn(`Satellite view: Map type didn't stick (wanted ${targetMapType}, got ${currentMapType}), retrying...`);
                    GOOGLE_MAP.setMapTypeId(targetMapType);
                }
            }, 500);
            
        } catch (err) {
            console.error('Satellite view: Error setting map type:', err);
            // Retry after a short delay
            setTimeout(() => {
                try {
                    GOOGLE_MAP.setMapTypeId(active ? 'satellite' : 'roadmap');
                    console.debug('Satellite view: Retry successful');
                } catch (retryErr) {
                    console.error('Satellite view: Retry also failed:', retryErr);
                }
            }, 1000);
        }
    };
    
    // If map is immediately ready, apply right away
    if (ensureMapReady()) {
        applyMapType();
        return;
    }
    
    // Otherwise, wait for map to be ready with timeout
    let attempts = 0;
    const maxAttempts = 20; // 10 seconds max
    const checkInterval = setInterval(() => {
        attempts++;
        
        if (ensureMapReady()) {
            clearInterval(checkInterval);
            applyMapType();
        } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.warn('Satellite view: Timeout waiting for map readiness, applying anyway');
            applyMapType();
        }
    }, 500);
};

const updateSatView = createMapSafeModUpdate(updateSatViewLogic, {
    require2D: true,
    require3D: false,
    modName: 'Satellite view',
    timeout: 5000
});
