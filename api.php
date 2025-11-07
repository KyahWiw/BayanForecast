<?php
/**
 * BayanForecast API
 * Backend API for weather monitoring and typhoon tracking
 * Integrates with OpenWeatherMap, NOAA, and JMA APIs
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Load configuration
require_once 'config.php';

// Load API classes
require_once 'api/OpenWeatherMapAPI.php';
if ($WINDY_API_ENABLED && !empty($WINDY_API_KEY) && $WINDY_API_KEY !== 'YOUR_WINDY_API_KEY_HERE') {
    require_once 'api/WindyAPI.php';
}
if ($NOAA_API_ENABLED) {
    require_once 'api/NOAAWeatherAPI.php';
}
if ($JMA_API_ENABLED) {
    require_once 'api/JMAWeatherAPI.php';
}

// Get request parameters
$request = isset($_GET['action']) ? $_GET['action'] : 'weather';
$location = isset($_GET['location']) ? $_GET['location'] : DEFAULT_LOCATION;

// ===========================
// Response Handler
// ===========================
try {
    switch ($request) {
        case 'weather':
            getWeatherData($location);
            break;
        case 'typhoon':
            getTyphoonData();
            break;
        case 'forecast':
            getForecastData($location);
            break;
        case 'alerts':
            getAlertsData($location);
            break;
        default:
            sendError('Invalid request');
    }
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    sendError($e->getMessage());
}

// ===========================
// Weather Data Function
// ===========================
function getWeatherData($location) {
    global $OPENWEATHER_API_KEY, $OPENWEATHER_API_ENABLED;
    global $WINDY_API_KEY, $WINDY_API_ENABLED;
    
    // Try Windy API first (better cloud data and detailed forecasts)
    if ($WINDY_API_ENABLED && !empty($WINDY_API_KEY) && $WINDY_API_KEY !== 'YOUR_WINDY_API_KEY_HERE') {
        try {
            $coords = parseLocation($location);
            if ($coords) {
                $windyApi = new WindyAPI($WINDY_API_KEY);
                $weatherData = $windyApi->getCurrentWeather($coords['lat'], $coords['lon']);
                sendResponse($weatherData);
                return;
            }
        } catch (Exception $e) {
            error_log("Windy API Error: " . $e->getMessage());
            // Fall through to OpenWeatherMap
        }
    }
    
    // Try OpenWeatherMap API as fallback
    if ($OPENWEATHER_API_ENABLED && !empty($OPENWEATHER_API_KEY) && $OPENWEATHER_API_KEY !== 'YOUR_OPENWEATHER_API_KEY_HERE') {
        try {
            $api = new OpenWeatherMapAPI($OPENWEATHER_API_KEY);
            $weatherData = $api->getCurrentWeather($location);
            sendResponse($weatherData);
            return;
        } catch (Exception $e) {
            error_log("OpenWeatherMap API Error: " . $e->getMessage());
            // Fall through to mock data
        }
    }
    
    // Fallback to mock data if APIs are not configured or fail
    $weatherData = generateMockWeatherData($location);
    sendResponse($weatherData);
}

// ===========================
// Typhoon Data Function
// Real-time tracking only - no mock/sample data
// ===========================
function getTyphoonData() {
    global $OPENWEATHER_API_KEY, $OPENWEATHER_API_ENABLED, $JMA_API_ENABLED, $NOAA_API_ENABLED;
    
    $typhoons = [];
    
    // Primary: Use OpenWeatherMap API for typhoon tracking
    if ($OPENWEATHER_API_ENABLED && !empty($OPENWEATHER_API_KEY) && $OPENWEATHER_API_KEY !== 'YOUR_OPENWEATHER_API_KEY_HERE') {
        try {
            $owmApi = new OpenWeatherMapAPI($OPENWEATHER_API_KEY);
            $owmTyphoons = $owmApi->getTyphoons('PH');
            if (!empty($owmTyphoons)) {
                $typhoons = array_merge($typhoons, $owmTyphoons);
            }
        } catch (Exception $e) {
            error_log("OpenWeatherMap Typhoon API Error: " . $e->getMessage());
        }
    }
    
    // Fallback: Try JMA API for Asian typhoons (Best for Philippines region)
    if (empty($typhoons) && $JMA_API_ENABLED) {
        try {
            $jmaApi = new JMAWeatherAPI();
            $jmaTyphoons = $jmaApi->getTyphoons();
            if (!empty($jmaTyphoons)) {
                $typhoons = array_merge($typhoons, $jmaTyphoons);
            }
        } catch (Exception $e) {
            error_log("JMA API Error: " . $e->getMessage());
        }
    }
    
    // Fallback: Try NOAA API for tropical cyclones
    if (empty($typhoons) && $NOAA_API_ENABLED) {
        try {
            $noaaApi = new NOAAWeatherAPI();
            $noaaCyclones = $noaaApi->getTropicalCyclones();
            if (!empty($noaaCyclones)) {
                $typhoons = array_merge($typhoons, $noaaCyclones);
            }
        } catch (Exception $e) {
            error_log("NOAA API Error: " . $e->getMessage());
        }
    }
    
    // Return real-time data only
    // Empty array = no active typhoons (this is correct behavior)
    sendResponse($typhoons);
}

// ===========================
// Forecast Data Function
// ===========================
function getForecastData($location) {
    global $OPENWEATHER_API_KEY, $OPENWEATHER_API_ENABLED;
    global $WINDY_API_KEY, $WINDY_API_ENABLED;
    
    // Try Windy API first (more detailed forecasts)
    if ($WINDY_API_ENABLED && !empty($WINDY_API_KEY) && $WINDY_API_KEY !== 'YOUR_WINDY_API_KEY_HERE') {
        try {
            $coords = parseLocation($location);
            if ($coords) {
                $windyApi = new WindyAPI($WINDY_API_KEY);
                $forecastData = $windyApi->getForecast($coords['lat'], $coords['lon']);
                sendResponse($forecastData);
                return;
            }
        } catch (Exception $e) {
            error_log("Windy Forecast API Error: " . $e->getMessage());
            // Fall through to OpenWeatherMap
        }
    }
    
    // Try OpenWeatherMap API as fallback
    if ($OPENWEATHER_API_ENABLED && !empty($OPENWEATHER_API_KEY) && $OPENWEATHER_API_KEY !== 'YOUR_OPENWEATHER_API_KEY_HERE') {
        try {
            $api = new OpenWeatherMapAPI($OPENWEATHER_API_KEY);
            $forecastData = $api->getForecast($location);
            sendResponse($forecastData);
            return;
        } catch (Exception $e) {
            error_log("OpenWeatherMap Forecast Error: " . $e->getMessage());
            // Fall through to mock data
        }
    }
    
    // Fallback to mock data
    $forecastData = generateMockForecastData($location);
    sendResponse($forecastData);
}

// ===========================
// Alerts Data Function
// ===========================
function getAlertsData($location) {
    global $OPENWEATHER_API_KEY, $OPENWEATHER_API_ENABLED, $NOAA_API_ENABLED;
    
    $alerts = [];
    
    // Try OpenWeatherMap API first
    if ($OPENWEATHER_API_ENABLED && !empty($OPENWEATHER_API_KEY) && $OPENWEATHER_API_KEY !== 'YOUR_OPENWEATHER_API_KEY_HERE') {
        try {
            $api = new OpenWeatherMapAPI($OPENWEATHER_API_KEY);
            $owmAlerts = $api->getAlerts($location);
            if (!empty($owmAlerts)) {
                $alerts = array_merge($alerts, $owmAlerts);
            }
        } catch (Exception $e) {
            error_log("OpenWeatherMap Alerts Error: " . $e->getMessage());
        }
    }
    
    // Try NOAA API for additional alerts
    if ($NOAA_API_ENABLED) {
        try {
            $noaaApi = new NOAAWeatherAPI();
            // Get coordinates for location (simplified - would need geocoding)
            $noaaAlerts = $noaaApi->getAlerts();
            if (!empty($noaaAlerts)) {
                $alerts = array_merge($alerts, $noaaAlerts);
            }
        } catch (Exception $e) {
            error_log("NOAA Alerts Error: " . $e->getMessage());
        }
    }
    
    // If no real alerts, use mock data
    if (empty($alerts)) {
        $alerts = generateMockAlertsData();
    }
    
    sendResponse($alerts);
}

// ===========================
// Mock Data Generators (Fallback)
// ===========================
function generateMockWeatherData($location) {
    $weatherConditions = [
        ['temp' => 32, 'condition' => 'Sunny', 'humidity' => 65, 'windSpeed' => 15],
        ['temp' => 28, 'condition' => 'Cloudy', 'humidity' => 75, 'windSpeed' => 20],
        ['temp' => 25, 'condition' => 'Rainy', 'humidity' => 85, 'windSpeed' => 25],
        ['temp' => 30, 'condition' => 'Partly Cloudy', 'humidity' => 70, 'windSpeed' => 18]
    ];
    
    $random = $weatherConditions[array_rand($weatherConditions)];
    
    return [
        'location' => $location,
        'country' => 'Philippines',
        'temperature' => $random['temp'],
        'condition' => $random['condition'],
        'humidity' => $random['humidity'],
        'windSpeed' => $random['windSpeed'],
        'pressure' => 1013,
        'visibility' => 10,
        'feelsLike' => $random['temp'] - 2,
        'uvIndex' => 7,
        'cloudCover' => rand(0, 100),
        'lastUpdated' => date('Y-m-d H:i:s')
    ];
}

function generateMockTyphoonData() {
    // DEPRECATED: This function is no longer used
    // Typhoon tracker now uses real-time data only
    // Return empty array - no mock/sample typhoons
    return [];
}

function generateMockForecastData() {
    $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    $conditions = ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy', 'Stormy'];
    
    $forecast = [];
    for ($i = 0; $i < 7; $i++) {
        $forecast[] = [
            'day' => $days[$i],
            'date' => date('Y-m-d', strtotime("+$i days")),
            'condition' => $conditions[array_rand($conditions)],
            'tempHigh' => rand(28, 35),
            'tempLow' => rand(22, 28),
            'humidity' => rand(60, 85),
            'windSpeed' => rand(10, 30),
            'chanceOfRain' => rand(10, 80),
            'uvIndex' => rand(5, 10)
        ];
    }
    
    return $forecast;
}

function generateMockAlertsData() {
    // Return empty array for no alerts by default
    // Mock alerts only for testing
    return [];
}

// ===========================
// Helper Functions
// ===========================
function sendResponse($data) {
    echo json_encode([
        'success' => true,
        'data' => $data,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
    exit;
}

function sendError($message) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $message,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
    exit;
}

// ===========================
// Helper Functions
// ===========================
function parseLocation($location) {
    // Check if location is coordinates (lat,lon format)
    if (preg_match('/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/', $location, $matches)) {
        return [
            'lat' => (float)$matches[1],
            'lon' => (float)$matches[2]
        ];
    }
    
    // Try to get coordinates from OpenWeatherMap geocoding
    global $OPENWEATHER_API_KEY, $OPENWEATHER_API_ENABLED;
    if ($OPENWEATHER_API_ENABLED && !empty($OPENWEATHER_API_KEY) && $OPENWEATHER_API_KEY !== 'YOUR_OPENWEATHER_API_KEY_HERE') {
        try {
            $api = new OpenWeatherMapAPI($OPENWEATHER_API_KEY);
            $coords = $api->getCoordinates($location);
            if ($coords) {
                return [
                    'lat' => $coords['lat'],
                    'lon' => $coords['lon']
                ];
            }
        } catch (Exception $e) {
            error_log("Geocoding Error: " . $e->getMessage());
        }
    }
    
    return null;
}
?>
