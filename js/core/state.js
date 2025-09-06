// state.js - Centralized state management for Meetup App

class AppState {
    constructor() {
        this.currentMeetupKey = '';
        this.currentParticipantId = null;
        this.selectedParticipantId = null;
        this.allParticipants = {};
        this.meetingDuration = window.MeetupConfig.app.defaultMeetingDuration;
        this.listeners = new Map(); // Track Firebase listeners for cleanup
        this.currentProposals = {}; // Store current proposals for deleted proposals listener
        this.currentMessages = {}; // Store current messages for re-rendering
        this.lastMessagesRender = ''; // Track last rendered messages HTML to prevent duplicates
        this.currentFavorites = {}; // Store which proposals are starred (simple true/false)
        this.globalFavorites = {}; // Store all global favorites (proposalId -> starred status)
        
        // Event subscribers for state changes
        this.subscribers = {
            meetupKey: [],
            participant: [],
            selectedParticipant: [],
            participants: [],
            proposals: [],
            messages: [],
            favorites: []
        };
    }

    // Subscribe to state changes
    subscribe(event, callback) {
        if (this.subscribers[event]) {
            this.subscribers[event].push(callback);
        }
    }

    // Notify subscribers of state changes
    notify(event, data) {
        if (this.subscribers[event]) {
            this.subscribers[event].forEach(callback => callback(data));
        }
    }

    // Meetup key management
    setMeetupKey(key) {
        if (this.currentMeetupKey !== key) {
            this.currentMeetupKey = key;
            this.notify('meetupKey', key);
        }
    }

    getMeetupKey() {
        return this.currentMeetupKey;
    }

    // Participant management
    setCurrentParticipant(participantId) {
        if (this.currentParticipantId !== participantId) {
            this.currentParticipantId = participantId;
            this.notify('participant', participantId);
        }
    }

    getCurrentParticipant() {
        return this.currentParticipantId;
    }

    setSelectedParticipant(participantId) {
        if (this.selectedParticipantId !== participantId) {
            this.selectedParticipantId = participantId;
            this.notify('selectedParticipant', participantId);
        }
    }

    getSelectedParticipant() {
        return this.selectedParticipantId;
    }

    updateParticipants(participants) {
        this.allParticipants = participants;
        this.notify('participants', participants);
    }

    getParticipants() {
        return this.allParticipants;
    }

    getParticipantName(participantId) {
        return this.allParticipants[participantId]?.name || '';
    }

    // Meeting duration
    setMeetingDuration(duration) {
        this.meetingDuration = duration;
    }

    getMeetingDuration() {
        return this.meetingDuration;
    }

    // Proposals management
    updateProposals(proposals) {
        this.currentProposals = proposals;
        this.notify('proposals', proposals);
    }

    getProposals() {
        return this.currentProposals;
    }

    // Messages management
    updateMessages(messages) {
        this.currentMessages = messages;
        this.notify('messages', messages);
    }

    getMessages() {
        return this.currentMessages;
    }

    setLastMessagesRender(html) {
        this.lastMessagesRender = html;
    }

    getLastMessagesRender() {
        return this.lastMessagesRender;
    }

    // Favorites management
    updateGlobalFavorites(favorites) {
        this.globalFavorites = favorites;
        this.notify('favorites', favorites);
    }

    getGlobalFavorites() {
        return this.globalFavorites;
    }

    getCurrentFavorites() {
        return this.currentFavorites;
    }

    // Listener management
    addListener(key, listener) {
        this.listeners.set(key, listener);
    }

    getListeners() {
        return this.listeners;
    }

    clearListeners() {
        this.listeners.clear();
    }

    // Reset state (for going home)
    reset() {
        this.currentMeetupKey = '';
        this.currentParticipantId = null;
        this.selectedParticipantId = null;
        this.allParticipants = {};
        this.meetingDuration = window.MeetupConfig.app.defaultMeetingDuration;
        this.currentProposals = {};
        this.currentMessages = {};
        this.lastMessagesRender = '';
        this.currentFavorites = {};
        this.globalFavorites = {};
        this.clearListeners();
        
        // Notify all subscribers of reset
        Object.keys(this.subscribers).forEach(event => {
            this.notify(event, null);
        });
    }

    // Debug method
    getDebugInfo() {
        return {
            meetupKey: this.currentMeetupKey,
            currentParticipant: this.currentParticipantId,
            selectedParticipant: this.selectedParticipantId,
            participantCount: Object.keys(this.allParticipants).length,
            proposalCount: Object.keys(this.currentProposals).length,
            messageCount: Object.keys(this.currentMessages).length,
            favoriteCount: Object.keys(this.globalFavorites).length,
            listenerCount: this.listeners.size
        };
    }
}

// Create global state instance
window.appState = new AppState();

console.log('✅ State management loaded');
