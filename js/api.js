// api.js - Firebase API functions with enhanced features + FAVORITES

class FirebaseAPI {
    constructor() {
        this.database = null;
        this.isConnected = false;
        this.connectionListeners = [];
    }

    // Initialize Firebase
    async init() {
        try {
            firebase.initializeApp(window.MeetupConfig.firebase);
            this.database = firebase.database();
            console.log('Firebase initialized successfully');
            
            // Monitor connection status
            this.database.ref('.info/connected').on('value', (snapshot) => {
                this.isConnected = snapshot.val() === true;
                if (this.isConnected) {
                    console.log('✅ Connected to Firebase!');
                    this.connectionListeners.forEach(callback => callback(true));
                } else {
                    console.error('❌ Failed to connect to Firebase');
                    this.connectionListeners.forEach(callback => callback(false));
                }
            });
            
            return true;
        } catch (error) {
            console.error('Firebase initialization error:', error);
            throw new Error('Failed to initialize Firebase: ' + error.message);
        }
    }

    // Add connection status listener
    onConnectionChange(callback) {
        this.connectionListeners.push(callback);
        // Immediately call with current status if already initialized
        if (this.database) {
            callback(this.isConnected);
        }
    }

    // Test Firebase connection
    async testConnection() {
        try {
            await this.database.ref('test').once('value');
            console.log('✅ Firebase test successful');
            return true;
        } catch (error) {
            console.error('❌ Firebase test failed:', error);
            throw error;
        }
    }

    // Meetup CRUD operations
    async createMeetup(key, meetupData) {
        try {
            await this.database.ref('meetups/' + key).set({
                title: `Meetup ${key}`,
                name: meetupData.name || 'Untitled Meetup',
                description: meetupData.description || '',
                created: firebase.database.ServerValue.TIMESTAMP,
                duration: meetupData.duration || 60,
                participants: {},
                messages: {},
                proposals: {},
                favorites: {}, // NEW: Initialize favorites
                ...meetupData
            });
            return key;
        } catch (error) {
            console.error('Error creating meetup:', error);
            throw new Error('Error creating meetup. Please try again.');
        }
    }

    async getMeetup(key) {
        try {
            const snapshot = await this.database.ref('meetups/' + key).once('value');
            return snapshot.exists() ? snapshot.val() : null;
        } catch (error) {
            console.error('Error getting meetup:', error);
            throw error;
        }
    }

    async updateMeetupName(key, name) {
        try {
            await this.database.ref('meetups/' + key + '/name').set(name);
        } catch (error) {
            console.error('Error updating meetup name:', error);
            throw error;
        }
    }

    async updateMeetupDescription(key, description) {
        try {
            await this.database.ref('meetups/' + key + '/description').set(description);
        } catch (error) {
            console.error('Error updating meetup description:', error);
            throw error;
        }
    }

    async updateMeetupDuration(key, duration) {
        try {
            await this.database.ref('meetups/' + key + '/duration').set(duration);
        } catch (error) {
            console.error('Error updating duration:', error);
            throw error;
        }
    }

    // Participant operations
    async addParticipant(meetupKey, participantId, participantData) {
        try {
            await this.database.ref('meetups/' + meetupKey + '/participants/' + participantId).set({
                name: participantData.name,
                joined: firebase.database.ServerValue.TIMESTAMP,
                ...participantData
            });
            return participantId;
        } catch (error) {
            console.error('Error adding participant:', error);
            throw new Error('Error joining meetup. Please try again.');
        }
    }

    async updateParticipantName(meetupKey, participantId, newName) {
        try {
            await this.database.ref('meetups/' + meetupKey + '/participants/' + participantId + '/name').set(newName);
            console.log('✅ Participant name updated in Firebase:', participantId, newName);
        } catch (error) {
            console.error('Error updating participant name:', error);
            throw new Error('Error updating participant name. Please try again.');
        }
    }

    // Listen to participants changes
    onParticipantsChange(meetupKey, callback) {
        return this.database.ref('meetups/' + meetupKey + '/participants').on('value', (snapshot) => {
            const participants = snapshot.val() || {};
            callback(participants);
        });
    }

