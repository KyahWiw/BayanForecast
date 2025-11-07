# 🌐 Weather API Integration Guide

## Supported Weather APIs

This guide covers integrating three major weather data sources:
1. **NOAA Weather API** (National Oceanic and Atmospheric Administration - USA)
2. **JMA** (Japan Meteorological Agency)
3. **OpenWeatherMap API** (Global Coverage)

---

## 1. NOAA Weather API

### Overview
- **Coverage**: USA (all 50 states + territories)
- **Cost**: FREE
- **Authentication**: No API key required
- **Best For**: US-based weather data, precise forecasts, tropical cyclone tracking

### API Documentation
- **Main Site**: https://www.weather.gov/documentation/services-web-api
- **Data Available**:
  - Current conditions
  - 7-day forecast
  - Tropical cyclone tracking
  - Alerts and warnings
  - Grid data

### Getting Started

#### Step 1: Find Grid Point
```bash
# Get grid point for a location (latitude, longitude)
https://api.weather.gov/points/{latitude},{longitude}
```

#### Step 2: Get Forecast Data
```bash
# After getting grid point, use the URLs provided:
https://api.weather.gov/gridpoints/{office}/{gridX},{gridY}/forecast
https://api.weather.gov/gridpoints/{office}/{gridX},{gridY}/forecast/hourly
```

### Example Implementation

Create `noaa-weather-api.php`:

```php
<?php
class NOAAWeatherAPI {
    private $baseUrl = 'https://api.weather.gov';
    private $userAgent = 'BayanForecast (weather.forecast.app@example.com)';
    
    /**
     * Get weather data for coordinates
     */
    public function getWeather($latitude, $longitude) {
        try {
            // Step 1: Get grid point
            $pointsUrl = "{$this->baseUrl}/points/{$latitude},{$longitude}";
            $pointsData = $this->makeRequest($pointsUrl);
            
            if (empty($pointsData->properties->forecast)) {
                throw new Exception('Grid point not found');
            }
            
            // Step 2: Get forecast
            $forecastUrl = $pointsData->properties->forecast;
            $weatherData = $this->makeRequest($forecastUrl);
            
            return $this->formatWeatherResponse($weatherData);
            
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Get alerts for location
     */
    public function getAlerts($latitude, $longitude) {
        try {
            $alertsUrl = "{$this->baseUrl}/alerts/active?point={$latitude},{$longitude}";
            $data = $this->makeRequest($alertsUrl);
            return $this->formatAlertsResponse($data);
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Make HTTP request
     */
    private function makeRequest($url) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_HTTPHEADER => [
                'User-Agent: ' . $this->userAgent
            ]
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            throw new Exception("HTTP Error: $httpCode");
        }
        
        return json_decode($response);
    }
    
    /**
     * Format weather response
     */
    private function formatWeatherResponse($data) {
        $current = $data->properties->periods[0] ?? null;
        
        return [
            'success' => true,
            'location' => 'USA',
            'current' => [
                'temperature' => $current->temperature ?? null,
                'unit' => $current->temperatureUnit ?? 'F',
                'condition' => $current->shortForecast ?? '',
                'windSpeed' => $current->windSpeed ?? '',
                'windDirection' => $current->windDirection ?? '',
                'icon' => $current->icon ?? ''
            ],
            'forecast' => array_map(function($period) {
                return [
                    'date' => $period->startTime ?? '',
                    'temperature' => $period->temperature ?? null,
                    'condition' => $period->shortForecast ?? '',
                    'windSpeed' => $period->windSpeed ?? '',
                    'icon' => $period->icon ?? ''
                ];
            }, array_slice($data->properties->periods, 0, 7))
        ];
    }
    
    /**
     * Format alerts response
     */
    private function formatAlertsResponse($data) {
        return [
            'success' => true,
            'alerts' => array_map(function($feature) {
                $props = $feature->properties;
                return [
                    'event' => $props->event ?? '',
                    'headline' => $props->headline ?? '',
                    'description' => $props->description ?? '',
                    'severity' => $props->severity ?? '',
                    'effective' => $props->effective ?? '',
                    'expires' => $props->expires ?? ''
                ];
            }, $data->features ?? [])
        ];
    }
}
?>
```

### Usage in BayanForecast

Update `api.php`:

```php
// Add NOAA integration
if ($action === 'weather' && $source === 'noaa') {
    require_once 'noaa-weather-api.php';
    $api = new NOAAWeatherAPI();
    $data = $api->getWeather($_GET['lat'] ?? 0, $_GET['lon'] ?? 0);
    sendResponse($data);
}
```

