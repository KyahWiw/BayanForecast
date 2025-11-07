// ===========================
// Windy Map Forecast API Integration
// Documentation: https://api.windy.com/map-forecast/docs
// ===========================

let windyAPI = null;
let windyMapInitialized = false;
let windyMapContainer = null;

// Windy API key - will be loaded from config endpoint
// Note: Windy Map API requires the key on frontend (security consideration)
let WINDY_API_KEY = null;

// ===========================
// Initialize Windy Map
// ===========================
async function initializeWindyMap() {
    if (windyMapInitialized && windyAPI) {
        return windyAPI;
    }

    // Windy Map Forecast API requires a container with id="windy"
    // According to documentation: "There can be only one instance of the Windy Map on a page"
    const windyContainer = document.getElementById('windy');
    if (!windyContainer) {
        console.error('Windy map container with id="windy" not found');
        if (typeof showNotification === 'function') {
            showNotification('Windy map container not found. Please ensure there is a div with id="windy"', 'error');
        }
        return null;
    }

    // Check if Windy library (boot function) is loaded
    if (typeof boot === 'undefined') {
        console.error('Windy API library not loaded. Please ensure libBoot.js is included.');
        console.error('Check if this script is loaded: https://api.windy.com/assets/map-forecast/libBoot.js');
        if (typeof showNotification === 'function') {
            showNotification('Windy API library not loaded. Please check your script includes.', 'error');
        }
        return null;
    }

    console.log('Windy boot() function is available:', typeof boot === 'function');

    try {
        // Get API key from config
        const apiKey = await getWindyAPIKey();

        if (!apiKey || apiKey === 'null' || apiKey === 'YOUR_WINDY_API_KEY_HERE' || apiKey === '') {
            console.error('=== WINDY API KEY NOT CONFIGURED ===');
            console.error('To fix this issue:');
            console.error('1. Get a Windy API key from: https://api.windy.com/');
            console.error('2. Create a .env file in the project root');
            console.error('3. Add this line: WINDY_MAP_API_KEY=your-api-key-here');
            console.error('4. Replace "your-api-key-here" with your actual API key');
            console.error('5. Authorize your domain in Windy dashboard');
            console.error('6. Refresh this page');
            console.error('=====================================');
            
            if (typeof showNotification === 'function') {
                showNotification('Windy API key not configured. See WINDY-SETUP.md for instructions. Falling back to OpenWeatherMap...', 'warning');
            }
            return null;
        }

        console.log('Initializing Windy Map Forecast API...');
        console.log('API key length:', apiKey.length);
        console.log('Container found:', !!windyContainer);

        // Initialize Windy API using boot() function
        // According to docs: boot() looks for #windy container by default
        console.log('=== Windy Map Initialization Debug ===');
        console.log('API Key (first 15 chars):', apiKey.substring(0, 15) + '...');
        console.log('API Key length:', apiKey.length);
        console.log('Container element:', windyContainer);
        console.log('Container ID:', windyContainer.id);
        console.log('Container visible:', windyContainer.offsetParent !== null);
        console.log('Container dimensions:', {
            width: windyContainer.offsetWidth || windyContainer.clientWidth,
            height: windyContainer.offsetHeight || windyContainer.clientHeight
        });

        // Ensure container has proper dimensions
        if (!windyContainer.style.height || windyContainer.style.height === '0px' || windyContainer.style.height === '') {
            windyContainer.style.height = '700px';
            console.log('Set container height to 700px');
        }
        if (!windyContainer.style.width || windyContainer.style.width === '0px' || windyContainer.style.width === '') {
            windyContainer.style.width = '100%';
            console.log('Set container width to 100%');
        }

        console.log('Calling Windy boot()...');
        try {
            windyAPI = boot({
                key: apiKey,
                verbose: true // Enable verbose logging for debugging
            });
            console.log('boot() returned:', windyAPI);
        } catch (bootError) {
            console.error('Error during Windy boot() call:', bootError);
            console.error('Error type:', bootError.constructor.name);
            console.error('Error message:', bootError.message);
            console.error('Error stack:', bootError.stack);
            throw new Error('Windy boot() failed: ' + bootError.message);
        }

        // Wait for Windy to fully initialize
        // The API may need time to load resources
        console.log('Waiting for Windy to initialize (2 seconds)...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('After wait - windyAPI:', windyAPI);
        if (windyAPI) {
            console.log('windyAPI keys:', Object.keys(windyAPI));
        }

        // Verify initialization
        if (!windyAPI) {
            console.error('=== WINDY API INITIALIZATION FAILED ===');
            console.error('The Windy API boot() function returned null/undefined.');
            console.error('');
            console.error('Common causes:');
            console.error('1. Invalid API key format');
            console.error('2. API key not authorized for this domain');
            console.error('3. Network/connection issue');
            console.error('4. Windy API service is down');
            console.error('');
            console.error('Troubleshooting steps:');
            console.error('1. Verify your API key at: https://api.windy.com/');
            console.error('2. Check if your domain is authorized in Windy dashboard');
            console.error('   - For localhost: Make sure "localhost" is in authorized domains');
            console.error('   - For production: Add your actual domain');
            console.error('3. Check browser Network tab (F12) for failed requests');
            console.error('4. Test your API key at: https://api.windy.com/map-forecast/docs');
            console.error('5. See WINDY-SETUP.md for detailed setup instructions');
            console.error('=========================================');
            
            if (typeof showNotification === 'function') {
                showNotification('Windy API initialization failed. Check console (F12) for details. Falling back to OpenWeatherMap...', 'warning');
            }
            
            throw new Error('Windy API boot failed - check API key validity and domain authorization. See WINDY-SETUP.md for help.');
        }

        if (!windyAPI.map) {
            console.error('=== Windy API initialized but map property is missing ===');
            console.log('Available Windy API properties:', Object.keys(windyAPI || {}));
            console.log('windyAPI type:', typeof windyAPI);
            console.log('windyAPI value:', windyAPI);

            // Sometimes Windy returns a promise or needs more time
            if (windyAPI.then && typeof windyAPI.then === 'function') {
                console.log('windyAPI appears to be a Promise, waiting for resolution...');
                windyAPI = await windyAPI;
                console.log('Promise resolved, windyAPI:', windyAPI);
            }

            if (!windyAPI.map) {
                throw new Error('Windy map not initialized properly - map property missing after wait');
            }
        }

        // Verify required API components
        if (!windyAPI.store) {
            console.warn('Windy API store not available');
        }

        console.log('Windy Map Forecast API initialized successfully:', {
            hasMap: !!windyAPI.map,
            hasStore: !!windyAPI.store,
            hasPicker: !!windyAPI.picker,
            hasUtils: !!windyAPI.utils
        });

        // Set initial view to Philippines
        const philippinesCenter = [12.8797, 121.7740];
        windyAPI.map.setView(philippinesCenter, 6);

        // Set default overlay to wind for typhoon tracking
        if (windyAPI.store) {
            windyAPI.store.set('overlay', 'wind');
            windyAPI.store.set('level', 'surface');
            windyAPI.store.set('particles', true);
        }

        windyMapInitialized = true;
        windyMapContainer = windyContainer;

        // Set up Windy map event listeners
        setupWindyMapEvents();

        console.log('Windy Map Forecast API ready');
        return windyAPI;
    } catch (error) {
        console.error('Error initializing Windy Map Forecast API:', error);
        console.error('Error stack:', error.stack);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            apiKeyLength: apiKey ? apiKey.length : 0,
            apiKeyPrefix: apiKey ? apiKey.substring(0, 10) : 'none',
            containerExists: !!windyContainer,
            bootFunctionExists: typeof boot !== 'undefined'
        });

        let errorMessage = 'Failed to initialize Windy Map: ' + error.message;
        if (error.message.includes('API key')) {
            errorMessage += '\n\nPlease check:\n1. API key is correct in .env file\n2. API key is authorized for your domain\n3. WINDY_MAP_API_KEY is set correctly';
        }

        if (typeof showNotification === 'function') {
            showNotification(errorMessage, 'error');
        }
        return null;
    }
}

