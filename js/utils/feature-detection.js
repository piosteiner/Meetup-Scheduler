// feature-detection.js - Browser compatibility detection and graceful degradation

class FeatureDetector {
    constructor() {
        this.browserInfo = this.detectBrowser();
        this.supportedFeatures = this.checkFeatures();
    }

    // Detect browser type and version
    detectBrowser() {
        const ua = navigator.userAgent;
        const browserInfo = {
            userAgent: ua,
            isBrave: false,
            isChrome: false,
            isFirefox: false,
            isFirefoxMobile: false,
            isSafari: false,
            isEdge: false,
            isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
            isIOS: /iPad|iPhone|iPod/.test(ua),
            isAndroid: /Android/i.test(ua),
            version: 'Unknown'
        };

        // Detect Brave (has to be checked before Chrome since Brave is Chromium-based)
        if (navigator.brave && navigator.brave.isBrave) {
            browserInfo.isBrave = true;
            browserInfo.name = 'Brave';
        }
        // Detect Chrome
        else if (ua.includes('Chrome') && !ua.includes('Edg')) {
            browserInfo.isChrome = true;
            browserInfo.name = 'Chrome';
            const match = ua.match(/Chrome\/(\d+)/);
            browserInfo.version = match ? match[1] : 'Unknown';
        }
        // Detect Firefox
        else if (ua.includes('Firefox')) {
            browserInfo.isFirefox = true;
            browserInfo.name = 'Firefox';
            browserInfo.isFirefoxMobile = ua.includes('Mobile');
            const match = ua.match(/Firefox\/(\d+)/);
            browserInfo.version = match ? match[1] : 'Unknown';
        }
        // Detect Safari
        else if (ua.includes('Safari') && !ua.includes('Chrome')) {
            browserInfo.isSafari = true;
            browserInfo.name = 'Safari';
            const match = ua.match(/Version\/(\d+)/);
            browserInfo.version = match ? match[1] : 'Unknown';
        }
        // Detect Edge
        else if (ua.includes('Edg')) {
            browserInfo.isEdge = true;
            browserInfo.name = 'Edge';
            const match = ua.match(/Edg\/(\d+)/);
            browserInfo.version = match ? match[1] : 'Unknown';
        }
        else {
            browserInfo.name = 'Unknown';
        }

        return browserInfo;
    }

    // Check for required features
    checkFeatures() {
        const features = {
            // JavaScript features
            es6Classes: this.checkES6Classes(),
            es6ArrowFunctions: this.checkArrowFunctions(),
            templateLiterals: this.checkTemplateLiterals(),
            asyncAwait: this.checkAsyncAwait(),
            
            // CSS features
            cssGrid: this.checkCSSGrid(),
            flexbox: this.checkFlexbox(),
            customProperties: this.checkCSSCustomProperties(),
            
            // API features
            localStorage: this.checkLocalStorage(),
            fetch: this.checkFetch(),
            websockets: this.checkWebSockets(),
            notifications: this.checkNotifications(),
            
            // Firebase compatibility
            firebaseCompat: this.checkFirebaseCompat()
        };

        // Calculate support level
        const totalFeatures = Object.keys(features).length;
        const supportedCount = Object.values(features).filter(Boolean).length;
        const supportPercentage = (supportedCount / totalFeatures) * 100;

        return {
            ...features,
            supportLevel: this.getSupportLevel(supportPercentage),
            supportPercentage: Math.round(supportPercentage)
        };
    }

    // Individual feature checks
    checkES6Classes() {
        try {
            return typeof class {} === 'function';
        } catch (e) {
            return false;
        }
    }

    checkArrowFunctions() {
        try {
            eval('(() => {})');
            return true;
        } catch (e) {
            return false;
        }
    }

    checkTemplateLiterals() {
        try {
            eval('`template`');
            return true;
        } catch (e) {
            return false;
        }
    }

    checkAsyncAwait() {
        try {
            eval('(async () => {})');
            return true;
        } catch (e) {
            return false;
        }
    }

    checkCSSGrid() {
        return CSS && CSS.supports && CSS.supports('display', 'grid');
    }

    checkFlexbox() {
        return CSS && CSS.supports && CSS.supports('display', 'flex');
    }

    checkCSSCustomProperties() {
        return CSS && CSS.supports && CSS.supports('--custom', 'value');
    }

