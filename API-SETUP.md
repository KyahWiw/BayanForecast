# API Setup Guide

BayanForecast integrates with multiple weather APIs for real-time monitoring. Follow this guide to set up the APIs.

## Required APIs

### 1. OpenWeatherMap API (Primary - Required)

**Why:** Primary source for weather data, forecasts, and alerts for the Philippines.

**Setup Steps:**
1. Go to https://openweathermap.org/api
2. Click "Sign Up" to create a free account
3. After registration, go to "API keys" in your account dashboard
4. Copy your API key
5. Open `config.php` and replace `YOUR_OPENWEATHER_API_KEY_HERE` with your actual API key:
   ```php
   $OPENWEATHER_API_KEY = 'your-actual-api-key-here';
   ```

**Free Tier Limits:**
- 60 calls/minute
- 1,000,000 calls/month
- Current weather data
- 5-day/3-hour forecast
- Weather alerts (limited regions)

**API Documentation:** https://openweathermap.org/api

---

### 2. NOAA Weather API (Optional - For Enhanced Data)

**Why:** Excellent for tropical cyclone tracking and weather alerts (though limited to USA coverage).

**Setup Steps:**
1. No API key required - it's a free public API
2. Already enabled by default in `config.php`
3. The API will automatically be used for typhoon/tropical cyclone data

**Note:** NOAA primarily covers USA, but provides excellent tropical cyclone data that can be useful for monitoring systems affecting the Philippines.

**API Documentation:** https://www.weather.gov/documentation/services-web-api

---

### 3. JMA (Japan Meteorological Agency) API (Optional)

**Why:** Best source for Asian typhoon tracking, especially relevant for the Philippines.

**Setup Steps:**
1. No API key required
2. Already enabled by default in `config.php`
3. Note: JMA doesn't have an official public API, but we use their public data feeds

**Current Status:** 
- Placeholder implementation
- Full integration requires parsing JMA's XML/RSS data formats
- Can be enhanced in future updates

**JMA Website:** https://www.data.jma.go.jp

---

## Configuration File

The main configuration is in `config.php`:

```php
// OpenWeatherMap (Required)
$OPENWEATHER_API_KEY = 'your-api-key-here';
$OPENWEATHER_API_ENABLED = true;

// NOAA (Optional)
$NOAA_API_ENABLED = true;

// JMA (Optional)
$JMA_API_ENABLED = true;
```

## Testing the APIs

### Test OpenWeatherMap API

```bash
# Test weather endpoint
curl "http://localhost/api.php?action=weather&location=Manila"

# Test forecast endpoint
curl "http://localhost/api.php?action=forecast&location=Manila"

# Test alerts endpoint
curl "http://localhost/api.php?action=alerts&location=Manila"
```

### Verify API Key

If you see errors like "Invalid API key" or "Failed to fetch weather data", check:
1. Your API key is correctly set in `config.php`
2. Your API key is activated (may take a few minutes after signup)
3. You haven't exceeded the free tier limits

## API Usage Strategy

### Primary Flow:
1. **Weather Data:** OpenWeatherMap → Fallback to mock data
2. **Forecast Data:** OpenWeatherMap → Fallback to mock data
3. **Alerts:** OpenWeatherMap + NOAA → Fallback to mock data
4. **Typhoon Data:** JMA + NOAA → Fallback to mock data

### Error Handling:
- If an API fails, the system automatically falls back to mock data
- Errors are logged to `logs/error.log` (if logging is enabled)
- The frontend will continue to work even if APIs fail

## Rate Limiting & Caching

### Built-in Protection:
- API responses are cached to reduce API calls
- Frontend updates every 30 seconds (configurable)
- Backend can implement additional caching if needed

### Recommended Settings:
- Weather updates: Every 30 seconds
- Forecast updates: Every 5 minutes
- Typhoon updates: Every 1 minute
- Alerts updates: Every 30 seconds

## Troubleshooting

### "Failed to fetch weather data"
**Solution:** 
1. Check your OpenWeatherMap API key
2. Verify internet connection
3. Check API quota limits

### "Location not found"
**Solution:**
1. Use full location name (e.g., "Manila, PH")
2. Check spelling
3. Use major city names

### API Rate Limit Exceeded
**Solution:**
1. Reduce update frequency in `script.js`
2. Implement better caching
3. Upgrade OpenWeatherMap plan (if needed)

## Security Best Practices

1. **Never commit API keys to Git**
   - Add `config.php` to `.gitignore` if it contains real keys
   - Use environment variables in production

2. **Protect API Keys**
   - Keep your API keys private
   - Rotate keys if compromised
   - Use different keys for development/production

3. **Monitor API Usage**
   - Check OpenWeatherMap dashboard regularly
   - Set up alerts for quota limits
   - Monitor for unexpected usage

## Next Steps

1. ✅ Get OpenWeatherMap API key
2. ✅ Configure `config.php`
3. ✅ Test API endpoints
4. ✅ Verify real-time updates work
5. (Optional) Enhance JMA integration for better typhoon tracking
6. (Optional) Set up additional data sources

## Support

For API-specific issues:
- **OpenWeatherMap:** https://openweathermap.org/faq
- **NOAA:** https://www.weather.gov/contact
- **JMA:** https://www.jma.go.jp/jma/indexe.html

For BayanForecast issues, check the main README.md file.

