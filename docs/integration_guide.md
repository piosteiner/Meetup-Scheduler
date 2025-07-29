# 7TV Emote System Integration Guide

## Overview
This guide explains how to integrate the 7TV emote system into your Piogino Meetup app. The system will automatically replace emote names (like `peepoHey`) with actual emote images from 7TV.app in:
- Meetup titles
- Meetup descriptions  
- Chat messages

## Files to Add/Modify

### 1. Add New Files

#### Create `js/emotes.js`
Copy the JavaScript code from the first artifact and save it as `js/emotes.js` in your project.

#### Create `css/emotes.css`
Copy the CSS code from the second artifact and save it as `css/emotes.css` in your project.

### 2. Modify Existing Files

#### Update `index.html`
Add the new CSS and JavaScript files to your HTML head and before the closing body tag:

```html
<head>
    <!-- ... existing head content ... -->
    <link rel="stylesheet" href="css/emotes.css">
</head>

<body>
    <!-- ... existing body content ... -->
    
    <!-- JavaScript Files -->
    <script src="js/config.js"></script>
    <script src="js/utils.js"></script>
    <script src="js/api.js"></script>
    <script src="js/components.js"></script>
    <script src="js/calendar.js"></script>
    <script src="js/emotes.js"></script>  <!-- ADD THIS LINE -->
    <script src="js/app.js"></script>
</body>
```

## How It Works

### Emote Loading
- The system automatically loads popular emotes from 7TV's global emote set
- Emotes are cached in localStorage for 24 hours to improve performance
- If the API is unavailable, it falls back to a small set of popular emotes

### Text Processing
- When text is displayed, emote names are automatically detected and replaced with images
- For example: `Hello peepoHey everyone!` becomes `Hello [peepoHey emote image] everyone!`
- Only complete word matches are replaced (prevents partial matches)

### Autocomplete
- When typing in message or description inputs, the system shows emote suggestions
- Type part of an emote name to see matching suggestions
- Click a suggestion to auto-complete the emote name

## Features

### ✅ Supported Areas
- **Meetup Titles**: Emotes in meetup names (e.g., "Gaming Night peepoHey")
- **Descriptions**: Emotes in meetup descriptions
- **Chat Messages**: Emotes in all chat messages
- **Real-time Updates**: Emotes appear instantly when messages/titles are updated

### 🎨 Visual Features
- **Hover Effects**: Emotes slightly scale up on hover
- **Responsive Sizing**: Different sizes for titles, descriptions, and messages
- **Fallback Images**: Automatic fallback from WebP to PNG if needed
- **Error Handling**: Graceful handling of failed emote loads

### 🚀 Performance Features
- **Caching**: Emotes cached for 24 hours
- **Lazy Loading**: Emote images load only when needed
- **Optimized Regex**: Efficient text parsing
- **Background Updates**: Fresh emotes fetched in background

### 📱 Accessibility
- **Alt Text**: All emotes have proper alt text
- **High Contrast**: Support for high contrast mode
- **Reduced Motion**: Respects user's motion preferences
- **Keyboard Navigation**: Emote suggestions support keyboard navigation

## Popular Emotes Supported

The system loads from 7TV's global emote set, which includes popular emotes like:
- `peepoHey` - Waving pepe
- `Kappa` - Classic Twitch emote
- `OMEGALUL` - Laughing emote
- `MonkaS` - Nervous emote
- `PogChamp` - Excitement emote
- And many more!

## Customization Options

### Emote Sizes
You can customize emote sizes by modifying the CSS:

```css
/* Message emotes */
.bg-gray-50 .emote-img {
    width: 28px;  /* Change from 24px */
    height: 28px;
}

/* Title emotes */
#meetupTitle .emote-img {
    width: 32px;  /* Change from 28px */
    height: 32px;
}
```

### Adding Custom Emote Sets
To add custom emote sets, modify the `fetchEmotes()` method in `js/emotes.js`:

```javascript
// Add your custom emote set ID
const customSetResponse = await fetch('https://7tv.io/v3/emote-sets/YOUR_SET_ID');
```

### Disabling Autocomplete
To disable the autocomplete feature, comment out the event listeners in the `setupEventListeners()` method.

## Testing

### Test Emotes
Try typing these emote names in messages or descriptions:
- `peepoHey`
- `Kappa`
- `OMEGALUL`
- `MonkaS`

### Test Autocomplete
1. Start typing an emote name like "peepo"
2. You should see suggestions appear below the input
3. Click a suggestion to auto-complete

### Test Different Areas
1. **Title**: Edit meetup name and add emotes
2. **Description**: Add emotes to meetup description
3. **Messages**: Send messages with emotes

## Troubleshooting

### Emotes Not Loading
1. Check browser console for errors
2. Verify 7TV API is accessible
3. Check if localStorage is available
4. Try refreshing emotes: `window.emoteSystem.refreshEmotes()`

### Performance Issues
1. The system caches emotes to localStorage
2. If you notice slowdowns, clear the cache: `localStorage.removeItem('piogino_emotes_cache')`
3. The system loads emotes in the background to avoid blocking the UI

### Emote Suggestions Not Showing
1. Make sure you're typing in supported input fields
2. Check that JavaScript is enabled
3. Verify the input has focus when typing

## Browser Support

### Fully Supported
- Chrome/Chromium 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Partial Support
- Older browsers will show emote names as text (graceful degradation)
- Internet Explorer: Not supported

## Security Notes

- All text is properly escaped to prevent XSS attacks
- Emote URLs are from trusted 7TV CDN
- No user-generated emote URLs are allowed
- Content Security Policy compatible

## API Rate Limits

- The system respects 7TV's API rate limits
- Emotes are cached for 24 hours to minimize API calls
- Background updates don't block the UI
- Fallback emotes available if API is unavailable

This emote system will make your meetup app much more engaging and fun, similar to popular streaming platforms! 🎉