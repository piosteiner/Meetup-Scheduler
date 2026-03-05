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

            // Safety fallback: if no button is clicked within 1 second (i.e. an
            // extension auto-dismissed the banner), apply necessary-only and
            // remove the bar so the site is fully usable.
            this._fallbackTimer = setTimeout(() => {
                if (!this.consentGiven) {
                    console.log('🍪 Banner not interacted with — applying necessary-only fallback.');
                    this.rejectAll();
                }
            }, 1000);

            console.log('✅ Consent banner displayed');
        } catch (error) {
            console.error('❌ Error showing consent banner:', error);
            // Last resort: if the banner itself fails, still unblock the page
            this.rejectAll();
        }
    }

    createConsentBanner() {
        try {
            const banner = document.createElement('div');
            banner.id = 'cookie-consent-banner';
            // Bottom-bar style: sits at the bottom of the viewport, never covers
            // or darkens the page. This is immune to extension interference because
            // there is no full-screen backdrop to leave behind if the modal is removed.
            banner.innerHTML = `
                <div class="ccb-bar">
                    <div class="ccb-simple" id="ccb-simple">
                        <span class="ccb-text">
                            🍪 <strong>Cookies</strong> — Wir verwenden nur notwendige Cookies.
                            Weitere Kategorien nur mit Ihrer Zustimmung (Swiss DSG / FADP).
                        </span>
                        <div class="ccb-actions">
                            <button class="ccb-btn ccb-btn--secondary" onclick="window.cookieConsent.rejectAll()">Ablehnen / Reject</button>
                            <button class="ccb-btn ccb-btn--secondary" onclick="window.cookieConsent._showDetailPanel()">Einstellungen / Settings</button>
                            <button class="ccb-btn ccb-btn--primary" onclick="window.cookieConsent.acceptAll()">Alle akzeptieren / Accept All</button>
                        </div>
                    </div>

                    <div class="ccb-detail" id="ccb-detail" style="display:none;">
                        <div class="ccb-detail-header">
                            <strong>🍪 Cookie-Einstellungen / Cookie Settings</strong>
                            <small>Swiss DSG / FADP compliant</small>
                        </div>
                        <div class="ccb-categories">
                            <label class="ccb-category">
                                <input type="checkbox" checked disabled>
                                <span><strong>Notwendige / Necessary</strong> — Immer aktiv / Always on</span>
                            </label>
                            <label class="ccb-category">
                                <input type="checkbox" id="functional-cookies" ${this.cookieSettings.functional ? 'checked' : ''}>
                                <span><strong>Funktionale / Functional</strong> — Theme, Sprache / Language</span>
                            </label>
                            <label class="ccb-category">
                                <input type="checkbox" id="preferences-cookies" ${this.cookieSettings.preferences ? 'checked' : ''}>
                                <span><strong>Präferenzen / Preferences</strong> — Name, letzter Meetup-Key</span>
                            </label>
                            <label class="ccb-category">
                                <input type="checkbox" id="analytics-cookies" ${this.cookieSettings.analytics ? 'checked' : ''}>
                                <span><strong>Analyse / Analytics</strong> — Anonyme Nutzungsstatistiken</span>
                            </label>
                        </div>
                        <div class="ccb-actions">
                            <button class="ccb-btn ccb-btn--secondary" onclick="window.cookieConsent.rejectAll()">Alle ablehnen / Reject All</button>
                            <button class="ccb-btn ccb-btn--primary" onclick="window.cookieConsent.saveCurrentSelection()">Auswahl speichern / Save</button>
                            <button class="ccb-btn ccb-btn--primary" onclick="window.cookieConsent.acceptAll()">Alle akzeptieren / Accept All</button>
                        </div>
                        <div class="ccb-legal">
                            <small>Konform mit dem Schweizer Bundesgesetz über den Datenschutz (DSG) /
                            Compliant with the Swiss Federal Data Protection Act (FADP).</small>
                        </div>
                    </div>
                </div>
            `;

            this.setupBannerEventListeners(banner);
            return banner;
        } catch (error) {
            console.error('❌ Error creating consent banner:', error);
            const fallback = document.createElement('div');
            fallback.innerHTML = '<div style="position:fixed;bottom:0;left:0;right:0;background:#1f2937;color:white;padding:12px;z-index:10001;">Cookie consent error — <button onclick="window.cookieConsent.rejectAll()">Continue with necessary only</button></div>';
            return fallback;
        }
    }

    _showDetailPanel() {
        const simple = document.getElementById('ccb-simple');
        const detail = document.getElementById('ccb-detail');
        if (simple) simple.style.display = 'none';
        if (detail) detail.style.display = 'block';
    }

    setupBannerEventListeners(banner) {
        // Checkbox changes — keep in sync with this.cookieSettings
        banner.querySelectorAll('input[type="checkbox"]:not([disabled])').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const category = e.target.id.replace('-cookies', '');
                this.cookieSettings[category] = e.target.checked;
            });
        });
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
