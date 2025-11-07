// ===========================
// Global Configuration
// ===========================
const CONFIG = {
    API_ENDPOINT: 'api.php',
    UPDATE_INTERVAL: 30000, // 30 seconds for real-time monitoring
    WEATHER_UPDATE_INTERVAL: 30000, // 30 seconds
    TYPHOON_UPDATE_INTERVAL: 60000, // 1 minute
    FORECAST_UPDATE_INTERVAL: 300000, // 5 minutes
    ALERTS_UPDATE_INTERVAL: 30000, // 30 seconds
    DEFAULT_LOCATION: 'Manila',
    DEFAULT_COUNTRY: 'PH'
};

// ===========================
// State Management
// ===========================
const state = {
    currentLocation: CONFIG.DEFAULT_LOCATION,
    userLocation: null,
    userCoordinates: null,
    weatherData: null,
    forecastData: null,
    typhoonData: null,
    alertsData: null,
    theme: localStorage.getItem('theme') || 'light',
    locationEnabled: localStorage.getItem('locationEnabled') === 'true',
    locationPermission: localStorage.getItem('locationPermission') || null, // 'always', 'once', 'never'
    lastUpdate: {
        weather: null,
        typhoon: null,
        forecast: null,
        alerts: null
    },
    isConnected: true,
    updateIntervals: {},
    typhoonMap: null,
    typhoonMarkers: [],
    markerGroup: null,
    userLocationMarker: null,
    mapLayers: null,
    windTrackLayer: null,
    windTrackVisible: true
};

// ===========================
// Initialize Application
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeEventListeners();
    initializeRealTimeMonitoring();
    initializeStatusIndicator();
    initializeLocationPermission();
    
    // Get current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Initialize page-specific features
    if (currentPage === 'typhoon-tracker.html' || currentPage.includes('typhoon')) {
        initializeTyphoonMap();
        loadTyphoonData();
        startRealTimeMonitoring();
    } else if (currentPage === 'current-weather.html' || currentPage.includes('current')) {
        // Check location permission before initializing geolocation
        if (state.locationPermission === 'always' || state.locationPermission === 'once') {
            initializeGeolocation();
        }
        // Check if user location is enabled and available
        if (state.locationEnabled && state.userCoordinates) {
            loadWeatherDataByCoordinates(state.userCoordinates.lat, state.userCoordinates.lon);
        } else {
            loadWeatherData(CONFIG.DEFAULT_LOCATION);
        }
        startRealTimeMonitoring();
    } else if (currentPage === 'forecast.html') {
        // Check location permission before initializing geolocation
        if (state.locationPermission === 'always' || state.locationPermission === 'once') {
            initializeGeolocation();
        }
        // Check if user location is enabled and available
        if (state.locationEnabled && state.userCoordinates) {
            loadForecastDataByCoordinates(state.userCoordinates.lat, state.userCoordinates.lon);
        } else {
            loadForecastData(CONFIG.DEFAULT_LOCATION);
        }
        startRealTimeMonitoring();
    } else {
        // Home page (index.html)
        initializeTyphoonMap();
        
        // Check location permission before initializing geolocation
        if (state.locationPermission === 'always' || state.locationPermission === 'once') {
            initializeGeolocation();
        }
        
        // Initial data load
        if (state.locationEnabled && state.userCoordinates) {
            loadWeatherDataByCoordinates(state.userCoordinates.lat, state.userCoordinates.lon);
            loadForecastDataByCoordinates(state.userCoordinates.lat, state.userCoordinates.lon);
        } else {
            loadWeatherData(CONFIG.DEFAULT_LOCATION);
            loadForecastData(CONFIG.DEFAULT_LOCATION);
        }
        
        loadTyphoonData();
        loadAlertsData();
        startRealTimeMonitoring();
    }
    
    // Update active navigation link
    updateActiveNavLink(currentPage);

    // Show welcome message
    showNotification('Real-time monitoring active. Data updates every 30 seconds.', 'info');
});

