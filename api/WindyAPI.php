<?php
/**
 * Windy API Wrapper
 * Handles all Windy API requests for point forecasts
 * Documentation: https://api.windy.com/point-forecast/docs
 */

class WindyAPI {
    private $apiKey;
    private $baseUrl = 'https://api.windy.com/api/point-forecast/v2';
    
    public function __construct($apiKey) {
        $this->apiKey = $apiKey;
    }
    
    /**
     * Get point forecast for specific coordinates
     * @param float $lat Latitude
     * @param float $lon Longitude
     * @param string $model Forecast model (gfs, iconEu, arome, etc.)
     * @param array $parameters Parameters to request
     * @param array $levels Geopotential levels
     * @return array Forecast data
     */
    public function getPointForecast($lat, $lon, $model = 'gfs', $parameters = null, $levels = ['surface']) {
        if (!$parameters) {
            // Default parameters for weather forecast
            $parameters = ['temp', 'wind', 'pressure', 'rh', 'precip', 'lclouds', 'mclouds', 'hclouds'];
        }
        
        $requestBody = [
            'lat' => round($lat, 2),
            'lon' => round($lon, 2),
            'model' => $model,
            'parameters' => $parameters,
            'levels' => $levels,
            'key' => $this->apiKey
        ];
        
        $response = $this->makeRequest($this->baseUrl, $requestBody);
        
        if (!$response) {
            throw new Exception("Failed to fetch Windy forecast data");
        }
        
        return $this->formatForecastData($response, $lat, $lon);
    }
    
    /**
     * Get current weather data (formatted similar to OpenWeatherMap)
     */
    public function getCurrentWeather($lat, $lon) {
        try {
            $forecast = $this->getPointForecast($lat, $lon, 'gfs', [
                'temp', 'wind', 'pressure', 'rh', 'dewpoint', 'precip', 
                'lclouds', 'mclouds', 'hclouds', 'windGust'
            ], ['surface']);
            
            if (empty($forecast) || !isset($forecast['current'])) {
                throw new Exception("No current weather data available");
            }
            
            $current = $forecast['current'];
            
            // Calculate wind speed from u and v components
            $windSpeed = 0;
            if (isset($current['wind_u-surface']) && isset($current['wind_v-surface'])) {
                $windU = $current['wind_u-surface'];
                $windV = $current['wind_v-surface'];
                $windSpeed = sqrt($windU * $windU + $windV * $windV) * 3.6; // Convert m/s to km/h
            }
            
            // Calculate wind direction
            $windDirection = 0;
            if (isset($current['wind_u-surface']) && isset($current['wind_v-surface'])) {
                $windDirection = atan2($current['wind_u-surface'], $current['wind_v-surface']) * 180 / M_PI;
                if ($windDirection < 0) $windDirection += 360;
            }
            
            // Calculate cloud cover (percentage)
            $cloudCover = 0;
            if (isset($current['lclouds-surface'])) {
                $cloudCover += $current['lclouds-surface'];
            }
            if (isset($current['mclouds-surface'])) {
                $cloudCover += $current['mclouds-surface'];
            }
            if (isset($current['hclouds-surface'])) {
                $cloudCover += $current['hclouds-surface'];
            }
            $cloudCover = min(100, $cloudCover);
            
            return [
                'location' => "{$lat}, {$lon}",
                'temperature' => isset($current['temp-surface']) ? round($current['temp-surface']) : 0,
                'condition' => $this->getWeatherCondition($cloudCover, isset($current['precip-surface']) ? $current['precip-surface'] : 0),
                'description' => $this->getWeatherDescription($cloudCover, isset($current['precip-surface']) ? $current['precip-surface'] : 0),
                'humidity' => isset($current['rh-surface']) ? round($current['rh-surface']) : 0,
                'windSpeed' => round($windSpeed),
                'windDirection' => round($windDirection),
                'windGust' => isset($current['gust-surface']) ? round($current['gust-surface'] * 3.6) : 0,
                'pressure' => isset($current['pressure-surface']) ? round($current['pressure-surface'] / 100) : 1013, // Convert Pa to mb
                'dewpoint' => isset($current['dewpoint-surface']) ? round($current['dewpoint-surface']) : 0,
                'cloudCover' => round($cloudCover),
                'lowClouds' => isset($current['lclouds-surface']) ? round($current['lclouds-surface']) : 0,
                'midClouds' => isset($current['mclouds-surface']) ? round($current['mclouds-surface']) : 0,
                'highClouds' => isset($current['hclouds-surface']) ? round($current['hclouds-surface']) : 0,
                'precipitation' => isset($current['precip-surface']) ? round($current['precip-surface'] * 10, 1) : 0, // Convert to mm
                'lastUpdated' => date('Y-m-d H:i:s'),
                'source' => 'Windy'
            ];
        } catch (Exception $e) {
            throw new Exception("Windy API Error: " . $e->getMessage());
        }
    }
    
