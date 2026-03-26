class PrayerTimesApp {
    constructor() {
        this.currentLocation = null;
        this.prayerTimes = null;
        this.currentTime = new Date();
        this.currentAutocompleteLocations = [];
        
        // Rate limiting for API calls
        this.lastApiCall = 0;
        this.apiCooldown = 5000; // 5 seconds between API calls
        this.quotesCache = [];
        this.cacheExpiry = 300000; // 5 minutes cache
        this.maxCacheSize = 5;
        
        // Authentication properties
        this.currentUser = null;
        this.isLoggedIn = false;
        this.firebaseAuth = null;
        this.firebaseDb = null;
        this.userRole = null;
        this.selectedRole = null;
        
        this.initializeElements();
        this.bindEvents();
        this.initializeFirebase();
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
        
        // Authentication elements
        this.loggedOutSection = document.getElementById('logged-out-section');
        this.loggedInSection = document.getElementById('logged-in-section');
        this.loginBtn = document.getElementById('login-btn');
        this.registerBtn = document.getElementById('register-btn');
        this.accountBtn = document.getElementById('account-btn');
        this.logoutBtn = document.getElementById('logout-btn');
        this.usernameDisplay = document.getElementById('username-display');
        
        // Auth modal elements
        this.authModal = document.getElementById('auth-modal');
        this.closeAuthModalBtn = document.getElementById('close-auth-modal');
        this.authModalTitle = document.getElementById('auth-modal-title');
        this.authTabBtns = document.querySelectorAll('.auth-tab-btn');
        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');
        
        // Account modal elements
        this.accountModal = document.getElementById('account-modal');
        this.closeAccountModalBtn = document.getElementById('close-account-modal');

        // Role view shells
        this.studentShell = document.getElementById('student-shell');
        this.teacherShell = document.getElementById('teacher-shell');
        this.prayerContentArea = document.getElementById('prayer-content-area');

        // Student tab bar
        this.studentTabBtns = document.querySelectorAll('.student-tab-btn');

        // Teacher tab bar + views
        this.teacherTabBtns = document.querySelectorAll('.teacher-tab-btn');
        this.teacherRosterView = document.getElementById('teacher-roster-view');
        this.teacherDashboardView = document.getElementById('teacher-dashboard-view');
        this.teacherDetailPanel = document.getElementById('teacher-detail-panel');
        this.detailOverlay = document.getElementById('detail-overlay');

        // Register role cards
        this.roleCards = document.querySelectorAll('.role-card');
        this.roleError = document.getElementById('role-error');
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
        
        // Authentication events
        this.loginBtn.addEventListener('click', () => this.openAuthModal('login'));
        this.registerBtn.addEventListener('click', () => this.openAuthModal('register'));
        this.accountBtn.addEventListener('click', () => this.openAccountModal());
        this.logoutBtn.addEventListener('click', () => this.logout());
        
        // Auth modal events
        this.closeAuthModalBtn.addEventListener('click', () => this.closeAuthModal());
        this.authModal.addEventListener('click', (e) => {
            if (e.target === this.authModal) {
                this.closeAuthModal();
            }
        });
        
        // Auth tab switching
        this.authTabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchAuthTab(btn.dataset.authTab));
        });
        
        // Auth form submissions
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        
        // Account modal events
        this.closeAccountModalBtn.addEventListener('click', () => this.closeAccountModal());
        this.accountModal.addEventListener('click', (e) => {
            if (e.target === this.accountModal) {
                this.closeAccountModal();
            }
        });

        // Role card selection in register form
        this.roleCards.forEach(card => {
            card.addEventListener('click', () => {
                this.roleCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedRole = card.dataset.role;
                if (this.roleError) this.roleError.classList.add('hidden');
            });
        });

        // Student tab switching
        this.studentTabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchStudentTab(btn.dataset.studentTab));
        });

        // Teacher tab switching
        this.teacherTabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchTeacherTab(btn.dataset.teacherTab));
        });

        // Detail panel close
        const detailCloseBtn = document.getElementById('detail-close-btn');
        if (detailCloseBtn) detailCloseBtn.addEventListener('click', () => this.closeDetailPanel());
        const detailOverlay = document.getElementById('detail-overlay');
        if (detailOverlay) detailOverlay.addEventListener('click', () => this.closeDetailPanel());

        // Teacher roster search
        const rosterSearchBtn = document.getElementById('roster-search-btn');
        const rosterSearchInput = document.getElementById('roster-search-input');
        if (rosterSearchBtn) {
            rosterSearchBtn.addEventListener('click', () => this.searchStudentForRoster());
        }
        if (rosterSearchInput) {
            rosterSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.searchStudentForRoster();
            });
        }
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
            if (!data || !data.data || !data.data.timings) {
                throw new Error('Prayer times data missing');
            }
            this.prayerTimes = data.data.timings;

            this.displayPrayerTimes();
            this.hideLoading();
            this.showPrayerTimes();

        } catch (error) {
            console.error('Prayer times fetch error:', error);
            this.hideLoading();
            this.showError('Unable to fetch prayer times. Please check your internet connection and try again.');
        }
    }

    displayPrayerTimes() {
        if (!this.prayerTimes) {
            this.hideLoading();
            this.showError('Prayer times are not available.');
            return;
        }
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

        try {
            this.highlightCurrentPrayer();
        } catch (err) {
            console.error('Error in highlightCurrentPrayer:', err);
            this.hideLoading();
            this.showError('Error displaying prayer highlights.');
        }
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
            card.classList.remove('active', 'next', 'passed');
        });

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const prayerOrder = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        let nextPrayer = null;
        let currentPrayer = null;
        let passedPrayers = [];

        // Get Fajr and Sunrise times
        const fajrTime = this.prayerTimes[this.getPrayerApiName('fajr')];
        const sunriseTime = this.prayerTimes['Sunrise'];
        let fajrMinutes = null, sunriseMinutes = null;
        if (fajrTime && sunriseTime) {
            const [fajrHour, fajrMinute] = fajrTime.split(':');
            fajrMinutes = parseInt(fajrHour) * 60 + parseInt(fajrMinute);
            const [sunriseHour, sunriseMinute] = sunriseTime.split(':');
            sunriseMinutes = parseInt(sunriseHour) * 60 + parseInt(sunriseMinute);
        }

        // Find current prayer window and passed prayers
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
                    passedPrayers.push(prayerName);
                }
            }
        }

        // If no next prayer found, next prayer is tomorrow's Fajr
        if (!nextPrayer) {
            nextPrayer = 'fajr';
            passedPrayers = prayerOrder.slice();
        } else {
            const nextIndex = prayerOrder.indexOf(nextPrayer);
            if (nextIndex > 0) {
                currentPrayer = prayerOrder[nextIndex - 1];
                passedPrayers = passedPrayers.filter(prayer => prayer !== currentPrayer);
            }
        }

        // Special logic for Isha: keep highlighted until midnight
        const ishaTime = this.prayerTimes[this.getPrayerApiName('isha')];
        if (ishaTime) {
            const [ishaHour, ishaMinute] = ishaTime.split(':');
            const ishaMinutes = parseInt(ishaHour) * 60 + parseInt(ishaMinute);
            // If current time is after Isha and before midnight
            if (currentTime >= ishaMinutes && now.getHours() < 24) {
                document.querySelectorAll('.prayer-card').forEach(card => {
                    card.classList.remove('active');
                });
                const ishaCard = document.querySelector('[data-prayer="isha"]');
                if (ishaCard) {
                    ishaCard.classList.add('active');
                }
                ['fajr', 'dhuhr', 'asr', 'maghrib'].forEach(prayerName => {
                    const card = document.querySelector(`[data-prayer="${prayerName}"]`);
                    if (card) {
                        card.classList.add('passed');
                    }
                });
                const nextCard = document.querySelector('[data-prayer="fajr"]');
                if (nextCard) {
                    nextCard.classList.add('next');
                }
                return;
            }
        }

        // Fajr highlight logic: only highlight Fajr until sunrise
        if (fajrMinutes !== null && sunriseMinutes !== null) {
            const fajrCard = document.querySelector('[data-prayer="fajr"]');
            const dhuhrMinutes = this.getPrayerMinutes('dhuhr');
            if (currentTime >= fajrMinutes && currentTime < sunriseMinutes) {
                // Highlight Fajr with a special class
                if (fajrCard) {
                    fajrCard.classList.add('active', 'fajr-in-progress');
                    fajrCard.classList.remove('passed');
                }
                // Highlight next prayer (Dhuhr)
                const nextCard = document.querySelector('[data-prayer="dhuhr"]');
                if (nextCard) {
                    nextCard.classList.add('next');
                }
                // Remove 'active' from other prayers
                ['dhuhr', 'asr', 'maghrib', 'isha'].forEach(prayerName => {
                    const card = document.querySelector(`[data-prayer="${prayerName}"]`);
                    if (card) {
                        card.classList.remove('active', 'fajr-in-progress');
                    }
                });
                return;
            } else if (currentTime >= sunriseMinutes && currentTime < dhuhrMinutes) {
                // Between sunrise and Dhuhr: no current prayer
                if (fajrCard) {
                    fajrCard.classList.remove('active', 'fajr-in-progress');
                    fajrCard.classList.add('passed');
                }
                // Remove 'active' from all other prayers
                ['dhuhr', 'asr', 'maghrib', 'isha'].forEach(prayerName => {
                    const card = document.querySelector(`[data-prayer="${prayerName}"]`);
                    if (card) {
                        card.classList.remove('active', 'fajr-in-progress');
                    }
                });
                // Highlight next prayer (Dhuhr)
                const nextCard = document.querySelector('[data-prayer="dhuhr"]');
                if (nextCard) {
                    nextCard.classList.add('next');
                }
                return;
            } else {
                // After sunrise, Fajr is not active
                if (fajrCard) {
                    fajrCard.classList.remove('active', 'fajr-in-progress');
                    fajrCard.classList.add('passed');
                }
            }
        }

        // Apply styles to passed prayers
        passedPrayers.forEach(prayerName => {
            const card = document.querySelector(`[data-prayer="${prayerName}"]`);
            if (card) {
                card.classList.add('passed');
            }
        });

        // Highlight current prayer (prayer window we're in)
        if (currentPrayer) {
            const currentCard = document.querySelector(`[data-prayer="${currentPrayer}"]`);
            if (currentCard) {
                currentCard.classList.add('active');
            }
        }

        // Highlight next prayer
        if (nextPrayer) {
            const nextCard = document.querySelector(`[data-prayer="${nextPrayer}"]`);
            if (nextCard) {
                nextCard.classList.add('next');
            }
        }
    }

    getPrayerMinutes(prayerName) {
        const prayerTime = this.prayerTimes[this.getPrayerApiName(prayerName)];
        if (!prayerTime) return null;
        const [hour, minute] = prayerTime.split(':');
        return parseInt(hour) * 60 + parseInt(minute);
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

    getLogDateKey() {
        return new Date().toLocaleDateString('en-CA');
    }

    getPrayerWindowStatus(prayerName) {
        if (!this.prayerTimes) return 'no-times';
        const prayerMinutes = this.getPrayerMinutes(prayerName);
        if (prayerMinutes === null) return 'no-times';

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const prayerOrder = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        const idx = prayerOrder.indexOf(prayerName);
        if (idx === -1) return 'no-times';

        let nextMinutes;
        if (idx < prayerOrder.length - 1) {
            nextMinutes = this.getPrayerMinutes(prayerOrder[idx + 1]);
            if (nextMinutes === null) nextMinutes = 24 * 60;
        } else {
            nextMinutes = 24 * 60;
        }

        if (currentMinutes < prayerMinutes) return 'pending';
        if (currentMinutes < nextMinutes) return 'ontime';
        return 'late';
    }

    async loadPrayerLog() {
        if (!this.currentUser) return;

        const loadingEl = document.getElementById('log-loading');
        const listEl = document.getElementById('log-prayer-list');
        const noTimesEl = document.getElementById('log-no-times');

        if (!listEl) return;

        if (loadingEl) loadingEl.classList.remove('hidden');
        listEl.innerHTML = '';
        if (noTimesEl) noTimesEl.classList.add('hidden');

        try {
            const date = this.getLogDateKey();
            const colRef = this.collection(this.firebaseDb, 'prayerLogs', this.currentUser.uid, date);
            const snapshot = await this.getDocs(colRef);

            const existingLogs = {};
            snapshot.forEach(docSnap => {
                existingLogs[docSnap.id] = docSnap.data();
            });

            if (loadingEl) loadingEl.classList.add('hidden');
            this.renderPrayerLogRows(listEl, noTimesEl, existingLogs);

            // Compute and display streak
            const streak = await this.computeStreak(existingLogs);
            this.displayStreak(streak);
        } catch (error) {
            console.error('Error loading prayer log:', error);
            if (loadingEl) loadingEl.classList.add('hidden');
            if (listEl) listEl.innerHTML = '<p class="log-no-times">Error loading log. Please try again.</p>';
        }
    }

    renderPrayerLogRows(listEl, noTimesEl, existingLogs) {
        const prayerOrder = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        const prayerLabels = {
            fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha'
        };

        if (!this.prayerTimes) {
            if (noTimesEl) noTimesEl.classList.remove('hidden');
            return;
        }

        prayerOrder.forEach(prayerName => {
            const label = prayerLabels[prayerName];
            const apiName = this.getPrayerApiName(prayerName);
            const rawTime = this.prayerTimes[apiName];
            const displayTime = rawTime ? this.formatTime(rawTime) : '--:--';
            const logEntry = existingLogs[prayerName];
            const windowStatus = this.getPrayerWindowStatus(prayerName);
            const isDone = !!logEntry;
            const isPending = !isDone && windowStatus === 'pending';

            const row = document.createElement('div');
            row.className = 'log-prayer-row' + (isDone ? ' done' : '') + (isPending ? ' pending' : '');
            row.dataset.prayer = prayerName;

            const checkIcon = isDone ? '<i class="fas fa-check"></i>' : '';
            const statusBadge = isDone
                ? `<span class="log-status-badge ${logEntry.status}">${logEntry.status === 'ontime' ? '✅ On Time' : '⏰ Late'}</span>`
                : '';

            row.innerHTML = `
                <div class="log-prayer-checkbox">${checkIcon}</div>
                <div class="log-prayer-info">
                    <span class="log-prayer-name">${label}</span>
                    <span class="log-prayer-time">${displayTime}</span>
                </div>
                ${statusBadge}
            `;

            if (!isDone && !isPending) {
                row.addEventListener('click', () => this.handlePrayerCheck(prayerName, row));
            }

            listEl.appendChild(row);
        });
    }

    async handlePrayerCheck(prayerName, rowEl) {
        if (!this.currentUser || rowEl.classList.contains('done') || rowEl.classList.contains('pending')) return;

        const status = this.getPrayerWindowStatus(prayerName);
        if (status === 'pending' || status === 'no-times') return;

        rowEl.classList.add('done');
        const checkboxEl = rowEl.querySelector('.log-prayer-checkbox');
        if (checkboxEl) checkboxEl.innerHTML = '<i class="fas fa-check"></i>';

        try {
            const date = this.getLogDateKey();
            const prayerDocRef = this.doc(this.firebaseDb, 'prayerLogs', this.currentUser.uid, date, prayerName);
            await this.setDoc(prayerDocRef, {
                timestamp: this.serverTimestamp(),
                status: status
            });

            const badge = document.createElement('span');
            badge.className = `log-status-badge ${status}`;
            badge.textContent = status === 'ontime' ? '✅ On Time' : '⏰ Late';
            rowEl.appendChild(badge);
        } catch (error) {
            console.error('Error saving prayer check:', error);
            rowEl.classList.remove('done');
            if (checkboxEl) checkboxEl.innerHTML = '';
        }
    }

    async computeStreak(todayLogs) {
        if (!this.currentUser) return 0;

        const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

        // Generate last 14 local dates (index 0 = today)
        const dates = [];
        for (let i = 0; i < 14; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dates.push(d.toLocaleDateString('en-CA'));
        }

        // Check today using already-fetched logs (no extra Firestore read)
        const completions = {};
        completions[dates[0]] = prayers.every(p => !!todayLogs[p]);

        // Fetch remaining 13 days in parallel
        const otherDates = dates.slice(1);
        try {
            const snapshots = await Promise.all(
                otherDates.map(date =>
                    this.getDocs(this.collection(this.firebaseDb, 'prayerLogs', this.currentUser.uid, date))
                )
            );
            otherDates.forEach((date, i) => {
                const logged = {};
                snapshots[i].forEach(docSnap => { logged[docSnap.id] = true; });
                completions[date] = prayers.every(p => logged[p]);
            });
        } catch (error) {
            console.error('Error computing streak:', error);
            return completions[dates[0]] ? 1 : 0;
        }

        // Count consecutive complete days from today backward
        let streak = 0;
        for (const date of dates) {
            if (completions[date]) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }

    displayStreak(count) {
        const banner = document.getElementById('streak-banner');
        const countEl = document.getElementById('streak-count');
        const startEl = document.getElementById('streak-start');

        if (!banner || !countEl || !startEl) return;

        if (count > 0) {
            countEl.textContent = count;
            banner.classList.remove('hidden');
            startEl.classList.add('hidden');
        } else {
            banner.classList.add('hidden');
            startEl.classList.remove('hidden');
        }
    }

    async loadTeacherRoster() {
        if (!this.currentUser) return;

        const loadingEl = document.getElementById('roster-loading');
        const listEl = document.getElementById('roster-list');
        const emptyEl = document.getElementById('roster-empty');

        if (!listEl) return;

        if (loadingEl) loadingEl.classList.remove('hidden');
        listEl.innerHTML = '';
        if (emptyEl) emptyEl.classList.add('hidden');

        try {
            const studentsRef = this.collection(this.firebaseDb, 'teacherRosters', this.currentUser.uid, 'students');
            const snapshot = await this.getDocs(studentsRef);

            if (loadingEl) loadingEl.classList.add('hidden');

            if (snapshot.empty) {
                if (emptyEl) emptyEl.classList.remove('hidden');
                return;
            }

            const students = [];
            snapshot.forEach(docSnap => {
                students.push({ uid: docSnap.id, ...docSnap.data() });
            });

            this.renderRosterList(listEl, students);
        } catch (error) {
            console.error('Error loading roster:', error);
            if (loadingEl) loadingEl.classList.add('hidden');
        }
    }

    renderRosterList(listEl, students) {
        listEl.innerHTML = '';
        students.forEach(student => {
            const row = document.createElement('div');
            row.className = 'roster-student-row';
            row.dataset.uid = student.uid;
            row.innerHTML = `
                <div class="roster-student-info">
                    <span class="roster-student-name">${student.username || 'Unknown'}</span>
                    <span class="roster-student-email">${student.email || ''}</span>
                </div>
                <button class="roster-remove-btn" data-uid="${student.uid}">Remove</button>
            `;
            row.querySelector('.roster-remove-btn').addEventListener('click', () =>
                this.removeStudentFromRoster(student.uid, row)
            );
            listEl.appendChild(row);
        });
    }

    async searchStudentForRoster() {
        const input = document.getElementById('roster-search-input');
        const resultEl = document.getElementById('roster-search-result');
        if (!input || !resultEl) return;

        const term = input.value.trim();
        if (!term) return;

        resultEl.className = 'roster-search-result';
        resultEl.innerHTML = 'Searching...';
        resultEl.classList.remove('hidden');

        try {
            const usersRef = this.collection(this.firebaseDb, 'users');

            const [emailSnap, usernameSnap] = await Promise.all([
                this.getDocs(this.query(usersRef, this.where('email', '==', term), this.limit(1))),
                this.getDocs(this.query(usersRef, this.where('username', '==', term), this.limit(1)))
            ]);

            let foundDoc = null;
            if (!emailSnap.empty) foundDoc = emailSnap.docs[0];
            else if (!usernameSnap.empty) foundDoc = usernameSnap.docs[0];

            if (!foundDoc) {
                resultEl.className = 'roster-search-result error';
                resultEl.textContent = 'No student found with that email or username.';
                return;
            }

            const userData = foundDoc.data();
            const foundUid = foundDoc.id;

            if (userData.role !== 'student') {
                resultEl.className = 'roster-search-result error';
                resultEl.textContent = 'That account is a teacher, not a student.';
                return;
            }

            const rosterDocRef = this.doc(this.firebaseDb, 'teacherRosters', this.currentUser.uid, 'students', foundUid);
            const existing = await this.getDoc(rosterDocRef);
            const alreadyAdded = existing.exists();

            resultEl.className = 'roster-search-result found';
            resultEl.innerHTML = `
                <div class="roster-result-info">
                    <span class="roster-result-name">${userData.username || 'Unknown'}</span>
                    <span class="roster-result-email">${userData.email}</span>
                </div>
                <button class="roster-add-btn" ${alreadyAdded ? 'disabled' : ''} data-uid="${foundUid}">
                    ${alreadyAdded ? 'Already Added' : 'Add to Roster'}
                </button>
            `;

            if (!alreadyAdded) {
                resultEl.querySelector('.roster-add-btn').addEventListener('click', () =>
                    this.addStudentToRoster(foundUid, userData, resultEl)
                );
            }
        } catch (error) {
            console.error('Search error:', error);
            resultEl.className = 'roster-search-result error';
            resultEl.textContent = 'Search failed. Please try again.';
        }
    }

    async addStudentToRoster(studentUid, userData, resultEl) {
        const btn = resultEl ? resultEl.querySelector('.roster-add-btn') : null;
        if (btn) { btn.disabled = true; btn.textContent = 'Adding...'; }

        try {
            const rosterDocRef = this.doc(this.firebaseDb, 'teacherRosters', this.currentUser.uid, 'students', studentUid);
            await this.setDoc(rosterDocRef, {
                username: userData.username || 'Unknown',
                email: userData.email || '',
                addedAt: this.serverTimestamp()
            });

            if (btn) btn.textContent = 'Added ✓';
            await this.loadTeacherRoster();
        } catch (error) {
            console.error('Error adding student:', error);
            if (btn) { btn.disabled = false; btn.textContent = 'Add to Roster'; }
        }
    }

    async removeStudentFromRoster(studentUid, rowEl) {
        if (rowEl) rowEl.style.opacity = '0.4';

        try {
            const rosterDocRef = this.doc(this.firebaseDb, 'teacherRosters', this.currentUser.uid, 'students', studentUid);
            await this.deleteDoc(rosterDocRef);
            if (rowEl) rowEl.remove();

            const listEl = document.getElementById('roster-list');
            const emptyEl = document.getElementById('roster-empty');
            if (listEl && emptyEl && listEl.children.length === 0) {
                emptyEl.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error removing student:', error);
            if (rowEl) rowEl.style.opacity = '1';
        }
    }

    async refreshPrayerTimes() {
        if (this.currentLocation) {
            await this.fetchPrayerTimes();
        } else {
            await this.getUserLocation();
        }
    }

    showLoading() {
        this.loadingContainer.classList.remove('hidden');
        this.loadingContainer.style.display = 'flex';
        this.prayerTimesContainer.classList.add('hidden');
        this.errorContainer.classList.add('hidden');
    }

    hideLoading() {
        this.loadingContainer.classList.add('hidden');
    }

    showPrayerTimes() {
        this.prayerTimesContainer.classList.remove('hidden');
        this.prayerTimesContainer.style.display = 'grid';
        this.errorContainer.classList.add('hidden');
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorContainer.classList.remove('hidden');
        this.errorContainer.style.display = 'block';
        this.loadingContainer.classList.add('hidden');
        this.prayerTimesContainer.classList.add('hidden');
    }

    hideError() {
        this.errorContainer.classList.add('hidden');
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
        
        this.searchResults.classList.remove('hidden');
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
        this.searchResults.classList.add('hidden');
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
        
        this.autocompleteResults.classList.remove('hidden');
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
        this.autocompleteResults.classList.add('hidden');
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
                        if (items[0]) items[0].classList.add('selected');
                    }
                } else {
                    if (items[0]) items[0].classList.add('selected');
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
                        if (items[items.length - 1]) items[items.length - 1].classList.add('selected');
                    }
                } else {
                    if (items[items.length - 1]) items[items.length - 1].classList.add('selected');
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
            
            // Check rate limiting
            const now = Date.now();
            const timeSinceLastCall = now - this.lastApiCall;
            
            // If within cooldown period, use cache or fallback
            if (timeSinceLastCall < this.apiCooldown) {
                console.log(`Rate limited: ${Math.ceil((this.apiCooldown - timeSinceLastCall) / 1000)}s remaining`);
                return this.useQuoteFromCacheOrFallback();
            }
            
            // Check cache first
            if (this.quotesCache.length > 0 && Math.random() < 0.3) { // 30% chance to use cache
                console.log('Using cached quote to reduce API calls');
                return this.useQuoteFromCache();
            }
            
            // Try to fetch from API
            try {
                this.lastApiCall = now;
                const response = await fetch('https://prayer-times-api.azurewebsites.net/api/getrandomquote', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.quote) {
                        console.log('Quote fetched from API:', data.quote.id);
                        
                        // Add to cache
                        this.addToQuotesCache(data.quote);
                        
                        this.displayQuote(data.quote);
                        return;
                    }
                }
            } catch (apiError) {
                console.warn('API fetch failed, falling back to cached or hardcoded quotes:', apiError.message);
            }

            // Use cache or fallback
            this.useQuoteFromCacheOrFallback();
            
        } catch (error) {
            console.error('Quote fetch error:', error);
            this.showQuoteError('Unable to fetch quote. Please try again.');
        }
    }

    // Cache management methods
    addToQuotesCache(quote) {
        // Add timestamp to quote
        const cachedQuote = { ...quote, cachedAt: Date.now() };
        
        // Remove duplicates
        this.quotesCache = this.quotesCache.filter(q => q.id !== quote.id);
        
        // Add new quote
        this.quotesCache.unshift(cachedQuote);
        
        // Limit cache size
        if (this.quotesCache.length > this.maxCacheSize) {
            this.quotesCache = this.quotesCache.slice(0, this.maxCacheSize);
        }
        
        console.log(`Quote ${quote.id} added to cache. Cache size: ${this.quotesCache.length}`);
    }

    useQuoteFromCache() {
        // Filter out expired cache entries
        const now = Date.now();
        this.quotesCache = this.quotesCache.filter(q => (now - q.cachedAt) < this.cacheExpiry);
        
        if (this.quotesCache.length > 0) {
            const randomCachedQuote = this.quotesCache[Math.floor(Math.random() * this.quotesCache.length)];
            console.log('Using cached quote:', randomCachedQuote.id);
            this.displayQuote(randomCachedQuote);
            return true;
        }
        return false;
    }

    useQuoteFromCacheOrFallback() {
        // Try cache first
        if (this.useQuoteFromCache()) {
            return;
        }
        
        // Use hardcoded fallback
        console.log('Using fallback hardcoded quotes');
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
            
            // Select a random quote from fallback
            const randomIndex = Math.floor(Math.random() * quotes.length);
            const quote = quotes[randomIndex];
            
            this.displayQuote(quote);
    }

    displayQuote(quote) {
        this.verseContent.innerHTML = `
            <div class="verse-text">"${quote.arabic}"</div>
            <div class="verse-text" style="font-style: normal; margin-top: 10px;">"${quote.english}"</div>
            <div class="verse-reference">
                <i class="fas fa-book"></i>
                ${quote.reference}
            </div>
            <div class="verse-explanation hidden">
                <strong>Reflection:</strong><br>
                ${quote.translation}
            </div>
        `;
        
        this.verseExplanationBtn.classList.remove('hidden');
        this.verseExplanationBtn.style.display = 'inline-flex';
        this.currentQuoteData = quote;
    }

    toggleQuoteExplanation() {
        const explanationDiv = this.verseContent.querySelector('.verse-explanation');
        const isVisible = !explanationDiv.classList.contains('hidden');
        
        if (isVisible) {
            explanationDiv.classList.add('hidden');
            this.verseExplanationBtn.innerHTML = '<i class="fas fa-info-circle"></i> Reflection';
        } else {
            explanationDiv.classList.remove('hidden');
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
        this.verseExplanationBtn.classList.add('hidden');
    }

    showQuoteError(message) {
        this.verseContent.innerHTML = `
            <div class="verse-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
        this.verseExplanationBtn.classList.add('hidden');
    }

    // ===============================
    // Authentication Methods
    // ===============================

    async initializeFirebase() {
        // Wait for Firebase to be loaded
        const waitForFirebase = () => {
            return new Promise((resolve) => {
                const checkFirebase = () => {
                    if (window.firebaseAuth && window.firebaseDb) {
                        resolve();
                    } else {
                        setTimeout(checkFirebase, 100);
                    }
                };
                checkFirebase();
            });
        };

        await waitForFirebase();
        
        this.firebaseAuth = window.firebaseAuth;
        this.firebaseDb = window.firebaseDb;
        
        // Import Firebase auth functions
        const { onAuthStateChanged, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signOut, updateProfile } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js');
        const { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, getDocs, query, where, limit, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        
        this.sendSignInLinkToEmail = sendSignInLinkToEmail;
        this.isSignInWithEmailLink = isSignInWithEmailLink;
        this.signInWithEmailLink = signInWithEmailLink;
        this.signOut = signOut;
        this.updateProfile = updateProfile;
        this.doc = doc;
        this.setDoc = setDoc;
        this.getDoc = getDoc;
        this.updateDoc = updateDoc;
        this.serverTimestamp = serverTimestamp;
        this.collection = collection;
        this.getDocs = getDocs;
        this.query = query;
        this.where = where;
        this.limit = limit;
        this.deleteDoc = deleteDoc;
        
        // Listen for auth state changes
        onAuthStateChanged(this.firebaseAuth, (user) => {
            this.handleAuthStateChange(user);
        });

        // Complete email link sign-in if URL contains a sign-in link
        if (this.isSignInWithEmailLink(this.firebaseAuth, window.location.href)) {
            this.completeEmailLinkSignIn();
        }
    }

    async handleAuthStateChange(user) {
        if (user) {
            this.currentUser = user;
            this.isLoggedIn = true;
            await this.loadUserData();
        } else {
            this.currentUser = null;
            this.isLoggedIn = false;
            this.userRole = null;
        }
        this.updateAuthUI();
    }

    async loadUserData() {
        if (!this.currentUser) return;
        
        try {
            const userDocRef = this.doc(this.firebaseDb, 'users', this.currentUser.uid);
            const userDoc = await this.getDoc(userDocRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                this.userRole = userData.role || 'student';
                await this.updateDoc(userDocRef, {
                    viewCount: (userData.viewCount || 0) + 1,
                    loginCount: (userData.loginCount || 0) + 1,
                    lastLogin: this.serverTimestamp()
                });
            } else {
                // New user via email link — check localStorage for registration data
                let username = this.currentUser.displayName || 'User';
                let role = 'student';
                try {
                    const pendingRaw = localStorage.getItem('emailLinkPendingData');
                    if (pendingRaw) {
                        const pending = JSON.parse(pendingRaw);
                        if (pending.username) username = pending.username;
                        if (pending.role) role = pending.role;
                    }
                } catch (_) {}

                this.userRole = role;

                // Set displayName on Firebase Auth user
                if (this.updateProfile && username !== 'User') {
                    await this.updateProfile(this.currentUser, { displayName: username });
                }

                await this.setDoc(userDocRef, {
                    username,
                    email: this.currentUser.email,
                    role,
                    createdAt: this.serverTimestamp(),
                    loginCount: 1,
                    viewCount: 1,
                    lastLogin: this.serverTimestamp()
                });

                // Clean up pending registration data
                localStorage.removeItem('emailLinkPendingData');
            }

            // Clean up sign-in email storage
            localStorage.removeItem('emailLinkAddress');
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    checkAuthState() {
        // This is now handled by onAuthStateChanged in initializeFirebase
        // Keeping this method for compatibility but it's no longer used
    }

    updateAuthUI() {
        if (this.isLoggedIn && this.currentUser) {
            this.loggedOutSection.classList.add('hidden');
            this.loggedInSection.classList.remove('hidden');
            this.usernameDisplay.textContent = this.currentUser.displayName || this.currentUser.email.split('@')[0];
        } else {
            this.loggedOutSection.classList.remove('hidden');
            this.loggedInSection.classList.add('hidden');
        }
        this.renderRoleView(this.userRole);
    }

    renderRoleView(role) {
        if (!this.studentShell || !this.teacherShell || !this.prayerContentArea) return;

        if (!this.isLoggedIn) {
            this.studentShell.classList.add('hidden');
            this.teacherShell.classList.add('hidden');
            this.prayerContentArea.classList.remove('hidden');
            return;
        }

        if (role === 'teacher') {
            this.teacherShell.classList.remove('hidden');
            this.studentShell.classList.add('hidden');
            this.prayerContentArea.classList.add('hidden');
            this.switchTeacherTab('roster');
        } else {
            this.studentShell.classList.remove('hidden');
            this.teacherShell.classList.add('hidden');
            this.prayerContentArea.classList.remove('hidden');
            // Ensure student tab bar is on 'times' tab
            this.switchStudentTab('times');
        }
    }

    switchStudentTab(tabName) {
        this.studentTabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.studentTab === tabName);
        });
        const logTab = document.getElementById('student-log-tab');
        if (tabName === 'log') {
            this.prayerContentArea.classList.add('hidden');
            if (logTab) logTab.classList.remove('hidden');
            this.loadPrayerLog();
        } else {
            this.prayerContentArea.classList.remove('hidden');
            if (logTab) logTab.classList.add('hidden');
        }
    }

    switchTeacherTab(tabName) {
        this.teacherTabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.teacherTab === tabName);
        });
        if (tabName === 'dashboard') {
            if (this.teacherRosterView) this.teacherRosterView.classList.add('hidden');
            if (this.teacherDashboardView) this.teacherDashboardView.classList.remove('hidden');
            this.loadTeacherDashboard();
        } else {
            if (this.teacherRosterView) this.teacherRosterView.classList.remove('hidden');
            if (this.teacherDashboardView) this.teacherDashboardView.classList.add('hidden');
            this.loadTeacherRoster();
        }
    }

    async loadTeacherDashboard() {
        if (!this.currentUser) return;
        const loadingEl = document.getElementById('dashboard-loading');
        const gridEl = document.getElementById('dashboard-grid');
        const emptyEl = document.getElementById('dashboard-empty');
        if (!gridEl) return;

        if (loadingEl) loadingEl.classList.remove('hidden');
        gridEl.innerHTML = '';
        if (emptyEl) emptyEl.classList.add('hidden');

        try {
            const studentsRef = this.collection(this.firebaseDb, 'teacherRosters', this.currentUser.uid, 'students');
            const rosterSnap = await this.getDocs(studentsRef);

            if (loadingEl) loadingEl.classList.add('hidden');

            if (rosterSnap.empty) {
                if (emptyEl) emptyEl.classList.remove('hidden');
                return;
            }

            const students = [];
            rosterSnap.forEach(d => students.push({ uid: d.id, ...d.data() }));

            const dateKey = this.getLogDateKey();
            const logFetches = students.map(s =>
                this.getDocs(this.collection(this.firebaseDb, 'prayerLogs', s.uid, dateKey))
                    .then(snap => {
                        const logs = {};
                        snap.forEach(d => { logs[d.id] = d.data(); });
                        return { uid: s.uid, logs };
                    })
            );

            const results = await Promise.all(logFetches);
            const logsMap = {};
            results.forEach(r => { logsMap[r.uid] = r.logs; });

            this.renderDashboardGrid(gridEl, students, logsMap);
        } catch (error) {
            console.error('Error loading dashboard:', error);
            if (loadingEl) loadingEl.classList.add('hidden');
            if (gridEl) gridEl.innerHTML = '<p class="log-no-times">Error loading dashboard. Please try again.</p>';
        }
    }

    renderDashboardGrid(gridEl, students, logsMap) {
        const prayerKeys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        const prayerLabels = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

        gridEl.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'dashboard-header-row';
        header.innerHTML = '<span></span>' + prayerLabels.map(p => `<span>${p}</span>`).join('');
        gridEl.appendChild(header);

        students.forEach(student => {
            const logs = logsMap[student.uid] || {};
            const row = document.createElement('div');
            row.className = 'dashboard-student-row';
            row.dataset.uid = student.uid;

            const nameCell = `<span class="dashboard-student-label">${student.username || student.email || 'Student'}</span>`;
            const prayerCells = prayerKeys.map(key => {
                const capitalized = key.charAt(0).toUpperCase() + key.slice(1);
                const log = logs[key] || logs[capitalized];
                if (!log) return `<span class="dashboard-cell missing" title="Not logged">✗</span>`;
                if (log.status === 'ontime') return `<span class="dashboard-cell ontime" title="On time">✓</span>`;
                return `<span class="dashboard-cell late" title="Late">⚠</span>`;
            });

            row.innerHTML = nameCell + prayerCells.join('');
            row.addEventListener('click', () => this.openStudentDetailPanel(student.uid, student, logs));
            gridEl.appendChild(row);
        });
    }

    openStudentDetailPanel(uid, student, logs) {
        const nameEl = document.getElementById('detail-student-name');
        const emailEl = document.getElementById('detail-student-email');
        const listEl = document.getElementById('detail-prayer-list');
        if (!nameEl || !listEl) return;

        nameEl.textContent = student.username || 'Student';
        if (emailEl) emailEl.textContent = student.email || '';

        const prayerKeys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        const prayerLabelMap = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };

        listEl.innerHTML = prayerKeys.map(key => {
            const label = prayerLabelMap[key];
            const log = logs[key] || logs[label];
            if (!log) {
                return `<div class="detail-prayer-row">
                    <span class="detail-prayer-name">${label}</span>
                    <span class="detail-prayer-time" style="color:#bbb">Not logged</span>
                </div>`;
            }
            const ts = (log.timestamp && log.timestamp.toDate) ? log.timestamp.toDate() : new Date(log.timestamp);
            const timeStr = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const badge = log.status === 'ontime'
                ? `<span class="log-status-badge ontime">On time</span>`
                : `<span class="log-status-badge late">Late</span>`;
            return `<div class="detail-prayer-row">
                <span class="detail-prayer-name">${label}</span>
                <span class="detail-prayer-time">${timeStr} ${badge}</span>
            </div>`;
        }).join('');

        if (this.teacherDetailPanel) {
            this.teacherDetailPanel.classList.remove('hidden');
            requestAnimationFrame(() => this.teacherDetailPanel.classList.add('open'));
        }
        if (this.detailOverlay) this.detailOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeDetailPanel() {
        if (this.teacherDetailPanel) {
            this.teacherDetailPanel.classList.remove('open');
            setTimeout(() => {
                if (!this.teacherDetailPanel.classList.contains('open')) {
                    this.teacherDetailPanel.classList.add('hidden');
                }
            }, 300);
        }
        if (this.detailOverlay) this.detailOverlay.classList.add('hidden');
        document.body.style.overflow = '';
    }

    openAuthModal(mode = 'login') {
        this.authModal.classList.add('show');
        this.switchAuthTab(mode);
        document.body.style.overflow = 'hidden';
    }

    closeAuthModal() {
        this.authModal.classList.remove('show');
        document.body.style.overflow = '';
        // Clear forms
        this.loginForm.reset();
        this.registerForm.reset();
        // Clear any error messages
        const existingError = document.querySelector('.auth-error');
        if (existingError) {
            existingError.remove();
        }
    }

    switchAuthTab(tab) {
        // Update tab buttons
        this.authTabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.authTab === tab);
        });

        // Update tab content
        document.querySelectorAll('.auth-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tab}-tab`);
        });

        // Update modal title
        this.authModalTitle.innerHTML = tab === 'login' 
            ? '<i class="fas fa-user"></i> Login' 
            : '<i class="fas fa-user-plus"></i> Create Account';
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-username').value.trim();

        if (!email) {
            this.showAuthError('Please enter your email');
            return;
        }

        const submitBtn = this.loginForm.querySelector('.auth-submit-btn');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }

        try {
            const actionCodeSettings = {
                url: window.location.origin + window.location.pathname,
                handleCodeInApp: true
            };
            await this.sendSignInLinkToEmail(this.firebaseAuth, email, actionCodeSettings);
            localStorage.setItem('emailLinkAddress', email);
            localStorage.setItem('emailLinkPendingData', JSON.stringify({ mode: 'login' }));

            // Show "link sent" message
            const sentEl = document.getElementById('login-link-sent');
            const sentEmailEl = document.getElementById('login-link-email');
            if (sentEl) sentEl.classList.remove('hidden');
            if (sentEmailEl) sentEmailEl.textContent = email;
            if (submitBtn) submitBtn.classList.add('hidden');
        } catch (error) {
            console.error('Send link error:', error);
            if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fas fa-envelope"></i> Send Login Link'; }
            let errorMessage = 'Failed to send link';
            if (error.code === 'auth/invalid-email') errorMessage = 'Invalid email address';
            else if (error.code === 'auth/too-many-requests') errorMessage = 'Too many requests. Please wait a moment.';
            this.showAuthError(errorMessage);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();

        // Validation
        if (!username || !email) {
            this.showAuthError('Please fill in all fields');
            return;
        }

        if (username.length < 3) {
            this.showAuthError('Username must be at least 3 characters');
            return;
        }

        if (!this.selectedRole) {
            this.showAuthError('Please select your role (Teacher or Student)');
            if (this.roleError) this.roleError.classList.remove('hidden');
            return;
        }

        const submitBtn = this.registerForm.querySelector('.auth-submit-btn');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }

        try {
            const actionCodeSettings = {
                url: window.location.origin + window.location.pathname,
                handleCodeInApp: true
            };
            await this.sendSignInLinkToEmail(this.firebaseAuth, email, actionCodeSettings);
            localStorage.setItem('emailLinkAddress', email);
            localStorage.setItem('emailLinkPendingData', JSON.stringify({
                mode: 'register',
                username,
                role: this.selectedRole
            }));

            // Show "link sent" message
            const sentEl = document.getElementById('register-link-sent');
            const sentEmailEl = document.getElementById('register-link-email');
            if (sentEl) sentEl.classList.remove('hidden');
            if (sentEmailEl) sentEmailEl.textContent = email;
            if (submitBtn) submitBtn.classList.add('hidden');

            // Reset role selection state
            this.selectedRole = null;
            this.roleCards.forEach(c => c.classList.remove('selected'));
        } catch (error) {
            console.error('Registration link error:', error);
            if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fas fa-envelope"></i> Create Account &amp; Send Link'; }
            let errorMessage = 'Failed to send link';
            if (error.code === 'auth/invalid-email') errorMessage = 'Invalid email address';
            else if (error.code === 'auth/too-many-requests') errorMessage = 'Too many requests. Please wait a moment.';
            this.showAuthError(errorMessage);
        }
    }

    async completeEmailLinkSignIn() {
        let email = localStorage.getItem('emailLinkAddress');

        if (!email) {
            // Ask user for email if opened on different device
            email = window.prompt('Please provide your email for confirmation:');
            if (!email) return;
        }

        try {
            await this.signInWithEmailLink(this.firebaseAuth, email, window.location.href);
            // Clean up URL (remove oobCode etc.)
            if (window.history && window.history.replaceState) {
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } catch (error) {
            console.error('Email link sign-in error:', error);
            // Clean up invalid link data
            localStorage.removeItem('emailLinkAddress');
            localStorage.removeItem('emailLinkPendingData');
        }
    }

    async logout() {
        try {
            await this.signOut(this.firebaseAuth);
            this.showSuccessMessage('Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
            this.showAuthError('Error logging out');
        }
    }

    openAccountModal() {
        if (!this.isLoggedIn) return;
        
        this.accountModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        this.populateAccountInfo();
    }

    closeAccountModal() {
        this.accountModal.classList.remove('show');
        document.body.style.overflow = '';
    }

    async populateAccountInfo() {
        if (!this.currentUser) return;

        try {
            const userDocRef = this.doc(this.firebaseDb, 'users', this.currentUser.uid);
            const userDoc = await this.getDoc(userDocRef);
            const userData = userDoc.exists() ? userDoc.data() : {};

            document.getElementById('account-username').textContent = this.currentUser.displayName || 'User';
            document.getElementById('account-email').textContent = this.currentUser.email;
            document.getElementById('account-created').textContent = userData.createdAt ? 
                userData.createdAt.toDate().toLocaleDateString() : 'Unknown';
            document.getElementById('account-logins').textContent = userData.loginCount || 0;
            document.getElementById('account-last-login').textContent = userData.lastLogin ? 
                userData.lastLogin.toDate().toLocaleString() : 'Never';
            document.getElementById('account-views').textContent = userData.viewCount || 0;
        } catch (error) {
            console.error('Error loading account info:', error);
        }
    }

    updateUserStats() {
        // This is now handled automatically in loadUserData when user logs in
        // and in handleAuthStateChange when viewing prayer times
    }

    showAuthError(message) {
        // Remove existing error messages
        const existingError = document.querySelector('.auth-error');
        if (existingError) {
            existingError.remove();
        }

        // Create error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'auth-error';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        
        // Insert into active auth form
        const activeTab = document.querySelector('.auth-tab-content.active');
        const form = activeTab.querySelector('.auth-form');
        form.insertBefore(errorDiv, form.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    showSuccessMessage(message) {
        // Create success notification
        const successDiv = document.createElement('div');
        successDiv.className = 'success-notification';
        successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        
        // Add to page
        document.body.appendChild(successDiv);
        
        // Show with animation
        setTimeout(() => successDiv.classList.add('show'), 10);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            successDiv.classList.remove('show');
            setTimeout(() => successDiv.remove(), 300);
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new PrayerTimesApp();
    app.startAutoRefresh();
}); 