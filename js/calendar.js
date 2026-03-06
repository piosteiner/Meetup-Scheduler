// calendar.js - Availability Calendar Component with Date Proposal

class AvailabilityCalendar {
    constructor() {
        this.currentDate = new Date();
        this.overviewDate = new Date();
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

        
        this.currentMeetupKey = meetupKey;
        this.selectedParticipantId = participantId;
        
        // Load calendar data and render
        this.loadCalendarData();
        
        // Setup real-time listener for group overview
        this.setupOverviewListener();

        // Re-render overview whenever participants list changes (e.g. someone joins)
        window.appState.subscribe('participants', (participants) => {
            this.renderOverview();
            this.updateCalendarBanner();
            this.updateQuickSelectOptions(participants);
        });

        // Update banner when selected participant changes
        window.appState.subscribe('selectedParticipant', () => this.updateCalendarBanner());

        // Setup overview tooltip once (uses event delegation, survives re-renders)
        this.setupOverviewTooltip();
        
        // Setup event listeners
        this.setupEventListeners();

        // Initial render with whatever state is already available
        this.renderOverview();
        this.updateCalendarBanner();
        this.updateQuickSelectOptions(window.appState.getParticipants());
    }

    // Update selected participant
    updateSelectedParticipant(participantId) {

        
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

        // Refresh overview whenever the selected participant changes
        this.renderOverview();
        this.updateCalendarBanner();
    }

    // Setup event listeners
    // Show/hide the no-participant banner on the calendar
    updateCalendarBanner() {
        const banner = document.getElementById('calendarNoParticipantBanner');
        if (!banner) return;
        const hasParticipant = !!window.appState?.getSelectedParticipant();
        banner.classList.toggle('hidden', hasParticipant);
        // Keep the dropdown value in sync with current selection
        const sel = document.getElementById('calendarParticipantQuickSelect');
        if (sel) sel.value = window.appState?.getSelectedParticipant() || '';
    }

    // Populate the quick-select dropdown with current participants
    updateQuickSelectOptions(participants) {
        const sel = document.getElementById('calendarParticipantQuickSelect');
        if (!sel) return;
        const current = sel.value;
        const options = Object.entries(participants || {})
            .map(([id, p]) => `<option value="${id}">${this.escapeHtml(p?.name || id)}</option>`)
            .join('');
        sel.innerHTML = '<option value="">Choose participant…</option>' + options;
        sel.value = current || window.appState?.getSelectedParticipant() || '';
    }

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
            const snapshot = await window.firebaseAPI.database
                .ref(`meetups/${this.currentMeetupKey}/calendar/${this.selectedParticipantId}`)
                .once('value');
            
            const data = snapshot.val();
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
            await window.firebaseAPI.database
                .ref(`meetups/${this.currentMeetupKey}/calendar/${this.selectedParticipantId}`)
                .set(this.calendarData);
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

    // Navigate overview to previous month
    previousOverviewMonth() {
        this.overviewDate.setMonth(this.overviewDate.getMonth() - 1);
        this.renderOverview();
    }

    // Navigate overview to next month
    nextOverviewMonth() {
        this.overviewDate.setMonth(this.overviewDate.getMonth() + 1);
        this.renderOverview();
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
        
        // Reset availability buttons and highlight current selection
        this.setAvailability(dayData.availability || null);
        if (!dayData.availability) {
            // No saved value — ensure all buttons are in their plain base state
            document.querySelectorAll('.availability-btn').forEach(btn => {
                btn.classList.remove('is-selected');
            });
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
            const section = document.getElementById('dateRecommendations');
            if (section) section.classList.add('hidden');
            return;
        }

        const monthNames = ['January','February','March','April','May','June',
                             'July','August','September','October','November','December'];
        const year = this.overviewDate.getFullYear();
        const month = this.overviewDate.getMonth();

        const titleEl = document.getElementById('overviewTitle');
        if (titleEl) titleEl.textContent = `${monthNames[month]} ${year}`;

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
                    const tooltip = this.escapeHtml(`${name}: ${label}`);
                    const comment = this.allCalendarData[pid]?.[dateKey]?.comment?.trim() || '';
                    const commentAttr = comment ? ` data-comment="${this.escapeHtml(comment)}"` : '';
                    const commentRing = comment ? ' ring-2 ring-white ring-offset-1 ring-offset-transparent' : '';
                    return `<span class="overview-dot inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[8px] font-bold ${colorClass}${commentRing} cursor-pointer relative" data-tip="${tooltip}"${commentAttr}>${initials}</span>`;
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

        this.renderRecommendations(participantIds, year, month);
    }

