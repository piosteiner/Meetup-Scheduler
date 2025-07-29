// js/emotes.js - CLEAN VERSION - Fixed 7TV Emote System with Working Autocomplete and Keyboard Navigation

class EmoteSystem {
    constructor() {
        this.emotes = new Map();
        this.emoteRegex = null;
        this.isLoading = false;
        this.loadPromise = null;
        
        // 7TV Global Emote Set ID
        this.globalEmoteSetId = '01EX2NCGX0000171FB842R1TPP';
        this.fallbackEmoteSetIds = [
            '01K1BPC2WFZB8QA3T04MPBTSS9',
            '01F7B8YG000004DHQX8H81YQXF',
            'global'
        ];
        
        // Cache configuration
        this.cacheKey = 'piogino_emotes_cache';
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
        
        // Aspect ratio configuration
        this.maxHeight = 28;
        this.minHeight = 16;
        
        this.init();
    }

    async init() {
        try {
            const cachedData = this.loadFromCache();
            if (cachedData) {
                this.loadEmotes(cachedData.emotes);
                console.log('✅ Loaded emotes from cache:', this.emotes.size, 'emotes');
            }
            
            this.fetchEmotes().catch(console.warn);
        } catch (error) {
            console.warn('Failed to initialize emote system:', error);
        }
    }

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

    calculateDisplayDimensions(originalWidth, originalHeight, context = 'message') {
        const maxHeights = {
            message: 28,
            title: 32,
            description: 24,
            suggestion: 24
        };
        
        const maxHeight = maxHeights[context] || this.maxHeight;
        
        if (!originalWidth || !originalHeight || originalWidth <= 0 || originalHeight <= 0) {
            return { width: maxHeight, height: maxHeight };
        }
        
        const aspectRatio = originalWidth / originalHeight;
        let displayHeight = Math.min(maxHeight, Math.max(originalHeight, this.minHeight));
        let displayWidth = Math.round(displayHeight * aspectRatio);
        
        if (displayHeight < this.minHeight) {
            displayHeight = this.minHeight;
            displayWidth = Math.round(displayHeight * aspectRatio);
        }
        
        const maxWidth = maxHeight * 2.5;
        if (displayWidth > maxWidth) {
            displayWidth = maxWidth;
            displayHeight = Math.round(displayWidth / aspectRatio);
        }
        
        return {
            width: Math.max(1, displayWidth),
            height: Math.max(1, displayHeight)
        };
    }

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
            
            let data = null;
            const setsToTry = [this.globalEmoteSetId, ...this.fallbackEmoteSetIds];
            
            for (const setId of setsToTry) {
                try {
                    const url = setId === 'global' 
                        ? 'https://7tv.io/v3/emote-sets/global'
                        : `https://7tv.io/v3/emote-sets/${setId}`;
                    
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: { 'Accept': 'application/json' }
                    });
                    
