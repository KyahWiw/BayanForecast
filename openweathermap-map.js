// ===========================
// OpenWeatherMap Map Integration
// Uses Weather Maps 2.0 API tile layers
// Documentation: https://openweathermap.org/api/weather-map-2
// ===========================

let owmMap = null;
let owmMapLayers = {};
let owmMapInitialized = false;
let trackVisible = true; // Track visible by default

// Available OpenWeatherMap map layers
const OWM_LAYERS = {
    clouds: {
        name: 'Clouds',
        url: 'https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png',
        icon: 'fa-cloud'
    },
    precipitation: {
        name: 'Precipitation',
        url: 'https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png',
        icon: 'fa-cloud-rain'
    },
    globalPrecipitation: {
        name: 'Global Precipitation',
        url: 'https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png',
        icon: 'fa-globe',
        description: 'Global precipitation patterns and rainfall intensity'
    },
    pressure: {
        name: 'Pressure',
        url: 'https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png',
        icon: 'fa-compress-arrows-alt'
    },
    wind: {
        name: 'Wind',
        url: 'https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png',
        icon: 'fa-wind'
    },
    temp: {
        name: 'Temperature',
        url: 'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png',
        icon: 'fa-thermometer-half'
    }
};

// ===========================
// Satellite Imagery Layers (JMA/NOAA/CIRA Himawari)
// ===========================
const SATELLITE_LAYERS = {
    himawari8: {
        name: 'Himawari-8 Satellite',
        // Using RAMMB/CIRA Himawari-8 satellite imagery
        // Real-time satellite imagery from JMA/NOAA/CIRA
        getUrl: function() {
            // Using NASA Worldview for Himawari-8 satellite imagery
            // Alternative: Can use EUMETSAT or AWS Open Data Registry for direct tile access
            // For now, using a proxy-friendly tile service
            // Note: This may require CORS proxy or backend proxy for production use
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const date = `${year}${month}${day}`;
            // Try using NASA GIBS or EUMETSAT tile service
            // Fallback: Use static image overlay approach if tiles don't work
            // Using CIRA RAMMB for now - may need CORS proxy
            return `https://rammb-slider.cira.colostate.edu/data/imagery/${date}/himawari---full_disk/geocolor/{z}/{y}/{x}.png`;
        },
        icon: 'fa-satellite',
        description: 'Real-time satellite imagery from Himawari-8 (JMA/NOAA/CIRA)',
        attribution: '&copy; <a href="https://www.cira.colostate.edu/">CIRA</a> / <a href="https://www.jma.go.jp/">JMA</a> / <a href="https://www.noaa.gov/">NOAA</a>',
        minZoom: 2,
        maxZoom: 8,
        opacity: 0.9,
        isSatellite: true
    },
    himawari8Visible: {
        name: 'Himawari-8 Visible',
        // Visible light satellite imagery
        getUrl: function() {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const date = `${year}${month}${day}`;
            return `https://rammb-slider.cira.colostate.edu/data/imagery/${date}/himawari---full_disk/band_03/{z}/{y}/{x}.png`;
        },
        icon: 'fa-satellite-dish',
        description: 'Himawari-8 Visible Light Satellite Imagery',
        attribution: '&copy; <a href="https://www.cira.colostate.edu/">CIRA</a> / <a href="https://www.jma.go.jp/">JMA</a>',
        minZoom: 2,
        maxZoom: 8,
        opacity: 0.85,
        isSatellite: true
    },
    himawari8Infrared: {
        name: 'Himawari-8 Infrared',
        // Infrared satellite imagery
        getUrl: function() {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const date = `${year}${month}${day}`;
            return `https://rammb-slider.cira.colostate.edu/data/imagery/${date}/himawari---full_disk/band_13/{z}/{y}/{x}.png`;
        },
        icon: 'fa-satellite',
        description: 'Himawari-8 Infrared Satellite Imagery',
        attribution: '&copy; <a href="https://www.cira.colostate.edu/">CIRA</a> / <a href="https://www.jma.go.jp/">JMA</a>',
        minZoom: 2,
        maxZoom: 8,
        opacity: 0.85,
        isSatellite: true
    }
};

