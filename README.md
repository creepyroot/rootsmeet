# ROOTS PROJECT - Cinematic Video Meetings

A beautiful, cinematic peer-to-peer video meeting application built with pure vanilla JavaScript.

## Features

- 🎬 **Cinematic UI** - Beautiful dark theme with emerald accents and smooth animations
- 🔒 **Peer-to-Peer Encrypted** - Direct WebRTC connections between participants
- ⚡ **Lightning Fast** - Zero-latency connections
- 📹 **HD Video** - Crystal clear quality
- 💬 **Real-time Chat** - Built-in messaging system
- 👋 **Raise Hand** - Interactive meeting controls
- 🎉 **Reactions** - Send emoji reactions during meetings
- 🖥️ **Screen Sharing** - Share your screen with others

## File Structure

```
/workspace
├── index.html              # Main entry point
├── style.css               # Complete styling (2200+ lines)
├── src/
│   ├── core/
│   │   ├── app.js          # Application controller
│   │   └── state.js        # Global state management
│   ├── utils/
│   │   ├── helpers.js      # Utility functions
│   │   └── media.js        # Media handling utilities
│   └── components/
│       ├── intro.js        # Intro screen component
│       ├── join.js         # Join screen component
│       ├── prejoin.js      # Pre-join screen component
│       └── room.js         # Meeting room component
└── .github/workflows/
    └── deploy.yml          # GitHub Pages deployment
```

## Deployment to GitHub Pages

### Option 1: Automatic Deployment (Recommended)

The repository includes a GitHub Actions workflow that automatically deploys to GitHub Pages when you push to the `main` branch.

1. Push your code to GitHub
2. Go to Repository Settings → Pages
3. Select "GitHub Actions" as the source
4. The workflow will automatically deploy on every push to main

### Option 2: Manual Deployment

1. Go to Repository Settings → Pages
2. Under "Source", select "Deploy from a branch"
3. Select branch: `main`, folder: `/ (root)`
4. Click Save
5. Your site will be deployed at `https://yourusername.github.io/repository-name/`

## Local Development

To test locally, you need to serve the files over HTTP (not file://):

```bash
# Using Python 3
python3 -m http.server 8000

# Or using Node.js
npx serve .

# Or using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

**Important:** Camera and microphone permissions only work on HTTPS or localhost.

## Usage

1. Open the app in your browser
2. Wait for the cinematic intro animation
3. Enter your name
4. Create a new room or join an existing one with a Room ID
5. Preview your video and audio
6. Click "Join Now" to enter the meeting
7. Share the Room ID with others to invite them

## Technology Stack

- **Pure Vanilla JavaScript** - No frameworks or build tools
- **WebRTC** - Peer-to-peer video/audio connections
- **PeerJS** - Simplified WebRTC API
- **CSS3** - Modern styling with custom properties
- **Google Fonts** - Inter and JetBrains Mono

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

MIT License - Feel free to use and modify!

---

**Built with ❤️ by GURNOOR PROJECTS**
