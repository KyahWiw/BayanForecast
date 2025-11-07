<?php
/**
 * NOAA Weather API Wrapper
 * National Oceanic and Atmospheric Administration
 * Free public API - No key required
 * Provides tropical cyclone tracking data
 */

class NOAAWeatherAPI {
    private $baseUrl = 'https://api.weather.gov';
    private $nhcUrl = 'https://www.nhc.noaa.gov';
    private $userAgent = 'BayanForecast/1.0 (Weather Monitoring System)';
    
    /**
     * Get tropical cyclone information
     * NOAA provides excellent tropical cyclone tracking data
     */
    public function getTropicalCyclones() {
        $typhoons = [];
        
        try {
            // Method 1: Try NHC Active Storms Feed (JSON)
            $typhoons = array_merge($typhoons, $this->getNHCActiveStorms());
            
            // Method 2: Try NOAA Products API for tropical cyclone products
            if (empty($typhoons)) {
                $typhoons = array_merge($typhoons, $this->getTropicalCycloneProducts());
            }
        } catch (Exception $e) {
            error_log("NOAA Tropical Cyclone Error: " . $e->getMessage());
        }
        
        return $typhoons;
    }
    
    /**
     * Get active storms from NHC JSON feed
     */
    private function getNHCActiveStorms() {
        $typhoons = [];
        
        try {
            // NHC provides JSON feeds for active storms
            $url = $this->nhcUrl . '/json/active_atl.json';
            $atlanticStorms = $this->makeRequest($url, [], 'application/json');
            
            if (isset($atlanticStorms['storms']) && is_array($atlanticStorms['storms'])) {
                foreach ($atlanticStorms['storms'] as $storm) {
                    $typhoon = $this->parseNHCStorm($storm);
                    if ($typhoon) {
                        $typhoons[] = $typhoon;
                    }
                }
            }
            
            // Also check Pacific storms
            $url = $this->nhcUrl . '/json/active_epac.json';
            $pacificStorms = $this->makeRequest($url, [], 'application/json');
            
            if (isset($pacificStorms['storms']) && is_array($pacificStorms['storms'])) {
                foreach ($pacificStorms['storms'] as $storm) {
                    $typhoon = $this->parseNHCStorm($storm);
                    if ($typhoon) {
                        $typhoons[] = $typhoon;
                    }
                }
            }
        } catch (Exception $e) {
            error_log("NHC Active Storms Error: " . $e->getMessage());
        }
        
        return $typhoons;
    }
    
