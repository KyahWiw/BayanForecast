<?php
/**
 * BayanForecast Configuration File
 * Store your API keys and configuration settings here
 */

// ===========================
// API Configuration
// ===========================

/**
 * OpenWeatherMap API Key
 * Get your free API key from: https://openweathermap.org/api
 * Free tier includes:
 * - Current weather data
 * - 5-day forecast
 * - Weather alerts (limited)
 */
$OPENWEATHER_API_KEY = 'YOUR_OPENWEATHER_API_KEY_HERE';
$OPENWEATHER_API_ENABLED = true;

/**
 * NOAA Weather API Configuration
 * National Oceanic and Atmospheric Administration
 * No API key required - Free public API
 * Note: Limited to USA coverage, but good for typhoon/tropical cyclone data
 */
$NOAA_API_ENABLED = true;
$NOAA_API_BASE_URL = 'https://api.weather.gov';

/**
 * JMA (Japan Meteorological Agency) API Configuration
 * Best for Asian typhoon tracking and weather in Japan/Philippines region
 * No official public API, but we can use their public data feeds
 */
$JMA_API_ENABLED = true;
$JMA_API_BASE_URL = 'https://www.data.jma.go.jp';

/**
 * Windy API Configuration
 * Get your API key from: https://api.windy.com/point-forecast/docs
 * Provides detailed point forecasts with cloud data, wind patterns, and more
 */
$WINDY_API_KEY = 'YOUR_WINDY_API_KEY_HERE';
$WINDY_API_ENABLED = true;

/**
 * PAGASA API Configuration (if available)
 * Philippine Atmospheric, Geophysical and Astronomical Services Administration
 * Note: PAGASA doesn't have a public API yet, this is for future integration
 */
$PAGASA_API_ENABLED = false;
$PAGASA_API_KEY = '';

// ===========================
// Application Settings
// ===========================

/**
 * Default location settings
 */
define('DEFAULT_LOCATION', 'Manila');
define('DEFAULT_COUNTRY', 'PH');
define('DEFAULT_TIMEZONE', 'Asia/Manila');

/**
 * Update intervals (in seconds)
 */
define('WEATHER_UPDATE_INTERVAL', 600); // 10 minutes
define('TYPHOON_UPDATE_INTERVAL', 300); // 5 minutes

/**
 * Cache settings
 */
define('ENABLE_CACHE', true);
define('CACHE_DURATION', 600); // 10 minutes

/**
 * Database Configuration (optional - for storing historical data)
 */
define('DB_ENABLED', false);
define('DB_HOST', 'localhost');
define('DB_NAME', 'bayanforecast');
define('DB_USER', 'root');
define('DB_PASS', '');

// ===========================
// Feature Flags
// ===========================

/**
 * Enable/disable specific features
 */
define('ENABLE_TYPHOON_TRACKING', true);
define('ENABLE_WEATHER_ALERTS', true);
define('ENABLE_FORECAST', true);
define('ENABLE_HISTORICAL_DATA', false);

// ===========================
// Alert Thresholds
// ===========================

/**
 * Weather alert thresholds for automatic warnings
 */
define('HIGH_WIND_THRESHOLD', 50); // km/h
define('HEAVY_RAIN_THRESHOLD', 50); // mm/hour
define('HIGH_TEMP_THRESHOLD', 35); // °C
define('LOW_TEMP_THRESHOLD', 15); // °C

// ===========================
// Supported Locations
// ===========================

/**
 * List of major Philippine cities/provinces
 */
$SUPPORTED_LOCATIONS = [
    'Manila',
    'Quezon City',
    'Cebu',
    'Davao',
    'Cagayan de Oro',
    'Baguio',
    'Iloilo',
    'Bacolod',
    'Zamboanga',
    'Tagaytay',
    'Puerto Princesa',
    'Tacloban',
    'Legazpi',
    'Naga',
    'General Santos',
    'Batangas',
    'Olongapo',
    'Angeles',
    'Lipa',
    'Tarlac'
];

// ===========================
// API Rate Limiting
// ===========================

/**
 * Rate limiting to prevent API abuse
 */
define('RATE_LIMIT_ENABLED', true);
define('MAX_REQUESTS_PER_MINUTE', 60);
define('MAX_REQUESTS_PER_HOUR', 1000);

// ===========================
// Logging Configuration
// ===========================

/**
 * Error logging settings
 */
define('LOG_ERRORS', true);
define('LOG_FILE', __DIR__ . '/logs/error.log');
define('LOG_LEVEL', 'ERROR'); // ERROR, WARNING, INFO, DEBUG

// ===========================
// Security Settings
// ===========================

/**
 * CORS settings
 */
$ALLOWED_ORIGINS = [
    'http://localhost',
    'http://127.0.0.1',
    'https://bayanforecast.ph' // Add your production domain
];

/**
 * API Access Control
 */
define('REQUIRE_API_AUTH', false);
define('API_SECRET_KEY', 'your-secret-key-here');

// ===========================
// Third-party Services (Optional)
// ===========================

/**
 * Additional weather data sources
 */
$WEATHERSTACK_API_KEY = '';
$WEATHERBIT_API_KEY = '';

/**
 * Notification services (for alerts)
 */
$TWILIO_ACCOUNT_SID = '';
$TWILIO_AUTH_TOKEN = '';
$SENDGRID_API_KEY = '';

// ===========================
// Helper Functions
// ===========================

/**
 * Check if API key is configured
 */
function isAPIKeyConfigured() {
    global $OPENWEATHER_API_KEY;
    return !empty($OPENWEATHER_API_KEY) && $OPENWEATHER_API_KEY !== 'YOUR_OPENWEATHER_API_KEY_HERE';
}

/**
 * Get database connection (if enabled)
 */
function getDBConnection() {
    if (!DB_ENABLED) {
        return null;
    }
    
    try {
        $conn = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME,
            DB_USER,
            DB_PASS
        );
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $conn;
    } catch (PDOException $e) {
        error_log("Database connection failed: " . $e->getMessage());
        return null;
    }
}

/**
 * Create logs directory if it doesn't exist
 */
if (LOG_ERRORS && !file_exists(__DIR__ . '/logs')) {
    mkdir(__DIR__ . '/logs', 0755, true);
}

// ===========================
// Validation
// ===========================

/**
 * Warn if API key is not configured
 */
if (!isAPIKeyConfigured()) {
    error_log("WARNING: OpenWeatherMap API key is not configured. Please update config.php with your API key.");
}

?>
