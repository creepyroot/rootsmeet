// ROOTS PROJECT - Pre-Join Screen Component

window.preJoinComponent = {
    element: null,
    
    create: function() {
        const container = document.createElement('div');
        container.className = 'prejoin-screen';
        container.id = 'preJoinScreen';
        
        container.innerHTML = `
            <div class="bg-effects">
                <div class="bg-glow-1"></div>
                <div class="bg-glow-2"></div>
                <div class="bg-gradient-line"></div>
                <div class="bg-grid"></div>
            </div>
            
            <div class="prejoin-panel">
                <div class="video-preview-container">
                    <video id="localVideo" autoplay muted playsinline></video>
                    <div class="avatar-placeholder" id="avatarPlaceholder" style="display: none;">
                        <div class="avatar-glow"></div>
                        <div class="avatar-breathing-glow"></div>
                        <div class="avatar-circle" id="avatarCircle">
                            <span id="avatarInitials"></span>
                        </div>
                        <p class="avatar-name" id="avatarNameDisplay"></p>
                    </div>
                </div>
                
                <div class="controls-section">
                    <div class="room-info">
                        <span class="room-label">Room ID</span>
                        <div class="room-id-display" id="roomIdDisplay">
                            ${state.roomId}
                            <button class="copy-room-btn" id="copyRoomBtn" title="Copy Room ID">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="user-info">
                        <span class="room-label">Your Name</span>
                        <p class="user-name-display">${state.userName}</p>
                    </div>
                    
                    <div class="media-toggles">
                        <button class="toggle-btn" id="toggleMic" data-enabled="true">
                            <div class="toggle-icon-wrapper">
                                <svg class="toggle-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-12v3m0 0v.01M12 16.5v.01M12 12.5v.01M12 8.5v.01M12 4.5v.01" />
                                </svg>
                                <svg class="toggle-icon-off" style="display: none;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                </svg>
                            </div>
                            <span class="toggle-label">Mic</span>
                            <span class="toggle-status" id="micStatus">On</span>
                        </button>
                        
                        <button class="toggle-btn" id="toggleCamera" data-enabled="true">
                            <div class="toggle-icon-wrapper">
                                <svg class="toggle-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <svg class="toggle-icon-off" style="display: none;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                            </div>
                            <span class="toggle-label">Camera</span>
                            <span class="toggle-status" id="cameraStatus">On</span>
                        </button>
                    </div>
                    
                    <div class="action-buttons">
                        <button class="btn-join primary" id="btnJoinNow">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Join Now
                        </button>
                        
                        <button class="btn-join secondary" id="btnBack">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        this.element = container;
        // Append to DOM immediately
        document.getElementById('app').appendChild(container);
        container.style.display = 'none';
        return container;
    },
    
    initialize: async function() {
        const localVideo = this.element.querySelector('#localVideo');
        const avatarPlaceholder = this.element.querySelector('#avatarPlaceholder');
        const avatarCircle = this.element.querySelector('#avatarCircle');
        const avatarInitials = this.element.querySelector('#avatarInitials');
        const avatarNameDisplay = this.element.querySelector('#avatarNameDisplay');
        const toggleMic = this.element.querySelector('#toggleMic');
        const toggleCamera = this.element.querySelector('#toggleCamera');
        const micStatus = this.element.querySelector('#micStatus');
        const cameraStatus = this.element.querySelector('#cameraStatus');
        const btnJoinNow = this.element.querySelector('#btnJoinNow');
        const btnBack = this.element.querySelector('#btnBack');
        const copyRoomBtn = this.element.querySelector('#copyRoomBtn');
        
        // Set avatar info
        avatarInitials.textContent = helpers.getInitials(state.userName);
        avatarNameDisplay.textContent = state.userName;
        avatarCircle.style.background = helpers.getColorFromString(state.userName);
        
        // Get media stream
        try {
            state.localStream = await mediaUtils.getMediaStream(true, true);
            mediaUtils.attachStreamToVideo(state.localStream, localVideo);
            avatarPlaceholder.style.display = 'none';
            localVideo.style.display = 'block';
        } catch (err) {
            console.error('Error getting media:', err);
            localVideo.style.display = 'none';
            avatarPlaceholder.style.display = 'flex';
        }
        
        // Toggle microphone
        toggleMic.addEventListener('click', () => {
            if (!state.localStream) return;
            
            const isEnabled = toggleMic.dataset.enabled === 'true';
            const newEnabled = !isEnabled;
            
            const audioTracks = state.localStream.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = newEnabled;
            });
            
            toggleMic.dataset.enabled = newEnabled.toString();
            toggleMic.querySelector('.toggle-icon').style.display = newEnabled ? 'block' : 'none';
            toggleMic.querySelector('.toggle-icon-off').style.display = newEnabled ? 'none' : 'block';
            micStatus.textContent = newEnabled ? 'On' : 'Off';
            micStatus.style.color = newEnabled ? 'var(--emerald-400)' : 'var(--red-500)';
            
            state.isMuted = !newEnabled;
        });
        
        // Toggle camera
        toggleCamera.addEventListener('click', () => {
            if (!state.localStream) return;
            
            const isEnabled = toggleCamera.dataset.enabled === 'true';
            const newEnabled = !isEnabled;
            
            const videoTracks = state.localStream.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = newEnabled;
            });
            
            toggleCamera.dataset.enabled = newEnabled.toString();
            toggleCamera.querySelector('.toggle-icon').style.display = newEnabled ? 'block' : 'none';
            toggleCamera.querySelector('.toggle-icon-off').style.display = newEnabled ? 'none' : 'block';
            cameraStatus.textContent = newEnabled ? 'On' : 'Off';
            cameraStatus.style.color = newEnabled ? 'var(--emerald-400)' : 'var(--red-500)';
            
            if (newEnabled) {
                localVideo.style.display = 'block';
                avatarPlaceholder.style.display = 'none';
            } else {
                localVideo.style.display = 'none';
                avatarPlaceholder.style.display = 'flex';
            }
            
            state.isVideoOff = !newEnabled;
        });
        
        // Copy room ID
        copyRoomBtn.addEventListener('click', async () => {
            await helpers.copyToClipboard(state.roomId);
            helpers.showToast('Room ID copied!', 'success');
        });
        
        // Join now button
        btnJoinNow.addEventListener('click', () => {
            app.showRoomScreen();
        });
        
        // Back button
        btnBack.addEventListener('click', () => {
            if (state.localStream) {
                mediaUtils.stopStream(state.localStream);
                state.localStream = null;
            }
            app.showJoinScreen();
        });
    },
    
    animate: function() {
        return new Promise((resolve) => {
            const panel = document.querySelector('.prejoin-panel');
            if (panel) {
                setTimeout(() => {
                    panel.classList.add('animate');
                }, 100);
            }
            setTimeout(resolve, 500);
        });
    }
};
