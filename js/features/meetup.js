// meetup.js - Meetup CRUD operations and management

class MeetupManager {
    constructor() {
        // Subscribe to state changes if needed
    }

    // Create new meetup
    async createMeetup() {
        try {
            const createBtn = document.querySelector('button[onclick="createMeetup()"]');
            const originalContent = window.uiComponents.showLoading(createBtn, 'Creating...');

            const newKey = window.Utils.generateMeetupKey();
            window.appState.setMeetupKey(newKey);
            
            const meetingDuration = window.appState.getMeetingDuration();
            await window.firebaseAPI.createMeetup(newKey, { 
                duration: meetingDuration,
                name: 'Untitled Meetup',
                description: ''
            });
            
            window.uiComponents.updateText('generatedKey', newKey);
            window.Utils.updateUrl(newKey);
            window.navigation.showCreatedScreen();
            
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
                window.appState.setMeetupKey(key);
                window.Utils.updateUrl(key);
                window.navigation.showMeetupScreen();
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

    // Go to meetup from created screen
    goToMeetup() {
        window.navigation.showMeetupScreen();
        this.loadMeetupData();
    }

    // Update meeting duration
    async updateDuration() {
        const inputValue = parseInt(window.uiComponents.getValue('durationSelect'));
        
        // Validate the input
        if (isNaN(inputValue) || inputValue < 15) {
            window.uiComponents.showNotification('Duration must be at least 15 minutes', 'warning');
            const currentDuration = window.appState.getMeetingDuration();
            window.uiComponents.setValue('durationSelect', currentDuration.toString());
            return;
        }
        
        if (inputValue > 1440) { // 24 hours
            window.uiComponents.showNotification('Duration cannot exceed 24 hours (1440 minutes)', 'warning');
            const currentDuration = window.appState.getMeetingDuration();
            window.uiComponents.setValue('durationSelect', currentDuration.toString());
            return;
        }
        
        window.appState.setMeetingDuration(inputValue);
        console.log('Meeting duration updated to:', inputValue, 'minutes');
        
        const meetupKey = window.appState.getMeetupKey();
        if (meetupKey) {
            try {
                await window.firebaseAPI.updateMeetupDuration(meetupKey, inputValue);
                window.uiComponents.showNotification(`Duration updated to ${inputValue} minutes`, 'success');
            } catch (error) {
                console.error('Error updating duration:', error);
            }
        }
        
        if (window.proposalManager && window.proposalManager.refreshProposalsDisplay) {
            window.proposalManager.refreshProposalsDisplay();
        }
    }

    // Edit meetup name with custom modal
    async editMeetupName() {
        try {
            const meetupKey = window.appState.getMeetupKey();
            if (!meetupKey) {
                await window.safeAlert('No meetup selected', 'Error', { type: 'error', icon: '❌' });
                return;
            }

            const currentName = document.getElementById('meetupTitle').textContent;
            const newName = await window.safePrompt(
                'Enter meetup name:',
                'Edit Meetup Name',
                currentName,
                {
                    placeholder: 'Enter meetup name',
                    maxLength: 100
                }
            );
            
            if (newName === null) return; // User cancelled
            
            const trimmedName = newName.trim();
            if (!trimmedName) {
                await window.safeAlert('Meetup name cannot be empty', 'Invalid Name', { type: 'warning', icon: '⚠️' });
                return;
            }

            if (trimmedName === currentName) return; // No change
            
            await window.firebaseAPI.updateMeetupName(meetupKey, trimmedName);
            
            // Note: UI will be updated automatically by the real-time listener
            window.uiComponents.showNotification('Meetup name updated!', 'success');
            console.log('✅ Meetup name updated:', trimmedName);
            
        } catch (error) {
            console.error('❌ Error updating meetup name:', error);
            await window.safeAlert('Error updating meetup name: ' + error.message, 'Error', { type: 'error', icon: '❌' });
        }
    }

    // Description management functions
    editDescription() {
        const display = document.getElementById('descriptionDisplay');
        const edit = document.getElementById('descriptionEdit');
        const input = document.getElementById('descriptionInput');
        const currentText = document.getElementById('descriptionText').textContent;
        
        // Don't edit the placeholder text
        if (currentText !== 'Click here to add a description for this meetup...') {
            input.value = currentText;
        } else {
            input.value = '';
        }
        
        display.classList.add('hidden');
        edit.classList.remove('hidden');
        input.focus();
    }

    async saveDescription() {
        try {
            const input = document.getElementById('descriptionInput');
            const description = input.value.trim();
            
            const meetupKey = window.appState.getMeetupKey();
            if (!meetupKey) {
                window.uiComponents.showNotification('No meetup selected', 'error');
                return;
            }
            
            await window.firebaseAPI.updateMeetupDescription(meetupKey, description);
            
            this.cancelDescriptionEdit();
            window.uiComponents.showNotification('Description updated!', 'success');
        } catch (error) {
            console.error('Error updating description:', error);
            window.uiComponents.showNotification('Failed to update description', 'error');
        }
    }

    cancelDescriptionEdit() {
        document.getElementById('descriptionDisplay').classList.remove('hidden');
        document.getElementById('descriptionEdit').classList.add('hidden');
    }

    handleDescriptionKeydown(event) {
        if (event.ctrlKey && event.key === 'Enter') {
            this.saveDescription();
        } else if (event.key === 'Escape') {
            this.cancelDescriptionEdit();
        }
    }

    // Copy meetup link
    async copyLink() {
        try {
            const meetupKey = window.appState.getMeetupKey();
            const link = `${window.location.origin}${window.location.pathname}?key=${meetupKey}`;
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

    // Load meetup data and set up listeners
    async loadMeetupData() {
        const meetupKey = window.appState.getMeetupKey();
        if (!meetupKey) return;

        try {
            window.uiComponents.updateText('currentMeetupKey', meetupKey);
            
            // Initialize calendar for this meetup
            if (window.calendar && window.calendar.init) {
                const selectedParticipantId = window.appState.getSelectedParticipant();
                window.calendar.init(meetupKey, selectedParticipantId);
            }
            
            // Load initial global favorites data immediately
            console.log('🌟 Loading initial global favorites data...');
            try {
                const favoritesSnapshot = await window.firebaseAPI.database.ref('meetups/' + meetupKey + '/globalFavorites').once('value');
                const initialFavorites = favoritesSnapshot.val() || {};
                console.log('🌟 Initial global favorites loaded:', initialFavorites);
                window.appState.updateGlobalFavorites(initialFavorites);
            } catch (error) {
                console.warn('Could not load initial global favorites:', error);
                window.appState.updateGlobalFavorites({});
            }
            
            // Set up listeners (they will load initial data and provide real-time updates)
            this.setupMeetupListeners();
            
        } catch (error) {
            console.error('Error loading meetup data:', error);
            window.uiComponents.showNotification('Error loading meetup data', 'error');
        }
    }

    // Set up Firebase listeners for real-time updates
    setupMeetupListeners() {
        const meetupKey = window.appState.getMeetupKey();
        
        // Clean up existing listeners first
        this.cleanupListeners();

        // Real-time title listener
        const titleListener = window.firebaseAPI.database.ref('meetups/' + meetupKey + '/name').on('value', (snapshot) => {
            const title = snapshot.val();
            if (title) {
                document.getElementById('meetupTitle').textContent = title;
            } else {
                document.getElementById('meetupTitle').textContent = 'Untitled Meetup';
            }
        });
        window.appState.addListener('title', titleListener);

        // Real-time duration listener
        const durationListener = window.firebaseAPI.database.ref('meetups/' + meetupKey + '/duration').on('value', (snapshot) => {
            const duration = snapshot.val();
            if (duration) {
                window.appState.setMeetingDuration(duration);
                window.uiComponents.setValue('durationSelect', duration.toString());
            }
        });
        window.appState.addListener('duration', durationListener);

        // Real-time description listener
        const descriptionListener = window.firebaseAPI.database.ref('meetups/' + meetupKey + '/description').on('value', (snapshot) => {
            const description = snapshot.val() || '';
            window.uiComponents.updateDescriptionDisplay(description);
        });
        window.appState.addListener('description', descriptionListener);

        // Participants listener
        const participantsListener = window.firebaseAPI.onParticipantsChange(meetupKey, (participants) => {
            window.appState.updateParticipants(participants);
        });
        window.appState.addListener('participants', participantsListener);

        // Messages listener
        const messagesListener = window.firebaseAPI.onMessagesChange(meetupKey, (messages) => {
            window.appState.updateMessages(messages);
        });
        window.appState.addListener('messages', messagesListener);

        // Proposals listener
        const proposalsListener = window.firebaseAPI.onProposalsChange(meetupKey, (proposals) => {
            window.appState.updateProposals(proposals);
        });
        window.appState.addListener('proposals', proposalsListener);

        // Global favorites listener - ALWAYS active
        const globalFavoritesListener = window.firebaseAPI.onGlobalFavoritesChange(meetupKey, (globalFavorites) => {
            console.log('🌟 Global favorites updated:', globalFavorites);
            window.appState.updateGlobalFavorites(globalFavorites);
        });
        window.appState.addListener('globalFavorites', globalFavoritesListener);

        // Deleted proposals listener
        const deletedProposalsListener = window.firebaseAPI.database.ref('meetups/' + meetupKey + '/deletedProposals').on('value', (snapshot) => {
            const deletedProposals = snapshot.val() || {};
            console.log('🗑️ Deleted proposals updated:', Object.keys(deletedProposals).length, 'deleted');
            // Update proposals display with deleted ones
            if (window.proposalManager && window.proposalManager.updateProposalsUI) {
                const currentProposals = window.appState.getProposals();
                window.proposalManager.updateProposalsUI(currentProposals, deletedProposals);
            }
        });
        window.appState.addListener('deletedProposals', deletedProposalsListener);
    }

    // Clean up Firebase listeners
    cleanupListeners() {
        const meetupKey = window.appState.getMeetupKey();
        
        if (meetupKey) {
            const listeners = window.appState.getListeners();
            
            // Clean up individual listeners
            listeners.forEach((listener, key) => {
                if (key === 'title') {
                    window.firebaseAPI.database.ref('meetups/' + meetupKey + '/name').off('value', listener);
                } else if (key === 'duration') {
                    window.firebaseAPI.database.ref('meetups/' + meetupKey + '/duration').off('value', listener);
                } else if (key === 'description') {
                    window.firebaseAPI.database.ref('meetups/' + meetupKey + '/description').off('value', listener);
                } else if (key === 'globalFavorites') {
                    window.firebaseAPI.database.ref('meetups/' + meetupKey + '/globalFavorites').off('value', listener);
                } else if (key === 'deletedProposals') {
                    window.firebaseAPI.database.ref('meetups/' + meetupKey + '/deletedProposals').off('value', listener);
                }
            });
            
            // Clean up main meetup listeners
            window.firebaseAPI.cleanupMeetupListeners(meetupKey);
        }
        
        window.appState.clearListeners();
    }
}

// Create global meetup manager instance
window.meetupManager = new MeetupManager();

console.log('✅ Meetup management loaded');
