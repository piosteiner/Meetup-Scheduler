// messages.js - Message management functionality

class MessageManager {
    constructor() {
        // Subscribe to state changes
        window.appState.subscribe('messages', (messages) => {
            this.updateMessagesUI(messages);
        });
        
        window.appState.subscribe('selectedParticipant', (participantId) => {
            this.refreshMessagesDisplay();
        });
    }

    // Send message
    async sendMessage() {
        try {
            const message = window.uiComponents.getValue('messageInput').trim();
            if (!message) {
                window.uiComponents.showNotification('Please enter a message', 'warning');
                return;
            }
            
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
            
            const messageId = Date.now().toString();
            
            console.log('Sending message as participant:', selectedParticipantId, window.appState.getParticipantName(selectedParticipantId));
            
            await window.firebaseAPI.addMessage(meetupKey, messageId, {
                participantId: selectedParticipantId,
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

            // Check if the selected participant is the message sender
            const messages = window.appState.getMessages();
            const messageData = messages[messageId];
            if (!messageData || messageData.participantId !== selectedParticipantId) {
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

            await window.firebaseAPI.editMessage(meetupKey, messageId, {
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
            
            const meetupKey = window.appState.getMeetupKey();
            if (!meetupKey) {
                window.uiComponents.showNotification('No meetup selected', 'error');
                return;
            }
            
            // Get the message data before deleting
            const messageSnapshot = await window.firebaseAPI.database.ref('meetups/' + meetupKey + '/messages/' + messageId).once('value');
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
                window.firebaseAPI.database.ref('meetups/' + meetupKey + '/deletedMessages/' + messageId).set(deletedMessageData),
                window.firebaseAPI.database.ref('meetups/' + meetupKey + '/messages/' + messageId).remove()
            ]);
            
            window.uiComponents.showNotification('Message deleted successfully', 'success');
            console.log('✅ Message deleted:', messageId);
            
        } catch (error) {
            console.error('❌ Error deleting message:', error);
            await window.safeAlert('Error deleting message: ' + error.message, 'Error', { type: 'error', icon: '❌' });
        }
    }

    // Update messages UI
    updateMessagesUI(messages) {
        // Generate HTML and only update if it's different
        const selectedParticipantId = window.appState.getSelectedParticipant();
        const participants = window.appState.getParticipants();
        
        const newMessagesList = window.uiComponents.renderMessagesList(
            Object.entries(messages).sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0)),
            participants,
            selectedParticipantId // Pass selected participant for edit permissions
        );
        
        // Only update DOM if the HTML actually changed
        const lastRender = window.appState.getLastMessagesRender();
        if (newMessagesList !== lastRender) {
            window.uiComponents.updateHTML('messagesList', newMessagesList);
            window.appState.setLastMessagesRender(newMessagesList);
            console.log('Messages updated - DOM rendered');
        } else {
            console.log('Messages updated - no DOM change needed');
        }
    }

    // Refresh messages display to show/hide edit buttons
    refreshMessagesDisplay() {
        const messages = window.appState.getMessages();
        if (!messages || Object.keys(messages).length === 0) return;
        
        const selectedParticipantId = window.appState.getSelectedParticipant();
        console.log('🔄 Refreshing messages display for selected participant:', selectedParticipantId);
        
        // Re-render messages with current selected participant
        const participants = window.appState.getParticipants();
        const newMessagesList = window.uiComponents.renderMessagesList(
            Object.entries(messages).sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0)),
            participants,
            selectedParticipantId // Pass selected participant for edit permissions
        );
        
        // Force update the DOM (don't check for changes since we want to show/hide edit buttons)
        window.uiComponents.updateHTML('messagesList', newMessagesList);
        window.appState.setLastMessagesRender(newMessagesList);
        
        console.log('✅ Messages refreshed - edit buttons updated for participant:', selectedParticipantId);
    }
}

// Create global message manager instance
window.messageManager = new MessageManager();

console.log('✅ Message management loaded');
