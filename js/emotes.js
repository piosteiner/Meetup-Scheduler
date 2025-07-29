// js/emotes.js - 7TV Emote System for Piogino Meetup App

class EmoteSystem {
    constructor() {
        this.emotes = new Map(); // Store emote name -> data mapping
        this.emoteRegex = null; // Compiled regex for matching emote names
        this.isLoading = false;
        this.loadPromise = null;
        
        // 7TV Global Emote Set ID (popular emotes available to everyone)
        this.globalEmoteSetId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
        
        // Cache configuration
        this.cacheKey = 'piogino_emotes_cache';
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
        
        // Initialize the system
        this.init();
    }

    async init() {
        try {
            // Try to load from cache first
            const cachedData = this.loadFromCache();
            if (cachedData) {
                this.loadEmotes(cachedData.emotes);
                console.log('✅ Loaded emotes from cache:', this.emotes.size, 'emotes');
            }
            
            // Always fetch fresh data in background (but don't block UI)
            this.fetchEmotes().catch(console.warn);
        } catch (error) {
            console.warn('Failed to initialize emote system:', error);
        }
    }

    // Load emotes from cache
    loadFromCache() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (!cached) return null;
            
            const data = JSON.parse(cached);
            const now = Date.now();
            
            if (now - data.timestamp > this.cacheExpiry) {
                localStorage.removeItem(this.cacheKey);
                return null;
            }
            
            return data;
        } catch (error) {
            console.warn('Failed to load emotes from cache:', error);
            return null;
        }
    }

    // Save emotes to cache
    saveToCache(emotes) {
        try {
            const data = {
                emotes: emotes,
                timestamp: Date.now()
            };
            localStorage.setItem(this.cacheKey, JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save emotes to cache:', error);
        }
    }

    // Fetch emotes from 7TV API
    async fetchEmotes() {
        if (this.isLoading) {
            return this.loadPromise;
        }
        
        this.isLoading = true;
        this.loadPromise = this._doFetchEmotes();
        
        try {
            await this.loadPromise;
        } finally {
            this.isLoading = false;
            this.loadPromise = null;
        }
    }

    async _doFetchEmotes() {
        try {
            console.log('🔄 Fetching fresh emotes from 7TV...');
            
            // Fetch popular global emotes from 7TV
            const response = await fetch('https://7tv.io/v3/emote-sets/global', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error(`7TV API responded with ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.emotes || !Array.isArray(data.emotes)) {
                throw new Error('Invalid response format from 7TV API');
            }
            
            // Process emotes into our format
            const emotesData = {};
            data.emotes.forEach(emoteData => {
                if (!emoteData.name || !emoteData.id) return;
                
                emotesData[emoteData.name] = {
                    id: emoteData.id,
                    name: emoteData.name,
                    // Use 2x size for better quality
                    url: `https://cdn.7tv.app/emote/${emoteData.id}/2x.webp`,
                    // Fallback to PNG if WebP fails
                    fallbackUrl: `https://cdn.7tv.app/emote/${emoteData.id}/2x.png`,
                    width: emoteData.data?.host?.width || 28,
                    height: emoteData.data?.host?.height || 28,
                    animated: emoteData.data?.animated || false
                };
            });
            
            this.loadEmotes(emotesData);
            this.saveToCache(emotesData);
            
            console.log('✅ Successfully loaded', Object.keys(emotesData).length, 'emotes from 7TV');
            
        } catch (error) {
            console.warn('Failed to fetch emotes from 7TV:', error);
            
            // If we have cached emotes, continue using them
            if (this.emotes.size === 0) {
                // Load a minimal set of popular emotes as fallback
                this.loadFallbackEmotes();
            }
        }
    }

    // Load emotes into memory and build regex
    loadEmotes(emotesData) {
        this.emotes.clear();
        
        Object.entries(emotesData).forEach(([name, data]) => {
            this.emotes.set(name, data);
        });
        
        this.buildEmoteRegex();
    }

    // Load fallback emotes if API fails
    loadFallbackEmotes() {
        const fallbackEmotes = {
            'peepoHey': {
                id: '01F6NMMEER00015NVG2J8ZH77N',
                name: 'peepoHey',
                url: 'https://cdn.7tv.app/emote/01F6NMMEER00015NVG2J8ZH77N/2x.webp',
                fallbackUrl: 'https://cdn.7tv.app/emote/01F6NMMEER00015NVG2J8ZH77N/2x.png',
                width: 28,
                height: 28,
                animated: false
            },
            'Kappa': {
                id: '60ae958e229664e0042a3e6a',
                name: 'Kappa',
                url: 'https://cdn.7tv.app/emote/60ae958e229664e0042a3e6a/2x.webp',
                fallbackUrl: 'https://cdn.7tv.app/emote/60ae958e229664e0042a3e6a/2x.png',
                width: 28,
                height: 28,
                animated: false
            },
            'OMEGALUL': {
                id: '60ae43bf259b0f00060b4b54',
                name: 'OMEGALUL',
                url: 'https://cdn.7tv.app/emote/60ae43bf259b0f00060b4b54/2x.webp',
                fallbackUrl: 'https://cdn.7tv.app/emote/60ae43bf259b0f00060b4b54/2x.png',
                width: 28,
                height: 28,
                animated: false
            }
        };
        
        this.loadEmotes(fallbackEmotes);
        console.log('⚠️ Using fallback emotes');
    }

    // Build regex pattern to match emote names
    buildEmoteRegex() {
        if (this.emotes.size === 0) {
            this.emoteRegex = null;
            return;
        }
        
        // Sort emote names by length (longest first) to prevent partial matches
        const emoteNames = Array.from(this.emotes.keys())
            .sort((a, b) => b.length - a.length)
            .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); // Escape regex chars
        
        // Create regex that matches emote names as whole words
        this.emoteRegex = new RegExp(`\\b(${emoteNames.join('|')})\\b`, 'g');
    }

    // Process text and replace emote names with HTML img tags
    processText(text) {
        if (!text || !this.emoteRegex || this.emotes.size === 0) {
            return this.escapeHtml(text || '');
        }
        
        // First escape HTML to prevent XSS
        const escapedText = this.escapeHtml(text);
        
        // Replace emote names with img tags
        return escapedText.replace(this.emoteRegex, (match) => {
            const emote = this.emotes.get(match);
            if (!emote) return match;
            
            return this.createEmoteHtml(emote);
        });
    }

    // Create HTML for an emote
    createEmoteHtml(emote) {
        return `<img src="${emote.url}" 
                    alt="${emote.name}" 
                    title="${emote.name}"
                    class="emote-img inline-block align-middle mx-0.5" 
                    style="width: 24px; height: 24px; object-fit: contain;"
                    onerror="this.src='${emote.fallbackUrl}'; this.onerror=null;"
                    loading="lazy">`;
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Get list of available emotes (for autocomplete/preview)
    getAvailableEmotes() {
        return Array.from(this.emotes.entries()).map(([name, data]) => ({
            name: name,
            url: data.url,
            id: data.id
        }));
    }

    // Check if an emote exists
    hasEmote(name) {
        return this.emotes.has(name);
    }

    // Get emote data by name
    getEmote(name) {
        return this.emotes.get(name);
    }

    // Force refresh emotes
    async refreshEmotes() {
        localStorage.removeItem(this.cacheKey);
        this.emotes.clear();
        await this.fetchEmotes();
    }
}

