// ROOTS PROJECT - Media Handling Utilities

window.mediaUtils = {
    // Get user media stream
    getMediaStream: async function(video = true, audio = true) {
        try {
            const constraints = {
                audio: audio ? {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } : false,
                video: video ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                } : false
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            return stream;
        } catch (err) {
            console.error('Error getting media:', err);
            throw err;
        }
    },

    // Toggle audio track
    toggleAudio: function(stream, enabled) {
        if (!stream) return;
        const audioTracks = stream.getAudioTracks();
        audioTracks.forEach(track => {
            track.enabled = enabled;
        });
        return enabled;
    },

    // Toggle video track
    toggleVideo: function(stream, enabled) {
        if (!stream) return;
        const videoTracks = stream.getAudioTracks();
        videoTracks.forEach(track => {
            track.enabled = enabled;
        });
        return enabled;
    },

    // Stop all tracks in stream
    stopStream: function(stream) {
        if (!stream) return;
        stream.getTracks().forEach(track => {
            track.stop();
        });
    },

    // Attach stream to video element
    attachStreamToVideo: function(stream, videoElement) {
        if (!videoElement) return;
        videoElement.srcObject = stream;
        videoElement.onloadedmetadata = () => {
            videoElement.play().catch(err => console.warn('Autoplay prevented:', err));
        };
    },

    // Get screen share stream
    getScreenShareStream: async function() {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 30 }
                },
                audio: false
            });
            return stream;
        } catch (err) {
            console.error('Error getting screen share:', err);
            throw err;
        }
    },

    // Check if browser supports required APIs
    checkBrowserSupport: function() {
        const support = {
            getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            getDisplayMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia),
            webRTC: !!(window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection),
            clipboard: !!(navigator.clipboard)
        };
        
        support.all = Object.values(support).every(v => v);
        return support;
    },

    // Get device list
    getDeviceList: async function() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return {
                audioInputs: devices.filter(d => d.kind === 'audioinput'),
                videoInputs: devices.filter(d => d.kind === 'videoinput'),
                audioOutputs: devices.filter(d => d.kind === 'audiooutput')
            };
        } catch (err) {
            console.error('Error getting device list:', err);
            return { audioInputs: [], videoInputs: [], audioOutputs: [] };
        }
    }
};
