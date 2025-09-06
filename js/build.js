// build.js - Simple build script for development

class BuildManager {
    constructor() {
        this.modules = [
            // Core dependencies first
            'js/config.js',
            'js/utils.js',
            'js/api.js',
            'js/components.js',
            'js/calendar.js',
            'js/theme-switcher.js',
            'js/modal-system.js',
            
            // Core modules
            'js/core/state.js',
            
            // UI modules
            'js/ui/navigation.js',
            
            // Feature modules
            'js/features/participants.js',
            'js/features/proposals.js',
            'js/features/messages.js',
            'js/features/meetup.js',
            
            // Global exports
            'js/utils/globals.js',
            
            // Main app
            'js/core/app.js',
            'js/emotes.js'
        ];
    }

    async loadModules() {
        console.log('🔧 Loading modular application...');
        
        for (const module of this.modules) {
            try {
                await this.loadScript(module);
                console.log(`✅ Loaded: ${module}`);
            } catch (error) {
                console.error(`❌ Failed to load: ${module}`, error);
                throw new Error(`Failed to load module: ${module}`);
            }
        }
        
        console.log('🚀 All modules loaded successfully!');
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async validateModules() {
        console.log('🔍 Validating modules...');
        
        const requiredGlobals = [
            'window.appState',
            'window.navigation',
            'window.meetupManager',
            'window.participantManager',
            'window.proposalManager',
            'window.messageManager',
            'window.app'
        ];
        
        const missing = [];
        for (const global of requiredGlobals) {
            if (!this.getNestedProperty(window, global.replace('window.', ''))) {
                missing.push(global);
            }
        }
        
        if (missing.length > 0) {
            console.error('❌ Missing required globals:', missing);
            return false;
        }
        
        console.log('✅ All required modules validated');
        return true;
    }

    getNestedProperty(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }

    getModuleStatus() {
        return {
            appState: !!window.appState,
            navigation: !!window.navigation,
            meetupManager: !!window.meetupManager,
            participantManager: !!window.participantManager,
            proposalManager: !!window.proposalManager,
            messageManager: !!window.messageManager,
            app: !!window.app,
            initialized: window.app?.isInitialized() || false
        };
    }
}

// Debug function for module status
window.debugModules = function() {
    console.log('🔍 MODULE STATUS:');
    const buildManager = new BuildManager();
    console.table(buildManager.getModuleStatus());
    
    if (window.app) {
        console.log('🔍 APP DEBUG INFO:');
        console.log(window.app.getDebugInfo());
    }
};

console.log('✅ Build manager loaded');

// Auto-validate modules when this script loads
if (typeof window !== 'undefined') {
    setTimeout(() => {
        const buildManager = new BuildManager();
        buildManager.validateModules();
    }, 100);
}
