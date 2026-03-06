// calendar.js - Availability Calendar Component with Date Proposal

class AvailabilityCalendar {
    constructor() {
        this.currentDate = new Date();
        this.currentSelectedDay = null;
        this.calendarData = {}; // Store availability and comments for each day
        this.allCalendarData = {}; // Store all participants' calendar data for overview
        this.currentMeetupKey = '';
        this.selectedParticipantId = null;
        this.calendarListener = null; // Track Firebase listener
        this.overviewListener = null; // Track Firebase listener for group overview
    }

    // Initialize calendar when app loads
    init(meetupKey, participantId) {
        console.log('Initializing calendar with:', meetupKey, participantId);
        
        this.currentMeetupKey = meetupKey;
        this.selectedParticipantId = participantId;
        
        // Load calendar data and render
        this.loadCalendarData();
        
        // Setup real-time listener for group overview
        this.setupOverviewListener();

        // Re-render overview whenever participants list changes (e.g. someone joins)
        window.appState.subscribe('participants', () => this.renderOverview());
        
        // Setup event listeners
        this.setupEventListeners();
    }

    // Update selected participant
    updateSelectedParticipant(participantId) {
        console.log('Updating calendar participant to:', participantId);
        
        // Clean up existing listener
        if (this.calendarListener && this.currentMeetupKey && this.selectedParticipantId) {
            window.firebaseAPI.database
                .ref(`meetups/${this.currentMeetupKey}/calendar/${this.selectedParticipantId}`)
                .off('value', this.calendarListener);
        }
        
        this.selectedParticipantId = participantId;
        
        if (participantId) {
            // Load data for new participant
            this.loadCalendarData();
            // Setup real-time listener
            this.setupCalendarListener();
        } else {
            // Clear calendar when no participant selected
            this.calendarData = {};
            this.renderCalendar();
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Close modal when clicking outside
        document.getElementById('dayModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'dayModal') {
                this.closeDayModal();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !document.getElementById('dayModal')?.classList.contains('hidden')) {
                this.closeDayModal();
            }
        });
    }

    // Load calendar data from Firebase
    async loadCalendarData() {
        if (!this.currentMeetupKey || !this.selectedParticipantId) return;

        try {
            console.log('Loading calendar data for:', this.currentMeetupKey, this.selectedParticipantId);
            
            const snapshot = await window.firebaseAPI.database
                .ref(`meetups/${this.currentMeetupKey}/calendar/${this.selectedParticipantId}`)
                .once('value');
            
            const data = snapshot.val();
            console.log('Loaded calendar data:', data);
            
            this.calendarData = data || {};
            this.renderCalendar();
        } catch (error) {
            console.error('Error loading calendar data:', error);
        }
    }

    // Save calendar data to Firebase
    async saveCalendarData() {
        if (!this.currentMeetupKey || !this.selectedParticipantId) {
            console.error('Cannot save calendar data: missing meetup key or participant ID');
            return;
        }

        try {
            console.log('Saving calendar data:', this.calendarData);
            
            await window.firebaseAPI.database
                .ref(`meetups/${this.currentMeetupKey}/calendar/${this.selectedParticipantId}`)
                .set(this.calendarData);
                
            console.log('Calendar data saved successfully');
        } catch (error) {
            console.error('Error saving calendar data:', error);
            throw error;
        }
    }

    // Setup real-time listener for calendar data
    setupCalendarListener() {
        if (!this.currentMeetupKey || !this.selectedParticipantId) return;

        // Clean up existing listener
        if (this.calendarListener) {
            window.firebaseAPI.database
                .ref(`meetups/${this.currentMeetupKey}/calendar/${this.selectedParticipantId}`)
                .off('value', this.calendarListener);
        }

        // Set up new listener
        this.calendarListener = window.firebaseAPI.database
            .ref(`meetups/${this.currentMeetupKey}/calendar/${this.selectedParticipantId}`)
            .on('value', (snapshot) => {
                const data = snapshot.val();
                console.log('Calendar data updated from Firebase:', data);
                
                if (data) {
                    this.calendarData = data;
                    this.renderCalendar();
                }
            });
    }

    // Render the calendar
    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Update title
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const titleElement = document.getElementById('calendarTitle');
        if (titleElement) {
            titleElement.textContent = `${monthNames[month]} ${year}`;
        }
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Get the day of week for first day (Monday = 0)
        let startDay = (firstDay.getDay() + 6) % 7; // Convert Sunday = 0 to Monday = 0
        
        // Get previous month info for padding
        const prevMonth = new Date(year, month - 1, 0);
        const daysInPrevMonth = prevMonth.getDate();
        
        const calendarGrid = document.getElementById('calendarGrid');
        if (!calendarGrid) return;
        
        calendarGrid.innerHTML = '';
        
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
        const todayDate = today.getDate();
        
        // Add previous month's trailing days
        for (let i = startDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            const dayElement = this.createDayElement(day, 'other-month', year, month - 1);
            calendarGrid.appendChild(dayElement);
        }
        
        // Add current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = isCurrentMonth && day === todayDate;
            const dayElement = this.createDayElement(day, isToday ? 'today' : '', year, month);
            calendarGrid.appendChild(dayElement);
        }
        
        // Add next month's leading days to complete the grid
        const totalCells = calendarGrid.children.length;
        const remainingCells = 42 - totalCells; // 6 weeks × 7 days
        for (let day = 1; day <= remainingCells && remainingCells < 15; day++) {
            const dayElement = this.createDayElement(day, 'other-month', year, month + 1);
            calendarGrid.appendChild(dayElement);
        }

        // Keep group overview in sync with navigation
        this.renderOverview();
    }

    // Create a day element
    createDayElement(day, extraClass, year, month) {
        const dayElement = document.createElement('div');
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayData = this.calendarData[dateKey];
        
        let availabilityClass = 'neutral';
        if (dayData && dayData.availability) {
            availabilityClass = dayData.availability;
        }
        
        const hasComment = dayData && dayData.comment && dayData.comment.trim();
        
        dayElement.className = `calendar-day ${availabilityClass} ${extraClass} ${hasComment ? 'has-comment' : ''} 
                               flex items-center justify-center text-xs font-medium relative rounded m-0.5`;
        dayElement.textContent = day;
        dayElement.dataset.date = dateKey;
        
        if (!extraClass.includes('other-month')) {
            dayElement.addEventListener('click', () => this.openDayModal(dateKey, year, month, day));
        }
        
        return dayElement;
    }

    // Navigate to previous month
    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }

    // Navigate to next month
    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }

    // Open day detail modal
    openDayModal(dateKey, year, month, day) {
        if (!this.selectedParticipantId) {
            window.uiComponents.showNotification('Please select a participant first', 'warning');
            return;
        }

        this.currentSelectedDay = dateKey;
        
        // Format date for modal title
        const date = new Date(year, month, day);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        const formattedDate = `${dayNames[date.getDay()]}, ${monthNames[month]} ${day}, ${year}`;
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) {
            modalTitle.textContent = formattedDate;
        }
        
        // Load existing data
        const dayData = this.calendarData[dateKey] || {};
        
        // Reset availability buttons
        document.querySelectorAll('.availability-btn').forEach(btn => {
            btn.classList.remove('border-indigo-500', 'bg-indigo-50');
        });
        
        // Highlight current availability
        if (dayData.availability) {
            const activeBtn = document.getElementById(dayData.availability + 'Btn');
            if (activeBtn) {
                activeBtn.classList.add('border-indigo-500', 'bg-indigo-50');
            }
        }
        
        // Load comment
        const commentInput = document.getElementById('dayComment');
        if (commentInput) {
            commentInput.value = dayData.comment || '';
        }
        
        // Update modal with propose date functionality
        this.updateModalWithProposeDate(dateKey);
        
        // Show modal
        const modal = document.getElementById('dayModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    // Set up real-time listener for all participants' calendar data (group overview)
    setupOverviewListener() {
        if (!this.currentMeetupKey) return;

        if (this.overviewListener) {
            window.firebaseAPI.database
                .ref(`meetups/${this.currentMeetupKey}/calendar`)
                .off('value', this.overviewListener);
        }

        this.overviewListener = window.firebaseAPI.database
            .ref(`meetups/${this.currentMeetupKey}/calendar`)
            .on('value', (snapshot) => {
                this.allCalendarData = snapshot.val() || {};
                this.renderOverview();
            });
    }

    // Render the group availability overview grid
    renderOverview() {
        const grid = document.getElementById('overviewGrid');
        const legend = document.getElementById('overviewParticipantLegend');
        if (!grid) return;

        const participants = window.appState ? window.appState.getParticipants() : {};
        const participantIds = Object.keys(participants);

        if (participantIds.length === 0) {
            grid.innerHTML = '<p class="text-gray-400 text-xs text-center col-span-7 py-4">No participants yet.</p>';
            if (legend) legend.innerHTML = '';
            return;
        }

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDay = (firstDay.getDay() + 6) % 7; // Mon = 0
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const colorMap = {
            available: 'bg-green-500',
            checking: 'bg-yellow-400',
            unavailable: 'bg-red-400'
        };

        const cells = [];
        for (let i = startDay - 1; i >= 0; i--) cells.push({ day: daysInPrevMonth - i, isOther: true });
        for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, isOther: false });
        const remaining = 42 - cells.length;
        for (let d = 1; d <= remaining && remaining < 15; d++) cells.push({ day: d, isOther: true });

        grid.innerHTML = cells.map(cell => {
            if (cell.isOther) {
                return `<div class="min-h-[2.5rem] p-0.5 bg-white rounded m-0.5 text-gray-300 text-xs font-medium pt-1 pl-1">${cell.day}</div>`;
            }
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
            const dots = participantIds
                .map(pid => {
                    const availability = this.allCalendarData[pid]?.[dateKey]?.availability;
                    if (!availability) return null;
                    const name = participants[pid]?.name || '?';
                    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                    const colorClass = colorMap[availability] || 'bg-gray-300';
                    const label = availability === 'unavailable' ? 'not available' : availability;
                    return `<span class="inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[8px] font-bold ${colorClass} cursor-default" title="${this.escapeHtml(name)}: ${label}">${initials}</span>`;
                })
                .filter(Boolean)
                .join('');
            return `<div class="min-h-[2.5rem] p-0.5 bg-white rounded m-0.5"><div class="text-xs text-gray-600 font-medium leading-tight">${cell.day}</div><div class="flex flex-wrap gap-0.5 mt-0.5">${dots}</div></div>`;
        }).join('');

        // Participant legend below grid
        if (legend) {
            legend.innerHTML = participantIds.map(pid => {
                const name = participants[pid]?.name || '?';
                const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                return `<span class="inline-flex items-center gap-1 text-xs text-gray-600 bg-white border border-gray-200 rounded-full px-2 py-0.5"><span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-300 text-white text-[8px] font-bold">${initials}</span>${this.escapeHtml(name)}</span>`;
            }).join('');
        }
    }

    // Escape HTML for use in attributes
    escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // NEW: Update modal to include propose date functionality
    updateModalWithProposeDate(dateKey) {
        const proposeSection = document.getElementById('proposeDateSection');
        
        if (!proposeSection) return;
        
        // Check if the selected date is in the past
        const selectedDate = new Date(dateKey);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time for accurate comparison
        selectedDate.setHours(0, 0, 0, 0);
        
        const isPastDate = selectedDate < today;
        
        if (isPastDate) {
            proposeSection.innerHTML = `
                <div class="text-center text-gray-500 text-sm italic">
                    Cannot propose dates in the past
                </div>
            `;
        } else {
            proposeSection.innerHTML = `
                <label class="block text-sm font-medium text-gray-700 mb-3">Propose this date for the meetup:</label>
                <div class="flex flex-col gap-3">
                    <div class="flex items-center gap-2">
                        <input type="time" id="proposeTimeInput" 
                               class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                               value="18:00">
                        <button onclick="window.calendar.proposeDateFromModal('${dateKey}')" 
                                class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm whitespace-nowrap">
                            📅 Propose Date
                        </button>
                    </div>
                    <div class="text-xs text-gray-500">
                        Select a time and click "Propose Date" to add this date/time to the proposals list
                    </div>
                </div>
            `;
        }
    }

    // NEW: Propose date from modal
    async proposeDateFromModal(dateKey) {
        try {
            const timeInput = document.getElementById('proposeTimeInput');
            const time = timeInput ? timeInput.value : '18:00';
            
            if (!time) {
                window.uiComponents.showNotification('Please select a time', 'warning');
                return;
            }
            
            // Check if participant is selected
            if (!this.selectedParticipantId) {
                window.uiComponents.showNotification('Please select a participant first', 'warning');
                return;
            }
            
            // Create the datetime string
            const dateTimeString = `${dateKey}T${time}`;
            
            // Call the app's propose function
            await window.app.proposeDateTime(dateTimeString);
            
            // Close the modal
            this.closeDayModal();
            
        } catch (error) {
            console.error('Error proposing date from modal:', error);
            window.uiComponents.showNotification('Error proposing date: ' + error.message, 'error');
        }
    }

    // Close day detail modal
    closeDayModal() {
        const modal = document.getElementById('dayModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.currentSelectedDay = null;
    }

    // Set availability for current day
    setAvailability(availability) {
        // Reset all buttons
        document.querySelectorAll('.availability-btn').forEach(btn => {
            btn.classList.remove('border-indigo-500', 'bg-indigo-50');
        });
        
        // Highlight selected button
        const selectedBtn = document.getElementById(availability + 'Btn');
        if (selectedBtn) {
            selectedBtn.classList.add('border-indigo-500', 'bg-indigo-50');
        }
    }

    // Save day data
    async saveDayData() {
        if (!this.currentSelectedDay || !this.selectedParticipantId) {
            console.error('Cannot save: missing selected day or participant');
            return;
        }
        
        try {
            // Get selected availability
            const availabilityBtn = document.querySelector('.availability-btn.border-indigo-500');
            const availability = availabilityBtn ? availabilityBtn.id.replace('Btn', '') : null;

            if (!availability) {
                window.uiComponents.showNotification('Please select your availability before saving', 'warning');
                return;
            }
            
            // Get comment
            const commentInput = document.getElementById('dayComment');
            const comment = commentInput ? commentInput.value.trim() : '';
            
            console.log('Saving day data:', this.currentSelectedDay, 'availability:', availability, 'comment:', comment);
            
            // Save data locally
            if (!this.calendarData[this.currentSelectedDay]) {
                this.calendarData[this.currentSelectedDay] = {};
            }
            
            if (availability) {
                this.calendarData[this.currentSelectedDay].availability = availability;
            }
            this.calendarData[this.currentSelectedDay].comment = comment;
            
            // Save to Firebase
            await this.saveCalendarData();
            
            // Update calendar display
            this.renderCalendar();
            
            // Close modal
            this.closeDayModal();
            
            // Show success message
            window.uiComponents.showNotification('Day updated successfully!', 'success');
        } catch (error) {
            console.error('Error saving day data:', error);
            window.uiComponents.showNotification('Failed to save day data', 'error');
        }
    }

    // Clear day data
    async clearDayData() {
        if (!this.currentSelectedDay || !this.selectedParticipantId) {
            console.error('Cannot clear: missing selected day or participant');
            return;
        }
        
        try {
            console.log('Clearing day data for:', this.currentSelectedDay);
            
            delete this.calendarData[this.currentSelectedDay];
            
            // Save to Firebase
            await this.saveCalendarData();
            
            // Update calendar display
            this.renderCalendar();
            
            // Close modal
            this.closeDayModal();
            
            window.uiComponents.showNotification('Day data cleared', 'info');
        } catch (error) {
            console.error('Error clearing day data:', error);
            window.uiComponents.showNotification('Failed to clear day data', 'error');
        }
    }

    // Reset calendar data (when switching participants or going home)
    reset() {
        console.log('Resetting calendar');
        
        // Clean up listener
        if (this.calendarListener && this.currentMeetupKey && this.selectedParticipantId) {
            window.firebaseAPI.database
                .ref(`meetups/${this.currentMeetupKey}/calendar/${this.selectedParticipantId}`)
                .off('value', this.calendarListener);
            this.calendarListener = null;
        }
        
        this.currentMeetupKey = '';
        this.selectedParticipantId = null;
        this.calendarData = {};
        this.currentSelectedDay = null;
        this.currentDate = new Date();
        
        // Clear calendar grid
        const calendarGrid = document.getElementById('calendarGrid');
        if (calendarGrid) {
            calendarGrid.innerHTML = '';
        }
        
        // Reset title
        const titleElement = document.getElementById('calendarTitle');
        if (titleElement) {
            const monthNames = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            const now = new Date();
            titleElement.textContent = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
        }
        
        // Close modal if open
        this.closeDayModal();
    }

    // Get all available days for a month (useful for suggesting dates)
    getAvailableDays(year, month) {
        const availableDays = [];
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayData = this.calendarData[dateKey];
            
            if (dayData && dayData.availability === 'available') {
                availableDays.push({
                    date: new Date(year, month, day),
                    comment: dayData.comment || ''
                });
            }
        }
        
        return availableDays;
    }

    // Get summary of availability for current month
    getMonthSummary() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let available = 0;
        let checking = 0;
        let unavailable = 0;
        let notSet = 0;
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayData = this.calendarData[dateKey];
            
            if (dayData && dayData.availability) {
                switch (dayData.availability) {
                    case 'available': available++; break;
                    case 'checking': checking++; break;
                    case 'unavailable': unavailable++; break;
                }
            } else {
                notSet++;
            }
        }
        
        return { available, checking, unavailable, notSet, total: daysInMonth };
    }
}

// Create singleton instance
window.calendar = new AvailabilityCalendar();

console.log('✅ Enhanced calendar component loaded successfully');