    /**
     * Get forecast data (hourly/daily)
     */
    public function getForecast($lat, $lon, $model = 'gfs') {
        try {
            $forecast = $this->getPointForecast($lat, $lon, $model, [
                'temp', 'wind', 'pressure', 'rh', 'precip', 'lclouds', 'mclouds', 'hclouds'
            ], ['surface']);
            
            if (empty($forecast) || !isset($forecast['forecast'])) {
                throw new Exception("No forecast data available");
            }
            
            return $this->formatDailyForecast($forecast['forecast']);
        } catch (Exception $e) {
            throw new Exception("Windy Forecast Error: " . $e->getMessage());
        }
    }
    
    /**
     * Get cloud data for cloud imagery layer
     */
    public function getCloudData($lat, $lon) {
        try {
            $forecast = $this->getPointForecast($lat, $lon, 'gfs', [
                'lclouds', 'mclouds', 'hclouds'
            ], ['surface']);
            
            if (empty($forecast) || !isset($forecast['current'])) {
                return null;
            }
            
            $current = $forecast['current'];
            
            return [
                'lowClouds' => isset($current['lclouds-surface']) ? $current['lclouds-surface'] : 0,
                'midClouds' => isset($current['mclouds-surface']) ? $current['mclouds-surface'] : 0,
                'highClouds' => isset($current['hclouds-surface']) ? $current['hclouds-surface'] : 0,
                'totalClouds' => min(100, 
                    (isset($current['lclouds-surface']) ? $current['lclouds-surface'] : 0) +
                    (isset($current['mclouds-surface']) ? $current['mclouds-surface'] : 0) +
                    (isset($current['hclouds-surface']) ? $current['hclouds-surface'] : 0)
                )
            ];
        } catch (Exception $e) {
            error_log("Windy Cloud Data Error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Format forecast data from Windy API response
     */
    private function formatForecastData($response, $lat, $lon) {
        if (!isset($response['ts']) || empty($response['ts'])) {
            return [];
        }
        
        $timestamps = $response['ts'];
        $currentTime = time() * 1000; // Convert to milliseconds
        $currentIndex = 0;
        
        // Find current time index
        foreach ($timestamps as $index => $ts) {
            if ($ts <= $currentTime) {
                $currentIndex = $index;
            } else {
                break;
            }
        }
        
        // Extract current data
        $current = [];
        foreach ($response as $key => $values) {
            if ($key !== 'ts' && $key !== 'units' && is_array($values) && isset($values[$currentIndex])) {
                $current[$key] = $values[$currentIndex];
            }
        }
        
        // Extract forecast data (next 7 days)
        $forecast = [];
        $forecastStart = $currentIndex + 1;
        $forecastEnd = min(count($timestamps), $forecastStart + 168); // 7 days * 24 hours
        
        for ($i = $forecastStart; $i < $forecastEnd; $i++) {
            $hourly = [];
            foreach ($response as $key => $values) {
                if ($key !== 'ts' && $key !== 'units' && is_array($values) && isset($values[$i])) {
                    $hourly[$key] = $values[$i];
                }
            }
            $hourly['timestamp'] = $timestamps[$i];
            $forecast[] = $hourly;
        }
        
        return [
            'current' => $current,
            'forecast' => $forecast,
            'units' => isset($response['units']) ? $response['units'] : []
        ];
    }
    
    /**
     * Format daily forecast from hourly data
     */
    private function formatDailyForecast($hourlyForecast) {
        $dailyForecast = [];
        $daysProcessed = [];
        
        foreach ($hourlyForecast as $hourly) {
            if (!isset($hourly['timestamp'])) continue;
            
            $date = date('Y-m-d', $hourly['timestamp'] / 1000);
            
            if (!isset($daysProcessed[$date])) {
                // Calculate wind speed
                $windSpeed = 0;
                if (isset($hourly['wind_u-surface']) && isset($hourly['wind_v-surface'])) {
                    $windU = $hourly['wind_u-surface'];
                    $windV = $hourly['wind_v-surface'];
                    $windSpeed = sqrt($windU * $windU + $windV * $windV) * 3.6;
                }
                
                // Calculate cloud cover
                $cloudCover = 0;
                if (isset($hourly['lclouds-surface'])) $cloudCover += $hourly['lclouds-surface'];
                if (isset($hourly['mclouds-surface'])) $cloudCover += $hourly['mclouds-surface'];
                if (isset($hourly['hclouds-surface'])) $cloudCover += $hourly['hclouds-surface'];
                $cloudCover = min(100, $cloudCover);
                
                $daysProcessed[$date] = [
                    'day' => date('l', $hourly['timestamp'] / 1000),
                    'date' => $date,
                    'tempHigh' => isset($hourly['temp-surface']) ? round($hourly['temp-surface']) : 0,
                    'tempLow' => isset($hourly['temp-surface']) ? round($hourly['temp-surface']) : 0,
                    'condition' => $this->getWeatherCondition($cloudCover, isset($hourly['precip-surface']) ? $hourly['precip-surface'] : 0),
                    'humidity' => isset($hourly['rh-surface']) ? round($hourly['rh-surface']) : 0,
                    'windSpeed' => round($windSpeed),
                    'chanceOfRain' => isset($hourly['precip-surface']) && $hourly['precip-surface'] > 0 ? 70 : 0,
                    'precipitation' => isset($hourly['precip-surface']) ? round($hourly['precip-surface'] * 10, 1) : 0
                ];
            } else {
                // Update high/low temps
                if (isset($hourly['temp-surface'])) {
                    $temp = round($hourly['temp-surface']);
                    if ($temp > $daysProcessed[$date]['tempHigh']) {
                        $daysProcessed[$date]['tempHigh'] = $temp;
                    }
                    if ($temp < $daysProcessed[$date]['tempLow']) {
                        $daysProcessed[$date]['tempLow'] = $temp;
                    }
                }
            }
        }
        
        return array_values(array_slice($daysProcessed, 0, 7));
    }
    
    /**
     * Get weather condition from cloud cover and precipitation
     */
    private function getWeatherCondition($cloudCover, $precipitation) {
        if ($precipitation > 0.5) {
            return 'Rain';
        } elseif ($cloudCover > 80) {
            return 'Clouds';
        } elseif ($cloudCover > 50) {
            return 'Partly Cloudy';
        } else {
            return 'Clear';
        }
    }
    
    /**
     * Get weather description
     */
    private function getWeatherDescription($cloudCover, $precipitation) {
        if ($precipitation > 0.5) {
            return 'Rainy';
        } elseif ($cloudCover > 80) {
            return 'Overcast';
        } elseif ($cloudCover > 50) {
            return 'Partly cloudy';
        } else {
            return 'Clear sky';
        }
    }
    
    /**
     * Make HTTP POST request
     */
    private function makeRequest($url, $data) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_TIMEOUT => 15,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
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
        
        if ($httpCode === 204) {
            // No data available for requested parameters
            return null;
        }
        
        if ($httpCode !== 200) {
            $errorData = json_decode($response, true);
            throw new Exception("HTTP Error $httpCode: " . ($errorData['message'] ?? 'Unknown error'));
        }
        
        return json_decode($response, true);
    }
}
?>

