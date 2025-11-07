# 🏗️ BayanForecast - System Architecture

## Project Overview

```
┌─────────────────────────────────────────────────────────┐
│         BAYANFORECAST WEATHER MONITORING SYSTEM         │
│              Real-time Typhoon & Weather Tracking       │
└─────────────────────────────────────────────────────────┘
```

## System Architecture

```
┌────────────────────────────────────────────────────────────┐
│                      WEB BROWSER                          │
│  (Chrome, Firefox, Safari, Edge, Mobile Browsers)         │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│                   FRONTEND LAYER                           │
├────────────────────────────────────────────────────────────┤
│  • index.html  - HTML Structure & Layout                  │
│  • styles.css  - CSS Styling & Responsive Design          │
│  • script.js   - JavaScript Logic & DOM Manipulation      │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│                    COMMUNICATION                           │
│        (AJAX/Fetch API - HTTP/HTTPS Requests)             │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│                    BACKEND LAYER                           │
├────────────────────────────────────────────────────────────┤
│  • api.php     - API Endpoints & Business Logic           │
│  • config.php  - Configuration & Constants                │
│  • Weather API - External Weather Data (Optional)         │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│                    DATA LAYER                              │
├────────────────────────────────────────────────────────────┤
│  • Database    - MySQL/MariaDB (Optional)                 │
│  • Cache       - Temporary Data Storage                   │
│  • Mock Data   - Built-in Sample Data                     │
└────────────────────────────────────────────────────────────┘
```

## File Structure & Relationships

```
BayanForecast/
│
├── Frontend (Client-Side)
│   ├── index.html        ← HTML Structure
│   │   └── Includes: styles.css & script.js
│   │
│   ├── styles.css        ← All Styling
│   │   └── Contains: Responsive Design, Dark Mode, Animations
│   │
│   └── script.js         ← All Interactivity
│       └── Contains: Event Handlers, API Calls, Data Display
│
├── Backend (Server-Side)
│   ├── api.php           ← REST API Endpoints
│   │   ├── /api.php?action=weather
│   │   ├── /api.php?action=typhoon
│   │   ├── /api.php?action=forecast
│   │   └── /api.php?action=alerts
│   │
│   └── config.php        ← Configuration & Constants
│       └── Contains: Database Settings, API Keys, Thresholds
│
├── Configuration
│   ├── config.example.php ← Template Configuration
│   └── .gitignore        ← Git Ignore Rules
│
└── Documentation
    ├── README.md          ← Full Documentation
    ├── QUICKSTART.md      ← 5-Minute Setup Guide
    ├── INSTALLATION.md    ← Installation Instructions
    └── PROJECT-SUMMARY.md ← Project Overview
```

## Data Flow

```
┌─────────────┐
│   Browser   │
│  (Client)   │
└──────┬──────┘
       │
       │ User Input
       │ (Search, Click)
       ↓
┌─────────────────────┐
│   script.js         │
│ • Validate Input    │
│ • Format Data       │
│ • Create Request    │
└──────┬──────────────┘
       │
       │ HTTP Request
       │ (GET/POST)
       ↓
┌─────────────────────┐
│   api.php           │
│ • Route Request     │
│ • Process Data      │
│ • Query Data        │
│ • Format Response   │
└──────┬──────────────┘
       │
       │ JSON Response
       ↓
┌─────────────────────┐
│   script.js         │
│ • Parse JSON        │
│ • Update DOM        │
│ • Show Data         │
│ • Update Display    │
└──────┬──────────────┘
       │
       │ Rendered HTML
       ↓
┌─────────────┐
│   Browser   │
│   Display   │
└─────────────┘
```

## Component Breakdown

### 1. Frontend (Client-Side)

#### HTML Structure (`index.html`)
```
Header
├── Logo
├── Navigation
└── Theme Toggle

Hero Section
└── Search Bar

Main Sections
├── Current Weather
├── Typhoon Tracker
├── 7-Day Forecast
├── Weather Alerts
└── Footer
```

#### Styling (`styles.css`)
```
CSS Variables
├── Colors
├── Shadows
├── Transitions
└── Spacing

Responsive Design
├── Desktop (1024px+)
├── Tablet (768px-1023px)
└── Mobile (320px-767px)

Features
├── Dark Mode
├── Animations
├── Flexbox/Grid
└── Media Queries
```

#### JavaScript (`script.js`)
```
Configuration
├── API Settings
├── Default Values
└── Constants

State Management
├── Current Location
├── Weather Data
├── Typhoon Data
└── Theme Preference

Event Handlers
├── Search
├── Navigation
├── Theme Toggle
└── Updates

Display Functions
├── Weather
├── Typhoons
├── Forecast
└── Alerts
```

