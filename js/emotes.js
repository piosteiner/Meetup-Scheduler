// emotes.js - 7TV Emote System

class EmoteSystem {
    constructor() {
        this.emotes = new Map();
        this.autocompleteContainer = null;
        this.isAutocompleteVisible = false;
        this.selectedEmoteIndex = -1;
        this.currentSearchTerm = '';
        this.currentInput = null;
        this.currentCursorPosition = 0;
        
        // Initialize with predefined emotes
        this.initializeEmotes();
        this.setupAutocomplete();
    }

    // Initialize predefined 7TV emotes
    initializeEmotes() {
        const predefinedEmotes = [
            {
                name: 'peepoHey',
                id: '01F6NMMEER00015NVG2J8ZH77N',
                url: 'https://cdn.7tv.app/emote/01F6NMMEER00015NVG2J8ZH77N/1x.webp'
            },
            {
                name: 'peepoClap',
                id: '60420e7b77137b000de9e678',
                url: 'https://cdn.7tv.app/emote/60420e7b77137b000de9e678/1x.webp'
            },
            {
                name: 'peepoHappy',
                id: '60a9d8e5c943e40014af0cab',
                url: 'https://cdn.7tv.app/emote/60a9d8e5c943e40014af0cab/1x.webp'
            },
            {
                name: 'peepoSad',
                id: '60a9db4c2f3f2c0014b8dcaf',
                url: 'https://cdn.7tv.app/emote/60a9db4c2f3f2c0014b8dcaf/1x.webp'
            },
            {
                name: 'peepoLeave',
                id: '60a9dc9c2f3f2c0014b8dcc2',
                url: 'https://cdn.7tv.app/emote/60a9dc9c2f3f2c0014b8dcc2/1x.webp'
            },
            {
                name: 'OMEGALUL',
                id: '60ba8b6708b2e0000fd38f28',
                url: 'https://cdn.7tv.app/emote/60ba8b6708b2e0000fd38f28/1x.webp'
            },
            {
                name: 'EZ',
                id: '60b8e2e1ddb5bd0014b4b4ac',
                url: 'https://cdn.7tv.app/emote/60b8e2e1ddb5bd0014b4b4ac/1x.webp'
            },
            {
                name: 'monkaS',
                id: '60bb0b37de6f51001419b8b8',
                url: 'https://cdn.7tv.app/emote/60bb0b37de6f51001419b8b8/1x.webp'
            },
            {
                name: 'Sadge',
                id: '60cdb0e6c443ac00147f8a83',
                url: 'https://cdn.7tv.app/emote/60cdb0e6c443ac00147f8a83/1x.webp'
            },
            {
                name: 'KEKW',
                id: '60b8e75ac943e40014af4e7b',
                url: 'https://cdn.7tv.app/emote/60b8e75ac943e40014af4e7b/1x.webp'
            },
            // Test with a simple emote that should definitely work
            {
                name: 'test',
                id: 'test',
                url: 'https://cdn.7tv.app/emote/60b8e75ac943e40014af4e7b/1x.webp'
            }
        ];

        predefinedEmotes.forEach(emote => {
            // Store by lowercase name for searching, but keep original name
            this.emotes.set(emote.name.toLowerCase(), emote);
        });

        console.log('✅ Emotes initialized:', this.emotes.size, 'emotes loaded');
        console.log('Available emotes:', Array.from(this.emotes.keys()));
    }

    // Setup autocomplete container
    setupAutocomplete() {
        this.autocompleteContainer = document.createElement('div');
        this.autocompleteContainer.id = 'emote-autocomplete';
        this.autocompleteContainer.className = `
            fixed bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50 hidden
            divide-y divide-gray-100
        `;
        document.body.appendChild(this.autocompleteContainer);
    }

    // Setup emote autocomplete for an input field
    setupEmoteInput(inputElement) {
        if (!inputElement) return;

        // Remove existing listeners to prevent duplicates
        const oldHandler = inputElement._emoteHandler;
        if (oldHandler) {
            inputElement.removeEventListener('input', oldHandler);
            inputElement.removeEventListener('keydown', oldHandler.keydownHandler);
            inputElement.removeEventListener('blur', oldHandler.blurHandler);
        }

        const inputHandler = (e) => this.handleInput(e, inputElement);
        const keydownHandler = (e) => this.handleKeydown(e, inputElement);
        const blurHandler = () => setTimeout(() => this.hideAutocomplete(), 150);

        inputElement.addEventListener('input', inputHandler);
        inputElement.addEventListener('keydown', keydownHandler);
        inputElement.addEventListener('blur', blurHandler);

        // Store handlers for cleanup
        inputHandler.keydownHandler = keydownHandler;
        inputHandler.blurHandler = blurHandler;
        inputElement._emoteHandler = inputHandler;

        console.log('✅ Emote input setup complete for element:', inputElement.id);
    }

