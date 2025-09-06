# 🗓️ Piogino Meetup Scheduler

A modern, real-time meetup scheduling application built with vanilla JavaScript and Firebase. Perfect for coordinating group meetings with features like availability tracking, proposal voting, and real-time messaging.

## ✨ Features

- **🔑 Easy Meetup Creation**: Generate unique meetup keys for instant sharing
- **👥 Real-time Collaboration**: Live participant updates and messaging
- **📅 Smart Scheduling**: Propose dates/times with participant availability tracking
- **⭐ Favorites System**: Star important proposals for group visibility
- **📱 Responsive Design**: Works seamlessly on all devices (mobile, tablet, desktop, 2K+)
- **🎨 Multiple Themes**: Light/dark/auto theme switching
- **📲 Calendar Integration**: Download ICS files for calendar apps
- **💬 Integrated Chat**: Real-time messaging with edit/delete capabilities
- **🗓️ Visual Calendar**: Month view with availability indicators

## 🚀 Quick Start

1. **Open the App**: Visit the application in your web browser
2. **Create a Meetup**: Click "Create New Meetup" to generate a unique key
3. **Share the Key**: Send the 8-character key to participants
4. **Join & Schedule**: Participants join, propose dates, and mark availability
5. **Collaborate**: Use real-time chat and voting to finalize plans

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Styling**: Tailwind CSS, Custom responsive design
- **Backend**: Firebase Realtime Database
- **Features**: Real-time synchronization, offline support
- **Architecture**: Modular component-based structure

## 📁 Project Structure

```
Meetup Scheduler/
├── index.html              # Main application entry point
├── css/
│   ├── styles.css          # Core application styles
│   ├── responsive.css      # Responsive design (mobile to 2K)
│   ├── themes.css          # Theme system (light/dark/auto)
│   ├── animations.css      # UI animations and transitions
│   └── emotes.css          # Emote system styling
├── js/
│   ├── app.js              # Main application logic
│   ├── api.js              # Firebase API integration
│   ├── components.js       # UI component rendering
│   ├── calendar.js         # Calendar functionality
│   ├── config.js           # Configuration settings
│   ├── utils.js            # Utility functions
│   ├── theme-switcher.js   # Theme management
│   ├── modal-system.js     # Custom modal dialogs
│   └── emotes.js           # Enhanced app initialization
├── docs/
│   ├── README.md           # This file
│   └── integration_guide.md # Integration instructions
└── fonts/                  # Custom fonts
```

## 🎯 Key Features Explained

### Real-time Collaboration
- All changes sync instantly across all participants
- Live participant list with selection indicators
- Real-time message updates with edit history

### Smart Scheduling
- Visual calendar with availability indicators
- Multiple proposal support with voting
- Automatic conflict detection
- Duration-based planning

### Modern UI/UX
- Mobile-first responsive design
- Smooth animations and transitions
- Accessibility features
- Progressive enhancement

## 🔧 Configuration

The app uses Firebase for real-time data synchronization. Configuration is handled in `js/config.js`:

```javascript
// Firebase configuration
const firebaseConfig = {
    // Your Firebase configuration
};

// App settings
const appConfig = {
    defaultMeetingDuration: 60, // minutes
    maxParticipants: 50,
    // ... other settings
};
```

## 🌟 Advanced Features

### Favorites System
- Star important proposals for group visibility
- Global favorites visible to all participants
- Smart sorting by popularity

### Calendar Integration
- Download ICS files for any proposal
- Compatible with Google Calendar, Outlook, Apple Calendar
- Automatic timezone handling

### Theme System
- Auto-detection of system preference
- Manual theme switching
- Persistent theme selection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit with descriptive messages
5. Push and create a Pull Request

## 📱 Browser Support

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🔐 Privacy & Security

- No personal data stored beyond participant names
- Meetup keys are randomly generated and secure
- Real-time data with automatic cleanup
- No tracking or analytics by default

## 📄 License

This project is open source. Feel free to use, modify, and distribute.

## 🆘 Support

If you encounter issues:
1. Check browser console for errors
2. Verify Firebase connection
3. Try refreshing the page
4. Create an issue on GitHub

---

**Built with ❤️ by Piogino**

*Making group scheduling simple and collaborative.*