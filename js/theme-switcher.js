// js/theme-switcher.js - Theme switcher functionality

class ThemeSwitcher {
    constructor() {
        this.themes = [
            { 
                key: 'light', 
                label: 'Light', 
                icon: '☀️',
                description: 'Light theme'
            },
            { 
                key: 'dark', 
                label: 'Dark', 
                icon: '🌙',
                description: 'Dark theme'
            },
            { 
                key: 'sepia', 
                label: 'Sepia', 
                icon: '📜',
                description: 'Sepia theme for reduced eye strain'
            }
        ];
        
        this.currentThemeIndex = 0;
        this.storageKey = 'piogino-theme-preference';
        
        this.init();
    }

    init() {
        // Get saved preference or detect system preference
        const savedTheme = this.getSavedTheme();
        
        if (savedTheme) {
            // Use saved preference
            this.currentThemeIndex = this.themes.findIndex(theme => theme.key === savedTheme);
            if (this.currentThemeIndex === -1) this.currentThemeIndex = 0;
        } else {
            // Detect system preference
            this.currentThemeIndex = this.detectSystemTheme();
        }
        
        // Apply the initial theme
        this.applyTheme(this.themes[this.currentThemeIndex].key);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Update UI
        this.updateUI();
        
        console.log('✅ Theme switcher initialized with theme:', this.themes[this.currentThemeIndex].key);
    }

    detectSystemTheme() {
        // Check for system dark mode preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return this.themes.findIndex(theme => theme.key === 'dark');
        }
        
