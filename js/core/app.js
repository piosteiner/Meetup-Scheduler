// app.js - Streamlined main application controller

class MeetupApp {
    constructor() {
        // App is now primarily a coordinator between modules
        this.initialized = false;
    }

    // Initialize the application
    async init() {
        try {
            // Initialize Firebase
            await window.firebaseAPI.init();
            
            // Set up connection monitoring
            window.firebaseAPI.onConnectionChange((connected) => {
                if (!connected) {
                    window.uiComponents.showNotification('Connection lost. Retrying...', 'warning');
                    setTimeout(() => window.firebaseAPI.testConnection(), 2000);
                }
            });

            // Check URL parameters for direct meetup access
            const keyFromUrl = window.Utils.getUrlParameter('key');
            if (keyFromUrl) {
                window.appState.setMeetupKey(keyFromUrl.toUpperCase());
                window.navigation.showMeetupScreen();
                await window.meetupManager.loadMeetupData();
            }

            // Set up event listeners
            this.setupEventListeners();
            
            this.initialized = true;
            window.uiComponents.showNotification('App initialized successfully!', 'success');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            window.uiComponents.showNotification('Failed to initialize app: ' + error.message, 'error');
        }
    }

    // Set up event listeners
    setupEventListeners() {
        // Enter key handlers
        document.getElementById('keyInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') window.meetupManager.joinMeetup();
        });

        document.getElementById('nameInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') window.participantManager.joinAsMember();
        });

        document.getElementById('messageInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') window.messageManager.sendMessage();
        });

        // Make app available globally for onclick handlers
        window.app = this;
        
        // Make datetime input fully clickable
        document.getElementById('dateTimeInput')?.addEventListener('click', (e) => {
            e.target.showPicker?.();
        });
    }

    // Legacy compatibility methods - delegate to appropriate managers
    
    // Screen navigation (delegate to navigation manager)
    showHomeScreen() {
        return window.navigation.showHomeScreen();
    }

    showCreatedScreen() {
        return window.navigation.showCreatedScreen();
    }

    showMeetupScreen() {
        return window.navigation.showMeetupScreen();
    }

    // Meetup operations (delegate to meetup manager)
    async createMeetup() {
        return window.meetupManager.createMeetup();
    }

    async joinMeetup() {
        return window.meetupManager.joinMeetup();
    }

    goToMeetup() {
        return window.meetupManager.goToMeetup();
    }

    goHome() {
        return window.navigation.goHome();
    }

    async updateDuration() {
        return window.meetupManager.updateDuration();
    }

    async editMeetupName() {
        return window.meetupManager.editMeetupName();
    }

    async copyLink() {
        return window.meetupManager.copyLink();
    }

    // Description management (delegate to meetup manager)
    editDescription() {
        return window.meetupManager.editDescription();
    }

    async saveDescription() {
        return window.meetupManager.saveDescription();
    }

    cancelDescriptionEdit() {
        return window.meetupManager.cancelDescriptionEdit();
    }

    handleDescriptionKeydown(event) {
        return window.meetupManager.handleDescriptionKeydown(event);
    }

    // Participant operations (delegate to participant manager)
    async joinAsMember() {
        return window.participantManager.joinAsMember();
    }

    selectParticipantById(participantId) {
        return window.participantManager.selectParticipantById(participantId);
    }

    selectParticipant() {
        return window.participantManager.selectParticipant();
    }

    async editParticipantName(participantId) {
        return window.participantManager.editParticipantName(participantId);
    }

    // Proposal operations (delegate to proposal manager)
    async proposeDateTime(dateTimeValue) {
        return window.proposalManager.proposeDateTime(dateTimeValue);
    }

    async proposeDateFromCalendar(date, time) {
        return window.proposalManager.proposeDateFromCalendar(date, time);
    }

    async respondToProposal(proposalId, response) {
        return window.proposalManager.respondToProposal(proposalId, response);
    }

    async clearAvailabilityResponse(proposalId, participantName, proposalDate) {
        return window.proposalManager.clearAvailabilityResponse(proposalId, participantName, proposalDate);
    }

    async deleteProposal(proposalId, proposerName) {
        return window.proposalManager.deleteProposal(proposalId, proposerName);
    }

    async addToFavorites(proposalId, proposerName, proposalDate) {
        return window.proposalManager.addToFavorites(proposalId, proposerName, proposalDate);
    }

    async removeFromFavorites(proposalId, proposerName, proposalDate) {
        return window.proposalManager.removeFromFavorites(proposalId, proposerName, proposalDate);
    }

    async downloadProposalICS(proposalId, proposalData, proposerName) {
        return window.proposalManager.downloadProposalICS(proposalId, proposalData, proposerName);
    }

    async refreshProposalsDisplay() {
        return window.proposalManager.refreshProposalsDisplay();
    }

    // Message operations (delegate to message manager)
    async sendMessage() {
        return window.messageManager.sendMessage();
    }

    async editMessage(messageId, currentMessage) {
        return window.messageManager.editMessage(messageId, currentMessage);
    }

    async deleteMessage(messageId, senderName, messageText) {
        return window.messageManager.deleteMessage(messageId, senderName, messageText);
    }

    refreshMessagesDisplay() {
        return window.messageManager.refreshMessagesDisplay();
    }

    // Listener management (delegate to meetup manager)
    cleanupListeners() {
        return window.meetupManager.cleanupListeners();
    }

    // Legacy state accessors (for backward compatibility)
    get currentMeetupKey() {
        return window.appState.getMeetupKey();
    }

    set currentMeetupKey(value) {
        window.appState.setMeetupKey(value);
    }

    get selectedParticipantId() {
        return window.appState.getSelectedParticipant();
    }

    set selectedParticipantId(value) {
        window.appState.setSelectedParticipant(value);
    }

    get currentParticipantId() {
        return window.appState.getCurrentParticipant();
    }

    set currentParticipantId(value) {
        window.appState.setCurrentParticipant(value);
    }

    get allParticipants() {
        return window.appState.getParticipants();
    }

    get meetingDuration() {
        return window.appState.getMeetingDuration();
    }

    set meetingDuration(value) {
        window.appState.setMeetingDuration(value);
    }

    get currentProposals() {
        return window.appState.getProposals();
    }

    get currentMessages() {
        return window.appState.getMessages();
    }

    get globalFavorites() {
        return window.appState.getGlobalFavorites();
    }

    get currentFavorites() {
        return window.appState.getCurrentFavorites();
    }

    // Load meetup data (delegate to meetup manager)
    async loadMeetupData() {
        return window.meetupManager.loadMeetupData();
    }

    // Error handling
    handleError(error, context = 'Unknown') {
        console.error(`Error in ${context}:`, error);
        window.uiComponents.showNotification(`Error: ${error.message}`, 'error');
    }

    // App status
    isInitialized() {
        return this.initialized;
    }

    // Debug information
    getDebugInfo() {
        return {
            initialized: this.initialized,
            state: window.appState?.getDebugInfo(),
            modules: {
                navigation: !!window.navigation,
                meetupManager: !!window.meetupManager,
                participantManager: !!window.participantManager,
                proposalManager: !!window.proposalManager,
                messageManager: !!window.messageManager,
                appState: !!window.appState
            }
        };
    }
}

// Create global app instance
window.app = new MeetupApp();

console.log('✅ Streamlined app loaded');
