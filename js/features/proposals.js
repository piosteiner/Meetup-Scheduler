// proposals.js - Proposal and favorites management

class ProposalManager {
    constructor() {
        // Subscribe to state changes
        window.appState.subscribe('proposals', (proposals) => {
            this.updateProposalsUI(proposals);
        });
        
        window.appState.subscribe('favorites', (favorites) => {
            this.onFavoritesChange(favorites);
        });
    }

    // Propose date and time (now requires participant selection)
    async proposeDateTime(dateTimeValue = null) {
        try {
            const selectedParticipantId = window.appState.getSelectedParticipant();
            // Check if participant is selected first
            if (!selectedParticipantId) {
                window.uiComponents.showNotification('Please select a participant first to propose a date', 'warning');
                return;
            }

            const dateTime = dateTimeValue || window.uiComponents.getValue('dateTimeInput');
            if (!dateTime) {
                window.uiComponents.showNotification('Please select a date and time', 'warning');
                return;
            }
            
            const meetupKey = window.appState.getMeetupKey();
            if (!meetupKey) {
                window.uiComponents.showNotification('No meetup selected', 'error');
                return;
            }
            
            const proposalId = Date.now().toString();
            
            await window.firebaseAPI.addProposal(meetupKey, proposalId, {
                participantId: selectedParticipantId,
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
            const selectedParticipantId = window.appState.getSelectedParticipant();
            if (!selectedParticipantId) {
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
            const selectedParticipantId = window.appState.getSelectedParticipant();
            if (!selectedParticipantId) {
                window.uiComponents.showNotification('Please select a participant first', 'warning');
                return;
            }
            
            const meetupKey = window.appState.getMeetupKey();
            if (!meetupKey) {
                window.uiComponents.showNotification('No meetup selected', 'error');
                return;
            }
            
            console.log('Setting response for participant:', selectedParticipantId, 'to proposal:', proposalId, 'response:', response);
            
            await window.firebaseAPI.respondToProposal(meetupKey, proposalId, selectedParticipantId, response);
            
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
            
            const selectedParticipantId = window.appState.getSelectedParticipant();
            if (!selectedParticipantId) {
                window.uiComponents.showNotification('Please select a participant first', 'warning');
                return;
            }
            
            const meetupKey = window.appState.getMeetupKey();
            if (!meetupKey) {
                window.uiComponents.showNotification('No meetup selected', 'error');
                return;
            }
            
            // Remove the participant's response from Firebase
            await window.firebaseAPI.database.ref(
                `meetups/${meetupKey}/proposals/${proposalId}/responses/${selectedParticipantId}`
            ).remove();
            
            window.uiComponents.showNotification('Availability response cleared!', 'success');
            console.log('✅ Availability response cleared for:', selectedParticipantId, 'on proposal:', proposalId);
            
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
            
            const meetupKey = window.appState.getMeetupKey();
            if (!meetupKey) {
                window.uiComponents.showNotification('No meetup selected', 'error');
                return;
            }
            
            // Get the proposal data before deleting
            const proposalSnapshot = await window.firebaseAPI.database.ref('meetups/' + meetupKey + '/proposals/' + proposalId).once('value');
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
            const globalFavorites = window.appState.getGlobalFavorites();
            const favoritesToRemove = [];
            if (globalFavorites[proposalId]) {
                favoritesToRemove.push(
                    window.firebaseAPI.database.ref('meetups/' + meetupKey + '/globalFavorites/' + proposalId).remove()
                );
            }
            
            // Execute all operations
            await Promise.all([
                window.firebaseAPI.database.ref('meetups/' + meetupKey + '/deletedProposals/' + proposalId).set(deletedProposalData),
                window.firebaseAPI.database.ref('meetups/' + meetupKey + '/proposals/' + proposalId).remove(),
                ...favoritesToRemove
            ]);
            
            window.uiComponents.showNotification('Proposal deleted successfully', 'success');
            console.log('✅ Proposal deleted:', proposalId);
            
        } catch (error) {
            console.error('❌ Error deleting proposal:', error);
            await window.safeAlert('Error deleting proposal: ' + error.message, 'Error', { type: 'error', icon: '❌' });
        }
    }

    // Add to global favorites (simplified)
    async addToFavorites(proposalId, proposerName, proposalDate) {
        try {
            const selectedParticipantId = window.appState.getSelectedParticipant();
            if (!selectedParticipantId) {
                window.uiComponents.showNotification('Please select a participant first', 'warning');
                return;
            }

            const meetupKey = window.appState.getMeetupKey();
            if (!meetupKey) {
                window.uiComponents.showNotification('No meetup selected', 'error');
                return;
            }

            await window.firebaseAPI.addGlobalFavorite(meetupKey, proposalId);
            
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
            const selectedParticipantId = window.appState.getSelectedParticipant();
            if (!selectedParticipantId) {
                window.uiComponents.showNotification('Please select a participant first', 'warning');
                return;
            }

            const meetupKey = window.appState.getMeetupKey();
            if (!meetupKey) {
                window.uiComponents.showNotification('No meetup selected', 'error');
                return;
            }

            const confirmRemove = await window.safeConfirm(
                `Remove "${proposalDate}" from favorites?\n\nThis will remove the star from this proposal for everyone.`,
                'Remove from Favorites',
                {
                    confirmText: 'Remove Star',
                    cancelText: 'Cancel',
                    icon: '⭐',
                    confirmClass: 'bg-yellow-600 hover:bg-yellow-700 text-white'
                }
            );
            
            if (!confirmRemove) return; // User cancelled

            await window.firebaseAPI.removeGlobalFavorite(meetupKey, proposalId);
            
            window.uiComponents.showNotification(`Removed "${proposalDate}" from favorites`, 'info');
            console.log('✅ Removed from global favorites:', proposalId);
            
        } catch (error) {
            console.error('❌ Error removing from favorites:', error);
            window.uiComponents.showNotification('Error removing from favorites: ' + error.message, 'error');
        }
    }

    // Download ICS file for starred proposal
    async downloadProposalICS(proposalId, proposalData, proposerName) {
        try {
            if (!proposalData || !proposalData.dateTime) {
                window.uiComponents.showNotification('Invalid proposal data', 'error');
                return;
            }

            const meetupKey = window.appState.getMeetupKey();
            // Get meetup data
            const meetupData = await window.firebaseAPI.getMeetup(meetupKey);
            if (!meetupData) {
                window.uiComponents.showNotification('Could not fetch meetup data', 'error');
                return;
            }

            const startDate = new Date(proposalData.dateTime);
            const meetingDuration = window.appState.getMeetingDuration();
            const endDate = new Date(startDate.getTime() + meetingDuration * 60 * 1000);
            
            // Prepare event data for ICS
            const eventData = {
                title: meetupData.name || 'Untitled Meetup',
                description: `${meetupData.description || 'No description provided'}\n\nProposed by: ${proposerName}\nMeetup Key: ${meetupKey}`,
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

    // Handle favorites change
    onFavoritesChange(favorites) {
        // When global favorites change, refresh proposals display
        console.log('🌟 Global favorites updated, refreshing proposals display');
        this.updateProposalsUI(window.appState.getProposals());
    }

    // Update proposals UI with global favorites support
    updateProposalsUI(proposals, deletedProposals = {}) {
        // Always pass the current deleted proposals to maintain visibility
        if (!deletedProposals || Object.keys(deletedProposals).length === 0) {
            // If no deleted proposals provided, get from stored state or fetch current ones
            this.getCurrentDeletedProposals().then(currentDeleted => {
                const proposalsList = window.uiComponents.renderProposalsList(
                    proposals, 
                    window.appState.getParticipants(), 
                    window.appState.getSelectedParticipant(), 
                    window.appState.getMeetingDuration(),
                    currentDeleted,
                    window.appState.getCurrentFavorites(),
                    window.appState.getGlobalFavorites()
                );
                window.uiComponents.updateHTML('proposalsList', proposalsList);
            });
        } else {
            const proposalsList = window.uiComponents.renderProposalsList(
                proposals, 
                window.appState.getParticipants(), 
                window.appState.getSelectedParticipant(), 
                window.appState.getMeetingDuration(),
                deletedProposals,
                window.appState.getCurrentFavorites(),
                window.appState.getGlobalFavorites()
            );
            window.uiComponents.updateHTML('proposalsList', proposalsList);
        }
    }

    // Helper method to get current deleted proposals
    async getCurrentDeletedProposals() {
        const meetupKey = window.appState.getMeetupKey();
        if (!meetupKey) return {};
        
        try {
            const snapshot = await window.firebaseAPI.database.ref('meetups/' + meetupKey + '/deletedProposals').once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error fetching deleted proposals:', error);
            return {};
        }
    }

    // Refresh proposals display (for manual updates)
    async refreshProposalsDisplay() {
        const meetupKey = window.appState.getMeetupKey();
        if (!meetupKey) return;
        
        try {
            // Get both active and deleted proposals
            const [proposalsSnapshot, deletedSnapshot] = await Promise.all([
                window.firebaseAPI.database.ref('meetups/' + meetupKey + '/proposals').once('value'),
                window.firebaseAPI.database.ref('meetups/' + meetupKey + '/deletedProposals').once('value')
            ]);
            
            const proposals = proposalsSnapshot.val() || {};
            const deletedProposals = deletedSnapshot.val() || {};
            
            this.updateProposalsUI(proposals, deletedProposals);
        } catch (error) {
            console.error('Error refreshing proposals:', error);
        }
    }
}

// Create global proposal manager instance
window.proposalManager = new ProposalManager();

console.log('✅ Proposal management loaded');