// ===========================
// Navigation Helper
// ===========================
function updateActiveNavLink(currentPage) {
    // Remove all active classes
    document.querySelectorAll('.nav a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class based on current page
    if (currentPage === 'index.html' || currentPage === '') {
        const homeLink = document.querySelector('.nav a[href="index.html"]') || 
                        document.querySelector('.nav a[href="#home"]');
        if (homeLink) homeLink.classList.add('active');
    } else if (currentPage === 'current-weather.html') {
        const link = document.querySelector('.nav a[href="current-weather.html"]');
        if (link) link.classList.add('active');
    } else if (currentPage === 'typhoon-tracker.html') {
        const link = document.querySelector('.nav a[href="typhoon-tracker.html"]');
        if (link) link.classList.add('active');
    } else if (currentPage === 'forecast.html') {
        const link = document.querySelector('.nav a[href="forecast.html"]');
        if (link) link.classList.add('active');
    }
}

// ===========================
// Real-time Monitoring Setup
// ===========================
function initializeRealTimeMonitoring() {
    // Check connection status
    checkConnectionStatus();
    
    // Monitor connection every 10 seconds
    setInterval(checkConnectionStatus, 10000);
}

function startRealTimeMonitoring() {
    // Clear existing intervals
    Object.values(state.updateIntervals).forEach(interval => clearInterval(interval));
    
    // Weather updates every 30 seconds
    state.updateIntervals.weather = setInterval(() => {
        loadWeatherData(state.currentLocation);
    }, CONFIG.WEATHER_UPDATE_INTERVAL);

    // Typhoon updates every 1 minute
    state.updateIntervals.typhoon = setInterval(() => {
        loadTyphoonData();
    }, CONFIG.TYPHOON_UPDATE_INTERVAL);

    // Forecast updates every 5 minutes
    state.updateIntervals.forecast = setInterval(() => {
        loadForecastData(state.currentLocation);
    }, CONFIG.FORECAST_UPDATE_INTERVAL);

    // Alerts updates every 30 seconds
    state.updateIntervals.alerts = setInterval(() => {
        loadAlertsData();
    }, CONFIG.ALERTS_UPDATE_INTERVAL);
}

function checkConnectionStatus() {
    // Simple connectivity check
    fetch(CONFIG.API_ENDPOINT + '?action=weather&location=test', {
        method: 'GET',
        cache: 'no-cache'
    })
    .then(() => {
        if (!state.isConnected) {
            state.isConnected = true;
            updateConnectionStatus(true);
            showNotification('Connection restored. Real-time monitoring resumed.', 'info');
        }
    })
    .catch(() => {
        if (state.isConnected) {
            state.isConnected = false;
            updateConnectionStatus(false);
            showNotification('Connection lost. Attempting to reconnect...', 'warning');
        }
    });
}

function initializeStatusIndicator() {
    // Create status indicator in header
    const headerControls = document.querySelector('.header-controls');
    if (headerControls && !document.getElementById('statusIndicator')) {
        const statusDiv = document.createElement('div');
        statusDiv.id = 'statusIndicator';
        statusDiv.className = 'status-indicator-badge';
        statusDiv.innerHTML = '<i class="fas fa-circle"></i> <span>Real-time</span>';
        headerControls.insertBefore(statusDiv, headerControls.firstChild);
    }
}

function updateConnectionStatus(connected) {
    const indicator = document.getElementById('statusIndicator');
    if (indicator) {
        const icon = indicator.querySelector('i');
        const text = indicator.querySelector('span');
        
        if (connected) {
            indicator.className = 'status-indicator-badge connected';
            icon.className = 'fas fa-circle';
            text.textContent = 'Real-time';
        } else {
            indicator.className = 'status-indicator-badge disconnected';
            icon.className = 'fas fa-circle';
            text.textContent = 'Offline';
        }
    }
}

// ===========================
// Typhoon Map Initialization
// ===========================
function initializeTyphoonMap() {
    // Wait for map container to be ready
    const mapContainer = document.getElementById('typhoonMap');
    if (!mapContainer) {
        console.warn('Typhoon map container not found');
        return;
    }

    // Initialize map centered on Philippines
    const philippinesCenter = [12.8797, 121.7740];
    
    try {
        state.typhoonMap = L.map('typhoonMap', {
            center: philippinesCenter,
            zoom: 6,
            zoomControl: true,
            attributionControl: true
        });

        // Base map layers
        const standardLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19,
            minZoom: 3
        });

        // Satellite imagery layer (using Esri World Imagery)
        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
            maxZoom: 19,
            minZoom: 3
        });

        // Cloud imagery layer - Using a combination of satellite with cloud overlay
        // Using Esri World Imagery as base with semi-transparent overlay for cloud effect
        const cloudLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '&copy; <a href="https://www.esri.com/">Esri</a> | Cloud visualization overlay',
            maxZoom: 19,
            minZoom: 3,
            opacity: 0.85
        });
        
        // Add cloud overlay using a weather tile service (if available)
        // For now, using satellite imagery with adjusted opacity to simulate cloud view

        // Alternative cloud layer using OpenWeatherMap (if API key available)
        // This will be added conditionally if API key is available
        
        // Store layers in state
        state.mapLayers = {
            standard: standardLayer,
            satellite: satelliteLayer,
            cloud: finalCloudLayer,
            current: 'standard'
        };

        // Add default layer
        standardLayer.addTo(state.typhoonMap);
        
        // Initialize wind track layer
        state.windTrackLayer = L.layerGroup().addTo(state.typhoonMap);
        
        // Initialize advanced typhoon visualization if available
        if (typeof initializeAdvancedTyphoonMap === 'function') {
            setTimeout(() => {
                initializeAdvancedTyphoonMap();
            }, 100);
        }

        // Add marker cluster group
        state.markerGroup = L.markerClusterGroup({
            chunkedLoading: true,
            maxClusterRadius: 50
        });
        state.typhoonMap.addLayer(state.markerGroup);

        // Map layer control buttons
        const standardBtn = document.getElementById('standardMapBtn');
        const satelliteBtn = document.getElementById('satelliteMapBtn');
        const cloudBtn = document.getElementById('cloudMapBtn');
        
        if (standardBtn) {
            standardBtn.addEventListener('click', () => switchMapLayer('standard'));
        }
        if (satelliteBtn) {
            satelliteBtn.addEventListener('click', () => switchMapLayer('satellite'));
        }
        if (cloudBtn) {
            cloudBtn.addEventListener('click', () => switchMapLayer('cloud'));
        }

        // Map action control buttons
        const refreshBtn = document.getElementById('refreshMapBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                loadTyphoonData();
            });
        }

        const centerBtn = document.getElementById('centerMapBtn');
        if (centerBtn) {
            centerBtn.addEventListener('click', () => {
                state.typhoonMap.setView(philippinesCenter, 6, {
                    animate: true,
                    duration: 1.0
                });
            });
        }

        // Wind track toggle
        state.windTrackVisible = true; // Default to visible
        const toggleTrackBtn = document.getElementById('toggleTrackBtn');
        if (toggleTrackBtn) {
            toggleTrackBtn.addEventListener('click', () => {
                state.windTrackVisible = !state.windTrackVisible;
                if (state.windTrackLayer) {
                    if (state.windTrackVisible) {
                        state.windTrackLayer.addTo(state.typhoonMap);
                    } else {
                        state.typhoonMap.removeLayer(state.windTrackLayer);
                    }
                }
                toggleTrackBtn.classList.toggle('active', state.windTrackVisible);
            });
        }

        // Invalidate size after a short delay to ensure map renders correctly
        setTimeout(() => {
            if (state.typhoonMap) {
                state.typhoonMap.invalidateSize();
            }
        }, 100);
    } catch (error) {
        console.error('Error initializing typhoon map:', error);
    }
}

