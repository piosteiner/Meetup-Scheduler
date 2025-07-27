// Configuration file for Piogino Meetup App

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBeaBtfeqhiDA5GrYwZBNwtN4J8l5yszCk",
    authDomain: "meetup-app-9f1ff.firebaseapp.com",
    databaseURL: "https://meetup-app-9f1ff-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "meetup-app-9f1ff",
    storageBucket: "meetup-app-9f1ff.firebasestorage.app",
    messagingSenderId: "1093344835630",
    appId: "1:1093344835630:web:fbb75663598de6747147bf"
};

// Application Configuration
const appConfig = {
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
    },
    
    // User interface messages
    messages: {
        // Success messages
        meetupCreated: "Meetup created successfully!",
        joinedSuccessfully: "Welcome to the meetup!",
        messageSent: "Message sent!",
        proposalSaved: "Date proposal added!",
        responseUpdated: "Your availability has been updated!",
        linkCopied: "Link copied to clipboard!",
        
        // Error messages
        connectionError: "Unable to connect to the server. Please check your internet connection.",
        meetupNotFound: "Meetup not found. Please check the key and try again.",
        nameRequired: "Please enter your name to join the meetup.",
        participantRequired: "Please select a participant first.",
        messageRequired: "Please enter a message before sending.",
        dateTimeRequired: "Please select a date and time for your proposal.",
        invalidKey: "Invalid meetup key. Keys must be 8 characters long.",
        maxParticipantsReached: "This meetup has reached its maximum number of participants.",
        messageTooLong: "Message is too long. Please keep it under 500 characters.",
        
        // Loading messages
        loading: "Loading...",
        connecting: "Connecting to server...",
        saving: "Saving...",
        updating: "Updating...",
        
        // Confirmation messages
        leaveConfirm: "Are you sure you want to leave this meetup?",
        deleteProposalConfirm: "Are you sure you want to delete this proposal?",
        clearMessagesConfirm: "Are you sure you want to clear all messages?",
        
        // Info messages
        noParticipants: "No participants yet. Be the first to join!",
        noProposals: "No date proposals yet. Create the first one!",
        noMessages: "No messages yet. Start the conversation!",
        selectParticipant: "Select a participant above to manage their availability and send messages.",
        
        // Accessibility messages
        newMessage: "New message received",
        participantJoined: "New participant joined",
        proposalAdded: "New date proposal added"
    },
    
    // Response types for availability
    responseTypes: {
        available: {
            label: "Available",
            icon: "✓",
            class: "status-available",
            color: "#10b981"
        },
        maybe: {
            label: "Maybe",
            icon: "?",
            class: "status-maybe",
            color: "#f59e0b"
        },
        unavailable: {
            label: "Unavailable",
            icon: "✗",
            class: "status-unavailable",
            color: "#ef4444"
        }
    },
    
    // Theme options
    themes: {
        light: "Light",
        dark: "Dark",
        auto: "Auto (System)",
        sepia: "Sepia",
        'high-contrast': "High Contrast",
        'blue-light-filter': "Blue Light Filter"
    },
    
    // Feature flags
    features: {
        enableThemeSwitch: true,
        enableNotifications: true,
        enableSoundEffects: false,
        enableAnalytics: false,
        enableExport: true,
        enableImport: false,
        enableOfflineMode: false,
        enableRealTimeTyping: true,
        enableMessageReactions: false,
        enableFileUpload: false,
        enableVideoCall: false,
        enablePolls: false
    },
    
    // Security settings
    security: {
        sanitizeMessages: true,
        maxLoginAttempts: 3,
        sessionTimeout: 3600000, // 1 hour in milliseconds
        requireNameForMessages: true,
        allowAnonymousProposals: true
    },
    
    // Performance settings
    performance: {
        enableVirtualScrolling: false,
        maxMessagesInMemory: 100,
        maxProposalsDisplayed: 50,
        enableLazyLoading: true,
        enableCompression: false
    },
    
    // Debug settings
    debug: {
        enableLogging: true,
        enableVerboseLogging: false,
        enablePerformanceMonitoring: false,
        logLevel: 'info' // 'error', 'warn', 'info', 'debug'
    }
};

// Environment detection
const environment = {
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

// API endpoints (if needed for future enhancements)
const apiConfig = {
    baseUrl: environment.isProduction 
        ? 'https://api.piogino.ch' 
        : environment.isStaging 
            ? 'https://staging-api.piogino.ch'
            : 'http://localhost:3000',
    
    endpoints: {
        meetups: '/api/meetups',
        participants: '/api/participants',
        messages: '/api/messages',
        proposals: '/api/proposals',
        analytics: '/api/analytics',
        export: '/api/export'
    },
    
    timeout: 10000, // 10 seconds
    retryAttempts: 3,
    retryDelay: 1000 // 1 second
};

// Export configuration for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        firebaseConfig,
        appConfig,
        environment,
        apiConfig
    };
}

// Make configurations globally available
window.MeetupConfig = {
    firebase: firebaseConfig,
    app: appConfig,
    env: environment,
    api: apiConfig
};