// Store satellite layer instances
let satelliteLayerInstances = {};
let currentSatelliteLayer = null;

// City markers with temperature
let cityMarkersLayer = null;
let citiesVisible = true;

// Major cities in Southeast Asia and Pacific (matching image)
const MAJOR_CITIES = [
    // Philippines
    { name: 'Manila', lat: 14.5995, lon: 120.9842, country: 'PH' },
    { name: 'Antipolo City', lat: 14.5842, lon: 121.1763, country: 'PH' },
    { name: 'Zamboanga City', lat: 6.9214, lon: 122.0790, country: 'PH' },
    { name: 'Cebu City', lat: 10.3157, lon: 123.8854, country: 'PH' },
    // Vietnam
    { name: 'Hanoi', lat: 21.0285, lon: 105.8542, country: 'VN' },
    { name: 'Vung Tau', lat: 10.3460, lon: 107.0843, country: 'VN' },
    // Thailand
    { name: 'Bangkok', lat: 13.7563, lon: 100.5018, country: 'TH' },
    // Cambodia
    { name: 'Phnom Penh', lat: 11.5564, lon: 104.9282, country: 'KH' },
    // Malaysia
    { name: 'Kota Kinabalu', lat: 5.9804, lon: 116.0735, country: 'MY' },
    // Pacific Islands
    { name: 'Saipan', lat: 15.1778, lon: 145.7508, country: 'MP' },
    { name: 'Elato', lat: 7.5022, lon: 146.1653, country: 'FM' },
    { name: 'Weno', lat: 7.4464, lon: 151.8414, country: 'FM' },
    { name: 'Rumung', lat: 9.5167, lon: 138.1167, country: 'FM' },
    { name: 'Melekeok', lat: 7.4933, lon: 134.6369, country: 'PW' },
    { name: 'Sorong', lat: -0.8636, lon: 131.2580, country: 'ID' }
];

