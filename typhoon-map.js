// ===========================
// Advanced Typhoon Map Visualization
// Wind fields, intensity zones, and city markers
// ===========================

let windFieldLayer = null;
let intensityZones = [];
let cityMarkers = [];

// Major Philippine cities with coordinates
const PHILIPPINE_CITIES = [
    { name: 'Manila', lat: 14.5995, lon: 120.9842 },
    { name: 'Quezon City', lat: 14.6760, lon: 121.0437 },
    { name: 'Cebu City', lat: 10.3157, lon: 123.8854 },
    { name: 'Davao', lat: 7.1907, lon: 125.4553 },
    { name: 'Tuguegarao', lat: 17.6133, lon: 121.7269 },
    { name: 'Puerto Princesa', lat: 9.7392, lon: 118.7353 },
    { name: 'Itbayat', lat: 20.7875, lon: 121.8417 },
    { name: 'Lamitan', lat: 6.6500, lon: 122.1333 },
    { name: 'Baguio', lat: 16.4023, lon: 120.5960 },
    { name: 'Iloilo', lat: 10.7202, lon: 122.5621 },
    { name: 'Bacolod', lat: 10.6765, lon: 122.9509 },
    { name: 'Zamboanga', lat: 6.9214, lon: 122.0790 }
];

// ===========================
// Initialize Advanced Map Features
// ===========================
function initializeAdvancedTyphoonMap() {
    if (typeof state === 'undefined' || !state.typhoonMap) {
        console.warn('Typhoon map not initialized yet');
        return;
    }
    
    // Initialize wind field layer
    initializeWindFieldLayer();
    
    // Add city markers
    addCityMarkers();
}

function initializeWindFieldLayer() {
    // Create a canvas layer for wind field visualization
    windFieldLayer = L.layerGroup().addTo(state.typhoonMap);
}

// ===========================
// Create Typhoon Visualization with Intensity Zones
// ===========================
function createTyphoonVisualization(typhoon) {
    if (typeof state === 'undefined' || !state.typhoonMap) {
        return null;
    }
    
    if (!typhoon.latitude || !typhoon.longitude) {
        return null;
    }
    
    const center = [typhoon.latitude, typhoon.longitude];
    const windSpeed = typhoon.speed || 0;
    
    // Calculate intensity zones based on wind speed
    const zones = calculateIntensityZones(windSpeed);
    
    // Create circular intensity zones
    zones.forEach((zone, index) => {
        const circle = L.circle(center, {
            radius: zone.radius * 1000, // Convert km to meters
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: zone.opacity,
            weight: 2,
            className: 'typhoon-intensity-zone'
        }).addTo(state.typhoonMap);
        
        intensityZones.push(circle);
    });
    
    // Create wind field around typhoon
    createWindField(center, windSpeed, zones[0].radius);
    
    // Create typhoon eye marker
    const eyeMarker = createTyphoonEye(typhoon, center);
    
    return {
        eye: eyeMarker,
        zones: zones,
        center: center
    };
}

function calculateIntensityZones(windSpeed) {
    // Calculate zone radii based on wind speed (in km)
    const baseRadius = Math.max(50, windSpeed / 2); // Minimum 50km radius
    
    return [
        {
            radius: baseRadius * 0.3, // Eye
            color: '#FFD700', // Yellow
            opacity: 0.9
        },
        {
            radius: baseRadius * 0.5, // Inner core
            color: '#8B00FF', // Purple
            opacity: 0.7
        },
        {
            radius: baseRadius * 0.7, // Core
            color: '#DC143C', // Crimson
            opacity: 0.6
        },
        {
            radius: baseRadius * 0.85, // Outer core
            color: '#FF4500', // Orange Red
            opacity: 0.5
        },
        {
            radius: baseRadius, // Main zone
            color: '#FF8C00', // Dark Orange
            opacity: 0.4
        },
        {
            radius: baseRadius * 1.3, // Extended zone
            color: '#32CD32', // Lime Green
            opacity: 0.3
        },
        {
            radius: baseRadius * 1.6, // Outer zone
            color: '#00FF00', // Green
            opacity: 0.2
        }
    ];
}

