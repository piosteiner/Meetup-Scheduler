// cookie-consent.js - Swiss FADP compliant cookie consent management

class CookieConsentManager {
    constructor() {
        try {
            this.cookieSettings = {
                necessary: true, // Always true, cannot be disabled
                analytics: false,
                functional: false,
                preferences: false
            };
            
            this.consentGiven = false;
            this.consentTimestamp = null;
            this.consentVersion = '1.0'; // Update when privacy policy changes
            
            // Swiss law requirements
            this.swissCompliance = {
                requiresConsent: true,
                allowsImpliedConsent: false, // Be explicit
                dataRetentionPeriod: 365, // Days
                requiresWithdrawal: true
            };
            
            console.log('🍪 Cookie consent manager initializing...');
            this.init();
        } catch (error) {
            console.error('❌ Error in CookieConsentManager constructor:', error);
        }
    }

    init() {
        try {
            console.log('🍪 Initializing cookie consent system...');
            
            // Check if consent has been given before
            this.loadConsentSettings();
            
            // Set up cookie monitoring
            this.setupCookieMonitoring();
            
            // Show consent banner if needed
            if (!this.consentGiven) {
                console.log('🍪 No consent found, showing banner...');
                this.showConsentBanner();
            } else {
                console.log('🍪 Consent already given, applying settings...');
            }
            
            // Apply current settings
            this.applyCookieSettings();
            
            console.log('✅ Cookie consent system initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing cookie consent system:', error);
        }
    }

    // Storage helpers — fall back to sessionStorage, then in-memory,
    // so the banner works even when Firefox blocks localStorage entirely.
    _storageGet(key) {
        try { return localStorage.getItem(key); } catch (_) {}
        try { return sessionStorage.getItem(key); } catch (_) {}
        return this._memStore ? (this._memStore[key] ?? null) : null;
    }

    _storageSet(key, value) {
        try { localStorage.setItem(key, value); return; } catch (_) {}
        try { sessionStorage.setItem(key, value); return; } catch (_) {}
        if (!this._memStore) this._memStore = {};
        this._memStore[key] = value;
    }

    _storageRemove(key) {
        try { localStorage.removeItem(key); } catch (_) {}
        try { sessionStorage.removeItem(key); } catch (_) {}
        if (this._memStore) delete this._memStore[key];
    }

    loadConsentSettings() {
        try {
            const savedConsent  = this._storageGet('cookieConsent');
            const savedSettings = this._storageGet('cookieSettings');
            const savedTimestamp = this._storageGet('consentTimestamp');
            const savedVersion  = this._storageGet('consentVersion');

            if (savedConsent === 'true' && savedVersion === this.consentVersion) {
                this.consentGiven = true;
                this.consentTimestamp = savedTimestamp;
                if (savedSettings) {
                    this.cookieSettings = { ...this.cookieSettings, ...JSON.parse(savedSettings) };
                }
            } else if (savedVersion && savedVersion !== this.consentVersion) {
                // Privacy policy updated — ask again
                this.clearOldConsent();
            }
        } catch (error) {
            console.warn('Error loading cookie consent settings:', error);
        }
    }

    saveConsentSettings() {
        try {
            this._storageSet('cookieConsent',    'true');
            this._storageSet('cookieSettings',   JSON.stringify(this.cookieSettings));
            this._storageSet('consentTimestamp', new Date().toISOString());
            this._storageSet('consentVersion',   this.consentVersion);
        } catch (error) {
            console.warn('Error saving cookie consent settings:', error);
        }
    }

    clearOldConsent() {
        this._storageRemove('cookieConsent');
        this._storageRemove('cookieSettings');
        this._storageRemove('consentTimestamp');
        this._storageRemove('consentVersion');
        this.consentGiven = false;
    }

    setupCookieMonitoring() {
        // Monitor for unauthorized cookies
        setInterval(() => {
            this.auditCookies();
        }, 5000);
    }

    auditCookies() {
        const cookies = document.cookie.split(';');
        const allowedCookies = this.getAllowedCookies();
        
        cookies.forEach(cookie => {
            const name = cookie.split('=')[0].trim();
            if (name && !allowedCookies.includes(name)) {
                console.warn(`Unauthorized cookie detected: ${name}`);
                // Could automatically remove unauthorized cookies
            }
        });
    }

    getAllowedCookies() {
        const allowed = ['cookieConsent', 'consentTimestamp', 'consentVersion', 'cookieSettings'];
        
        if (this.cookieSettings.functional) {
            allowed.push('theme', 'language', 'userPreferences');
        }
        
        if (this.cookieSettings.analytics) {
            allowed.push('_ga', '_gid', '_gat', 'analytics');
        }
        
        if (this.cookieSettings.preferences) {
            allowed.push('participantName', 'lastMeetupKey');
        }
        
        return allowed;
    }

