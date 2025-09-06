// globals.js - Global function exports for backward compatibility

// Export global functions for onclick handlers
window.createMeetup = () => window.meetupManager?.createMeetup();
window.joinMeetup = () => window.meetupManager?.joinMeetup();
window.joinAsMember = () => window.participantManager?.joinAsMember();
window.selectParticipant = () => window.participantManager?.selectParticipant();
window.updateDuration = () => window.meetupManager?.updateDuration();
window.proposeDateTime = () => window.proposalManager?.proposeDateTime();
window.sendMessage = () => window.messageManager?.sendMessage();
window.copyLink = () => window.meetupManager?.copyLink();
window.goToMeetup = () => window.meetupManager?.goToMeetup();
window.goHome = () => window.navigation?.goHome();

// Proposal management functions
window.deleteProposal = (proposalId, proposerName) => window.proposalManager?.deleteProposal(proposalId, proposerName);
window.respondToProposal = (proposalId, response) => window.proposalManager?.respondToProposal(proposalId, response);
window.clearAvailabilityResponse = (proposalId, participantName, proposalDate) => window.proposalManager?.clearAvailabilityResponse(proposalId, participantName, proposalDate);

// Message management functions
window.editMessage = (messageId, currentMessage) => window.messageManager?.editMessage(messageId, currentMessage);
window.deleteMessage = (messageId, senderName, messageText) => window.messageManager?.deleteMessage(messageId, senderName, messageText);

// Participant management functions
window.editParticipantName = (participantId) => window.participantManager?.editParticipantName(participantId);

// Meetup management functions
window.editMeetupName = () => window.meetupManager?.editMeetupName();
window.proposeDateFromCalendar = (date, time) => window.proposalManager?.proposeDateFromCalendar(date, time);

// Favorites functions
window.addToFavorites = (proposalId, proposerName, proposalDate) => window.proposalManager?.addToFavorites(proposalId, proposerName, proposalDate);
window.removeFromFavorites = (proposalId, proposerName, proposalDate) => window.proposalManager?.removeFromFavorites(proposalId, proposerName, proposalDate);

// ICS download function
window.downloadProposalICS = (proposalId, proposerName, proposalDateTime) => {
    if (window.proposalManager && window.appState) {
        const proposals = window.appState.getProposals();
        if (proposals && proposals[proposalId]) {
            window.proposalManager.downloadProposalICS(proposalId, proposals[proposalId], proposerName);
        } else {
            window.uiComponents.showNotification('Proposal data not found', 'error');
        }
    }
};

// Description management functions
window.editDescription = () => window.meetupManager?.editDescription();
window.saveDescription = () => window.meetupManager?.saveDescription();
window.cancelDescriptionEdit = () => window.meetupManager?.cancelDescriptionEdit();
window.handleDescriptionKeydown = (event) => window.meetupManager?.handleDescriptionKeydown(event);

// Participant selection functions
window.selectParticipantById = (participantId) => window.participantManager?.selectParticipantById(participantId);

// Debug functions
window.debugGlobalFavorites = function() {
    if (!window.appState) {
        console.log('❌ App state not available');
        return;
    }
    
    console.log('🔍 GLOBAL FAVORITES DEBUG INFO:');
    console.log('Current meetup key:', window.appState.getMeetupKey());
    console.log('Selected participant ID:', window.appState.getSelectedParticipant());
    console.log('Current favorites (selected participant):', window.appState.getCurrentFavorites());
    console.log('Global favorites (all participants):', window.appState.getGlobalFavorites());
    console.log('Current proposals:', Object.keys(window.appState.getProposals() || {}));
    
    // Check globally favorited proposals
    const globallyFavorited = Object.keys(window.appState.getGlobalFavorites() || {});
    console.log('Globally favorited proposal IDs:', globallyFavorited);
    
    // Check star counts
    const proposals = window.appState.getProposals() || {};
    const globalFavorites = window.appState.getGlobalFavorites() || {};
    Object.keys(proposals).forEach(proposalId => {
        const starCount = globalFavorites[proposalId] ? Object.keys(globalFavorites[proposalId]).length : 0;
        if (starCount > 0) {
            console.log(`Proposal ${proposalId}: ${starCount} stars`);
        }
    });
};

// App state debug function
window.debugAppState = function() {
    if (!window.appState) {
        console.log('❌ App state not available');
        return;
    }
    
    console.log('🔍 APP STATE DEBUG INFO:');
    console.log(window.appState.getDebugInfo());
};

console.log('✅ Global functions loaded');