                    if (response.ok) {
                        data = await response.json();
                        break;
                    }
                } catch (error) {
                    continue;
                }
            }
            
            if (!data || !data.emotes || !Array.isArray(data.emotes)) {
                throw new Error('No valid emote data found');
            }
            
            const emotesData = {};
            data.emotes.forEach((emoteData) => {
                if (!emoteData.name || !emoteData.id) return;
                
                let originalWidth = 28;
                let originalHeight = 28;
                
                if (emoteData.data?.host?.width && emoteData.data?.host?.height) {
                    originalWidth = emoteData.data.host.width;
                    originalHeight = emoteData.data.host.height;
                } else if (emoteData.data?.host?.files) {
                    const files = emoteData.data.host.files;
                    const largestFile = files.find(f => f.name === '4x.webp') || files.find(f => f.name === '2x.webp') || files[files.length - 1];
                    if (largestFile && largestFile.width && largestFile.height) {
                        originalWidth = largestFile.width;
                        originalHeight = largestFile.height;
                    }
                }
                
                emotesData[emoteData.name] = {
                    id: emoteData.id,
                    name: emoteData.name,
                    url: `https://cdn.7tv.app/emote/${emoteData.id}/2x.webp`,
                    fallbackUrl: `https://cdn.7tv.app/emote/${emoteData.id}/2x.png`,
                    originalWidth: originalWidth,
                    originalHeight: originalHeight,
                    animated: emoteData.data?.animated || false
                };
            });
            
            this.loadEmotes(emotesData);
            this.saveToCache(emotesData);
            
            console.log('✅ Successfully loaded', Object.keys(emotesData).length, 'emotes from 7TV');
            
        } catch (error) {
            console.warn('Failed to fetch emotes from 7TV:', error);
            
            if (this.emotes.size === 0) {
                this.loadFallbackEmotes();
            }
        }
    }

    loadEmotes(emotesData) {
        this.emotes.clear();
        
        Object.entries(emotesData).forEach(([name, data]) => {
            this.emotes.set(name, data);
        });
        
        this.buildEmoteRegex();
    }

    loadFallbackEmotes() {
        const fallbackEmotes = {
            'peepoHey': {
                id: 'test1',
                name: 'peepoHey',
                url: 'https://cdn.7tv.app/emote/test1/2x.webp',
                fallbackUrl: 'https://cdn.7tv.app/emote/test1/2x.png',
                originalWidth: 28,
                originalHeight: 28,
                animated: false
            },
            'Kappa': {
                id: 'test2', 
                name: 'Kappa',
                url: 'https://cdn.7tv.app/emote/test2/2x.webp',
                fallbackUrl: 'https://cdn.7tv.app/emote/test2/2x.png',
                originalWidth: 25,
                originalHeight: 28,
                animated: false
            }
        };
        
        this.loadEmotes(fallbackEmotes);
        console.log('⚠️ Using fallback emotes');
    }

    buildEmoteRegex() {
        if (this.emotes.size === 0) {
            this.emoteRegex = null;
            return;
        }
        
        const emoteNames = Array.from(this.emotes.keys())
            .sort((a, b) => b.length - a.length)
            .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        
        this.emoteRegex = new RegExp(`\\b(${emoteNames.join('|')})\\b`, 'g');
    }

    processText(text, context = 'message') {
        if (!text || !this.emoteRegex || this.emotes.size === 0) {
            return this.escapeHtml(text || '');
        }
        
        const escapedText = this.escapeHtml(text);
        
        return escapedText.replace(this.emoteRegex, (match) => {
            const emote = this.emotes.get(match);
            if (!emote) return match;
            
            return this.createEmoteHtml(emote, context);
        });
    }

    createEmoteHtml(emote, context = 'message') {
        const dimensions = this.calculateDisplayDimensions(
            emote.originalWidth, 
            emote.originalHeight, 
            context
        );
        
        const contextClass = context !== 'message' ? `emote-${context}` : '';
        
        return `<img src="${emote.url}" 
                    alt="${emote.name}" 
                    title="${emote.name}"
                    class="emote-img ${contextClass}" 
                    style="width: ${dimensions.width}px; height: ${dimensions.height}px; object-fit: contain;"
                    data-emote-name="${emote.name}"
                    data-original-width="${emote.originalWidth}"
                    data-original-height="${emote.originalHeight}"
                    onerror="this.src='${emote.fallbackUrl}'; this.onerror=null;"
                    loading="lazy">`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getAvailableEmotes() {
        return Array.from(this.emotes.entries()).map(([name, data]) => ({
            name: name,
            url: data.url,
            fallbackUrl: data.fallbackUrl,
            id: data.id,
            originalWidth: data.originalWidth,
            originalHeight: data.originalHeight
        }));
    }

    hasEmote(name) {
        return this.emotes.has(name);
    }

    getEmote(name) {
        return this.emotes.get(name);
    }

    async refreshEmotes() {
        localStorage.removeItem(this.cacheKey);
        this.emotes.clear();
        await this.fetchEmotes();
    }
}

// Enhanced UI Components with emote support and autocomplete
class EmoteEnabledUIComponents extends UIComponents {
    constructor() {
        super();
        this.emoteSystem = new EmoteSystem();
        
        // Initialize autocomplete state properly
        this.currentSuggestions = [];
        this.selectedSuggestionIndex = -1;
        this.activeSuggestionsInput = null;
        
        console.log('✅ EmoteEnabledUIComponents initialized with:', {
            suggestions: this.currentSuggestions.length,
            selectedIndex: this.selectedSuggestionIndex
        });
    }

