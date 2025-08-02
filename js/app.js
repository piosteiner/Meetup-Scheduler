// app.js - Main application logic with custom modal dialogs + GLOBAL FAVORITES + ICS DOWNLOAD - UPDATED

class MeetupApp {
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
        this.currentFavorites = {}; // Store current user's favorites derived from global favorites
        this.globalFavorites = {}; // Store all global favorites
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
        
        // Make datetime input fully clickable
        document.getElementById('dateTimeInput')?.addEventListener('click', (e) => {
            e.target.showPicker?.();
        });
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
            
            await window.firebaseAPI.createMeetup(newKey, { 
                duration: this.meetingDuration,
                name: 'Untitled Meetup',
                description: ''
            });
            
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
                this.selectParticipantById(participantId);
            }, 500);

            window.uiComponents.showNotification(`Welcome, ${name}!`, 'success');
        } catch (error) {
            console.error('Error joining as member:', error);
            window.uiComponents.showNotification(error.message, 'error');
        }
    }

    // Select participant by ID (new method for clickable cards)
    selectParticipantById(participantId) {
        this.selectedParticipantId = participantId;
        
        // Update the hidden select for backwards compatibility
        window.uiComponents.setValue('participantSelect', participantId);
        
        // Call the original select participant method
        this.selectParticipant();
    }

    // Select participant for actions
    selectParticipant() {
        // If not set by the new method, get from dropdown (backwards compatibility)
        if (!this.selectedParticipantId) {
            this.selectedParticipantId = window.uiComponents.getValue('participantSelect');
        }
        
        const selectedName = this.selectedParticipantId ? this.allParticipants[this.selectedParticipantId]?.name : '';
        
        console.log('Selected participant:', this.selectedParticipantId, selectedName);
        
        if (this.selectedParticipantId && selectedName) {
            // Show message form
            window.uiComponents.show('messageForm');
            window.uiComponents.show('messageAsParticipant');
            window.uiComponents.updateText('messageParticipantName', selectedName);
            window.uiComponents.hide('noParticipantMessage');
            
            // Show propose form
            window.uiComponents.show('proposeForm');
            
            // Update calendar for selected participant
            window.calendar.updateSelectedParticipant(this.selectedParticipantId);
            
            // Update current favorites for selected participant from global favorites
            this.updateCurrentFavorites();
        } else {
            // Hide forms when no participant selected
            window.uiComponents.hide('messageForm');
            window.uiComponents.hide('messageAsParticipant');
            window.uiComponents.show('noParticipantMessage');
            
            // Hide propose form when no participant selected
            window.uiComponents.hide('proposeForm');
            
            // Reset calendar
            window.calendar.updateSelectedParticipant(null);
            
            // Clear current favorites when no participant selected
            this.currentFavorites = {};
        }
        
        // Refresh participants display to show selection
        this.updateParticipantsUI(this.allParticipants);
        
        // Refresh proposals display with new participant context
        this.refreshProposalsDisplay();
    }

    // Update current user's favorites from global favorites
    updateCurrentFavorites() {
        this.currentFavorites = {};
        if (this.selectedParticipantId && this.globalFavorites) {
            Object.keys(this.globalFavorites).forEach(proposalId => {
                if (this.globalFavorites[proposalId] && this.globalFavorites[proposalId][this.selectedParticipantId]) {
                    this.currentFavorites[proposalId] = true;
                }
            });
        }
    }

    // Add to global favorites
    async addToFavorites(proposalId, proposerName, proposalDate) {
        try {
            if (!this.selectedParticipantId) {
                window.uiComponents.showNotification('Please select a participant first', 'warning');
                return;
            }

            if (!this.currentMeetupKey) {
                window.uiComponents.showNotification('No meetup selected', 'error');
                return;
            }

            await window.firebaseAPI.addGlobalFavorite(this.currentMeetupKey, proposalId, this.selectedParticipantId);
            
            window.uiComponents.showNotification(`⭐ Added "${proposalDate}" to favorites!`, 'success');
            console.log('✅ Added to global favorites:', proposalId);
            
        } catch (error) {
            console.error('❌ Error adding to favorites:', error);
            window.uiComponents.showNotification('Error adding to favorites: ' + error.message, 'error');
        }
    }

    // Remove from global favorites with confirmation
    async removeFromFavorites(proposalId, proposerName, proposalDate) {
        try {
            if (!this.selectedParticipantId) {
                window.uiComponents.showNotification('Please select a participant first', 'warning');
                return;
            }

            if (!this.currentMeetupKey) {
                window.uiComponents.showNotification('No meetup selected', 'error');
                return;
            }

            // Show confirmation dialog
            const participantName = this.allParticipants[this.selectedParticipantId]?.name || 'Unknown';
            
            const confirmRemove = await window.safeConfirm(
                `Remove "${proposalDate}" from favorites?\n\nThis will remove your star from this proposal.`,
                'Remove from Favorites',
                {
                    confirmText: 'Remove Star',
                    cancelText: 'Cancel',
                    icon: '⭐',
                    confirmClass: 'bg-yellow-600 hover:bg-yellow-700 text-white'
                }
            );
            
            if (!confirmRemove) return; // User cancelled

            await window.firebaseAPI.removeGlobalFavorite(this.currentMeetupKey, proposalId, this.selectedParticipantId);
            
            window.uiComponents.showNotification(`Removed "${proposalDate}" from favorites`, 'info');
            console.log('✅ Removed from global favorites:', proposalId);
            
        } catch (error) {
            console.error('❌ Error removing from favorites:', error);
            window.uiComponents.showNotification('Error removing from favorites: ' + error.message, 'error');
        }
    }

    // NEW: Download ICS file for starred proposal
    async downloadProposalICS(proposalId, proposalData, proposerName) {
        try {
            if (!proposalData || !proposalData.dateTime) {
                window.uiComponents.showNotification('Invalid proposal data', 'error');
                return;
            }

            // Get meetup data
            const meetupData = await window.firebaseAPI.getMeetup(this.currentMeetupKey);
            if (!meetupData) {
                window.uiComponents.showNotification('Could not fetch meetup data', 'error');
                return;
            }

            const startDate = new Date(proposalData.dateTime);
            const endDate = new Date(startDate.getTime() + this.meetingDuration * 60 * 1000);
            
            // Prepare event data for ICS
            const eventData = {
                title: meetupData.name || 'Untitled Meetup',
                description: `${meetupData.description || 'No description provided'}\n\nProposed by: ${proposerName}\nMeetup Key: ${this.currentMeetupKey}`,
                startDate: startDate,
                endDate: endDate,
                location: '', // You can add location field to meetup data if needed
                organizer: proposerName
            };

            // Generate filename
            const dateStr = window.Utils.formatDate(startDate).replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
            const timeStr = window.Utils.formatTime(startDate).replace(/[^\w]/g, '');
            const filename = `${meetupData.name ? meetupData.name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') : 'meetup'}-${dateStr}-${timeStr}.ics`;

            // Download the ICS file
            const success = window.Utils.downloadICSFile(eventData, filename);
            
            if (success) {
                window.uiComponents.showNotification('📅 Calendar event downloaded!', 'success');
            } else {
                window.uiComponents.showNotification('Failed to download calendar event', 'error');
            }
            
        } catch (error) {
            console.error('Error downloading ICS file:', error);
            window.uiComponents.showNotification('Error downloading calendar event: ' + error.message, 'error');
        }
    }

    // Edit participant name with custom modal
    async editParticipantName(participantId) {
        try {
            const currentName = this.allParticipants[participantId]?.name;
            if (!currentName) {
                await window.safeAlert('Participant not found', 'Error', { type: 'error', icon: '❌' });
                return;
            }

            const newName = await window.safePrompt(
                `Current name: ${currentName}\n\nEnter new name:`,
                'Edit Participant Name',
                currentName,
                {
                    placeholder: 'Enter participant name',
                    maxLength: 50
                }
            );
            
            if (newName === null) return; // User cancelled
            
            const trimmedName = newName.trim();
            if (!trimmedName) {
                await window.safeAlert('Name cannot be empty', 'Invalid Name', { type: 'warning', icon: '⚠️' });
                return;
            }

            if (trimmedName === currentName) return; // No change
            
            if (!window.Utils.isValidName(trimmedName)) {
                await window.safeAlert('Name must be between 2 and 50 characters', 'Invalid Name', { type: 'warning', icon: '⚠️' });
                return;
            }

            // Confirmation dialog with custom styling
            const confirmed = await window.safeConfirm(
                `Change participant name from "${currentName}" to "${trimmedName}"?`,
                'Confirm Name Change',
                {
                    confirmText: 'Change Name',
                    cancelText: 'Cancel',
                    icon: '✏️',
                    confirmClass: 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }
            );
            
            if (!confirmed) return;

            await window.firebaseAPI.updateParticipantName(this.currentMeetupKey, participantId, trimmedName);
            
            window.uiComponents.showNotification('Participant name updated!', 'success');
            console.log('✅ Participant name updated:', trimmedName);
            
        } catch (error) {
            console.error('❌ Error updating participant name:', error);
            await window.safeAlert('Error updating participant name: ' + error.message, 'Error', { type: 'error', icon: '❌' });
        }
    }

    // Update meeting duration
    async updateDuration() {
        const inputValue = parseInt(window.uiComponents.getValue('durationSelect'));
        
        // Validate the input
        if (isNaN(inputValue) || inputValue < 15) {
            window.uiComponents.showNotification('Duration must be at least 15 minutes', 'warning');
            window.uiComponents.setValue('durationSelect', this.meetingDuration.toString());
            return;
        }
        
        if (inputValue > 1440) { // 24 hours
            window.uiComponents.showNotification('Duration cannot exceed 24 hours (1440 minutes)', 'warning');
            window.uiComponents.setValue('durationSelect', this.meetingDuration.toString());
            return;
        }
        
        this.meetingDuration = inputValue;
        console.log('Meeting duration updated to:', this.meetingDuration, 'minutes');
        
        if (this.currentMeetupKey) {
            try {
                await window.firebaseAPI.updateMeetupDuration(this.currentMeetupKey, this.meetingDuration);
                window.uiComponents.showNotification(`Duration updated to ${this.meetingDuration} minutes`, 'success');
            } catch (error) {
                console.error('Error updating duration:', error);
            }
        }
        
        this.refreshProposalsDisplay();
    }

    // Edit meetup name with custom modal
    async editMeetupName() {
        try {
            if (!this.currentMeetupKey) {
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
            
            await window.firebaseAPI.updateMeetupName(this.currentMeetupKey, trimmedName);
            
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
            
            if (!this.currentMeetupKey) {
                window.uiComponents.showNotification('No meetup selected', 'error');
                return;
            }
            
            await window.firebaseAPI.updateMeetupDescription(this.currentMeetupKey, description);
            
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

    // Propose date and time (now requires participant selection)
    async proposeDateTime(dateTimeValue = null) {
        try {
            // Check if participant is selected first
            if (!this.selectedParticipantId) {
                window.uiComponents.showNotification('Please select a participant first to propose a date', 'warning');
                return;
            }

            const dateTime = dateTimeValue || window.uiComponents.getValue('dateTimeInput');
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
                participantId: this.selectedParticipantId,
                dateTime: dateTime
            });
            
            window.uiComponents.setValue('dateTimeInput', '');
            window.uiComponents.showNotification('Date proposed successfully!', 'success');
        } catch (error) {
            console.error('Error proposing date:', error);
            window.uiComponents.showNotification(error.message, 'error');
        }
    }

    // Propose date from calendar
    async proposeDateFromCalendar(date, time = '18:00') {
        try {
            if (!this.selectedParticipantId) {
                window.uiComponents.showNotification('Please select a participant first to propose a date', 'warning');
                return;
            }

            const dateTimeString = `${date}T${time}`;
            await this.proposeDateTime(dateTimeString);
        } catch (error) {
            console.error('Error proposing date from calendar:', error);
            window.uiComponents.showNotification('Error proposing date: ' + error.message, 'error');
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

    // Clear availability response with custom modal
    async clearAvailabilityResponse(proposalId, participantName, proposalDate) {
        try {
            // Show confirmation dialog
            const confirmClear = await window.safeConfirm(
                `Clear ${participantName}'s availability response for:\n\n${proposalDate}\n\nThis will remove their current availability status.`,
                'Clear Availability Response',
                {
                    confirmText: 'Clear Response',
                    cancelText: 'Cancel',
                    icon: '🗑️',
                    confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
                    dangerMode: true
                }
            );
            
            if (!confirmClear) return; // User cancelled
            
            if (!this.selectedParticipantId) {
                window.uiComponents.showNotification('Please select a participant first', 'warning');
                return;
            }
            
            if (!this.currentMeetupKey) {
                window.uiComponents.showNotification('No meetup selected', 'error');
                return;
            }
            
            // Remove the participant's response from Firebase
            await window.firebaseAPI.database.ref(
                `meetups/${this.currentMeetupKey}/proposals/${proposalId}/responses/${this.selectedParticipantId}`
            ).remove();
            
            window.uiComponents.showNotification('Availability response cleared!', 'success');
            console.log('✅ Availability response cleared for:', this.selectedParticipantId, 'on proposal:', proposalId);
            
        } catch (error) {
            console.error('❌ Error clearing availability response:', error);
            window.uiComponents.showNotification('Error clearing response: ' + error.message, 'error');
        }
    }

    // Delete proposal with custom modal
    async deleteProposal(proposalId, proposerName) {
        try {
            const confirmation = await window.safePrompt(
                `⚠️ DANGEROUS ACTION\n\nYou are about to permanently delete the proposal by ${proposerName}.\n\nTo confirm deletion, type DELETE in capital letters:`,
                'Delete Proposal - Confirmation Required',
                '',
                {
                    placeholder: 'Type DELETE to confirm',
                    maxLength: 10
                }
            );
            
            if (confirmation !== 'DELETE') {
                if (confirmation !== null) { // User didn't cancel
                    await window.safeAlert('Deletion cancelled. You must type "DELETE" exactly.', 'Deletion Cancelled', { type: 'warning', icon: '⚠️' });
                }
                return;
            }
            
            if (!this.currentMeetupKey) {
                window.uiComponents.showNotification('No meetup selected', 'error');
                return;
            }
            
            // Get the proposal data before deleting
            const proposalSnapshot = await window.firebaseAPI.database.ref('meetups/' + this.currentMeetupKey + '/proposals/' + proposalId).once('value');
            const proposalData = proposalSnapshot.val();
            
            if (!proposalData) {
                await window.safeAlert('Proposal not found', 'Error', { type: 'error', icon: '❌' });
                return;
            }
            
            // Move to deleted proposals and remove favorites
            const deletedProposalData = {
                ...proposalData,
                proposerName: proposerName,
                originalDateTime: proposalData.dateTime,
                deletedAt: firebase.database.ServerValue.TIMESTAMP
            };
            
            // Also clean up any global favorites for this proposal
            const favoritesToRemove = [];
            if (this.globalFavorites[proposalId]) {
                favoritesToRemove.push(
                    window.firebaseAPI.database.ref('meetups/' + this.currentMeetupKey + '/globalFavorites/' + proposalId).remove()
                );
            }
            
            // Execute all operations
            await Promise.all([
                window.firebaseAPI.database.ref('meetups/' + this.currentMeetupKey + '/deletedProposals/' + proposalId).set(deletedProposalData),
                window.firebaseAPI.database.ref('meetups/' + this.currentMeetupKey + '/proposals/' + proposalId).remove(),
                ...favoritesToRemove
            ]);
            
            window.uiComponents.showNotification('Proposal deleted successfully', 'success');
            console.log('✅ Proposal deleted:', proposalId);
            
        } catch (error) {
            console.error('❌ Error deleting proposal:', error);
            await window.safeAlert('Error deleting proposal: ' + error.message, 'Error', { type: 'error', icon: '❌' });
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

    // Edit message with custom modal
    async editMessage(messageId, currentMessage) {
        try {
            if (!this.selectedParticipantId) {
                window.uiComponents.showNotification('Please select a participant first', 'warning');
                return;
            }
            
            if (!this.currentMeetupKey) {
                window.uiComponents.showNotification('No meetup selected', 'error');
                return;
            }

            // Check if the selected participant is the message sender
            const messageData = this.currentMessages[messageId];
            if (!messageData || messageData.participantId !== this.selectedParticipantId) {
                await window.safeAlert('You can only edit your own messages', 'Permission Denied', { type: 'warning', icon: '⚠️' });
                return;
            }

            const newMessage = await window.safePrompt(
                'Edit your message:',
                'Edit Message',
                currentMessage,
                {
                    placeholder: 'Enter your message',
                    maxLength: 500
                }
            );
            
            if (newMessage === null) return; // User cancelled
            
            const trimmedMessage = newMessage.trim();
            if (!trimmedMessage) {
                await window.safeAlert('Message cannot be empty', 'Invalid Message', { type: 'warning', icon: '⚠️' });
                return;
            }

            if (trimmedMessage === currentMessage) return; // No change
            
            if (!window.Utils.isValidMessage(trimmedMessage)) {
                await window.safeAlert('Message is too long', 'Invalid Message', { type: 'warning', icon: '⚠️' });
                return;
            }

            await window.firebaseAPI.editMessage(this.currentMeetupKey, messageId, {
                message: trimmedMessage,
                editedAt: firebase.database.ServerValue.TIMESTAMP,
                originalMessage: currentMessage
            });
            
            window.uiComponents.showNotification('Message edited!', 'success');
        } catch (error) {
            console.error('Error editing message:', error);
            await window.safeAlert('Error editing message: ' + error.message, 'Error', { type: 'error', icon: '❌' });
        }
    }

    // Delete message with custom modal
    async deleteMessage(messageId, senderName, messageText) {
        try {
            // Show confirmation dialog
            const truncatedMessage = messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText;
            
            const confirmDelete = await window.safeConfirm(
                `Delete this message?\n\nFrom: ${senderName}\nMessage: "${truncatedMessage}"\n\nThis action cannot be undone.`,
                'Delete Message',
                {
                    confirmText: 'Delete Message',
                    cancelText: 'Cancel',
                    icon: '🗑️',
                    confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
                    dangerMode: true
                }
            );
            
            if (!confirmDelete) return; // User cancelled
            
            if (!this.currentMeetupKey) {
                window.uiComponents.showNotification('No meetup selected', 'error');
                return;
            }
            
            // Get the message data before deleting
            const messageSnapshot = await window.firebaseAPI.database.ref('meetups/' + this.currentMeetupKey + '/messages/' + messageId).once('value');
            const messageData = messageSnapshot.val();
            
            if (!messageData) {
                await window.safeAlert('Message not found', 'Error', { type: 'error', icon: '❌' });
                return;
            }
            
            // Move to deleted messages and remove from active messages
            const deletedMessageData = {
                ...messageData,
                senderName: senderName,
                originalMessage: messageData.message,
                deletedAt: firebase.database.ServerValue.TIMESTAMP
            };
            
            await Promise.all([
                window.firebaseAPI.database.ref('meetups/' + this.currentMeetupKey + '/deletedMessages/' + messageId).set(deletedMessageData),
                window.firebaseAPI.database.ref('meetups/' + this.currentMeetupKey + '/messages/' + messageId).remove()
            ]);
            
            window.uiComponents.showNotification('Message deleted successfully', 'success');
            console.log('✅ Message deleted:', messageId);
            
        } catch (error) {
            console.error('❌ Error deleting message:', error);
            await window.safeAlert('Error deleting message: ' + error.message, 'Error', { type: 'error', icon: '❌' });
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
        
        // Reset calendar
        window.calendar.reset();
        
        // Reset state
        this.currentMeetupKey = '';
        this.currentParticipantId = null;
        this.selectedParticipantId = null;
        this.allParticipants = {};
        this.meetingDuration = window.MeetupConfig.app.defaultMeetingDuration;
        this.currentMessages = {};
        this.lastMessagesRender = ''; // Reset message render tracking
        this.currentFavorites = {}; // Reset favorites
        this.globalFavorites = {}; // Reset global favorites
        
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

    // Load meetup data and set up listeners
    async loadMeetupData() {
        if (!this.currentMeetupKey) return;

        try {
            window.uiComponents.updateText('currentMeetupKey', this.currentMeetupKey);
            
            // Initialize calendar for this meetup
            window.calendar.init(this.currentMeetupKey, this.selectedParticipantId);
            
            // Load initial global favorites data immediately
            console.log('🌟 Loading initial global favorites data...');
            try {
                const favoritesSnapshot = await window.firebaseAPI.database.ref('meetups/' + this.currentMeetupKey + '/globalFavorites').once('value');
                const initialFavorites = favoritesSnapshot.val() || {};
                console.log('🌟 Initial global favorites loaded:', initialFavorites);
                this.globalFavorites = initialFavorites;
                this.currentFavorites = {}; // No participant selected yet
            } catch (error) {
                console.warn('Could not load initial global favorites:', error);
                this.globalFavorites = {};
                this.currentFavorites = {};
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
        // Clean up existing listeners first
        this.cleanupListeners();

        // Real-time title listener
        const titleListener = window.firebaseAPI.database.ref('meetups/' + this.currentMeetupKey + '/name').on('value', (snapshot) => {
            const title = snapshot.val();
            if (title) {
                document.getElementById('meetupTitle').textContent = title;
            } else {
                document.getElementById('meetupTitle').textContent = 'Untitled Meetup';
            }
        });
        this.listeners.set('title', titleListener);

        // Real-time duration listener
        const durationListener = window.firebaseAPI.database.ref('meetups/' + this.currentMeetupKey + '/duration').on('value', (snapshot) => {
            const duration = snapshot.val();
            if (duration) {
                this.meetingDuration = duration;
                window.uiComponents.setValue('durationSelect', duration.toString());
            }
        });
        this.listeners.set('duration', durationListener);

        // Real-time description listener
        const descriptionListener = window.firebaseAPI.database.ref('meetups/' + this.currentMeetupKey + '/description').on('value', (snapshot) => {
            const description = snapshot.val() || '';
            window.uiComponents.updateDescriptionDisplay(description);
        });
        this.listeners.set('description', descriptionListener);

        // Participants listener
        const participantsListener = window.firebaseAPI.onParticipantsChange(this.currentMeetupKey, (participants) => {
            this.allParticipants = participants;
            this.updateParticipantsUI(participants);
            
            // Only re-render messages if participants actually changed
            // This prevents duplicate rendering when messages update
            if (Object.keys(this.currentMessages).length > 0) {
                this.renderMessages(this.currentMessages);
            }
        });
        this.listeners.set('participants', participantsListener);

        // Messages listener
        const messagesListener = window.firebaseAPI.onMessagesChange(this.currentMeetupKey, (messages) => {
            this.currentMessages = messages;
            
            // Generate HTML and only update if it's different
            const newMessagesList = window.uiComponents.renderMessagesList(
                Object.entries(messages).sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0)),
                this.allParticipants,
                this.selectedParticipantId // Pass selected participant for edit permissions
            );
            
            // Only update DOM if the HTML actually changed
            if (newMessagesList !== this.lastMessagesRender) {
                window.uiComponents.updateHTML('messagesList', newMessagesList);
                this.lastMessagesRender = newMessagesList;
                console.log('Messages updated - DOM rendered');
            } else {
                console.log('Messages updated - no DOM change needed');
            }
        });
        this.listeners.set('messages', messagesListener);

        // Proposals listener
        const proposalsListener = window.firebaseAPI.onProposalsChange(this.currentMeetupKey, (proposals) => {
            this.currentProposals = proposals;
            this.updateProposalsUI(proposals);
        });
        this.listeners.set('proposals', proposalsListener);

        // Global favorites listener - ALWAYS active
        const globalFavoritesListener = window.firebaseAPI.onGlobalFavoritesChange(this.currentMeetupKey, (globalFavorites) => {
            console.log('🌟 Global favorites updated:', globalFavorites);
            this.globalFavorites = globalFavorites;
            
            // Update current user's favorites if participant is selected
            this.updateCurrentFavorites();
            
            // Always refresh proposals display to show stars
            console.log('🌟 Refreshing proposals with global favorites data');
            this.updateProposalsUI(this.currentProposals || {});
        });
        this.listeners.set('globalFavorites', globalFavoritesListener);

        // Deleted proposals listener
        const deletedProposalsListener = window.firebaseAPI.database.ref('meetups/' + this.currentMeetupKey + '/deletedProposals').on('value', (snapshot) => {
            const deletedProposals = snapshot.val() || {};
            console.log('🗑️ Deleted proposals updated:', Object.keys(deletedProposals).length, 'deleted');
            // Always update proposals with deleted ones visible
            this.updateProposalsUI(this.currentProposals || {}, deletedProposals);
        });
        this.listeners.set('deletedProposals', deletedProposalsListener);
    }

    // Update participants UI
    updateParticipantsUI(participants) {
        const count = Object.keys(participants).length;
        window.uiComponents.updateText('participantCount', count.toString());
        
        // Update participants list with clickable cards
        const participantsList = window.uiComponents.renderParticipantsList(participants, this.selectedParticipantId);
        window.uiComponents.updateHTML('participantsList', participantsList);

        // Update participant select dropdown (hidden, for backwards compatibility)
        const participantOptions = window.uiComponents.renderParticipantOptions(participants);
        window.uiComponents.updateHTML('participantSelect', participantOptions);

        // Show propose form only if there are participants AND one is selected
        if (count > 0 && this.selectedParticipantId) {
            window.uiComponents.show('proposeForm');
        } else {
            window.uiComponents.hide('proposeForm');
        }
    }

    // Update proposals UI with global favorites support
    updateProposalsUI(proposals, deletedProposals = {}) {
        this.currentProposals = proposals; // Store for deleted proposals listener
        
        // Always pass the current deleted proposals to maintain visibility
        if (!deletedProposals || Object.keys(deletedProposals).length === 0) {
            // If no deleted proposals provided, get from stored state or fetch current ones
            this.getCurrentDeletedProposals().then(currentDeleted => {
                const proposalsList = window.uiComponents.renderProposalsList(
                    proposals, 
                    this.allParticipants, 
                    this.selectedParticipantId, 
                    this.meetingDuration,
                    currentDeleted,
                    this.currentFavorites, // Pass current favorites
                    this.globalFavorites // Pass global favorites
                );
                window.uiComponents.updateHTML('proposalsList', proposalsList);
            });
        } else {
            const proposalsList = window.uiComponents.renderProposalsList(
                proposals, 
                this.allParticipants, 
                this.selectedParticipantId, 
                this.meetingDuration,
                deletedProposals,
                this.currentFavorites, // Pass current favorites
                this.globalFavorites // Pass global favorites
            );
            window.uiComponents.updateHTML('proposalsList', proposalsList);
        }
    }

    // Helper method to get current deleted proposals
    async getCurrentDeletedProposals() {
        if (!this.currentMeetupKey) return {};
        
        try {
            const snapshot = await window.firebaseAPI.database.ref('meetups/' + this.currentMeetupKey + '/deletedProposals').once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error fetching deleted proposals:', error);
            return {};
        }
    }

    // Refresh proposals display (for manual updates)
    async refreshProposalsDisplay() {
        if (!this.currentMeetupKey) return;
        
        try {
            // Get both active and deleted proposals
            const [proposalsSnapshot, deletedSnapshot] = await Promise.all([
                window.firebaseAPI.database.ref('meetups/' + this.currentMeetupKey + '/proposals').once('value'),
                window.firebaseAPI.database.ref('meetups/' + this.currentMeetupKey + '/deletedProposals').once('value')
            ]);
            
            const proposals = proposalsSnapshot.val() || {};
            const deletedProposals = deletedSnapshot.val() || {};
            
            this.updateProposalsUI(proposals, deletedProposals);
        } catch (error) {
            console.error('Error refreshing proposals:', error);
        }
    }

    // Clean up Firebase listeners
    cleanupListeners() {
        if (this.currentMeetupKey) {
            // Clean up individual listeners
            this.listeners.forEach((listener, key) => {
                if (key === 'title') {
                    window.firebaseAPI.database.ref('meetups/' + this.currentMeetupKey + '/name').off('value', listener);
                } else if (key === 'duration') {
                    window.firebaseAPI.database.ref('meetups/' + this.currentMeetupKey + '/duration').off('value', listener);
                } else if (key === 'description') {
                    window.firebaseAPI.database.ref('meetups/' + this.currentMeetupKey + '/description').off('value', listener);
                } else if (key === 'globalFavorites') {
                    window.firebaseAPI.database.ref('meetups/' + this.currentMeetupKey + '/globalFavorites').off('value', listener);
                } else if (key === 'deletedProposals') {
                    window.firebaseAPI.database.ref('meetups/' + this.currentMeetupKey + '/deletedProposals').off('value', listener);
                }
            });
            
            // Clean up main meetup listeners
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
window.deleteProposal = (proposalId, proposerName) => window.app?.deleteProposal(proposalId, proposerName);
window.deleteMessage = (messageId, senderName, messageText) => window.app?.deleteMessage(messageId, senderName, messageText);
window.editMessage = (messageId, currentMessage) => window.app?.editMessage(messageId, currentMessage);
window.editParticipantName = (participantId) => window.app?.editParticipantName(participantId);
window.clearAvailabilityResponse = (proposalId, participantName, proposalDate) => window.app?.clearAvailabilityResponse(proposalId, participantName, proposalDate);
window.editMeetupName = () => window.app?.editMeetupName();
window.proposeDateFromCalendar = (date, time) => window.app?.proposeDateFromCalendar(date, time);

// Global favorites functions
window.addToFavorites = (proposalId, proposerName, proposalDate) => window.app?.addToFavorites(proposalId, proposerName, proposalDate);
window.removeFromFavorites = (proposalId, proposerName, proposalDate) => window.app?.removeFromFavorites(proposalId, proposerName, proposalDate);

// ICS download global function
window.downloadProposalICS = (proposalId, proposerName, proposalDateTime) => {
    if (window.app && window.app.currentProposals && window.app.currentProposals[proposalId]) {
        window.app.downloadProposalICS(proposalId, window.app.currentProposals[proposalId], proposerName);
    } else {
        window.uiComponents.showNotification('Proposal data not found', 'error');
    }
};

// Debug global favorites function
window.debugGlobalFavorites = function() {
    console.log('🔍 GLOBAL FAVORITES DEBUG INFO:');
    console.log('Current meetup key:', window.app.currentMeetupKey);
    console.log('Selected participant ID:', window.app.selectedParticipantId);
    console.log('Current favorites (selected participant):', window.app.currentFavorites);
    console.log('Global favorites (all participants):', window.app.globalFavorites);
    console.log('Current proposals:', Object.keys(window.app.currentProposals || {}));
    
    // Check globally favorited proposals
    const globallyFavorited = Object.keys(window.app.globalFavorites || {});
    console.log('Globally favorited proposal IDs:', globallyFavorited);
    
    // Check star counts
    Object.keys(window.app.currentProposals || {}).forEach(proposalId => {
        const starCount = window.app.globalFavorites[proposalId] ? Object.keys(window.app.globalFavorites[proposalId]).length : 0;
        if (starCount > 0) {
            console.log(`Proposal ${proposalId}: ${starCount} stars`);
        }
    });
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.app = new MeetupApp();
    await window.app.init();
});