# BayanForecast - Quick Start Guide 🚀

## Setup in 5 Minutes

### Step 1: Get Your API Key (2 minutes)
1. Go to https://openweathermap.org/api
2. Click "Sign Up" (top right)
3. Create a free account
4. Go to "API keys" in your account
5. Copy your API key

### Step 2: Configure the Website (1 minute)
1. Open `config.php` in a text editor
2. Find this line:
   ```php
   $OPENWEATHER_API_KEY = 'YOUR_OPENWEATHER_API_KEY_HERE';
   ```
3. Replace `YOUR_OPENWEATHER_API_KEY_HERE` with your actual API key:
   ```php
   $OPENWEATHER_API_KEY = 'abc123def456...'; // Your key here
   ```
4. Save the file

### Step 3: Run the Website (2 minutes)

#### Option A: Using XAMPP (Windows)
1. Install XAMPP from https://www.apachefriends.org/
2. Copy BayanForecast folder to `C:\xampp\htdocs\`
3. Start XAMPP Control Panel
4. Click "Start" for Apache
5. Open browser: `http://localhost/BayanForecast/`

#### Option B: Using WAMP (Windows)
1. Install WAMP from https://www.wampserver.com/
2. Copy BayanForecast folder to `C:\wamp64\www\`
3. Start WAMP
4. Open browser: `http://localhost/BayanForecast/`

#### Option C: Using PHP Built-in Server (Any OS)
1. Open Terminal/Command Prompt
2. Navigate to BayanForecast folder:
   ```bash
   cd C:\Users\JHON FRANCIS GARAPAN\Documents\BayanForecast
   ```
3. Run:
   ```bash
   php -S localhost:8000
   ```
4. Open browser: `http://localhost:8000/`

### Step 4: Test the Website
1. You should see the BayanForecast homepage
2. The default location (Manila) weather should load automatically
3. Try searching for other cities (e.g., "Cebu", "Davao", "Baguio")
4. Check the 7-day forecast section
5. Toggle dark/light theme using the moon/sun icon

## 🎉 That's It!

Your weather monitoring system is now running!

## Common Issues

### ❌ "Failed to fetch weather data"
**Fix:** Check if your API key is correct in `config.php`

### ❌ Blank page or errors
**Fix:** Make sure PHP is installed and running

### ❌ API key not working
**Fix:** 
- Wait 10-15 minutes after creating your API key (activation time)
- Verify you copied the complete key

### ❌ Location not found
**Fix:** 
- Try full city names (e.g., "Quezon City" not just "Quezon")
- Use major city names

## Next Steps

- [ ] Bookmark `http://localhost/BayanForecast/` or `http://localhost:8000/`
- [ ] Try different locations across the Philippines
- [ ] Test the dark theme toggle
- [ ] Check the 7-day forecast
- [ ] Read the full README.md for advanced features

## Need Help?

Check the detailed README.md file for:
- Full feature list
- Customization options
- Troubleshooting guide
- API documentation

## 📊 Free API Limits

OpenWeatherMap Free Tier:
- ✅ 60 calls per minute
- ✅ 1,000,000 calls per month
- ✅ Current weather data
- ✅ 5-day forecast
- ✅ Weather alerts (limited)

**This is more than enough for personal use!**

---

Enjoy using BayanForecast! 🌦️🇵🇭