// ===========================
// Initialize OpenWeatherMap Map
// ===========================
async function initializeOWMMap() {
    if (owmMapInitialized && owmMap) {
        return owmMap;
    }

    // Get API key from config
    const apiKey = await getOWMAPIKey();
    if (!apiKey || apiKey === 'YOUR_OPENWEATHER_API_KEY_HERE') {
        console.error('OpenWeatherMap API key not configured');
        if (typeof showNotification === 'function') {
            showNotification('OpenWeatherMap API key not configured. Please check your .env file.', 'warning');
        }
        return null;
    }

    // Check if Leaflet is available
    if (typeof L === 'undefined') {
        console.error('Leaflet library not loaded');
        if (typeof showNotification === 'function') {
            showNotification('Leaflet library not loaded. Please include Leaflet.js', 'error');
        }
        return null;
    }

    // Get map container
    const mapContainer = document.getElementById('windy') || document.getElementById('typhoonMap');
    if (!mapContainer) {
        console.error('Map container not found');
        return null;
    }

    try {
        // Initialize Leaflet map
        const philippinesCenter = [12.8797, 121.7740];
        owmMap = L.map(mapContainer, {
            center: philippinesCenter,
            zoom: 6,
            zoomControl: true,
            attributionControl: true
        });

        // Add base map (OpenStreetMap)
        const baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        });
        baseLayer.addTo(owmMap);

        // Initialize weather layers
        Object.keys(OWM_LAYERS).forEach(layerKey => {
            const layer = OWM_LAYERS[layerKey];
            const layerOptions = {
                attribution: '&copy; <a href="https://openweathermap.org">OpenWeatherMap</a>',
                opacity: 0.7,
                maxZoom: 19
            };
            
            // Special settings for Global Precipitation
            if (layerKey === 'globalPrecipitation') {
                layerOptions.opacity = 0.8;
                layerOptions.minZoom = 2;
                layerOptions.maxZoom = 10;
            }
            
            owmMapLayers[layerKey] = L.tileLayer(layer.url + '?appid=' + apiKey, layerOptions);
        });

        // Initialize satellite layers
        Object.keys(SATELLITE_LAYERS).forEach(layerKey => {
            const layer = SATELLITE_LAYERS[layerKey];
            try {
                const url = typeof layer.getUrl === 'function' ? layer.getUrl() : layer.url;
                const layerOptions = {
                    attribution: layer.attribution || '&copy; Satellite Imagery',
                    opacity: layer.opacity || 0.9,
                    minZoom: layer.minZoom || 2,
                    maxZoom: layer.maxZoom || 8,
                    tileSize: 256,
                    zoomOffset: 0,
                    crossOrigin: true,
                    // Handle CORS for satellite imagery
                    errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
                };
                
                satelliteLayerInstances[layerKey] = L.tileLayer(url, layerOptions);
            } catch (error) {
                console.warn(`Failed to initialize satellite layer ${layerKey}:`, error);
            }
        });

        // Add default Global Precipitation layer (matching image style)
        owmMapLayers.globalPrecipitation.addTo(owmMap);
        // Set zoom level for better global view
        owmMap.setView([12.8797, 121.7740], 5);

        // Add marker cluster group for typhoons
        if (typeof L.markerClusterGroup !== 'undefined') {
            owmMapLayers.markers = L.markerClusterGroup({
                chunkedLoading: true,
                maxClusterRadius: 50
            });
            owmMap.addLayer(owmMapLayers.markers);
        } else {
            owmMapLayers.markers = L.layerGroup();
            owmMap.addLayer(owmMapLayers.markers);
        }
        
        // Add track layer for typhoon forecast paths
        owmMapLayers.tracks = L.layerGroup();
        owmMap.addLayer(owmMapLayers.tracks);
        
        // Initialize city markers layer
        cityMarkersLayer = L.layerGroup();
        owmMap.addLayer(cityMarkersLayer);
        
        // Add city markers with temperature
        await addCityMarkersWithTemperature(apiKey);
        
        // Add precipitation legend
        addPrecipitationLegend();
        
        // Store reference in global state if available
        if (typeof window !== 'undefined' && window.state) {
            window.state.markerGroup = owmMapLayers.markers;
            window.state.typhoonMarkers = [];
            window.state.trackLayer = owmMapLayers.tracks;
            window.state.cityMarkersLayer = cityMarkersLayer;
        }

        owmMapInitialized = true;
        console.log('OpenWeatherMap map initialized successfully');

        return owmMap;
    } catch (error) {
        console.error('Error initializing OpenWeatherMap map:', error);
        if (typeof showNotification === 'function') {
            showNotification('Failed to initialize OpenWeatherMap map: ' + error.message, 'error');
        }
        return null;
    }
}

// ===========================
// Get OpenWeatherMap API Key
// ===========================
async function getOWMAPIKey() {
    // Try to get from config endpoint
    try {
        const response = await fetch('api.php?action=config');
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data && data.data.openweatherApiKey) {
                return data.data.openweatherApiKey;
            }
        }
    } catch (error) {
        console.error('Could not fetch config:', error);
    }

    // Try localStorage
    const storedKey = localStorage.getItem('openweather_api_key');
    if (storedKey && storedKey !== 'YOUR_OPENWEATHER_API_KEY_HERE') {
        return storedKey;
    }

    return null;
}

