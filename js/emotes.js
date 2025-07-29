// js/emotes.js - 7TV Emote System for Piogino Meetup App

class EmoteSystem {
    constructor() {
        this.emotes = new Map(); // Store emote name -> data mapping
        this.emoteRegex = null; // Compiled regex for matching emote names
        this.isLoading = false;
        this.loadPromise = null;
        
        // Your custom emote set ID
        this.customEmoteSetId = '01K1BPC2WFZB8QA3T04MPBTSS9';
        
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
            this.fetchEmotes().catch(error => {
                console.warn('Failed to fetch fresh emotes:', error);
                // If we don't have cached emotes and fetch fails, show warning
                if (this.emotes.size === 0) {
                    console.warn('⚠️ No emotes available - API fetch failed and no cache found');
                }
            });
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
            console.log('🔄 Fetching emotes from your custom 7TV set...');
            
            // Fetch your specific emote set from 7TV
            const response = await fetch(`https://7tv.io/v3/emote-sets/${this.customEmoteSetId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error(`7TV API responded with ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.emotes || !Array.isArray(data.emotes)) {
                throw new Error('Invalid response format from 7TV API - no emotes array found');
            }
            
            // Process emotes into our format
            const emotesData = {};
            data.emotes.forEach(emoteData => {
                if (!emoteData.name || !emoteData.id) {
                    console.warn('Skipping emote with missing name or id:', emoteData);
                    return;
                }
                
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
            
            if (Object.keys(emotesData).length === 0) {
                throw new Error('No valid emotes found in the emote set');
            }
            
            this.loadEmotes(emotesData);
            this.saveToCache(emotesData);
            
            console.log('✅ Successfully loaded', Object.keys(emotesData).length, 'emotes from your custom set');
            
        } catch (error) {
            console.error('❌ Failed to fetch emotes from 7TV:', error);
            
            // Don't load fallback emotes - just fail gracefully
            if (this.emotes.size === 0) {
                console.warn('⚠️ No emotes available - please check your internet connection or the emote set ID');
            }
            
            throw error; // Re-throw to be handled by caller
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
        this.emoteRegex = null;
        await this.fetchEmotes();
    }

    // Check if emote system is ready
    isReady() {
        return this.emotes.size > 0;
    }

    // Get status of emote system
    getStatus() {
        return {
            ready: this.isReady(),
            emoteCount: this.emotes.size,
            isLoading: this.isLoading,
            setId: this.customEmoteSetId
        };
    }
}

// Enhanced UI Components with emote support and keyboard navigation
class EmoteEnabledUIComponents extends UIComponents {
    constructor() {
        super();
        // Initialize emote system
        this.emoteSystem = new EmoteSystem();
        
        // Navigation state for emote suggestions
        this.currentSuggestions = null;
        this.currentInput = null;
        this.selectedIndex = -1;
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

    // Enhanced emote preview with keyboard navigation
    showEmotePreview(inputElement) {
        const text = inputElement.value;
        const cursorPosition = inputElement.selectionStart;
        
        // Find emote names in the text around cursor position
        const beforeCursor = text.substring(0, cursorPosition);
        const matches = beforeCursor.match(/\b\w+$/);
        
        if (matches && matches[0].length > 0) {
            const partialEmote = matches[0];
            const availableEmotes = this.emoteSystem.getAvailableEmotes()
                .filter(emote => emote.name.toLowerCase().startsWith(partialEmote.toLowerCase()))
                .slice(0, 8); // Show max 8 suggestions
            
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
        suggestions.className = 'absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-1 mt-1 max-w-xs';
        suggestions.setAttribute('role', 'listbox');
        suggestions.setAttribute('aria-label', 'Emote suggestions');
        
        suggestions.innerHTML = emotes.map((emote, index) => `
            <div class="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer emote-suggestion ${index === 0 ? 'selected' : ''}" 
                 data-emote-name="${emote.name}"
                 data-index="${index}"
                 role="option"
                 aria-selected="${index === 0 ? 'true' : 'false'}">
                <img src="${emote.url}" alt="${emote.name}" class="w-6 h-6 flex-shrink-0">
                <span class="text-sm font-medium">${emote.name}</span>
            </div>
        `).join('');
        
        // Position relative to input
        const rect = inputElement.getBoundingClientRect();
        suggestions.style.position = 'fixed';
        suggestions.style.left = rect.left + 'px';
        suggestions.style.top = (rect.bottom + 5) + 'px';
        
        document.body.appendChild(suggestions);
        
        // Store reference for keyboard navigation
        this.currentSuggestions = suggestions;
        this.currentInput = inputElement;
        this.selectedIndex = 0;
        
        // Add click handlers
        suggestions.querySelectorAll('.emote-suggestion').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const emoteName = item.dataset.emoteName;
                this.insertEmote(inputElement, emoteName);
                this.hideEmoteSuggestions();
                inputElement.focus();
            });
        });
    }

