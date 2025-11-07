# How to Fix "Failed to initialize map" Error

If you're still seeing the error message about Windy API key even after removing Windy, it's likely due to **browser cache**. Follow these steps to clear it:

## Quick Fix - Clear Browser Cache

### Option 1: Hard Refresh (Recommended)
1. **Chrome/Edge/Firefox**: Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. **Or**: Press `Ctrl + F5` (Windows)
3. This forces the browser to reload all files from the server

### Option 2: Clear Cache Manually

**Chrome/Edge:**
1. Press `F12` to open Developer Tools
2. Right-click on the refresh button (next to address bar)
3. Select "Empty Cache and Hard Reload"

**Firefox:**
1. Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
2. Select "Cached Web Content"
3. Click "Clear Now"
4. Refresh the page

**Safari:**
1. Go to Safari > Preferences > Advanced
2. Enable "Show Develop menu"
3. Go to Develop > Empty Caches
4. Refresh the page

### Option 3: Clear Service Worker Cache

1. Open Developer Tools (`F12`)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click on **Service Workers** (left sidebar)
4. Click **Unregister** for any registered service workers
5. Go to **Cache Storage** (left sidebar)
6. Delete all cache entries
7. Refresh the page

### Option 4: Clear All Site Data

1. Open Developer Tools (`F12`)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Clear site data** button
4. Check all boxes
5. Click **Clear site data**
6. Refresh the page

### Option 5: Use Incognito/Private Mode

1. Open a new Incognito/Private window
2. Navigate to your site
3. This bypasses all cache

## Verify the Fix

After clearing the cache, you should see:
- ✅ Map initializes with OpenWeatherMap (not Windy)
- ✅ No error messages about Windy API key
- ✅ Console shows "OpenWeatherMap map initialized successfully"

## Still Not Working?

If the error persists after clearing cache:

1. **Check the browser console** (`F12` > Console tab)
   - Look for error messages
   - Check which JavaScript files are being loaded

2. **Check Network tab** (`F12` > Network tab)
   - Refresh the page
   - Look for `script.js` and `openweathermap-map.js`
   - Make sure they're loading the latest version
   - Check if `windy-map.js` is still being requested (it shouldn't be)

3. **Verify files are updated:**
   - Check `index.html` - should NOT have `windy-map.js` script tag
   - Check `script.js` - should NOT have Windy initialization code
   - Check `config.php` - should NOT have Windy API key variables

4. **Check if files are being served correctly:**
   - Make sure your web server is serving the updated files
   - If using a local server, restart it
   - Check file modification dates

## Manual Cache Clear Script

You can also run this in the browser console (`F12` > Console):

```javascript
// Clear all caches
caches.keys().then(names => {
    names.forEach(name => caches.delete(name));
    console.log('All caches cleared');
});

// Unregister all service workers
navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.unregister());
    console.log('All service workers unregistered');
});

// Clear localStorage
localStorage.clear();
console.log('localStorage cleared');

// Clear sessionStorage
sessionStorage.clear();
console.log('sessionStorage cleared');

// Reload page
location.reload(true);
```

## Prevention

The code has been updated to automatically clear old caches on page load. After clearing your cache once, this should not happen again.

