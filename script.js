// ROOTS PROJECT - Video Meeting App (Vanilla JS)
const state = { showIntro: true, roomId: null, userName: '', preJoining: null, initialMedia: { mic: true, video: true }, localStream: null, peer: null, isHost: false, dataConnections: new Map(), mediaConnections: new Map(), peers: [], isMuted: false, isVideoOff: false, messages: [], showChat: false };
let appContainer;
