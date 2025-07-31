// js/theme-switcher.js - Fixed Theme switcher with 3 themes only

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
        console.log('🎨 Initializing theme switcher...');
        
        // Get saved preference or detect system preference
        const savedTheme = this.getSavedTheme();
        
        if (savedTheme) {
            // Use saved preference
            console.log('📁 Found saved theme preference:', savedTheme);
            this.currentThemeIndex = this.themes.findIndex(theme => theme.key === savedTheme);
            if (this.currentThemeIndex === -1) {
                console.warn('⚠️ Invalid saved theme, defaulting to light');
                this.currentThemeIndex = 0;
            }
        } else {
            // Detect system preference
            console.log('🔍 No saved preference, detecting system theme...');
            this.currentThemeIndex = this.detectSystemTheme();
        }
        
        const initialTheme = this.themes[this.currentThemeIndex];
        console.log('🎯 Applying initial theme:', initialTheme.key);
        
        // Apply the initial theme immediately
        this.applyTheme(initialTheme.key);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Update UI
        this.updateUI();
        
        console.log('✅ Theme switcher initialized with theme:', initialTheme.key);
    }

    detectSystemTheme() {
        // Check for system dark mode preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            console.log('🌙 System prefers dark mode');
            return this.themes.findIndex(theme => theme.key === 'dark');
        }
        
        // Default to light theme
        console.log('☀️ System prefers light mode (or unknown)');
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
            console.log('💾 Saved theme preference:', themeKey);
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
            console.log('🔧 Theme button event listener attached');
        } else {
            console.warn('⚠️ Theme button not found in DOM');
        }

        // Listen for system theme changes (but only if user hasn't set a preference)
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                // Only auto-switch if user hasn't manually set a preference
                const savedTheme = this.getSavedTheme();
                if (!savedTheme) {
                    console.log('🔄 System theme changed, updating automatically');
                    this.currentThemeIndex = e.matches ? 
                        this.themes.findIndex(theme => theme.key === 'dark') :
                        this.themes.findIndex(theme => theme.key === 'light');
                    this.applyTheme(this.themes[this.currentThemeIndex].key);
                    this.updateUI();
                } else {
                    console.log('👤 Ignoring system theme change (user has manual preference)');
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
        
        console.log('🔄 Cycling to theme:', newTheme.key);
        
        // Apply and save the new theme
        this.applyTheme(newTheme.key);
        this.saveTheme(newTheme.key);
        this.updateUI();
        
        // Show a brief notification
        this.showThemeNotification(newTheme);
    }

    applyTheme(themeKey) {
        console.log('🎨 Applying theme:', themeKey);
        const html = document.documentElement;
        
        // Remove all existing theme classes and attributes
        this.themes.forEach(theme => {
            html.classList.remove(`theme-${theme.key}`);
            html.removeAttribute(`data-theme`);
        });
        
        // Apply new theme - FIXED: Always set data-theme attribute
        html.setAttribute('data-theme', themeKey);
        html.classList.add(`theme-${themeKey}`);
        
        console.log('✅ Theme applied. data-theme =', html.getAttribute('data-theme'));
        
        // Add theme transition class temporarily for smooth transitions
        html.classList.add('theme-transition');
        setTimeout(() => {
            html.classList.remove('theme-transition');
        }, 300);
    }

    updateUI() {
        const currentTheme = this.themes[this.currentThemeIndex];
        console.log('🔧 Updating UI for theme:', currentTheme.key);
        
        // Update button content
        const themeIcon = document.getElementById('themeIcon');
        const themeLabel = document.getElementById('themeLabel');
        const themeButton = document.getElementById('themeButton');
        
        if (themeIcon) {
            themeIcon.textContent = currentTheme.icon;
        } else {
            console.warn('⚠️ Theme icon element not found');
        }
        
        if (themeLabel) {
            themeLabel.textContent = currentTheme.label;
        } else {
            console.warn('⚠️ Theme label element not found');
        }
        
        if (themeButton) {
            const nextTheme = this.getNextTheme();
            themeButton.title = `Current: ${currentTheme.label}. Click to switch to ${nextTheme.label}`;
        }

        // Update theme switcher appearance based on current theme
        this.updateSwitcherAppearance(currentTheme.key);
    }

    updateSwitcherAppearance(themeKey) {
        const themeSwitcher = document.getElementById('themeSwitcher');
        if (!themeSwitcher) {
            console.warn('⚠️ Theme switcher element not found');
            return;
        }

        // Reset classes
        themeSwitcher.className = 'fixed top-4 left-4 z-50 rounded-xl p-3 shadow-lg transition-all duration-300 hover:shadow-xl';
        
        const themeButton = themeSwitcher.querySelector('#themeButton');
        const themeLabel = themeSwitcher.querySelector('#themeLabel');
        
        // Apply theme-specific styling
        switch (themeKey) {
            case 'dark':
                themeSwitcher.classList.add('bg-gray-800/90', 'backdrop-blur-sm', 'border', 'border-gray-600');
                if (themeButton) {
                    themeButton.className = 'flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors duration-200';
                }
                if (themeLabel) {
                    themeLabel.className = 'text-sm font-medium text-gray-200 hidden sm:inline';
                }
                break;
                
            case 'sepia':
                themeSwitcher.classList.add('bg-amber-100/90', 'backdrop-blur-sm', 'border', 'border-amber-300');
                if (themeButton) {
                    themeButton.className = 'flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-200 hover:bg-amber-300 transition-colors duration-200';
                }
                if (themeLabel) {
                    themeLabel.className = 'text-sm font-medium text-amber-800 hidden sm:inline';
                }
                break;
                
            case 'light':
            default:
                themeSwitcher.classList.add('bg-white/90', 'backdrop-blur-sm', 'border', 'border-gray-300');
                if (themeButton) {
                    themeButton.className = 'flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200';
                }
                if (themeLabel) {
                    themeLabel.className = 'text-sm font-medium text-gray-700 hidden sm:inline';
                }
                break;
        }
        
        console.log('✅ Theme switcher appearance updated for:', themeKey);
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
        
        console.log('🎯 Setting theme manually to:', themeKey);
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
            console.log('🗑️ Cleared saved theme preference');
        } catch (error) {
            console.warn('Could not clear theme preference:', error);
        }
        
        // Apply system theme
        this.currentThemeIndex = this.detectSystemTheme();
        this.applyTheme(this.themes[this.currentThemeIndex].key);
        this.updateUI();
        
        console.log('🔄 Theme reset to system preference:', this.themes[this.currentThemeIndex].key);
    }

    // Public method to jump to a specific theme by name
    jumpToTheme(themeName) {
        const themeIndex = this.themes.findIndex(theme => 
            theme.key === themeName || theme.label.toLowerCase() === themeName.toLowerCase()
        );
        
        if (themeIndex !== -1) {
            this.currentThemeIndex = themeIndex;
            const theme = this.themes[themeIndex];
            this.applyTheme(theme.key);
            this.saveTheme(theme.key);
            this.updateUI();
            this.showThemeNotification(theme);
            return true;
        }
        return false;
    }
}