### Testing NOAA API

```bash
# Test with Manila coordinates (14.5995, 120.9842)
curl "https://api.weather.gov/points/14.5995,120.9842"

# Note: NOAA only covers USA and nearby areas
# For Philippines, use OpenWeatherMap or JMA instead
```

---

## 2. JMA - Japan Meteorological Agency

### Overview
- **Coverage**: Japan, Western Pacific, East Asia
- **Cost**: FREE
- **Authentication**: No API key required (for basic access)
- **Best For**: Asian typhoon tracking, seasonal forecasts

### API Documentation
- **Main Site**: https://www.jma.go.jp/jma/en/
- **API Docs**: https://www.jma.go.jp/jma/en/Activities/structure.html
- **Data Available**:
  - Typhoon tracking
  - Regional forecasts
  - Weather information
  - Satellite data

### Getting Started

#### Step 1: Access JMA Data
```
Main portal: https://www.jma.go.jp/jma/indexe.html
Typhoon info: https://www.jma.go.jp/en/typh/
```

#### Step 2: Available Data Sources
```
XML/RSS Feeds Available:
- Typhoon Forecast: https://www.jma.go.jp/en/typh/typh.html
- Weather Forecast: https://www.jma.go.jp/en/week/
- Satellite Data: https://www.jma.go.jp/en/gms/
```

### Example Implementation

Create `jma-weather-api.php`:

```php
<?php
class JMAWeatherAPI {
    private $baseUrl = 'https://www.jma.go.jp';
    
    /**
     * Get current typhoons
     */
    public function getTyphoons() {
        try {
            // JMA provides typhoon data in XML format
            $xmlUrl = "{$this->baseUrl}/en/typh/";
            $typhoons = $this->parseTyphoonXML($xmlUrl);
            
            return [
                'success' => true,
                'source' => 'JMA',
                'typhoons' => $typhoons,
                'updated' => date('Y-m-d H:i:s')
            ];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Parse typhoon XML data
     */
    private function parseTyphoonXML($xmlUrl) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $xmlUrl,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10
        ]);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        // Parse XML and extract typhoon data
        $xml = simplexml_load_string($response);
        $typhoons = [];
        
        // Extract typhoon information from XML
        // Structure varies based on JMA XML format
        
        return $typhoons;
    }
    
    /**
     * Get weather forecast for location
     */
    public function getForecast($latitude, $longitude) {
        try {
            // JMA forecast API
            $forecastUrl = "{$this->baseUrl}/bosai/forecast/jax/jax_weather.php";
            
            $data = [
                'latitude' => $latitude,
                'longitude' => $longitude
            ];
            
            $result = $this->makeRequest($forecastUrl, $data);
            return $this->formatForecast($result);
            
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Make HTTP request
     */
    private function makeRequest($url, $params = []) {
        $ch = curl_init();
        $queryString = http_build_query($params);
        
        curl_setopt_array($ch, [
            CURLOPT_URL => $url . '?' . $queryString,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10
        ]);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return json_decode($response, true);
    }
    
    /**
     * Format forecast response
     */
    private function formatForecast($data) {
        return [
            'success' => true,
            'source' => 'JMA',
            'forecast' => $data,
            'location' => 'East Asia Region'
        ];
    }
}
?>
```

### Usage in BayanForecast

```php
// Add JMA integration
if ($action === 'typhoon' && $source === 'jma') {
    require_once 'jma-weather-api.php';
    $api = new JMAWeatherAPI();
    $data = $api->getTyphoons();
    sendResponse($data);
}
```

### Testing JMA Data

```bash
# Visit JMA Typhoon page
https://www.jma.go.jp/en/typh/

# Check for active typhoons and current status
# Data is updated regularly during typhoon season
```

---

## 3. OpenWeatherMap API

### Overview
- **Coverage**: Global (195 countries)
- **Cost**: FREE tier available (limited calls/day)
- **Authentication**: API key required (free registration)
- **Best For**: Global weather, Philippines coverage, easy integration
- **Perfect For**: BayanForecast primary weather source

### Getting API Key

#### Step 1: Register Account
1. Visit: https://openweathermap.org/users/register
2. Create free account
3. Check email verification

