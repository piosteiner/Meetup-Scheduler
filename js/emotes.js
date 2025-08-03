// js/emotes.js - Enhanced 7TV Emote System Compatible with New Features + GLOBAL FAVORITES + ICS DOWNLOAD - UPDATED

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
                id: '60ae8c4b259ac5a73e56ae91',
                name: 'peepoHey',
                url: 'https://cdn.7tv.app/emote/60ae8c4b259ac5a73e56ae91/2x.webp',
                fallbackUrl: 'https://cdn.7tv.app/emote/60ae8c4b259ac5a73e56ae91/2x.png',
                originalWidth: 28,
                originalHeight: 28,
                animated: false
            },
            'Kappa': {
                id: '60ae4c381981c439d5e9559f', 
                name: 'Kappa',
                url: 'https://cdn.7tv.app/emote/60ae4c381981c439d5e9559f/2x.webp',
                fallbackUrl: 'https://cdn.7tv.app/emote/60ae4c381981c439d5e9559f/2x.png',
                originalWidth: 25,
                originalHeight: 28,
                animated: false
            },
            'OMEGALUL': {
                id: '60ae958e229664e8667aea38',
                name: 'OMEGALUL',
                url: 'https://cdn.7tv.app/emote/60ae958e229664e8667aea38/2x.webp',
                fallbackUrl: 'https://cdn.7tv.app/emote/60ae958e229664e8667aea38/2x.png',
                originalWidth: 28,
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

// Enhanced UI Components with emote support and autocomplete + GLOBAL FAVORITES + ICS DOWNLOAD - UPDATED
class EmoteEnabledUIComponents extends UIComponents {
    constructor() {
        super();
        this.emoteSystem = new EmoteSystem();
        
        // Initialize autocomplete state
        this.currentSuggestions = [];
        this.selectedSuggestionIndex = -1;
        this.activeSuggestionsInput = null;
        this.suggestionClickHandler = null;
    }

    // Render message with emotes and edit/delete functionality
    renderMessage(messageId, message, allParticipants, selectedParticipantId = null) {
        let senderName = 'Unknown';
        if (message.participantId && allParticipants[message.participantId]) {
            senderName = allParticipants[message.participantId].name;
        } else if (message.participantId) {
            senderName = `User ${message.participantId.slice(-4)} (left?)`;
        }
        
        const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleString() : '';
        const processedMessage = this.emoteSystem.processText(message.message, 'message');
        
        // Check if this message was edited
        const editedInfo = message.editedAt ? `
            <div class="text-xs text-gray-400 mt-1 italic">
                Edited ${new Date(message.editedAt).toLocaleString()}
            </div>
        ` : '';
        
        // Check if the selected participant can edit this message
        const canEdit = selectedParticipantId && selectedParticipantId === message.participantId;
        
        return `
            <div class="bg-gray-50 p-3 rounded-lg border-l-4 border-indigo-500 group">
                <div class="flex items-center justify-between mb-1">
                    <div class="font-semibold text-sm text-indigo-600">${senderName}</div>
                    <div class="flex items-center gap-2">
                        <div class="text-xs text-gray-400">${timestamp}</div>
                        <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                            ${canEdit ? `
                                <button onclick="window.editMessage('${messageId}', '${this.escapeHtml(message.message)}')" 
                                        class="text-blue-500 hover:text-blue-700 text-xs transition-colors duration-200"
                                        title="Edit message">
                                    ✏️
                                </button>
                            ` : ''}
                            ${canEdit ? `
                                <button onclick="window.deleteMessage('${messageId}', '${this.escapeHtml(senderName)}', '${this.escapeHtml(message.message)}')" 
                                        class="text-red-500 hover:text-red-700 text-xs transition-colors duration-200"
                                        title="Delete message">
                                    🗑️
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="text-gray-900 break-words leading-relaxed">${processedMessage}</div>
                ${editedInfo}
            </div>
        `;
    }

    // Render participant card with emotes and edit functionality
    renderParticipantCard(participant, participantId, isSelected = false) {
        const selectedClass = isSelected ? 'bg-indigo-100 border-indigo-500 text-indigo-900' : 'bg-white hover:bg-gray-50 border-gray-200';
        const cursorClass = 'cursor-pointer';
        
        // Process name for emotes
        const processedName = this.emoteSystem.processText(participant.name, 'message');
        
        return `
            <div onclick="window.app.selectParticipantById('${participantId}')" 
                 class="participant-card ${selectedClass} ${cursorClass} p-3 rounded-lg shadow-sm text-center text-sm font-medium transition-all duration-200 border-2 group relative"
                 data-participant-id="${participantId}">
                <div class="participant-name" ondblclick="event.stopPropagation(); window.editParticipantName('${participantId}')" 
                     title="Double-click to edit name" class="hover:text-indigo-600 transition-colors">
                    ${processedName}
                </div>
                ${isSelected ? '<div class="text-xs text-indigo-600 mt-1">Selected</div>' : ''}
                <div class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="event.stopPropagation(); window.editParticipantName('${participantId}')" 
                            class="text-xs text-gray-400 hover:text-indigo-600 transition-colors"
                            title="Edit name">
                        ✏️
                    </button>
                </div>
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

    // Check if proposal is globally starred (simplified)
    isGloballyStarred(proposalId, globalFavorites) {
        return globalFavorites[proposalId] && globalFavorites[proposalId].starred === true;
    }

    // UPDATED: Render proposal card with simplified global star/favorite functionality, emotes, and ICS download
    renderProposalCard(proposalId, proposal, allParticipants, selectedParticipantId, meetingDuration, currentFavorites = {}, globalFavorites = {}) {
        const startTime = new Date(proposal.dateTime);
        const endTime = new Date(startTime.getTime() + meetingDuration * 60 * 1000);
        
        const formattedDate = window.Utils.formatDate(startTime);
        const timeRange = window.Utils.formatDateRange(startTime, endTime);
        const proposerName = allParticipants[proposal.participantId]?.name || 'Unknown';
        
        // Process proposer name for emotes
        const processedProposerName = this.emoteSystem.processText(proposerName, 'message');
        
        const responses = proposal.responses || {};
        const availableCount = Object.values(responses).filter(r => r.response === 'available').length;
        const maybeCount = Object.values(responses).filter(r => r.response === 'maybe').length;
        const unavailableCount = Object.values(responses).filter(r => r.response === 'unavailable').length;
        
        const selectedResponse = selectedParticipantId && responses[selectedParticipantId] ? responses[selectedParticipantId].response : null;
        const selectedParticipantName = selectedParticipantId ? allParticipants[selectedParticipantId]?.name : 'No one';
        
        const now = new Date();
        const isToday = window.Utils.isToday(startTime);
        const isPast = window.Utils.isPast(startTime);
        
        // Check if proposal is globally starred (simplified)
        const isGloballyStarred = this.isGloballyStarred(proposalId, globalFavorites);
        
        const hasParticipantSelected = !!selectedParticipantId;
        
        // Highlight if globally starred
        const favoriteBorderClass = isGloballyStarred ? 'border-yellow-400 bg-yellow-50' : '';
        const favoriteHeaderClass = isGloballyStarred ? 'border-b border-yellow-200 pb-2 mb-3' : '';
        
        return `
            <div class="bg-white p-4 rounded-lg shadow-sm border ${isPast ? 'opacity-75 border-gray-300' : isToday ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'} ${favoriteBorderClass} group relative">
                <!-- Star indicator shows for globally starred proposals -->
                ${isGloballyStarred ? `
                    <div class="absolute top-2 left-2 text-yellow-500 text-lg z-10" title="This proposal is starred">
                        ⭐
                    </div>
                ` : ''}
                
                <!-- Delete button in top right corner -->
                <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button onclick="window.app.deleteProposal('${proposalId}', '${this.escapeHtml(proposerName)}')" 
                            class="text-red-500 hover:text-red-700 p-1 rounded transition-colors duration-200"
                            title="Delete this proposal">
                        🗑️
                    </button>
                </div>
                
                <div class="mb-4 ${isGloballyStarred ? 'pl-8' : 'pr-8'} ${favoriteHeaderClass}">
                    <div class="font-semibold text-gray-900 text-lg ${isToday ? 'text-indigo-900' : ''}">${formattedDate}</div>
                    <div class="font-medium text-lg ${isToday ? 'text-indigo-700' : 'text-indigo-600'}">
                        ${timeRange}
                    </div>
                    <div class="text-sm text-gray-500">
                        Duration: ${Math.floor(meetingDuration / 60)}h ${meetingDuration % 60}m
                    </div>
                    <div class="text-sm text-gray-600 mt-1">Proposed by ${processedProposerName}</div>
                    ${isPast ? '<div class="text-xs text-red-500 mt-1">⏰ Past</div>' : ''}
                    ${isToday ? '<div class="text-xs text-indigo-600 mt-1 font-semibold">📅 Today</div>' : ''}
                    
                    <!-- Star and favorite actions section -->
                    <div class="flex items-center justify-end mt-2">
                        <div class="flex items-center gap-1">
                            <!-- Download ICS button for ALL starred proposals -->
                            ${isGloballyStarred ? `
                                <button onclick="window.downloadProposalICS('${proposalId}', '${this.escapeHtml(proposerName)}', '${proposal.dateTime}')" 
                                        class="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors duration-200 mr-1"
                                        title="Download calendar event (.ics file)">
                                    <span>📅</span>
                                    <span>Download</span>
                                </button>
                            ` : ''}
                            
                            ${hasParticipantSelected ? `
                                ${isGloballyStarred ? `
                                    <button onclick="window.removeFromFavorites('${proposalId}', '${this.escapeHtml(proposerName)}', '${this.escapeHtml(formattedDate)} at ${this.escapeHtml(window.Utils.formatTime(startTime))}')" 
                                            class="flex items-center gap-1 px-2 py-1 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-colors duration-200"
                                            title="Remove star from this proposal">
                                        <span>⭐</span>
                                        <span>Remove Star</span>
                                    </button>
                                ` : `
                                    <button onclick="window.addToFavorites('${proposalId}', '${this.escapeHtml(proposerName)}', '${this.escapeHtml(formattedDate)} at ${this.escapeHtml(window.Utils.formatTime(startTime))}')" 
                                            class="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-yellow-100 border border-gray-300 hover:border-yellow-400 text-gray-700 hover:text-yellow-700 rounded-md transition-all duration-200"
                                            title="Add star to this proposal">
                                        <span>☆</span>
                                        <span>Add Star</span>
                                    </button>
                                `}
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                ${this.renderResponseSummary(availableCount, maybeCount, unavailableCount)}
                
                ${selectedParticipantId ? 
                    this.renderParticipantResponseSection(proposalId, selectedParticipantName, selectedResponse, proposal.dateTime) :
                    this.renderNoParticipantSelected()
                }
            </div>
        `;
    }

    showEmotePreview(inputElement) {
        const text = inputElement.value;
        const cursorPosition = inputElement.selectionStart;
        
        const beforeCursor = text.substring(0, cursorPosition);
        const matches = beforeCursor.match(/:(\w*)$/);
        
        if (matches) {
            const partialEmote = matches[1];
            const availableEmotes = this.emoteSystem.getAvailableEmotes()
                .filter(emote => emote.name.toLowerCase().includes(partialEmote.toLowerCase()))
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
        suggestions.style.width = Math.min(350, window.innerWidth - rect.left - 20) + 'px';
        
        document.body.appendChild(suggestions);
        
        // Store click handler reference so we can remove it later
        this.suggestionClickHandler = (e) => {
            const suggestionEl = e.target.closest('.emote-suggestion');
            if (suggestionEl) {
                const emoteName = suggestionEl.dataset.emoteName;
                this.insertEmote(inputElement, emoteName);
                this.hideEmoteSuggestions();
            }
        };
        
        suggestions.addEventListener('click', this.suggestionClickHandler);
        
        // Update visual selection if any
        if (this.selectedSuggestionIndex >= 0) {
            this.updateSuggestionSelection();
        }
    }

    hideEmoteSuggestions() {
        const existing = document.getElementById('emote-suggestions');
        if (existing) {
            if (this.suggestionClickHandler) {
                existing.removeEventListener('click', this.suggestionClickHandler);
                this.suggestionClickHandler = null;
            }
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
        const afterCursor = text.substring(cursorPosition);
        const matches = beforeCursor.match(/:(\w*)$/);
        
        if (matches) {
            const startPos = cursorPosition - matches[0].length;
            const newText = text.substring(0, startPos) + emoteName + ' ' + afterCursor;
            
            inputElement.value = newText;
            const newCursorPos = startPos + emoteName.length + 1;
            inputElement.setSelectionRange(newCursorPos, newCursorPos);
            inputElement.focus();
            
            // Trigger input event to update any listeners
            const event = new Event('input', { bubbles: true });
            inputElement.dispatchEvent(event);
        }
    }

    navigateSuggestions(direction) {
        if (!this.currentSuggestions || this.currentSuggestions.length === 0) {
            return false;
        }
        
        const maxIndex = this.currentSuggestions.length - 1;
        const prevIndex = this.selectedSuggestionIndex;
        
        switch (direction) {
            case 'down':
                this.selectedSuggestionIndex = this.selectedSuggestionIndex < maxIndex 
                    ? this.selectedSuggestionIndex + 1 
                    : 0;
                break;
            case 'up':
                this.selectedSuggestionIndex = this.selectedSuggestionIndex > 0 
                    ? this.selectedSuggestionIndex - 1 
                    : maxIndex;
                break;
            case 'tab':
                this.selectedSuggestionIndex = this.selectedSuggestionIndex < maxIndex 
                    ? this.selectedSuggestionIndex + 1 
                    : 0;
                break;
        }
        
        console.log(`Navigation: ${direction}, from ${prevIndex} to ${this.selectedSuggestionIndex}`);
        this.updateSuggestionSelection();
        return true;
    }

    updateSuggestionSelection() {
        const suggestions = document.querySelectorAll('.emote-suggestion');
        suggestions.forEach((item, index) => {
            if (index === this.selectedSuggestionIndex) {
                item.classList.add('bg-indigo-600', 'text-white');
                item.classList.remove('hover:bg-gray-100');
                item.querySelector('span').classList.add('text-white');
                item.querySelector('.text-gray-500').classList.add('text-indigo-200');
                item.querySelector('.text-gray-500').classList.remove('text-gray-500');
                
                // Scroll into view if needed
                item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            } else {
                item.classList.remove('bg-indigo-600', 'text-white');
                item.classList.add('hover:bg-gray-100');
                item.querySelector('span').classList.remove('text-white');
                const grayText = item.querySelector('.text-indigo-200');
                if (grayText) {
                    grayText.classList.add('text-gray-500');
                    grayText.classList.remove('text-indigo-200');
                }
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

    handleEmoteKeydown(e, inputElement) {
        // Check if suggestions are open
        const suggestionsOpen = this.currentSuggestions && this.currentSuggestions.length > 0 && 
                               document.getElementById('emote-suggestions');
        
        if (!suggestionsOpen) {
            return false; // Let normal key handling continue
        }
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                e.stopPropagation();
                this.navigateSuggestions('down');
                return true;
                
            case 'ArrowUp':
                e.preventDefault();
                e.stopPropagation();
                this.navigateSuggestions('up');
                return true;
                
            case 'Tab':
                e.preventDefault();
                e.stopPropagation();
                this.navigateSuggestions('tab');
                return true;
                
            case 'Enter':
                if (this.selectedSuggestionIndex >= 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.insertSelectedEmote();
                    return true;
                }
                break;
                
            case 'Escape':
                e.preventDefault();
                e.stopPropagation();
                this.hideEmoteSuggestions();
                return true;
        }
        
        return false;
    }
}

// Enhanced MeetupApp with emote-aware title processing and global favorites features - UPDATED
class EmoteEnabledMeetupApp extends MeetupApp {
    setupEventListeners() {
        super.setupEventListeners();
        
        // Message input with improved event handling
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('input', () => {
                window.uiComponents.showEmotePreview(messageInput);
            });
            
            messageInput.addEventListener('blur', () => {
                // Delay to allow click events on suggestions
                setTimeout(() => {
                    // Only hide if not clicking on suggestions
                    if (!document.querySelector('#emote-suggestions:hover')) {
                        window.uiComponents.hideEmoteSuggestions();
                    }
                }, 200);
            });
            
            // Use keydown for better control
            messageInput.addEventListener('keydown', (e) => {
                const handled = window.uiComponents.handleEmoteKeydown(e, messageInput);
                
                // If emote system didn't handle it and it's Enter, send message
                if (!handled && e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
        
        // Description input handling with event delegation
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
                            setTimeout(() => {
                                if (!document.querySelector('#emote-suggestions:hover')) {
                                    window.uiComponents.hideEmoteSuggestions();
                                }
                            }, 200);
                        });
                        
                        descriptionInput.addEventListener('keydown', (e) => {
                            const handled = window.uiComponents.handleEmoteKeydown(e, descriptionInput);
                            
                            // Let Ctrl+Enter through for saving
                            if (!handled && e.ctrlKey && e.key === 'Enter') {
                                // This will be handled by the existing handler
                                return;
                            }
                        });
                    }
                }, 100);
            }
        });
    }

    // Set up Firebase listeners for real-time updates with emote support and global favorites
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
            
            // Re-render messages when participants change (for updated names and edit permissions)
            if (Object.keys(this.currentMessages).length > 0) {
                this.refreshMessagesDisplay();
            }
        });
        this.listeners.set('participants', participantsListener);

        const messagesListener = window.firebaseAPI.onMessagesChange(this.currentMeetupKey, (messages) => {
            this.currentMessages = messages;
            
            const newMessagesList = window.uiComponents.renderMessagesList(
                Object.entries(messages).sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0)),
                this.allParticipants,
                this.selectedParticipantId // Pass selected participant for edit permissions
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

        // Global favorites listener - ALWAYS active
        const globalFavoritesListener = window.firebaseAPI.onGlobalFavoritesChange(this.currentMeetupKey, (globalFavorites) => {
            console.log('🌟 Global favorites updated:', globalFavorites);
            this.globalFavorites = globalFavorites;
            
            // Always refresh proposals display to show stars
            console.log('🌟 Refreshing proposals with global favorites data');
            this.updateProposalsUI(this.currentProposals || {});
        });
        this.listeners.set('globalFavorites', globalFavoritesListener);

        const deletedProposalsListener = window.firebaseAPI.database.ref('meetups/' + this.currentMeetupKey + '/deletedProposals').on('value', (snapshot) => {
            const deletedProposals = snapshot.val() || {};
            console.log('🗑️ Deleted proposals updated:', Object.keys(deletedProposals).length, 'deleted');
            // Always update proposals with deleted ones visible
            this.updateProposalsUI(this.currentProposals || {}, deletedProposals);
        });
        this.listeners.set('deletedProposals', deletedProposalsListener);
    }
}

// Initialize everything
window.uiComponents = new EmoteEnabledUIComponents();
window.emoteSystem = window.uiComponents.emoteSystem;

// Test/Debug functions
window.testEmoteNavigation = () => {
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.focus();
        messageInput.value = ':peepo';
        messageInput.setSelectionRange(6, 6);
        
        const event = new Event('input', { bubbles: true });
        messageInput.dispatchEvent(event);
        
        console.log('Test: Autocomplete triggered');
        
        setTimeout(() => {
            const suggestions = document.getElementById('emote-suggestions');
            console.log('Suggestions visible:', !!suggestions);
            console.log('Current suggestions:', window.uiComponents.currentSuggestions.length);
            console.log('Selected index:', window.uiComponents.selectedSuggestionIndex);
            
            if (suggestions) {
                console.log('Try pressing arrow keys now!');
            }
        }, 100);
    }
};

window.refreshEmotes = () => window.emoteSystem.refreshEmotes();

// IMPROVED: App initialization that ensures the enhanced version is used
document.addEventListener('DOMContentLoaded', async () => {
    // Clear any existing basic app instance
    if (window.app && window.app.constructor.name === 'MeetupApp') {
        console.log('🔄 Replacing basic MeetupApp with enhanced EmoteEnabledMeetupApp');
        window.app = null;
    }
    
    // Always use the enhanced version
    if (!window.app || window.app.constructor.name !== 'EmoteEnabledMeetupApp') {
        console.log('🚀 Initializing EmoteEnabledMeetupApp with message editing features');
        window.app = new EmoteEnabledMeetupApp();
        await window.app.init();
    }
});

console.log('✅ Enhanced emote system with global favorites, ICS download, and message editing support loaded - UPDATED');