    checkLocalStorage() {
        try {
            return typeof Storage !== 'undefined' && localStorage;
        } catch (e) {
            return false;
        }
    }

    checkFetch() {
        return typeof fetch !== 'undefined';
    }

    checkWebSockets() {
        return typeof WebSocket !== 'undefined';
    }

    checkNotifications() {
        return 'Notification' in window;
    }

    checkFirebaseCompat() {
        // Check for modern browser features required by Firebase
        return this.checkFetch() && 
               this.checkWebSockets() && 
               this.checkES6Classes() && 
               this.checkLocalStorage();
    }

    // Get support level based on percentage
    getSupportLevel(percentage) {
        if (percentage >= 95) return 'excellent';
        if (percentage >= 85) return 'good';
        if (percentage >= 70) return 'fair';
        return 'poor';
    }

    // Get browser-specific recommendations
    getBrowserRecommendations() {
        const { name, version, isMobile, isIOS } = this.browserInfo;
        const recommendations = [];

        if (name === 'Unknown') {
            recommendations.push('Consider using a modern browser like Chrome, Firefox, or Brave for the best experience.');
        }

        if (name === 'Firefox' && isIOS) {
            recommendations.push('Firefox on iOS uses WebKit engine, which may have limitations with real-time features.');
        }

        if (isMobile && !this.supportedFeatures.notifications) {
            recommendations.push('Push notifications are not supported on this browser.');
        }

        if (!this.supportedFeatures.websockets) {
            recommendations.push('Real-time features may not work properly without WebSocket support.');
        }

        if (this.supportedFeatures.supportLevel === 'poor') {
            recommendations.push('Please update your browser for the best experience.');
        }

        return recommendations;
    }

    // Check if browser is fully supported
    isFullySupported() {
        return this.supportedFeatures.supportLevel === 'excellent' || 
               this.supportedFeatures.supportLevel === 'good';
    }

    // Get user-friendly support message
    getSupportMessage() {
        const { name, version } = this.browserInfo;
        const { supportLevel, supportPercentage } = this.supportedFeatures;

        switch (supportLevel) {
            case 'excellent':
                return `✅ ${name} ${version} has excellent support (${supportPercentage}%)`;
            case 'good':
                return `🟢 ${name} ${version} has good support (${supportPercentage}%)`;
            case 'fair':
                return `🟡 ${name} ${version} has fair support (${supportPercentage}%) - some features may be limited`;
            case 'poor':
                return `🔴 ${name} ${version} has poor support (${supportPercentage}%) - please update your browser`;
            default:
                return `❓ Browser support unknown`;
        }
    }

    // Show compatibility warning if needed
    showCompatibilityWarning() {
        if (!this.isFullySupported()) {
            const message = this.getSupportMessage();
            const recommendations = this.getBrowserRecommendations();
            
            console.warn('🚨 Browser Compatibility Warning:');
            console.warn(message);
            
            if (recommendations.length > 0) {
                console.warn('📋 Recommendations:');
                recommendations.forEach((rec, index) => {
                    console.warn(`${index + 1}. ${rec}`);
                });
            }

            // Could show a user-friendly modal here
            if (typeof window.uiComponents !== 'undefined') {
                const warningText = `${message}\n\n${recommendations.join('\n')}`;
                window.uiComponents.showNotification(
                    'Browser compatibility notice - check console for details', 
                    'warning'
                );
            }
        }
    }

    // Get complete compatibility report
    getCompatibilityReport() {
        return {
            browser: this.browserInfo,
            features: this.supportedFeatures,
            message: this.getSupportMessage(),
            recommendations: this.getBrowserRecommendations(),
            isSupported: this.isFullySupported()
        };
    }

    // Static method for quick compatibility check
    static quickCheck() {
        const detector = new FeatureDetector();
        detector.showCompatibilityWarning();
        return detector.getCompatibilityReport();
    }
}

// Make available globally
window.FeatureDetector = FeatureDetector;

// Auto-run compatibility check when loaded
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const report = FeatureDetector.quickCheck();
        console.log('🔍 Browser Compatibility Report:', report);
        
        // Debug function
        window.debugBrowserSupport = () => {
            console.table(report.features);
            console.log('Browser Info:', report.browser);
            console.log('Support Level:', report.message);
            if (report.recommendations.length > 0) {
                console.log('Recommendations:', report.recommendations);
            }
        };
    }, 100);
});

console.log('✅ Feature detection loaded');
