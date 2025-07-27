// app.js - Main application logic
import { generateMeetupKey, getUrlParameter, updateUrl, clearUrl } from './utils.js';
import { firebaseAPI } from './api.js';
import { uiComponents } from './components.js';
import { DEFAULT_DURATION } from './config.js';

class MeetupApp {
    constructor() {
        this.currentMeetupKey = '';
        this.currentParticipantId = null;
        this.selectedParticipantId = null;
        this.allParticipants = {};
        this.meetingDuration = DEFAULT_DURATION;
        this.listeners = new Map(); // Track Firebase listeners for cleanup
    }

    // Initialize the application
    async init() {
        try {
            // Initialize Firebase
            await firebaseAPI.init();
            
            // Set up connection monitoring
            firebaseAPI.onConnectionChange((connected) => {
                if (!connected) {
                    uiComponents.showNotification('Connection lost. Retrying...', 'warning');
                    setTimeout(() => firebaseAPI.testConnection(), 2000);
                }
            });

            // Check URL parameters for direct meetup access
            const keyFromUrl = getUrlParameter('key');
            if (keyFromUrl) {
                this.currentMeetupKey = keyFromUrl.toUpperCase();
                this.showMeetupScreen();
                await this.loadMeetupData();
            }

            // Set up event listeners
            this.setupEventListeners();
            
            uiComponents.showNotification('App initialized successfully!', 'success');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            uiComponents.showNotification('Failed to initialize app: ' + error.message, 'error');
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
        uiComponents.hide('createdScreen');
        uiComponents.hide('meetupScreen');
        uiComponents.show('homeScreen');
    }

    showCreatedScreen() {
        uiComponents.hide('homeScreen');
        uiComponents.hide('meetupScreen');
        uiComponents.show('createdScreen');
    }

    showMeetupScreen() {
        uiComponents.hide('homeScreen');
        uiComponents.hide('createdScreen');
        uiComponents.show('meetupScreen');
    }

    // Create new meetup
    async createMeetup() {
        try {
            const createBtn = document.querySelector('button[onclick="createMeetup()"]');
            const originalContent = uiComponents.showLoading(createBtn, 'Creating...');

            const newKey = generateMeetupKey();
            this.currentMeetupKey = newKey;
            
            await firebaseAPI.createMeetup(newKey, { duration: this.meetingDuration });
            
            uiComponents.updateText('generatedKey', newKey);
            updateUrl(newKey);
            this.showCreatedScreen();
            
            uiComponents.hideLoading(createBtn, originalContent);
            uiComponents.showNotification('Meetup created successfully!', 'success');
        } catch (error) {
            console.error('Error creating meetup:', error);
            uiComponents.showNotification(error.message, 'error');
        }
    }

    // Join existing meetup
    async joinMeetup() {
        try {
            const key = uiComponents.getValue('keyInput').trim().toUpperCase();
            if (!key) {
                uiComponents.showNotification('Please enter a meetup key', 'warning');
                return;
            }

            const joinBtn = document.querySelector('button[onclick="joinMeetup()"]');
            const originalContent = uiComponents.showLoading(joinBtn, 'Joining...');

            const meetupData = await firebaseAPI.getMeetup(key);
            
            if (meetupData) {
                this.currentMeetupKey = key;
                updateUrl(key);
                this.showMeetupScreen();
                await this.loadMeetupData();
                uiComponents.showNotification('Joined meetup successfully!', 'success');
            } else {
                uiComponents.showNotification('Meetup not found. Please check the key.', 'error');
            }
            
            uiComponents.hideLoading(joinBtn, originalContent);
        } catch (error) {
            console.error('Error joining meetup:', error);
            uiComponents.showNotification('Error joining meetup. Please try again.', 'error');
        }
    }

    // Join as participant
    async joinAsMember() {
        try {
            const name = uiComponents.getValue('nameInput').trim();
            if (!name) {
                uiComponents.showNotification('Please enter your name', 'warning');
                return;
            }

            if (!this.currentMeetupKey) {
                uiComponents.showNotification('No meetup selected', 'error');
                return;
            }

            const participantId = Date.now().toString();
            this.currentParticipantId = participantId;
            
            await firebaseAPI.addParticipant(this.currentMeetupKey, participantId, { name });
            
            uiComponents.setValue('nameInput', '');
            uiComponents.hide('joinForm');
            
            // Auto-select the participant that just joined
            setTimeout(() => {
                uiComponents.setValue('participantSelect', participantId);
                this.selectParticipant();
            }, 500);

            uiComponents.showNotification(`Welcome, ${name}!`, 'success');
        } catch (error) {
            console.error('Error joining as member:', error);
            uiComponents.showNotification(error.message, 'error');
        }
    }

    // Select participant for actions
    selectParticipant() {
        this.selectedParticipantId = uiComponents.getValue('participantSelect');
        const selectedName = this.selectedParticipantId ? this.allParticipants[this.selectedParticipantId]?.name : '';
        
        console.log('Selected participant:', this.selectedParticipantId, selectedName);
        
        if (this.selectedParticipantId && selectedName) {
            // Show current selection
            uiComponents.show('currentSelection');
            uiComponents.updateText('selectedParticipantName', selectedName);
            
            // Show message form
            uiComponents.show('messageForm');
            uiComponents.show('messageAsParticipant');
            uiComponents.updateText('messageParticipantName', selectedName);
            uiComponents.hide('noParticipantMessage');
            
            // Show propose form
            uiComponents.show('proposeForm');
        } else {
            // Hide forms when no participant selected
            uiComponents.hide('currentSelection');
            uiComponents.hide('messageForm');
            uiComponents.hide('messageAsParticipant');
            uiComponents.show('noParticipantMessage');
        }
        
        // Refresh proposals display
        this.refreshProposalsDisplay();
    }

    // Update meeting duration
    async updateDuration() {
        this.meetingDuration = parseInt(uiComponents.getValue('durationSelect'));
        console.log('Meeting duration updated to:', this.meetingDuration, 'minutes');
        
        if (this.currentMeetupKey) {
            try {
                await firebaseAPI.updateMeetupDuration(this.currentMeetupKey, this.meetingDuration);
            } catch (error) {
                console.error('Error updating duration:', error);
            }
        }
        
        this.refreshProposalsDisplay();
    }

    // Propose date and time
    async proposeDateTime() {
        try {
            const dateTime = uiComponents.getValue('dateTimeInput');
            if (!dateTime) {
                uiComponents.showNotification('Please select a date and time', 'warning');
                return;
            }
            
            if (!this.currentMeetupKey) {
                uiComponents.showNotification('No meetup selected', 'error');
                return;
            }
            
            const proposalId = Date.now().toString();
            
            await firebaseAPI.addProposal(this.currentMeetupKey, proposalId, {
                participantId: this.currentParticipantId || 'anonymous',
                dateTime: dateTime
            });
            
            uiComponents.setValue('dateTimeInput', '');
            uiComponents.showNotification('Date proposed successfully!', 'success');
        } catch (error) {
            console.error('Error proposing date:', error);
            uiComponents.showNotification(error.message, 'error');
        }
    }

    // Respond to proposal
    async respondToProposal(proposalId, response) {
        try {
            if (!this.selectedParticipantId) {
                uiComponents.showNotification('Please select a participant first', 'warning');
                return;
            }
            
            if (!this.currentMeetupKey) {
                uiComponents.showNotification('No meetup selected', 'error');
                return;
            }
            
            console.log('Setting response for participant:', this.selectedParticipantId, 'to proposal:', proposalId, 'response:', response);
            
            await firebaseAPI.respondToProposal(this.currentMeetupKey, proposalId, this.selectedParticipantId, response);
            
            uiComponents.showNotification('Response saved!', 'success');
            setTimeout(() => this.refreshProposalsDisplay(), 100);
        } catch (error) {
            console.error('Error responding to proposal:', error);
            uiComponents.showNotification(error.message, 'error');
        }
    }

    // Send message
    async sendMessage() {
        try {
            const message = uiComponents.getValue('messageInput').trim();
            if (!message) {
                uiComponents.showNotification('Please enter a message', 'warning');
                return;
            }
            
            if (!this.selectedParticipantId) {
                uiComponents.showNotification('Please select a participant first', 'warning');
                return;
            }
            
            if (!this.currentMeetupKey) {
                uiComponents.showNotification('No meetup selected', 'error');
                return;
            }
            
            const messageId = Date.now().toString();
            
            console.log('Sending message as participant:', this.selectedParticipantId, this.allParticipants[this.selectedParticipantId]?.name);
            
            await firebaseAPI.addMessage(this.currentMeetupKey, messageId, {
                participantId: this.selectedParticipantId,
                message: message
            });
            
            uiComponents.setValue('messageInput', '');
            uiComponents.showNotification('Message sent!', 'success');
        } catch (error) {
            console.error('Error sending message:', error);
            uiComponents.showNotification(error.message, 'error');
        }
    }

    // Copy meetup link
    async copyLink() {
        try {
            const link = `${window.location.origin}${window.location.pathname}?key=${this.currentMeetupKey}`;
            await navigator.clipboard.writeText(link);
            uiComponents.showNotification('Link copied to clipboard!', 'success');
        } catch (error) {
            console.error('Error copying link:', error);
            uiComponents.showNotification('Failed to copy link', 'error');
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
        this.meetingDuration = DEFAULT_DURATION;
        
        // Clear URL
        clearUrl();
        
        // Reset UI
        this.resetUI();
        
        this.showHomeScreen();
        uiComponents.showNotification('Returned to home', 'info');
    }

    // Reset UI to initial state
    resetUI() {
        uiComponents.updateHTML('participantSelect', '<option value="">Choose participant...</option>');
        uiComponents.setValue('durationSelect', DEFAULT_DURATION.toString());
        uiComponents.hide('currentSelection');
        uiComponents.hide('messageForm');
        uiComponents.show('noParticipantMessage');
        uiComponents.show('joinForm');
        uiComponents.hide('proposeForm');
        
        // Clear form values
        uiComponents.setValue('keyInput', '');
        uiComponents.setValue('nameInput', '');
        uiComponents.setValue('messageInput', '');
        uiComponents.setValue('dateTimeInput', '');
    }

    // Load meetup data and set up listeners
    async loadMeetupData() {
        if (!this.currentMeetupKey) return;

        try {
            uiComponents.updateText('currentMeetupKey', this.currentMeetupKey);
            
            // Load meetup settings
            const meetupData = await firebaseAPI.getMeetup(this.currentMeetupKey);
            if (meetupData && meetupData.duration) {
                this.meetingDuration = meetupData.duration;
                uiComponents.setValue('durationSelect', this.meetingDuration.toString());
            }
            
            // Set up listeners
            this.setupMeetupListeners();
            
        } catch (error) {
            console.error('Error loading meetup data:', error);
            uiComponents.showNotification('Error loading meetup data', 'error');
        }
    }

    // Set up Firebase listeners for real-time updates
    setupMeetupListeners() {
        // Clean up existing listeners first
        this.cleanupListeners();

        // Participants listener
        const participantsListener = firebaseAPI.onParticipantsChange(this.currentMeetupKey, (participants) => {
            this.allParticipants = participants;
            this.updateParticipantsUI(participants);
        });
        this.listeners.set('participants', participantsListener);

        // Messages listener
        const messagesListener = firebaseAPI.onMessagesChange(this.currentMeetupKey, (messages) => {
            this.updateMessagesUI(messages);
        });
        this.listeners.set('messages', messagesListener);

        // Proposals listener
        const proposalsListener = firebaseAPI.onProposalsChange(this.currentMeetupKey, (proposals) => {
            this.updateProposalsUI(proposals);
        });
        this.listeners.set('proposals', proposalsListener);
    }

    // Update participants UI
    updateParticipantsUI(participants) {
        const count = Object.keys(participants).length;
        uiComponents.updateText('participantCount', count.toString());
        
        // Update participants list
        const participantsList = uiComponents.renderParticipantsList(participants);
        uiComponents.updateHTML('participantsList', participantsList);

        // Update participant select dropdown
        const participantOptions = uiComponents.renderParticipantOptions(participants);
        uiComponents.updateHTML('participantSelect', participantOptions);

        // Show propose form if there are participants
        if (count > 0) {
            uiComponents.show('proposeForm');
        }
    }

    // Update messages UI
    updateMessagesUI(messages) {
        const messagesList = uiComponents.renderMessagesList(messages, this.allParticipants);
        uiComponents.updateHTML('messagesList', messagesList);
        
        // Auto-scroll to bottom
        uiComponents.scrollToBottom('messagesList');
    }

    // Update proposals UI
    updateProposalsUI(proposals) {
        const proposalsList = uiComponents.renderProposalsList(
            proposals, 
            this.allParticipants, 
            this.selectedParticipantId, 
            this.meetingDuration
        );
        uiComponents.updateHTML('proposalsList', proposalsList);
    }

    // Refresh proposals display (for manual updates)
    async refreshProposalsDisplay() {
        if (!this.currentMeetupKey) return;
        
        try {
            // This will trigger the listener and update the UI
            const snapshot = await firebaseAPI.database.ref('meetups/' + this.currentMeetupKey + '/proposals').once('value');
            const proposals = snapshot.val() || {};
            this.updateProposalsUI(proposals);
        } catch (error) {
            console.error('Error refreshing proposals:', error);
        }
    }

    // Clean up Firebase listeners
    cleanupListeners() {
        if (this.currentMeetupKey) {
            firebaseAPI.cleanupMeetupListeners(this.currentMeetupKey);
        }
        this.listeners.clear();
    }

    // Error handling
    handleError(error, context = 'Unknown') {
        console.error(`Error in ${context}:`, error);
        uiComponents.showNotification(`Error: ${error.message}`, 'error');
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

// Export for module usage
export { MeetupApp };