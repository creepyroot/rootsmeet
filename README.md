<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# ROOTS MEET - Video Meeting Application

A full-fledged video meeting application with real-time peer-to-peer audio and video, screen sharing, and secure rooms.

## Live Demo

View the live app on GitHub Pages: [https://yourusername.github.io/your-repo-name/](https://yourusername.github.io/your-repo-name/)

## Features

- 🎥 Real-time peer-to-peer video conferencing
- 🎤 High-quality audio communication
- 🖥️ Screen sharing capabilities
- 🔒 Secure room-based meetings
- 👥 Multi-user support
- 🎨 Modern, responsive UI with Tailwind CSS
- ⚡ Built with React 19 and Vite

## Run Locally

**Prerequisites:** Node.js (v20 or later recommended)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key:
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your GEMINI_API_KEY
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

5. Preview the production build locally:
   ```bash
   npm run preview
   ```

## Deploy to GitHub Pages

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

### Setup Instructions:

1. **Enable GitHub Pages:**
   - Go to your repository Settings
   - Navigate to the "Pages" section
   - Under "Source", select "GitHub Actions"

2. **Configure Repository Name (if needed):**
   - The deployment automatically uses your repository name as the base path
   - For a user/organization site (username.github.io), rename your repository to `username.github.io`

3. **Automatic Deployment:**
   - Every push to `main` or `master` branch will trigger a deployment
   - You can also manually trigger a deployment from the Actions tab

### Manual Deployment:

You can manually trigger a deployment by going to:
- **Actions** tab → **Deploy to GitHub Pages** → **Run workflow**

## Project Structure

```
├── .github/workflows/    # GitHub Actions workflows
├── src/
│   ├── components/       # React components
│   │   ├── JoinScreen.jsx
│   │   ├── PreJoinScreen.jsx
│   │   ├── RoomScreen.jsx
│   │   └── InteractivePanel.jsx
│   ├── utils/            # Utility functions
│   │   └── audioSynth.js
│   ├── App.jsx           # Main application component
│   ├── main.jsx          # Application entry point
│   └── index.css         # Global styles
├── index.html            # HTML template
├── package.json          # Dependencies and scripts
├── vite.config.js        # Vite configuration
└── metadata.json         # Application metadata
```

## Technology Stack

- **Frontend Framework:** React 19
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS 4
- **Animations:** Motion (Framer Motion)
- **Video/Audio:** PeerJS, Simple-Peer
- **Real-time Communication:** Socket.IO
- **AI Integration:** Google Generative AI (@google/genai)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Your Gemini API key for AI features | Yes |
| `APP_URL` | The URL where the app is hosted | No |

## Browser Support

This application requires modern browsers with WebRTC support:
- Chrome/Edge (recommended)
- Firefox
- Safari

## Permissions

The application requests the following permissions:
- 📷 Camera access for video calls
- 🎤 Microphone access for audio calls
- 🖥️ Display capture for screen sharing

## License

SPDX-License-Identifier: Apache-2.0

---

Built with ❤️ using Google AI Studio
