# BayanForecast - Weather & Typhoon Monitoring System

A comprehensive real-time weather monitoring and tropical storm tracking website designed for the Philippines. BayanForecast provides up-to-date information about weather conditions and typhoon movements to keep citizens informed and safe.

## 🌍 Features

### Current Weather Section
- Real-time weather data display with:
  - Current temperature
  - Weather condition with icons
  - Humidity percentage
  - Wind speed
  - Atmospheric pressure
  - Visibility distance
  - "Feels like" temperature
  - UV Index

### Typhoon Tracker
- Live typhoon monitoring with:
  - Storm name and category
  - Maximum wind speed
  - Central pressure
  - Position coordinates (latitude/longitude)
  - Movement speed
  - Affected regions
  - Status indicators (Active/Monitored)

### 7-Day Forecast
- Detailed weather predictions including:
  - High and low temperatures
  - Weather condition descriptions
  - Humidity and wind speed
  - Chance of rain
  - UV Index

### Weather Alerts
- Real-time alert system with:
  - Critical alerts (Typhoon warnings)
  - Weather warnings (Heavy rain, high wind)
  - Information updates
  - Timestamp for each alert
  - Color-coded severity levels

### Additional Features
- **Dark Mode**: Toggle between light and dark themes
- **Location Search**: Search weather for different cities
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Auto-update**: Data refreshes every 10 minutes
- **Smooth Animations**: Elegant transitions and fade-in effects

## 📁 Project Structure

```
BayanForecast/
├── index.html          # Main HTML file
├── styles.css          # Complete styling with responsive design
├── script.js           # JavaScript functionality and interactivity
├── api.php             # PHP backend API
├── README.md           # Documentation (this file)
└── .gitignore          # Git configuration
```

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge, Safari)
- PHP 5.6+ (for backend API)
- A local or remote server with PHP support

### Installation

1. **Extract the files** to your web server directory:
   ```bash
   cp -r BayanForecast /var/www/html/
   # or to your XAMPP/WAMP directory
   ```

2. **Configure your server** (if using XAMPP/WAMP):
   - Place the BayanForecast folder in `htdocs/` (XAMPP) or `www/` (WAMP)

3. **Access the website**:
   - Open your browser and navigate to:
   ```
   http://localhost/BayanForecast/
   ```

## 🔧 How to Use

### Searching for Weather
1. Enter a city or province name in the search bar
2. Click the "Search" button or press Enter
3. Weather data will update for the selected location

### Viewing Typhoon Information
- Navigate to the "Typhoon Tracker" section
- View active storms and their details
- Check affected regions and severity levels
- Monitor movement and wind speeds

### Checking Alerts
- Visit the "Alerts" section
- View all current weather warnings
- Critical alerts are highlighted in red
- Timestamp shows when each alert was issued

### Dark Mode
- Click the moon/sun icon in the header
- Your preference is saved in the browser

## 📊 Data Structure

### Weather API Response
```json
{
  "success": true,
  "data": {
    "location": "Manila",
    "country": "Philippines",
    "temperature": 32,
    "condition": "Sunny",
    "humidity": 65,
    "windSpeed": 15,
    "pressure": 1013,
    "visibility": 10,
    "feelsLike": 30,
    "uvIndex": 7,
    "lastUpdated": "2025-11-07 10:30:00"
  }
}
```

### Typhoon API Response
```json
{
  "success": true,
  "data": [
    {
      "name": "Kristine",
      "category": "Super Typhoon",
      "speed": 150,
      "pressure": 915,
      "latitude": 15.5,
      "longitude": 130.2,
      "movementSpeed": 25,
      "status": "Active",
      "affectedRegions": ["Bicol", "Quezon", "Laguna"]
    }
  ]
}
```

## 🎨 Design & Layout

### Color Scheme
- **Primary Blue**: #2563eb
- **Secondary Orange**: #f59e0b
- **Danger Red**: #ef4444
- **Success Green**: #10b981
- **Warning Orange**: #f97316

### Responsive Breakpoints
- **Desktop**: 1024px and above
- **Tablet**: 768px - 1023px
- **Mobile**: Below 768px

## 🔌 API Endpoints

### Get Weather Data
```
GET /api.php?action=weather&location=Manila
```

### Get Typhoon Data
```
GET /api.php?action=typhoon
```

### Get Forecast Data
```
GET /api.php?action=forecast&location=Manila
```

### Get Alerts Data
```
GET /api.php?action=alerts
```

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🔒 Security Considerations

1. **Input Validation**: Always validate location input
2. **CORS**: Configure CORS headers appropriately
3. **Rate Limiting**: Implement rate limiting for API endpoints
4. **HTTPS**: Use HTTPS in production
5. **Data Protection**: Never expose sensitive information

## 📈 Performance Optimization

- Minify CSS and JavaScript for production
- Use CDN for Font Awesome icons
- Implement lazy loading for images
- Cache API responses
- Use compression for HTTP responses

## 🐛 Troubleshooting

### Weather data not loading
- Check browser console for errors
- Ensure PHP is enabled on your server
- Verify API.php is accessible

### Styling issues
- Clear browser cache (Ctrl+Shift+Del)
- Check CSS file is linked correctly
- Ensure all dependencies are loaded

### Dark mode not working
- Check if localStorage is enabled
- Verify JavaScript is enabled

## 📞 Support & Contact

For issues, suggestions, or contributions:
- Email: support@bayanforecast.ph
- GitHub: [Your GitHub repository]

## 📝 License

This project is licensed under the MIT License.

## 🚀 Future Enhancements

- [ ] Push notifications for alerts
- [ ] User accounts and saved locations
- [ ] Historical weather data
- [ ] Weather radar integration
- [ ] Social media sharing
- [ ] Multi-language support
- [ ] Mobile app version
- [ ] Storm tracking animation
- [ ] Air quality index
- [ ] Earthquake monitoring

---

**Last Updated**: November 7, 2025
**Version**: 1.0.0
