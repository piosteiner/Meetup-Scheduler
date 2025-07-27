// config.js - Configuration file for Piogino Meetup App

// Firebase Configuration
export const firebaseConfig = {
    apiKey: "AIzaSyBeaBtfeqhiDA5GrYwZBNwtN4J8l5yszCk",
    authDomain: "meetup-app-9f1ff.firebaseapp.com",
    databaseURL: "https://meetup-app-9f1ff-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "meetup-app-9f1ff",
    storageBucket: "meetup-app-9f1ff.firebasestorage.app",
    messagingSenderId: "1093344835630",
    appId: "1:1093344835630:web:fbb75663598de6747147bf"
};

// Application Configuration
export const appConfig = {
    // App Information
    name: 'Piogino Meetup',
    version: '1.0.0',
    author: 'Piogino',
    
    // Default Settings
    defaultMeetingDuration: 60, // minutes
    maxParticipants: 50, // 0 = unlimited
    meetupKeyLength: 8,
    maxMessageLength: 500,
    
    // Auto-refresh intervals (milliseconds)
    refreshInterval: 30000,
    connectionCheckInterval: 10000,
    notificationDisplayTime: 5000,
    
    // Available meeting durations
    availableDurations: [
        { value: 15, label: "15 minutes" },
        { value: 30, label: "30 minutes" },
        { value: 45, label: "45 minutes" },
        { value: 60, label: "1 hour", default: true },
        { value: 90, label: "1.5 hours" },
        { value: 120, label: "2 hours" },
        { value: 150, label: "2.5 hours" },
        { value: 180, label: "3 hours" },
        { value: 240, label: "4 hours" },
        { value: 300, label: "5 hours" },
        { value: 360, label: "6 hours" },
        { value: 420, label: "7 hours" },
        { value: 480, label: "8 hours (full day)" }
    ],
    
    // Date and time formatting
    dateFormatOptions: {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    },
    
    timeFormatOptions: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Use 24-hour format
    }
};

// Export default duration for easy access
export const DEFAULT_DURATION = appConfig.defaultMeetingDuration;

// Environment detection
export const environment = {
    isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    isProduction: window.location.hostname.includes('piogino.ch'),
    isStaging: window.location.hostname.includes('staging'),
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isTablet: /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent),
    isDesktop: !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)),
    supportsWebRTC: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    supportsNotifications: 'Notification' in window,
    supportsServiceWorker: 'serviceWorker' in navigator,
    supportsLocalStorage: typeof(Storage) !== "undefined",
    supportsPushAPI: 'PushManager' in window
};

// Make configurations globally available for backwards compatibility
window.MeetupConfig = {
    firebase: firebaseConfig,
    app: appConfig,
    env: environment
};