    // Handle input events for emote detection
    handleInput(e, inputElement) {
        const value = inputElement.value;
        const cursorPos = inputElement.selectionStart;
        
        // Find if cursor is after a ':'
        const beforeCursor = value.substring(0, cursorPos);
        const colonMatch = beforeCursor.match(/:([a-zA-Z]*)$/);
        
        if (colonMatch) {
            this.currentSearchTerm = colonMatch[1].toLowerCase();
            this.currentInput = inputElement;
            this.currentCursorPosition = cursorPos;
            this.showAutocomplete(inputElement, colonMatch.index + 1);
        } else {
            this.hideAutocomplete();
        }
    }

    // Handle keydown events for navigation
    handleKeydown(e, inputElement) {
        if (!this.isAutocompleteVisible) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.navigateAutocomplete(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.navigateAutocomplete(-1);
                break;
            case 'Enter':
            case 'Tab':
                e.preventDefault();
                this.selectCurrentEmote();
                break;
            case 'Escape':
                e.preventDefault();
                this.hideAutocomplete();
                break;
        }
    }

    // Show autocomplete dropdown
    showAutocomplete(inputElement, colonPosition) {
        const matchingEmotes = this.searchEmotes(this.currentSearchTerm);
        
        if (matchingEmotes.length === 0) {
            this.hideAutocomplete();
            return;
        }

        // Position the autocomplete
        const rect = inputElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        this.autocompleteContainer.style.left = rect.left + 'px';
        this.autocompleteContainer.style.top = (rect.bottom + scrollTop + 5) + 'px';
        this.autocompleteContainer.style.minWidth = '200px';

        // Populate with matching emotes
        this.autocompleteContainer.innerHTML = matchingEmotes
            .slice(0, 8) // Limit to 8 results
            .map((emote, index) => `
                <div class="emote-suggestion flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-100 ${index === 0 ? 'bg-gray-50' : ''}" 
                     data-index="${index}" data-emote-name="${emote.name}">
                    <img src="${emote.url}" alt="${emote.name}" class="w-6 h-6 object-contain" loading="lazy">
                    <span class="text-sm font-medium">${emote.name}</span>
                </div>
            `).join('');

        // Add click handlers
        this.autocompleteContainer.querySelectorAll('.emote-suggestion').forEach(el => {
            el.addEventListener('click', () => {
                this.selectedEmoteIndex = parseInt(el.dataset.index);
                this.selectCurrentEmote();
            });
        });

        this.autocompleteContainer.classList.remove('hidden');
        this.isAutocompleteVisible = true;
        this.selectedEmoteIndex = 0;
    }

    // Hide autocomplete dropdown
    hideAutocomplete() {
        this.autocompleteContainer.classList.add('hidden');
        this.isAutocompleteVisible = false;
        this.selectedEmoteIndex = -1;
        this.currentSearchTerm = '';
        this.currentInput = null;
    }

    // Navigate through autocomplete suggestions
    navigateAutocomplete(direction) {
        const suggestions = this.autocompleteContainer.querySelectorAll('.emote-suggestion');
        if (suggestions.length === 0) return;

        // Remove current selection
        suggestions[this.selectedEmoteIndex]?.classList.remove('bg-gray-50');

        // Update index
        this.selectedEmoteIndex = Math.max(0, Math.min(suggestions.length - 1, this.selectedEmoteIndex + direction));

        // Add new selection
        suggestions[this.selectedEmoteIndex]?.classList.add('bg-gray-50');
        suggestions[this.selectedEmoteIndex]?.scrollIntoView({ block: 'nearest' });
    }

    // Select current emote and insert it
    selectCurrentEmote() {
        const suggestions = this.autocompleteContainer.querySelectorAll('.emote-suggestion');
        if (this.selectedEmoteIndex < 0 || this.selectedEmoteIndex >= suggestions.length) return;

        const selectedSuggestion = suggestions[this.selectedEmoteIndex];
        const emoteName = selectedSuggestion.dataset.emoteName;

        if (this.currentInput && emoteName) {
            this.insertEmote(this.currentInput, emoteName);
        }

        this.hideAutocomplete();
    }

