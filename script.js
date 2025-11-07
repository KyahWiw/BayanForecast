// ===========================
// Global Configuration
// ===========================
const CONFIG = {
    API_ENDPOINT: 'api.php',
    UPDATE_INTERVAL: 600000, // 10 minutes in milliseconds
    DEFAULT_LOCATION: 'Manila',
    DEFAULT_COUNTRY: 'PH',
    OFFLINE_MODE_ENABLED: true,
    CACHE_DURATION: {
        weather: 60 * 60 * 1000, // 1 hour
        forecast: 3 * 60 * 60 * 1000, // 3 hours
        typhoon: 30 * 60 * 1000, // 30 minutes
        alerts: 60 * 60 * 1000 // 1 hour
    }
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
    locationPermission: localStorage.getItem('locationPermission') || null,
    lastUpdate: {
        weather: null,
        typhoon: null,
        forecast: null,
        alerts: null
    },
    isConnected: navigator.onLine,
    updateIntervals: {},
    typhoonMap: null,
    typhoonMarkers: [],
    markerGroup: null,
    userLocationMarker: null,
    mapLayers: null,
    windTrackLayer: null,
    windTrackVisible: true,
    offlineMode: false,
    serviceWorkerReady: false
};

// ===========================
// Initialize Application
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeEventListeners();
    initializeOfflineSupport();
    initializeOfflineStorage();

    // Get current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Initialize typhoon map if on typhoon tracker page or home page
    if (currentPage === 'typhoon-tracker.html' || currentPage === 'index.html' || currentPage.includes('typhoon')) {
        // Set up map control buttons immediately (don't wait for map)
        setTimeout(() => {
            setupMapControlButtons();
        }, 50);

        // Wait a bit for DOM to be fully ready, then initialize map
        setTimeout(async() => {
            await initializeTyphoonMap();
        }, 200);
    }

    // Initial data load - try offline storage first if offline
    if (!state.isConnected && typeof window.OfflineStorage !== 'undefined') {
        // Load cached data if offline
        loadCachedDataOnStartup();
    } else {
        // Load fresh data if online
        loadWeatherData(CONFIG.DEFAULT_LOCATION);
        loadTyphoonData();
        loadForecastData(CONFIG.DEFAULT_LOCATION);
        loadAlertsData();
    }

    // Auto-update weather data
    setInterval(() => {
        loadWeatherData(state.currentLocation);
    }, CONFIG.UPDATE_INTERVAL);

    // Auto-update typhoon data
    setInterval(() => {
        loadTyphoonData();
    }, CONFIG.UPDATE_INTERVAL);

    // Show welcome message
    if (typeof showNotification === 'function') {
        showNotification('Welcome to BayanForecast!', 'info');
    }
});

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
    document.getElementById('themeToggle').innerHTML = state.theme === 'dark' ?
        '<i class="fas fa-sun"></i>' :
        '<i class="fas fa-moon"></i>';
}

// ===========================
// Event Listeners
// ===========================
function initializeEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('locationSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Close alert banner
    document.getElementById('closeAlert').addEventListener('click', () => {
        document.getElementById('alertBanner').classList.add('hidden');
    });

    // Navigation active link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// ===========================
// Search Handler
// ===========================
function handleSearch() {
    const location = document.getElementById('locationSearch').value.trim();
    if (location) {
        state.currentLocation = location;
        loadWeatherData(location);
        loadForecastData(location);
        showNotification(`Searching for weather in ${location}...`, 'info');
    }
}

// ===========================
// API Data Loading
// ===========================
function loadWeatherData(location) {
    // Simulate API call - in production, this would call your PHP API
    const mockWeatherData = generateMockWeatherData(location);
    displayCurrentWeather(mockWeatherData);
}

function loadTyphoonData() {
    // Simulate API call for typhoon data
    const mockTyphoonData = generateMockTyphoonData();
    displayTyphoonTracker(mockTyphoonData);
}

function loadForecastData(location) {
    // Simulate API call for forecast data
    const mockForecastData = generateMockForecastData();
    displayForecast(mockForecastData);
}

function loadAlertsData() {
    // Simulate API call for alerts data
    const mockAlertsData = generateMockAlertsData();
    displayAlerts(mockAlertsData);
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
        lastUpdated: new Date().toLocaleString()
    };
}