    // Proposal operations
    async addProposal(meetupKey, proposalId, proposalData) {
        try {
            await this.database.ref('meetups/' + meetupKey + '/proposals/' + proposalId).set({
                participantId: proposalData.participantId || 'anonymous',
                dateTime: proposalData.dateTime,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                responses: {}
            });
            return proposalId;
        } catch (error) {
            console.error('Error adding proposal:', error);
            throw new Error('Error proposing date. Please try again.');
        }
    }

    async respondToProposal(meetupKey, proposalId, participantId, response) {
        try {
            await this.database.ref('meetups/' + meetupKey + '/proposals/' + proposalId + '/responses/' + participantId).set({
                response: response,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (error) {
            console.error('Error responding to proposal:', error);
            throw new Error('Error responding to proposal: ' + error.message);
        }
    }

    // Listen to proposals changes
    onProposalsChange(meetupKey, callback) {
        return this.database.ref('meetups/' + meetupKey + '/proposals').on('value', (snapshot) => {
            const proposals = snapshot.val() || {};
            callback(proposals);
        });
    }

    // NEW: Favorite operations
    async addFavorite(meetupKey, participantId, proposalId) {
        try {
            await this.database.ref('meetups/' + meetupKey + '/favorites/' + participantId + '/' + proposalId).set({
                favorited: true,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
            console.log('✅ Favorite added:', participantId, proposalId);
        } catch (error) {
            console.error('Error adding favorite:', error);
            throw new Error('Error adding favorite: ' + error.message);
        }
    }

    async removeFavorite(meetupKey, participantId, proposalId) {
        try {
            await this.database.ref('meetups/' + meetupKey + '/favorites/' + participantId + '/' + proposalId).remove();
            console.log('✅ Favorite removed:', participantId, proposalId);
        } catch (error) {
            console.error('Error removing favorite:', error);
            throw new Error('Error removing favorite: ' + error.message);
        }
    }

    // Listen to favorites changes for a specific participant
    onFavoritesChange(meetupKey, participantId, callback) {
        return this.database.ref('meetups/' + meetupKey + '/favorites/' + participantId).on('value', (snapshot) => {
            const favorites = snapshot.val() || {};
            callback(favorites);
        });
    }

    // Listen to all favorites changes (for displaying star counts)
    onAllFavoritesChange(meetupKey, callback) {
        return this.database.ref('meetups/' + meetupKey + '/favorites').on('value', (snapshot) => {
            const allFavorites = snapshot.val() || {};
            callback(allFavorites);
        });
    }

    // Message operations
    async addMessage(meetupKey, messageId, messageData) {
        try {
            await this.database.ref('meetups/' + meetupKey + '/messages/' + messageId).set({
                participantId: messageData.participantId,
                message: messageData.message,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (error) {
            console.error('Error sending message:', error);
            throw new Error('Error sending message: ' + error.message);
        }
    }

    async editMessage(meetupKey, messageId, editData) {
        try {
            const messageRef = this.database.ref('meetups/' + meetupKey + '/messages/' + messageId);
            
            const snapshot = await messageRef.once('value');
            const currentData = snapshot.val();
            
            if (!currentData) {
                throw new Error('Message not found');
            }
            
            await messageRef.update({
                message: editData.message,
                editedAt: editData.editedAt,
                originalMessage: editData.originalMessage || currentData.message
            });
            
            console.log('✅ Message edited successfully:', messageId);
        } catch (error) {
            console.error('Error editing message:', error);
            throw new Error('Error editing message: ' + error.message);
        }
    }

    // Listen to messages changes
    onMessagesChange(meetupKey, callback) {
        return this.database.ref('meetups/' + meetupKey + '/messages').on('value', (snapshot) => {
            const messages = snapshot.val() || {};
            callback(messages);
        });
    }

    // Clean up listeners
    off(ref, eventType, callback) {
        if (this.database) {
            this.database.ref(ref).off(eventType, callback);
        }
    }

    // Clean up all listeners for a meetup
    cleanupMeetupListeners(meetupKey) {
        if (this.database) {
            this.database.ref('meetups/' + meetupKey).off();
        }
    }
}

// Create singleton instance
window.firebaseAPI = new FirebaseAPI();