// Initialize theme switcher when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if not already initialized
    if (!window.themeSwitcher) {
        console.log('🚀 Initializing theme switcher from DOM ready...');
        window.themeSwitcher = new ThemeSwitcher();
    } else {
        console.log('ℹ️ Theme switcher already initialized');
    }
});

// Also try to initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    // DOM hasn't finished loading yet
    console.log('⏳ DOM still loading, waiting...');
} else {
    // DOM is already loaded
    if (!window.themeSwitcher) {
        console.log('🚀 Initializing theme switcher immediately...');
        window.themeSwitcher = new ThemeSwitcher();
    }
}

// Make theme switcher available globally for debugging
window.ThemeSwitcher = ThemeSwitcher;

// Debug functions
window.debugTheme = () => {
    const html = document.documentElement;
    console.log('🔍 Current theme debug info:');
    console.log('- data-theme attribute:', html.getAttribute('data-theme'));
    console.log('- theme classes:', Array.from(html.classList).filter(c => c.startsWith('theme-')));
    console.log('- current theme object:', window.themeSwitcher?.getCurrentTheme());
    console.log('- available themes:', window.themeSwitcher?.getAvailableThemes().map(t => t.key));
    console.log('- CSS custom properties sample:');
    const styles = getComputedStyle(html);
    console.log('  --bg-primary:', styles.getPropertyValue('--bg-primary'));
    console.log('  --text-primary:', styles.getPropertyValue('--text-primary'));
    console.log('  --primary-color:', styles.getPropertyValue('--primary-color'));
};

// Convenience functions
window.switchToTheme = (themeName) => {
    return window.themeSwitcher?.jumpToTheme(themeName) || false;
};

window.listThemes = () => {
    return window.themeSwitcher?.getAvailableThemes().map(t => `${t.key}: ${t.label} ${t.icon}`) || [];
};

console.log('✅ Theme switcher script loaded with 3 themes: Light, Dark, Sepia');