# 🚀 Development Setup Guide

This guide will help you set up the Piogino Meetup Scheduler for development.

## 📋 Prerequisites

- **Node.js** 16+ and **npm** 8+
- **Git** for version control
- **Modern web browser** (Chrome, Firefox, Safari, Edge)
- **Firebase account** (for database setup)

## 🛠️ Quick Setup

### 1. Clone and Install
```bash
# Clone the repository
git clone https://github.com/piosteiner/Meetup-Scheduler.git
cd Meetup-Scheduler

# Install development dependencies
npm install
```

### 2. Development Server
```bash
# Start development server with live reload
npm run dev

# Or use alternative server
npm run serve
```

The app will open at `http://localhost:3000`

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with live reload |
| `npm run build` | Build optimized production files |
| `npm run lint` | Check code quality with ESLint |
| `npm run lint:fix` | Auto-fix linting issues |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run tests with Vitest |
| `npm run clean` | Remove build artifacts |
| `npm run validate` | Run linting and tests |

## 🏗️ Project Architecture

### Core Files
- `index.html` - Main entry point
- `js/app.js` - Application logic (main class)
- `js/api.js` - Firebase integration
- `js/components.js` - UI rendering
- `js/config.js` - Configuration settings

### Styling
- `css/styles.css` - Core styles
- `css/responsive.css` - Responsive breakpoints
- `css/themes.css` - Theme system
- Uses Tailwind CSS via CDN (development)

### Key Classes
- `MeetupApp` - Main application controller
- `FirebaseAPI` - Database operations
- `UIComponents` - UI rendering and updates
- `AvailabilityCalendar` - Calendar functionality

## 🔥 Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project
3. Enable Realtime Database
4. Set up security rules

### 2. Configure App
Update `js/config.js` with your Firebase configuration:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project.firebasedatabase.app",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

### 3. Database Structure
```json
{
  "meetups": {
    "ABCD1234": {
      "name": "Team Meeting",
      "description": "Weekly sync",
      "duration": 60,
      "participants": { ... },
      "proposals": { ... },
      "messages": { ... },
      "globalFavorites": { ... }
    }
  }
}
```

## 🎨 Development Workflow

### 1. Code Style
- Use ESLint for code quality
- Format with Prettier
- Follow existing conventions
- 4-space indentation for JS
- 2-space for HTML/CSS

### 2. Testing Strategy
```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage
```

### 3. Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature description"

# Push and create PR
git push origin feature/your-feature-name
```

## 🔍 Debugging

### Browser DevTools
- Check Console for errors
- Network tab for Firebase calls
- Application tab for local storage

### Debug Functions
```javascript
// Available in browser console
window.debugGlobalFavorites()
window.debugTheme()
window.app.currentMeetupKey
window.app.selectedParticipantId
```

### Common Issues
1. **Firebase connection**: Check network and config
2. **Real-time updates**: Verify listeners are set up
3. **Responsive issues**: Test across breakpoints
4. **Performance**: Monitor network requests

## 📱 Testing Across Devices

### Responsive Breakpoints
- Mobile: 320px - 768px
- Tablet: 768px - 1200px
- Desktop: 1200px - 1600px
- Ultra-wide: 1600px+

### Browser Testing
```bash
# Test on different browsers
npm run serve

# Then visit:
# http://localhost:3000 (Chrome)
# Use browser dev tools to simulate devices
```

## 🚢 Deployment

### GitHub Pages
```bash
# Build production files
npm run build

# Deploy to gh-pages branch
git subtree push --prefix dist origin gh-pages
```

### Firebase Hosting
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and deploy
firebase login
firebase deploy
```

## 📚 Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Configuration](https://prettier.io/docs/en/configuration.html)

## 🤝 Contributing

1. Fork the repository
2. Follow the development setup
3. Create feature branch
4. Make changes with tests
5. Follow code style guidelines
6. Submit pull request

## 🆘 Getting Help

- Check existing issues on GitHub
- Review browser console errors
- Test with different browsers
- Verify Firebase configuration

---

**Happy coding! 🎉**