    hideEmoteSuggestions() {
        const existing = document.getElementById('emote-suggestions');
        if (existing) {
            existing.remove();
        }
        
        // Clean up navigation state
        this.currentSuggestions = null;
        this.currentInput = null;
        this.selectedIndex = -1;
    }

    // Navigate emote suggestions with keyboard
    navigateEmoteSuggestions(direction) {
        if (!this.currentSuggestions) return false;
        
        const suggestions = this.currentSuggestions.querySelectorAll('.emote-suggestion');
        if (suggestions.length === 0) return false;
        
        // Remove current selection
        suggestions[this.selectedIndex]?.classList.remove('selected');
        suggestions[this.selectedIndex]?.setAttribute('aria-selected', 'false');
        
        // Update selected index
        if (direction === 'down') {
            this.selectedIndex = (this.selectedIndex + 1) % suggestions.length;
        } else if (direction === 'up') {
            this.selectedIndex = this.selectedIndex <= 0 ? suggestions.length - 1 : this.selectedIndex - 1;
        }
        
        // Apply new selection
        const newSelected = suggestions[this.selectedIndex];
        if (newSelected) {
            newSelected.classList.add('selected');
            newSelected.setAttribute('aria-selected', 'true');
            
            // Scroll into view if needed
            newSelected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
        
        return true;
    }

    // Select currently highlighted emote
    selectHighlightedEmote() {
        if (!this.currentSuggestions || !this.currentInput) return false;
        
        const selected = this.currentSuggestions.querySelector('.emote-suggestion.selected');
        if (selected) {
            const emoteName = selected.dataset.emoteName;
            this.insertEmote(this.currentInput, emoteName);
            this.hideEmoteSuggestions();
            this.currentInput.focus();
            return true;
        }
        
        return false;
    }

    // Handle keyboard events for emote navigation
    handleEmoteKeydown(event, inputElement) {
        const suggestions = document.getElementById('emote-suggestions');
        if (!suggestions) {
            return false; // No suggestions visible, let normal handling proceed
        }
        
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.navigateEmoteSuggestions('down');
                return true;
                
            case 'ArrowUp':
                event.preventDefault();
                this.navigateEmoteSuggestions('up');
                return true;
                
            case 'Tab':
                event.preventDefault();
                if (this.selectHighlightedEmote()) {
                    return true;
                }
                break;
                
            case 'Enter':
                event.preventDefault();
                if (this.selectHighlightedEmote()) {
                    return true;
                }
                break;
                
            case 'Escape':
                event.preventDefault();
                this.hideEmoteSuggestions();
                return true;
                
            default:
                // For other keys, let the input handle it normally and then update suggestions
                setTimeout(() => {
                    this.showEmotePreview(inputElement);
                }, 0);
                return false;
        }
        
        return false;
    }

