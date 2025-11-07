<?php
/**
 * OpenWeatherMap API Wrapper
 * Handles all OpenWeatherMap API requests
 */

class OpenWeatherMapAPI {
    private $apiKey;
    private $baseUrl = 'https://api.openweathermap.org/data/2.5';
    private $geoUrl = 'https://api.openweathermap.org/geo/1.0';
    
    public function __construct($apiKey) {
        $this->apiKey = $apiKey;
    }
    
    /**
     * Get coordinates for a location
     */
    public function getCoordinates($location, $countryCode = 'PH') {
        $url = $this->geoUrl . '/direct';
        $params = [
            'q' => $location . ',' . $countryCode,
            'limit' => 1,
            'appid' => $this->apiKey
        ];
        
        $response = $this->makeRequest($url, $params);
        
        if (!empty($response) && isset($response[0])) {
            return [
                'lat' => $response[0]['lat'],
                'lon' => $response[0]['lon'],
                'name' => $response[0]['name'],
                'country' => $response[0]['country']
            ];
        }
        
        return null;
    }
    
    /**
     * Get current weather data
     */
    public function getCurrentWeather($location) {
        $coords = $this->getCoordinates($location);
        
        if (!$coords) {
            throw new Exception("Location not found: $location");
        }
        
        $url = $this->baseUrl . '/weather';
        $params = [
            'lat' => $coords['lat'],
            'lon' => $coords['lon'],
            'appid' => $this->apiKey,
            'units' => 'metric'
        ];
        
        $response = $this->makeRequest($url, $params);
        
        if (!$response || isset($response['cod']) && $response['cod'] !== 200) {
            throw new Exception("Failed to fetch weather data: " . ($response['message'] ?? 'Unknown error'));
        }
        
        return $this->formatWeatherData($response, $location);
    }
    
    /**
     * Get 7-day forecast
     */
    public function getForecast($location) {
        $coords = $this->getCoordinates($location);
        
        if (!$coords) {
            throw new Exception("Location not found: $location");
        }
        
        $url = $this->baseUrl . '/forecast';
        $params = [
            'lat' => $coords['lat'],
            'lon' => $coords['lon'],
            'appid' => $this->apiKey,
            'units' => 'metric',
            'cnt' => 40 // 5 days * 8 forecasts per day = 40
        ];
        
        $response = $this->makeRequest($url, $params);
        
        if (!$response || isset($response['cod']) && $response['cod'] !== '200') {
            throw new Exception("Failed to fetch forecast data");
        }
        
        return $this->formatForecastData($response);
    }
    
    /**
     * Get weather alerts
     */
    public function getAlerts($location) {
        $coords = $this->getCoordinates($location);
        
        if (!$coords) {
            throw new Exception("Location not found: $location");
        }
        
        // Use One Call API 3.0 for alerts (if available)
        $url = 'https://api.openweathermap.org/data/3.0/onecall';
        $params = [
            'lat' => $coords['lat'],
            'lon' => $coords['lon'],
            'appid' => $this->apiKey,
            'exclude' => 'current,minutely,hourly,daily'
        ];
        
        try {
            $response = $this->makeRequest($url, $params);
            
            if (isset($response['alerts'])) {
                return $this->formatAlertsData($response['alerts']);
            }
        } catch (Exception $e) {
            // Alerts not available, return empty array
            return [];
        }
        
        return [];
    }
    
