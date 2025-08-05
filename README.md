# Prayer Times Website

A beautiful, dynamic prayer times website that automatically detects your location and displays all 5 daily prayer times with real-time updates.

## Features

- **Automatic Location Detection**: Uses your device's GPS to get your exact location
- **Manual Location Change**: Option to search by city name or enter coordinates manually
- **Dynamic Prayer Times**: Fetches accurate prayer times based on your coordinates
- **Real-time Updates**: Automatically highlights current and next prayer times
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Beautiful UI**: Modern, clean interface with smooth animations
- **Error Handling**: Graceful error handling for location and network issues
- **Manual Refresh**: Option to refresh prayer times manually
- **Quote of the Day**: Inspirational Quranic quotes with translations and reflections

## Prayer Times Displayed

1. **Fajr** - Dawn Prayer
2. **Dhuhr** - Noon Prayer  
3. **Asr** - Afternoon Prayer
4. **Maghrib** - Sunset Prayer
5. **Isha** - Night Prayer

## How to Use

1. **Open the Website**: Simply open `index.html` in your web browser
2. **Allow Location Access**: When prompted, allow the website to access your location
3. **View Prayer Times**: The website will automatically display prayer times for your location
4. **Change Location**: Click "Change Location" to search by city or enter coordinates manually
5. **Refresh if Needed**: Use the refresh button to update prayer times
6. **Quote of the Day**: View inspirational Quranic quotes with translations and reflections

## Technical Details

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Prayer Times API**: Uses the Aladhan API for accurate prayer calculations
- **Geolocation**: Uses the browser's Geolocation API
- **Geocoding**: Uses OpenStreetMap Nominatim API for city-to-coordinates conversion
- **Responsive Design**: CSS Grid and Flexbox for responsive layouts
- **No Dependencies**: Pure vanilla JavaScript, no frameworks required

## Tools & APIs Used

### External APIs
- **[Aladhan API](https://aladhan.com/prayer-times-api)**: Provides accurate prayer times based on coordinates and calculation methods
- **[OpenStreetMap Nominatim API](https://nominatim.org/)**: Free geocoding service for converting city names to coordinates and vice versa

### Browser APIs
- **Geolocation API**: Native browser API for getting user's GPS coordinates
- **Fetch API**: Modern JavaScript API for making HTTP requests

### Development Tools
- **HTML5**: Semantic markup and modern web standards
- **CSS3**: Advanced styling with Grid, Flexbox, and animations
- **Vanilla JavaScript**: No frameworks or libraries required
- **Responsive Design**: Mobile-first approach with media queries

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Location Permissions

The website requires location access to provide accurate prayer times. If you deny location access, you can:

1. Refresh the page and try again
2. Check your browser's location settings
3. Use the retry button if an error occurs

## Prayer Time Calculation Method

The website uses the **Muslim World League** calculation method (method 2) which is widely accepted and provides accurate prayer times for most locations worldwide.

## Features in Detail

### Automatic Highlighting
- **Green Border**: Current prayer time
- **Orange Border**: Next prayer time
- Updates automatically every minute

### Time Format
- Displays times in 12-hour format (AM/PM)
- Automatically converts from 24-hour API format

### Error Handling
- Location access denied
- Network connectivity issues
- API service unavailable
- Invalid location data
- City not found
- Invalid coordinates

## File Structure

```
Prayer Times/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and animations
├── script.js           # JavaScript functionality
└── README.md          # This file
```

## Getting Started

1. Download all files to a folder
2. Open `index.html` in your web browser
3. Allow location access when prompted
4. Enjoy your personalized prayer times!

## Privacy & Transparency

- **No Tracking**: This app does not track users or collect personal data
- **No Ads**: Completely ad-free experience with no advertisements
- **No Data Storage**: Your location is only used to calculate prayer times and is never stored
- **No Third-Party Tracking**: No analytics, cookies, or tracking scripts
- **Local Processing**: All calculations happen locally in your browser
- **Open Source**: Complete transparency with all code available for review

## Support

If you encounter any issues:

1. Check your internet connection
2. Ensure location access is enabled
3. Try refreshing the page
4. Check that your browser supports geolocation

## Contributing

Feel free to contribute improvements, bug fixes, or new features to make this prayer times website even better!

---

*Made with ❤️ for the Muslim community* 