function generateMockTyphoonData() {
    const typhoons = [{
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
    return [{
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
}

function displayTyphoonTracker(typhoons) {
    const statusElement = document.getElementById('typhoonStatus');
    const listElement = document.getElementById('typhoonList');

    if (typhoons.length === 0) {
        statusElement.className = 'status-indicator';
        statusElement.innerHTML = `
            <div class="status-icon"><i class="fas fa-shield-alt"></i></div>
            <div class="status-info">
                <h3>System Status</h3>
                <p>No active tropical storms detected. Stay safe!</p>
            </div>
        `;
        listElement.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-light);">No active typhoons at the moment.</p>';
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

    // Display typhoon cards
    listElement.innerHTML = typhoons.map(typhoon => `
        <div class="typhoon-card ${typhoon.status === 'Active' ? 'critical' : ''}">
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
                <span class="typhoon-value">${typhoon.latitude.toFixed(1)}°N, ${typhoon.longitude.toFixed(1)}°E</span>
            </div>
            <div class="typhoon-detail">
                <span class="typhoon-label">Movement Speed:</span>
                <span class="typhoon-value">${typhoon.movementSpeed} km/h</span>
            </div>
            <div class="typhoon-detail">
                <span class="typhoon-label">Affected Regions:</span>
                <span class="typhoon-value">${typhoon.affectedRegions.join(', ')}</span>
            </div>
            <span class="typhoon-status-badge ${typhoon.status === 'Active' ? 'critical' : 'monitored'}">${typhoon.status}</span>
        </div>
    `).join('');
}

function displayForecast(forecast) {
    const forecastGrid = document.getElementById('forecastGrid');

    forecastGrid.innerHTML = forecast.map(day => `
        <div class="forecast-card">
            <div class="forecast-day">${day.day}</div>
            <div style="font-size: 12px; opacity: 0.7;">${day.date}</div>
            <div class="forecast-icon"><i class="${day.icon}"></i></div>
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
                    <div class="forecast-detail-value">${day.chanceOfRain}%</div>
                </div>
            </div>
        </div>
    `).join('');
}

function displayAlerts(alerts) {
    const alertsGrid = document.getElementById('alertsGrid');

    if (alerts.length === 0) {
        alertsGrid.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-light);">No active alerts at the moment.</p>';
        return;
    }

    alertsGrid.innerHTML = alerts.map(alert => `
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

// ===========================
// PAGASA Wind Signal Calculation
// ===========================
/**
 * Calculate PAGASA Wind Signal Number (#1 to #5) based on typhoon location and strength
 * PAGASA Wind Signal System:
 * - Signal #1: 30-60 km/h winds expected within 36 hours
 * - Signal #2: 61-120 km/h winds expected within 24 hours
 * - Signal #3: 121-170 km/h winds expected within 18 hours
 * - Signal #4: 171-220 km/h winds expected within 12 hours
 * - Signal #5: >220 km/h winds expected within 12 hours
 */
function calculatePAGASAWindSignal(typhoon) {
    if (!typhoon.latitude || !typhoon.longitude) {
        return null;
    }

    // Philippines boundaries (approximate)
    const PH_LAT_MIN = 5.0;
    const PH_LAT_MAX = 20.0;
    const PH_LON_MIN = 115.0;
    const PH_LON_MAX = 127.0;
    
    // Philippines center point
    const PH_CENTER_LAT = 12.8797;
    const PH_CENTER_LON = 121.7740;

    const typhoonLat = parseFloat(typhoon.latitude);
    const typhoonLon = parseFloat(typhoon.longitude);
    const windSpeed = parseFloat(typhoon.speed) || 0;
    const movementSpeed = parseFloat(typhoon.movementSpeed) || 15; // km/h

    // Check if typhoon is already within Philippines
    const isWithinPhilippines = (
        typhoonLat >= PH_LAT_MIN && typhoonLat <= PH_LAT_MAX &&
        typhoonLon >= PH_LON_MIN && typhoonLon <= PH_LON_MAX
    );

    // Calculate distance to Philippines center (Haversine formula)
    function haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    const distance = haversineDistance(typhoonLat, typhoonLon, PH_CENTER_LAT, PH_CENTER_LON);
    
    // Estimate time to reach Philippines (hours)
    // Assuming typhoon moves toward Philippines (simplified calculation)
    let estimatedHours = null;
    if (movementSpeed > 0) {
        // Check if typhoon is moving toward Philippines
        // For simplicity, if within 1000km, assume it could affect Philippines
        if (distance <= 1000) {
            estimatedHours = distance / movementSpeed;
        } else if (distance <= 1500) {
            // If further, check if it's in a direction that could reach Philippines
            // Simplified: if within 1500km and east/west of Philippines, estimate time
            estimatedHours = distance / movementSpeed;
        }
    }

    // If typhoon is already within Philippines
    if (isWithinPhilippines) {
        // Signal based on current wind speed
        if (windSpeed > 220) return 5;
        if (windSpeed > 170) return 4;
        if (windSpeed > 120) return 3;
        if (windSpeed > 60) return 2;
        if (windSpeed >= 30) return 1;
        return null;
    }

    // If typhoon is far away or moving away, no signal
    if (!estimatedHours || estimatedHours > 72) {
        return null;
    }

    // Calculate signal based on estimated arrival time and wind speed
    // Higher wind speeds = higher signal even if further away
    // Closer distance = higher signal even with lower wind speeds
    
    // Expected wind speed at Philippines (may weaken slightly over distance)
    // Simplified: assume 10% weakening per 500km
    const weakeningFactor = Math.max(0.5, 1 - (distance / 500) * 0.1);
    const expectedWindSpeed = windSpeed * weakeningFactor;

    // Determine signal based on expected wind speed and time
    if (estimatedHours <= 12) {
        // Within 12 hours
        if (expectedWindSpeed > 220) return 5;
        if (expectedWindSpeed > 170) return 4;
        if (expectedWindSpeed > 120) return 3;
        if (expectedWindSpeed > 60) return 2;
        if (expectedWindSpeed >= 30) return 1;
    } else if (estimatedHours <= 18) {
        // Within 18 hours
        if (expectedWindSpeed > 120) return 3;
        if (expectedWindSpeed > 60) return 2;
        if (expectedWindSpeed >= 30) return 1;
    } else if (estimatedHours <= 24) {
        // Within 24 hours
        if (expectedWindSpeed > 60) return 2;
        if (expectedWindSpeed >= 30) return 1;
    } else if (estimatedHours <= 36) {
        // Within 36 hours
        if (expectedWindSpeed >= 30) return 1;
    }

    return null;
}

/**
 * Get PAGASA Wind Signal display information
 */
function getPAGASAWindSignalInfo(signalNumber) {
    if (!signalNumber) return null;

    const signals = {
        1: {
            number: 1,
            label: 'Wind Signal #1',
            description: '30-60 km/h winds expected within 36 hours',
            color: '#fbbf24', // amber
            bgColor: '#fef3c7'
        },
        2: {
            number: 2,
            label: 'Wind Signal #2',
            description: '61-120 km/h winds expected within 24 hours',
            color: '#f59e0b', // orange
            bgColor: '#fed7aa'
        },
        3: {
            number: 3,
            label: 'Wind Signal #3',
            description: '121-170 km/h winds expected within 18 hours',
            color: '#ef4444', // red
            bgColor: '#fee2e2'
        },
        4: {
            number: 4,
            label: 'Wind Signal #4',
            description: '171-220 km/h winds expected within 12 hours',
            color: '#dc2626', // dark red
            bgColor: '#fecaca'
        },
        5: {
            number: 5,
            label: 'Wind Signal #5',
            description: '>220 km/h winds expected within 12 hours',
            color: '#991b1b', // very dark red
            bgColor: '#fca5a5'
        }
    };

    return signals[signalNumber] || null;
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

    // Calculate PAGASA Wind Signal
    const windSignal = calculatePAGASAWindSignal(typhoon);
    const signalInfo = getPAGASAWindSignalInfo(windSignal);

    // Create popup content
    const popupContent = `
        <div class="typhoon-popup">
            <h4><i class="fas fa-hurricane"></i> ${typhoon.name}</h4>
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

// ===========================
// Typhoon Map Initialization
// ===========================
async function initializeTyphoonMap() {
    // Get map container
    const mapContainer = document.getElementById('windy') || document.getElementById('typhoonMap');
    if (!mapContainer) {
        console.warn('Map container not found');
        return;
    }

    // Initialize map centered on Philippines
    const philippinesCenter = [12.8797, 121.7740];
    
    try {
        // Initialize OpenWeatherMap map
        console.log('Initializing OpenWeatherMap map...');
        if (typeof initializeOWMMap === 'function' || (typeof window !== 'undefined' && window.OWMMapAPI)) {
            const initFunc = typeof initializeOWMMap === 'function' ? initializeOWMMap : window.OWMMapAPI.initialize;
            const owmMap = await initFunc();
            
            if (owmMap) {
                state.typhoonMap = owmMap;
                state.mapLayers = {
                    owm: owmMap,
                    current: 'owm'
                };
                
                // Set view to Philippines
                owmMap.setView(philippinesCenter, 6);
                
                // Update button states - show OWM layer buttons and satellite buttons
                document.querySelectorAll('.map-layer-controls .map-control-btn').forEach(btn => {
                    btn.classList.remove('active');
                    const layer = btn.dataset.layer;
                    
                    // Show OWM layer buttons
                    if (layer === 'clouds' || layer === 'precipitation' || layer === 'globalPrecipitation' ||
                        layer === 'wind' || layer === 'temp' || layer === 'pressure') {
                        btn.style.display = 'inline-block';
                        // Set Global Precipitation as active by default (matching image)
                        if (layer === 'globalPrecipitation') {
                            btn.classList.add('active');
                            // Switch to Global Precipitation layer
                            if (typeof switchOWMLayer === 'function' || 
                                (typeof window !== 'undefined' && window.OWMMapAPI && window.OWMMapAPI.switchLayer)) {
                                const switchFunc = typeof switchOWMLayer === 'function' 
                                    ? switchOWMLayer 
                                    : window.OWMMapAPI.switchLayer;
                                switchFunc('globalPrecipitation');
                            }
                        }
                    }
                    // Show satellite layer buttons
                    else if (layer === 'himawari8' || layer === 'himawari8Visible' || layer === 'himawari8Infrared') {
                        btn.style.display = 'inline-block';
                    }
                });
                
                // Setup event listeners for buttons
                setupMapControlButtons();
                
                console.log('OpenWeatherMap map initialized successfully');
                return;
            }
        }
        
        // If offline, try to create a basic offline map using OpenStreetMap
        if (!state.isConnected) {
            console.log('Offline mode: Creating basic offline map with OpenStreetMap tiles...');
            try {
                if (typeof L !== 'undefined') {
                    const offlineMap = L.map(mapContainer, {
                        center: philippinesCenter,
                        zoom: 6,
                        zoomControl: true,
                        attributionControl: true
                    });
                    
                    // Use OpenStreetMap tiles (should be cached by service worker)
                    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                        maxZoom: 19
                    });
                    osmLayer.addTo(offlineMap);
                    
                    state.typhoonMap = offlineMap;
                    state.mapLayers = {
                        offline: offlineMap,
                        current: 'offline'
                    };
                    
                    setupMapControlButtons();
                    
                    if (typeof showNotification === 'function') {
                        showNotification('Using offline map mode. Limited functionality available.', 'info');
                    }
                    return;
                }
            } catch (offlineError) {
                console.error('Failed to create offline map:', offlineError);
            }
        }
        
        // If initialization fails, show error
        console.error('Failed to initialize OpenWeatherMap map');
        if (typeof showNotification === 'function') {
            const errorMsg = !state.isConnected
                ? 'Failed to initialize map. Please check your internet connection.'
                : 'Failed to initialize map. Please check your OpenWeatherMap API key in .env file.';
            showNotification(errorMsg, 'error');
        }

    } catch (error) {
        console.error('Error initializing typhoon map:', error);
        if (typeof showNotification === 'function') {
            showNotification('Error initializing map: ' + error.message, 'error');
        }
    }
}

// ===========================
// Setup Map Control Buttons
// ===========================
function setupMapControlButtons() {
    const philippinesCenter = [12.8797, 121.7740];
    
    console.log('Setting up map control buttons...');
    
    // Use event delegation on the parent container for better reliability
    const mapLayerControls = document.querySelector('.map-layer-controls');
    if (mapLayerControls) {
        // Remove any existing listeners first
        const newMapLayerControls = mapLayerControls.cloneNode(true);
        mapLayerControls.parentNode.replaceChild(newMapLayerControls, mapLayerControls);
        
        // Add fresh event listener
        newMapLayerControls.addEventListener('click', (e) => {
            const btn = e.target.closest('.map-control-btn');
            if (btn && btn.dataset.layer) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Button clicked via delegation:', btn.dataset.layer);
                switchMapLayer(btn.dataset.layer);
            }
        });
    }
    
    // OpenWeatherMap layer control buttons
    const cloudsBtn = document.getElementById('cloudsMapBtn');
    const precipitationBtn = document.getElementById('precipitationMapBtn');
    const globalPrecipitationBtn = document.getElementById('globalPrecipitationMapBtn');
    const windBtn = document.getElementById('windMapBtn');
    const tempBtn = document.getElementById('tempMapBtn');
    const pressureBtn = document.getElementById('pressureMapBtn');
    
    console.log('OpenWeatherMap buttons found:', {
        clouds: !!cloudsBtn,
        precipitation: !!precipitationBtn,
        globalPrecipitation: !!globalPrecipitationBtn,
        wind: !!windBtn,
        temp: !!tempBtn,
        pressure: !!pressureBtn
    });
    
    if (cloudsBtn) {
        cloudsBtn.style.cursor = 'pointer';
        cloudsBtn.style.pointerEvents = 'auto';
        cloudsBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            switchMapLayer('clouds');
            return false;
        };
    }
    if (precipitationBtn) {
        precipitationBtn.style.cursor = 'pointer';
        precipitationBtn.style.pointerEvents = 'auto';
        precipitationBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            switchMapLayer('precipitation');
            return false;
        };
    }
    if (globalPrecipitationBtn) {
        globalPrecipitationBtn.style.cursor = 'pointer';
        globalPrecipitationBtn.style.pointerEvents = 'auto';
        globalPrecipitationBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            switchMapLayer('globalPrecipitation');
            return false;
        };
    }
    if (windBtn) {
        windBtn.style.cursor = 'pointer';
        windBtn.style.pointerEvents = 'auto';
        windBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            switchMapLayer('wind');
            return false;
        };
    }
    if (tempBtn) {
        tempBtn.style.cursor = 'pointer';
        tempBtn.style.pointerEvents = 'auto';
        tempBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            switchMapLayer('temp');
            return false;
        };
    }
    if (pressureBtn) {
        pressureBtn.style.cursor = 'pointer';
        pressureBtn.style.pointerEvents = 'auto';
        pressureBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            switchMapLayer('pressure');
            return false;
        };
    }

    // Satellite layer control buttons
    const himawari8Btn = document.getElementById('himawari8MapBtn');
    const himawari8VisibleBtn = document.getElementById('himawari8VisibleMapBtn');
    const himawari8InfraredBtn = document.getElementById('himawari8InfraredMapBtn');
    
    if (himawari8Btn) {
        himawari8Btn.style.cursor = 'pointer';
        himawari8Btn.style.pointerEvents = 'auto';
        himawari8Btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            switchMapLayer('himawari8');
            return false;
        };
    }
    
    if (himawari8VisibleBtn) {
        himawari8VisibleBtn.style.cursor = 'pointer';
        himawari8VisibleBtn.style.pointerEvents = 'auto';
        himawari8VisibleBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            switchMapLayer('himawari8Visible');
            return false;
        };
    }
    
    if (himawari8InfraredBtn) {
        himawari8InfraredBtn.style.cursor = 'pointer';
        himawari8InfraredBtn.style.pointerEvents = 'auto';
        himawari8InfraredBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            switchMapLayer('himawari8Infrared');
            return false;
        };
    }

    // Map action control buttons
    const refreshBtn = document.getElementById('refreshMapBtn');
    if (refreshBtn) {
        refreshBtn.onclick = (e) => {
            e.preventDefault();
            loadTyphoonData();
        };
    }

    const centerBtn = document.getElementById('centerMapBtn');
    if (centerBtn) {
        centerBtn.onclick = (e) => {
            e.preventDefault();
            if (state.typhoonMap && state.typhoonMap.setView) {
                state.typhoonMap.setView(philippinesCenter, 6, {
                    animate: true,
                    duration: 1.0
                });
            }
        };
    }

    // Typhoon track toggle (shows/hides forecast track lines)
    const toggleTrackBtn = document.getElementById('toggleTrackBtn');
    if (toggleTrackBtn) {
        toggleTrackBtn.onclick = (e) => {
            e.preventDefault();
            // Toggle typhoon forecast track visibility
            if (state.mapLayers && state.mapLayers.current === 'owm') {
                state.windTrackVisible = !state.windTrackVisible;
                
                // Toggle track visibility using OWM API
                if (typeof toggleTyphoonTrack === 'function' || 
                    (typeof window !== 'undefined' && window.OWMMapAPI && window.OWMMapAPI.toggleTrack)) {
                    const toggleFunc = typeof toggleTyphoonTrack === 'function' 
                        ? toggleTyphoonTrack 
                        : window.OWMMapAPI.toggleTrack;
                    toggleFunc(state.windTrackVisible);
                }
                
                toggleTrackBtn.classList.toggle('active', state.windTrackVisible);
            }
        };
    }

    // Cities toggle button
    const toggleCitiesBtn = document.getElementById('toggleCitiesBtn');
    if (toggleCitiesBtn) {
        if (!state.citiesVisible) {
            state.citiesVisible = true;
        }
        toggleCitiesBtn.onclick = (e) => {
            e.preventDefault();
            state.citiesVisible = !state.citiesVisible;
            
            // Toggle city markers using OWM API
            if (typeof window !== 'undefined' && window.OWMMapAPI && window.OWMMapAPI.toggleCities) {
                window.OWMMapAPI.toggleCities(state.citiesVisible);
            }
            
            toggleCitiesBtn.classList.toggle('active', state.citiesVisible);
        };
    }

    // Invalidate size after a short delay to ensure map renders correctly
    setTimeout(() => {
        if (state.typhoonMap && state.typhoonMap.invalidateSize) {
            state.typhoonMap.invalidateSize();
        }
    }, 100);
}

