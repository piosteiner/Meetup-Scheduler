// components.js - UI components and notifications (with enhanced features + FAVORITES + ICS DOWNLOAD)

class UIComponents {
    constructor() {
        this.notificationContainer = null;
        this.initNotificationContainer();
    }

    // Initialize notification container
    initNotificationContainer() {
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.id = 'notification-container';
        this.notificationContainer.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(this.notificationContainer);
    }

    // Show notification
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        const colors = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            warning: 'bg-yellow-500 text-white',
            info: 'bg-blue-500 text-white'
        };

        notification.className = `${colors[type]} px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full opacity-0`;
        notification.textContent = message;

        this.notificationContainer.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full', 'opacity-0');
        }, 10);

        // Auto remove
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);

        // Click to dismiss
        notification.addEventListener('click', () => {
            this.removeNotification(notification);
        });
    }

    // Remove notification
    removeNotification(notification) {
        notification.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    // Show loading state
    showLoading(element, text = 'Loading...') {
        const originalContent = element.innerHTML;
        element.innerHTML = `
            <div class="flex items-center justify-center space-x-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                <span>${text}</span>
            </div>
        `;
        return originalContent;
    }

    // Hide loading state
    hideLoading(element, originalContent) {
        element.innerHTML = originalContent;
    }

    // Update description display
    updateDescriptionDisplay(description) {
        const textElement = document.getElementById('descriptionText');
        if (textElement) {
            if (description && description.trim()) {
                textElement.textContent = description;
                textElement.classList.remove('italic', 'text-gray-600');
                textElement.classList.add('text-gray-900');
            } else {
                textElement.textContent = 'Click here to add a description for this meetup...';
                textElement.classList.add('italic', 'text-gray-600');
                textElement.classList.remove('text-gray-900');
            }
        }
    }

    // Render participant card with edit name functionality
    renderParticipantCard(participant, participantId, isSelected = false) {
        const selectedClass = isSelected ? 'bg-indigo-100 border-indigo-500 text-indigo-900' : 'bg-white hover:bg-gray-50 border-gray-200';
        const cursorClass = 'cursor-pointer';
        
        return `
            <div onclick="window.app.selectParticipantById('${participantId}')" 
                 class="participant-card ${selectedClass} ${cursorClass} p-3 rounded-lg shadow-sm text-center text-sm font-medium transition-all duration-200 border-2 group relative"
                 data-participant-id="${participantId}">
                <div class="participant-name" ondblclick="event.stopPropagation(); window.editParticipantName('${participantId}')" 
                     title="Double-click to edit name" class="hover:text-indigo-600 transition-colors">
                    ${participant.name}
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

    // Render participants list with clickable cards
    renderParticipantsList(participants, selectedParticipantId = null) {
        const participantArray = Object.entries(participants);
        
        if (participantArray.length === 0) {
            return '<p class="text-gray-500 text-center text-sm col-span-full">No participants yet</p>';
        }
        
        return participantArray
            .map(([id, participant]) => {
                const isSelected = selectedParticipantId === id;
                return this.renderParticipantCard(participant, id, isSelected);
            })
            .join('');
    }

    // Render participant select options
    renderParticipantOptions(participants) {
        const options = Object.entries(participants)
            .map(([id, participant]) => `<option value="${id}">${participant.name}</option>`)
            .join('');
        
        return '<option value="">Choose participant...</option>' + options;
    }

    // Calculate star count for a proposal
    calculateStarCount(proposalId, allFavorites) {
        let starCount = 0;
        Object.values(allFavorites).forEach(participantFavorites => {
            if (participantFavorites && participantFavorites[proposalId]) {
                starCount++;
            }
        });
        return starCount;
    }

    // Check if proposal is favorited by current participant
    isProposalFavorited(proposalId, currentFavorites) {
        return currentFavorites && currentFavorites[proposalId];
    }

    // UPDATED: Render proposal card with star/favorite functionality and ICS download
    renderProposalCard(proposalId, proposal, allParticipants, selectedParticipantId, meetingDuration, currentFavorites = {}, allFavorites = {}) {
        const startTime = new Date(proposal.dateTime);
        const endTime = new Date(startTime.getTime() + meetingDuration * 60 * 1000);
        
        const formattedDate = window.Utils.formatDate(startTime);
        const timeRange = window.Utils.formatDateRange(startTime, endTime);
        const proposerName = allParticipants[proposal.participantId]?.name || 'Unknown';
        
        const responses = proposal.responses || {};
        const availableCount = Object.values(responses).filter(r => r.response === 'available').length;
        const maybeCount = Object.values(responses).filter(r => r.response === 'maybe').length;
        const unavailableCount = Object.values(responses).filter(r => r.response === 'unavailable').length;
        
        const selectedResponse = selectedParticipantId && responses[selectedParticipantId] ? responses[selectedParticipantId].response : null;
        const selectedParticipantName = selectedParticipantId ? allParticipants[selectedParticipantId]?.name : 'No one';
        
        const now = new Date();
        const isToday = window.Utils.isToday(startTime);
        const isPast = window.Utils.isPast(startTime);
        
        // Calculate favorites data
        const starCount = this.calculateStarCount(proposalId, allFavorites);
        const isFavorited = this.isProposalFavorited(proposalId, currentFavorites);
        const hasParticipantSelected = !!selectedParticipantId;
        
        // Determine if this is a favorited proposal (for special styling)
        const isFavoritedProposal = isFavorited;
        const favoriteBorderClass = isFavoritedProposal ? 'border-yellow-400 bg-yellow-50' : '';
        const favoriteHeaderClass = isFavoritedProposal ? 'border-b border-yellow-200 pb-2 mb-3' : '';
        
        return `
            <div class="bg-white p-4 rounded-lg shadow-sm border ${isPast ? 'opacity-75 border-gray-300' : isToday ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'} ${favoriteBorderClass} group relative">
                <!-- Favorite indicator at top left -->
                ${isFavoritedProposal ? `
                    <div class="absolute top-2 left-2 text-yellow-500 text-lg z-10" title="You starred this proposal">
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
                
                <div class="mb-4 ${isFavoritedProposal ? 'pl-8' : 'pr-8'} ${favoriteHeaderClass}">
                    <div class="font-semibold text-gray-900 text-lg ${isToday ? 'text-indigo-900' : ''}">${formattedDate}</div>
                    <div class="font-medium text-lg ${isToday ? 'text-indigo-700' : 'text-indigo-600'}">
                        ${timeRange}
                    </div>
                    <div class="text-sm text-gray-500">
                        Duration: ${Math.floor(meetingDuration / 60)}h ${meetingDuration % 60}m
                    </div>
                    <div class="text-sm text-gray-600 mt-1">Proposed by ${proposerName}</div>
                    ${isPast ? '<div class="text-xs text-red-500 mt-1">⏰ Past</div>' : ''}
                    ${isToday ? '<div class="text-xs text-indigo-600 mt-1 font-semibold">📅 Today</div>' : ''}
                    
                    <!-- Star count, favorite button, and download section -->
                    <div class="flex items-center justify-between mt-2">
                        <div class="flex items-center gap-2">
                            ${starCount > 0 ? `
                                <div class="flex items-center gap-1 text-sm text-yellow-600">
                                    <span class="text-yellow-500">⭐</span>
                                    <span class="font-medium">${starCount}</span>
                                    <span class="text-gray-500">${starCount === 1 ? 'star' : 'stars'}</span>
                                </div>
                            ` : '<div class="text-xs text-gray-400">No stars yet</div>'}
                        </div>
                        
                        ${hasParticipantSelected ? `
                            <div class="flex items-center gap-1">
                                <!-- NEW: Download ICS button for starred proposals -->
                                ${isFavorited ? `
                                    <button onclick="window.downloadProposalICS('${proposalId}', '${this.escapeHtml(proposerName)}', '${proposal.dateTime}')" 
                                            class="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors duration-200 mr-1"
                                            title="Download calendar event (.ics file)">
                                        <span>📅</span>
                                        <span>Download</span>
                                    </button>
                                ` : ''}
                                
                                ${isFavorited ? `
                                    <button onclick="window.removeFromFavorites('${proposalId}', '${this.escapeHtml(proposerName)}', '${this.escapeHtml(formattedDate)} at ${this.escapeHtml(window.Utils.formatTime(startTime))}')" 
                                            class="flex items-center gap-1 px-2 py-1 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-colors duration-200"
                                            title="Remove from favorites">
                                        <span>⭐</span>
                                        <span>Remove Star</span>
                                    </button>
                                ` : `
                                    <button onclick="window.addToFavorites('${proposalId}', '${this.escapeHtml(proposerName)}', '${this.escapeHtml(formattedDate)} at ${this.escapeHtml(window.Utils.formatTime(startTime))}')" 
                                            class="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-yellow-100 border border-gray-300 hover:border-yellow-400 text-gray-700 hover:text-yellow-700 rounded-md transition-all duration-200"
                                            title="Add to favorites">
                                        <span>☆</span>
                                        <span>Add Star</span>
                                    </button>
                                `}
                            </div>
                        ` : ''}
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

    // Render response summary
    renderResponseSummary(availableCount, maybeCount, unavailableCount) {
        return `
            <div class="grid grid-cols-3 gap-2 mb-4 text-sm">
                <div class="text-center">
                    <span class="text-green-600 font-semibold">✓ ${availableCount}</span>
                    <div class="text-gray-500 text-xs">available</div>
                </div>
                <div class="text-center">
                    <span class="text-yellow-600 font-semibold">? ${maybeCount}</span>
                    <div class="text-gray-500 text-xs">maybe</div>
                </div>
                <div class="text-center">
                    <span class="text-red-600 font-semibold">✗ ${unavailableCount}</span>
                    <div class="text-gray-500 text-xs">unavailable</div>
                </div>
            </div>
        `;
    }

    // Render participant response section
    renderParticipantResponseSection(proposalId, participantName, currentResponse, proposalDateTime) {
        // Format the proposal date for the clear button
        const formattedProposalDate = window.Utils.formatDate(new Date(proposalDateTime)) + ' at ' + 
                                      window.Utils.formatTime(new Date(proposalDateTime));
        
        return `
            <div class="mb-3 p-3 bg-gray-50 rounded border">
                <div class="text-sm text-gray-600 mb-2">
                    <strong>${participantName}</strong>'s status: 
                    ${currentResponse ? `<span class="font-semibold px-2 py-1 rounded text-xs ${this.getResponseBadgeClass(currentResponse)}">${currentResponse}</span>` : '<span class="text-gray-400">No response yet</span>'}
                </div>
                ${currentResponse ? `
                    <button onclick="window.clearAvailabilityResponse('${proposalId}', '${this.escapeHtml(participantName)}', '${this.escapeHtml(formattedProposalDate)}')" 
                            class="text-gray-500 hover:text-red-600 text-xs transition-colors duration-200 underline">
                        Clear response
                    </button>
                ` : ''}
            </div>
            <div class="grid grid-cols-3 gap-2">
                ${this.renderResponseButton(proposalId, 'available', 'Available', currentResponse)}
                ${this.renderResponseButton(proposalId, 'maybe', 'Maybe', currentResponse)}
                ${this.renderResponseButton(proposalId, 'unavailable', 'Unavailable', currentResponse)}
            </div>
        `;
    }

    // Render response button
    renderResponseButton(proposalId, responseType, label, currentResponse) {
        const isSelected = currentResponse === responseType;
        const baseClasses = 'py-2 px-3 text-sm rounded transition-colors duration-200';
        const colorClasses = {
            available: isSelected ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200',
            maybe: isSelected ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
            unavailable: isSelected ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'
        };

        return `
            <button onclick="window.app.respondToProposal('${proposalId}', '${responseType}')" 
                    class="${baseClasses} ${colorClasses[responseType]}">
                ${label}
            </button>
        `;
    }

    // Render no participant selected message
    renderNoParticipantSelected() {
        return '<p class="text-gray-500 text-sm text-center py-3 bg-gray-50 rounded">Select a participant above to set their availability</p>';
    }

    // Get response badge class
    getResponseBadgeClass(response) {
        const classes = {
            available: 'bg-green-100 text-green-700',
            maybe: 'bg-yellow-100 text-yellow-700',
            unavailable: 'bg-red-100 text-red-700'
        };
        return classes[response] || 'bg-gray-100 text-gray-700';
    }

    // Render deleted proposal message
    renderDeletedProposalMessage(deletedProposal) {
        const deletedDate = new Date(deletedProposal.deletedAt).toLocaleString();
        const originalDate = window.Utils.formatDate(new Date(deletedProposal.originalDateTime));
        const originalTime = window.Utils.formatTime(new Date(deletedProposal.originalDateTime));
        
        return `
            <div class="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                <div class="text-red-800 font-medium">❌ Deleted Proposal</div>
                <div class="text-red-600">
                    ${originalDate} at ${originalTime} (proposed by ${deletedProposal.proposerName})
                </div>
                <div class="text-red-500 text-xs mt-1">Deleted on ${deletedDate}</div>
            </div>
        `;
    }

    // Render message with edit and delete functionality
    renderMessage(messageId, message, allParticipants, selectedParticipantId = null) {
        // More robust name lookup
        let senderName = 'Unknown';
        if (message.participantId && allParticipants[message.participantId]) {
            senderName = allParticipants[message.participantId].name;
        } else if (message.participantId) {
            // If we don't have the participant in our current list, show the ID with a note
            senderName = `User ${message.participantId.slice(-4)} (left?)`;
        }
        
        const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleString() : '';
        const escapedMessage = this.escapeHtml(message.message);
        
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
                <div class="text-gray-900 break-words">${escapedMessage}</div>
                ${editedInfo}
            </div>
        `;
    }

    // Render messages list with edit permissions
    renderMessagesList(messageArray, allParticipants, selectedParticipantId = null) {
        if (messageArray.length === 0) {
            return '<p class="text-gray-500 text-center text-sm">No messages yet</p>';
        }
        
        return messageArray
            .map(([id, message]) => this.renderMessage(id, message, allParticipants, selectedParticipantId))
            .join('');
    }

    // Render proposals list with favorites support and priority sorting
    renderProposalsList(proposals, allParticipants, selectedParticipantId, meetingDuration, deletedProposals = {}, currentFavorites = {}, allFavorites = {}) {
        const proposalArray = Object.entries(proposals);
        const deletedArray = Object.entries(deletedProposals)
            .sort((a, b) => (b[1].deletedAt || 0) - (a[1].deletedAt || 0));
        
        let html = '';
        
        if (proposalArray.length === 0 && deletedArray.length === 0) {
            html = '<p class="text-gray-500 text-center col-span-full">No proposals yet</p>';
        } else {
            // Sort proposals with favorites first, then by date
            const sortedProposals = proposalArray.sort((a, b) => {
                const [proposalIdA, proposalA] = a;
                const [proposalIdB, proposalB] = b;
                
                // Check if either proposal is favorited by current participant
                const isFavoritedA = this.isProposalFavorited(proposalIdA, currentFavorites);
                const isFavoritedB = this.isProposalFavorited(proposalIdB, currentFavorites);
                
                // Favorites always come first
                if (isFavoritedA && !isFavoritedB) return -1;
                if (!isFavoritedA && isFavoritedB) return 1;
                
                // Within same favorite status, sort by date (earliest first)
                const dateA = new Date(proposalA.dateTime);
                const dateB = new Date(proposalB.dateTime);
                return dateA - dateB;
            });
            
            // Render active proposals
            html += sortedProposals
                .map(([proposalId, proposal]) => 
                    this.renderProposalCard(proposalId, proposal, allParticipants, selectedParticipantId, meetingDuration, currentFavorites, allFavorites)
                )
                .join('');
            
            // Render deleted proposals
            html += deletedArray
                .map(([deletedId, deletedProposal]) => 
                    this.renderDeletedProposalMessage(deletedProposal)
                )
                .join('');
        }
        
        return html;
    }

    // Utility: Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Show/hide elements
    show(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove('hidden');
        }
    }

    hide(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('hidden');
        }
    }

    // Toggle element visibility
    toggle(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.toggle('hidden');
        }
    }

    // Update element text content
    updateText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    // Update element HTML content
    updateHTML(elementId, html) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = html;
        }
    }

    // Set element value
    setValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.value = value;
        }
    }

    // Get element value
    getValue(elementId) {
        const element = document.getElementById(elementId);
        return element ? element.value : '';
    }

    // Clear form
    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = false;
                } else {
                    input.value = '';
                }
            });
        }
    }

    // Auto-scroll element to bottom
    scrollToBottom(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollTop = element.scrollHeight;
        }
    }
}

// Create singleton instance
window.uiComponents = new UIComponents();