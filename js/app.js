// app.js - Main application logic

class MeetupApp {
    constructor() {
        this.currentMeetupKey = '';
        this.currentParticipantId = null;
        this.selectedParticipantId = null;
        this.allParticipants = {};
        this.meetingDuration = window.MeetupConfig.app.defaultMeetingDuration;
        this.listeners = new Map(); // Track Firebase listeners for cleanup
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
                this.currentMeetupKey = keyFromUrl.toUpperCase();
                this.showMeetupScreen();
                await this.loadMeetupData();
            }

            // Set up event listeners
            this.setupEventListeners();
            
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
            if (e.key === 'Enter') this.joinMeetup();
        });

        document.getElementById('nameInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinAsMember();
        });

        document.getElementById('messageInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Make app available globally for onclick handlers
        window.app = this;
    }

    // Screen navigation
    showHomeScreen() {
        window.uiComponents.hide('createdScreen');
        window.uiComponents.hide('meetupScreen');
        window.uiComponents.show('homeScreen');
    }

    showCreatedScreen() {
        window.uiComponents.hide('homeScreen');
        window.uiComponents.hide('meetupScreen');
        window.uiComponents.show('createdScreen');
    }

    showMeetupScreen() {
        window.uiComponents.hide('homeScreen');
        window.uiComponents.hide('createdScreen');
        window.uiComponents.show('meetupScreen');
    }

    // Create new meetup
    async createMeetup() {
        try {
            const createBtn = document.querySelector('button[onclick="createMeetup()"]');
            const originalContent = window.uiComponents.showLoading(createBtn, 'Creating...');

            const newKey = window.Utils.generateMeetupKey();
            this.currentMeetupKey = newKey;
            
            await window.firebaseAPI.createMeetup(newKey, { duration: this.meetingDuration });
            
            window.uiComponents.updateText('generatedKey', newKey);
            window.Utils.updateUrl(newKey);
            this.showCreatedScreen();
            
            window.uiComponents.hideLoading(createBtn, originalContent);
            window.uiComponents.showNotification('Meetup created successfully!', 'success');
        } catch (error) {
            console.error('Error creating meetup:', error);
            window.uiComponents.showNotification(error.message, 'error');
        }
    }

    // Join existing meetup
    async joinMeetup() {
        try {
            const key = window.uiComponents.getValue('keyInput').trim().toUpperCase();
            if (!key) {
                window.uiComponents.showNotification('Please enter a meetup key', 'warning');
                return;
            }

            const joinBtn = document.querySelector('button[onclick="joinMeetup()"]');
            const originalContent = window.uiComponents.showLoading(joinBtn, 'Joining...');

            const meetupData = await window.firebaseAPI.getMeetup(key);
            
            if (meetupData) {
                this.currentMeetupKey = key;
                window.Utils.updateUrl(key);
                this.showMeetupScreen();
                await this.loadMeetupData();
                window.uiComponents.showNotification('Joined meetup successfully!', 'success');
            } else {
                window.uiComponents.showNotification('Meetup not found. Please check the key.', 'error');
            }
            
            window.uiComponents.hideLoading(joinBtn, originalContent);
        } catch (error) {
            console.error('Error joining meetup:', error);
            window.uiComponents.showNotification('Error joining meetup. Please try again.', 'error');
        }
    }

    // Join as participant
    async joinAsMember() {
        try {
            const name = window.uiComponents.getValue('nameInput').trim();
            if (!name) {
                window.uiComponents.showNotification('Please enter your name', 'warning');
                return;
            }

            if (!this.currentMeetupKey) {
                window.uiComponents.showNotification('No meetup selected', 'error');
                return;
            }

            const participantId = Date.now().toString();
            this.currentParticipantId = participantId;
            
            await window.firebaseAPI.addParticipant(this.currentMeetupKey, participantId, { name });
            
            window.uiComponents.setValue('nameInput', '');
            window.uiComponents.hide('joinForm');
            
            // Auto-select the participant that just joined
            setTimeout(() => {
                window.uiComponents.setValue('participantSelect', participantId);
                this.selectParticipant();
            }, 500);

            window.uiComponents.showNotification(`Welcome, ${name}!`, 'success');
        } catch (error) {
            console.error('Error joining as member:', error);
            window.uiComponents.showNotification(error.message, 'error');
        }
    }

    // Select participant for actions
    selectParticipant() {
        this.selectedParticipantId = window.uiComponents.getValue('participantSelect');
        const selectedName = this.selectedParticipantId ? this.allParticipants[this.selectedParticipantId]?.name : '';
        
        console.log('Selected participant:', this.selectedParticipantId, selectedName);
        
        if (this.selectedParticipantId && selectedName) {
            // Show current selection
            window.uiComponents.show('currentSelection');
            window.uiComponents.updateText('selectedParticipantName', selectedName);
            
            // Show message form
            window.uiComponents.show('messageForm');
            window.uiComponents.show('messageAsParticipant');
            window.uiComponents.updateText('messageParticipantName', selectedName);
            window.uiComponents.hide('noParticipantMessage');
            
            // Show propose form
            window.uiComponents.show('proposeForm');
        } else {
            // Hide forms when no participant selected
            window.uiComponents.hide('currentSelection');
            window.uiComponents.hide('messageForm');
            window.uiComponents.hide('messageAsParticipant');
            window.uiComponents.show('noParticipantMessage');
        }
        
        // Refresh proposals display
        this.refreshProposalsDisplay();
    }

    // Update meeting duration
    async updateDuration() {
        this.meetingDuration = parseInt(window.uiComponents.getValue('durationSelect'));
        console.log('Meeting duration updated to:', this.meetingDuration, 'minutes');
        
        if (this.currentMeetupKey) {
            try {
                await window.firebaseAPI.updateMeetupDuration(this.currentMeetupKey, this.meetingDuration);
            } catch (error) {
                console.error('Error updating duration:', error);
            }
        }
        
        this.refreshProposalsDisplay();
    }

    // Propose date and time
    async proposeDateTime() {
        try {
            const dateTime = window.uiComponents.getValue('dateTimeInput');
            if (!dateTime) {
                window.uiComponents.showNotification('Please select a date and time', 'warning');
                return;
            }
            
            if (!this.currentMeetupKey) {
                window.uiComponents.showNotification('No meetup selected', 'error');
                return;
            }
            
            const proposalId = Date.now().toString();
            
            await window.firebaseAPI.addProposal(this.currentMeetupKey, proposalId, {
                participantId: this.currentParticipantId || 'anonymous',
                dateTime: dateTime
            });
            
            window.uiComponents.setValue('dateTimeInput', '');
            window.uiComponents.showNotification('Date proposed successfully!', 'success');
        } catch (error) {
            console.error('Error proposing date:', error);
            window.uiComponents.showNotification(error.message, 'error');
        }
    }

    // Respond to proposal
    async respondToProposal(proposalId, response) {
        try {
            if (!this.selectedParticipantId) {
                window.uiComponents.showNotification('Please select a participant first', 'warning');
                return;
            }
            
            if (!this.currentMeetupKey) {
                window.uiComponents.showNotification('No meetup selected', 'error');
                return;
            }
            
            console.log('Setting response for participant:', this.selectedParticipantId, 'to proposal:', proposalId, 'response:', response);
            
            await window.firebaseAPI.respondToProposal(this.currentMeetupKey, proposalId, this.selectedParticipantId, response);
            
            window.uiComponents.showNotification('Response saved!', 'success');
            setTimeout(() => this.refreshProposalsDisplay(), 100);
        } catch (error) {
            console.error('Error responding to proposal:', error);
            window.uiComponents.showNotification(error.message, 'error');
        }
    }

    // Send message
    async sendMessage() {
        try {
            const message = window.uiComponents.getValue('messageInput').trim();
            if (!message) {
                window.uiComponents.showNotification('Please enter a message', 'warning');
                return;
            }
            
            if (!this.selectedParticipantId) {
                window.uiComponents.showNotification('Please select a participant first', 'warning');
                return;
            }
            
            if (!this.currentMeetupKey) {
                window.uiComponents.showNotification('No meetup selected', 'error');
                return;
            }
            
            const messageId = Date.now().toString();
            
            console.log('Sending message as participant:', this.selectedParticipantId, this.allParticipants[this.selectedParticipantId]?.name);
            
            await window.firebaseAPI.addMessage(this.currentMeetupKey, messageId, {
                participantId: this.selectedParticipantId,
                message: message
            });
            
            window.uiComponents.setValue('messageInput', '');
            window.uiComponents.showNotification('Message sent!', 'success');
        } catch (error) {
            console.error('Error sending message:', error);
            window.uiComponents.showNotification(error.message, 'error');
        }
    }

    // Copy meetup link
    async copyLink() {
        try {
            const link = `${window.location.origin}${window.location.pathname}?key=${this.currentMeetupKey}`;
            const success = await window.Utils.copyToClipboard(link);
            if (success) {
                window.uiComponents.showNotification('Link copied to clipboard!', 'success');
            } else {
                window.uiComponents.showNotification('Failed to copy link', 'error');
            }
        } catch (error) {
            console.error('Error copying link:', error);
            window.uiComponents.showNotification('Failed to copy link', 'error');
        }
    }

    // Go to meetup from created screen
    goToMeetup() {
        this.showMeetupScreen();
        this.loadMeetupData();
    }

    // Go back to home
    goHome() {
        // Clean up listeners
        this.cleanupListeners();
        
        // Reset state
        this.currentMeetupKey = '';
        this.currentParticipantId = null;
        this.selectedParticipantId = null;
        this.allParticipants = {};
        this.meetingDuration = window.MeetupConfig.app.defaultMeetingDuration;
        
        // Clear URL
        window.Utils.clearUrl();
        
        // Reset UI
        this.resetUI();
        
        this.showHomeScreen();
        window.uiComponents.showNotification('Returned to home', 'info');
    }

    // Reset UI to initial state
    resetUI() {
        window.uiComponents.updateHTML('participantSelect', '<option value="">Choose participant...</option>');
        window.uiComponents.setValue('durationSelect', window.MeetupConfig.app.defaultMeetingDuration.toString());
        window.uiComponents.hide('currentSelection');
        window.uiComponents.hide('messageForm');
        window.uiComponents.show('noParticipantMessage');
        window.uiComponents.show('joinForm');
        window.uiComponents.hide('proposeForm');
        
        // Clear form values
        window.uiComponents.setValue('keyInput', '');
        window.uiComponents.setValue('nameInput', '');
        window.uiComponents.setValue('messageInput', '');
        window.uiComponents.setValue('dateTimeInput', '');
    }

    // Load meetup data and set up listeners
    async loadMeetupData() {
        if (!this.currentMeetupKey) return;

        try {
            window.uiComponents.updateText('currentMeetupKey', this.currentMeetupKey);
            
            // Load meetup settings
            const meetupData = await window.firebaseAPI.getMeetup(this.currentMeetupKey);
            if (meetupData && meetupData.duration) {
                this.meetingDuration = meetupData.duration;
                window.uiComponents.setValue('durationSelect', this.meetingDuration.toString());
            }
            
            // Set up listeners
            this.setupMeetupListeners();
            
        } catch (error) {
            console.error('Error loading meetup data:', error);
            window.uiComponents.showNotification('Error loading meetup data', 'error');
        }
    }

    // Set up Firebase listeners for real-time updates
    setupMeetupListeners() {
        // Clean up existing listeners first
        this.cleanupListeners();

        // Participants listener
        const participantsListener = window.firebaseAPI.onParticipantsChange(this.currentMeetupKey, (participants) => {
            this.allParticipants = participants;
            this.updateParticipantsUI(participants);
        });
        this.listeners.set('participants', participantsListener);

        // Messages listener
        const messagesListener = window.firebaseAPI.onMessagesChange(this.currentMeetupKey, (messages) => {
            this.updateMessagesUI(messages);
        });
        this.listeners.set('messages', messagesListener);

        // Proposals listener
        const proposalsListener = window.firebaseAPI.onProposalsChange(this.currentMeetupKey, (proposals) => {
            this.updateProposalsUI(proposals);
        });
        this.listeners.set('proposals', proposalsListener);
    }

    // Update participants UI
    updateParticipantsUI(participants) {
        const count = Object.keys(participants).length;
        window.uiComponents.updateText('participantCount', count.toString());
        
        // Update participants list
        const participantsList = window.uiComponents.renderParticipantsList(participants);
        window.uiComponents.updateHTML('participantsList', participantsList);

        // Update participant select dropdown
        const participantOptions = window.uiComponents.renderParticipantOptions(participants);
        window.uiComponents.updateHTML('participantSelect', participantOptions);

        // Show propose form if there are participants
        if (count > 0) {
            window.uiComponents.show('proposeForm');
        }
    }

    // Update messages UI
    updateMessagesUI(messages) {
        const messagesList = window.uiComponents.renderMessagesList(messages, this.allParticipants);
        window.uiComponents.updateHTML('messagesList', messagesList);
        
        // Auto-scroll to bottom
        window.uiComponents.scrollToBottom('messagesList');
    }

    // Update proposals UI
    updateProposalsUI(proposals) {
        const proposalsList = window.uiComponents.renderProposalsList(
            proposals, 
            this.allParticipants, 
            this.selectedParticipantId, 
            this.meetingDuration
        );
        window.uiComponents.updateHTML('proposalsList', proposalsList);
    }

    // Refresh proposals display (for manual updates)
    async refreshProposalsDisplay() {
        if (!this.currentMeetupKey) return;
        
        try {
            // This will trigger the listener and update the UI
            const snapshot = await window.firebaseAPI.database.ref('meetups/' + this.currentMeetupKey + '/proposals').once('value');
            const proposals = snapshot.val() || {};
            this.updateProposalsUI(proposals);
        } catch (error) {
            console.error('Error refreshing proposals:', error);
        }
    }

    // Clean up Firebase listeners
    cleanupListeners() {
        if (this.currentMeetupKey) {
            window.firebaseAPI.cleanupMeetupListeners(this.currentMeetupKey);
        }
        this.listeners.clear();
    }

    // Error handling
    handleError(error, context = 'Unknown') {
        console.error(`Error in ${context}:`, error);
        window.uiComponents.showNotification(`Error: ${error.message}`, 'error');
    }
}

// Global functions for onclick handlers (backwards compatibility)
window.createMeetup = () => window.app?.createMeetup();
window.joinMeetup = () => window.app?.joinMeetup();
window.joinAsMember = () => window.app?.joinAsMember();
window.selectParticipant = () => window.app?.selectParticipant();
window.updateDuration = () => window.app?.updateDuration();
window.proposeDateTime = () => window.app?.proposeDateTime();
window.sendMessage = () => window.app?.sendMessage();
window.copyLink = () => window.app?.copyLink();
window.goToMeetup = () => window.app?.goToMeetup();
window.goHome = () => window.app?.goHome();

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.app = new MeetupApp();
    await window.app.init();
});