// ===========================
// Switch OpenWeatherMap Layer
// ===========================
function switchOWMLayer(layerName) {
    if (!owmMap) {
        console.warn('Map not initialized');
        return false;
    }

    // Check if it's a satellite layer
    if (SATELLITE_LAYERS[layerName]) {
        return switchSatelliteLayer(layerName);
    }

    // Check if it's a weather layer
    if (!owmMapLayers[layerName]) {
        console.warn('Layer not available:', layerName);
        return false;
    }

    // Remove all satellite layers first
    if (currentSatelliteLayer) {
        owmMap.removeLayer(satelliteLayerInstances[currentSatelliteLayer]);
        currentSatelliteLayer = null;
    }

    // Remove all weather layers (except markers and tracks)
    Object.keys(OWM_LAYERS).forEach(key => {
        if (owmMapLayers[key] && owmMap.hasLayer(owmMapLayers[key])) {
            owmMap.removeLayer(owmMapLayers[key]);
        }
    });

    // Handle Global Precipitation - set zoom to show global view
    if (layerName === 'globalPrecipitation') {
        if (owmMapLayers.globalPrecipitation) {
            owmMapLayers.globalPrecipitation.addTo(owmMap);
            // Set view to show global precipitation (world view)
            owmMap.setView([20, 0], 2, { animate: true });
            console.log('Switched to Global Precipitation layer - showing global view');
            return true;
        }
    }

    // Add selected layer
    owmMapLayers[layerName].addTo(owmMap);
    console.log('Switched to layer:', layerName);
    return true;
}

// ===========================
// Switch Satellite Layer
// ===========================
function switchSatelliteLayer(layerName) {
    if (!owmMap || !SATELLITE_LAYERS[layerName]) {
        console.warn('Satellite layer not available:', layerName);
        return false;
    }

    // Remove current satellite layer if any
    if (currentSatelliteLayer && satelliteLayerInstances[currentSatelliteLayer]) {
        owmMap.removeLayer(satelliteLayerInstances[currentSatelliteLayer]);
    }

    // Remove all weather layers
    Object.keys(OWM_LAYERS).forEach(key => {
        if (owmMapLayers[key] && owmMap.hasLayer(owmMapLayers[key])) {
            owmMap.removeLayer(owmMapLayers[key]);
        }
    });

    // Initialize satellite layer if not already done
    if (!satelliteLayerInstances[layerName]) {
        const layer = SATELLITE_LAYERS[layerName];
        try {
            const url = typeof layer.getUrl === 'function' ? layer.getUrl() : layer.url;
            const layerOptions = {
                attribution: layer.attribution || '&copy; Satellite Imagery',
                opacity: layer.opacity || 0.9,
                minZoom: layer.minZoom || 2,
                maxZoom: layer.maxZoom || 8,
                tileSize: 256,
                zoomOffset: 0,
                crossOrigin: true,
                errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
            };
            
            satelliteLayerInstances[layerName] = L.tileLayer(url, layerOptions);
        } catch (error) {
            console.error(`Failed to create satellite layer ${layerName}:`, error);
            return false;
        }
    }

    // Add satellite layer to map
    satelliteLayerInstances[layerName].addTo(owmMap);
    currentSatelliteLayer = layerName;

    // Adjust zoom for satellite view (full disk view for Himawari)
    if (layerName.includes('himawari')) {
        owmMap.setView([12.8797, 121.7740], 4, { animate: true });
    }

    console.log('Switched to satellite layer:', layerName);
    return true;
}

