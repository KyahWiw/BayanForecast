<?php
/**
 * BayanForecast Configuration File
 * Loads environment variables from .env file
 * Store your API keys in .env file (copy from .env.example)
 */

// ===========================
// Load Environment Variables
// ===========================
function loadEnv($path) {
    if (!file_exists($path)) {
        return false;
    }
    
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Skip comments
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        
        // Parse key=value pairs
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            
            // Remove quotes if present (both single and double)
            $value = trim($value);
            if ((substr($value, 0, 1) === '"' && substr($value, -1) === '"') ||
                (substr($value, 0, 1) === "'" && substr($value, -1) === "'")) {
                $value = substr($value, 1, -1);
            }
            $value = trim($value);
            
            // (debug logging removed to avoid exposing API key fragments)
            
            // Set environment variable if not already set
            if (!array_key_exists($key, $_ENV) && !array_key_exists($key, $_SERVER)) {
                $_ENV[$key] = $value;
                $_SERVER[$key] = $value;
                putenv("$key=$value");
            }
        }
    }
    return true;
}

// Load .env file from project root
$envPath = __DIR__ . '/.env';
if (file_exists($envPath)) {
    loadEnv($envPath);
} else {
    // Fallback: try to load from parent directory
    $envPath = dirname(__DIR__) . '/.env';
    if (file_exists($envPath)) {
        loadEnv($envPath);
    }
}

// Helper function to get env variable with default
function getEnvVar($key, $default = null) {
    $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);
    return $value !== false ? $value : $default;
}

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
 *
 * Note: Accept legacy alias OPENWEATHERMAP_API_KEY from .env for compatibility.
 */
// Try primary key name first; fallback to legacy alias if present
$OPENWEATHER_API_KEY = getEnvVar('OPENWEATHER_API_KEY', getEnvVar('OPENWEATHERMAP_API_KEY', 'YOUR_OPENWEATHER_API_KEY_HERE'));
$OPENWEATHER_API_ENABLED = getEnvVar('OPENWEATHER_API_ENABLED', 'true') === 'true';

/**
 * NOAA Weather API Configuration
 * National Oceanic and Atmospheric Administration
 * No API key required - Free public API
 * Note: Limited to USA coverage, but good for typhoon/tropical cyclone data
 */
$NOAA_API_ENABLED = getEnvVar('NOAA_API_ENABLED', 'true') === 'true';
$NOAA_API_BASE_URL = getEnvVar('NOAA_API_BASE_URL', 'https://api.weather.gov');

/**
 * JMA (Japan Meteorological Agency) API Configuration
 * Best for Asian typhoon tracking and weather in Japan/Philippines region
 * No official public API, but we can use their public data feeds
 */
$JMA_API_ENABLED = getEnvVar('JMA_API_ENABLED', 'true') === 'true';
$JMA_API_BASE_URL = getEnvVar('JMA_API_BASE_URL', 'https://www.data.jma.go.jp');

/**
 * Open-Meteo API Configuration
 * Free weather forecast API - No API key required
 * Documentation: https://open-meteo.com/en/docs
 * Features: Up to 16 days forecast, multiple weather models, hourly/daily data
 */
$OPENMETEO_API_ENABLED = getEnvVar('OPENMETEO_API_ENABLED', 'true') === 'true';

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
define('DEFAULT_LOCATION', getEnvVar('DEFAULT_LOCATION', 'Manila'));
define('DEFAULT_COUNTRY', getEnvVar('DEFAULT_COUNTRY', 'PH'));
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