    insertEmote(inputElement, emoteName) {
        const text = inputElement.value;
        const cursorPosition = inputElement.selectionStart;
        
        // Find the partial emote text to replace
        const beforeCursor = text.substring(0, cursorPosition);
        const matches = beforeCursor.match(/\b\w+$/);
        
        if (matches) {
            const startPos = cursorPosition - matches[0].length;
            const afterCursor = text.substring(cursorPosition);
            
            // Insert emote name with a space after it if there isn't one already
            const needsSpace = afterCursor.length === 0 || !afterCursor.startsWith(' ');
            const newText = text.substring(0, startPos) + emoteName + (needsSpace ? ' ' : '') + afterCursor;
            
            inputElement.value = newText;
            const newCursorPos = startPos + emoteName.length + (needsSpace ? 1 : 0);
            inputElement.setSelectionRange(newCursorPos, newCursorPos);
            
            // Trigger input event to update any listeners
            const inputEvent = new Event('input', { bubbles: true });
            inputElement.dispatchEvent(inputEvent);
        }
    }
}

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

    // Override setupEventListeners to add emote preview and keyboard navigation
    setupEventListeners() {
        super.setupEventListeners();
        
        // Enhanced message input with keyboard navigation
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            // Handle input changes for autocomplete
            messageInput.addEventListener('input', (e) => {
                window.uiComponents.showEmotePreview(messageInput);
            });
            
            // Handle keyboard navigation
            messageInput.addEventListener('keydown', (e) => {
                const handled = window.uiComponents.handleEmoteKeydown(e, messageInput);
                if (!handled && e.key === 'Enter' && !e.shiftKey) {
                    // Only send message if no emote suggestions are visible
                    const suggestions = document.getElementById('emote-suggestions');
                    if (!suggestions) {
                        // Let the normal enter handling proceed
                        return;
                    }
                }
            });
            
            // Hide suggestions when input loses focus (with delay for clicks)
            messageInput.addEventListener('blur', (e) => {
                setTimeout(() => {
                    // Only hide if focus didn't move to a suggestion
                    if (!document.getElementById('emote-suggestions')?.contains(document.activeElement)) {
                        window.uiComponents.hideEmoteSuggestions();
                    }
                }, 150);
            });
            
            // Re-show suggestions when input gains focus
            messageInput.addEventListener('focus', () => {
                if (messageInput.value.trim()) {
                    window.uiComponents.showEmotePreview(messageInput);
                }
            });
        }
        
        // Enhanced description input with keyboard navigation
        const setupDescriptionInput = () => {
            const descriptionInput = document.getElementById('descriptionInput');
            if (descriptionInput) {
                // Handle input changes for autocomplete
                descriptionInput.addEventListener('input', (e) => {
                    window.uiComponents.showEmotePreview(descriptionInput);
                });
                
                // Handle keyboard navigation
                descriptionInput.addEventListener('keydown', (e) => {
                    const handled = window.uiComponents.handleEmoteKeydown(e, descriptionInput);
                    if (!handled) {
                        // Let original description keydown handler run
                        if (e.ctrlKey && e.key === 'Enter') {
                            window.app.saveDescription();
                        } else if (e.key === 'Escape') {
                            window.app.cancelDescriptionEdit();
                        }
                    }
                });
                
                // Hide suggestions when input loses focus (with delay for clicks)
                descriptionInput.addEventListener('blur', (e) => {
                    setTimeout(() => {
                        if (!document.getElementById('emote-suggestions')?.contains(document.activeElement)) {
                            window.uiComponents.hideEmoteSuggestions();
                        }
                    }, 150);
                });
                
                // Re-show suggestions when input gains focus
                descriptionInput.addEventListener('focus', () => {
                    if (descriptionInput.value.trim()) {
                        window.uiComponents.showEmotePreview(descriptionInput);
                    }
                });
            }
        };
        
        // Set up description input initially
        setupDescriptionInput();
        
        // Re-setup when description edit mode is activated (since the input is dynamically shown/hidden)
        const originalEditDescription = window.app?.editDescription;
        if (originalEditDescription) {
            window.app.editDescription = function() {
                originalEditDescription.call(this);
                setTimeout(setupDescriptionInput, 100); // Setup after the input is shown
            };
        }
        
        // Global click handler to hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            const suggestions = document.getElementById('emote-suggestions');
            if (suggestions && !suggestions.contains(e.target) && 
                !['messageInput', 'descriptionInput'].includes(e.target.id)) {
                window.uiComponents.hideEmoteSuggestions();
            }
        });
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

// Replace the global uiComponents instance
window.uiComponents = new EmoteEnabledUIComponents();
window.emoteSystem = window.uiComponents.emoteSystem;

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