function createWindField(center, windSpeed, maxRadius) {
    if (!windFieldLayer) return;
    
    // Create wind vectors in a grid pattern
    const gridSize = 25; // Points per side (increased for better coverage)
    const spacing = maxRadius * 2.5 / gridSize;
    
    for (let i = -gridSize/2; i < gridSize/2; i++) {
        for (let j = -gridSize/2; j < gridSize/2; j++) {
            const lat = center[0] + (i * spacing / 111); // Approximate km to degrees
            const lon = center[1] + (j * spacing / (111 * Math.cos(center[0] * Math.PI / 180)));
            
            const distance = Math.sqrt(i*i + j*j) * spacing;
            if (distance > maxRadius * 2) continue; // Extend wind field further
            
            // Calculate wind direction (spiral/circular pattern around typhoon)
            // Wind flows counter-clockwise in Northern Hemisphere
            const angle = Math.atan2(i, j) + Math.PI / 2;
            const intensity = Math.max(0, 1 - (distance / (maxRadius * 2)));
            
            // Only show vectors with significant intensity
            if (intensity > 0.1) {
                createWindVector([lat, lon], angle, intensity * windSpeed);
            }
        }
    }
}

function createWindVector(position, angle, speed) {
    if (!windFieldLayer) return;
    
    const length = Math.min(25, Math.max(8, speed / 8)); // Vector length in pixels (8-25px)
    const opacity = Math.min(0.9, Math.max(0.3, speed / 80));
    const strokeWidth = Math.min(2.5, Math.max(1, speed / 50));
    
    // Create a custom icon for wind vector with better visibility
    const windIcon = L.divIcon({
        className: 'wind-vector',
        html: `
            <svg width="50" height="50" style="opacity: ${opacity}">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                <line x1="25" y1="25" 
                      x2="${25 + length * Math.cos(angle)}" 
                      y2="${25 + length * Math.sin(angle)}" 
                      stroke="white" 
                      stroke-width="${strokeWidth}" 
                      stroke-linecap="round"
                      filter="url(#glow)"/>
                <circle cx="25" cy="25" r="1.5" fill="white" filter="url(#glow)"/>
            </svg>
        `,
        iconSize: [50, 50],
        iconAnchor: [25, 25]
    });
    
    const marker = L.marker(position, {
        icon: windIcon,
        interactive: false,
        zIndexOffset: -100 // Behind other markers
    });
    
    windFieldLayer.addLayer(marker);
}