// Enhanced UI Components with emote support
class EmoteEnabledUIComponents extends UIComponents {
    constructor() {
        super();
        // Initialize emote system
        this.emoteSystem = new EmoteSystem();
    }

    // Override message rendering to include emotes
    renderMessage(messageId, message, allParticipants) {
        // More robust name lookup
        let senderName = 'Unknown';
        if (message.participantId && allParticipants[message.participantId]) {
            senderName = allParticipants[message.participantId].name;
        } else if (message.participantId) {
            senderName = `User ${message.participantId.slice(-4)} (left?)`;
        }
        
        const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleString() : '';
        
        // Process message text with emotes
        const processedMessage = this.emoteSystem.processText(message.message);
        
        return `
            <div class="bg-gray-50 p-3 rounded-lg border-l-4 border-indigo-500 group">
                <div class="flex items-center justify-between mb-1">
                    <div class="font-semibold text-sm text-indigo-600">${senderName}</div>
                    <div class="flex items-center gap-2">
                        <div class="text-xs text-gray-400">${timestamp}</div>
                        <button onclick="window.deleteMessage('${messageId}', '${this.escapeHtml(senderName)}', '${this.escapeHtml(message.message)}')" 
                                class="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-xs transition-all duration-200 ml-2"
                                title="Delete message">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="text-gray-900 break-words">${processedMessage}</div>
            </div>
        `;
    }

