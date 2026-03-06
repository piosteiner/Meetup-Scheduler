// participants.js - Participant management functionality

class ParticipantManager {
    constructor() {
        // Subscribe to state changes
        window.appState.subscribe('participants', (participants) => {
            this.updateParticipantsUI(participants);
        });
    }

    // Join as participant
    async joinAsMember() {
        try {
            const name = window.uiComponents.getValue('nameInput').trim();
            if (!name) {
                window.uiComponents.showNotification('Please enter your name', 'warning');
                return;
            }

            const meetupKey = window.appState.getMeetupKey();
            if (!meetupKey) {
                window.uiComponents.showNotification('No meetup selected', 'error');
                return;
            }

            const participantId = Date.now().toString();
            window.appState.setCurrentParticipant(participantId);
            
            await window.firebaseAPI.addParticipant(meetupKey, participantId, { name });
            
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
        // Clicking the already-selected participant deselects them
        if (window.appState.getSelectedParticipant() === participantId) {
            window.appState.setSelectedParticipant(null);
            window.uiComponents.setValue('participantSelect', '');
            this.selectParticipant();
            return;
        }

        window.appState.setSelectedParticipant(participantId);
        
        // Update the hidden select for backwards compatibility
        window.uiComponents.setValue('participantSelect', participantId);
        
        // Call the original select participant method
        this.selectParticipant();
    }

    // Select participant for actions
    selectParticipant() {
        const selectedParticipantId = window.appState.getSelectedParticipant();
        const selectedName = selectedParticipantId ? window.appState.getParticipantName(selectedParticipantId) : '';
        
        if (selectedParticipantId && selectedName) {
            // Show message form
            window.uiComponents.show('messageForm');
            window.uiComponents.show('messageAsParticipant');
            window.uiComponents.updateText('messageParticipantName', selectedName);
            window.uiComponents.hide('noParticipantMessage');
            
            // Update calendar for selected participant
            if (window.calendar && window.calendar.updateSelectedParticipant) {
                window.calendar.updateSelectedParticipant(selectedParticipantId);
            }
        } else {
            // Hide forms when no participant selected
            window.uiComponents.hide('messageForm');
            window.uiComponents.hide('messageAsParticipant');
            window.uiComponents.show('noParticipantMessage');
            
            // Reset calendar
            if (window.calendar && window.calendar.updateSelectedParticipant) {
                window.calendar.updateSelectedParticipant(null);
            }
            
            // Clear current favorites when no participant selected
            window.appState.currentFavorites = {};
        }
        
        // Refresh participants display to show selection
        this.updateParticipantsUI(window.appState.getParticipants());
        
        // Refresh proposals display with new participant context
        if (window.proposalManager && window.proposalManager.refreshProposalsDisplay) {
            window.proposalManager.refreshProposalsDisplay();
        }
        
        // Refresh messages display to show/hide edit buttons
        if (window.messageManager && window.messageManager.refreshMessagesDisplay) {
            window.messageManager.refreshMessagesDisplay();
        }
    }

    // Edit participant name with custom modal
    async editParticipantName(participantId) {
        try {
            const currentName = window.appState.getParticipantName(participantId);
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

            const meetupKey = window.appState.getMeetupKey();
            await window.firebaseAPI.updateParticipantName(meetupKey, participantId, trimmedName);
            
            window.uiComponents.showNotification('Participant name updated!', 'success');
            console.log('✅ Participant name updated:', trimmedName);
            
        } catch (error) {
            console.error('❌ Error updating participant name:', error);
            await window.safeAlert('Error updating participant name: ' + error.message, 'Error', { type: 'error', icon: '❌' });
        }
    }

    // Delete participant with DELETE confirmation
    async deleteParticipant(participantId) {
        try {
            const participantName = window.appState.getParticipantName(participantId);
            if (!participantName) {
                await window.safeAlert('Participant not found', 'Error', { type: 'error', icon: '❌' });
                return;
            }

            const confirmation = await window.safePrompt(
                `⚠️ DANGEROUS ACTION\n\nYou are about to permanently delete "${participantName}" and all their availability data.\n\nTo confirm, type DELETE in capital letters:`,
                'Delete Participant - Confirmation Required',
                '',
                { placeholder: 'Type DELETE to confirm', maxLength: 10 }
            );

            if (confirmation === null) return;
            if (confirmation !== 'DELETE') {
                await window.safeAlert('Deletion cancelled. You must type DELETE exactly.', 'Cancelled', { type: 'warning', icon: '⚠️' });
                return;
            }

            const meetupKey = window.appState.getMeetupKey();
            // Deselect if this participant was selected
            if (window.appState.getSelectedParticipant() === participantId) {
                window.appState.setSelectedParticipant(null);
                window.uiComponents.setValue('participantSelect', '');
                this.selectParticipant();
            }

            await window.firebaseAPI.deleteParticipant(meetupKey, participantId);
            window.uiComponents.showNotification(`"${participantName}" has been deleted.`, 'success');
        } catch (error) {
            console.error('❌ Error deleting participant:', error);
            await window.safeAlert('Error deleting participant: ' + error.message, 'Error', { type: 'error', icon: '❌' });
        }
    }

    // Update participants UI
    updateParticipantsUI(participants) {
        const count = Object.keys(participants).length;
        window.uiComponents.updateText('participantCount', count.toString());
        
        // Update participants list with clickable cards
        const selectedParticipantId = window.appState.getSelectedParticipant();
        const participantsList = window.uiComponents.renderParticipantsList(participants, selectedParticipantId);
        window.uiComponents.updateHTML('participantsList', participantsList);

        // Update participant select dropdown (hidden, for backwards compatibility)
        const participantOptions = window.uiComponents.renderParticipantOptions(participants);
        window.uiComponents.updateHTML('participantSelect', participantOptions);

    }
}

// Create global participant manager instance
window.participantManager = new ParticipantManager();

console.log('✅ Participant management loaded');