function createTyphoonEye(typhoon, center) {
    // Determine marker color and size based on category
    let markerColor = '#3b82f6';
    let markerSize = 30;
    
    if (typhoon.status === 'Active') {
        markerColor = '#DC143C'; // Crimson
        markerSize = 40;
    } else if (typhoon.status === 'Monitored') {
        markerColor = '#FF8C00'; // Dark Orange
        markerSize = 35;
    }
    
    // Create eye icon with pulsing animation
    const eyeIcon = L.divIcon({
        className: 'typhoon-eye',
        html: `
            <div style="
                width: ${markerSize}px;
                height: ${markerSize}px;
                background: radial-gradient(circle, ${markerColor} 0%, ${markerColor}dd 50%, ${markerColor}88 100%);
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 0 20px ${markerColor}, 0 0 40px ${markerColor}88;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: ${markerSize * 0.6}px;
                animation: pulse-typhoon-eye 2s infinite;
            ">🌪️</div>
        `,
        iconSize: [markerSize, markerSize],
        iconAnchor: [markerSize / 2, markerSize / 2]
    });
    
    const marker = L.marker(center, {
        icon: eyeIcon,
        title: typhoon.name,
        zIndexOffset: 1000
    });
    
    // Create popup
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
        </div>
    `;
    
    marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'typhoon-popup-container'
    });
    
    return marker;
}

// ===========================
// City Markers with Wind Data
// ===========================
function addCityMarkers() {
    if (typeof state === 'undefined' || !state.typhoonMap) {
        return;
    }
    
    // Clear existing city markers
    cityMarkers.forEach(marker => {
        state.typhoonMap.removeLayer(marker);
    });
    cityMarkers = [];
    
    // Add markers for major cities
    PHILIPPINE_CITIES.forEach(city => {
        const marker = createCityMarker(city);
        if (marker) {
            cityMarkers.push(marker);
            marker.addTo(state.typhoonMap);
        }
    });
}

function createCityMarker(city) {
    // Calculate wind speed at this city based on nearby typhoons
    const windSpeed = calculateCityWindSpeed(city, state.typhoonData || []);
    
    // Create city marker with wind data
    const cityIcon = L.divIcon({
        className: 'city-marker',
        html: `
            <div class="city-marker-container">
                <div class="city-name">${city.name}</div>
                <div class="city-wind-indicator">
                    <i class="fas fa-arrow-down"></i>
                    <span class="wind-value">${windSpeed}</span>
                </div>
            </div>
        `,
        iconSize: [80, 50],
        iconAnchor: [40, 50]
    });
    
    const marker = L.marker([city.lat, city.lon], {
        icon: cityIcon,
        title: city.name
    });
    
    marker.bindPopup(`
        <div class="typhoon-popup">
            <h4><i class="fas fa-map-marker-alt"></i> ${city.name}</h4>
            <div class="popup-detail">
                <span class="popup-label">Wind Speed:</span>
                <span class="popup-value">${windSpeed} km/h</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">Coordinates:</span>
                <span class="popup-value">${city.lat.toFixed(4)}°N, ${city.lon.toFixed(4)}°E</span>
            </div>
        </div>
    `);
    
    return marker;
}

function calculateCityWindSpeed(city, typhoons) {
    if (!typhoons || typhoons.length === 0) {
        // Return realistic default wind speeds for Philippines
        return Math.floor(Math.random() * 15) + 10; // 10-25 km/h default
    }
    
    let maxWind = 0;
    
    typhoons.forEach(typhoon => {
        if (!typhoon.latitude || !typhoon.longitude) return;
        
        // Calculate distance from city to typhoon
        const distance = getDistance(
            city.lat, city.lon,
            typhoon.latitude, typhoon.longitude
        );
        
        // Calculate wind speed at this distance (decreases with distance)
        const typhoonWind = typhoon.speed || 0;
        const windAtCity = typhoonWind * Math.exp(-distance / 200); // Exponential decay
        
        maxWind = Math.max(maxWind, windAtCity);
    });
    
    return Math.max(10, Math.floor(maxWind)); // Minimum 10 km/h
}

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// ===========================
// Update Typhoon Map with Advanced Visualization
// ===========================
function updateAdvancedTyphoonMap(typhoons) {
    if (typeof state === 'undefined' || !state.typhoonMap) {
        return;
    }
    
    // Clear existing visualizations
    intensityZones.forEach(zone => {
        state.typhoonMap.removeLayer(zone);
    });
    intensityZones = [];
    
    if (windFieldLayer) {
        windFieldLayer.clearLayers();
    }
    
    // Clear wind tracks
    if (state.windTrackLayer) {
        state.windTrackLayer.clearLayers();
    }
    
    // Remove old typhoon markers
    state.typhoonMarkers.forEach(marker => {
        state.typhoonMap.removeLayer(marker);
    });
    state.typhoonMarkers = [];
    
    if (!typhoons || typhoons.length === 0) {
        // Update city markers with default wind speeds
        updateCityWindSpeeds([]);
        return;
    }
    
    // Create advanced visualization for each typhoon
    typhoons.forEach(typhoon => {
        const visualization = createTyphoonVisualization(typhoon);
        if (visualization && visualization.eye) {
            state.typhoonMarkers.push(visualization.eye);
            visualization.eye.addTo(state.typhoonMap);
        }
        
        // Draw wind track if available
        if (state.windTrackVisible && state.windTrackLayer) {
            drawWindTrack(typhoon);
        }
    });
    
    // Update city wind speeds based on typhoons
    updateCityWindSpeeds(typhoons);
    
    // Fit map to show all typhoons
    if (state.typhoonMarkers.length > 0) {
        const group = new L.featureGroup(state.typhoonMarkers);
        const bounds = group.getBounds();
        
        if (bounds.isValid()) {
            state.typhoonMap.fitBounds(bounds, {
                padding: [100, 100],
                maxZoom: 7
            });
        }
    }
}

// ===========================
// Wind Track Visualization
// ===========================
function drawWindTrack(typhoon) {
    if (!state.windTrackLayer || !typhoon.latitude || !typhoon.longitude) {
        return;
    }
    
    // Generate forecast track points if not provided
    // This simulates a forecast track based on movement direction and speed
    const trackPoints = typhoon.forecastTrack || generateForecastTrack(typhoon);
    
    if (trackPoints.length < 2) {
        return;
    }
    
    // Create polyline for the track
    const latlngs = trackPoints.map(point => [point.lat, point.lon]);
    
    // Determine track color based on intensity
    let trackColor = '#3b82f6'; // Default blue
    if (typhoon.status === 'Active') {
        trackColor = '#ef4444'; // Red for active
    } else if (typhoon.status === 'Monitored') {
        trackColor = '#f59e0b'; // Orange for monitored
    }
    
    // Draw the track line
    const trackLine = L.polyline(latlngs, {
        color: trackColor,
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 5',
        lineCap: 'round',
        lineJoin: 'round'
    });
    
    // Add forecast points along the track
    trackPoints.forEach((point, index) => {
        if (index === 0) return; // Skip current position
        
        // Create forecast point marker
        const pointMarker = L.circleMarker([point.lat, point.lon], {
            radius: 6,
            fillColor: trackColor,
            color: '#ffffff',
            weight: 2,
            fillOpacity: 0.8
        });
        
        // Add popup with forecast info
        const hoursAhead = index * 6; // Assuming 6-hour intervals
        pointMarker.bindPopup(`
            <div class="track-popup">
                <h4>${typhoon.name}</h4>
                <p><strong>Forecast:</strong> +${hoursAhead} hours</p>
                <p><strong>Position:</strong> ${point.lat.toFixed(2)}°N, ${point.lon.toFixed(2)}°E</p>
                ${point.windSpeed ? `<p><strong>Wind Speed:</strong> ${point.windSpeed} km/h</p>` : ''}
            </div>
        `);
        
        state.windTrackLayer.addLayer(pointMarker);
    });
    
    state.windTrackLayer.addLayer(trackLine);
}

function generateForecastTrack(typhoon) {
    // Generate a forecast track based on current position and movement
    const trackPoints = [];
    const currentLat = typhoon.latitude;
    const currentLon = typhoon.longitude;
    
    // Add current position
    trackPoints.push({
        lat: currentLat,
        lon: currentLon,
        windSpeed: typhoon.speed
    });
    
    // Generate forecast points (assuming movement direction and speed)
    // This is a simplified forecast - in reality, this would come from API data
    const movementSpeed = typhoon.movementSpeed || 20; // km/h
    const movementDirection = parseMovementDirection(typhoon.movementDirection || 'NW');
    
    // Generate 5 forecast points (6-hour intervals = 30 hours ahead)
    for (let i = 1; i <= 5; i++) {
        const hoursAhead = i * 6;
        const distanceKm = (movementSpeed * hoursAhead) / 111; // Convert to degrees (approximate)
        
        const forecastLat = currentLat + (distanceKm * Math.cos(movementDirection));
        const forecastLon = currentLon + (distanceKm * Math.sin(movementDirection));
        
        // Simulate intensity change (slight decrease over time)
        const forecastWindSpeed = Math.max(0, (typhoon.speed || 0) - (i * 5));
        
        trackPoints.push({
            lat: forecastLat,
            lon: forecastLon,
            windSpeed: forecastWindSpeed
        });
    }
    
    return trackPoints;
}

function parseMovementDirection(direction) {
    // Convert direction string to radians
    const directions = {
        'N': Math.PI / 2,
        'NE': Math.PI / 4,
        'E': 0,
        'SE': -Math.PI / 4,
        'S': -Math.PI / 2,
        'SW': -3 * Math.PI / 4,
        'W': Math.PI,
        'NW': 3 * Math.PI / 4
    };
    
    return directions[direction.toUpperCase()] || Math.PI / 4; // Default to NE
}

function updateCityWindSpeeds(typhoons) {
    cityMarkers.forEach((marker, index) => {
        const city = PHILIPPINE_CITIES[index];
        if (!city || !marker) return;
        
        const windSpeed = calculateCityWindSpeed(city, typhoons);
        
        // Update marker content
        const newIcon = L.divIcon({
            className: 'city-marker',
            html: `
                <div class="city-marker-container">
                    <div class="city-name">${city.name}</div>
                    <div class="city-wind-indicator">
                        <i class="fas fa-arrow-down"></i>
                        <span class="wind-value">${windSpeed}</span>
                    </div>
                </div>
            `,
            iconSize: [80, 50],
            iconAnchor: [40, 50]
        });
        
        marker.setIcon(newIcon);
    });
}

// ===========================
// Hook into existing updateTyphoonMap
// ===========================
(function() {
    // Wait for script.js to load
    const initAdvancedMap = setInterval(() => {
        if (typeof state !== 'undefined' && state.typhoonMap) {
            initializeAdvancedTyphoonMap();
            clearInterval(initAdvancedMap);
        }
    }, 100);
    
    // Override updateTyphoonMap after script.js loads
    setTimeout(() => {
        if (typeof updateTyphoonMap !== 'undefined') {
            const originalUpdate = window.updateTyphoonMap;
            window.updateTyphoonMap = function(typhoons) {
                if (state && state.typhoonMap && typeof updateAdvancedTyphoonMap === 'function') {
                    updateAdvancedTyphoonMap(typhoons);
                } else if (originalUpdate) {
                    originalUpdate(typhoons);
                }
            };
        }
    }, 500);
})();