        // Default to light theme
        return this.themes.findIndex(theme => theme.key === 'light');
    }

    getSavedTheme() {
        try {
            return localStorage.getItem(this.storageKey);
        } catch (error) {
            console.warn('Could not access localStorage for theme preference:', error);
            return null;
        }
    }

    saveTheme(themeKey) {
        try {
            localStorage.setItem(this.storageKey, themeKey);
        } catch (error) {
            console.warn('Could not save theme preference to localStorage:', error);
        }
    }

    setupEventListeners() {
        const themeButton = document.getElementById('themeButton');
        if (themeButton) {
            themeButton.addEventListener('click', () => {
                this.cycleTheme();
            });
        }

        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                // Only auto-switch if user hasn't manually set a preference
                const savedTheme = this.getSavedTheme();
                if (!savedTheme) {
                    this.currentThemeIndex = e.matches ? 
                        this.themes.findIndex(theme => theme.key === 'dark') :
                        this.themes.findIndex(theme => theme.key === 'light');
                    this.applyTheme(this.themes[this.currentThemeIndex].key);
                    this.updateUI();
                }
            });
        }

        // Keyboard shortcut: Ctrl/Cmd + Shift + T
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.cycleTheme();
            }
        });
    }

    cycleTheme() {
        // Move to next theme
        this.currentThemeIndex = (this.currentThemeIndex + 1) % this.themes.length;
        const newTheme = this.themes[this.currentThemeIndex];
        
        // Apply and save the new theme
        this.applyTheme(newTheme.key);
        this.saveTheme(newTheme.key);
        this.updateUI();
        
        // Show a brief notification
        this.showThemeNotification(newTheme);
        
        console.log('Theme switched to:', newTheme.key);
    }

    applyTheme(themeKey) {
        const html = document.documentElement;
        
        // Remove all theme classes
        this.themes.forEach(theme => {
            html.classList.remove(`theme-${theme.key}`);
        });
        
        // Remove existing data-theme attribute
        html.removeAttribute('data-theme');
        
        // Apply new theme
        if (themeKey !== 'light') {
            html.setAttribute('data-theme', themeKey);
        }
        
        // Add theme class for additional styling if needed
        html.classList.add(`theme-${themeKey}`);
        
        // Add theme transition class temporarily for smooth transitions
        html.classList.add('theme-transition');
        setTimeout(() => {
            html.classList.remove('theme-transition');
        }, 300);
    }

    updateUI() {
        const currentTheme = this.themes[this.currentThemeIndex];
        
        // Update button content
        const themeIcon = document.getElementById('themeIcon');
        const themeLabel = document.getElementById('themeLabel');
        const themeButton = document.getElementById('themeButton');
        
        if (themeIcon) {
            themeIcon.textContent = currentTheme.icon;
        }
        
        if (themeLabel) {
            themeLabel.textContent = currentTheme.label;
        }
        
        if (themeButton) {
            themeButton.title = `Current: ${currentTheme.label}. Click to switch to next theme (${this.getNextTheme().label})`;
        }

        // Update theme switcher background based on current theme
        this.updateSwitcherAppearance(currentTheme.key);
    }

    updateSwitcherAppearance(themeKey) {
        const themeSwitcher = document.getElementById('themeSwitcher');
        if (!themeSwitcher) return;

        // Reset classes
        themeSwitcher.className = 'fixed top-4 left-4 z-50 rounded-xl p-3 shadow-lg transition-all duration-300 hover:shadow-xl';
        
        // Apply theme-specific styling
        switch (themeKey) {
            case 'dark':
                themeSwitcher.classList.add('bg-gray-800/90', 'backdrop-blur-sm', 'border', 'border-gray-600');
                const darkButton = themeSwitcher.querySelector('#themeButton');
                const darkLabel = themeSwitcher.querySelector('#themeLabel');
                if (darkButton) {
                    darkButton.className = 'flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors duration-200';
                }
                if (darkLabel) {
                    darkLabel.className = 'text-sm font-medium text-gray-200 hidden sm:inline';
                }
                break;
                
            case 'sepia':
                themeSwitcher.classList.add('bg-amber-100/90', 'backdrop-blur-sm', 'border', 'border-amber-300');
                const sepiaButton = themeSwitcher.querySelector('#themeButton');
                const sepiaLabel = themeSwitcher.querySelector('#themeLabel');
                if (sepiaButton) {
                    sepiaButton.className = 'flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-200 hover:bg-amber-300 transition-colors duration-200';
                }
                if (sepiaLabel) {
                    sepiaLabel.className = 'text-sm font-medium text-amber-800 hidden sm:inline';
                }
                break;
                
            case 'light':
            default:
                themeSwitcher.classList.add('bg-white/90', 'backdrop-blur-sm', 'border', 'border-gray-300');
                const lightButton = themeSwitcher.querySelector('#themeButton');
                const lightLabel = themeSwitcher.querySelector('#themeLabel');
                if (lightButton) {
                    lightButton.className = 'flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200';
                }
                if (lightLabel) {
                    lightLabel.className = 'text-sm font-medium text-gray-700 hidden sm:inline';
                }
                break;
        }
    }

    getNextTheme() {
        const nextIndex = (this.currentThemeIndex + 1) % this.themes.length;
        return this.themes[nextIndex];
    }

    showThemeNotification(theme) {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-20 left-4 z-50 bg-black/80 text-white px-4 py-2 rounded-lg text-sm font-medium opacity-0 transition-opacity duration-200';
        notification.textContent = `Switched to ${theme.label} theme`;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('opacity-0');
        }, 10);
        
        // Animate out and remove
        setTimeout(() => {
            notification.classList.add('opacity-0');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 200);
        }, 1500);
    }

    // Public method to set a specific theme
    setTheme(themeKey) {
        const themeIndex = this.themes.findIndex(theme => theme.key === themeKey);
        if (themeIndex === -1) {
            console.warn('Unknown theme:', themeKey);
            return false;
        }
        
        this.currentThemeIndex = themeIndex;
        this.applyTheme(themeKey);
        this.saveTheme(themeKey);
        this.updateUI();
        return true;
    }

    // Public method to get current theme
    getCurrentTheme() {
        return this.themes[this.currentThemeIndex];
    }

    // Public method to get all available themes
    getAvailableThemes() {
        return [...this.themes];
    }

    // Public method to reset to system preference
    resetToSystemPreference() {
        // Clear saved preference
        try {
            localStorage.removeItem(this.storageKey);
        } catch (error) {
            console.warn('Could not clear theme preference:', error);
        }
        
        // Apply system theme
        this.currentThemeIndex = this.detectSystemTheme();
        this.applyTheme(this.themes[this.currentThemeIndex].key);
        this.updateUI();
        
        console.log('Theme reset to system preference:', this.themes[this.currentThemeIndex].key);
    }
}

// Initialize theme switcher when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if not already initialized
    if (!window.themeSwitcher) {
        window.themeSwitcher = new ThemeSwitcher();
    }
});

// Make theme switcher available globally for debugging
window.ThemeSwitcher = ThemeSwitcher;

console.log('✅ Theme switcher script loaded');