// ===========================
// Update Typhoon Markers on OWM Map
// ===========================
function updateTyphoonMarkersOnOWMMap(typhoons) {
    if (!owmMap || !owmMapLayers.markers) {
        return;
    }

    // Clear existing markers and tracks
    owmMapLayers.markers.clearLayers();
    if (owmMapLayers.tracks) {
        owmMapLayers.tracks.clearLayers();
    }

    if (!typhoons || typhoons.length === 0) {
        return;
    }

    // Add typhoon markers and tracks
    typhoons.forEach(typhoon => {
        if (typhoon.latitude && typhoon.longitude) {
            // Add marker
            const marker = createTyphoonMarker(typhoon);
            if (marker) {
                owmMapLayers.markers.addLayer(marker);
            }
            
            // Add forecast track (predicted path)
            const track = createTyphoonTrack(typhoon);
            if (track && owmMapLayers.tracks) {
                owmMapLayers.tracks.addLayer(track);
            }
        }
    });

    // Fit map to show all markers and tracks
    if (typhoons.length > 0) {
        const allPoints = [];
        typhoons.forEach(typhoon => {
            if (typhoon.latitude && typhoon.longitude) {
                allPoints.push([typhoon.latitude, typhoon.longitude]);
                // Add forecast points if available
                if (typhoon.forecastTrack && Array.isArray(typhoon.forecastTrack)) {
                    typhoon.forecastTrack.forEach(point => {
                        if (point.latitude && point.longitude) {
                            allPoints.push([point.latitude, point.longitude]);
                        }
                    });
                }
            }
        });
        
        if (allPoints.length > 0) {
            const group = new L.featureGroup(
                allPoints.map(coord => L.marker(coord))
            );
            owmMap.fitBounds(group.getBounds(), {
                padding: [50, 50],
                maxZoom: 8
            });
        }
    }
}

// ===========================
// Create Typhoon Marker
// ===========================
function createTyphoonMarker(typhoon) {
    if (!typhoon.latitude || !typhoon.longitude) {
        return null;
    }

    // Determine marker color based on category
    let markerColor = '#ef4444'; // Default red
    let markerSize = 30;

    if (typhoon.category) {
        const category = typhoon.category.toLowerCase();
        if (category.includes('super')) {
            markerColor = '#dc2626';
            markerSize = 40;
        } else if (category.includes('typhoon')) {
            markerColor = '#ef4444';
            markerSize = 35;
        } else if (category.includes('storm')) {
            markerColor = '#f59e0b';
            markerSize = 30;
        } else {
            markerColor = '#10b981';
            markerSize = 25;
        }
    }

    // Create custom icon
    const icon = L.divIcon({
        className: 'typhoon-marker',
        html: `<div style="
            width: ${markerSize}px;
            height: ${markerSize}px;
            background: ${markerColor};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${markerSize * 0.5}px;
            color: white;
            font-weight: bold;
        ">🌪️</div>`,
        iconSize: [markerSize, markerSize],
        iconAnchor: [markerSize / 2, markerSize / 2]
    });

    // Create marker
    const marker = L.marker([typhoon.latitude, typhoon.longitude], {
        icon: icon,
        title: typhoon.name
    });

    // Calculate PAGASA Wind Signal (using function from script.js if available)
    let windSignal = null;
    let signalInfo = null;
    if (typeof calculatePAGASAWindSignal === 'function' && typeof getPAGASAWindSignalInfo === 'function') {
        windSignal = calculatePAGASAWindSignal(typhoon);
        signalInfo = getPAGASAWindSignalInfo(windSignal);
    }

    // Create popup
    const popupContent = `
        <div class="typhoon-popup">
            <h4><i class="fas fa-hurricane"></i> ${typhoon.name || 'Unnamed'}</h4>
            ${signalInfo ? `
            <div class="popup-detail pagasa-signal">
                <span class="popup-label">PAGASA Wind Signal:</span>
                <span class="pagasa-signal-badge signal-${signalInfo.number}" title="${signalInfo.description}">
                    <strong>#${signalInfo.number}</strong>
                </span>
            </div>
            ` : ''}
            <div class="popup-detail">
                <span class="popup-label">Category:</span>
                <span class="popup-value">${typhoon.category || 'N/A'}</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">Status:</span>
                <span class="popup-value">${typhoon.status || 'Active'}</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">Wind Speed:</span>
                <span class="popup-value">${typhoon.speed || 0} km/h</span>
            </div>
            ${typhoon.pressure ? `
            <div class="popup-detail">
                <span class="popup-label">Pressure:</span>
                <span class="popup-value">${typhoon.pressure} mb</span>
            </div>
            ` : ''}
            ${typhoon.movementSpeed ? `
            <div class="popup-detail">
                <span class="popup-label">Movement:</span>
                <span class="popup-value">${typhoon.movementSpeed} km/h ${typhoon.movementDirection || ''}</span>
            </div>
            ` : ''}
        </div>
    `;

    marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'typhoon-popup-container'
    });

    return marker;
}

