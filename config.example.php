<?php
/**
 * BayanForecast Configuration Template
 * Copy this file to config.php and update with your actual values
 */

// ===========================
// API Configuration
// ===========================

/**
 * OpenWeatherMap API Key
 * Get your free API key from: https://openweathermap.org/api
 */
$OPENWEATHER_API_KEY = 'YOUR_OPENWEATHER_API_KEY_HERE';
$OPENWEATHER_API_ENABLED = true;

/**
 * Windy API Configuration
 * Get your API key from: https://api.windy.com/point-forecast/docs
 * Provides detailed point forecasts with cloud data, wind patterns, and more
 * Sign up at: https://api.windy.com/point-forecast/docs
 */
$WINDY_API_KEY = 'YOUR_WINDY_API_KEY_HERE';
$WINDY_API_ENABLED = true;

/**
 * PAGASA API Configuration (future use)
 */
$PAGASA_API_ENABLED = false;
$PAGASA_API_KEY = '';

// ===========================
// Application Settings
// ===========================

define('DEFAULT_LOCATION', 'Manila');
define('DEFAULT_COUNTRY', 'PH');
define('DEFAULT_TIMEZONE', 'Asia/Manila');

define('WEATHER_UPDATE_INTERVAL', 600); // 10 minutes
define('TYPHOON_UPDATE_INTERVAL', 300); // 5 minutes

define('ENABLE_CACHE', true);
define('CACHE_DURATION', 600);

// ===========================
// Database Configuration (Optional)
// ===========================

define('DB_ENABLED', false);
define('DB_HOST', 'localhost');
define('DB_NAME', 'bayanforecast');
define('DB_USER', 'root');
define('DB_PASS', '');

// ===========================
// Feature Flags
// ===========================

define('ENABLE_TYPHOON_TRACKING', true);
define('ENABLE_WEATHER_ALERTS', true);
define('ENABLE_FORECAST', true);
define('ENABLE_HISTORICAL_DATA', false);

// ===========================
// Alert Thresholds
// ===========================

define('HIGH_WIND_THRESHOLD', 50); // km/h
define('HEAVY_RAIN_THRESHOLD', 50); // mm/hour
define('HIGH_TEMP_THRESHOLD', 35); // °C
define('LOW_TEMP_THRESHOLD', 15); // °C

// ===========================
// Security Settings
// ===========================

$ALLOWED_ORIGINS = [
    'http://localhost',
    'http://127.0.0.1',
    'https://yourdomain.com'
];

define('REQUIRE_API_AUTH', false);
define('API_SECRET_KEY', 'your-secret-key-here');

// ===========================
// Logging Configuration
// ===========================

define('LOG_ERRORS', true);
define('LOG_FILE', __DIR__ . '/logs/error.log');
define('LOG_LEVEL', 'ERROR');

?>