    // Render suggested dates below the overview grid
    renderRecommendations(participantIds, year, month) {
        const section = document.getElementById('dateRecommendations');
        const list = document.getElementById('dateRecommendationsList');
        if (!section || !list) return;

        const total = participantIds.length;
        if (total === 0) { section.classList.add('hidden'); return; }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const monthNames = ['January','February','March','April','May','June',
                            'July','August','September','October','November','December'];
        const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

        const perfect = [];   // all participants available
        const good = [];      // some available, rest not set, none blocking

        for (let d = 1; d <= daysInMonth; d++) {
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const date = new Date(year, month, d);
            if (date < today) continue;

            let available = 0, blocking = 0;
            for (const pid of participantIds) {
                const a = this.allCalendarData[pid]?.[dateKey]?.availability;
                if (a === 'available') available++;
                else if (a === 'unavailable' || a === 'checking') blocking++;
            }

            if (blocking > 0 || available === 0) continue;

            const dayLabel = `${dayNames[date.getDay()]} ${d} ${monthNames[month]}`;
            const entry = { dateKey, dayLabel, available, total };

            if (available === total) perfect.push(entry);
            else good.push(entry);
        }

        // Sort good dates by number available descending
        good.sort((a, b) => b.available - a.available);

        const items = [...perfect, ...good].slice(0, 8);

        if (items.length === 0) {
            section.classList.add('hidden');
            return;
        }

        section.classList.remove('hidden');
        list.innerHTML = items.map(item => {
            const isPerfect = item.available === item.total;
            const unknown = item.total - item.available;
            const badge = isPerfect
                ? `<span class="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">All available</span>`
                : `<span class="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">${item.available}/${item.total} available</span>
                   <span class="text-xs text-gray-400">${unknown} not set</span>`;
            const borderColor = isPerfect ? 'border-green-300 bg-green-50' : 'border-emerald-200 bg-white';
            const timeId = `recTime_${item.dateKey}`;
            return `
                <div class="flex items-center justify-between border ${borderColor} rounded-lg px-3 py-2 gap-2 flex-wrap">
                    <div class="flex items-center gap-2">
                        <span class="text-base">${isPerfect ? '🟢' : '🟡'}</span>
                        <span class="text-sm font-medium text-gray-800">${this.escapeHtml(item.dayLabel)}</span>
                    </div>
                    <div class="flex items-center gap-2 flex-wrap">${badge}
                        <input type="time" id="${timeId}" value="18:00"
                               class="px-2 py-1 border border-purple-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none">
                        <button onclick="window.calendar.proposeRecommendedDate('${item.dateKey}', '${timeId}')"
                                class="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded-lg transition-colors duration-150 whitespace-nowrap">
                            📅 Propose
                        </button>
                    </div>
                </div>`;
        }).join('');
    }