// ===========================
// Map Layer Switching
// ===========================
async function switchMapLayer(layerName) {
    console.log('Switching to layer:', layerName);
    if (!state.mapLayers) {
        console.warn('Map layers not initialized');
        return;
    }
    
    // If map is not initialized yet, try to initialize it
    if (!state.typhoonMap) {
        console.warn('Map not initialized, initializing now...');
        await initializeTyphoonMap();
        if (!state.typhoonMap) {
            console.error('Failed to initialize map');
            return;
        }
    }
    
    // Handle satellite layer switching
    const satelliteLayers = ['himawari8', 'himawari8Visible', 'himawari8Infrared'];
    if (satelliteLayers.includes(layerName)) {
        if (typeof window !== 'undefined' && window.OWMMapAPI && window.OWMMapAPI.switchSatelliteLayer) {
            const success = window.OWMMapAPI.switchSatelliteLayer(layerName);
            if (success) {
                console.log('Switched to satellite layer:', layerName);
                // Update state to indicate satellite mode
                if (state.mapLayers) {
                    state.mapLayers.current = 'satellite';
                    state.mapLayers.satellite = layerName;
                }
            }
        }
    }
    // Handle OpenWeatherMap layer switching
    else if (state.mapLayers && state.mapLayers.current === 'owm') {
        if (['clouds', 'precipitation', 'globalPrecipitation', 'wind', 'temp', 'pressure'].includes(layerName)) {
            if (typeof switchOWMLayer === 'function' || 
                (typeof window !== 'undefined' && window.OWMMapAPI && window.OWMMapAPI.switchLayer)) {
                const switchFunc = typeof switchOWMLayer === 'function' 
                    ? switchOWMLayer 
                    : window.OWMMapAPI.switchLayer;
                switchFunc(layerName);
                console.log('Switched OpenWeatherMap to layer:', layerName);
            }
        }
    }
    
    // Update button states
    document.querySelectorAll('.map-layer-controls .map-control-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.layer === layerName) {
            btn.classList.add('active');
        }
    });
}