    renderMessage(messageId, message, allParticipants) {
        let senderName = 'Unknown';
        if (message.participantId && allParticipants[message.participantId]) {
            senderName = allParticipants[message.participantId].name;
        } else if (message.participantId) {
            senderName = `User ${message.participantId.slice(-4)} (left?)`;
        }
        
        const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleString() : '';
        const processedMessage = this.emoteSystem.processText(message.message, 'message');
        
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
                <div class="text-gray-900 break-words leading-relaxed">${processedMessage}</div>
            </div>
        `;
    }

    updateDescriptionDisplay(description) {
        const textElement = document.getElementById('descriptionText');
        if (textElement) {
            if (description && description.trim()) {
                const processedDescription = this.emoteSystem.processText(description, 'description');
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

    showEmotePreview(inputElement) {
        // Safety check
        if (!this.currentSuggestions) {
            this.currentSuggestions = [];
        }
        
        const text = inputElement.value;
        const cursorPosition = inputElement.selectionStart;
        
        const beforeCursor = text.substring(0, cursorPosition);
        const matches = beforeCursor.match(/:(\w+)$/);
        
        if (matches && matches[1].length >= 1) {
            const partialEmote = matches[1];
            const availableEmotes = this.emoteSystem.getAvailableEmotes()
                .filter(emote => emote.name.toLowerCase().startsWith(partialEmote.toLowerCase()))
                .slice(0, 8);
            
            if (availableEmotes.length > 0) {
                this.currentSuggestions = availableEmotes;
                this.selectedSuggestionIndex = -1;
                this.activeSuggestionsInput = inputElement;
                this.displayEmoteSuggestions(availableEmotes, inputElement);
            } else {
                this.hideEmoteSuggestions();
            }
        } else {
            this.hideEmoteSuggestions();
        }
    }

    displayEmoteSuggestions(emotes, inputElement) {
        this.hideEmoteSuggestions();
        
        const suggestions = document.createElement('div');
        suggestions.id = 'emote-suggestions';
        suggestions.className = 'absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-2 mt-1 max-w-sm';
        
        suggestions.innerHTML = emotes.map((emote, index) => {
            const dims = this.emoteSystem.calculateDisplayDimensions(
                emote.originalWidth, 
                emote.originalHeight, 
                'suggestion'
            );
            return `
                <div class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded cursor-pointer emote-suggestion" 
                     data-emote-name="${emote.name}"
                     data-suggestion-index="${index}">
                    <img src="${emote.url}" 
                         alt="${emote.name}" 
                         class="flex-shrink-0"
                         style="width: ${dims.width}px; height: ${dims.height}px; object-fit: contain;"
                         onerror="this.src='${emote.fallbackUrl}'; this.onerror=null;">
                    <div class="flex-1 min-w-0">
                        <span class="text-sm font-medium text-gray-900">${emote.name}</span>
                        <div class="text-xs text-gray-500">${emote.originalWidth}×${emote.originalHeight}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        const rect = inputElement.getBoundingClientRect();
        suggestions.style.position = 'fixed';
        suggestions.style.left = rect.left + 'px';
        suggestions.style.top = (rect.bottom + 5) + 'px';
        
        document.body.appendChild(suggestions);
        
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
        
        this.currentSuggestions = [];
        this.selectedSuggestionIndex = -1;
        this.activeSuggestionsInput = null;
    }

    insertEmote(inputElement, emoteName) {
        const text = inputElement.value;
        const cursorPosition = inputElement.selectionStart;
        
        const beforeCursor = text.substring(0, cursorPosition);
        const matches = beforeCursor.match(/:(\w+)$/);
        
        if (matches) {
            const startPos = cursorPosition - matches[0].length;
            const newText = text.substring(0, startPos) + emoteName + text.substring(cursorPosition);
            
            inputElement.value = newText;
            inputElement.setSelectionRange(startPos + emoteName.length, startPos + emoteName.length);
            inputElement.focus();
        }
    }

    navigateSuggestions(direction) {
        if (!this.currentSuggestions || this.currentSuggestions.length === 0) {
            return false;
        }
        
        const maxIndex = this.currentSuggestions.length - 1;
        
        switch (direction) {
            case 'down':
            case 'tab':
                this.selectedSuggestionIndex = this.selectedSuggestionIndex < maxIndex 
                    ? this.selectedSuggestionIndex + 1 
                    : 0;
                break;
            case 'up':
                this.selectedSuggestionIndex = this.selectedSuggestionIndex > 0 
                    ? this.selectedSuggestionIndex - 1 
                    : maxIndex;
                break;
        }
        
        this.updateSuggestionSelection();
        return true;
    }

    updateSuggestionSelection() {
        const suggestions = document.querySelectorAll('.emote-suggestion');
        suggestions.forEach((item, index) => {
            item.classList.remove('emote-selected');
            
            if (index === this.selectedSuggestionIndex) {
                item.classList.add('emote-selected');
            }
        });
    }

    insertSelectedEmote() {
        if (this.selectedSuggestionIndex >= 0 && 
            this.selectedSuggestionIndex < this.currentSuggestions.length &&
            this.activeSuggestionsInput) {
            
            const selectedEmote = this.currentSuggestions[this.selectedSuggestionIndex];
            this.insertEmote(this.activeSuggestionsInput, selectedEmote.name);
            this.hideEmoteSuggestions();
            return true;
        }
        return false;
    }
}