    // Propose a date directly from the recommendations list
    async proposeRecommendedDate(dateKey, timeInputId) {
        if (!this.selectedParticipantId) {
            window.uiComponents.showNotification('Please select a participant first', 'warning');
            return;
        }
        const timeEl = timeInputId ? document.getElementById(timeInputId) : null;
        const time = timeEl?.value || '18:00';
        if (!time) {
            window.uiComponents.showNotification('Please select a start time', 'warning');
            return;
        }
        try {
            await window.proposalManager.proposeDateTime(`${dateKey}T${time}`);
        } catch (error) {
            window.uiComponents.showNotification('Error proposing date: ' + error.message, 'error');
        }
    }
    setupOverviewTooltip() {
        let tip = document.getElementById('overviewDotTooltip');
        if (!tip) {
            tip = document.createElement('div');
            tip.id = 'overviewDotTooltip';
            tip.style.cssText = 'position:fixed;z-index:9999;padding:4px 10px;font-size:12px;line-height:1.5;color:#fff;background:#1f2937;border-radius:4px;box-shadow:0 2px 6px rgba(0,0,0,.35);pointer-events:none;opacity:0;transition:opacity .1s;white-space:pre-wrap;max-width:240px;';
            document.body.appendChild(tip);
        }

        const grid = document.getElementById('overviewGrid');
        if (!grid) return;

        let pinnedDot = null;

        const show = (text, e) => {
            tip.textContent = text;
            tip.style.opacity = '1';
            position(e);
        };

        const hide = () => { tip.style.opacity = '0'; };

        const position = (e) => {
            let x = e.clientX + 12;
            let y = e.clientY - 30;
            if (x + 160 > window.innerWidth) x = e.clientX - 170;
            if (y < 4) y = e.clientY + 16;
            tip.style.left = x + 'px';
            tip.style.top = y + 'px';
        };

        grid.addEventListener('mouseover', (e) => {
            const dot = e.target.closest('.overview-dot');
            if (!dot || dot === pinnedDot) return;
            const comment = dot.dataset.comment;
            const text = comment ? `${dot.dataset.tip}\n💬 "${comment}"` : dot.dataset.tip;
            show(text, e);
        });

        grid.addEventListener('mousemove', (e) => {
            const dot = e.target.closest('.overview-dot');
            if (dot && dot !== pinnedDot) position(e);
        });

        grid.addEventListener('mouseout', (e) => {
            const dot = e.target.closest('.overview-dot');
            if (!dot || dot === pinnedDot) return;
            hide();
        });

        grid.addEventListener('click', (e) => {
            const dot = e.target.closest('.overview-dot');
            if (!dot) return;
            e.stopPropagation();
            if (pinnedDot === dot) {
                pinnedDot = null;
                hide();
            } else {
                pinnedDot = dot;
                const comment = dot.dataset.comment;
                const text = comment ? `${dot.dataset.tip}\n💬 "${comment}"` : dot.dataset.tip;
                show(text, e);
            }
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.overview-dot')) {
                pinnedDot = null;
                hide();
            }
        });
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

    // Update modal to include propose date functionality
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
                <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-gray-400 text-sm italic">
                    Cannot propose dates in the past
                </div>
            `;
        } else {
            proposeSection.innerHTML = `
                <div class="bg-purple-50 border border-purple-100 rounded-xl p-4">
                    <label class="block text-sm font-medium text-purple-900 mb-3">Propose this date for the meetup:</label>
                    <div class="flex flex-col gap-3">
                        <div class="flex items-center gap-2">
                            <input type="time" id="proposeTimeInput" 
                                   class="px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none text-sm bg-white"
                                   value="18:00">
                            <button onclick="window.calendar.proposeDateFromModal('${dateKey}')" 
                                    class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm whitespace-nowrap">
                                📅 Propose Date
                            </button>
                        </div>
                        <div class="text-xs text-purple-500">
                            Select a time and click "Propose Date" to add this date/time to the proposals list
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // Propose date from modal
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
            
            await window.proposalManager.proposeDateTime(dateTimeString);
            
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
        const styles = {
            available:   { base: ['bg-green-100', 'text-green-700'],  selected: ['bg-green-500',  'border-green-600',  'text-white'] },
            checking:    { base: ['bg-yellow-100', 'text-yellow-700'], selected: ['bg-yellow-400', 'border-yellow-500', 'text-yellow-900'] },
            unavailable: { base: ['bg-red-100',   'text-red-700'],    selected: ['bg-red-500',    'border-red-600',    'text-white'] },
        };

        // Reset all buttons to their base state
        document.querySelectorAll('.availability-btn').forEach(btn => {
            const key = btn.id.replace('Btn', '');
            const s = styles[key];
            if (s) {
                btn.classList.remove('is-selected', ...s.selected);
                btn.classList.add(...s.base);
            }
        });

        // Apply saturated selected style to the chosen button
        const selectedBtn = document.getElementById(availability + 'Btn');
        if (selectedBtn) {
            const s = styles[availability];
            if (s) {
                selectedBtn.classList.remove(...s.base);
                selectedBtn.classList.add('is-selected', ...s.selected);
            }
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
            const availabilityBtn = document.querySelector('.availability-btn.is-selected');
            const availability = availabilityBtn ? availabilityBtn.id.replace('Btn', '') : null;

            if (!availability) {
                window.uiComponents.showNotification('Please select your availability before saving', 'warning');
                return;
            }
            
            // Get comment
            const commentInput = document.getElementById('dayComment');
            const comment = commentInput ? commentInput.value.trim() : '';
            
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
        this.overviewDate = new Date();
        
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

}

// Create singleton instance
window.calendar = new AvailabilityCalendar();

console.log('✅ Enhanced calendar component loaded successfully');