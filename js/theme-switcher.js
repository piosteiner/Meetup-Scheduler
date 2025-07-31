// js/theme-switcher.js - Clean, Working Theme Switcher

console.log('🚀 Loading theme switcher...');

// Ultra-simple theme handler that works
window.manualCycleTheme = function() {
    console.log('🔄 Theme cycle triggered');
    
    const html = document.documentElement;
    const current = html.getAttribute('data-theme') || 'light';
    
    const themes = ['light', 'dark', 'sepia'];
    const nextIndex = (themes.indexOf(current) + 1) % 3;
    const next = themes[nextIndex];
    
    // Apply theme
    html.setAttribute('data-theme', next);
    
    // Update button
    const icons = {light: '☀️', dark: '🌙', sepia: '📜'};
    const labels = {light: 'Light', dark: 'Dark', sepia: 'Sepia'};
    
    const iconEl = document.getElementById('themeIcon');
    const labelEl = document.getElementById('themeLabel');
    
    if (iconEl) iconEl.textContent = icons[next];
    if (labelEl) labelEl.textContent = labels[next];
    
    // Update theme switcher appearance
    updateThemeSwitcherAppearance(next);
    
    // Save preference
    try {
        localStorage.setItem('piogino-theme-preference', next);
    } catch (e) {
        console.warn('Could not save theme preference');
    }
    
    console.log('✅ Theme changed to:', next);
};

// Initialize theme on page load
window.initializeTheme = function() {
    console.log('🎨 Initializing theme...');
    
    // Get saved theme or detect system preference
    let savedTheme = 'light';
    try {
        savedTheme = localStorage.getItem('piogino-theme-preference');
        
        // If no saved theme, detect system preference
        if (!savedTheme) {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                savedTheme = 'dark';
            } else {
                savedTheme = 'light';
            }
        }
    } catch (e) {
        console.warn('Could not read theme preference');
        savedTheme = 'light';
    }
    
    console.log('📁 Using theme:', savedTheme);
    
    // Apply theme
    const html = document.documentElement;
    html.setAttribute('data-theme', savedTheme);
    
    // Update button to show current theme
    const icons = {light: '☀️', dark: '🌙', sepia: '📜'};
    const labels = {light: 'Light', dark: 'Dark', sepia: 'Sepia'};
    
    const iconEl = document.getElementById('themeIcon');
    const labelEl = document.getElementById('themeLabel');
    
    if (iconEl) iconEl.textContent = icons[savedTheme];
    if (labelEl) labelEl.textContent = labels[savedTheme];
    
    // Update theme switcher appearance
    updateThemeSwitcherAppearance(savedTheme);
    
    console.log('✅ Theme initialized:', savedTheme);
};

// Update theme switcher button appearance
function updateThemeSwitcherAppearance(themeKey) {
    const themeSwitcher = document.getElementById('themeSwitcher');
    const themeButton = document.getElementById('themeButton');
    const themeLabel = document.getElementById('themeLabel');
    
    if (!themeSwitcher) return;
    
    // Reset classes
    themeSwitcher.className = 'fixed top-4 left-4 z-50 rounded-xl p-3 shadow-lg transition-all duration-300 hover:shadow-xl';
    
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
}

// Set up system theme change listener
function setupSystemThemeListener() {
    if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            // Only auto-switch if user hasn't manually set a preference
            const savedTheme = localStorage.getItem('piogino-theme-preference');
            if (!savedTheme) {
                console.log('🔄 System theme changed, updating automatically');
                const newTheme = e.matches ? 'dark' : 'light';
                
                document.documentElement.setAttribute('data-theme', newTheme);
                
                // Update button
                const icons = {light: '☀️', dark: '🌙', sepia: '📜'};
                const labels = {light: 'Light', dark: 'Dark', sepia: 'Sepia'};
                
                const iconEl = document.getElementById('themeIcon');
                const labelEl = document.getElementById('themeLabel');
                
                if (iconEl) iconEl.textContent = icons[newTheme];
                if (labelEl) labelEl.textContent = labels[newTheme];
                
                updateThemeSwitcherAppearance(newTheme);
            }
        });
    }
}

// Keyboard shortcut: Ctrl/Cmd + Shift + T
function setupKeyboardShortcut() {
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
            e.preventDefault();
            window.manualCycleTheme();
        }
    });
}

// Public API for debugging and external use
window.themeSwitcher = {
    cycle: window.manualCycleTheme,
    getCurrentTheme: function() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    },
    setTheme: function(theme) {
        if (['light', 'dark', 'sepia'].includes(theme)) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('piogino-theme-preference', theme);
            
            const icons = {light: '☀️', dark: '🌙', sepia: '📜'};
            const labels = {light: 'Light', dark: 'Dark', sepia: 'Sepia'};
            
            const iconEl = document.getElementById('themeIcon');
            const labelEl = document.getElementById('themeLabel');
            
            if (iconEl) iconEl.textContent = icons[theme];
            if (labelEl) labelEl.textContent = labels[theme];
            
            updateThemeSwitcherAppearance(theme);
            return true;
        }
        return false;
    },
    getAvailableThemes: function() {
        return ['light', 'dark', 'sepia'];
    },
    resetToSystemPreference: function() {
        localStorage.removeItem('piogino-theme-preference');
        window.initializeTheme();
    }
};

// Debug functions
window.debugTheme = function() {
    const html = document.documentElement;
    console.log('🔍 Current theme debug info:');
    console.log('- data-theme attribute:', html.getAttribute('data-theme'));
    console.log('- available themes:', window.themeSwitcher.getAvailableThemes());
    console.log('- current theme:', window.themeSwitcher.getCurrentTheme());
    console.log('- saved preference:', localStorage.getItem('piogino-theme-preference'));
};

window.switchToTheme = function(theme) {
    return window.themeSwitcher.setTheme(theme);
};

window.listThemes = function() {
    return window.themeSwitcher.getAvailableThemes().map(t => {
        const icons = {light: '☀️', dark: '🌙', sepia: '📜'};
        const labels = {light: 'Light', dark: 'Dark', sepia: 'Sepia'};
        return `${t}: ${labels[t]} ${icons[t]}`;
    });
};

// Initialize when DOM is ready
function initWhenReady() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            window.initializeTheme();
            setupSystemThemeListener();
            setupKeyboardShortcut();
        });
    } else {
        window.initializeTheme();
        setupSystemThemeListener();
        setupKeyboardShortcut();
    }
}

// Start initialization
initWhenReady();

console.log('✅ Clean theme switcher loaded successfully');