// components.js - UI components and notifications

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

    // Render participant card
    renderParticipantCard(participant) {
        return `<div class="bg-white p-2 rounded-lg shadow-sm text-center text-sm">${participant.name}</div>`;
    }

    // Render participants list
    renderParticipantsList(participants) {
        const participantArray = Object.entries(participants);
        
        if (participantArray.length === 0) {
            return '<p class="text-gray-500 text-center text-sm col-span-full">No participants yet</p>';
        }
        
        return participantArray
            .map(([id, participant]) => this.renderParticipantCard(participant))
            .join('');
    }

    // Render participant select options
    renderParticipantOptions(participants) {
        const options = Object.entries(participants)
            .map(([id, participant]) => `<option value="${id}">${participant.name}</option>`)
            .join('');
        
        return '<option value="">Choose participant...</option>' + options;
    }

    // Render proposal card
    renderProposalCard(proposalId, proposal, allParticipants, selectedParticipantId, meetingDuration) {
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
        
        return `
            <div class="bg-white p-4 rounded-lg shadow-sm border ${isPast ? 'opacity-75 border-gray-300' : isToday ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'}">
                <div class="mb-4">
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
                </div>
                
                ${this.renderResponseSummary(availableCount, maybeCount, unavailableCount)}
                
                ${selectedParticipantId ? 
                    this.renderParticipantResponseSection(proposalId, selectedParticipantName, selectedResponse) :
                    this.renderNoParticipantSelected()
                }
                ${this.renderDeleteButton(proposalId, proposerName)}
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
    renderParticipantResponseSection(proposalId, participantName, currentResponse) {
        return `
            <div class="mb-3 p-3 bg-gray-50 rounded border">
                <div class="text-sm text-gray-600">
                    <strong>${participantName}</strong>'s status: 
                    ${currentResponse ? `<span class="font-semibold px-2 py-1 rounded text-xs ${this.getResponseBadgeClass(currentResponse)}">${currentResponse}</span>` : '<span class="text-gray-400">No response yet</span>'}
                </div>
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

    // Render delete button for proposals
    renderDeleteButton(proposalId, proposerName) {
        return `
            <div class="mt-3 pt-3 border-t border-gray-200">
                <button onclick="window.app.deleteProposal('${proposalId}', '${proposerName}')" 
                        class="text-red-600 hover:text-red-800 text-xs font-medium transition-colors duration-200">
                    🗑️ Delete this proposal
                </button>
            </div>
        `;
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

    // Render message
    renderMessage(messageId, message, allParticipants) {
        const senderName = allParticipants[message.participantId]?.name || 'Unknown';
        const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleString() : '';
        return `
            <div class="bg-white p-3 rounded-lg shadow-sm">
                <div class="flex items-center justify-between mb-1">
                    <div class="font-semibold text-sm text-gray-600">${senderName}</div>
                    <div class="text-xs text-gray-400">${timestamp}</div>
                </div>
                <div class="text-gray-900">${this.escapeHtml(message.message)}</div>
            </div>
        `;
    }

    // Render messages list
    renderMessagesList(messages, allParticipants) {
        const messageArray = Object.entries(messages).sort((a, b) => (a[1].timestamp || 0) - (b[1].timestamp || 0));
        
        if (messageArray.length === 0) {
            return '<p class="text-gray-500 text-center text-sm">No messages yet</p>';
        }
        
        return messageArray
            .map(([id, message]) => this.renderMessage(id, message, allParticipants))
            .join('');
    }

    // Render proposals list
    renderProposalsList(proposals, allParticipants, selectedParticipantId, meetingDuration, deletedProposals = {}) {
        const proposalArray = Object.entries(proposals)
            .sort((a, b) => {
                const dateA = new Date(a[1].dateTime);
                const dateB = new Date(b[1].dateTime);
                return dateA - dateB;
            });
        
        const deletedArray = Object.entries(deletedProposals)
            .sort((a, b) => (b[1].deletedAt || 0) - (a[1].deletedAt || 0));
        
        let html = '';
        
        if (proposalArray.length === 0 && deletedArray.length === 0) {
            html = '<p class="text-gray-500 text-center col-span-full">No proposals yet</p>';
        } else {
            // Active proposals
            html += proposalArray
                .map(([proposalId, proposal]) => 
                    this.renderProposalCard(proposalId, proposal, allParticipants, selectedParticipantId, meetingDuration)
                )
                .join('');
            
            // Deleted proposals
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