    // Override description display to include emotes
    updateDescriptionDisplay(description) {
        const textElement = document.getElementById('descriptionText');
        if (textElement) {
            if (description && description.trim()) {
                // Process description with emotes
                const processedDescription = this.emoteSystem.processText(description);
                textElement.innerHTML = processedDescription;
                textElement.classList.remove('italic', 'text-gray-600');
                textElement.classList.add('text-gray-900');
            } else {
                textElement.textContent = 'Click here to add a description for this meetup...';
                textElement.classList.add('italic', 'text-gray-600');
                textElement.classList.remove('text-gray-900');
            }
        }
    }

    // Add emote preview functionality
    showEmotePreview(inputElement) {
        const text = inputElement.value;
        const cursorPosition = inputElement.selectionStart;
        
        // Find emote names in the text around cursor position
        const beforeCursor = text.substring(0, cursorPosition);
        const matches = beforeCursor.match(/\b\w+$/);
        
        if (matches) {
            const partialEmote = matches[0];
            const availableEmotes = this.emoteSystem.getAvailableEmotes()
                .filter(emote => emote.name.toLowerCase().startsWith(partialEmote.toLowerCase()))
                .slice(0, 5); // Show max 5 suggestions
            
            if (availableEmotes.length > 0) {
                this.displayEmoteSuggestions(availableEmotes, inputElement);
            } else {
                this.hideEmoteSuggestions();
            }
        } else {
            this.hideEmoteSuggestions();
        }
    }

    displayEmoteSuggestions(emotes, inputElement) {
        // Remove existing suggestions
        this.hideEmoteSuggestions();
        
        const suggestions = document.createElement('div');
        suggestions.id = 'emote-suggestions';
        suggestions.className = 'absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-2 mt-1 max-w-xs';
        
        suggestions.innerHTML = emotes.map(emote => `
            <div class="flex items-center gap-2 p-1 hover:bg-gray-100 rounded cursor-pointer emote-suggestion" 
                 data-emote-name="${emote.name}">
                <img src="${emote.url}" alt="${emote.name}" class="w-6 h-6">
                <span class="text-sm">${emote.name}</span>
            </div>
        `).join('');
        
        // Position relative to input
        const rect = inputElement.getBoundingClientRect();
        suggestions.style.position = 'fixed';
        suggestions.style.left = rect.left + 'px';
        suggestions.style.top = (rect.bottom + 5) + 'px';
        
        document.body.appendChild(suggestions);
        
        // Add click handlers
        suggestions.querySelectorAll('.emote-suggestion').forEach(item => {
            item.addEventListener('click', () => {
                const emoteName = item.dataset.emoteName;
                this.insertEmote(inputElement, emoteName);
                this.hideEmoteSuggestions();
            });
        });
    }

    hideEmoteSuggestions() {
        const existing = document.getElementById('emote-suggestions');
        if (existing) {
            existing.remove();
        }
    }

    insertEmote(inputElement, emoteName) {
        const text = inputElement.value;
        const cursorPosition = inputElement.selectionStart;
        
        // Find the partial emote text to replace
        const beforeCursor = text.substring(0, cursorPosition);
        const matches = beforeCursor.match(/\b\w+$/);
        
        if (matches) {
            const startPos = cursorPosition - matches[0].length;
            const newText = text.substring(0, startPos) + emoteName + text.substring(cursorPosition);
            
            inputElement.value = newText;
            inputElement.setSelectionRange(startPos + emoteName.length, startPos + emoteName.length);
            inputElement.focus();
        }
    }
}

// Replace the global uiComponents instance
window.uiComponents = new EmoteEnabledUIComponents();
window.emoteSystem = window.uiComponents.emoteSystem;

// Enhanced MeetupApp with emote-aware title processing
class EmoteEnabledMeetupApp extends MeetupApp {
    // Override editMeetupName to process emotes in titles
    async editMeetupName() {
        try {
            if (!this.currentMeetupKey) {
                window.uiComponents.showNotification('No meetup selected', 'error');
                return;
            }

            const currentName = document.getElementById('meetupTitle').textContent;
            const newName = prompt('Enter meetup name (emotes supported!):', currentName);
            
            if (newName === null) return; // User cancelled
            
            const trimmedName = newName.trim();
            if (!trimmedName) {
                window.uiComponents.showNotification('Meetup name cannot be empty', 'warning');
                return;
            }

            if (trimmedName === currentName) return; // No change
            
            await window.firebaseAPI.updateMeetupName(this.currentMeetupKey, trimmedName);
            
            window.uiComponents.showNotification('Meetup name updated!', 'success');
            console.log('✅ Meetup name updated:', trimmedName);
            
        } catch (error) {
            console.error('❌ Error updating meetup name:', error);
            window.uiComponents.showNotification('Error updating meetup name: ' + error.message, 'error');
        }
    }

