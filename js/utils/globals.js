// globals.js - Global function exports for backward compatibility

// Export global functions for onclick handlers
window.createMeetup = () => window.meetupManager?.createMeetup();
window.joinMeetup = () => window.meetupManager?.joinMeetup();
window.joinAsMember = () => window.participantManager?.joinAsMember();
window.selectParticipant = () => window.participantManager?.selectParticipant();
window.updateDuration = () => window.meetupManager?.updateDuration();
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

// Browser compatibility debug function
window.debugBrowserSupport = function() {
    if (!window.FeatureDetector) {
        console.log('❌ Feature detector not available');
        return;
    }
    
    const detector = new window.FeatureDetector();
    const report = detector.getCompatibilityReport();
    
    console.log('🌐 BROWSER COMPATIBILITY REPORT:');
    console.log('📱 Browser:', report.browser.name, report.browser.version);
    console.log('📊 Support Level:', report.message);
    console.table(report.features);
    
    if (report.recommendations.length > 0) {
        console.log('💡 Recommendations:');
        report.recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec}`);
        });
    }
    
    return report;
};

// Cookie consent debug function (already defined in cookie-consent.js but added here for consistency)
window.debugCookieConsent = function() {
    if (!window.cookieConsent) {
        console.log('❌ Cookie consent system not available');
        return;
    }
    
    console.log('🍪 COOKIE CONSENT DEBUG INFO:');
    console.log('Consent Status:', window.cookieConsent.getConsentStatus());
    console.log('Allowed Cookies:', window.cookieConsent.getAllowedCookies());
    console.log('Current Cookies:', document.cookie.split(';').map(c => c.split('=')[0].trim()));
    
    // Show current consent settings
    const status = window.cookieConsent.getConsentStatus();
    console.log('📊 Consent Details:');
    console.table(status.settings);
    
    return status;
};

// Privacy debug function
window.debugPrivacy = function() {
    console.log('🔐 PRIVACY & COMPLIANCE DEBUG INFO:');
    
    // Cookie consent status
    const cookieStatus = window.debugCookieConsent();
    
    // Data retention info
    console.log('📅 Data Retention:');
    console.log('- Meetup data: 30 days of inactivity');
    console.log('- Cookies: 365 days maximum');
    console.log('- Consent: Until withdrawal');
    
    // User rights
    console.log('⚖️ Swiss FADP Rights Available:');
    console.log('- Right to information (Art. 25 DSG)');
    console.log('- Right to rectification (Art. 32 DSG)');
    console.log('- Right to erasure (Art. 32 DSG)');
    console.log('- Right to object');
    console.log('- Data portability');
    
    return {
        cookieConsent: cookieStatus,
        userRights: ['information', 'rectification', 'erasure', 'object', 'portability'],
        contact: 'privacy@piogino-meetup.ch'
    };
};

console.log('✅ Enhanced global functions loaded with privacy debug support');
