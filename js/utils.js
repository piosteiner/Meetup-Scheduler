// Utility functions for Piogino Meetup App

const Utils = {
    
    // String utilities
    generateMeetupKey(length = appConfig.meetupKeyLength) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },
    
    sanitizeString(str) {
        if (!str) return '';
        return str
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/[&]/g, '&amp;')
            .replace(/['"]/g, (match) => match === '"' ? '&quot;' : '&#x27;')
            .trim();
    },
    
    truncateString(str, maxLength) {
        if (!str || str.length <= maxLength) return str;
        return str.substring(0, maxLength - 3) + '...';
    },
    
    validateMeetupKey(key) {
        return /^[A-Z0-9]{8}$/.test(key);
    },
    
    // Date and time utilities
    formatDate(date, options = appConfig.dateFormatOptions) {
        if (!date) return '';
        const dateObj = date instanceof Date ? date : new Date(date);
        return dateObj.toLocaleDateString('en-US', options);
    },
    
    formatTime(date, options = appConfig.timeFormatOptions) {
        if (!date) return '';
        const dateObj = date instanceof Date ? date : new Date(date);
        return dateObj.toLocaleTimeString([], options);
    },
    
    formatDateTime(date) {
        if (!date) return '';
        return `${this.formatDate(date)} at ${this.formatTime(date)}`;
    },
    
    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours === 0) {
            return `${mins}m`;
        } else if (mins === 0) {
            return `${hours}h`;
        } else {
            return `${hours}h ${mins}m`;
        }
    },
    
    isToday(date) {
        if (!date) return false;
        const dateObj = date instanceof Date ? date : new Date(date);
        const today = new Date();
        return dateObj.toDateString() === today.toDateString();
    },
    
    isPast(date) {
        if (!date) return false;
        const dateObj = date instanceof Date ? date : new Date(date);
        return dateObj < new Date();
    },
    
    isFuture(date) {
        if (!date) return false;
        const dateObj = date instanceof Date ? date : new Date(date);
        return dateObj > new Date();
    },
    
    addMinutes(date, minutes) {
        const dateObj = date instanceof Date ? new Date(date) : new Date(date);
        dateObj.setMinutes(dateObj.getMinutes() + minutes);
        return dateObj;
    },
    
    // DOM utilities
    getElementById(id) {
        return document.getElementById(id);
    },
    
    querySelector(selector) {
        return document.querySelector(selector);
    },
    
    querySelectorAll(selector) {
        return document.querySelectorAll(selector);
    },
    
    addClass(element, className) {
        if (element && className) {
            element.classList.add(className);
        }
    },
    
    removeClass(element, className) {
        if (element && className) {
            element.classList.remove(className);
        }
    },
    
    toggleClass(element, className) {
        if (element && className) {
            element.classList.toggle(className);
        }
    },
    
    hasClass(element, className) {
        return element && className && element.classList.contains(className);
    },
    
    show(element) {
        if (element) {
            element.classList.remove('hidden');
            element.style.display = '';
        }
    },
    
    hide(element) {
        if (element) {
            element.classList.add('hidden');
        }
    },
    
    // Event utilities
    addEventListener(element, event, handler, options = {}) {
        if (element && event && handler) {
            element.addEventListener(event, handler, options);
        }
    },
    
    removeEventListener(element, event, handler) {
        if (element && event && handler) {
            element.removeEventListener(event, handler);
        }
    },
    
    // URL utilities
    updateURL(key) {
        const newUrl = key 
            ? `${window.location.origin}${window.location.pathname}?key=${key}`
            : `${window.location.origin}${window.location.pathname}`;
        window.history.pushState({}, '', newUrl);
    },
    
    getURLParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    },
    
    // Clipboard utilities
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const success = document.execCommand('copy');
                document.body.removeChild(textArea);
                return success;
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    },
    
    // Storage utilities
    setLocalStorage(key, value) {
        if (environment.supportsLocalStorage) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Failed to save to localStorage:', error);
                return false;
            }
        }
        return false;
    },
    
    getLocalStorage(key, defaultValue = null) {
        if (environment.supportsLocalStorage) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Failed to read from localStorage:', error);
                return defaultValue;
            }
        }
        return defaultValue;
    },
    
    removeLocalStorage(key) {
        if (environment.supportsLocalStorage) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Failed to remove from localStorage:', error);
                return false;
            }
        }
        return false;
    },
    
    // Validation utilities
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    isValidName(name) {
        return name && name.trim().length >= 2 && name.trim().length <= 50;
    },
    
    isValidMessage(message) {
        return message && message.trim().length > 0 && message.length <= appConfig.maxMessageLength;
    },
    
    // Array utilities
    sortByDate(array, dateKey = 'dateTime', ascending = true) {
        return array.sort((a, b) => {
            const dateA = new Date(a[dateKey]);
            const dateB = new Date(b[dateKey]);
            return ascending ? dateA - dateB : dateB - dateA;
        });
    },
    
    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    },
    
    unique(array) {
        return [...new Set(array)];
    },
    
    // Object utilities
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    },
    
    isEmpty(obj) {
        if (!obj) return true;
        if (Array.isArray(obj)) return obj.length === 0;
        if (typeof obj === 'object') return Object.keys(obj).length === 0;
        return false;
    },
    
    // Debounce and throttle utilities
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },
    
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // Performance utilities
    measurePerformance(name, func) {
        const start = performance.now();
        const result = func();
        const end = performance.now();
        console.log(`${name} took ${end - start} milliseconds`);
        return result;
    },
    
    // Theme utilities
    getPreferredTheme() {
        const saved = this.getLocalStorage('theme');
        if (saved && appConfig.themes[saved]) {
            return saved;
        }
        
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        
        return 'light';
    },
    
    setTheme(theme) {
        if (theme && appConfig.themes[theme]) {
            document.documentElement.setAttribute('data-theme', theme);
            this.setLocalStorage('theme', theme);
            return true;
        }
        return false;
    },
    
    // Error handling utilities
    handleError(error, context = 'Unknown') {
        console.error(`Error in ${context}:`, error);
        
        if (appConfig.debug.enableLogging) {
            const errorInfo = {
                message: error.message,
                stack: error.stack,
                context: context,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            };
            
            // Store error for potential reporting
            const errors = this.getLocalStorage('errors', []);
            errors.push(errorInfo);
            
            // Keep only last 10 errors
            if (errors.length > 10) {
                errors.splice(0, errors.length - 10);
            }
            
            this.setLocalStorage('errors', errors);
        }
    },
    
    // Notification utilities (placeholder for future notification system)
    canShowNotifications() {
        return environment.supportsNotifications && 
               Notification.permission === 'granted';
    },
    
    async requestNotificationPermission() {
        if (!environment.supportsNotifications) return false;
        
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        
        return Notification.permission === 'granted';
    },
    
    // Analytics utilities (placeholder for future analytics)
    trackEvent(eventName, properties = {}) {
        if (appConfig.features.enableAnalytics && appConfig.debug.enableLogging) {
            console.log(`Analytics Event: ${eventName}`, properties);
        }
    },
    
    // Accessibility utilities
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    },
    
    // Focus management
    focusElement(element) {
        if (element && typeof element.focus === 'function') {
            element.focus();
        }
    },
    
    // Mobile detection utilities
    isMobileDevice() {
        return environment.isMobile;
    },
    
    isTabletDevice() {
        return environment.isTablet;
    },
    
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
};

// Make Utils globally available
window.Utils = Utils;