// Enhanced MeetupApp with emote-aware title processing
class EmoteEnabledMeetupApp extends MeetupApp {
    setupEventListeners() {
        super.setupEventListeners();
        
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('input', () => {
                window.uiComponents.showEmotePreview(messageInput);
            });
            
            messageInput.addEventListener('blur', () => {
                setTimeout(() => window.uiComponents.hideEmoteSuggestions(), 200);
            });
            
            messageInput.addEventListener('keydown', (e) => {
                if (window.uiComponents.currentSuggestions && window.uiComponents.currentSuggestions.length > 0) {
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        window.uiComponents.navigateSuggestions('down');
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        window.uiComponents.navigateSuggestions('up');
                    } else if (e.key === 'Tab') {
                        e.preventDefault();
                        window.uiComponents.navigateSuggestions('tab');
                    } else if (e.key === 'Enter') {
                        e.preventDefault();
                        window.uiComponents.insertSelectedEmote();
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        window.uiComponents.hideEmoteSuggestions();
                    }
                }
            });
        }
        
        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'descriptionInput') {
                setTimeout(() => {
                    const descriptionInput = document.getElementById('descriptionInput');
                    if (descriptionInput && !descriptionInput.hasAttribute('data-emote-handlers')) {
                        descriptionInput.setAttribute('data-emote-handlers', 'true');
                        
                        descriptionInput.addEventListener('input', () => {
                            window.uiComponents.showEmotePreview(descriptionInput);
                        });
                        
                        descriptionInput.addEventListener('blur', () => {
                            setTimeout(() => window.uiComponents.hideEmoteSuggestions(), 200);
                        });
                        
                        descriptionInput.addEventListener('keydown', (e) => {
                            if (window.uiComponents.currentSuggestions && window.uiComponents.currentSuggestions.length > 0) {
                                if (e.key === 'ArrowDown') {
                                    e.preventDefault();
                                    window.uiComponents.navigateSuggestions('down');
                                } else if (e.key === 'ArrowUp') {
                                    e.preventDefault();
                                    window.uiComponents.navigateSuggestions('up');
                                } else if (e.key === 'Tab') {
                                    e.preventDefault();
                                    window.uiComponents.navigateSuggestions('tab');
                                } else if (e.key === 'Enter') {
                                    e.preventDefault();
                                    window.uiComponents.insertSelectedEmote();
                                } else if (e.key === 'Escape') {
                                    e.preventDefault();
                                    window.uiComponents.hideEmoteSuggestions();
                                }
                            }
                        });
                    }
                }, 100);
            }
        });
    }

    setupMeetupListeners() {
        this.cleanupListeners();

        const titleListener = window.firebaseAPI.database.ref('meetups/' + this.currentMeetupKey + '/name').on('value', (snapshot) => {
            const title = snapshot.val();
            const titleElement = document.getElementById('meetupTitle');
            if (titleElement) {
                if (title) {
                    const processedTitle = window.uiComponents.emoteSystem.processText(title, 'title');
                    titleElement.innerHTML = processedTitle;
                } else {
                    titleElement.textContent = 'Untitled Meetup';
                }
            }
        });
        this.listeners.set('title', titleListener);

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
            this.updateProposalsUI(this.currentProposals || {}, deletedProposals);
        });
        this.listeners.set('deletedProposals', deletedProposalsListener);
    }
}

// Initialize everything
window.uiComponents = new EmoteEnabledUIComponents();
window.emoteSystem = window.uiComponents.emoteSystem;

// Debug functions
window.testAutocomplete = () => {
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.focus();
        messageInput.value = ':peepo';
        messageInput.setSelectionRange(6, 6);
        
        const event = new Event('input', { bubbles: true });
        messageInput.dispatchEvent(event);
        
        console.log('Test: Set input to ":peepo" and triggered autocomplete');
        
        setTimeout(() => {
            const suggestions = document.getElementById('emote-suggestions');
            console.log('Suggestions visible:', !!suggestions);
            console.log('Current suggestions count:', window.uiComponents.currentSuggestions.length);
        }, 100);
    }
};

window.refreshEmotes = () => window.emoteSystem.refreshEmotes();

document.addEventListener('DOMContentLoaded', async () => {
    if (window.app && window.app.constructor.name === 'EmoteEnabledMeetupApp') {
        return;
    }
    
    window.app = new EmoteEnabledMeetupApp();
    await window.app.init();
});

console.log('✅ CLEAN emote system loaded successfully');