function updateTyphoonMap(typhoons) {
    // Update typhoon markers on OpenWeatherMap map
    if (state.mapLayers && state.mapLayers.current === 'owm' && state.mapLayers.owm) {
        if (typeof updateTyphoonMarkersOnOWMMap === 'function' || 
            (typeof window !== 'undefined' && window.OWMMapAPI && window.OWMMapAPI.updateTyphoons)) {
            const updateFunc = typeof updateTyphoonMarkersOnOWMMap === 'function' 
                ? updateTyphoonMarkersOnOWMMap 
                : window.OWMMapAPI.updateTyphoons;
            updateFunc(typhoons);
            return;
        }
    }
    
    // Fallback to basic markers if update function not available
    if (state.typhoonMap && state.markerGroup) {
        state.markerGroup.clearLayers();
        state.typhoonMarkers = [];
        
        if (typhoons && typhoons.length > 0) {
            typhoons.forEach(typhoon => {
                if (typhoon.latitude && typhoon.longitude) {
                    const marker = createTyphoonMarker(typhoon);
                    if (marker) {
                        state.typhoonMarkers.push(marker);
                        state.markerGroup.addLayer(marker);
                    }
                }
            });
            
            // Fit map to show all markers
            if (state.typhoonMarkers.length > 0) {
                const group = new L.featureGroup(state.typhoonMarkers);
                const bounds = group.getBounds();
                
                if (bounds.isValid()) {
                    state.typhoonMap.fitBounds(bounds, {
                        padding: [50, 50],
                        maxZoom: 8
                    });
                }
            }
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
// Offline Support Functions
// ===========================
function initializeOfflineSupport() {
    // Update connection status
    state.isConnected = navigator.onLine;
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
        state.isConnected = true;
        state.offlineMode = false;
        updateOfflineIndicator();
        showNotification('Internet connection restored. Updating data...', 'success');
        // Reload data when coming back online
        loadWeatherData(state.currentLocation);
        loadTyphoonData();
        loadForecastData(state.currentLocation);
        loadAlertsData();
    });
    
    window.addEventListener('offline', () => {
        state.isConnected = false;
        state.offlineMode = true;
        updateOfflineIndicator();
        showNotification('You are now offline. Using cached data.', 'info');
    });
    
    // Initial offline indicator update
    updateOfflineIndicator();
    
    // Check service worker status
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
            state.serviceWorkerReady = true;
            console.log('[Offline] Service Worker ready');
        });
    }
}