    // Override setupEventListeners to add emote preview
    setupEventListeners() {
        super.setupEventListeners();
        
        // Add emote preview to message input
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('input', () => {
                window.uiComponents.showEmotePreview(messageInput);
            });
            
            messageInput.addEventListener('blur', () => {
                setTimeout(() => window.uiComponents.hideEmoteSuggestions(), 150);
            });
        }
        
        // Add emote preview to description input
        const descriptionInput = document.getElementById('descriptionInput');
        if (descriptionInput) {
            descriptionInput.addEventListener('input', () => {
                window.uiComponents.showEmotePreview(descriptionInput);
            });
            
            descriptionInput.addEventListener('blur', () => {
                setTimeout(() => window.uiComponents.hideEmoteSuggestions(), 150);
            });
        }
    }

    // Override setupMeetupListeners to handle emote-processed titles
    setupMeetupListeners() {
        // Clean up existing listeners first
        this.cleanupListeners();

        // Real-time title listener with emote processing
        const titleListener = window.firebaseAPI.database.ref('meetups/' + this.currentMeetupKey + '/name').on('value', (snapshot) => {
            const title = snapshot.val();
            const titleElement = document.getElementById('meetupTitle');
            if (titleElement) {
                if (title) {
                    // Process title with emotes
                    const processedTitle = window.uiComponents.emoteSystem.processText(title);
                    titleElement.innerHTML = processedTitle;
                } else {
                    titleElement.textContent = 'Untitled Meetup';
                }
            }
        });
        this.listeners.set('title', titleListener);

        // Continue with other listeners (duration, description, etc.)
        const durationListener = window.firebaseAPI.database.ref('meetups/' + this.currentMeetupKey + '/duration').on('value', (snapshot) => {
            const duration = snapshot.val();
            if (duration) {
                this.meetingDuration = duration;
                window.uiComponents.setValue('durationSelect', duration.toString());
            }
        });
        this.listeners.set('duration', durationListener);

        const descriptionListener = window.firebaseAPI.database.ref('meetups/' + this.currentMeetupKey + '/description').on('value', (snapshot) => {
            const description = snapshot.val() || '';
            window.uiComponents.updateDescriptionDisplay(description);
        });
        this.listeners.set('description', descriptionListener);

        // Rest of the listeners remain the same
        const participantsListener = window.firebaseAPI.onParticipantsChange(this.currentMeetupKey, (participants) => {
            this.allParticipants = participants;
            this.updateParticipantsUI(participants);
            
            if (Object.keys(this.currentMessages).length > 0) {
                this.renderMessages(this.currentMessages);
            }
        });
        this.listeners.set('participants', participantsListener);

        const messagesListener = window.firebaseAPI.onMessagesChange(this.currentMeetupKey, (messages) => {
            this.currentMessages = messages;
            
            const newMessagesList = window.uiComponents.renderMessagesList(
                Object.entries(messages).sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0)),
                this.allParticipants
            );
            
            if (newMessagesList !== this.lastMessagesRender) {
                window.uiComponents.updateHTML('messagesList', newMessagesList);
                this.lastMessagesRender = newMessagesList;
                console.log('Messages updated - DOM rendered');
            } else {
                console.log('Messages updated - no DOM change needed');
            }
        });
        this.listeners.set('messages', messagesListener);

        const proposalsListener = window.firebaseAPI.onProposalsChange(this.currentMeetupKey, (proposals) => {
            this.currentProposals = proposals;
            this.updateProposalsUI(proposals);
        });
        this.listeners.set('proposals', proposalsListener);

        const deletedProposalsListener = window.firebaseAPI.database.ref('meetups/' + this.currentMeetupKey + '/deletedProposals').on('value', (snapshot) => {
            const deletedProposals = snapshot.val() || {};
            console.log('🗑️ Deleted proposals updated:', Object.keys(deletedProposals).length, 'deleted');
            this.updateProposalsUI(this.currentProposals || {}, deletedProposals);
        });
        this.listeners.set('deletedProposals', deletedProposalsListener);
    }
}

// Replace the global app class when DOM loads
document.addEventListener('DOMContentLoaded', async () => {
    // Don't initialize if already initialized
    if (window.app && window.app.constructor.name === 'EmoteEnabledMeetupApp') {
        return;
    }
    
    window.app = new EmoteEnabledMeetupApp();
    await window.app.init();
});

console.log('✅ Emote system loaded successfully');