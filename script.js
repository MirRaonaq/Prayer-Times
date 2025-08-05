class PrayerTimesApp {
    constructor() {
        this.currentLocation = null;
        this.prayerTimes = null;
        this.currentTime = new Date();
        this.currentAutocompleteLocations = [];
        
        this.initializeElements();
        this.bindEvents();
        this.updateDateDisplay();
        this.getUserLocation();
        this.fetchRandomQuote(); // Load initial quote
    }

    initializeElements() {
        this.locationText = document.getElementById('location-text');
        this.refreshBtn = document.getElementById('refresh-btn');
        this.changeLocationBtn = document.getElementById('change-location-btn');
        this.loadingContainer = document.getElementById('loading');
        this.prayerTimesContainer = document.getElementById('prayer-times');
        this.errorContainer = document.getElementById('error-container');
        this.errorMessage = document.getElementById('error-message');
        this.retryBtn = document.getElementById('retry-btn');
        this.dateDisplay = document.getElementById('date-display');
        
        // Modal elements
        this.locationModal = document.getElementById('location-modal');
        this.closeModalBtn = document.getElementById('close-modal');
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.cityInput = document.getElementById('city-input');
        this.latitudeInput = document.getElementById('latitude-input');
        this.longitudeInput = document.getElementById('longitude-input');
        this.searchCityBtn = document.getElementById('search-city-btn');
        this.useCoordinatesBtn = document.getElementById('use-coordinates-btn');
        this.searchResults = document.getElementById('search-results');
        this.resultsList = document.getElementById('results-list');
        this.autocompleteResults = document.getElementById('autocomplete-results');
        
        this.prayerTimeElements = {
            fajr: document.getElementById('fajr-time'),
            dhuhr: document.getElementById('dhuhr-time'),
            asr: document.getElementById('asr-time'),
            maghrib: document.getElementById('maghrib-time'),
            isha: document.getElementById('isha-time')
        };
        
        // Verse elements
        this.verseSection = document.getElementById('verse-section');
        this.verseContent = document.getElementById('verse-content');
        this.newVerseBtn = document.getElementById('new-verse-btn');
        this.verseExplanationBtn = document.getElementById('verse-explanation-btn');
    }

    bindEvents() {
        this.refreshBtn.addEventListener('click', () => this.refreshPrayerTimes());
        this.retryBtn.addEventListener('click', () => this.getUserLocation());
        
        // Modal events
        this.changeLocationBtn.addEventListener('click', () => this.openLocationModal());
        this.closeModalBtn.addEventListener('click', () => this.closeLocationModal());
        this.locationModal.addEventListener('click', (e) => {
            if (e.target === this.locationModal) {
                this.closeLocationModal();
            }
        });
        
        // Tab switching
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
        
        // Search events
        this.searchCityBtn.addEventListener('click', () => this.searchCity());
        this.useCoordinatesBtn.addEventListener('click', () => this.useCoordinates());
        
        // Enter key support
        this.cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchCity();
        });
        this.latitudeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.useCoordinates();
        });
        this.longitudeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.useCoordinates();
        });
        
        // Autocomplete functionality
        this.cityInput.addEventListener('input', (e) => this.handleAutocomplete(e.target.value));
        this.cityInput.addEventListener('keydown', (e) => this.handleAutocompleteKeydown(e));
        this.cityInput.addEventListener('blur', () => {
            // Delay hiding to allow for clicks on autocomplete items
            setTimeout(() => this.hideAutocomplete(), 150);
        });
        
        // Quote events
        this.newVerseBtn.addEventListener('click', () => this.fetchRandomQuote());
        this.verseExplanationBtn.addEventListener('click', () => this.toggleQuoteExplanation());
    }

    updateDateDisplay() {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        this.dateDisplay.textContent = this.currentTime.toLocaleDateString('en-US', options);
    }

    async getUserLocation() {
        this.showLoading();
        this.hideError();
        
        try {
            const position = await this.getCurrentPosition();
            this.currentLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            
            // Get the actual city name from coordinates
            const locationName = await this.getLocationNameFromCoordinates(
                position.coords.latitude, 
                position.coords.longitude
            );
            
            this.locationText.textContent = locationName;
            await this.fetchPrayerTimes();
            
        } catch (error) {
            console.error('Location error:', error);
            this.showError('Unable to get your location. Please allow location access and try again.');
        }
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            });
        });
    }

    async fetchPrayerTimes() {
        try {
            const { latitude, longitude } = this.currentLocation;
            const today = new Date();
            const date = today.toISOString().split('T')[0];
            
            // Using Aladhan API for prayer times
            const url = `https://api.aladhan.com/v1/timings/${date}?latitude=${latitude}&longitude=${longitude}&method=2`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch prayer times');
            }
            
            const data = await response.json();
            this.prayerTimes = data.data.timings;
            
            this.displayPrayerTimes();
            this.hideLoading();
            this.showPrayerTimes();
            
        } catch (error) {
            console.error('Prayer times fetch error:', error);
            this.showError('Unable to fetch prayer times. Please check your internet connection and try again.');
        }
    }

    displayPrayerTimes() {
        const prayerNames = {
            Fajr: 'fajr',
            Dhuhr: 'dhuhr',
            Asr: 'asr',
            Maghrib: 'maghrib',
            Isha: 'isha'
        };

        Object.entries(prayerNames).forEach(([apiName, elementId]) => {
            const time = this.prayerTimes[apiName];
            if (time && this.prayerTimeElements[elementId]) {
                this.prayerTimeElements[elementId].textContent = this.formatTime(time);
            }
        });

        this.highlightCurrentPrayer();
    }

    formatTime(timeString) {
        // Convert 24-hour format to 12-hour format
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    }

    highlightCurrentPrayer() {
        // Remove previous highlights
        document.querySelectorAll('.prayer-card').forEach(card => {
            card.classList.remove('active', 'next');
        });

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const prayerOrder = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        let nextPrayer = null;
        let currentPrayer = null;

        for (let i = 0; i < prayerOrder.length; i++) {
            const prayerName = prayerOrder[i];
            const prayerTime = this.prayerTimes[this.getPrayerApiName(prayerName)];
            
            if (prayerTime) {
                const [hours, minutes] = prayerTime.split(':');
                const prayerMinutes = parseInt(hours) * 60 + parseInt(minutes);
                
                if (prayerMinutes > currentTime) {
                    nextPrayer = prayerName;
                    break;
                } else {
                    currentPrayer = prayerName;
                }
            }
        }

        // If no next prayer found, next prayer is tomorrow's Fajr
        if (!nextPrayer) {
            nextPrayer = 'fajr';
        }

        // Highlight current and next prayers
        if (currentPrayer) {
            const currentCard = document.querySelector(`[data-prayer="${currentPrayer}"]`);
            if (currentCard) {
                currentCard.classList.add('active');
            }
        }

        if (nextPrayer) {
            const nextCard = document.querySelector(`[data-prayer="${nextPrayer}"]`);
            if (nextCard) {
                nextCard.classList.add('next');
            }
        }
    }

    getPrayerApiName(prayerName) {
        const mapping = {
            'fajr': 'Fajr',
            'dhuhr': 'Dhuhr',
            'asr': 'Asr',
            'maghrib': 'Maghrib',
            'isha': 'Isha'
        };
        return mapping[prayerName];
    }

    async refreshPrayerTimes() {
        if (this.currentLocation) {
            await this.fetchPrayerTimes();
        } else {
            await this.getUserLocation();
        }
    }

    showLoading() {
        this.loadingContainer.style.display = 'flex';
        this.prayerTimesContainer.style.display = 'none';
        this.errorContainer.style.display = 'none';
    }

    hideLoading() {
        this.loadingContainer.style.display = 'none';
    }

    showPrayerTimes() {
        this.prayerTimesContainer.style.display = 'grid';
        this.errorContainer.style.display = 'none';
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorContainer.style.display = 'block';
        this.loadingContainer.style.display = 'none';
        this.prayerTimesContainer.style.display = 'none';
    }

    hideError() {
        this.errorContainer.style.display = 'none';
    }

    // Modal methods
    openLocationModal() {
        this.locationModal.classList.add('show');
        this.cityInput.focus();
    }

    closeLocationModal() {
        this.locationModal.classList.remove('show');
        this.cityInput.value = '';
        this.latitudeInput.value = '';
        this.longitudeInput.value = '';
        this.hideSearchResults();
        this.hideAutocomplete();
    }

    switchTab(tabName) {
        // Remove active class from all tabs and contents
        this.tabBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to selected tab and content
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    async searchCity() {
        const cityName = this.cityInput.value.trim();
        if (!cityName) {
            this.showModalError('Please enter a city name');
            return;
        }

        this.searchCityBtn.disabled = true;
        this.searchCityBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
        this.hideSearchResults();

        try {
            const locations = await this.searchLocations(cityName);
            if (locations.length === 0) {
                this.showModalError('No locations found. Please try a different search term.');
            } else {
                this.displaySearchResults(locations);
            }
        } catch (error) {
            console.error('City search error:', error);
            this.showModalError('Search failed. Please check your internet connection and try again.');
        } finally {
            this.searchCityBtn.disabled = false;
            this.searchCityBtn.innerHTML = '<i class="fas fa-search"></i> Search';
        }
    }

    async searchLocations(searchTerm) {
        // Using OpenStreetMap Nominatim API for geocoding with multiple results
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}&limit=10&addressdetails=1`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch locations');
        }
        
        const data = await response.json();
        return data.map(item => ({
            name: this.formatLocationName(item),
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            displayName: item.display_name,
            type: item.type,
            importance: item.importance
        })).filter(location => 
            // Filter out low-quality results and ensure it's a populated place
            location.importance > 0.1 && 
            ['city', 'town', 'village', 'suburb', 'neighbourhood'].includes(location.type)
        );
    }

    formatLocationName(item) {
        const parts = item.display_name.split(', ');
        const city = parts[0];
        const country = parts[parts.length - 1];
        return `${city}, ${country}`;
    }

    displaySearchResults(locations) {
        this.resultsList.innerHTML = '';
        
        locations.forEach((location, index) => {
            const resultElement = document.createElement('div');
            resultElement.className = 'location-result';
            resultElement.innerHTML = `
                <div>
                    <div class="location-name">${location.name}</div>
                    <div class="location-details">${location.displayName.split(', ').slice(1, -1).join(', ')}</div>
                </div>
                <div class="location-coordinates">${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}</div>
            `;
            
            resultElement.addEventListener('click', () => this.selectLocation(location));
            this.resultsList.appendChild(resultElement);
        });
        
        this.searchResults.style.display = 'block';
    }

    async selectLocation(location) {
        this.currentLocation = {
            latitude: location.latitude,
            longitude: location.longitude
        };
        
        this.locationText.textContent = location.name;
        this.closeLocationModal();
        await this.fetchPrayerTimes();
    }

    hideSearchResults() {
        this.searchResults.style.display = 'none';
        this.resultsList.innerHTML = '';
    }

    // Autocomplete methods
    async handleAutocomplete(searchTerm) {
        if (searchTerm.length < 2) {
            this.hideAutocomplete();
            return;
        }

        try {
            const locations = await this.searchLocations(searchTerm);
            this.currentAutocompleteLocations = locations;
            if (locations.length > 0) {
                this.displayAutocompleteResults(locations);
            } else {
                this.hideAutocomplete();
            }
        } catch (error) {
            console.error('Autocomplete error:', error);
            this.hideAutocomplete();
        }
    }

    displayAutocompleteResults(locations) {
        this.autocompleteResults.innerHTML = '';
        
        locations.slice(0, 5).forEach((location, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'autocomplete-item';
            itemElement.dataset.index = index;
            itemElement.innerHTML = `
                <div>
                    <div class="city-name">${location.name}</div>
                    <div class="city-details">${location.displayName.split(', ').slice(1, -1).join(', ')}</div>
                </div>
                <div class="coordinates">${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}</div>
            `;
            
            itemElement.addEventListener('click', () => this.selectAutocompleteLocation(location));
            this.autocompleteResults.appendChild(itemElement);
        });
        
        this.autocompleteResults.style.display = 'block';
    }

    selectAutocompleteLocation(location) {
        this.currentLocation = {
            latitude: location.latitude,
            longitude: location.longitude
        };
        
        this.locationText.textContent = location.name;
        this.cityInput.value = location.name;
        this.hideAutocomplete();
        this.closeLocationModal();
        this.fetchPrayerTimes();
    }

    hideAutocomplete() {
        this.autocompleteResults.style.display = 'none';
        this.autocompleteResults.innerHTML = '';
    }

    handleAutocompleteKeydown(e) {
        const items = this.autocompleteResults.querySelectorAll('.autocomplete-item');
        const selectedItem = this.autocompleteResults.querySelector('.autocomplete-item.selected');
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (selectedItem) {
                    selectedItem.classList.remove('selected');
                    const nextItem = selectedItem.nextElementSibling;
                    if (nextItem) {
                        nextItem.classList.add('selected');
                    } else {
                        items[0]?.classList.add('selected');
                    }
                } else {
                    items[0]?.classList.add('selected');
                }
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                if (selectedItem) {
                    selectedItem.classList.remove('selected');
                    const prevItem = selectedItem.previousElementSibling;
                    if (prevItem) {
                        prevItem.classList.add('selected');
                    } else {
                        items[items.length - 1]?.classList.add('selected');
                    }
                } else {
                    items[items.length - 1]?.classList.add('selected');
                }
                break;
                
            case 'Enter':
                if (selectedItem) {
                    e.preventDefault();
                    const index = parseInt(selectedItem.dataset.index);
                    const locations = this.getAutocompleteLocations();
                    if (locations[index]) {
                        this.selectAutocompleteLocation(locations[index]);
                    }
                }
                break;
                
            case 'Escape':
                this.hideAutocomplete();
                break;
        }
    }

    getAutocompleteLocations() {
        return this.currentAutocompleteLocations;
    }

    async useCoordinates() {
        const lat = parseFloat(this.latitudeInput.value);
        const lon = parseFloat(this.longitudeInput.value);
        
        if (isNaN(lat) || isNaN(lon)) {
            this.showModalError('Please enter valid coordinates');
            return;
        }
        
        if (lat < -90 || lat > 90) {
            this.showModalError('Latitude must be between -90 and 90');
            return;
        }
        
        if (lon < -180 || lon > 180) {
            this.showModalError('Longitude must be between -180 and 180');
            return;
        }

        // Validate that coordinates are reasonable (not in the middle of ocean, etc.)
        try {
            const locationInfo = await this.validateCoordinates(lat, lon);
            this.currentLocation = { latitude: lat, longitude: lon };
            this.locationText.textContent = locationInfo || `Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
            this.closeLocationModal();
            await this.fetchPrayerTimes();
        } catch (error) {
            this.showModalError('Invalid coordinates. Please enter coordinates for a valid location.');
        }
    }

    async getLocationNameFromCoordinates(lat, lon) {
        // Reverse geocoding to get location name from coordinates
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`;
        
        const response = await fetch(url);
        if (!response.ok) {
            return 'Location detected';
        }
        
        const data = await response.json();
        
        // Check if the location is meaningful
        if (data.error || !data.display_name) {
            return 'Location detected';
        }
        
        // Format the location name
        const parts = data.display_name.split(', ');
        if (parts.length >= 2) {
            return `${parts[0]}, ${parts[parts.length - 1]}`;
        } else {
            return data.display_name;
        }
    }

    async validateCoordinates(lat, lon) {
        // Reverse geocoding to validate coordinates
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Invalid coordinates');
        }
        
        const data = await response.json();
        
        // Check if the location is meaningful (not in the middle of ocean)
        if (data.error || !data.display_name || data.display_name.includes('Ocean') || data.display_name.includes('Sea')) {
            throw new Error('Coordinates point to an invalid location');
        }
        
        // Return a meaningful location name
        const parts = data.display_name.split(', ');
        return `${parts[0]}, ${parts[parts.length - 1]}`;
    }

    showModalError(message) {
        // Create a temporary error message in the modal
        const errorDiv = document.createElement('div');
        errorDiv.className = 'modal-error';
        errorDiv.style.cssText = `
            color: #e74c3c;
            background: #fdf2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 10px;
            margin-top: 10px;
            font-size: 0.9rem;
        `;
        errorDiv.textContent = message;
        
        const modalBody = this.locationModal.querySelector('.modal-body');
        modalBody.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    // Auto-refresh prayer times every hour
    startAutoRefresh() {
        setInterval(() => {
            this.currentTime = new Date();
            this.updateDateDisplay();
            this.highlightCurrentPrayer();
        }, 60000); // Check every minute
    }

    // Quote of the Day functionality
    async fetchRandomQuote() {
        try {
            this.showQuoteLoading();
            
            // Array of inspirational Quranic quotes with translations
            const quotes = [
                {
                    arabic: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
                    english: "Indeed, Allah is with the patient.",
                    reference: "Quran 2:153",
                    translation: "This verse reminds us that Allah's support and help are always available to those who remain patient in the face of difficulties."
                },
                {
                    arabic: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
                    english: "And whoever relies upon Allah - then He is sufficient for him.",
                    reference: "Quran 65:3",
                    translation: "This verse teaches us the importance of putting our trust in Allah, knowing that He will provide for all our needs."
                },
                {
                    arabic: "إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّىٰ يُغَيِّرُوا مَا بِأَنفُسِهِمْ",
                    english: "Indeed, Allah will not change the condition of a people until they change what is in themselves.",
                    reference: "Quran 13:11",
                    translation: "This verse emphasizes personal responsibility and the power of self-improvement in bringing about positive change."
                },
                {
                    arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
                    english: "For indeed, with hardship [will be] ease.",
                    reference: "Quran 94:5",
                    translation: "This verse provides hope that every difficulty is followed by ease and relief from Allah."
                },
                {
                    arabic: "وَلَا تَقْفُ مَا لَيْسَ لَكَ بِهِ عِلْمٌ",
                    english: "And do not pursue that of which you have no knowledge.",
                    reference: "Quran 17:36",
                    translation: "This verse encourages us to seek knowledge and avoid making assumptions or judgments without proper understanding."
                },
                {
                    arabic: "إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ",
                    english: "Indeed, Allah orders justice and good conduct.",
                    reference: "Quran 16:90",
                    translation: "This verse highlights the importance of justice and kindness in our daily lives and interactions with others."
                },
                {
                    arabic: "وَلَا تَنْسَوُا الْفَضْلَ بَيْنَكُمْ",
                    english: "And do not forget the favor between you.",
                    reference: "Quran 2:237",
                    translation: "This verse reminds us to remember and appreciate the kindness and favors we receive from others."
                },
                {
                    arabic: "إِنَّ اللَّهَ لَا يُحِبُّ مَن كَانَ مُخْتَالًا فَخُورًا",
                    english: "Indeed, Allah does not like those who are arrogant and boastful.",
                    reference: "Quran 4:36",
                    translation: "This verse teaches us the importance of humility and warns against arrogance and pride."
                },
                {
                    arabic: "وَجَعَلْنَا مِنَ الْمَاءِ كُلَّ شَيْءٍ حَيٍّ",
                    english: "And We made from water every living thing.",
                    reference: "Quran 21:30",
                    translation: "This verse highlights the miracle of creation and the importance of water as a source of life."
                },
                {
                    arabic: "إِنَّ اللَّهَ لَا يَظْلِمُ مِثْقَالَ ذَرَّةٍ",
                    english: "Indeed, Allah does not do injustice, [even] as much as an atom's weight.",
                    reference: "Quran 4:40",
                    translation: "This verse assures us of Allah's perfect justice and fairness in all matters."
                }
            ];
            
            // Select a random quote
            const randomIndex = Math.floor(Math.random() * quotes.length);
            const quote = quotes[randomIndex];
            
            this.displayQuote(quote);
            
        } catch (error) {
            console.error('Quote fetch error:', error);
            this.showQuoteError('Unable to fetch quote. Please try again.');
        }
    }

    displayQuote(quote) {
        this.verseContent.innerHTML = `
            <div class="verse-text">"${quote.arabic}"</div>
            <div class="verse-text" style="font-style: normal; margin-top: 10px;">"${quote.english}"</div>
            <div class="verse-reference">
                <i class="fas fa-book"></i>
                ${quote.reference}
            </div>
            <div class="verse-explanation" style="display: none;">
                <strong>Reflection:</strong><br>
                ${quote.translation}
            </div>
        `;
        
        this.verseExplanationBtn.style.display = 'inline-flex';
        this.currentQuoteData = quote;
    }

    toggleQuoteExplanation() {
        const explanationDiv = this.verseContent.querySelector('.verse-explanation');
        const isVisible = explanationDiv.style.display !== 'none';
        
        if (isVisible) {
            explanationDiv.style.display = 'none';
            this.verseExplanationBtn.innerHTML = '<i class="fas fa-info-circle"></i> Reflection';
        } else {
            explanationDiv.style.display = 'block';
            this.verseExplanationBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide';
        }
    }

    showQuoteLoading() {
        this.verseContent.innerHTML = `
            <div class="verse-loading">
                <div class="loading-spinner"></div>
                <p>Loading quote...</p>
            </div>
        `;
        this.verseExplanationBtn.style.display = 'none';
    }

    showQuoteError(message) {
        this.verseContent.innerHTML = `
            <div class="verse-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
        this.verseExplanationBtn.style.display = 'none';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new PrayerTimesApp();
    app.startAutoRefresh();
}); 