// ===========================
// Create Typhoon Forecast Track
// ===========================
function createTyphoonTrack(typhoon) {
    if (!typhoon.latitude || !typhoon.longitude) {
        return null;
    }

    // Generate forecast track points
    const forecastPoints = generateForecastTrack(typhoon);
    
    if (forecastPoints.length < 2) {
        return null; // Need at least 2 points for a line
    }

    // Determine track color based on category
    let trackColor = '#ef4444'; // Default red
    let trackWeight = 3;
    let trackOpacity = 0.7;

    if (typhoon.category) {
        const category = typhoon.category.toLowerCase();
        if (category.includes('super')) {
            trackColor = '#dc2626';
            trackWeight = 4;
            trackOpacity = 0.8;
        } else if (category.includes('typhoon')) {
            trackColor = '#ef4444';
            trackWeight = 3;
            trackOpacity = 0.7;
        } else if (category.includes('storm')) {
            trackColor = '#f59e0b';
            trackWeight = 2.5;
            trackOpacity = 0.6;
        } else {
            trackColor = '#10b981';
            trackWeight = 2;
            trackOpacity = 0.5;
        }
    }

    // Create a layer group to hold the track line and markers
    const trackGroup = L.layerGroup();

    // Create polyline for the track
    const trackLine = L.polyline(forecastPoints, {
        color: trackColor,
        weight: trackWeight,
        opacity: trackOpacity,
        smoothFactor: 1,
        dashArray: '10, 5', // Dashed line for forecast track
        lineCap: 'round',
        lineJoin: 'round'
    });
    trackGroup.addLayer(trackLine);

    // Add forecast point markers along the track
    forecastPoints.forEach((point, index) => {
        if (index > 0) { // Skip first point (current position, already has main marker)
            const hoursAhead = index * 6; // 6-hour intervals
            const forecastMarker = L.circleMarker(point, {
                radius: 4,
                fillColor: trackColor,
                fillOpacity: 0.8,
                color: '#ffffff',
                weight: 1
            });
            
            // Add popup with forecast time
            forecastMarker.bindPopup(`
                <div class="typhoon-forecast-popup">
                    <strong>${typhoon.name || 'Typhoon'}</strong><br>
                    Forecast: +${hoursAhead} hours<br>
                    ${typhoon.category || 'N/A'}
                </div>
            `);
            
            trackGroup.addLayer(forecastMarker);
        }
    });

    // Add arrow markers to show direction
    addDirectionArrows(trackGroup, forecastPoints, trackColor);

    return trackGroup;
}

