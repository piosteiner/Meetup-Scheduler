// utils.js - Utility functions for Piogino Meetup App
import { appConfig, environment } from './config.js';

// String utilities
export function generateMeetupKey(length = appConfig.meetupKeyLength) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export function sanitizeString(str) {
    if (!str) return '';
    return str
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/[&]/g, '&amp;')
        .replace(/['"]/g, (match) => match === '"' ? '&quot;' : '&#x27;')
        .trim();
}

export function validateMeetupKey(key) {
    return /^[A-Z0-9]{8}$/.test(key);
}

// Date and time utilities
export function formatDate(date, options = appConfig.dateFormatOptions) {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-US', options);
}

export function formatTime(date, options = appConfig.timeFormatOptions) {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleTimeString([], options);
}

export function formatDateRange(startDate, endDate) {
    if (!startDate || !endDate) return '';
    const startTime = formatTime(startDate);
    const endTime = formatTime(endDate);
    return `${startTime} - ${endTime}`;
}

export function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
        return `${mins}m`;
    } else if (mins === 0) {
        return `${hours}h`;
    } else {
        return `${hours}h ${mins}m`;
    }
}

export function isToday(date) {
    if (!date) return false;
    const dateObj = date instanceof Date ? date : new Date(date);
    const today = new Date();
    return dateObj.toDateString() === today.toDateString();
}

export function isPast(date) {
    if (!date) return false;
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj < new Date();
}

// URL utilities
export function updateUrl(key) {
    const newUrl = key 
        ? `${window.location.origin}${window.location.pathname}?key=${key}`
        : `${window.location.origin}${window.location.pathname}`;
    window.history.pushState({}, '', newUrl);
}

export function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

export function clearUrl() {
    window.history.pushState({}, '', window.location.pathname);
}

// Clipboard utilities
export async function copyToClipboard(text) {
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
}

// Storage utilities
export function setLocalStorage(key, value) {
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
}

export function getLocalStorage(key, defaultValue = null) {
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
}

// Validation utilities
export function isValidName(name) {
    return name && name.trim().length >= 2 && name.trim().length <= 50;
}

export function isValidMessage(message) {
    return message && message.trim().length > 0 && message.length <= appConfig.maxMessageLength;
}

// Array utilities
export function sortByDate(array, dateKey = 'dateTime', ascending = true) {
    return array.sort((a, b) => {
        const dateA = new Date(a[dateKey]);
        const dateB = new Date(b[dateKey]);
        return ascending ? dateA - dateB : dateB - dateA;
    });
}

// Debounce utility
export function debounce(func, wait, immediate = false) {
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
}

// Error handling utilities
export function handleError(error, context = 'Unknown') {
    console.error(`Error in ${context}:`, error);
    
    if (appConfig.debug?.enableLogging) {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            context: context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Store error for potential reporting
        const errors = getLocalStorage('errors', []);
        errors.push(errorInfo);
        
        // Keep only last 10 errors
        if (errors.length > 10) {
            errors.splice(0, errors.length - 10);
        }
        
        setLocalStorage('errors', errors);
    }
}

// Make utilities globally available for backwards compatibility
window.Utils = {
    generateMeetupKey,
    sanitizeString,
    validateMeetupKey,
    formatDate,
    formatTime,
    formatDateRange,
    formatDuration,
    isToday,
    isPast,
    updateUrl,
    getUrlParameter,
    clearUrl,
    copyToClipboard,
    setLocalStorage,
    getLocalStorage,
    isValidName,
    isValidMessage,
    sortByDate,
    debounce,
    handleError
};