    /**
     * Get typhoon/tropical cyclone data from weather alerts
     * OpenWeatherMap provides severe weather alerts that may include tropical cyclone warnings
     */
    public function getTyphoons($region = 'PH') {
        $typhoons = [];
        
        try {
            // Check multiple locations in the Philippines region for typhoon alerts
            $locations = [
                ['lat' => 14.5995, 'lon' => 120.9842, 'name' => 'Manila'], // Manila
                ['lat' => 10.3157, 'lon' => 123.8854, 'name' => 'Cebu'], // Cebu
                ['lat' => 7.1907, 'lon' => 125.4553, 'name' => 'Davao'], // Davao
                ['lat' => 16.4023, 'lon' => 120.5960, 'name' => 'Baguio'], // Baguio
                ['lat' => 11.2408, 'lon' => 125.0058, 'name' => 'Tacloban'], // Tacloban
            ];
            
            foreach ($locations as $loc) {
                try {
                    $url = 'https://api.openweathermap.org/data/3.0/onecall';
                    $params = [
                        'lat' => $loc['lat'],
                        'lon' => $loc['lon'],
                        'appid' => $this->apiKey,
                        'exclude' => 'current,minutely,hourly,daily'
                    ];
                    
                    $response = $this->makeRequest($url, $params);
                    
                    if (isset($response['alerts']) && is_array($response['alerts'])) {
                        foreach ($response['alerts'] as $alert) {
                            $typhoon = $this->extractTyphoonFromAlert($alert, $loc);
                            if ($typhoon && !$this->typhoonExists($typhoons, $typhoon)) {
                                $typhoons[] = $typhoon;
                            }
                        }
                    }
                } catch (Exception $e) {
                    // Continue with next location
                    continue;
                }
            }
            
            // Also try to get typhoon data from global severe weather events
            // Using a broader search in the Western Pacific region
            $pacificLocations = [
                ['lat' => 15.0, 'lon' => 120.0], // Central Philippines
                ['lat' => 20.0, 'lon' => 125.0], // Northern Philippines
                ['lat' => 10.0, 'lon' => 125.0], // Southern Philippines
            ];
            
            foreach ($pacificLocations as $loc) {
                try {
                    $url = 'https://api.openweathermap.org/data/3.0/onecall';
                    $params = [
                        'lat' => $loc['lat'],
                        'lon' => $loc['lon'],
                        'appid' => $this->apiKey,
                        'exclude' => 'current,minutely,hourly,daily'
                    ];
                    
                    $response = $this->makeRequest($url, $params);
                    
                    if (isset($response['alerts']) && is_array($response['alerts'])) {
                        foreach ($response['alerts'] as $alert) {
                            $typhoon = $this->extractTyphoonFromAlert($alert, $loc);
                            if ($typhoon && !$this->typhoonExists($typhoons, $typhoon)) {
                                $typhoons[] = $typhoon;
                            }
                        }
                    }
                } catch (Exception $e) {
                    continue;
                }
            }
            
        } catch (Exception $e) {
            error_log("OpenWeatherMap Typhoon Error: " . $e->getMessage());
        }
        
        return $typhoons;
    }
    
    /**
     * Extract typhoon information from weather alert
     */
    private function extractTyphoonFromAlert($alert, $location) {
        $event = strtolower($alert['event'] ?? '');
        $description = strtolower($alert['description'] ?? '');
        
        // Check if alert is related to tropical cyclones/typhoons
        $typhoonKeywords = ['typhoon', 'tropical cyclone', 'hurricane', 'tropical storm', 'tropical depression', 'super typhoon'];
        $isTyphoonAlert = false;
        
        foreach ($typhoonKeywords as $keyword) {
            if (stripos($event, $keyword) !== false || stripos($description, $keyword) !== false) {
                $isTyphoonAlert = true;
                break;
            }
        }
        
        if (!$isTyphoonAlert) {
            return null;
        }
        
        // Extract typhoon name from alert
        $name = $this->extractTyphoonName($event . ' ' . $description);
        
        // Extract wind speed from description
        $windSpeed = $this->extractWindSpeed($description);
        
        // Determine category based on wind speed
        $category = $this->determineCategory($windSpeed);
        
        // Extract coordinates (use alert location or provided location)
        $lat = $location['lat'] ?? 0;
        $lon = $location['lon'] ?? 0;
        
        // Try to extract more precise coordinates from description
        $coords = $this->extractCoordinates($description);
        if ($coords) {
            $lat = $coords['lat'];
            $lon = $coords['lon'];
        }
        
        return [
            'id' => md5($name . $lat . $lon . time()),
            'name' => $name ?: 'Unnamed Typhoon',
            'latitude' => $lat,
            'longitude' => $lon,
            'speed' => $windSpeed,
            'category' => $category,
            'status' => 'Active',
            'pressure' => 0, // Not available from alerts
            'movementSpeed' => 0, // Not available from alerts
            'movementDirection' => 'N/A',
            'warnings' => $alert['description'] ?? '',
            'lastUpdated' => date('Y-m-d H:i:s', $alert['start'] ?? time()),
            'source' => 'OpenWeatherMap'
        ];
    }
    
