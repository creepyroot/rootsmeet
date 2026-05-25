# ROOTS PROJECT - Cinematic Video Meetings

A beautiful, peer-to-peer video meeting application built with pure vanilla JavaScript.

## Features

- 🎬 **Cinematic UI** - Beautiful dark theme with emerald accents and smooth animations
- 🔒 **Peer-to-Peer Encrypted** - Direct WebRTC connections between participants
- ⚡ **Lightning Fast** - Zero-latency connections with no server relay
- 📹 **HD Video** - Crystal clear video quality
- 💬 **Real-time Chat** - In-meeting text messaging
- 👋 **Reactions** - Send emoji reactions during meetings
- 🖐️ **Raise Hand** - Non-verbal participation
- 📱 **Responsive** - Works on all devices

## File Structure

```
/
├── index.html              # Main HTML entry point
├── style.css               # All styles (1800+ lines)
├── src/
│   ├── core/
│   │   ├── state.js        # Global state management
│   │   └── app.js          # Main application controller
│   ├── utils/
│   │   ├── helpers.js      # Utility functions
│   │   └── media.js        # Media handling utilities
│   └── components/
│       ├── intro.js        # Intro screen component
│       ├── join.js         # Join screen component
│       ├── prejoin.js      # Pre-join screen component
│       └── room.js         # Meeting room component
└── README.md
```

## Deployment to GitHub Pages

1. Push this repository to GitHub
2. Go to Settings → Pages
3. Select "Deploy from a branch"
4. Choose the main branch and root folder
5. Click Save

Your site will be live at `https://yourusername.github.io/repository-name`

## Local Development

Simply open `index.html` in a modern browser. Note that for full functionality (camera/microphone access), you need to serve it over HTTPS or localhost.

You can use any local server:
```bash
# Python 3
python -m http.server 8000

# Node.js (npx)
npx serve .

# PHP
php -S localhost:8000
```

## Technology Stack

- **Pure Vanilla JavaScript** - No frameworks, no build tools
- **WebRTC** - Peer-to-peer video/audio
- **PeerJS** - Simplified WebRTC API
- **CSS3** - Modern animations and effects
- **Google Fonts** - Inter and JetBrains Mono

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## License

MIT License - Feel free to use and modify!