    showConsentBanner() {
        try {
            console.log('🍪 Creating consent banner...');

            // Ensure document.body is available
            if (!document.body) {
                console.log('🍪 Document body not ready, waiting...');
                setTimeout(() => this.showConsentBanner(), 100);
                return;
            }

            // Remove any existing banner first
            const existing = document.getElementById('cookie-consent-banner');
            if (existing) existing.remove();

            const banner = this.createConsentBanner();
            document.body.appendChild(banner);

            // IMPORTANT: Do NOT blur or disable document.body.
            // Doing so causes a deadlock when privacy extensions (e.g. Firefox
            // I Don't Care About Cookies) auto-dismiss the banner — the page
            // stays blurred and non-interactive with no way to recover.
            // The backdrop inside the banner handles the visual overlay instead.

            // Safety fallback: if nothing is clicked within 4 seconds (banner
            // was suppressed by an extension), silently accept necessary-only
            // so the site remains fully usable.
            this._fallbackTimer = setTimeout(() => {
                if (!this.consentGiven) {
                    console.log('🍪 Banner not interacted with — applying necessary-only fallback.');
                    this.rejectAll();
                }
            }, 4000);

            console.log('✅ Consent banner displayed');
        } catch (error) {
            console.error('❌ Error showing consent banner:', error);
            // Last resort: if the banner itself fails, still unblock the page
            this.rejectAll();
        }
    }

