// cookie-settings-button.js - Floating cookie settings button

class CookieSettingsButton {
    constructor() {
        this.button = null;
        this.init();
    }

    init() {
        // Wait for cookie consent to be loaded
        if (typeof window.cookieConsent === 'undefined') {
            setTimeout(() => this.init(), 100);
            return;
        }

        this.createButton();
        this.attachEventListeners();
        
        // Show button only if consent has been given
        if (window.cookieConsent.consentGiven) {
            this.showButton();
        }

        // Listen for consent events
        window.addEventListener('cookieConsentGiven', () => {
            this.showButton();
        });
    }

    createButton() {
        this.button = document.createElement('button');
        this.button.className = 'cookie-settings-button';
        this.button.innerHTML = '🍪';
        this.button.title = 'Cookie-Einstellungen / Cookie Settings';
        this.button.setAttribute('aria-label', 'Cookie-Einstellungen öffnen / Open cookie settings');
        this.button.style.display = 'none';
        
        document.body.appendChild(this.button);
    }

    attachEventListeners() {
        this.button.addEventListener('click', () => {
            window.cookieConsent.showSettings();
        });

        // Hide/show based on scroll position (optional UX improvement)
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (this.button.style.display !== 'none') {
                this.button.style.opacity = '0.5';
                
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    this.button.style.opacity = '1';
                }, 1000);
            }
        });

        // Keyboard accessibility
        this.button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.cookieConsent.showSettings();
            }
        });
    }

    showButton() {
        if (this.button) {
            this.button.style.display = 'block';
            // Animate in
            setTimeout(() => {
                this.button.style.opacity = '1';
            }, 100);
        }
    }

    hideButton() {
        if (this.button) {
            this.button.style.display = 'none';
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new CookieSettingsButton();
    });
} else {
    new CookieSettingsButton();
}

console.log('✅ Cookie settings button loaded');
