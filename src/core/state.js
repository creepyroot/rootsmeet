// ROOTS PROJECT - Global State Management
window.state = {
    showIntro: true,
    roomId: null,
    userName: '',
    preJoining: null,
    initialMedia: { mic: true, video: true },
    localStream: null,
    peer: null,
    isHost: false,
    dataConnections: new Map(),
    mediaConnections: new Map(),
    peers: [],
    isMuted: false,
    isVideoOff: false,
    messages: [],
    showChat: false,
    raisedHands: new Set(),
    reactions: []
};

// App container reference
window.appContainer = null;

// Utility to update state and trigger re-renders if needed
window.updateState = function(key, value) {
    window.state[key] = value;
};