    /**
     * Extract typhoon name from text
     */
    private function extractTyphoonName($text) {
        // Look for patterns like "Typhoon NAME" or "Tropical Cyclone NAME"
        if (preg_match('/(?:typhoon|tropical\s+cyclone|hurricane|tropical\s+storm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i', $text, $matches)) {
            return trim($matches[1]);
        }
        
        // Look for numbered systems like "Typhoon 01" or "TC 2024-01"
        if (preg_match('/(?:typhoon|tc)\s*(\d+)/i', $text, $matches)) {
            return 'Typhoon ' . $matches[1];
        }
        
        return 'Unnamed System';
    }
    
    /**
     * Extract wind speed from text
     */
    private function extractWindSpeed($text) {
        // Look for wind speed patterns (km/h, mph, m/s, knots)
        if (preg_match('/(\d+)\s*(?:km\/h|kmh|kph)/i', $text, $matches)) {
            return (int)$matches[1];
        }
        if (preg_match('/(\d+)\s*(?:mph)/i', $text, $matches)) {
            return (int)($matches[1] * 1.60934); // Convert to km/h
        }
        if (preg_match('/(\d+)\s*(?:m\/s|ms)/i', $text, $matches)) {
            return (int)($matches[1] * 3.6); // Convert to km/h
        }
        if (preg_match('/(\d+)\s*(?:knots|kt)/i', $text, $matches)) {
            return (int)($matches[1] * 1.852); // Convert to km/h
        }
        
        // Default estimate based on category keywords
        if (stripos($text, 'super typhoon') !== false) {
            return 220; // Super typhoon
        }
        if (stripos($text, 'typhoon') !== false) {
            return 120; // Regular typhoon
        }
        if (stripos($text, 'tropical storm') !== false) {
            return 65; // Tropical storm
        }
        if (stripos($text, 'tropical depression') !== false) {
            return 45; // Tropical depression
        }
        
        return 0;
    }
    
    /**
     * Determine typhoon category based on wind speed
     */
    private function determineCategory($windSpeed) {
        if ($windSpeed >= 220) {
            return 'Super Typhoon';
        } elseif ($windSpeed >= 118) {
            return 'Typhoon';
        } elseif ($windSpeed >= 89) {
            return 'Severe Tropical Storm';
        } elseif ($windSpeed >= 62) {
            return 'Tropical Storm';
        } elseif ($windSpeed >= 39) {
            return 'Tropical Depression';
        } else {
            return 'Low Pressure Area';
        }
    }
    
    /**
     * Extract coordinates from text
     */
    private function extractCoordinates($text) {
        // Look for coordinate patterns like "15.5°N, 120.0°E" or "15.5N 120.0E"
        if (preg_match('/(\d+\.?\d*)\s*°?\s*[NS],?\s*(\d+\.?\d*)\s*°?\s*[EW]/i', $text, $matches)) {
            $lat = (float)$matches[1];
            $lon = (float)$matches[2];
            
            // Adjust for N/S and E/W
            if (stripos($text, 'S') !== false) $lat = -$lat;
            if (stripos($text, 'W') !== false) $lon = -$lon;
            
            return ['lat' => $lat, 'lon' => $lon];
        }
        
        return null;
    }
    
