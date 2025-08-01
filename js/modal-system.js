// js/modal-system.js - Custom Modal Dialog System

class CustomModalSystem {
    constructor() {
        this.activeModal = null;
        this.modalContainer = null;
        this.createModalContainer();
        this.setupStyles();
    }

    createModalContainer() {
        this.modalContainer = document.createElement('div');
        this.modalContainer.id = 'custom-modal-container';
        this.modalContainer.className = 'fixed inset-0 z-[9999] hidden';
        document.body.appendChild(this.modalContainer);
    }

    setupStyles() {
        // Add custom styles for modals
        const style = document.createElement('style');
        style.textContent = `
            .modal-backdrop {
                background: rgba(0, 0, 0, 0.75);
                backdrop-filter: blur(4px);
            }
            
            .modal-content {
                background: white;
                border-radius: 12px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                max-width: 90vw;
                max-height: 90vh;
                overflow-y: auto;
            }
            
            .modal-enter {
                opacity: 0;
                transform: scale(0.95) translateY(-10px);
            }
            
            .modal-enter-active {
                opacity: 1;
                transform: scale(1) translateY(0);
                transition: all 0.2s ease-out;
            }
            
            .modal-exit {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
            
            .modal-exit-active {
                opacity: 0;
                transform: scale(0.95) translateY(-10px);
                transition: all 0.15s ease-in;
            }
            
            @media (prefers-color-scheme: dark) {
                .modal-content {
                    background: #1f2937;
                    color: #f9fafb;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Custom confirm dialog
    async confirm(message, title = 'Confirm Action', options = {}) {
        return new Promise((resolve) => {
            const modal = this.createConfirmModal(message, title, options, resolve);
            this.showModal(modal);
        });
    }

    // Custom prompt dialog
    async prompt(message, title = 'Enter Value', defaultValue = '', options = {}) {
        return new Promise((resolve) => {
            const modal = this.createPromptModal(message, title, defaultValue, options, resolve);
            this.showModal(modal);
        });
    }

    // Custom alert dialog
    async alert(message, title = 'Notice', options = {}) {
        return new Promise((resolve) => {
            const modal = this.createAlertModal(message, title, options, resolve);
            this.showModal(modal);
        });
    }

    createConfirmModal(message, title, options, resolve) {
        const {
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            confirmClass = 'bg-red-600 hover:bg-red-700 text-white',
            cancelClass = 'bg-gray-600 hover:bg-gray-700 text-white',
            icon = '⚠️',
            dangerMode = false
        } = options;

        return `
            <div class="modal-backdrop fixed inset-0 flex items-center justify-center p-4" 
                 onclick="if(event.target === this) window.customModal.closeModal(false)">
                <div class="modal-content modal-enter p-6 w-full max-w-md" onclick="event.stopPropagation()">
                    <div class="flex items-start gap-4">
                        <div class="text-2xl">${icon}</div>
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">${title}</h3>
                            <p class="text-gray-600 mb-6 leading-relaxed">${message}</p>
                            
                            ${dangerMode ? `
                                <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                    <p class="text-red-800 text-sm font-medium">⚠️ This action cannot be undone</p>
                                </div>
                            ` : ''}
                            
                            <div class="flex gap-3 justify-end">
                                <button onclick="window.customModal.closeModal(false)" 
                                        class="${cancelClass} px-4 py-2 rounded-lg font-medium transition-colors duration-200">
                                    ${cancelText}
                                </button>
                                <button onclick="window.customModal.closeModal(true)" 
                                        class="${confirmClass} px-4 py-2 rounded-lg font-medium transition-colors duration-200">
                                    ${confirmText}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createPromptModal(message, title, defaultValue, options, resolve) {
        const {
            confirmText = 'OK',
            cancelText = 'Cancel',
            placeholder = '',
            inputType = 'text',
            maxLength = null,
            validation = null
        } = options;

        const inputId = 'modal-input-' + Date.now();

        return `
            <div class="modal-backdrop fixed inset-0 flex items-center justify-center p-4" 
                 onclick="if(event.target === this) window.customModal.closeModal(null)">
                <div class="modal-content modal-enter p-6 w-full max-w-md" onclick="event.stopPropagation()">
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">${title}</h3>
                    <p class="text-gray-600 mb-4">${message}</p>
                    
                    <input type="${inputType}" 
                           id="${inputId}"
                           value="${defaultValue}" 
                           placeholder="${placeholder}"
                           ${maxLength ? `maxlength="${maxLength}"` : ''}
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none mb-4"
                           onkeypress="if(event.key==='Enter') window.customModal.submitPrompt('${inputId}')"
                           autofocus>
                    
                    <div class="flex gap-3 justify-end">
                        <button onclick="window.customModal.closeModal(null)" 
                                class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
                            ${cancelText}
                        </button>
                        <button onclick="window.customModal.submitPrompt('${inputId}')" 
                                class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
                            ${confirmText}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    createAlertModal(message, title, options, resolve) {
        const {
            confirmText = 'OK',
            icon = 'ℹ️',
            type = 'info'
        } = options;

        const typeClasses = {
            info: 'bg-blue-600 hover:bg-blue-700',
            success: 'bg-green-600 hover:bg-green-700',
            warning: 'bg-yellow-600 hover:bg-yellow-700',
            error: 'bg-red-600 hover:bg-red-700'
        };

        return `
            <div class="modal-backdrop fixed inset-0 flex items-center justify-center p-4" 
                 onclick="if(event.target === this) window.customModal.closeModal(true)">
                <div class="modal-content modal-enter p-6 w-full max-w-md" onclick="event.stopPropagation()">
                    <div class="flex items-start gap-4">
                        <div class="text-2xl">${icon}</div>
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">${title}</h3>
                            <p class="text-gray-600 mb-6 leading-relaxed">${message}</p>
                            
                            <div class="flex justify-end">
                                <button onclick="window.customModal.closeModal(true)" 
                                        class="${typeClasses[type]} text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
                                    ${confirmText}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showModal(modalHTML) {
        this.modalContainer.innerHTML = modalHTML;
        this.modalContainer.classList.remove('hidden');
        
        // Trigger animation
        setTimeout(() => {
            const modalContent = this.modalContainer.querySelector('.modal-content');
            if (modalContent) {
                modalContent.classList.remove('modal-enter');
                modalContent.classList.add('modal-enter-active');
            }
        }, 10);

        // Focus first input if exists
        setTimeout(() => {
            const firstInput = this.modalContainer.querySelector('input, button');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    closeModal(result) {
        const modalContent = this.modalContainer.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.remove('modal-enter-active');
            modalContent.classList.add('modal-exit-active');
        }

        setTimeout(() => {
            this.modalContainer.classList.add('hidden');
            this.modalContainer.innerHTML = '';
            
            // Resolve the promise
            if (this.currentResolve) {
                this.currentResolve(result);
                this.currentResolve = null;
            }
        }, 150);
    }

    submitPrompt(inputId) {
        const input = document.getElementById(inputId);
        const value = input ? input.value.trim() : null;
        this.closeModal(value);
    }

    // Store current resolve function
    async confirm(message, title, options) {
        return new Promise((resolve) => {
            this.currentResolve = resolve;
            const modal = this.createConfirmModal(message, title, options, resolve);
            this.showModal(modal);
        });
    }

    async prompt(message, title, defaultValue, options) {
        return new Promise((resolve) => {
            this.currentResolve = resolve;
            const modal = this.createPromptModal(message, title, defaultValue, options, resolve);
            this.showModal(modal);
        });
    }

    async alert(message, title, options) {
        return new Promise((resolve) => {
            this.currentResolve = resolve;
            const modal = this.createAlertModal(message, title, options, resolve);
            this.showModal(modal);
        });
    }
}

// Initialize the custom modal system
window.customModal = new CustomModalSystem();

// Helper functions to replace native dialogs
window.safeConfirm = async (message, title = 'Confirm', options = {}) => {
    return await window.customModal.confirm(message, title, options);
};

window.safePrompt = async (message, title = 'Enter Value', defaultValue = '', options = {}) => {
    return await window.customModal.prompt(message, title, defaultValue, options);
};

window.safeAlert = async (message, title = 'Notice', options = {}) => {
    return await window.customModal.alert(message, title, options);
};

console.log('✅ Custom Modal System loaded - No more blocked dialogs!');