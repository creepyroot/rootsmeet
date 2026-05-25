// ROOTS PROJECT - Room Screen Component

window.roomComponent = {
    element: null,
    
    create: function() {
        const container = document.createElement('div');
        container.className = 'room-screen';
        container.id = 'roomScreen';
        
        container.innerHTML = `
            <div class="bg-effects">
                <div class="bg-glow-1"></div>
                <div class="bg-glow-2"></div>
                <div class="bg-gradient-line"></div>
                <div class="bg-grid"></div>
            </div>
            
            <div class="room-header">
                <div class="room-header-left">
                    <div class="brand-logo" style="position: static; margin: 0;">
                        <div class="brand-icon" style="width: 2rem; height: 2rem;">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                    <span class="room-header-title">ROOTS Meeting</span>
                    <span class="room-header-id" id="roomIdDisplay">${state.roomId}</span>
                </div>
                <div class="room-header-actions">
                    <button class="btn-icon" id="btnCopyRoomId" title="Copy Room ID">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>
                    <button class="btn-icon" id="btnToggleChat" title="Toggle Chat">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </button>
                    <button class="btn-icon" id="btnParticipants" title="Participants">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </button>
                </div>
            </div>
            
            <div class="video-grid-container grid-1" id="videoGrid">
                <!-- Local video will be added here -->
            </div>
            
            <div class="room-controls">
                <button class="control-btn ${state.isMuted ? '' : 'active'}" id="btnToggleMic" title="Toggle Microphone">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-12v3m0 0v.01M12 16.5v.01M12 12.5v.01M12 8.5v.01M12 4.5v.01" />
                    </svg>
                </button>
                
                <button class="control-btn ${state.isVideoOff ? '' : 'active'}" id="btnToggleVideo" title="Toggle Camera">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </button>
                
                <button class="control-btn" id="btnScreenShare" title="Share Screen">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </button>
                
                <button class="control-btn" id="btnRaiseHand" title="Raise Hand">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                    </svg>
                </button>
                
                <button class="control-btn" id="btnReactions" title="Send Reaction">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
                
                <button class="control-btn danger" id="btnLeave" title="Leave Meeting">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                    </svg>
                </button>
            </div>
            
            <div class="chat-panel" id="chatPanel">
                <div class="chat-header">
                    <span class="chat-header-title">Chat</span>
                    <button class="btn-icon" id="btnCloseChat" style="width: 2rem; height: 2rem;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="chat-messages" id="chatMessages"></div>
                <div class="chat-input-area">
                    <input type="text" class="chat-input" id="chatInput" placeholder="Type a message...">
                    <button class="btn-send" id="btnSendMessage">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </div>
            
            <div class="participants-panel" id="participantsPanel">
                <div class="participants-header">
                    <span class="chat-header-title">Participants</span>
                    <span class="participants-count" id="participantsCount">1 participant</span>
                </div>
                <div class="participants-list" id="participantsList"></div>
            </div>
            
            <div class="reaction-container" id="reactionContainer"></div>
        `;
        
        this.element = container;
        // Append to DOM immediately
        document.getElementById('app').appendChild(container);
        container.style.display = 'none';
        return container;
    },
    
    initialize: function() {
        // Add local video
        this.addLocalVideo();
        
        // Setup event listeners using element context
        this.setupEventListeners();
        
        // Initialize PeerJS connection
        this.initializePeer();
    },
    
    addLocalVideo: function() {
        const videoGrid = this.element.querySelector('#videoGrid');
        const videoItem = document.createElement('div');
        videoItem.className = 'video-item';
        videoItem.id = 'localVideoItem';
        
        if (state.localStream && !state.isVideoOff) {
            const video = document.createElement('video');
            video.id = 'localVideoRoom';
            video.autoplay = true;
            video.muted = true;
            video.playsInline = true;
            video.style.transform = 'scaleX(-1)';
            
            videoItem.appendChild(video);
            
            setTimeout(() => {
                const vidEl = this.element.querySelector('#localVideoRoom');
                if (vidEl && state.localStream) {
                    mediaUtils.attachStreamToVideo(state.localStream, vidEl);
                }
            }, 100);
        } else {
            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'video-item-avatar';
            avatarDiv.style.background = helpers.getColorFromString(state.userName);
            avatarDiv.innerHTML = `<span style="font-size: 2rem; font-weight: 700; color: var(--bg-primary);">${helpers.getInitials(state.userName)}</span>`;
            videoItem.appendChild(avatarDiv);
        }
        
        const nameTag = document.createElement('div');
        nameTag.className = 'video-item-name';
        nameTag.textContent = `${state.userName} (You)`;
        videoItem.appendChild(nameTag);
        
        videoGrid.appendChild(videoItem);
    },
    
    setupEventListeners: function() {
        const root = this.element;
        
        // Toggle microphone
        root.querySelector('#btnToggleMic').addEventListener('click', () => {
            state.isMuted = !state.isMuted;
            const btn = root.querySelector('#btnToggleMic');
            btn.classList.toggle('active', !state.isMuted);
            
            if (state.localStream) {
                const audioTracks = state.localStream.getAudioTracks();
                audioTracks.forEach(track => {
                    track.enabled = !state.isMuted;
                });
            }
        });
        
        // Toggle video
        root.querySelector('#btnToggleVideo').addEventListener('click', () => {
            state.isVideoOff = !state.isVideoOff;
            const btn = root.querySelector('#btnToggleVideo');
            btn.classList.toggle('active', !state.isVideoOff);
            
            if (state.localStream) {
                const videoTracks = state.localStream.getVideoTracks();
                videoTracks.forEach(track => {
                    track.enabled = !state.isVideoOff;
                });
            }
            
            // Update local video display
            const localVideoItem = root.querySelector('#localVideoItem');
            if (localVideoItem) {
                localVideoItem.remove();
            }
            this.addLocalVideo();
        });
        
        // Copy room ID
        root.querySelector('#btnCopyRoomId').addEventListener('click', async () => {
            await helpers.copyToClipboard(state.roomId);
            helpers.showToast('Room ID copied!', 'success');
        });
        
        // Toggle chat
        root.querySelector('#btnToggleChat').addEventListener('click', () => {
            const chatPanel = root.querySelector('#chatPanel');
            chatPanel.classList.toggle('open');
            state.showChat = !state.showChat;
        });
        
        root.querySelector('#btnCloseChat').addEventListener('click', () => {
            const chatPanel = root.querySelector('#chatPanel');
            chatPanel.classList.remove('open');
            state.showChat = false;
        });
        
        // Toggle participants
        root.querySelector('#btnParticipants').addEventListener('click', () => {
            const panel = root.querySelector('#participantsPanel');
            panel.classList.toggle('open');
        });
        
        // Screen share
        root.querySelector('#btnScreenShare').addEventListener('click', async () => {
            try {
                const screenStream = await mediaUtils.getScreenShareStream();
                helpers.showToast('Screen sharing started', 'success');
                
                // Stop screen share when user clicks done
                screenStream.getVideoTracks()[0].onended = () => {
                    helpers.showToast('Screen sharing stopped', 'info');
                };
            } catch (err) {
                console.error('Screen share error:', err);
            }
        });
        
        // Raise hand
        root.querySelector('#btnRaiseHand').addEventListener('click', () => {
            helpers.showToast('Hand raised!', 'info');
            // Send signal to other peers
            this.sendDataToAll({ type: 'raiseHand', userId: state.peer.id });
        });
        
        // Reactions
        root.querySelector('#btnReactions').addEventListener('click', () => {
            this.showReactionPicker();
        });
        
        // Leave meeting
        root.querySelector('#btnLeave').addEventListener('click', () => {
            this.leaveMeeting();
        });
        
        // Chat input
        const chatInput = root.querySelector('#chatInput');
        const btnSendMessage = root.querySelector('#btnSendMessage');
        
        const sendMessage = () => {
            const text = chatInput.value.trim();
            if (!text) return;
            
            this.addChatMessage(state.userName, text, true);
            this.sendDataToAll({ type: 'chat', userId: state.peer.id, userName: state.userName, text: text });
            
            chatInput.value = '';
        };
        
        btnSendMessage.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    },
    
    initializePeer: function() {
        try {
            // Create Peer instance
            state.peer = new Peer(state.roomId + '_' + state.peer.id || undefined, {
                debug: 2
            });
            
            state.peer.on('open', (id) => {
                console.log('My peer ID is: ' + id);
                helpers.playSound('join');
                
                // If host, wait for others to connect
                // If not host, connect to host
                if (!state.isHost) {
                    this.connectToHost();
                }
                
                this.updateParticipantsList();
            });
            
            state.peer.on('connection', (conn) => {
                this.handleDataConnection(conn);
            });
            
            state.peer.on('call', (call) => {
                this.handleMediaCall(call);
            });
            
            state.peer.on('error', (err) => {
                console.error('Peer error:', err);
                helpers.showToast('Connection error: ' + err.type, 'error');
            });
        } catch (err) {
            console.error('Peer initialization error:', err);
        }
    },
    
    connectToHost: function() {
        // Connect to host's data connection
        const hostId = state.roomId + '_host';
        const conn = state.peer.connect(hostId);
        this.handleDataConnection(conn);
        
        // Call host for media
        const call = state.peer.call(hostId, state.localStream);
        this.handleMediaCall(call);
    },
    
    handleDataConnection: function(conn) {
        state.dataConnections.set(conn.peer, conn);
        
        conn.on('open', () => {
            console.log('Data connection opened with:', conn.peer);
            this.updateParticipantsList();
        });
        
        conn.on('data', (data) => {
            this.handleDataMessage(data);
        });
        
        conn.on('close', () => {
            state.dataConnections.delete(conn.peer);
            this.updateParticipantsList();
        });
    },
    
    handleMediaCall: function(call) {
        call.answer(state.localStream);
        
        call.on('stream', (remoteStream) => {
            this.addRemoteVideo(remoteStream, call.peer);
        });
        
        state.mediaConnections.set(call.peer, call);
    },
    
    addRemoteVideo: function(stream, peerId) {
        const videoGrid = this.element.querySelector('#videoGrid');
        const videoItem = document.createElement('div');
        videoItem.className = 'video-item';
        videoItem.id = 'video-' + peerId;
        
        const video = document.createElement('video');
        video.autoplay = true;
        video.playsInline = true;
        videoItem.appendChild(video);
        
        const nameTag = document.createElement('div');
        nameTag.className = 'video-item-name';
        nameTag.textContent = 'Participant';
        videoItem.appendChild(nameTag);
        
        videoGrid.appendChild(videoItem);
        
        // Attach stream
        setTimeout(() => {
            mediaUtils.attachStreamToVideo(stream, video);
        }, 100);
        
        // Update grid layout
        this.updateGridLayout();
        this.updateParticipantsList();
    },
    
    sendDataToAll: function(data) {
        state.dataConnections.forEach((conn) => {
            if (conn.open) {
                conn.send(data);
            }
        });
    },
    
    handleDataMessage: function(data) {
        switch (data.type) {
            case 'chat':
                this.addChatMessage(data.userName, data.text, false);
                helpers.playSound('message');
                break;
            case 'raiseHand':
                helpers.showToast('Someone raised their hand', 'info');
                helpers.playSound('join');
                break;
            case 'reaction':
                this.showReaction(data.emoji, data.x, data.y);
                helpers.playSound('reaction');
                break;
        }
    },
    
    addChatMessage: function(sender, text, isLocal) {
        const chatMessages = this.element.querySelector('#chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        
        messageDiv.innerHTML = `
            <span class="chat-message-sender">${sender}</span>
            <span class="chat-message-text">${this.escapeHtml(text)}</span>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    },
    
    showReactionPicker: function() {
        const emojis = ['👍', '❤️', '😂', '😮', '😢', '🎉'];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        const x = Math.random() * window.innerWidth;
        const y = window.innerHeight - 200 - Math.random() * 200;
        
        this.showReaction(emoji, x, y);
        this.sendDataToAll({ type: 'reaction', emoji, x, y });
    },
    
    showReaction: function(emoji, x, y) {
        const container = this.element.querySelector('#reactionContainer');
        const reaction = document.createElement('div');
        reaction.className = 'reaction';
        reaction.textContent = emoji;
        reaction.style.left = x + 'px';
        reaction.style.top = y + 'px';
        
        container.appendChild(reaction);
        
        setTimeout(() => {
            reaction.remove();
        }, 3000);
    },
    
    updateGridLayout: function() {
        const videoGrid = this.element.querySelector('#videoGrid');
        const count = videoGrid.children.length;
        
        videoGrid.className = 'video-grid-container';
        if (count === 1) videoGrid.classList.add('grid-1');
        else if (count === 2) videoGrid.classList.add('grid-2');
        else if (count <= 4) videoGrid.classList.add('grid-4');
        else videoGrid.classList.add('grid-3');
    },
    
    updateParticipantsList: function() {
        const list = this.element.querySelector('#participantsList');
        const count = state.dataConnections.size + 1;
        
        this.element.querySelector('#participantsCount').textContent = `${count} participant${count !== 1 ? 's' : ''}`;
        
        list.innerHTML = `
            <div class="participant-item">
                <div class="participant-avatar" style="background: ${helpers.getColorFromString(state.userName)}">
                    ${helpers.getInitials(state.userName)}
                </div>
                <div class="participant-info">
                    <div class="participant-name">${state.userName} (You)</div>
                    <div class="participant-role">${state.isHost ? 'Host' : 'Participant'}</div>
                </div>
                <div class="participant-status">
                    <div class="status-dot-small ${!state.isMuted ? 'mic-on' : ''}"></div>
                    <div class="status-dot-small ${!state.isVideoOff ? 'video-on' : ''}"></div>
                </div>
            </div>
        `;
        
        state.dataConnections.forEach((conn, peerId) => {
            const item = document.createElement('div');
            item.className = 'participant-item';
            item.innerHTML = `
                <div class="participant-avatar" style="background: var(--emerald-500)">
                    P${peerId.substring(0, 2).toUpperCase()}
                </div>
                <div class="participant-info">
                    <div class="participant-name">Participant</div>
                    <div class="participant-role">Participant</div>
                </div>
                <div class="participant-status">
                    <div class="status-dot-small mic-on"></div>
                    <div class="status-dot-small video-on"></div>
                </div>
            `;
            list.appendChild(item);
        });
    },
    
    escapeHtml: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    leaveMeeting: function() {
        // Close all connections
        state.dataConnections.forEach((conn) => conn.close());
        state.mediaConnections.forEach((call) => call.close());
        
        if (state.peer) {
            state.peer.destroy();
        }
        
        if (state.localStream) {
            mediaUtils.stopStream(state.localStream);
        }
        
        // Reset state
        state.roomId = null;
        state.localStream = null;
        state.peer = null;
        state.dataConnections.clear();
        state.mediaConnections.clear();
        
        // Go back to join screen
        app.showJoinScreen();
    }
};