    // Insert emote into input field
    insertEmote(inputElement, emoteName) {
        const value = inputElement.value;
        const cursorPos = this.currentCursorPosition;
        
        // Find the colon that started the search
        const beforeCursor = value.substring(0, cursorPos);
        const colonMatch = beforeCursor.match(/:([a-zA-Z]*)$/);
        
        if (colonMatch) {
            const colonPos = colonMatch.index;
            const beforeColon = value.substring(0, colonPos);
            const afterCursor = value.substring(cursorPos);
            
            const newValue = beforeColon + emoteName + ' ' + afterCursor;
            inputElement.value = newValue;
            
            // Set cursor position after the emote
            const newCursorPos = colonPos + emoteName.length + 1;
            inputElement.setSelectionRange(newCursorPos, newCursorPos);
            
            // Trigger input event to notify other listeners
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    // Search emotes by name
    searchEmotes(searchTerm) {
        if (!searchTerm) {
            return Array.from(this.emotes.values()).slice(0, 8);
        }

        const matches = [];
        for (const [name, emote] of this.emotes) {
            if (name.includes(searchTerm.toLowerCase())) {
                matches.push(emote);
            }
        }

        // Sort by relevance (exact matches first, then starts with, then contains)
        return matches.sort((a, b) => {
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();
            const search = searchTerm.toLowerCase();

            if (aName === search && bName !== search) return -1;
            if (bName === search && aName !== search) return 1;
            if (aName.startsWith(search) && !bName.startsWith(search)) return -1;
            if (bName.startsWith(search) && !aName.startsWith(search)) return 1;
            return aName.localeCompare(bName);
        });
    }

    // Parse text and replace emote names with HTML
    parseEmotes(text) {
        if (!text || typeof text !== 'string') return text || '';

        let parsedText = text;
        
        console.log('Parsing emotes in text:', text);
        
        // Replace emote names with img tags
        for (const [lowerName, emote] of this.emotes) {
            // Create regex for exact emote name (case insensitive)
            const regex = new RegExp(`\\b${this.escapeRegex(emote.name)}\\b`, 'gi');
            const replacement = `<img src="${emote.url}" alt="${emote.name}" class="inline-block w-6 h-6 object-contain mx-1 align-middle" title="${emote.name}" loading="lazy" onerror="this.style.display='none'">`;
            
            const matches = parsedText.match(regex);
            if (matches) {
                console.log(`Found emote ${emote.name} in text, replacing...`);
                parsedText = parsedText.replace(regex, replacement);
            }
        }

        console.log('Parsed text result:', parsedText);
        return parsedText;
    }

    // Escape regex special characters
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Add new emote to the system
    addEmote(name, id, url) {
        if (!name || !id || !url) {
            console.error('❌ Invalid emote data provided');
            return false;
        }

        const emote = {
            name: name,
            id: id,
            url: url || `https://cdn.7tv.app/emote/${id}/1x.webp`
        };

        this.emotes.set(name.toLowerCase(), emote);
        console.log('✅ Added emote:', name);
        return true;
    }

    // Remove emote from the system
    removeEmote(name) {
        const removed = this.emotes.delete(name.toLowerCase());
        if (removed) {
            console.log('✅ Removed emote:', name);
        }
        return removed;
    }

    // Get all emotes
    getAllEmotes() {
        return Array.from(this.emotes.values());
    }

    // Initialize emote system for the app
    initializeForApp() {
        // Setup emote input for message input field
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            this.setupEmoteInput(messageInput);
            console.log('✅ Emote system initialized for message input');
        }

        // Setup for any other text inputs that might be added later
        document.addEventListener('DOMContentLoaded', () => {
            const inputs = document.querySelectorAll('input[type="text"], textarea');
            inputs.forEach(input => {
                if (input.id === 'messageInput' || input.dataset.emotes === 'enabled') {
                    this.setupEmoteInput(input);
                }
            });
        });
    }

    // Cleanup function
    cleanup() {
        if (this.autocompleteContainer && this.autocompleteContainer.parentNode) {
            this.autocompleteContainer.parentNode.removeChild(this.autocompleteContainer);
        }
        
        // Remove event listeners from inputs
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            if (input._emoteHandler) {
                input.removeEventListener('input', input._emoteHandler);
                input.removeEventListener('keydown', input._emoteHandler.keydownHandler);
                input.removeEventListener('blur', input._emoteHandler.blurHandler);
                delete input._emoteHandler;
            }
        });
    }
}

// Create singleton instance
window.emoteSystem = new EmoteSystem();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.emoteSystem.initializeForApp();
    });
} else {
    window.emoteSystem.initializeForApp();
}

console.log('✅ Emote system loaded successfully');