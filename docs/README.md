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

### ✅ **Excellent Support** (95%+ features)
- **Chrome** 88+ (Desktop & Mobile) - Full feature support
- **Brave** (Desktop & Mobile) - Excellent compatibility, privacy-focused
- **Edge** 88+ (Chromium-based) - Full feature support
- **Safari** 14+ (Desktop & Mobile) - Full feature support

### 🟢 **Good Support** (85%+ features)
- **Firefox** 85+ (Desktop) - Full functionality
- **Firefox Mobile (Android)** 85+ - Excellent support on Android
- **Samsung Internet** 15+ - Chromium-based, full support
- **Opera** 74+ - Chromium-based, full support

### 🟡 **Fair Support** (70%+ features)
- **Firefox iOS** 14+ - Good support, some iOS WebKit limitations
- **Safari** 13-13.x - Most features work, minor limitations
- **Chrome/Brave** 80-87 - Older versions with good support

### 🔴 **Limited/No Support**
- **Internet Explorer** - Not supported (requires ES6+)
- **Chrome/Firefox** < 80 - Missing critical features
- **Very old mobile browsers** (3+ years old)

### 📱 **Mobile-Specific Notes**

#### **Brave Mobile** 🟢
- **Android**: Excellent support, same as Chrome
- **iOS**: Good support, WebKit limitations apply
- **Privacy features**: Won't interfere with app functionality
- **Performance**: Excellent (Chromium engine)

#### **Firefox Mobile** 🟡
- **Android**: Very good support, different engine (Gecko vs WebKit)
- **iOS**: Fair support, limited by iOS WebKit restrictions
- **Real-time features**: Good on Android, occasional issues on iOS
- **Offline support**: Good across both platforms

#### **General Mobile Considerations**
- **iOS Safari/Firefox iOS**: WebKit restrictions may affect Firebase WebSockets
- **Android browsers**: Generally excellent support across all major browsers
- **PWA features**: Full support on Android, limited on iOS

### 🔧 **Feature Detection**

The app includes automatic browser compatibility detection:

```javascript
// Check your browser support
window.debugBrowserSupport();

// Get compatibility report
const report = FeatureDetector.quickCheck();
console.log(report);
```

**Detected features include:**
- ES6+ JavaScript support
- CSS Grid and Flexbox
- Firebase compatibility
- Real-time WebSocket support
- Local storage capabilities

### 🚀 **Recommended Browsers**

For the **best experience**, we recommend:

1. **Desktop**: Chrome, Brave, or Firefox (latest versions)
2. **Android**: Chrome, Brave, Firefox, or Samsung Internet
3. **iOS**: Safari or any Chromium-based browser

### ⚠️ **Known Limitations**

- **iOS browsers**: All use WebKit engine, which may have WebSocket limitations
- **Older browsers**: Missing ES6+ features, CSS Grid support
- **Private/Incognito mode**: Local storage limitations may affect some features
- **Ad blockers**: Generally don't affect functionality (Firebase is whitelisted)

## 🔐 Privacy & Security

- **🇨🇭 Swiss FADP Compliant**: Fully compliant with Swiss Federal Data Protection Act
- **🍪 Cookie Consent System**: Granular cookie control with multilingual interface (DE/EN)
- **🛡️ Data Minimization**: Only necessary data collected (participant names, availability)
- **🔒 Automatic Cleanup**: Meetup data automatically deleted after 30 days of inactivity
- **🚫 No Tracking**: No analytics or tracking cookies without explicit consent
- **📱 Local Storage**: User preferences stored locally when permitted
- **🔑 Secure Keys**: Randomly generated meetup keys with Firebase security

### Cookie Categories
- **Necessary**: Basic functionality (always enabled)
- **Functional**: Theme preferences, language settings (optional)
- **Preferences**: Participant name memory, last meetup key (optional)
- **Analytics**: Usage statistics for improvements (optional, disabled by default)

See our [Privacy Policy](privacy-policy.md) for complete details.

### User Rights (Swiss FADP)
- ✅ Right to information about data processing
- ✅ Right to access your stored data
- ✅ Right to correct inaccurate data
- ✅ Right to delete your data
- ✅ Right to withdraw consent anytime

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