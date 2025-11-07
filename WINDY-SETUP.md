# Windy API Setup Guide

This guide will help you set up the Windy Map API for the weather map visualization.

## Step 1: Get Your Windy API Key

1. **Visit Windy API Website**
   - Go to: https://api.windy.com/
   - Click on "Get Started" or "Sign Up"

2. **Create an Account**
   - Register for a free account
   - Verify your email address

3. **Get Your API Key**
   - Log in to your Windy account
   - Navigate to "API Keys" or "My API Keys"
   - Create a new API key for "Map Forecast API"
   - Copy your API key (it will look something like: `zXGSFch1PKJIaro6uyVRKgjEa9HOPP5F`)

## Step 2: Configure the API Key

You have **two options** to configure the Windy API key:

### Option A: Using .env File (Recommended)

1. Create a `.env` file in the root directory of your project (if it doesn't exist)
2. Add the following line:
   ```env
   WINDY_MAP_API_KEY=your-api-key-here
   ```
3. Replace `your-api-key-here` with your actual API key from Step 1

**Example:**
```env
WINDY_MAP_API_KEY=zXGSFch1PKJIaro6uyVRKgjEa9HOPP5F
```

### Option B: Direct Configuration in config.php

1. Open `config.php` in a text editor
2. Find the section that says:
   ```php
   $WINDY_MAP_API_KEY = getEnvVar('WINDY_MAP_API_KEY', '');
   ```
3. Change it to:
   ```php
   $WINDY_MAP_API_KEY = getEnvVar('WINDY_MAP_API_KEY', 'your-api-key-here');
   ```
4. Replace `your-api-key-here` with your actual API key

## Step 3: Authorize Your Domain (Important!)

1. Log in to your Windy account
2. Go to API settings
3. Add your domain to the authorized domains list:
   - For local development: `localhost` or `127.0.0.1`
   - For production: your actual domain (e.g., `yourwebsite.com`)
4. Save the settings

**Note:** The API key must be authorized for your domain, otherwise the map will not initialize.

## Step 4: Verify the Setup

1. Clear your browser cache
2. Refresh the page
3. Open the browser console (F12) and check for any error messages
4. The map should load with Windy visualization

## Troubleshooting

### Error: "Failed to initialize map. Please check your Windy API key"

**Possible Causes:**
1. API key not set in `.env` or `config.php`
2. API key not authorized for your domain
3. Invalid API key format
4. API key expired or revoked

**Solutions:**
1. **Check if API key is set:**
   - Verify `.env` file exists and has `WINDY_MAP_API_KEY=your-key`
   - Or check `config.php` has the key configured
   - Make sure there are no extra spaces or quotes around the key

2. **Check domain authorization:**
   - Log in to Windy account
   - Go to API settings
   - Verify your domain is in the authorized list
   - For localhost, make sure `localhost` is authorized

3. **Check API key format:**
   - API key should be a long string (usually 30+ characters)
   - Should not have spaces or special characters
   - Make sure you copied the entire key

4. **Test the API key:**
   - Visit: https://api.windy.com/map-forecast/docs
   - Try the API key in their test interface
   - Verify it works there first

### Error: "Windy API boot() returned null/undefined"

**Solutions:**
1. Check browser console for more details
2. Verify the API key is correct
3. Check if your domain is authorized
4. Try clearing browser cache and localStorage
5. Check if there are any browser extensions blocking the API

### Map Not Loading

**Solutions:**
1. Check if you have internet connection
2. Verify Windy API is not blocked by firewall
3. Check browser console for errors
4. Try using OpenWeatherMap as fallback (automatically falls back if Windy fails)

## Fallback Options

If Windy API is not available, the application will automatically:
1. Try OpenWeatherMap map (if configured)
2. Fall back to basic offline map using OpenStreetMap tiles

## Free Tier Limits

Windy API free tier typically includes:
- Limited API calls per month
- Basic map features
- Some restrictions on usage

Check Windy's current pricing at: https://api.windy.com/

## Support

If you continue to have issues:
1. Check the browser console for detailed error messages
2. Verify your API key at: https://api.windy.com/
3. Check Windy API documentation: https://api.windy.com/map-forecast/docs
4. Make sure your PHP configuration allows reading `.env` files

## Alternative: Use OpenWeatherMap Map

If you don't want to use Windy, you can use OpenWeatherMap's map instead:
1. Make sure `OPENWEATHER_API_KEY` is set in your `.env` file
2. The application will automatically use OpenWeatherMap map if Windy fails