    /**
     * Check if typhoon already exists in array
     */
    private function typhoonExists($typhoons, $newTyphoon) {
        foreach ($typhoons as $existing) {
            // Check if same name or very close coordinates
            if ($existing['name'] === $newTyphoon['name']) {
                return true;
            }
            
            // Check if coordinates are very close (within 1 degree)
            $distance = sqrt(
                pow($existing['latitude'] - $newTyphoon['latitude'], 2) +
                pow($existing['longitude'] - $newTyphoon['longitude'], 2)
            );
            
            if ($distance < 1.0) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Format weather data for our application
     */
    private function formatWeatherData($data, $location) {
        return [
            'location' => $location,
            'country' => $data['sys']['country'] ?? 'PH',
            'temperature' => round($data['main']['temp']),
            'condition' => $data['weather'][0]['main'],
            'description' => $data['weather'][0]['description'],
            'humidity' => $data['main']['humidity'],
            'windSpeed' => round($data['wind']['speed'] * 3.6), // m/s to km/h
            'pressure' => $data['main']['pressure'],
            'visibility' => isset($data['visibility']) ? round($data['visibility'] / 1000, 1) : 10,
            'feelsLike' => round($data['main']['feels_like']),
            'uvIndex' => 0, // Not in free tier
            'cloudCover' => $data['clouds']['all'] ?? 0,
            'lastUpdated' => date('Y-m-d H:i:s', $data['dt'])
        ];
    }
    
    /**
     * Format forecast data
     */
    private function formatForecastData($data) {
        $forecast = [];
        $daysProcessed = [];
        
        foreach ($data['list'] as $item) {
            $date = date('Y-m-d', $item['dt']);
            
            // Group by day (take one forecast per day, preferably noon)
            if (!isset($daysProcessed[$date]) || abs(12 - (int)date('H', $item['dt'])) < abs(12 - (int)date('H', $daysProcessed[$date]))) {
                $daysProcessed[$date] = $item['dt'];
            }
        }
        
        $dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        $index = 0;
        
        foreach ($daysProcessed as $date => $timestamp) {
            $item = null;
            foreach ($data['list'] as $listItem) {
                if ($listItem['dt'] == $timestamp) {
                    $item = $listItem;
                    break;
                }
            }
            
            if ($item) {
                $dayName = $dayNames[date('w', $timestamp)];
                $forecast[] = [
                    'day' => $dayName,
                    'date' => $date,
                    'condition' => $item['weather'][0]['main'],
                    'tempHigh' => round($item['main']['temp_max']),
                    'tempLow' => round($item['main']['temp_min']),
                    'humidity' => $item['main']['humidity'],
                    'windSpeed' => round($item['wind']['speed'] * 3.6),
                    'chanceOfRain' => isset($item['pop']) ? round($item['pop'] * 100) : 0,
                    'uvIndex' => 0
                ];
                $index++;
                if ($index >= 7) break;
            }
        }
        
        return $forecast;
    }
    
    /**
     * Format alerts data
     */
    private function formatAlertsData($alerts) {
        $formatted = [];
        
        foreach ($alerts as $alert) {
            $formatted[] = [
                'id' => md5($alert['sender_name'] . $alert['start']),
                'type' => 'warning',
                'title' => $alert['event'],
                'message' => $alert['description'],
                'timestamp' => date('Y-m-d H:i:s', $alert['start']),
                'severity' => 'Warning'
            ];
        }
        
        return $formatted;
    }
    
    /**
     * Make HTTP request
     */
    private function makeRequest($url, $params = []) {
        $queryString = http_build_query($params);
        $fullUrl = $url . '?' . $queryString;
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $fullUrl,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json'
            ]
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            throw new Exception("CURL Error: $error");
        }
        
        if ($httpCode !== 200) {
            $errorData = json_decode($response, true);
            throw new Exception("HTTP Error $httpCode: " . ($errorData['message'] ?? 'Unknown error'));
        }
        
        return json_decode($response, true);
    }
}
?>

