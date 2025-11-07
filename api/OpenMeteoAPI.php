<?php
/**
 * Open-Meteo API Wrapper
 * Free weather forecast API with no API key required
 * Documentation: https://open-meteo.com/en/docs
 * 
 * Features:
 * - Up to 16 days forecast
 * - Multiple weather models (ECMWF, GFS, JMA, etc.)
 * - Hourly and daily forecasts
 * - Historical weather data
 * - No API key required (free for non-commercial use)
 */

class OpenMeteoAPI {
    private $baseUrl = 'https://api.open-meteo.com/v1';
    private $forecastUrl = 'https://api.open-meteo.com/v1/forecast';
    private $userAgent = 'BayanForecast/1.0 (Weather Monitoring System)';
    
    /**
     * Get current weather data
     */
    public function getCurrentWeather($latitude, $longitude, $timezone = 'Asia/Manila') {
        try {
            $url = $this->forecastUrl . '?' . http_build_query([
                'latitude' => $latitude,
                'longitude' => $longitude,
                'timezone' => $timezone,
                'current' => 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m',
                'hourly' => 'temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m',
                'daily' => 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant',
                'timeformat' => 'iso8601'
            ]);
            
            $response = $this->fetchData($url);
            
            if (!$response || !isset($response['current'])) {
                throw new Exception("No current weather data available");
            }
            
            return $this->formatCurrentWeather($response, $latitude, $longitude);
        } catch (Exception $e) {
            error_log("Open-Meteo Current Weather Error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Get forecast data (hourly and daily)
     */
    public function getForecast($latitude, $longitude, $timezone = 'Asia/Manila', $days = 7) {
        try {
            $url = $this->forecastUrl . '?' . http_build_query([
                'latitude' => $latitude,
                'longitude' => $longitude,
                'timezone' => $timezone,
                'forecast_days' => min($days, 16), // Open-Meteo supports up to 16 days
                'hourly' => 'temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover,pressure_msl',
                'daily' => 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,sunrise,sunset,uv_index_max',
                'timeformat' => 'iso8601'
            ]);
            
            $response = $this->fetchData($url);
            
            if (!$response || !isset($response['hourly']) || !isset($response['daily'])) {
                throw new Exception("No forecast data available");
            }
            
            return $this->formatForecast($response);
        } catch (Exception $e) {
            error_log("Open-Meteo Forecast Error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Get typhoon/tropical cyclone data
     * Note: Open-Meteo doesn't provide typhoon tracking, but we can use it for weather conditions
     */
    public function getTyphoons() {
        // Open-Meteo doesn't provide typhoon tracking data
        // This would need to be combined with other APIs like JMA or NOAA
        return [];
    }
    
    /**
     * Format current weather data
     */
    private function formatCurrentWeather($data, $latitude, $longitude) {
        $current = $data['current'];
        $hourly = isset($data['hourly']) ? $data['hourly'] : null;
        
        // Get weather description from weather code
        $weatherCode = isset($current['weather_code']) ? (int)$current['weather_code'] : 0;
        $weatherDescription = $this->getWeatherDescription($weatherCode);
        
        return [
            'temperature' => isset($current['temperature_2m']) ? round($current['temperature_2m'], 1) : null,
            'feelsLike' => isset($current['apparent_temperature']) ? round($current['apparent_temperature'], 1) : null,
            'humidity' => isset($current['relative_humidity_2m']) ? (int)$current['relative_humidity_2m'] : null,
            'pressure' => isset($current['pressure_msl']) ? round($current['pressure_msl'], 1) : null,
            'windSpeed' => isset($current['wind_speed_10m']) ? round($current['wind_speed_10m'], 1) : null,
            'windDirection' => isset($current['wind_direction_10m']) ? (int)$current['wind_direction_10m'] : null,
            'windGust' => isset($current['wind_gusts_10m']) ? round($current['wind_gusts_10m'], 1) : null,
            'precipitation' => isset($current['precipitation']) ? round($current['precipitation'], 2) : 0,
            'rain' => isset($current['rain']) ? round($current['rain'], 2) : 0,
            'cloudCover' => isset($current['cloud_cover']) ? (int)$current['cloud_cover'] : null,
            'weatherCode' => $weatherCode,
            'description' => $weatherDescription,
            'isDay' => isset($current['is_day']) ? (bool)$current['is_day'] : true,
            'latitude' => $latitude,
            'longitude' => $longitude,
            'timezone' => isset($data['timezone']) ? $data['timezone'] : 'Asia/Manila',
            'lastUpdated' => isset($current['time']) ? $current['time'] : date('Y-m-d H:i:s'),
            'source' => 'Open-Meteo'
        ];
    }
    
    /**
     * Format forecast data
     */
    private function formatForecast($data) {
        $forecast = [
            'hourly' => [],
            'daily' => []
        ];
        
        // Format hourly forecast
        if (isset($data['hourly']) && isset($data['hourly']['time'])) {
            $hourlyCount = count($data['hourly']['time']);
            for ($i = 0; $i < $hourlyCount; $i++) {
                $forecast['hourly'][] = [
                    'time' => $data['hourly']['time'][$i],
                    'temperature' => isset($data['hourly']['temperature_2m'][$i]) ? round($data['hourly']['temperature_2m'][$i], 1) : null,
                    'humidity' => isset($data['hourly']['relative_humidity_2m'][$i]) ? (int)$data['hourly']['relative_humidity_2m'][$i] : null,
                    'precipitation' => isset($data['hourly']['precipitation'][$i]) ? round($data['hourly']['precipitation'][$i], 2) : 0,
                    'rain' => isset($data['hourly']['rain'][$i]) ? round($data['hourly']['rain'][$i], 2) : 0,
                    'weatherCode' => isset($data['hourly']['weather_code'][$i]) ? (int)$data['hourly']['weather_code'][$i] : 0,
                    'description' => $this->getWeatherDescription(isset($data['hourly']['weather_code'][$i]) ? (int)$data['hourly']['weather_code'][$i] : 0),
                    'windSpeed' => isset($data['hourly']['wind_speed_10m'][$i]) ? round($data['hourly']['wind_speed_10m'][$i], 1) : null,
                    'windDirection' => isset($data['hourly']['wind_direction_10m'][$i]) ? (int)$data['hourly']['wind_direction_10m'][$i] : null,
                    'windGust' => isset($data['hourly']['wind_gusts_10m'][$i]) ? round($data['hourly']['wind_gusts_10m'][$i], 1) : null,
                    'cloudCover' => isset($data['hourly']['cloud_cover'][$i]) ? (int)$data['hourly']['cloud_cover'][$i] : null,
                    'pressure' => isset($data['hourly']['pressure_msl'][$i]) ? round($data['hourly']['pressure_msl'][$i], 1) : null
                ];
            }
        }
        
        // Format daily forecast
        if (isset($data['daily']) && isset($data['daily']['time'])) {
            $dailyCount = count($data['daily']['time']);
            for ($i = 0; $i < $dailyCount; $i++) {
                $forecast['daily'][] = [
                    'date' => $data['daily']['time'][$i],
                    'weatherCode' => isset($data['daily']['weather_code'][$i]) ? (int)$data['daily']['weather_code'][$i] : 0,
                    'description' => $this->getWeatherDescription(isset($data['daily']['weather_code'][$i]) ? (int)$data['daily']['weather_code'][$i] : 0),
                    'tempMax' => isset($data['daily']['temperature_2m_max'][$i]) ? round($data['daily']['temperature_2m_max'][$i], 1) : null,
                    'tempMin' => isset($data['daily']['temperature_2m_min'][$i]) ? round($data['daily']['temperature_2m_min'][$i], 1) : null,
                    'precipitation' => isset($data['daily']['precipitation_sum'][$i]) ? round($data['daily']['precipitation_sum'][$i], 2) : 0,
                    'rain' => isset($data['daily']['rain_sum'][$i]) ? round($data['daily']['rain_sum'][$i], 2) : 0,
                    'windSpeed' => isset($data['daily']['wind_speed_10m_max'][$i]) ? round($data['daily']['wind_speed_10m_max'][$i], 1) : null,
                    'windGust' => isset($data['daily']['wind_gusts_10m_max'][$i]) ? round($data['daily']['wind_gusts_10m_max'][$i], 1) : null,
                    'windDirection' => isset($data['daily']['wind_direction_10m_dominant'][$i]) ? (int)$data['daily']['wind_direction_10m_dominant'][$i] : null,
                    'sunrise' => isset($data['daily']['sunrise'][$i]) ? $data['daily']['sunrise'][$i] : null,
                    'sunset' => isset($data['daily']['sunset'][$i]) ? $data['daily']['sunset'][$i] : null,
                    'uvIndex' => isset($data['daily']['uv_index_max'][$i]) ? round($data['daily']['uv_index_max'][$i], 1) : null
                ];
            }
        }
        
        return $forecast;
    }
    
    /**
     * Get weather description from WMO weather code
     * Based on WMO Weather interpretation codes (WW)
     */
    private function getWeatherDescription($code) {
        $descriptions = [
            0 => 'Clear sky',
            1 => 'Mainly clear',
            2 => 'Partly cloudy',
            3 => 'Overcast',
            45 => 'Fog',
            48 => 'Depositing rime fog',
            51 => 'Light drizzle',
            53 => 'Moderate drizzle',
            55 => 'Dense drizzle',
            56 => 'Light freezing drizzle',
            57 => 'Dense freezing drizzle',
            61 => 'Slight rain',
            63 => 'Moderate rain',
            65 => 'Heavy rain',
            66 => 'Light freezing rain',
            67 => 'Heavy freezing rain',
            71 => 'Slight snow fall',
            73 => 'Moderate snow fall',
            75 => 'Heavy snow fall',
            77 => 'Snow grains',
            80 => 'Slight rain showers',
            81 => 'Moderate rain showers',
            82 => 'Violent rain showers',
            85 => 'Slight snow showers',
            86 => 'Heavy snow showers',
            95 => 'Thunderstorm',
            96 => 'Thunderstorm with slight hail',
            99 => 'Thunderstorm with heavy hail'
        ];
        
        return isset($descriptions[$code]) ? $descriptions[$code] : 'Unknown';
    }
    
    /**
     * Fetch data from API
     */
    private function fetchData($url) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_USERAGENT => $this->userAgent,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json'
            ]
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            throw new Exception("CURL Error: " . $error);
        }
        
        if ($httpCode !== 200) {
            throw new Exception("HTTP Error: " . $httpCode);
        }
        
        $data = json_decode($response, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("JSON Decode Error: " . json_last_error_msg());
        }
        
        if (isset($data['error'])) {
            throw new Exception("API Error: " . ($data['reason'] ?? 'Unknown error'));
        }
        
        return $data;
    }
}