### 2. Backend (Server-Side)

#### API (`api.php`)
```
Endpoints
├── /weather      - Current weather data
├── /typhoon      - Active typhoons
├── /forecast     - 7-day forecast
└── /alerts       - Weather alerts

Functions
├── Generate Mock Data
├── Process Requests
├── Format Responses
└── Error Handling
```

#### Configuration (`config.php`)
```
Settings
├── Database Configuration
├── API Keys
├── Thresholds
├── Feature Flags
└── Logging
```

## Key Features & Implementation

### Feature: Weather Display
```
user enters city → search triggered → api.php receives request
→ generates weather data → returns JSON → script.js displays → UI updates
```

### Feature: Dark Mode
```
user clicks toggle → theme stored in localStorage → CSS switches
→ body.dark-theme class applied → colors updated → persists on refresh
```

### Feature: Auto-Update
```
page loads → setInterval starts → every 10 minutes → api call
→ new data → DOM updates → displayed without page refresh
```

### Feature: Responsive Design
```
screen size detected → CSS media query triggered
→ layout adjusted → elements reflow → optimal display on any device
```

## Database Schema (Optional)

```sql
Weather Table
├── id (PK)
├── location
├── temperature
├── condition
├── humidity
├── windSpeed
└── timestamp

Typhoons Table
├── id (PK)
├── name
├── category
├── speed
├── pressure
├── latitude
├── longitude
└── timestamp

Alerts Table
├── id (PK)
├── type
├── title
├── message
├── affectedAreas
└── timestamp
```

## Data Models

### Weather Object
```javascript
{
  location: String,
  country: String,
  temperature: Number,
  condition: String,
  humidity: Number,
  windSpeed: Number,
  pressure: Number,
  visibility: Number,
  feelsLike: Number,
  uvIndex: Number,
  lastUpdated: DateTime
}
```

### Typhoon Object
```javascript
{
  name: String,
  category: String,
  speed: Number,
  pressure: Number,
  latitude: Number,
  longitude: Number,
  movementSpeed: Number,
  status: String,
  affectedRegions: Array
}
```

### Alert Object
```javascript
{
  type: String,
  title: String,
  message: String,
  severity: String,
  affectedAreas: Array,
  timestamp: DateTime
}
```

## Technology Stack

```
Frontend
├── HTML5 (Structure)
├── CSS3 (Styling)
├── JavaScript (ES6+)
└── Font Awesome (Icons)

Backend
├── PHP 5.6+ (Server Logic)
├── JSON (Data Format)
└── HTTP/REST (Communication)

Optional
├── MySQL (Database)
├── Weather APIs (Real Data)
└── HTTPS (Security)

Hosting
├── Apache/Nginx (Web Server)
├── localhost/XAMPP (Development)
└── Cloud Hosting (Production)
```

## Performance Characteristics

```
Page Load Time: < 2 seconds
API Response: < 1 second
Data Update: 10 minutes interval
Cache Duration: 600 seconds
Max Storage: localStorage (5-10MB)
```

## Security Architecture

```
Input Validation
├── Location queries sanitized
├── API parameters checked
└── Error messages safe

Data Protection
├── No sensitive data exposed
├── CORS configured
├── Error logging separated

HTTPS Ready
├── Works with SSL/TLS
├── Production deployable
└── Secure headers compatible
```

## Scalability Path

```
Phase 1: Current (Single Server)
└── Mock Data → Works Standalone

Phase 2: Real Data Integration
├── Connect Weather API
├── Add Database
└── Increase Updates

Phase 3: Advanced Features
├── User Accounts
├── Push Notifications
├── Historical Data
└── Analytics

Phase 4: Enterprise Level
├── Multiple Servers
├── Load Balancing
├── Caching Layer
└── CDN Integration
```

---

## Quick Reference

### API Calls from Frontend
```javascript
// Example: Calling API
fetch('api.php?action=weather&location=Manila')
  .then(response => response.json())
  .then(data => displayWeather(data))
```

### Backend Response Format
```php
// Structured Response
{
  "success": true,
  "data": { /* data */ },
  "timestamp": "2025-11-07 10:30:00"
}
```

### State Management
```javascript
const state = {
  currentLocation: 'Manila',
  weatherData: null,
  typhoonData: null,
  theme: 'light'
}
```

---

**System designed for easy maintenance, scalability, and future enhancements.**