// ===========================
// Get Windy API Key
// ===========================
async function getWindyAPIKey() {
    // If already loaded, return it
    if (WINDY_API_KEY) {
        console.log('Using cached Windy API key');
        return WINDY_API_KEY;
    }

    // Try to get from config endpoint
    try {
        console.log('Fetching Windy API key from config endpoint...');
        const response = await fetch('api.php?action=config');
        if (response.ok) {
            const data = await response.json();
            console.log('Config response:', data);

            if (data.success && data.data) {
                if (data.data.windyEnabled && data.data.windyApiKey) {
                    // Key is available from backend
                    WINDY_API_KEY = data.data.windyApiKey;
                    console.log('Windy API key retrieved from backend:', WINDY_API_KEY ? WINDY_API_KEY.substring(0, 10) + '...' : 'null');
                    // Store in localStorage for future use
                    localStorage.setItem('windy_api_key', WINDY_API_KEY);
                    return WINDY_API_KEY;
                } else {
                    console.warn('Windy is enabled but API key is missing:', {
                        windyEnabled: data.data.windyEnabled,
                        hasKey: !!data.data.windyApiKey
                    });
                }
            } else {
                console.warn('Config response not successful:', data);
            }
        } else {
            console.warn('Config endpoint returned error:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Could not fetch config:', error);
    }

    // Try to get from localStorage (if previously stored)
    const storedKey = localStorage.getItem('windy_api_key');
    if (storedKey && storedKey !== 'YOUR_WINDY_API_KEY_HERE' && storedKey !== 'null') {
        console.log('Using Windy API key from localStorage');
        WINDY_API_KEY = storedKey;
        return storedKey;
    }

    // No API key found - return null to trigger fallback
    console.warn('=== WINDY API KEY NOT FOUND ===');
    console.warn('No API key found in:');
    console.warn('1. Backend config endpoint');
    console.warn('2. localStorage');
    console.warn('');
    console.warn('To set up Windy API:');
    console.warn('1. Get API key from: https://api.windy.com/');
    console.warn('2. Create .env file with: WINDY_MAP_API_KEY=your-key');
    console.warn('3. Or set it in config.php');
    console.warn('4. Authorize your domain in Windy dashboard');
    console.warn('5. See WINDY-SETUP.md for detailed instructions');
    console.warn('================================');
    
    // Don't use fallback key - let it fall back to OpenWeatherMap instead
    return null;
}

// ===========================
// Setup Windy Map Events
// ===========================
function setupWindyMapEvents() {
    if (!windyAPI) return;

    // Listen to store changes
    windyAPI.store.on('pickerOpened', (data) => {
        console.log('Windy picker opened at:', data);
    });

    // Listen to broadcast events
    windyAPI.broadcast.on('redraw', () => {
        // Map redrawn, update typhoon markers if needed
        if (state && state.typhoonMarkers) {
            updateTyphoonMarkersOnWindyMap();
        }
    });
}

// ===========================
// Switch to Windy Map View
// ===========================
async function switchToWindyMap() {
    console.log('Switching to Windy map...');

    if (!windyAPI) {
        // Try to initialize if not already done
        console.log('Windy API not initialized, initializing now...');
        windyAPI = await initializeWindyMap();
        if (!windyAPI) {
            console.error('Failed to initialize Windy map');
            return false;
        }
    }

    // Check if Windy API and map are available
    if (!windyAPI || !windyAPI.map) {
        console.error('Windy API or map not available:', {
            hasAPI: !!windyAPI,
            hasMap: !!(windyAPI && windyAPI.map)
        });
        return false;
    }

    // Show Windy map container (id="windy")
    const windyMapContainer = document.getElementById('windy');
    if (windyMapContainer) {
        windyMapContainer.style.display = 'block';

        // Set default view to Philippines if not already set
        const currentCenter = windyAPI.map.getCenter();
        if (!currentCenter || (currentCenter.lat === 0 && currentCenter.lng === 0)) {
            windyAPI.map.setView([12.8797, 121.7740], 6);
        }

        // Set default layer to wind for typhoon tracking
        if (windyAPI.store) {
            windyAPI.store.set('overlay', 'wind');
            windyAPI.store.set('level', 'surface');
            windyAPI.store.set('particles', true);
        }

        // Invalidate size to ensure proper rendering
        setTimeout(() => {
            if (windyAPI.map && windyAPI.map.invalidateSize) {
                windyAPI.map.invalidateSize();
            }
        }, 200);

        console.log('Successfully switched to Windy map');
        return true;
    } else {
        console.error('Windy map container (id="windy") not found');
        return false;
    }
}

// ===========================
// Switch from Windy Map
// ===========================
function switchFromWindyMap() {
    // Hide Windy map container (id="windy")
    const windyMapContainer = document.getElementById('windy');
    if (windyMapContainer) {
        windyMapContainer.style.display = 'none';
    }
    return true;
}

// ===========================
// Update Typhoon Markers on Windy Map
// ===========================
function updateTyphoonMarkersOnWindyMap() {
    if (!windyAPI || !windyAPI.map) {
        return;
    }

    // Clear existing markers
    if (state.typhoonMarkers && state.typhoonMarkers.length > 0) {
        state.typhoonMarkers.forEach(marker => {
            if (marker && windyAPI.map.hasLayer(marker)) {
                windyAPI.map.removeLayer(marker);
            }
        });
    }

    // Add new typhoon markers if available
    if (state.typhoonData && Array.isArray(state.typhoonData) && state.typhoonData.length > 0) {
        state.typhoonMarkers = [];
        state.typhoonData.forEach(typhoon => {
            if (typhoon.latitude && typhoon.longitude && typeof createTyphoonMarker === 'function') {
                const marker = createTyphoonMarker(typhoon);
                if (marker) {
                    state.typhoonMarkers.push(marker);
                    marker.addTo(windyAPI.map);
                }
            }
        });
    }
}

// ===========================
// Set Windy Map Layer
// ===========================
function setWindyMapLayer(layerName) {
    if (!windyAPI) return;

    // Available layers: wind, temp, pressure, clouds, precip, etc.
    const validLayers = ['wind', 'temp', 'pressure', 'clouds', 'precip', 'rh', 'cape'];

    if (validLayers.includes(layerName)) {
        windyAPI.store.set('overlay', layerName);
        return true;
    }

    return false;
}

// ===========================
// Set Windy Map Level
// ===========================
function setWindyMapLevel(level) {
    if (!windyAPI) return;

    // Available levels: surface, 1000h, 850h, 700h, 500h, 300h, etc.
    const validLevels = ['surface', '1000h', '850h', '700h', '500h', '300h', '200h'];

    if (validLevels.includes(level)) {
        windyAPI.store.set('level', level);
        return true;
    }

    return false;
}

// ===========================
// Get Windy Map Picker Value
// ===========================
function getWindyMapValue(lat, lon) {
    if (!windyAPI || !windyAPI.picker) {
        return null;
    }

    // Open picker at coordinates
    windyAPI.picker.open({ lat: lat, lon: lon });

    // Get values
    const params = windyAPI.picker.getParams();
    return params;
}

// ===========================
// Export for use in other scripts
// ===========================
if (typeof window !== 'undefined') {
    window.WindyMapAPI = {
        initialize: initializeWindyMap,
        switchTo: switchToWindyMap,
        switchFrom: switchFromWindyMap,
        setLayer: setWindyMapLayer,
        setLevel: setWindyMapLevel,
        getValue: getWindyMapValue,
        getAPI: () => windyAPI
    };
}