// ===========================
// Map Layer Switching
// ===========================
function switchMapLayer(layerName) {
    if (!state.typhoonMap || !state.mapLayers) return;
    
    // Remove current layer
    if (state.mapLayers[state.mapLayers.current]) {
        state.typhoonMap.removeLayer(state.mapLayers[state.mapLayers.current]);
    }
    
    // Add new layer
    if (state.mapLayers[layerName]) {
        state.mapLayers[layerName].addTo(state.typhoonMap);
        state.mapLayers.current = layerName;
    }
    
    // Update button states
    document.querySelectorAll('.map-layer-controls .map-control-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.layer === layerName) {
            btn.classList.add('active');
        }
    });
}

function createTyphoonMarker(typhoon) {
    if (!typhoon.latitude || !typhoon.longitude) {
        return null;
    }

    // Determine marker color based on status
    let markerColor = '#3b82f6'; // default blue
    let markerSize = 25;
    
    if (typhoon.status === 'Active') {
        markerColor = '#ef4444'; // red for active
        markerSize = 35;
    } else if (typhoon.status === 'Monitored') {
        markerColor = '#f59e0b'; // orange for monitored
        markerSize = 30;
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

    // Create popup content
    const popupContent = `
        <div class="typhoon-popup">
            <h4><i class="fas fa-hurricane"></i> ${typhoon.name}</h4>
            <div class="popup-detail">
                <span class="popup-label">Category:</span>
                <span class="popup-value">${typhoon.category}</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">Status:</span>
                <span class="popup-value">${typhoon.status}</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">Wind Speed:</span>
                <span class="popup-value">${typhoon.speed} km/h</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">Pressure:</span>
                <span class="popup-value">${typhoon.pressure} mb</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">Movement:</span>
                <span class="popup-value">${typhoon.movementSpeed} km/h</span>
            </div>
            ${typhoon.warnings ? `
            <div class="popup-detail">
                <span class="popup-label">Warning:</span>
                <span class="popup-value">${typhoon.warnings}</span>
            </div>
            ` : ''}
            ${Array.isArray(typhoon.affectedRegions) && typhoon.affectedRegions.length > 0 ? `
            <div class="popup-detail">
                <span class="popup-label">Affected:</span>
                <span class="popup-value">${typhoon.affectedRegions.join(', ')}</span>
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

function updateTyphoonMap(typhoons) {
    // Use advanced visualization if available
    if (typeof updateAdvancedTyphoonMap === 'function' && state.typhoonMap) {
        updateAdvancedTyphoonMap(typhoons);
        return;
    }
    
    // Fallback to basic markers
    // Clear existing markers
    if (state.markerGroup) {
        state.markerGroup.clearLayers();
    }
    state.typhoonMarkers = [];

    if (!typhoons || typhoons.length === 0) {
        return;
    }

    // Create markers for each typhoon
    typhoons.forEach(typhoon => {
        const marker = createTyphoonMarker(typhoon);
        if (marker) {
            state.typhoonMarkers.push(marker);
            state.markerGroup.addLayer(marker);
        }
    });

    // Fit map to show all markers
    if (state.typhoonMarkers.length > 0) {
        const group = new L.featureGroup(state.typhoonMarkers);
        const bounds = group.getBounds();
        
        // Only adjust view if we have valid bounds
        if (bounds.isValid()) {
            state.typhoonMap.fitBounds(bounds, {
                padding: [50, 50],
                maxZoom: 8
            });
        }
    }
}

// ===========================
// Theme Management
// ===========================
function initializeTheme() {
    if (state.theme === 'dark') {
        document.body.classList.add('dark-theme');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', state.theme);
    document.getElementById('themeToggle').innerHTML = state.theme === 'dark' 
        ? '<i class="fas fa-sun"></i>' 
        : '<i class="fas fa-moon"></i>';
}

// ===========================
// Event Listeners
// ===========================
function initializeEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Search functionality
    const searchBtn = document.getElementById('searchBtn');
    const locationSearch = document.getElementById('locationSearch');
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    if (locationSearch) {
        locationSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }

    // Location button
    const locationBtn = document.getElementById('locationBtn');
    if (locationBtn) {
        locationBtn.addEventListener('click', requestUserLocation);
    }

    // Close alert banner
    const closeAlert = document.getElementById('closeAlert');
    if (closeAlert) {
        closeAlert.addEventListener('click', () => {
            const alertBanner = document.getElementById('alertBanner');
            if (alertBanner) {
                alertBanner.classList.add('hidden');
            }
        });
    }

    // Navigation active link
    document.querySelectorAll('.nav a').forEach(link => {
        link.addEventListener('click', function() {
            document.querySelectorAll('.nav a').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Location permission modal buttons
    const allowAlwaysBtn = document.getElementById('allowAlwaysBtn');
    const allowOnceBtn = document.getElementById('allowOnceBtn');
    const neverAllowBtn = document.getElementById('neverAllowBtn');
    
    if (allowAlwaysBtn) {
        allowAlwaysBtn.addEventListener('click', () => {
            state.locationPermission = 'always';
            localStorage.setItem('locationPermission', 'always');
            hideLocationPermissionModal();
            initializeGeolocation();
        });
    }
    
    if (allowOnceBtn) {
        allowOnceBtn.addEventListener('click', () => {
            state.locationPermission = 'once';
            localStorage.setItem('locationPermission', 'once');
            hideLocationPermissionModal();
            initializeGeolocation();
        });
    }
    
    if (neverAllowBtn) {
        neverAllowBtn.addEventListener('click', () => {
            state.locationPermission = 'never';
            localStorage.setItem('locationPermission', 'never');
            hideLocationPermissionModal();
        });
    }
}

// ===========================
// Search Handler
// ===========================
function handleSearch() {
    const location = document.getElementById('locationSearch').value.trim();
    if (location) {
        state.currentLocation = location;
        state.locationEnabled = false; // Disable auto-location when searching
        localStorage.setItem('locationEnabled', 'false');
        loadWeatherData(location);
        loadForecastData(location);
        showNotification(`Searching for weather in ${location}...`, 'info');
    }
}

// ===========================
// Geolocation Functions
// ===========================
function initializeLocationPermission() {
    // Check if permission has been set
    if (state.locationPermission === null) {
        // Show permission modal on first visit
        showLocationPermissionModal();
    } else if (state.locationPermission === 'never') {
        // Don't show modal if user chose "Never allow"
        return;
    }
}

function showLocationPermissionModal() {
    const modal = document.getElementById('locationPermissionModal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
}

function hideLocationPermissionModal() {
    const modal = document.getElementById('locationPermissionModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function initializeGeolocation() {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
        updateLocationStatus('Geolocation is not supported by your browser.', 'error');
        return;
    }

    // If location was previously enabled, try to get it again
    if (state.locationEnabled || state.locationPermission === 'always' || state.locationPermission === 'once') {
        requestUserLocation();
    }
}

function requestUserLocation() {
    const locationBtn = document.getElementById('locationBtn');
    const locationStatus = document.getElementById('locationStatus');
    
    // Update button state
    locationBtn.disabled = true;
    locationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    updateLocationStatus('Requesting location access...', 'info');

    navigator.geolocation.getCurrentPosition(
        (position) => {
            // Success
            const coords = {
                lat: position.coords.latitude,
                lon: position.coords.longitude,
                accuracy: position.coords.accuracy
            };
            
            state.userCoordinates = coords;
            state.locationEnabled = true;
            localStorage.setItem('locationEnabled', 'true');
            
            // If permission was "once", don't persist it
            if (state.locationPermission === 'once') {
                // Keep it for this session but don't auto-request next time
                // The permission will remain 'once' but won't auto-trigger
            } else if (state.locationPermission === 'always') {
                // Persist the always permission
                localStorage.setItem('locationPermission', 'always');
            }
            
            // Reverse geocode to get location name
            reverseGeocode(coords.lat, coords.lon).then(locationName => {
                state.userLocation = locationName;
                state.currentLocation = locationName;
                document.getElementById('locationSearch').value = locationName;
                
                // Load weather data for user's location
                loadWeatherDataByCoordinates(coords.lat, coords.lon);
                loadForecastDataByCoordinates(coords.lat, coords.lon);
                
                // Add user location marker to map
                addUserLocationMarker(coords.lat, coords.lon);
                
                updateLocationStatus(`Location: ${locationName}`, 'success');
                showNotification(`Using your location: ${locationName}`, 'info');
            }).catch(err => {
                // Use coordinates if reverse geocoding fails
                state.userLocation = `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`;
                loadWeatherDataByCoordinates(coords.lat, coords.lon);
                loadForecastDataByCoordinates(coords.lat, coords.lon);
                addUserLocationMarker(coords.lat, coords.lon);
                updateLocationStatus('Location detected', 'success');
            });
            
            locationBtn.disabled = false;
            locationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
            locationBtn.classList.add('active');
        },
        (error) => {
            // Error
            locationBtn.disabled = false;
            locationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
            locationBtn.classList.remove('active');
            
            let errorMessage = 'Unable to get your location. ';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += 'Location access denied. Please enable location permissions.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += 'Location information unavailable.';
                    break;
                case error.TIMEOUT:
                    errorMessage += 'Location request timed out.';
                    break;
                default:
                    errorMessage += 'An unknown error occurred.';
                    break;
            }
            
            updateLocationStatus(errorMessage, 'error');
            state.locationEnabled = false;
            localStorage.setItem('locationEnabled', 'false');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
        }
    );
}

async function reverseGeocode(lat, lon) {
    try {
        // Use OpenStreetMap Nominatim API for reverse geocoding
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'BayanForecast/1.0'
                }
            }
        );
        
        if (!response.ok) {
            throw new Error('Reverse geocoding failed');
        }
        
        const data = await response.json();
        
        // Extract location name
        if (data.address) {
            const address = data.address;
            // Try to get city, town, or village name
            return address.city || address.town || address.village || 
                   address.municipality || address.county || 
                   address.state || data.display_name.split(',')[0];
        }
        
        return data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
}

function loadWeatherDataByCoordinates(lat, lon) {
    // Use coordinates directly for weather API
    const location = `${lat},${lon}`;
    loadWeatherData(location);
}

function loadForecastDataByCoordinates(lat, lon) {
    // Use coordinates directly for forecast API
    const location = `${lat},${lon}`;
    loadForecastData(location);
}

function addUserLocationMarker(lat, lon) {
    if (!state.typhoonMap) return;
    
    // Remove existing user location marker
    if (state.userLocationMarker) {
        state.typhoonMap.removeLayer(state.userLocationMarker);
    }
    
    // Create custom icon for user location
    const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `<div style="
            width: 30px;
            height: 30px;
            background: #10b981;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        ">📍</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
    
    // Create marker
    state.userLocationMarker = L.marker([lat, lon], {
        icon: userIcon,
        title: 'Your Location'
    });
    
    // Add popup
    state.userLocationMarker.bindPopup(`
        <div class="typhoon-popup">
            <h4><i class="fas fa-map-marker-alt"></i> Your Location</h4>
            <div class="popup-detail">
                <span class="popup-label">Coordinates:</span>
                <span class="popup-value">${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E</span>
            </div>
            ${state.userLocation ? `
            <div class="popup-detail">
                <span class="popup-label">Location:</span>
                <span class="popup-value">${state.userLocation}</span>
            </div>
            ` : ''}
        </div>
    `);
    
    state.userLocationMarker.addTo(state.typhoonMap);
    
    // Center map on user location if it's the first time
    if (!state.userCoordinates) {
        state.typhoonMap.setView([lat, lon], 8, {
            animate: true,
            duration: 1.0
        });
    }
}

function updateLocationStatus(message, type) {
    const statusEl = document.getElementById('locationStatus');
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.className = `location-status ${type}`;
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            if (statusEl.textContent === message) {
                statusEl.textContent = '';
                statusEl.className = 'location-status';
            }
        }, 5000);
    }
}

// ===========================
// API Data Loading - Real-time
// ===========================
async function loadWeatherData(location) {
    try {
        setLoadingState('weather', true);
        const response = await fetch(`${CONFIG.API_ENDPOINT}?action=weather&location=${encodeURIComponent(location)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            const weatherData = {
                ...result.data,
                icon: getWeatherIcon(result.data.condition),
                cloudCover: result.data.cloudCover || Math.floor(Math.random() * 100)
            };
            
            state.weatherData = weatherData;
            state.lastUpdate.weather = new Date(result.timestamp || new Date());
            displayCurrentWeather(weatherData);
            updateLastUpdateTime('weather', state.lastUpdate.weather);
        } else {
            throw new Error(result.error || 'Failed to load weather data');
        }
    } catch (error) {
        console.error('Error loading weather data:', error);
        showNotification('Failed to update weather data. Retrying...', 'warning');
        
        // Fallback to cached data if available
        if (state.weatherData) {
            displayCurrentWeather(state.weatherData);
        }
    } finally {
        setLoadingState('weather', false);
    }
}

async function loadTyphoonData() {
    try {
        setLoadingState('typhoon', true);
        const response = await fetch(`${CONFIG.API_ENDPOINT}?action=typhoon`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            state.typhoonData = result.data;
            state.lastUpdate.typhoon = new Date(result.timestamp || new Date());
            displayTyphoonTracker(result.data);
            updateLastUpdateTime('typhoon', state.lastUpdate.typhoon);
        } else {
            throw new Error(result.error || 'Failed to load typhoon data');
        }
    } catch (error) {
        console.error('Error loading typhoon data:', error);
        showNotification('Failed to update typhoon data. Retrying...', 'warning');
        
        // Fallback to cached data if available
        if (state.typhoonData) {
            displayTyphoonTracker(state.typhoonData);
        }
    } finally {
        setLoadingState('typhoon', false);
    }
}

async function loadForecastData(location) {
    try {
        setLoadingState('forecast', true);
        const response = await fetch(`${CONFIG.API_ENDPOINT}?action=forecast&location=${encodeURIComponent(location)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            const forecastData = result.data.map(day => ({
                ...day,
                icon: getWeatherIcon(day.condition),
                date: formatDate(day.date)
            }));
            
            state.forecastData = forecastData;
            state.lastUpdate.forecast = new Date(result.timestamp || new Date());
            displayForecast(forecastData);
            updateLastUpdateTime('forecast', state.lastUpdate.forecast);
        } else {
            throw new Error(result.error || 'Failed to load forecast data');
        }
    } catch (error) {
        console.error('Error loading forecast data:', error);
        showNotification('Failed to update forecast data. Retrying...', 'warning');
        
        // Fallback to cached data if available
        if (state.forecastData) {
            displayForecast(state.forecastData);
        }
    } finally {
        setLoadingState('forecast', false);
    }
}

async function loadAlertsData() {
    try {
        setLoadingState('alerts', true);
        const response = await fetch(`${CONFIG.API_ENDPOINT}?action=alerts`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            const alertsData = result.data.map(alert => ({
                ...alert,
                timestamp: formatDateTime(alert.timestamp || new Date())
            }));
            
            state.alertsData = alertsData;
            state.lastUpdate.alerts = new Date(result.timestamp || new Date());
            displayAlerts(alertsData);
            updateLastUpdateTime('alerts', state.lastUpdate.alerts);
            
            // Check for new critical alerts
            checkNewAlerts(alertsData);
        } else {
            throw new Error(result.error || 'Failed to load alerts data');
        }
    } catch (error) {
        console.error('Error loading alerts data:', error);
        showNotification('Failed to update alerts data. Retrying...', 'warning');
        
        // Fallback to cached data if available
        if (state.alertsData) {
            displayAlerts(state.alertsData);
        }
    } finally {
        setLoadingState('alerts', false);
    }
}

// ===========================
// Helper Functions
// ===========================
function setLoadingState(type, isLoading) {
    const elements = {
        weather: document.getElementById('currentWeather'),
        typhoon: document.getElementById('typhoonList'),
        forecast: document.getElementById('forecastGrid'),
        alerts: document.getElementById('alertsContainer')
    };
    
    const element = elements[type];
    if (!element) return;
    
    if (isLoading && !element.querySelector('.loading-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        element.style.position = 'relative';
        element.appendChild(overlay);
    } else if (!isLoading) {
        const overlay = element.querySelector('.loading-overlay');
        if (overlay) overlay.remove();
    }
}

function updateLastUpdateTime(type, timestamp) {
    // Add or update last update indicator in section titles
    const sections = {
        weather: document.querySelector('#current .section-title'),
        typhoon: document.querySelector('#typhoon .section-title'),
        forecast: document.querySelector('#forecast .section-title'),
        alerts: document.querySelector('#alerts .section-title')
    };
    
    const section = sections[type];
    if (!section) return;
    
    let updateIndicator = section.querySelector('.update-time');
    if (!updateIndicator) {
        updateIndicator = document.createElement('span');
        updateIndicator.className = 'update-time';
        section.appendChild(updateIndicator);
    }
    
    const timeAgo = getTimeAgo(timestamp);
    updateIndicator.innerHTML = `<i class="fas fa-clock"></i> Updated ${timeAgo}`;
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const diff = Math.floor((now - timestamp) / 1000);
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return timestamp.toLocaleTimeString();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function checkNewAlerts(newAlerts) {
    if (!state.alertsData || state.alertsData.length === 0) {
        // First load, check for critical alerts
        const criticalAlerts = newAlerts.filter(alert => alert.type === 'critical');
        if (criticalAlerts.length > 0) {
            criticalAlerts.forEach(alert => {
                showNotification(`🚨 ${alert.title}: ${alert.message}`, 'warning');
            });
        }
        return;
    }
    
    const previousIds = new Set(state.alertsData.map(a => a.id));
    const newCriticalAlerts = newAlerts.filter(alert => 
        alert.type === 'critical' && !previousIds.has(alert.id)
    );
    
    if (newCriticalAlerts.length > 0) {
        newCriticalAlerts.forEach(alert => {
            showNotification(`🚨 ${alert.title}: ${alert.message}`, 'warning');
        });
    }
}

// ===========================
// Mock Data Generators
// ===========================
function generateMockWeatherData(location) {
    const weatherConditions = [
        { temp: 32, condition: 'Sunny', icon: 'fas fa-sun', humidity: 65, windSpeed: 15 },
        { temp: 28, condition: 'Cloudy', icon: 'fas fa-cloud', humidity: 75, windSpeed: 20 },
        { temp: 25, condition: 'Rainy', icon: 'fas fa-cloud-rain', humidity: 85, windSpeed: 25 },
        { temp: 30, condition: 'Partly Cloudy', icon: 'fas fa-cloud-sun', humidity: 70, windSpeed: 18 }
    ];

    const random = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];

    return {
        location: location,
        country: 'Philippines',
        temperature: random.temp,
        condition: random.condition,
        icon: random.icon,
        humidity: random.humidity,
        windSpeed: random.windSpeed,
        pressure: 1013,
        visibility: 10,
        feelsLike: random.temp - 2,
        uvIndex: 7,
        cloudCover: Math.floor(Math.random() * 100),
        lastUpdated: new Date().toLocaleString()
    };
}

function generateMockTyphoonData() {
    const typhoons = [
        {
            name: 'Kristine',
            category: 'Super Typhoon',
            speed: 150,
            pressure: 915,
            latitude: 15.5,
            longitude: 130.2,
            movementSpeed: 25,
            status: 'Active',
            affectedRegions: ['Bicol', 'Quezon', 'Laguna']
        },
        {
            name: 'Leon',
            category: 'Typhoon',
            speed: 120,
            pressure: 950,
            latitude: 18.2,
            longitude: 138.5,
            movementSpeed: 20,
            status: 'Monitored',
            affectedRegions: ['Cagayan', 'Isabela']
        }
    ];

    return typhoons;
}

function generateMockForecastData() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const conditions = [
        { desc: 'Sunny', icon: 'fas fa-sun', temp: 32 },
        { desc: 'Cloudy', icon: 'fas fa-cloud', temp: 28 },
        { desc: 'Rainy', icon: 'fas fa-cloud-rain', temp: 25 },
        { desc: 'Partly Cloudy', icon: 'fas fa-cloud-sun', temp: 30 }
    ];

    const forecast = [];
    for (let i = 0; i < 7; i++) {
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        forecast.push({
            day: days[i],
            date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString(),
            condition: condition.desc,
            icon: condition.icon,
            tempHigh: condition.temp,
            tempLow: condition.temp - 5,
            humidity: Math.floor(Math.random() * 40) + 60,
            windSpeed: Math.floor(Math.random() * 20) + 10,
            chanceOfRain: Math.floor(Math.random() * 60)
        });
    }

    return forecast;
}

function generateMockAlertsData() {
    return [
        {
            type: 'critical',
            title: 'Typhoon Warning',
            message: 'Severe Tropical Storm Alert for Bicol Region. Strong winds and heavy rainfall expected.',
            timestamp: new Date(Date.now() - 30 * 60000).toLocaleString()
        },
        {
            type: 'warning',
            title: 'Heavy Rain Expected',
            message: 'Heavy rainfall warning for Metro Manila and surrounding provinces. Expect up to 100mm.',
            timestamp: new Date(Date.now() - 2 * 60 * 60000).toLocaleString()
        },
        {
            type: 'warning',
            title: 'High Wind Advisory',
            message: 'Wind speed reaching 40-60 km/h expected in coastal areas.',
            timestamp: new Date(Date.now() - 4 * 60 * 60000).toLocaleString()
        },
        {
            type: 'info',
            title: 'Weather Update',
            message: 'Weather condition improving. Sunny skies expected tomorrow.',
            timestamp: new Date(Date.now() - 6 * 60 * 60000).toLocaleString()
        }
    ];
}

// ===========================
// Display Functions
// ===========================
function displayCurrentWeather(data) {
    const weatherHTML = `
        <div class="weather-main-info">
            <div class="weather-location">${data.location}, ${data.country}</div>
            <div class="weather-description">${data.condition}</div>
            <div class="weather-temperature">${data.temperature}°C</div>
            <div class="weather-details">
                <div class="detail-item">
                    <span class="detail-label"><i class="fas fa-droplet"></i> Humidity</span>
                    <span class="detail-value">${data.humidity}%</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label"><i class="fas fa-wind"></i> Wind Speed</span>
                    <span class="detail-value">${data.windSpeed} km/h</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label"><i class="fas fa-gauge"></i> Pressure</span>
                    <span class="detail-value">${data.pressure} mb</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label"><i class="fas fa-eye"></i> Visibility</span>
                    <span class="detail-value">${data.visibility} km</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label"><i class="fas fa-thermometer-half"></i> Feels Like</span>
                    <span class="detail-value">${data.feelsLike}°C</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label"><i class="fas fa-sun"></i> UV Index</span>
                    <span class="detail-value">${data.uvIndex}</span>
                </div>
            </div>
        </div>
        <div class="weather-icon">
            <i class="${data.icon}"></i>
        </div>
    `;

    document.getElementById('currentWeather').innerHTML = weatherHTML;
    
    // Update weather details section
    updateWeatherDetails(data);
}

function updateWeatherDetails(data) {
    document.getElementById('windSpeed').textContent = `${data.windSpeed} km/h`;
    document.getElementById('humidity').textContent = `${data.humidity}%`;
    document.getElementById('pressure').textContent = `${data.pressure} mb`;
    document.getElementById('visibility').textContent = `${data.visibility} km`;
    document.getElementById('cloudCover').textContent = `${data.cloudCover || 0}%`;
    document.getElementById('uvIndex').textContent = data.uvIndex;
}

function displayTyphoonTracker(typhoons) {
    const statusElement = document.getElementById('typhoonStatus');
    const listElement = document.getElementById('typhoonList');

    if (!typhoons || typhoons.length === 0) {
        statusElement.className = 'status-indicator';
        statusElement.innerHTML = `
            <div class="status-icon"><i class="fas fa-shield-alt"></i></div>
            <div class="status-info">
                <h3>System Status</h3>
                <p>No active tropical storms detected. Stay safe!</p>
            </div>
        `;
        listElement.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-light);">No active typhoons at the moment.</p>';
        
        // Clear map markers
        if (state.markerGroup) {
            state.markerGroup.clearLayers();
        }
        state.typhoonMarkers = [];
        return;
    }

    // Update status
    const hasActive = typhoons.some(t => t.status === 'Active');
    statusElement.className = hasActive ? 'status-indicator danger' : 'status-indicator warning';
    statusElement.innerHTML = `
        <div class="status-icon"><i class="fas fa-exclamation-circle"></i></div>
        <div class="status-info">
            <h3>⚠ System Alert</h3>
            <p>${typhoons.length} tropical storm(s) currently being monitored</p>
        </div>
    `;

    // Update map with typhoon markers
    if (state.typhoonMap) {
        // Use advanced visualization if available
        if (typeof updateAdvancedTyphoonMap === 'function') {
            updateAdvancedTyphoonMap(typhoons);
        } else {
            updateTyphoonMap(typhoons);
        }
    }

    // Display typhoon cards
    listElement.innerHTML = typhoons.map(typhoon => `
        <div class="typhoon-card ${typhoon.status === 'Active' ? 'critical' : ''}" data-lat="${typhoon.latitude || ''}" data-lon="${typhoon.longitude || ''}">
            <div class="typhoon-name"><i class="fas fa-hurricane"></i> ${typhoon.name}</div>
            <div class="typhoon-detail">
                <span class="typhoon-label">Category:</span>
                <span class="typhoon-value">${typhoon.category}</span>
            </div>
            <div class="typhoon-detail">
                <span class="typhoon-label">Maximum Wind:</span>
                <span class="typhoon-value">${typhoon.speed} km/h</span>
            </div>
            <div class="typhoon-detail">
                <span class="typhoon-label">Central Pressure:</span>
                <span class="typhoon-value">${typhoon.pressure} mb</span>
            </div>
            <div class="typhoon-detail">
                <span class="typhoon-label">Position:</span>
                <span class="typhoon-value">${typhoon.latitude ? typhoon.latitude.toFixed(1) : 'N/A'}°N, ${typhoon.longitude ? typhoon.longitude.toFixed(1) : 'N/A'}°E</span>
            </div>
            <div class="typhoon-detail">
                <span class="typhoon-label">Movement Speed:</span>
                <span class="typhoon-value">${typhoon.movementSpeed} km/h</span>
            </div>
            <div class="typhoon-detail">
                <span class="typhoon-label">Affected Regions:</span>
                <span class="typhoon-value">${Array.isArray(typhoon.affectedRegions) ? typhoon.affectedRegions.join(', ') : typhoon.affectedRegions || 'N/A'}</span>
            </div>
            ${typhoon.warnings ? `<div class="typhoon-detail">
                <span class="typhoon-label">Warning:</span>
                <span class="typhoon-value">${typhoon.warnings}</span>
            </div>` : ''}
            <span class="typhoon-status-badge ${typhoon.status === 'Active' ? 'critical' : 'monitored'}">${typhoon.status}</span>
        </div>
    `).join('');

    // Add click handlers to cards to center map on typhoon
    listElement.querySelectorAll('.typhoon-card').forEach((card, index) => {
        const lat = parseFloat(card.dataset.lat);
        const lon = parseFloat(card.dataset.lon);
        if (lat && lon && state.typhoonMap) {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                state.typhoonMap.setView([lat, lon], 8, {
                    animate: true,
                    duration: 0.5
                });
                // Open popup if marker exists
                const marker = state.typhoonMarkers[index];
                if (marker) {
                    marker.openPopup();
                }
            });
        }
    });
}

function displayForecast(forecast) {
    const forecastGrid = document.getElementById('forecastGrid');
    
    if (!forecast || forecast.length === 0) {
        forecastGrid.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-light);">No forecast data available.</p>';
        return;
    }
    
    // Get day names
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    forecastGrid.innerHTML = forecast.map((day, index) => {
        const date = new Date(day.date);
        const dayName = index === 0 ? 'Today' : (index === 1 ? 'Tomorrow' : dayNames[date.getDay()] || day.day);
        
        return `
        <div class="forecast-card">
            <div class="forecast-day">${dayName}</div>
            <div class="forecast-date">${formatDate(day.date)}</div>
            <div class="forecast-icon"><i class="${day.icon || getWeatherIcon(day.condition)}"></i></div>
            <div class="forecast-desc">${day.condition}</div>
            <div class="forecast-temp">${day.tempHigh}°C / ${day.tempLow}°C</div>
            <div class="forecast-details">
                <div class="forecast-detail-item">
                    <div class="forecast-detail-label"><i class="fas fa-droplet"></i> Humidity</div>
                    <div class="forecast-detail-value">${day.humidity}%</div>
                </div>
                <div class="forecast-detail-item">
                    <div class="forecast-detail-label"><i class="fas fa-wind"></i> Wind</div>
                    <div class="forecast-detail-value">${day.windSpeed} km/h</div>
                </div>
                <div class="forecast-detail-item">
                    <div class="forecast-detail-label"><i class="fas fa-cloud-rain"></i> Rain</div>
                    <div class="forecast-detail-value">${day.chanceOfRain || 0}%</div>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

function displayAlerts(alerts) {
    const alertsContainer = document.getElementById('alertsContainer');

    if (alerts.length === 0) {
        alertsContainer.innerHTML = `
            <div class="no-alerts">
                <i class="fas fa-check-circle"></i>
                <p>No active weather alerts at this time</p>
            </div>
        `;
        return;
    }

    alertsContainer.innerHTML = alerts.map(alert => `
        <div class="alert-item ${alert.type}">
            <div class="alert-icon">
                ${alert.type === 'critical' ? '<i class="fas fa-exclamation-circle"></i>' : 
                  alert.type === 'warning' ? '<i class="fas fa-exclamation-triangle"></i>' : 
                  '<i class="fas fa-info-circle"></i>'}
            </div>
            <div class="alert-body">
                <h4>${alert.title}</h4>
                <p>${alert.message}</p>
                <div class="alert-timestamp"><i class="fas fa-clock"></i> ${alert.timestamp}</div>
            </div>
        </div>
    `).join('');
}

// ===========================
// Notification System
// ===========================
function showNotification(message, type = 'info') {
    const banner = document.getElementById('alertBanner');
    const alertMessage = document.getElementById('alertMessage');

    alertMessage.textContent = message;
    banner.classList.remove('hidden');

    // Auto-hide after 5 seconds
    setTimeout(() => {
        banner.classList.add('hidden');
    }, 5000);
}

// ===========================
// Utility Functions
// ===========================
function getWeatherIcon(condition) {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes('rain')) return 'fas fa-cloud-rain';
    if (conditionLower.includes('cloud')) return 'fas fa-cloud';
    if (conditionLower.includes('sun') || conditionLower.includes('clear')) return 'fas fa-sun';
    if (conditionLower.includes('storm')) return 'fas fa-bolt';
    if (conditionLower.includes('snow')) return 'fas fa-snowflake';
    return 'fas fa-cloud-sun';
}

// ===========================
// Error Handling
// ===========================
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showNotification('An error occurred. Please refresh the page.', 'error');
});
