<?php
/**
 * JMA (Japan Meteorological Agency) API Wrapper
 * Best for Asian typhoon tracking and weather in Japan/Philippines region
 * Parses JMA's public typhoon data feeds
 */

class JMAWeatherAPI {
    private $baseUrl = 'https://www.data.jma.go.jp';
    private $userAgent = 'BayanForecast/1.0 (Weather Monitoring System)';
    
    /**
     * Get typhoon information
     * JMA provides excellent typhoon tracking data for Asia-Pacific region
     */
    public function getTyphoons() {
        $typhoons = [];
        
        try {
            // Method 1: Try parsing JMA typhoon position table
            $typhoons = array_merge($typhoons, $this->getTyphoonFromPositionTable());
            
            // Method 2: Try parsing JMA typhoon bulletins (XML)
            if (empty($typhoons)) {
                $typhoons = array_merge($typhoons, $this->getTyphoonFromBulletins());
            }
        } catch (Exception $e) {
            error_log("JMA Typhoon Error: " . $e->getMessage());
        }
        
        return $typhoons;
    }
    
    /**
     * Get typhoon data from JMA position table
     */
    private function getTyphoonFromPositionTable() {
        $typhoons = [];
        
        try {
            // JMA typhoon position table URL
            $url = $this->baseUrl . '/fcd/yoho/typhoon/position_table.html';
            
            $html = $this->fetchHTML($url);
            
            if ($html) {
                // Parse HTML table for typhoon data
                $typhoons = $this->parsePositionTable($html);
            }
        } catch (Exception $e) {
            error_log("JMA Position Table Error: " . $e->getMessage());
        }
        
        return $typhoons;
    }
    
    /**
     * Get typhoon data from JMA bulletins (XML)
     */
    private function getTyphoonFromBulletins() {
        $typhoons = [];
        
        try {
            // JMA provides XML bulletins for typhoons
            // Try to fetch recent bulletin
            $bulletinUrl = $this->baseUrl . '/fcd/yoho/data/himawari/sat-tc/';
            
            // This would require parsing XML bulletins
            // For now, return empty - can be enhanced with XML parsing
        } catch (Exception $e) {
            error_log("JMA Bulletin Error: " . $e->getMessage());
        }
        
        return $typhoons;
    }
    
    /**
     * Parse JMA position table HTML
     */
    private function parsePositionTable($html) {
        $typhoons = [];
        
        // Use regex or DOM parser to extract typhoon data
        // JMA table format may vary, so this is a basic parser
        
        // Look for typhoon information in the HTML
        // Pattern: Look for coordinates, wind speed, pressure, etc.
        
        // Example pattern matching (adjust based on actual JMA format)
        if (preg_match_all('/typhoon|台風/i', $html, $matches)) {
            // Found typhoon references - parse the table
            // This is a simplified parser - you may need to adjust based on JMA's actual HTML structure
            
            // Try to extract data using DOMDocument
            $dom = new DOMDocument();
            @$dom->loadHTML('<?xml encoding="UTF-8">' . $html);
            $xpath = new DOMXPath($dom);
            
            // Look for tables containing typhoon data
            $tables = $xpath->query("//table[contains(@class, 'typhoon') or contains(@class, 'table')]");
            
            foreach ($tables as $table) {
                $rows = $xpath->query(".//tr", $table);
                
                foreach ($rows as $row) {
                    $cells = $xpath->query(".//td", $row);
                    if ($cells->length >= 5) {
                        // Parse row data
                        $typhoon = $this->parseTableRow($cells, $xpath);
                        if ($typhoon) {
                            $typhoons[] = $typhoon;
                        }
                    }
                }
            }
        }
        
        return $typhoons;
    }
    