function updateOfflineIndicator() {
    const indicator = document.getElementById('offlineIndicator');
    if (!indicator) {
        // Create indicator if it doesn't exist
        const header = document.querySelector('.header .container');
        if (header) {
            const newIndicator = document.createElement('div');
            newIndicator.id = 'offlineIndicator';
            newIndicator.className = 'offline-indicator';
            newIndicator.innerHTML = state.isConnected 
                ? '<i class="fas fa-wifi"></i> Online' 
                : '<i class="fas fa-wifi-slash"></i> Offline';
            header.appendChild(newIndicator);
        }
        return;
    }
    
    indicator.innerHTML = state.isConnected 
        ? '<i class="fas fa-wifi"></i> Online' 
        : '<i class="fas fa-wifi-slash"></i> Offline';
    indicator.classList.toggle('offline', !state.isConnected);
}

async function initializeOfflineStorage() {
    if (typeof window.OfflineStorage !== 'undefined') {
        try {
            await window.OfflineStorage.init();
            console.log('[Offline] Storage initialized');
        } catch (error) {
            console.error('[Offline] Storage initialization failed:', error);
        }
    }
}

async function loadCachedDataOnStartup() {
    if (typeof window.OfflineStorage === 'undefined') {
        return;
    }
    
    try {
        // Load cached weather data
        const cachedWeather = await window.OfflineStorage.getWeather(CONFIG.DEFAULT_LOCATION);
        if (cachedWeather) {
            state.weatherData = cachedWeather;
            if (typeof displayCurrentWeather === 'function') {
                displayCurrentWeather(cachedWeather);
            }
        }
        
        // Load cached typhoon data
        const cachedTyphoon = await window.OfflineStorage.getTyphoon();
        if (cachedTyphoon) {
            state.typhoonData = cachedTyphoon;
            if (typeof displayTyphoonTracker === 'function') {
                displayTyphoonTracker(cachedTyphoon);
            }
        }
        
        // Load cached forecast data
        const cachedForecast = await window.OfflineStorage.getForecast(CONFIG.DEFAULT_LOCATION);
        if (cachedForecast) {
            state.forecastData = cachedForecast;
            if (typeof displayForecast === 'function') {
                displayForecast(cachedForecast);
            }
        }
        
        // Load cached alerts data
        const cachedAlerts = await window.OfflineStorage.getAlerts();
        if (cachedAlerts && cachedAlerts.length > 0) {
            state.alertsData = cachedAlerts;
            if (typeof displayAlerts === 'function') {
                displayAlerts(cachedAlerts);
            }
        }
        
        showNotification('Loaded cached data (offline mode)', 'info');
    } catch (error) {
        console.error('[Offline] Failed to load cached data:', error);
    }
}