    createConsentBanner() {
        try {
            console.log('🍪 Building consent banner HTML...');
            const banner = document.createElement('div');
            banner.id = 'cookie-consent-banner';
        banner.innerHTML = `
            <div class="cookie-consent-backdrop">
                <div class="cookie-consent-modal">
                    <div class="cookie-consent-header">
                        <h2>🍪 Cookie-Einstellungen / Cookie Settings</h2>
                        <p class="cookie-consent-subtitle">Datenschutz nach Schweizer Recht / Privacy according to Swiss law</p>
                    </div>
                    
                    <div class="cookie-consent-content">
                        <div class="cookie-consent-tabs">
                            <button class="cookie-tab active" data-tab="overview">Übersicht / Overview</button>
                            <button class="cookie-tab" data-tab="details">Details</button>
                            <button class="cookie-tab" data-tab="rights">Ihre Rechte / Your Rights</button>
                        </div>
                        
                        <div class="cookie-tab-content active" data-content="overview">
                            <p><strong>Deutsch:</strong> Wir verwenden Cookies, um Ihnen die bestmögliche Erfahrung zu bieten. Einige sind für das Funktionieren der Website erforderlich, andere helfen uns, die Website zu verbessern.</p>
                            <p><strong>English:</strong> We use cookies to provide you with the best possible experience. Some are required for the website to function, others help us improve the website.</p>
                            
                            <div class="cookie-categories">
                                <div class="cookie-category">
                                    <div class="category-header">
                                        <label>
                                            <input type="checkbox" checked disabled>
                                            <span class="category-title">Notwendige Cookies / Necessary Cookies</span>
                                            <span class="category-required">(Erforderlich / Required)</span>
                                        </label>
                                    </div>
                                    <p class="category-description">Für grundlegende Funktionen der Website. / For basic website functionality.</p>
                                </div>
                                
                                <div class="cookie-category">
                                    <div class="category-header">
                                        <label>
                                            <input type="checkbox" id="functional-cookies" ${this.cookieSettings.functional ? 'checked' : ''}>
                                            <span class="category-title">Funktionale Cookies / Functional Cookies</span>
                                        </label>
                                    </div>
                                    <p class="category-description">Speichern Ihre Einstellungen und Präferenzen. / Store your settings and preferences.</p>
                                </div>
                                
                                <div class="cookie-category">
                                    <div class="category-header">
                                        <label>
                                            <input type="checkbox" id="analytics-cookies" ${this.cookieSettings.analytics ? 'checked' : ''}>
                                            <span class="category-title">Analyse Cookies / Analytics Cookies</span>
                                        </label>
                                    </div>
                                    <p class="category-description">Helfen uns die Website zu verbessern. / Help us improve the website.</p>
                                </div>
                                
                                <div class="cookie-category">
                                    <div class="category-header">
                                        <label>
                                            <input type="checkbox" id="preferences-cookies" ${this.cookieSettings.preferences ? 'checked' : ''}>
                                            <span class="category-title">Präferenz Cookies / Preference Cookies</span>
                                        </label>
                                    </div>
                                    <p class="category-description">Merken sich Ihre Teilnehmerdaten für zukünftige Meetings. / Remember your participant data for future meetings.</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="cookie-tab-content" data-content="details">
                            <h3>Detaillierte Cookie-Informationen / Detailed Cookie Information</h3>
                            
                            <div class="cookie-detail-section">
                                <h4>Notwendige Cookies / Necessary Cookies</h4>
                                <ul>
                                    <li><strong>cookieConsent</strong> - Speichert Ihre Cookie-Einwilligung / Stores your cookie consent</li>
                                    <li><strong>theme</strong> - Ihr gewähltes Design / Your selected theme</li>
                                </ul>
                            </div>
                            
                            <div class="cookie-detail-section">
                                <h4>Funktionale Cookies / Functional Cookies</h4>
                                <ul>
                                    <li><strong>userPreferences</strong> - Ihre App-Einstellungen / Your app preferences</li>
                                    <li><strong>language</strong> - Ihre Spracheinstellung / Your language setting</li>
                                </ul>
                            </div>
                            
                            <div class="cookie-detail-section">
                                <h4>Präferenz Cookies / Preference Cookies</h4>
                                <ul>
                                    <li><strong>participantName</strong> - Ihr Name für schnelleres Beitreten / Your name for faster joining</li>
                                    <li><strong>lastMeetupKey</strong> - Ihr letzter Meetup-Schlüssel / Your last meetup key</li>
                                </ul>
                            </div>
                            
                            <p class="data-retention"><strong>Aufbewahrungszeit / Retention period:</strong> ${this.swissCompliance.dataRetentionPeriod} Tage / days</p>
                        </div>
                        
                        <div class="cookie-tab-content" data-content="rights">
                            <h3>Ihre Rechte nach Schweizer Datenschutzgesetz / Your Rights under Swiss Data Protection Law</h3>
                            
                            <div class="rights-section">
                                <h4>🇩🇪 Deutsch</h4>
                                <ul>
                                    <li><strong>Recht auf Information:</strong> Sie haben das Recht zu erfahren, welche Daten wir sammeln</li>
                                    <li><strong>Recht auf Zugang:</strong> Sie können Einsicht in Ihre gespeicherten Daten verlangen</li>
                                    <li><strong>Recht auf Berichtigung:</strong> Falsche Daten können korrigiert werden</li>
                                    <li><strong>Recht auf Löschung:</strong> Sie können die Löschung Ihrer Daten verlangen</li>
                                    <li><strong>Widerspruchsrecht:</strong> Sie können der Datenverarbeitung widersprechen</li>
                                </ul>
                                
                                <h4>🇬🇧 English</h4>
                                <ul>
                                    <li><strong>Right to Information:</strong> You have the right to know what data we collect</li>
                                    <li><strong>Right of Access:</strong> You can request access to your stored data</li>
                                    <li><strong>Right to Rectification:</strong> Incorrect data can be corrected</li>
                                    <li><strong>Right to Erasure:</strong> You can request deletion of your data</li>
                                    <li><strong>Right to Object:</strong> You can object to data processing</li>
                                </ul>
                            </div>
                            
                            <div class="contact-info">
                                <h4>Kontakt / Contact</h4>
                                <p>📧 Email: privacy@piogino-meetup.ch</p>
                                <p>📍 Adresse / Address: [Your Swiss Address]</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="cookie-consent-actions">
                        <button class="btn-secondary" onclick="window.cookieConsent.rejectAll()">
                            Alle ablehnen / Reject All
                        </button>
                        <button class="btn-secondary" onclick="window.cookieConsent.showSettings()">
                            Einstellungen / Settings
                        </button>
                        <button class="btn-primary" onclick="window.cookieConsent.acceptAll()">
                            Alle akzeptieren / Accept All
                        </button>
                        <button class="btn-primary" onclick="window.cookieConsent.saveCurrentSelection()">
                            Auswahl speichern / Save Selection
                        </button>
                    </div>
                    
                    <div class="swiss-compliance-notice">
                        <p><small>Diese Website ist konform mit dem Schweizer Bundesgesetz über den Datenschutz (DSG). / This website complies with the Swiss Federal Data Protection Act (FADP).</small></p>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners
        this.setupBannerEventListeners(banner);
        
        console.log('✅ Banner HTML created successfully');
        return banner;
        } catch (error) {
            console.error('❌ Error creating consent banner:', error);
            // Return a simple fallback banner
            const fallback = document.createElement('div');
            fallback.innerHTML = '<div>Cookie consent system error. Please refresh the page.</div>';
            return fallback;
        }
    }

    setupBannerEventListeners(banner) {
        // Tab switching
        banner.querySelectorAll('.cookie-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(banner, tabName);
            });
        });
        
        // Checkbox changes
        banner.querySelectorAll('input[type="checkbox"]:not([disabled])').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const category = e.target.id.replace('-cookies', '');
                this.cookieSettings[category] = e.target.checked;
            });
        });
    }

    switchTab(banner, tabName) {
        // Remove active class from all tabs and contents
        banner.querySelectorAll('.cookie-tab').forEach(tab => tab.classList.remove('active'));
        banner.querySelectorAll('.cookie-tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to selected tab and content
        banner.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        banner.querySelector(`[data-content="${tabName}"]`).classList.add('active');
    }

    acceptAll() {
        this.cookieSettings = {
            necessary: true,
            analytics: true,
            functional: true,
            preferences: true
        };
        this.giveConsent();
    }

    rejectAll() {
        this.cookieSettings = {
            necessary: true,
            analytics: false,
            functional: false,
            preferences: false
        };
        this.giveConsent();
    }

    saveCurrentSelection() {
        this.giveConsent();
    }

    giveConsent() {
        this.consentGiven = true;
        this.consentTimestamp = new Date().toISOString();
        this.saveConsentSettings();
        this.applyCookieSettings();
        this.hideBanner();
        
        // Notify other parts of the app
        window.dispatchEvent(new CustomEvent('cookieConsentGiven', {
            detail: this.cookieSettings
        }));
    }

    hideBanner() {
        // Clear the safety fallback timer if the user acted themselves
        if (this._fallbackTimer) {
            clearTimeout(this._fallbackTimer);
            this._fallbackTimer = null;
        }

        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.remove();
        }

        // Body blur was intentionally removed — nothing to undo here.
    }

    applyCookieSettings() {
        // Remove all non-necessary cookies first
        this.removeUnnecessaryCookies();
        
        // Apply settings
        if (this.cookieSettings.analytics) {
            this.enableAnalytics();
        } else {
            this.disableAnalytics();
        }
        
        if (this.cookieSettings.functional) {
            this.enableFunctionalCookies();
        } else {
            this.disableFunctionalCookies();
        }
        
        if (this.cookieSettings.preferences) {
            this.enablePreferenceCookies();
        } else {
            this.disablePreferenceCookies();
        }
    }

    removeUnnecessaryCookies() {
        const allowedCookies = this.getAllowedCookies();
        const cookies = document.cookie.split(';');
        
        cookies.forEach(cookie => {
            const name = cookie.split('=')[0].trim();
            if (name && !allowedCookies.includes(name)) {
                // Remove unauthorized cookie
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            }
        });
    }

    enableAnalytics() {
        // Enable analytics tracking (placeholder)
        console.log('Analytics enabled');
    }

    disableAnalytics() {
        // Disable analytics tracking
        console.log('Analytics disabled');
    }

    enableFunctionalCookies() {
        // Enable functional cookies
        console.log('Functional cookies enabled');
    }

    disableFunctionalCookies() {
        // Disable functional cookies
        console.log('Functional cookies disabled');
    }

    enablePreferenceCookies() {
        // Enable preference cookies
        console.log('Preference cookies enabled');
    }

    disablePreferenceCookies() {
        // Disable preference cookies and clear existing ones
        document.cookie = 'participantName=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'lastMeetupKey=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        console.log('Preference cookies disabled');
    }

    // Methods for withdrawing consent
    withdrawConsent() {
        this.clearOldConsent();
        this.removeUnnecessaryCookies();
        this.showConsentBanner();
    }

    showSettings() {
        this.showConsentBanner();
    }

    // Check if specific cookie category is allowed
    isCategoryAllowed(category) {
        return this.consentGiven && this.cookieSettings[category];
    }

    // Get consent status for external use
    getConsentStatus() {
        return {
            consentGiven: this.consentGiven,
            timestamp: this.consentTimestamp,
            version: this.consentVersion,
            settings: { ...this.cookieSettings }
        };
    }
}

// Create global instance when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🍪 DOM loaded, creating cookie consent manager...');
        window.cookieConsent = new CookieConsentManager();
    });
} else {
    console.log('🍪 DOM already loaded, creating cookie consent manager immediately...');
    window.cookieConsent = new CookieConsentManager();
}

// Add to global debug functions
window.debugCookieConsent = function() {
    console.log('🍪 COOKIE CONSENT DEBUG INFO:');
    console.log('Consent Status:', window.cookieConsent.getConsentStatus());
    console.log('Allowed Cookies:', window.cookieConsent.getAllowedCookies());
    console.log('Current Cookies:', document.cookie.split(';').map(c => c.split('=')[0].trim()));
};

console.log('✅ Cookie consent manager loaded (Swiss FADP compliant)');