// ===========================
// Generate Forecast Track Points
// ===========================
function generateForecastTrack(typhoon) {
    const points = [];
    const currentLat = parseFloat(typhoon.latitude);
    const currentLon = parseFloat(typhoon.longitude);
    
    if (isNaN(currentLat) || isNaN(currentLon)) {
        return points;
    }

    // Start with current position
    points.push([currentLat, currentLon]);

    // If forecast track data is available, use it
    if (typhoon.forecastTrack && Array.isArray(typhoon.forecastTrack) && typhoon.forecastTrack.length > 0) {
        typhoon.forecastTrack.forEach(point => {
            if (point.latitude && point.longitude) {
                points.push([parseFloat(point.latitude), parseFloat(point.longitude)]);
            }
        });
        return points;
    }

    // Generate forecast points based on movement direction and speed
    const movementSpeed = parseFloat(typhoon.movementSpeed) || 15; // km/h, default 15
    const movementDirection = parseFloat(typhoon.movementDirection) || 270; // degrees, default west (270)
    
    // Convert direction to radians (0 = North, 90 = East, 180 = South, 270 = West)
    // Note: movementDirection might be in degrees (0-360) or as a string like "NW", "E", etc.
    let directionRad;
    if (typeof movementDirection === 'string') {
        // Parse direction string (N, NE, E, SE, S, SW, W, NW)
        const dirMap = {
            'N': 0, 'NE': 45, 'E': 90, 'SE': 135,
            'S': 180, 'SW': 225, 'W': 270, 'NW': 315
        };
        const dir = dirMap[movementDirection.toUpperCase()] || 270;
        directionRad = (dir * Math.PI) / 180;
    } else {
        directionRad = (movementDirection * Math.PI) / 180;
    }
    
    // Generate 5 forecast points (6-hour intervals = 30 hours ahead)
    for (let i = 1; i <= 5; i++) {
        const hoursAhead = i * 6;
        const distanceKm = (movementSpeed * hoursAhead); // Distance in km
        
        // Convert km to degrees (approximate: 1 degree ≈ 111 km)
        const distanceDeg = distanceKm / 111;
        
        // Calculate new position
        // Note: For latitude, we use cos; for longitude, we use sin
        const latOffset = distanceDeg * Math.cos(directionRad);
        const lonOffset = distanceDeg * Math.sin(directionRad);
        
        const forecastLat = currentLat + latOffset;
        const forecastLon = currentLon + lonOffset;
        
        // Add some randomness to simulate uncertainty (cone of uncertainty)
        const uncertainty = hoursAhead * 0.1; // Increase uncertainty with time
        const randomLat = forecastLat + (Math.random() - 0.5) * uncertainty;
        const randomLon = forecastLon + (Math.random() - 0.5) * uncertainty;
        
        points.push([randomLat, randomLon]);
    }

    return points;
}

// ===========================
// Add Direction Arrows to Track
// ===========================
function addDirectionArrows(trackGroup, points, color) {
    if (points.length < 2) return;

    // Add arrow markers at intervals along the track
    for (let i = 1; i < points.length; i++) {
        const prevPoint = points[i - 1];
        const currentPoint = points[i];
        
        // Calculate direction
        const dx = currentPoint[1] - prevPoint[1];
        const dy = currentPoint[0] - prevPoint[0];
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        // Create arrow marker (using a simple circle with direction indicator)
        const midPoint = [
            (prevPoint[0] + currentPoint[0]) / 2,
            (prevPoint[1] + currentPoint[1]) / 2
        ];
        
        // Create a small arrow icon
        const arrowIcon = L.divIcon({
            className: 'typhoon-track-arrow',
            html: `<div style="
                transform: rotate(${angle}deg);
                width: 0;
                height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-bottom: 10px solid ${color};
                opacity: 0.7;
            "></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        });
        
        const arrowMarker = L.marker(midPoint, { icon: arrowIcon });
        trackGroup.addLayer(arrowMarker);
    }
}

// ===========================
// Toggle Typhoon Track Visibility
// ===========================
function toggleTyphoonTrack(visible) {
    trackVisible = visible;
    if (owmMapLayers.tracks && owmMap) {
        if (visible) {
            owmMap.addLayer(owmMapLayers.tracks);
        } else {
            owmMap.removeLayer(owmMapLayers.tracks);
        }
    }
}

// ===========================
// Add City Markers with Temperature
// ===========================
async function addCityMarkersWithTemperature(apiKey) {
    if (!owmMap || !cityMarkersLayer || !citiesVisible) return;

    // Clear existing city markers
    cityMarkersLayer.clearLayers();

    // Fetch temperature for each city (in batches to avoid rate limits)
    const batchSize = 5;
    for (let i = 0; i < MAJOR_CITIES.length; i += batchSize) {
        const batch = MAJOR_CITIES.slice(i, i + batchSize);
        await Promise.all(batch.map(city => addCityMarker(city, apiKey)));
        // Small delay between batches
        if (i + batchSize < MAJOR_CITIES.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }
}

async function addCityMarker(city, apiKey) {
    try {
        // Fetch current temperature for city
        let temperature = 'N/A';
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&units=metric&appid=${apiKey}`
            );
            if (response.ok) {
                const data = await response.json();
                temperature = Math.round(data.main.temp);
            }
        } catch (error) {
            console.warn(`Failed to fetch temperature for ${city.name}:`, error);
        }

        // Create city marker with temperature
        const cityIcon = L.divIcon({
            className: 'city-temperature-marker',
            html: `
                <div class="city-temp-container">
                    <div class="city-temp-box">${temperature}°C</div>
                    <div class="city-name-label ${temperature >= 28 ? 'temp-high' : 'temp-normal'}">${city.name}</div>
                </div>
            `,
            iconSize: [80, 45],
            iconAnchor: [40, 45]
        });

        const marker = L.marker([city.lat, city.lon], {
            icon: cityIcon,
            title: `${city.name} - ${temperature}°C`,
            zIndexOffset: 1000
        });

        marker.bindPopup(`
            <div class="city-popup">
                <h4><i class="fas fa-map-marker-alt"></i> ${city.name}</h4>
                <div class="popup-detail">
                    <span class="popup-label">Temperature:</span>
                    <span class="popup-value">${temperature}°C</span>
                </div>
                <div class="popup-detail">
                    <span class="popup-label">Coordinates:</span>
                    <span class="popup-value">${city.lat.toFixed(2)}°N, ${city.lon.toFixed(2)}°E</span>
                </div>
            </div>
        `);

        cityMarkersLayer.addLayer(marker);
    } catch (error) {
        console.error(`Error adding city marker for ${city.name}:`, error);
    }
}