    /**
     * Get tropical cyclone products from NOAA API
     */
    private function getTropicalCycloneProducts() {
        $typhoons = [];
        
        try {
            // Get product types
            $productsUrl = $this->baseUrl . '/products/types';
            $products = $this->makeRequest($productsUrl);
            
            // Look for tropical cyclone related products
            if (isset($products['@graph']) && is_array($products['@graph'])) {
                foreach ($products['@graph'] as $productType) {
                    if (isset($productType['id']) && 
                        (stripos($productType['id'], 'tropical') !== false || 
                         stripos($productType['id'], 'hurricane') !== false ||
                         stripos($productType['id'], 'typhoon') !== false)) {
                        
                        // Get active products for this type
                        $productUrl = $this->baseUrl . '/products/types/' . urlencode($productType['id']);
                        $activeProducts = $this->makeRequest($productUrl);
                        
                        if (isset($activeProducts['@graph'])) {
                            foreach ($activeProducts['@graph'] as $product) {
                                $typhoon = $this->parseProduct($product);
                                if ($typhoon) {
                                    $typhoons[] = $typhoon;
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception $e) {
            error_log("NOAA Products Error: " . $e->getMessage());
        }
        
        return $typhoons;
    }
    
    /**
     * Parse NHC storm data
     */
    private function parseNHCStorm($storm) {
        if (!isset($storm['id']) || !isset($storm['name'])) {
            return null;
        }
        
        // Extract position from forecast or current position
        $latitude = null;
        $longitude = null;
        
        if (isset($storm['forecast'][0]['lat'])) {
            $latitude = (float)$storm['forecast'][0]['lat'];
        } elseif (isset($storm['lat'])) {
            $latitude = (float)$storm['lat'];
        }
        
        if (isset($storm['forecast'][0]['lon'])) {
            $longitude = (float)$storm['forecast'][0]['lon'];
        } elseif (isset($storm['lon'])) {
            $longitude = (float)$storm['lon'];
        }
        
        // Convert longitude if negative (Western hemisphere)
        if ($longitude < 0) {
            $longitude = 360 + $longitude;
        }
        
        // Extract wind speed (convert from knots to km/h if needed)
        $windSpeed = 0;
        if (isset($storm['windSpeed'])) {
            $windSpeed = (int)$storm['windSpeed'];
            // If in knots, convert to km/h (1 knot = 1.852 km/h)
            if ($windSpeed < 200) { // Likely in knots
                $windSpeed = (int)($windSpeed * 1.852);
            }
        }
        
        // Extract pressure
        $pressure = null;
        if (isset($storm['pressure'])) {
            $pressure = (int)$storm['pressure'];
        }
        
        // Determine category
        $category = $this->determineCategory($windSpeed);
        
        // Determine status
        $status = 'Active';
        if (isset($storm['status'])) {
            $status = $storm['status'];
        }
        
        return [
            'id' => $storm['id'] ?? md5($storm['name'] . time()),
            'name' => $storm['name'],
            'category' => $category,
            'speed' => $windSpeed,
            'pressure' => $pressure,
            'latitude' => $latitude,
            'longitude' => $longitude,
            'movementSpeed' => isset($storm['speed']) ? (int)$storm['speed'] : 0,
            'status' => $status,
            'affectedRegions' => isset($storm['areas']) ? $storm['areas'] : [],
            'warnings' => isset($storm['advisory']) ? $storm['advisory'] : null,
            'lastUpdated' => isset($storm['time']) ? date('Y-m-d H:i:s', strtotime($storm['time'])) : date('Y-m-d H:i:s'),
            'source' => 'NOAA'
        ];
    }
    
    /**
     * Parse product data
     */
    private function parseProduct($product) {
        // This is a simplified parser - actual NOAA products may vary
        // You may need to fetch and parse the actual product content
        return null;
    }
    
    /**
     * Determine typhoon category from wind speed
     */
    private function determineCategory($windSpeed) {
        // Saffir-Simpson scale
        if ($windSpeed >= 252) {
            return 'Super Typhoon';
        } elseif ($windSpeed >= 209) {
            return 'Category 5';
        } elseif ($windSpeed >= 178) {
            return 'Category 4';
        } elseif ($windSpeed >= 154) {
            return 'Category 3';
        } elseif ($windSpeed >= 119) {
            return 'Category 2';
        } elseif ($windSpeed >= 63) {
            return 'Category 1';
        } elseif ($windSpeed >= 39) {
            return 'Tropical Storm';
        } else {
            return 'Tropical Depression';
        }
    }
    
    /**
     * Get weather alerts (US only)
     */
    public function getAlerts($latitude = null, $longitude = null) {
        if (!$latitude || !$longitude) {
            // Default to Manila coordinates for Philippines
            $latitude = 14.5995;
            $longitude = 120.9842;
        }
        
        try {
            // Get alerts for a point
            $url = $this->baseUrl . "/alerts/active";
            $params = [
                'point' => "$latitude,$longitude"
            ];
            
            $response = $this->makeRequest($url, $params);
            
            if (isset($response['features'])) {
                return $this->formatAlertsData($response['features']);
            }
        } catch (Exception $e) {
            error_log("NOAA Alerts Error: " . $e->getMessage());
        }
        
        return [];
    }
    
    /**
     * Format alerts data
     */
    private function formatAlertsData($features) {
        $alerts = [];
        
        foreach ($features as $feature) {
            $properties = $feature['properties'];
            $alerts[] = [
                'id' => $properties['id'] ?? md5(json_encode($feature)),
                'type' => $this->determineAlertType($properties['severity'] ?? 'unknown'),
                'title' => $properties['event'] ?? 'Weather Alert',
                'message' => $properties['headline'] ?? $properties['description'] ?? '',
                'timestamp' => isset($properties['sent']) ? date('Y-m-d H:i:s', strtotime($properties['sent'])) : date('Y-m-d H:i:s'),
                'severity' => $properties['severity'] ?? 'Unknown'
            ];
        }
        
        return $alerts;
    }
    
    /**
     * Determine alert type from severity
     */
    private function determineAlertType($severity) {
        $severity = strtolower($severity);
        
        if (in_array($severity, ['extreme', 'severe'])) {
            return 'critical';
        } elseif (in_array($severity, ['moderate', 'minor'])) {
            return 'warning';
        }
        
        return 'info';
    }
    
    /**
     * Make HTTP request
     */
    private function makeRequest($url, $params = [], $accept = 'application/geo+json') {
        if (!empty($params)) {
            $queryString = http_build_query($params);
            $url .= '?' . $queryString;
        }
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_USERAGENT => $this->userAgent,
            CURLOPT_HTTPHEADER => [
                'Accept: ' . $accept,
                'User-Agent: ' . $this->userAgent
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
            // Don't throw for 404 - just return empty
            if ($httpCode === 404) {
                return [];
            }
            throw new Exception("HTTP Error $httpCode");
        }
        
        return json_decode($response, true);
    }
}
?>
