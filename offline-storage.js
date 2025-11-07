// ===========================
// Offline Data Storage Manager
// Uses IndexedDB for larger data, localStorage for smaller data
// ===========================

const DB_NAME = 'BayanForecastDB';
const DB_VERSION = 1;
let db = null;

// ===========================
// Initialize IndexedDB
// ===========================
async function initIndexedDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }
        
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
            console.error('[Offline Storage] Failed to open IndexedDB:', request.error);
            reject(request.error);
        };
        
        request.onsuccess = () => {
            db = request.result;
            console.log('[Offline Storage] IndexedDB opened successfully');
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            
            // Create object stores if they don't exist
            if (!database.objectStoreNames.contains('weather')) {
                const weatherStore = database.createObjectStore('weather', { keyPath: 'location' });
                weatherStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
            
            if (!database.objectStoreNames.contains('forecast')) {
                const forecastStore = database.createObjectStore('forecast', { keyPath: 'location' });
                forecastStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
            
            if (!database.objectStoreNames.contains('typhoon')) {
                const typhoonStore = database.createObjectStore('typhoon', { keyPath: 'id', autoIncrement: true });
                typhoonStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
            
            if (!database.objectStoreNames.contains('alerts')) {
                const alertsStore = database.createObjectStore('alerts', { keyPath: 'id', autoIncrement: true });
                alertsStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
            
            console.log('[Offline Storage] IndexedDB schema created');
        };
    });
}

// ===========================
// Save Weather Data
// ===========================
async function saveWeatherData(location, data) {
    try {
        await initIndexedDB();
        
        const transaction = db.transaction(['weather'], 'readwrite');
        const store = transaction.objectStore('weather');
        
        const weatherRecord = {
            location: location,
            data: data,
            timestamp: new Date().toISOString()
        };
        
        await store.put(weatherRecord);
        
        // Also save to localStorage for quick access
        localStorage.setItem(`weather_${location}`, JSON.stringify(weatherRecord));
        localStorage.setItem('weather_lastUpdate', new Date().toISOString());
        
        console.log('[Offline Storage] Weather data saved for:', location);
    } catch (error) {
        console.error('[Offline Storage] Failed to save weather data:', error);
    }
}

// ===========================
// Get Weather Data
// ===========================
async function getWeatherData(location) {
    try {
        // Try localStorage first (faster)
        const cached = localStorage.getItem(`weather_${location}`);
        if (cached) {
            const data = JSON.parse(cached);
            // Check if data is less than 1 hour old
            const age = Date.now() - new Date(data.timestamp).getTime();
            if (age < 60 * 60 * 1000) {
                return data.data;
            }
        }
        
        // Try IndexedDB
        await initIndexedDB();
        const transaction = db.transaction(['weather'], 'readonly');
        const store = transaction.objectStore('weather');
        const request = store.get(location);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                if (request.result) {
                    const age = Date.now() - new Date(request.result.timestamp).getTime();
                    if (age < 60 * 60 * 1000) { // 1 hour
                        resolve(request.result.data);
                    } else {
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    } catch (error) {
        console.error('[Offline Storage] Failed to get weather data:', error);
        return null;
    }
}

// ===========================
// Save Forecast Data
// ===========================
async function saveForecastData(location, data) {
    try {
        await initIndexedDB();
        
        const transaction = db.transaction(['forecast'], 'readwrite');
        const store = transaction.objectStore('forecast');
        
        const forecastRecord = {
            location: location,
            data: data,
            timestamp: new Date().toISOString()
        };
        
        await store.put(forecastRecord);
        localStorage.setItem(`forecast_${location}`, JSON.stringify(forecastRecord));
        
        console.log('[Offline Storage] Forecast data saved for:', location);
    } catch (error) {
        console.error('[Offline Storage] Failed to save forecast data:', error);
    }
}

// ===========================
// Get Forecast Data
// ===========================
async function getForecastData(location) {
    try {
        const cached = localStorage.getItem(`forecast_${location}`);
        if (cached) {
            const data = JSON.parse(cached);
            const age = Date.now() - new Date(data.timestamp).getTime();
            if (age < 3 * 60 * 60 * 1000) { // 3 hours
                return data.data;
            }
        }
        
        await initIndexedDB();
        const transaction = db.transaction(['forecast'], 'readonly');
        const store = transaction.objectStore('forecast');
        const request = store.get(location);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                if (request.result) {
                    const age = Date.now() - new Date(request.result.timestamp).getTime();
                    if (age < 3 * 60 * 60 * 1000) {
                        resolve(request.result.data);
                    } else {
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('[Offline Storage] Failed to get forecast data:', error);
        return null;
    }
}

// ===========================
// Save Typhoon Data
// ===========================
async function saveTyphoonData(data) {
    try {
        await initIndexedDB();
        
        const transaction = db.transaction(['typhoon'], 'readwrite');
        const store = transaction.objectStore('typhoon');
        
        // Clear old data
        await store.clear();
        
        // Save new data
        const typhoonRecord = {
            data: data,
            timestamp: new Date().toISOString()
        };
        
        await store.add(typhoonRecord);
        localStorage.setItem('typhoon_data', JSON.stringify(typhoonRecord));
        localStorage.setItem('typhoon_lastUpdate', new Date().toISOString());
        
        console.log('[Offline Storage] Typhoon data saved');
    } catch (error) {
        console.error('[Offline Storage] Failed to save typhoon data:', error);
    }
}

// ===========================
// Get Typhoon Data
// ===========================
async function getTyphoonData() {
    try {
        const cached = localStorage.getItem('typhoon_data');
        if (cached) {
            const data = JSON.parse(cached);
            const age = Date.now() - new Date(data.timestamp).getTime();
            if (age < 30 * 60 * 1000) { // 30 minutes
                return data.data;
            }
        }
        
        await initIndexedDB();
        const transaction = db.transaction(['typhoon'], 'readonly');
        const store = transaction.objectStore('typhoon');
        const index = store.index('timestamp');
        const request = index.openCursor(null, 'prev'); // Get most recent
        
        return new Promise((resolve, reject) => {
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    const age = Date.now() - new Date(cursor.value.timestamp).getTime();
                    if (age < 30 * 60 * 1000) {
                        resolve(cursor.value.data);
                    } else {
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('[Offline Storage] Failed to get typhoon data:', error);
        return null;
    }
}

// ===========================
// Save Alerts Data
// ===========================
async function saveAlertsData(data) {
    try {
        await initIndexedDB();
        
        const transaction = db.transaction(['alerts'], 'readwrite');
        const store = transaction.objectStore('alerts');
        
        // Clear old alerts
        await store.clear();
        
        // Save new alerts
        data.forEach((alert, index) => {
            const alertRecord = {
                ...alert,
                timestamp: new Date().toISOString()
            };
            store.add(alertRecord);
        });
        
        localStorage.setItem('alerts_data', JSON.stringify(data));
        localStorage.setItem('alerts_lastUpdate', new Date().toISOString());
        
        console.log('[Offline Storage] Alerts data saved');
    } catch (error) {
        console.error('[Offline Storage] Failed to save alerts data:', error);
    }
}

// ===========================
// Get Alerts Data
// ===========================
async function getAlertsData() {
    try {
        const cached = localStorage.getItem('alerts_data');
        if (cached) {
            const data = JSON.parse(cached);
            return data;
        }
        
        await initIndexedDB();
        const transaction = db.transaction(['alerts'], 'readonly');
        const store = transaction.objectStore('alerts');
        const request = store.getAll();
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                resolve(request.result || []);
            };
            
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('[Offline Storage] Failed to get alerts data:', error);
        return [];
    }
}

// ===========================
// Clear Old Data
// ===========================
async function clearOldData(maxAge = 7 * 24 * 60 * 60 * 1000) {
    try {
        await initIndexedDB();
        const cutoff = new Date(Date.now() - maxAge).toISOString();
        
        // Clear old weather data
        const weatherTransaction = db.transaction(['weather'], 'readwrite');
        const weatherStore = weatherTransaction.objectStore('weather');
        const weatherIndex = weatherStore.index('timestamp');
        const weatherRequest = weatherIndex.openCursor();
        
        weatherRequest.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                if (cursor.value.timestamp < cutoff) {
                    cursor.delete();
                }
                cursor.continue();
            }
        };
        
        console.log('[Offline Storage] Old data cleared');
    } catch (error) {
        console.error('[Offline Storage] Failed to clear old data:', error);
    }
}

// ===========================
// Export Functions
// ===========================
if (typeof window !== 'undefined') {
    window.OfflineStorage = {
        init: initIndexedDB,
        saveWeather: saveWeatherData,
        getWeather: getWeatherData,
        saveForecast: saveForecastData,
        getForecast: getForecastData,
        saveTyphoon: saveTyphoonData,
        getTyphoon: getTyphoonData,
        saveAlerts: saveAlertsData,
        getAlerts: getAlertsData,
        clearOld: clearOldData
    };
}