#### Step 2: Get API Key
1. Login to your account
2. Go to "API keys" tab
3. Copy your default API key
4. Keep it secret (don't commit to public repos)

### API Documentation
- **Main Docs**: https://openweathermap.org/api
- **Weather API**: https://openweathermap.org/api/weather-api
- **One Call API**: https://openweathermap.org/api/one-call-3 (Recommended)
- **Geocoding**: https://openweathermap.org/api/geocoding-api

### Available Endpoints

```
1. Current Weather
   https://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}

2. One Call API (RECOMMENDED - single call for all data)
   https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&appid={API_KEY}

3. Forecast (5-day)
   https://api.openweathermap.org/data/2.5/forecast?q={city}&appid={API_KEY}

4. Geocoding (get lat/lon from city name)
   https://api.openweathermap.org/geo/1.0/direct?q={city}&limit=1&appid={API_KEY}
```

### Example Implementation

Create `openweathermap-api.php`:

```php
<?php
class OpenWeatherMapAPI {
    private $apiKey;
    private $baseUrl = 'https://api.openweathermap.org';
    
    public function __construct($apiKey) {
        $this->apiKey = $apiKey;
    }
    
    /**
     * Get complete weather data using One Call API
     */
    public function getCompleteWeather($latitude, $longitude) {
        try {
            $url = "{$this->baseUrl}/data/3.0/onecall";
            
            $params = [
                'lat' => $latitude,
                'lon' => $longitude,
                'appid' => $this->apiKey,
                'units' => 'metric',
                'lang' => 'en',
                'exclude' => 'minutely'
            ];
            
            $response = $this->makeRequest($url, $params);
            
            return [
                'success' => true,
                'source' => 'OpenWeatherMap',
                'current' => $this->formatCurrent($response['current'] ?? []),
                'hourly' => $this->formatHourly(array_slice($response['hourly'] ?? [], 0, 24)),
                'daily' => $this->formatDaily($response['daily'] ?? []),
                'alerts' => $response['alerts'] ?? [],
                'timezone' => $response['timezone'] ?? 'UTC'
            ];
            
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Get current weather
     */
    public function getCurrentWeather($city) {
        try {
            // First get coordinates
            $coords = $this->getCoordinates($city);
            
            if (!$coords) {
                throw new Exception('City not found');
            }
            
            return $this->getCompleteWeather($coords['lat'], $coords['lon']);
            
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Get coordinates from city name
     */
    public function getCoordinates($city) {
        try {
            $url = "{$this->baseUrl}/geo/1.0/direct";
            
            $params = [
                'q' => $city,
                'limit' => 1,
                'appid' => $this->apiKey
            ];
            
            $response = $this->makeRequest($url, $params);
            
            if (empty($response)) {
                return null;
            }
            
            return [
                'lat' => $response[0]['lat'] ?? null,
                'lon' => $response[0]['lon'] ?? null,
                'name' => $response[0]['name'] ?? '',
                'country' => $response[0]['country'] ?? ''
            ];
            
        } catch (Exception $e) {
            return null;
        }
    }
    
    /**
     * Format current weather data
     */
    private function formatCurrent($data) {
        return [
            'temperature' => round($data['temp'] ?? 0),
            'feelsLike' => round($data['feels_like'] ?? 0),
            'condition' => $data['weather'][0]['main'] ?? '',
            'description' => $data['weather'][0]['description'] ?? '',
            'humidity' => $data['humidity'] ?? 0,
            'pressure' => $data['pressure'] ?? 0,
            'visibility' => ($data['visibility'] ?? 0) / 1000, // Convert to km
            'windSpeed' => $data['wind_speed'] ?? 0,
            'windDirection' => $data['wind_deg'] ?? 0,
            'cloudCover' => $data['clouds'] ?? 0,
            'uvIndex' => round($data['uvi'] ?? 0, 1),
            'sunrise' => date('H:i', $data['sunrise'] ?? 0),
            'sunset' => date('H:i', $data['sunset'] ?? 0),
            'icon' => $data['weather'][0]['icon'] ?? '01d'
        ];
    }
    
    /**
     * Format hourly forecast
     */
    private function formatHourly($data) {
        return array_map(function($hour) {
            return [
                'time' => date('H:i', $hour['dt'] ?? 0),
                'temperature' => round($hour['temp'] ?? 0),
                'condition' => $hour['weather'][0]['main'] ?? '',
                'humidity' => $hour['humidity'] ?? 0,
                'precipitation' => $hour['pop'] ?? 0,
                'windSpeed' => $hour['wind_speed'] ?? 0,
                'icon' => $hour['weather'][0]['icon'] ?? '01d'
            ];
        }, $data);
    }
    
    /**
     * Format daily forecast
     */
    private function formatDaily($data) {
        return array_map(function($day) {
            return [
                'date' => date('Y-m-d', $day['dt'] ?? 0),
                'tempMax' => round($day['temp']['max'] ?? 0),
                'tempMin' => round($day['temp']['min'] ?? 0),
                'condition' => $day['weather'][0]['main'] ?? '',
                'description' => $day['weather'][0]['description'] ?? '',
                'humidity' => $day['humidity'] ?? 0,
                'windSpeed' => $day['wind_speed'] ?? 0,
                'precipitation' => $day['pop'] ?? 0,
                'rain' => $day['rain'] ?? 0,
                'uv' => round($day['uvi'] ?? 0, 1),
                'sunrise' => date('H:i', $day['sunrise'] ?? 0),
                'sunset' => date('H:i', $day['sunset'] ?? 0),
                'icon' => $day['weather'][0]['icon'] ?? '01d'
            ];
        }, array_slice($data, 0, 7)); // 7-day forecast
    }
    
    /**
     * Make HTTP request
     */
    private function makeRequest($url, $params = []) {
        $ch = curl_init();
        $queryString = http_build_query($params);
        
        curl_setopt_array($ch, [
            CURLOPT_URL => $url . '?' . $queryString,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json'
            ]
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            throw new Exception("HTTP Error: $httpCode");
        }
        
        return json_decode($response, true);
    }
}
?>
```

### Integration into api.php

Update your `api.php`:

```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Load configuration
require_once 'config.php';

// Get API key from config
$owmApiKey = getConfig('openweathermap_api_key');

$action = $_GET['action'] ?? 'weather';
$source = $_GET['source'] ?? 'openweathermap';

try {
    if ($action === 'weather') {
        require_once 'openweathermap-api.php';
        $api = new OpenWeatherMapAPI($owmApiKey);
        
        $location = $_GET['location'] ?? 'Manila';
        $data = $api->getCurrentWeather($location);
        
        sendResponse($data);
    }
    
} catch (Exception $e) {
    sendError($e->getMessage());
}

function sendResponse($data) {
    echo json_encode([
        'success' => true,
        'data' => $data,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

function sendError($message) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $message,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
```

### Update config.php

Add API keys to `config.php`:

```php
<?php
// API Keys - NEVER commit this file with real keys!
define('OPENWEATHERMAP_API_KEY', 'YOUR_API_KEY_HERE');
define('NOAA_API_ENABLED', true);
define('JMA_API_ENABLED', true);

function getConfig($key) {
    $configMap = [
        'openweathermap_api_key' => OPENWEATHERMAP_API_KEY,
    ];
    
    return $configMap[$key] ?? null;
}
?>
```

### Testing OpenWeatherMap API

```bash
# Get coordinates
curl "https://api.openweathermap.org/geo/1.0/direct?q=Manila&limit=1&appid=YOUR_API_KEY"

# Get weather
curl "https://api.openweathermap.org/data/3.0/onecall?lat=14.5995&lon=120.9842&appid=YOUR_API_KEY"

# Replace YOUR_API_KEY with your actual key
```

---

## Integration Comparison

| Feature | NOAA | JMA | OpenWeatherMap |
|---------|------|-----|-----------------|
| **Coverage** | USA only | East Asia | Global |
| **API Key** | No | No | Yes |
| **Cost** | Free | Free | Free (limited) |
| **Typhoon Data** | Yes | Yes | Limited |
| **Philippines** | ❌ | ✅ | ✅ |
| **Best For** | USA weather | Asian typhoons | Primary source |
| **Ease** | Medium | Hard | Easy |

---

## Recommended Implementation Strategy

### Priority 1: OpenWeatherMap (Primary)
```
✅ Use as main weather source for Philippines
✅ Provides all data needed
✅ Easiest to integrate
✅ Reliable global coverage
```

### Priority 2: JMA (Typhoon Tracking)
```
✅ Use for enhanced typhoon tracking
✅ Better typhoon predictions for Asia
✅ Cross-validate OpenWeatherMap alerts
```

### Priority 3: NOAA (Backup/USA)
```
✅ Use as fallback for USA weather
✅ Enhanced tropical cyclone tracking
✅ Can be useful for emergency situations
```

---

## Complete Integration Setup

### Step 1: Create API Wrapper

```php
// api-manager.php
class WeatherAPIManager {
    private $apis = [];
    
    public function __construct() {
        require_once 'openweathermap-api.php';
        require_once 'jma-weather-api.php';
        require_once 'noaa-weather-api.php';
        
        $this->apis['openweathermap'] = new OpenWeatherMapAPI(
            getConfig('openweathermap_api_key')
        );
        $this->apis['jma'] = new JMAWeatherAPI();
        $this->apis['noaa'] = new NOAAWeatherAPI();
    }
    
    public function getWeather($location, $source = 'openweathermap') {
        if (!isset($this->apis[$source])) {
            return ['error' => 'Unknown API source'];
        }
        
        return $this->apis[$source]->getCurrentWeather($location);
    }
    
    public function getTyphoons($source = 'jma') {
        if (!isset($this->apis[$source])) {
            return ['error' => 'Unknown API source'];
        }
        
        return $this->apis[$source]->getTyphoons();
    }
}
```

### Step 2: Update JavaScript

```javascript
// In script.js - update loadWeatherData function
async function loadWeatherData(location) {
    try {
        // Try primary source (OpenWeatherMap)
        const response = await fetch(
            `api.php?action=weather&location=${location}&source=openweathermap`
        );
        
        if (!response.ok) {
            throw new Error('Weather API failed');
        }
        
        const result = await response.json();
        
        if (result.success) {
            state.weatherData = result.data;
            displayCurrentWeather(state.weatherData);
        }
        
    } catch (error) {
        console.error('Weather load error:', error);
        showNotification('Failed to load weather data', 'error');
    }
}
```

### Step 3: Environment Setup

Create `.env.example`:
```
OPENWEATHERMAP_API_KEY=your_api_key_here
NOAA_ENABLED=true
JMA_ENABLED=true
```

---

## Security Best Practices

### 1. Protect API Keys

```php
// Load from environment, NOT from code
$apiKey = getenv('OPENWEATHERMAP_API_KEY');

// Never commit config with real keys
// Use .env files instead
```

### 2. Rate Limiting

```php
// Implement caching to avoid excessive API calls
$cacheKey = 'weather_' . md5($location);
$cached = apcu_fetch($cacheKey);

if ($cached) {
    return $cached;
}

// Make API call
$result = $api->getWeather($location);

// Cache for 10 minutes
apcu_store($cacheKey, $result, 600);
```

### 3. Error Handling

```php
// Graceful fallback
try {
    $weather = $api->getCurrentWeather($location);
} catch (Exception $e) {
    // Return cached data or mock data
    $weather = getCachedWeather($location);
}
```

---

## Testing API Integration

### Manual Testing

```bash
# Test OpenWeatherMap with curl
curl -X GET "https://api.openweathermap.org/data/3.0/onecall?lat=14.5995&lon=120.9842&appid=YOUR_KEY&units=metric"

# Test through BayanForecast API
curl "http://localhost:8000/api.php?action=weather&location=Manila&source=openweathermap"
```

### Automated Testing

```php
// test-apis.php
<?php
require_once 'openweathermap-api.php';

$api = new OpenWeatherMapAPI('YOUR_API_KEY');

// Test weather data
$weather = $api->getCurrentWeather('Manila');
assert($weather['success'], 'Weather API failed');

// Test coordinates
$coords = $api->getCoordinates('Manila');
assert($coords !== null, 'Geocoding failed');

echo "✅ All API tests passed!";
?>
```

---

## Next Steps

1. **Get OpenWeatherMap API Key**
   - Register at: https://openweathermap.org
   - Copy API key to config.php

2. **Create API Files**
   - Copy code from this guide
   - Create openweathermap-api.php
   - Create jma-weather-api.php
   - Create noaa-weather-api.php

3. **Update Configuration**
   - Add API keys to config.php
   - Update .gitignore to exclude config with real keys

4. **Test Integration**
   - Run API tests
   - Verify weather data displays
   - Check error handling

5. **Deploy**
   - Move to production
   - Set environment variables
   - Enable caching
   - Monitor API usage

---

## Resources

- **OpenWeatherMap**: https://openweathermap.org/api
- **NOAA Weather**: https://www.weather.gov/documentation/services-web-api
- **JMA**: https://www.jma.go.jp/jma/en/
- **API Documentation**: https://openweathermap.org/api
- **Geocoding API**: https://openweathermap.org/api/geocoding-api

---

**Your BayanForecast project is now ready for professional weather API integration!** 🎯
