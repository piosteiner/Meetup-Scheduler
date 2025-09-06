// navigation.js - Screen navigation management

class NavigationManager {
    constructor() {
        this.currentScreen = 'home';
    }

    // Screen navigation methods
    showHomeScreen() {
        window.uiComponents.hide('createdScreen');
        window.uiComponents.hide('meetupScreen');
        window.uiComponents.show('homeScreen');
        this.currentScreen = 'home';
    }

    showCreatedScreen() {
        window.uiComponents.hide('homeScreen');
        window.uiComponents.hide('meetupScreen');
        window.uiComponents.show('createdScreen');
        this.currentScreen = 'created';
    }

    showMeetupScreen() {
        window.uiComponents.hide('homeScreen');
        window.uiComponents.hide('createdScreen');
        window.uiComponents.show('meetupScreen');
        this.currentScreen = 'meetup';
    }

    getCurrentScreen() {
        return this.currentScreen;
    }

    // Reset UI to initial state
    resetUI() {
        window.uiComponents.updateHTML('participantSelect', '<option value="">Choose participant...</option>');
        window.uiComponents.setValue('durationSelect', window.MeetupConfig.app.defaultMeetingDuration.toString());
        window.uiComponents.hide('messageForm');
        window.uiComponents.show('noParticipantMessage');
        window.uiComponents.show('joinForm');
        window.uiComponents.hide('proposeForm');
        
        // Reset meetup title and description
        document.getElementById('meetupTitle').textContent = 'Untitled Meetup';
        window.uiComponents.updateDescriptionDisplay('');
        
        // Clear form values
        window.uiComponents.setValue('keyInput', '');
        window.uiComponents.setValue('nameInput', '');
        window.uiComponents.setValue('messageInput', '');
        window.uiComponents.setValue('dateTimeInput', '');
    }

    // Go back to home with full cleanup
    goHome() {
        // Clean up listeners via app instance
        if (window.app && window.app.cleanupListeners) {
            window.app.cleanupListeners();
        }
        
        // Reset calendar
        if (window.calendar && window.calendar.reset) {
            window.calendar.reset();
        }
        
        // Reset state
        window.appState.reset();
        
        // Clear URL
        window.Utils.clearUrl();
        
        // Reset UI
        this.resetUI();
        
        this.showHomeScreen();
        window.uiComponents.showNotification('Returned to home', 'info');
    }
}

// Create global navigation instance
window.navigation = new NavigationManager();

console.log('✅ Navigation management loaded');