// ===========================
// API Data Loading - Real-time with Offline Support
// ===========================
async function loadWeatherData(location) {
    try {
        setLoadingState('weather', true);
        
        // Try to fetch from API
        let response;
        let result;
        
        try {
            response = await fetch(`${CONFIG.API_ENDPOINT}?action=weather&location=${encodeURIComponent(location)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            result = await response.json();
            
            if (result.success && result.data) {
                const weatherData = {
                    ...result.data,
                    icon: getWeatherIcon(result.data.condition),
                    cloudCover: result.data.cloudCover || Math.floor(Math.random() * 100)
                };
                
                state.weatherData = weatherData;
                state.lastUpdate.weather = new Date(result.timestamp || new Date());
                
                // Save to offline storage
                if (typeof window.OfflineStorage !== 'undefined') {
                    await window.OfflineStorage.saveWeather(location, weatherData);
                }
                
                displayCurrentWeather(weatherData);
                updateLastUpdateTime('weather', state.lastUpdate.weather);
                return;
            } else {
            throw new Error(result.error || 'Failed to load weather data');
            }
        } catch (fetchError) {
            // Network error - try offline storage
            console.warn('[Offline] Network error, trying offline storage:', fetchError);
            
            if (typeof window.OfflineStorage !== 'undefined') {
                const cachedData = await window.OfflineStorage.getWeather(location);
                if (cachedData) {
                    state.weatherData = cachedData;
                    displayCurrentWeather(cachedData);
                    showNotification('Showing cached weather data (offline mode)', 'info');
                    setLoadingState('weather', false);
                    return;
                }
            }
            
            // Fallback to in-memory state
            if (state.weatherData) {
                displayCurrentWeather(state.weatherData);
                showNotification('Showing last known weather data', 'warning');
                setLoadingState('weather', false);
                return;
            }
            
            throw fetchError;
        }
    } catch (error) {
        console.error('Error loading weather data:', error);
        
        // Final fallback to offline storage
        if (typeof window.OfflineStorage !== 'undefined') {
            const cachedData = await window.OfflineStorage.getWeather(location);
            if (cachedData) {
                state.weatherData = cachedData;
                displayCurrentWeather(cachedData);
                showNotification('Using cached weather data', 'info');
                setLoadingState('weather', false);
                return;
            }
        }
        
        showNotification('Failed to load weather data. Please check your connection.', 'error');
        
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
        
        try {
            const response = await fetch(`${CONFIG.API_ENDPOINT}?action=typhoon`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success && result.data) {
                state.typhoonData = result.data;
                state.lastUpdate.typhoon = new Date(result.timestamp || new Date());
                
                // Save to offline storage
                if (typeof window.OfflineStorage !== 'undefined') {
                    await window.OfflineStorage.saveTyphoon(result.data);
                }
                
                displayTyphoonTracker(result.data);
                
                // Update map if available
                if (state.typhoonMap) {
                    updateTyphoonMap(result.data);
                }
                
                if (typeof updateLastUpdateTime === 'function') {
                    updateLastUpdateTime('typhoon', state.lastUpdate.typhoon);
                }
                return;
            } else {
                throw new Error(result.error || 'Failed to load typhoon data');
            }
        } catch (fetchError) {
            // Network error - try offline storage
            console.warn('[Offline] Network error, trying offline storage:', fetchError);
            
            if (typeof window.OfflineStorage !== 'undefined') {
                const cachedData = await window.OfflineStorage.getTyphoon();
                if (cachedData) {
                    state.typhoonData = cachedData;
                    displayTyphoonTracker(cachedData);
                    if (state.typhoonMap) {
                        updateTyphoonMap(cachedData);
                    }
                    showNotification('Showing cached typhoon data (offline mode)', 'info');
                    setLoadingState('typhoon', false);
                    return;
                }
            }
            
            // Fallback to in-memory state
            if (state.typhoonData) {
                displayTyphoonTracker(state.typhoonData);
                showNotification('Showing last known typhoon data', 'warning');
                setLoadingState('typhoon', false);
                return;
            }
            
            throw fetchError;
        }
    } catch (error) {
        console.error('Error loading typhoon data:', error);
        
        // Final fallback to offline storage
        if (typeof window.OfflineStorage !== 'undefined') {
            const cachedData = await window.OfflineStorage.getTyphoon();
            if (cachedData) {
                state.typhoonData = cachedData;
                displayTyphoonTracker(cachedData);
                showNotification('Using cached typhoon data', 'info');
                setLoadingState('typhoon', false);
                return;
            }
        }
        
        showNotification('Failed to load typhoon data. Please check your connection.', 'error');
        
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
        
        try {
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
                
                // Save to offline storage
                if (typeof window.OfflineStorage !== 'undefined') {
                    await window.OfflineStorage.saveForecast(location, forecastData);
                }
                
                displayForecast(forecastData);
                updateLastUpdateTime('forecast', state.lastUpdate.forecast);
                return;
            } else {
                throw new Error(result.error || 'Failed to load forecast data');
            }
        } catch (fetchError) {
            // Network error - try offline storage
            console.warn('[Offline] Network error, trying offline storage:', fetchError);
            
            if (typeof window.OfflineStorage !== 'undefined') {
                const cachedData = await window.OfflineStorage.getForecast(location);
                if (cachedData) {
                    state.forecastData = cachedData;
                    displayForecast(cachedData);
                    showNotification('Showing cached forecast data (offline mode)', 'info');
                    setLoadingState('forecast', false);
                    return;
                }
            }
            
            // Fallback to in-memory state
            if (state.forecastData) {
                displayForecast(state.forecastData);
                showNotification('Showing last known forecast data', 'warning');
                setLoadingState('forecast', false);
                return;
            }
            
            throw fetchError;
        }
    } catch (error) {
        console.error('Error loading forecast data:', error);
        
        // Final fallback to offline storage
        if (typeof window.OfflineStorage !== 'undefined') {
            const cachedData = await window.OfflineStorage.getForecast(location);
            if (cachedData) {
                state.forecastData = cachedData;
                displayForecast(cachedData);
                showNotification('Using cached forecast data', 'info');
                setLoadingState('forecast', false);
                return;
            }
        }
        
        showNotification('Failed to load forecast data. Please check your connection.', 'error');
        
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
        
        try {
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
                
                // Save to offline storage
                if (typeof window.OfflineStorage !== 'undefined') {
                    await window.OfflineStorage.saveAlerts(alertsData);
                }
                
                displayAlerts(alertsData);
                updateLastUpdateTime('alerts', state.lastUpdate.alerts);
                
                // Check for new critical alerts
                checkNewAlerts(alertsData);
                return;
            } else {
                throw new Error(result.error || 'Failed to load alerts data');
            }
        } catch (fetchError) {
            // Network error - try offline storage
            console.warn('[Offline] Network error, trying offline storage:', fetchError);
            
            if (typeof window.OfflineStorage !== 'undefined') {
                const cachedData = await window.OfflineStorage.getAlerts();
                if (cachedData && cachedData.length > 0) {
                    state.alertsData = cachedData;
                    displayAlerts(cachedData);
                    showNotification('Showing cached alerts data (offline mode)', 'info');
                    setLoadingState('alerts', false);
                    return;
                }
            }
            
            // Fallback to in-memory state
            if (state.alertsData) {
                displayAlerts(state.alertsData);
                showNotification('Showing last known alerts data', 'warning');
                setLoadingState('alerts', false);
                return;
            }
            
            throw fetchError;
        }
    } catch (error) {
        console.error('Error loading alerts data:', error);
        
        // Final fallback to offline storage
        if (typeof window.OfflineStorage !== 'undefined') {
            const cachedData = await window.OfflineStorage.getAlerts();
            if (cachedData && cachedData.length > 0) {
                state.alertsData = cachedData;
                displayAlerts(cachedData);
                showNotification('Using cached alerts data', 'info');
                setLoadingState('alerts', false);
                return;
            }
        }
        
        showNotification('Failed to load alerts data. Please check your connection.', 'error');
        
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
    listElement.innerHTML = typhoons.map(typhoon => {
        // Calculate PAGASA Wind Signal for each typhoon
        const windSignal = calculatePAGASAWindSignal(typhoon);
        const signalInfo = getPAGASAWindSignalInfo(windSignal);
        
        return `
        <div class="typhoon-card ${typhoon.status === 'Active' ? 'critical' : ''}" data-lat="${typhoon.latitude || ''}" data-lon="${typhoon.longitude || ''}">
            <div class="typhoon-card-header">
                <div class="typhoon-name"><i class="fas fa-hurricane"></i> ${typhoon.name}</div>
                ${signalInfo ? `
                <span class="pagasa-signal-badge signal-${signalInfo.number}" title="${signalInfo.description}">
                    <i class="fas fa-flag"></i> Signal #${signalInfo.number}
                </span>
                ` : ''}
            </div>
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
            ${signalInfo ? `
            <div class="typhoon-detail">
                <span class="typhoon-label">PAGASA Wind Signal:</span>
                <span class="typhoon-value signal-${signalInfo.number}">${signalInfo.label} - ${signalInfo.description}</span>
            </div>
            ` : ''}
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
        `;
    }).join('');

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