    /**
     * Parse a table row for typhoon data
     */
    private function parseTableRow($cells, $xpath) {
        // This is a placeholder - actual parsing depends on JMA's table format
        // You'll need to adjust based on the actual HTML structure
        
        try {
            $data = [];
            $cellIndex = 0;
            
            foreach ($cells as $cell) {
                $text = trim($cell->textContent);
                $data[$cellIndex] = $text;
                $cellIndex++;
            }
            
            // Extract typhoon name (usually in first few columns)
            $name = $data[0] ?? 'Unnamed';
            if (empty($name) || strlen($name) < 2) {
                return null;
            }
            
            // Extract coordinates (look for N, S, E, W patterns)
            $latitude = $this->extractCoordinate($data, 'lat');
            $longitude = $this->extractCoordinate($data, 'lon');
            
            if (!$latitude || !$longitude) {
                return null;
            }
            
            // Extract wind speed (look for numbers with km/h or m/s)
            $windSpeed = $this->extractWindSpeed($data);
            
            // Extract pressure (look for mb or hPa)
            $pressure = $this->extractPressure($data);
            
            // Determine category
            $category = $this->determineCategory($windSpeed);
            
            return [
                'id' => md5($name . $latitude . $longitude),
                'name' => $name,
                'category' => $category,
                'speed' => $windSpeed,
                'pressure' => $pressure,
                'latitude' => $latitude,
                'longitude' => $longitude,
                'movementSpeed' => 0, // May not be in table
                'status' => 'Active',
                'affectedRegions' => [],
                'warnings' => null,
                'lastUpdated' => date('Y-m-d H:i:s'),
                'source' => 'JMA'
            ];
        } catch (Exception $e) {
            error_log("JMA Table Row Parse Error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Extract coordinate from data array
     */
    private function extractCoordinate($data, $type) {
        foreach ($data as $item) {
            if ($type === 'lat') {
                // Look for latitude pattern (N/S followed by number)
                if (preg_match('/(\d+\.?\d*)\s*[°]?\s*[NS]/i', $item, $matches)) {
                    $coord = (float)$matches[1];
                    if (stripos($item, 'S') !== false) {
                        $coord = -$coord;
                    }
                    return $coord;
                }
            } else {
                // Look for longitude pattern (E/W followed by number)
                if (preg_match('/(\d+\.?\d*)\s*[°]?\s*[EW]/i', $item, $matches)) {
                    $coord = (float)$matches[1];
                    if (stripos($item, 'W') !== false) {
                        $coord = -$coord;
                    }
                    // Convert to positive east longitude if needed
                    if ($coord < 0) {
                        $coord = 360 + $coord;
                    }
                    return $coord;
                }
            }
        }
        return null;
    }
    
    /**
     * Extract wind speed from data
     */
    private function extractWindSpeed($data) {
        foreach ($data as $item) {
            // Look for wind speed pattern (number with km/h or m/s)
            if (preg_match('/(\d+)\s*(?:km\/h|kmh|m\/s|ms|kt|knots)/i', $item, $matches)) {
                $speed = (int)$matches[1];
                $unit = strtolower($matches[2] ?? '');
                
                // Convert to km/h
                if (stripos($unit, 'm/s') !== false || stripos($unit, 'ms') !== false) {
                    $speed = $speed * 3.6; // m/s to km/h
                } elseif (stripos($unit, 'kt') !== false || stripos($unit, 'knots') !== false) {
                    $speed = $speed * 1.852; // knots to km/h
                }
                
                return (int)$speed;
            }
        }
        return 0;
    }
    
    /**
     * Extract pressure from data
     */
    private function extractPressure($data) {
        foreach ($data as $item) {
            // Look for pressure pattern (number with mb or hPa)
            if (preg_match('/(\d{3,4})\s*(?:mb|hPa|hpa)/i', $item, $matches)) {
                return (int)$matches[1];
            }
        }
        return null;
    }
    
    /**
     * Determine typhoon category from wind speed
     */
    private function determineCategory($windSpeed) {
        // JMA classification
        if ($windSpeed >= 194) {
            return 'Violent Typhoon';
        } elseif ($windSpeed >= 158) {
            return 'Very Strong Typhoon';
        } elseif ($windSpeed >= 118) {
            return 'Typhoon';
        } elseif ($windSpeed >= 88) {
            return 'Severe Tropical Storm';
        } elseif ($windSpeed >= 63) {
            return 'Tropical Storm';
        } else {
            return 'Tropical Depression';
        }
    }
    
    /**
     * Fetch HTML content
     */
    private function fetchHTML($url) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_USERAGENT => $this->userAgent,
            CURLOPT_HTTPHEADER => [
                'Accept: text/html,application/xhtml+xml',
                'User-Agent: ' . $this->userAgent,
                'Accept-Language: en-US,en;q=0.9,ja;q=0.8'
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
            if ($httpCode === 404) {
                return null;
            }
            throw new Exception("HTTP Error $httpCode");
        }
        
        return $response;
    }
    
    /**
     * Get weather alerts for Japan/Philippines region
     */
    public function getAlerts() {
        // JMA provides weather warnings and advisories
        // These are typically in Japanese/XML format
        // Can be implemented if needed
        return [];
    }
}
?>