// ===========================
// Toggle City Markers
// ===========================
function toggleCityMarkers(visible) {
    citiesVisible = visible;
    if (cityMarkersLayer) {
        if (visible) {
            owmMap.addLayer(cityMarkersLayer);
        } else {
            owmMap.removeLayer(cityMarkersLayer);
        }
    }
}

// ===========================
// Add Precipitation Legend
// ===========================
function addPrecipitationLegend() {
    if (!owmMap) return;

    // Create legend control
    const legend = L.control({ position: 'bottomright' });
    
    legend.onAdd = function() {
        const div = L.DomUtil.create('div', 'precipitation-legend');
        div.innerHTML = `
            <div class="legend-header">Precipitation (mm/h)</div>
            <div class="legend-gradient">
                <div class="legend-color" style="background: linear-gradient(to right, #e0f2fe 0%, #7dd3fc 50%);"></div>
                <div class="legend-color" style="background: #22c55e;"></div>
                <div class="legend-color" style="background: #fbbf24;"></div>
                <div class="legend-color" style="background: #f97316;"></div>
                <div class="legend-color" style="background: #ef4444;"></div>
                <div class="legend-color" style="background: #dc2626;"></div>
            </div>
            <div class="legend-labels">
                <span>0</span>
                <span>0.5</span>
                <span>2</span>
                <span>7</span>
                <span>14</span>
                <span>24</span>
                <span>60+</span>
            </div>
        `;
        return div;
    };
    
    legend.addTo(owmMap);
}

// ===========================
// Export for use in other scripts
// ===========================
if (typeof window !== 'undefined') {
    window.OWMMapAPI = {
        initialize: initializeOWMMap,
        switchLayer: switchOWMLayer,
        switchSatelliteLayer: switchSatelliteLayer,
        updateTyphoons: updateTyphoonMarkersOnOWMMap,
        toggleTrack: toggleTyphoonTrack,
        toggleCities: toggleCityMarkers,
        getMap: () => owmMap,
        getLayers: () => OWM_LAYERS,
        getSatelliteLayers: () => SATELLITE_LAYERS,
        getCurrentSatelliteLayer: () => currentSatelliteLayer
    };
}

