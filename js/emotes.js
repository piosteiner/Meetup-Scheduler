// js/emotes.js - Fixed 7TV Emote System with Working Aspect Ratio and Autocomplete

class EmoteSystem {
    constructor() {
        this.emotes = new Map(); // Store emote name -> data mapping
        this.emoteRegex = null; // Compiled regex for matching emote names
        this.isLoading = false;
        this.loadPromise = null;
        
        // 7TV Global Emote Set ID (popular emotes available to everyone)
        this.globalEmoteSetId = '01EX2NCGX0000171FB842R1TPP'; // Try a different popular set
        
        // Alternative emote set IDs to try if the first fails
        this.fallbackEmoteSetIds = [
            '01K1BPC2WFZB8QA3T04MPBTSS9', // Original ID
            '01F7B8YG000004DHQX8H81YQXF', // Another popular set
            'global' // 7TV global emotes
        ];
        
        // Cache configuration
        this.cacheKey = 'piogino_emotes_cache';
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
        
        // Aspect ratio configuration
        this.maxHeight = 28; // Maximum height for emotes in messages
        this.minHeight = 16; // Minimum height for very small emotes
        
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

    // Calculate display dimensions preserving aspect ratio
    calculateDisplayDimensions(originalWidth, originalHeight, context = 'message') {
        // Different max heights for different contexts
        const maxHeights = {
            message: 28,
            title: 32,
            description: 24,
            suggestion: 24
        };
        
        const maxHeight = maxHeights[context] || this.maxHeight;
        
        // If no dimensions provided, use defaults
        if (!originalWidth || !originalHeight || originalWidth <= 0 || originalHeight <= 0) {
            return { width: maxHeight, height: maxHeight };
        }
        
        // Calculate aspect ratio
        const aspectRatio = originalWidth / originalHeight;
        
        // Scale based on height constraint
        let displayHeight = Math.min(maxHeight, Math.max(originalHeight, this.minHeight));
        let displayWidth = Math.round(displayHeight * aspectRatio);
        
        // Ensure minimum height for readability
        if (displayHeight < this.minHeight) {
            displayHeight = this.minHeight;
            displayWidth = Math.round(displayHeight * aspectRatio);
        }
        
        // Prevent extremely wide emotes
        const maxWidth = maxHeight * 2.5; // Allow up to 2.5x aspect ratio
        if (displayWidth > maxWidth) {
            displayWidth = maxWidth;
            displayHeight = Math.round(displayWidth / aspectRatio);
        }
        
        return {
            width: Math.max(1, displayWidth),
            height: Math.max(1, displayHeight)
        };
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
            
            // Try the main emote set first, then fallbacks
            let data = null;
            const setsToTry = [this.globalEmoteSetId, ...this.fallbackEmoteSetIds];
            
            for (const setId of setsToTry) {
                try {
                    console.log(`Trying emote set: ${setId}`);
                    const url = setId === 'global' 
                        ? 'https://7tv.io/v3/emote-sets/global'
                        : `https://7tv.io/v3/emote-sets/${setId}`;
                    
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                        }
                    });
                    
                    if (response.ok) {
                        data = await response.json();
                        console.log(`✅ Successfully fetched from ${setId}`);
                        break;
                    }
                } catch (error) {
                    console.warn(`Failed to fetch from ${setId}:`, error);
                    continue;
                }
            }
            
            if (!data) {
                throw new Error('All emote set URLs failed');
            }
            
            // Log the raw API response structure for debugging
            console.log('📋 Raw 7TV API response structure:', {
                hasEmotes: !!data.emotes,
                emotesLength: data.emotes?.length || 0,
                firstEmoteStructure: data.emotes?.[0] ? Object.keys(data.emotes[0]) : 'No emotes',
                sampleEmote: data.emotes?.[0]
            });
            
            if (!data.emotes || !Array.isArray(data.emotes)) {
                throw new Error('Invalid response format from 7TV API - no emotes array found');
            }
            
            // Process emotes into our format
            const emotesData = {};
            data.emotes.forEach((emoteData, index) => {
                if (!emoteData.name || !emoteData.id) return;
                
                // Get original dimensions from the data - try multiple paths
                let originalWidth = 28;
                let originalHeight = 28;
                
                // Log the first few emotes' full structure for debugging
                if (index < 3) {
                    console.log(`🔍 Emote ${index} (${emoteData.name}) structure:`, emoteData);
                }
                
                // Try different paths in the 7TV API response
                if (emoteData.data?.host?.width && emoteData.data?.host?.height) {
                    originalWidth = emoteData.data.host.width;
                    originalHeight = emoteData.data.host.height;
                } else if (emoteData.data?.host?.files) {
                    // Try to get dimensions from files array
                    const files = emoteData.data.host.files;
                    const largestFile = files.find(f => f.name === '4x.webp') || files.find(f => f.name === '2x.webp') || files[files.length - 1];
                    if (largestFile && largestFile.width && largestFile.height) {
                        originalWidth = largestFile.width;
                        originalHeight = largestFile.height;
                    }
                } else if (emoteData.width && emoteData.height) {
                    originalWidth = emoteData.width;
                    originalHeight = emoteData.height;
                } else if (emoteData.data?.width && emoteData.data?.height) {
                    originalWidth = emoteData.data.width;
                    originalHeight = emoteData.data.height;
                }
                
                console.log(`📏 Emote ${emoteData.name}: ${originalWidth}×${originalHeight}`);
                
                emotesData[emoteData.name] = {
                    id: emoteData.id,
                    name: emoteData.name,
                    // Use 2x size for better quality
                    url: `https://cdn.7tv.app/emote/${emoteData.id}/2x.webp`,
                    // Fallback to PNG if WebP fails
                    fallbackUrl: `https://cdn.7tv.app/emote/${emoteData.id}/2x.png`,
                    // Store original dimensions
                    originalWidth: originalWidth,
                    originalHeight: originalHeight,
                    animated: emoteData.data?.animated || false
                };
            });
            
            this.loadEmotes(emotesData);
            this.saveToCache(emotesData);
            
            console.log('✅ Successfully loaded', Object.keys(emotesData).length, 'emotes from 7TV');
            
            // Debug: Log some example dimensions
            const exampleEmotes = Object.entries(emotesData).slice(0, 5);
            console.log('📊 Example emote dimensions:', exampleEmotes.map(([name, data]) => 
                `${name}: ${data.originalWidth}×${data.originalHeight}`
            ));
            
            // Test aspect ratio calculations
            this.testAspectRatios();
            
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
                originalWidth: 28,
                originalHeight: 28,
                animated: false
            },
            'Kappa': {
                id: '60ae958e229664e0042a3e6a',
                name: 'Kappa',
                url: 'https://cdn.7tv.app/emote/60ae958e229664e0042a3e6a/2x.webp',
                fallbackUrl: 'https://cdn.7tv.app/emote/60ae958e229664e0042a3e6a/2x.png',
                originalWidth: 25,
                originalHeight: 28,
                animated: false
            },
            'OMEGALUL': {
                id: '60ae43bf259b0f00060b4b54',
                name: 'OMEGALUL',
                url: 'https://cdn.7tv.app/emote/60ae43bf259b0f00060b4b54/2x.webp',
                fallbackUrl: 'https://cdn.7tv.app/emote/60ae43bf259b0f00060b4b54/2x.png',
                originalWidth: 32,
                originalHeight: 28,
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
    processText(text, context = 'message') {
        if (!text || !this.emoteRegex || this.emotes.size === 0) {
            return this.escapeHtml(text || '');
        }
        
        // First escape HTML to prevent XSS
        const escapedText = this.escapeHtml(text);
        
        // Replace emote names with img tags
        return escapedText.replace(this.emoteRegex, (match) => {
            const emote = this.emotes.get(match);
            if (!emote) return match;
            
            return this.createEmoteHtml(emote, context);
        });
    }

    // Create HTML for an emote with proper aspect ratio
    createEmoteHtml(emote, context = 'message') {
        const dimensions = this.calculateDisplayDimensions(
            emote.originalWidth, 
            emote.originalHeight, 
            context
        );
        
        // Add CSS class based on context for additional styling
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
            fallbackUrl: data.fallbackUrl,
            id: data.id,
            originalWidth: data.originalWidth,
            originalHeight: data.originalHeight
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

    // Debug method to check emote dimensions
    debugEmoteDimensions(emoteName = null) {
        if (emoteName) {
            const emote = this.getEmote(emoteName);
            if (emote) {
                console.log(`🔍 Debug ${emoteName}:`);
                console.log(`  Original: ${emote.originalWidth}×${emote.originalHeight}`);
                console.log(`  Message: ${this.calculateDisplayDimensions(emote.originalWidth, emote.originalHeight, 'message').width}×${this.calculateDisplayDimensions(emote.originalWidth, emote.originalHeight, 'message').height}`);
                console.log(`  Title: ${this.calculateDisplayDimensions(emote.originalWidth, emote.originalHeight, 'title').width}×${this.calculateDisplayDimensions(emote.originalWidth, emote.originalHeight, 'title').height}`);
                console.log(`  Description: ${this.calculateDisplayDimensions(emote.originalWidth, emote.originalHeight, 'description').width}×${this.calculateDisplayDimensions(emote.originalWidth, emote.originalHeight, 'description').height}`);
            } else {
                console.log(`❌ Emote '${emoteName}' not found`);
            }
        } else {
            console.log('📊 All loaded emotes:');
            this.emotes.forEach((emote, name) => {
                const messageDims = this.calculateDisplayDimensions(emote.originalWidth, emote.originalHeight, 'message');
                console.log(`  ${name}: ${emote.originalWidth}×${emote.originalHeight} → ${messageDims.width}×${messageDims.height} (message)`);
            });
        }
    }

    // Test method to verify aspect ratio preservation
    testAspectRatios() {
        console.log('🧪 Testing aspect ratio preservation:');
        const testCases = [
            { width: 56, height: 28, name: 'Wide emote' },
            { width: 20, height: 40, name: 'Tall emote' },
            { width: 32, height: 32, name: 'Square emote' },
            { width: 44, height: 28, name: 'Medium wide' }
        ];
        
        testCases.forEach(test => {
            const result = this.calculateDisplayDimensions(test.width, test.height, 'message');
            const originalRatio = test.width / test.height;
            const displayRatio = result.width / result.height;
            const ratioPreserved = Math.abs(originalRatio - displayRatio) < 0.01;
            
            console.log(`  ${test.name} (${test.width}×${test.height}): ${result.width}×${result.height} - Ratio preserved: ${ratioPreserved ? '✅' : '❌'}`);
        });
    }
}

// Enhanced UI Components with emote support and FIXED autocomplete
class EmoteEnabledUIComponents extends UIComponents {
    constructor() {
        super();
        // Initialize emote system
        this.emoteSystem = new EmoteSystem();
    }

    // Override message rendering to include emotes with proper context
    renderMessage(messageId, message, allParticipants) {
        // More robust name lookup
        let senderName = 'Unknown';
        if (message.participantId && allParticipants[message.participantId]) {
            senderName = allParticipants[message.participantId].name;
        } else if (message.participantId) {
            senderName = `User ${message.participantId.slice(-4)} (left?)`;
        }
        
        const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleString() : '';
        
        // Process message text with emotes (using 'message' context)
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

    // Override description display to include emotes with proper context
    updateDescriptionDisplay(description) {
        const textElement = document.getElementById('descriptionText');
        if (textElement) {
            if (description && description.trim()) {
                // Process description with emotes (using 'description' context)
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

    // FIXED: Enhanced emote preview functionality
    showEmotePreview(inputElement) {
        const text = inputElement.value;
        const cursorPosition = inputElement.selectionStart;
        
        // Find emote names in the text around cursor position
        const beforeCursor = text.substring(0, cursorPosition);
        const matches = beforeCursor.match(/\b\w+$/);
        
        if (matches && matches[0].length >= 2) { // At least 2 characters to show suggestions
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

    // FIXED: Display emote suggestions with proper aspect ratios
    displayEmoteSuggestions(emotes, inputElement) {
        // Remove existing suggestions
        this.hideEmoteSuggestions();
        
        const suggestions = document.createElement('div');
        suggestions.id = 'emote-suggestions';
        suggestions.className = 'absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-2 mt-1 max-w-sm';
        
        suggestions.innerHTML = emotes.map(emote => {
            const dims = this.emoteSystem.calculateDisplayDimensions(
                emote.originalWidth, 
                emote.originalHeight, 
                'suggestion'
            );
            return `
                <div class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded cursor-pointer emote-suggestion" 
                     data-emote-name="${emote.name}">
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

// Enhanced MeetupApp with emote-aware title processing and FIXED event listeners
class EmoteEnabledMeetupApp extends MeetupApp {
    // FIXED: Setup event listeners with emote preview
    setupEventListeners() {
        // Call parent setup first
        super.setupEventListeners();
        
        // Add emote preview to message input
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('input', () => {
                window.uiComponents.showEmotePreview(messageInput);
            });
            
            messageInput.addEventListener('blur', () => {
                // Delay hiding to allow clicking on suggestions
                setTimeout(() => window.uiComponents.hideEmoteSuggestions(), 200);
            });
            
            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    window.uiComponents.hideEmoteSuggestions();
                }
            });
        }
        
        // Add emote preview to description input (when it becomes visible)
        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'descriptionInput') {
                setTimeout(() => {
                    const descriptionInput = document.getElementById('descriptionInput');
                    if (descriptionInput) {
                        descriptionInput.addEventListener('input', () => {
                            window.uiComponents.showEmotePreview(descriptionInput);
                        });
                        
                        descriptionInput.addEventListener('blur', () => {
                            setTimeout(() => window.uiComponents.hideEmoteSuggestions(), 200);
                        });
                        
                        descriptionInput.addEventListener('keydown', (e) => {
                            if (e.key === 'Escape') {
                                window.uiComponents.hideEmoteSuggestions();
                            }
                        });
                    }
                }, 100);
            }
        });
    }

    // Override setupMeetupListeners to handle emote-processed titles with proper context
    setupMeetupListeners() {
        // Clean up existing listeners first
        this.cleanupListeners();

        // Real-time title listener with emote processing
        const titleListener = window.firebaseAPI.database.ref('meetups/' + this.currentMeetupKey + '/name').on('value', (snapshot) => {
            const title = snapshot.val();
            const titleElement = document.getElementById('meetupTitle');
            if (titleElement) {
                if (title) {
                    // Process title with emotes (using 'title' context for larger emotes)
                    const processedTitle = window.uiComponents.emoteSystem.processText(title, 'title');
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

// Add global debug methods
window.debugEmotes = (emoteName) => window.emoteSystem.debugEmoteDimensions(emoteName);
window.testEmoteRatios = () => window.emoteSystem.testAspectRatios();
window.refreshEmotes = () => window.emoteSystem.refreshEmotes();

// Replace the global app class when DOM loads
document.addEventListener('DOMContentLoaded', async () => {
    // Don't initialize if already initialized
    if (window.app && window.app.constructor.name === 'EmoteEnabledMeetupApp') {
        return;
    }
    
    window.app = new EmoteEnabledMeetupApp();
    await window.app.init();
});

console.log('✅ FIXED emote system with working aspect ratio and autocomplete loaded successfully');