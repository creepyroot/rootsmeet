// ROOTS PROJECT - Join Screen Component

window.joinComponent = {
    element: null,
    
    create: function() {
        const container = document.createElement('div');
        container.className = 'join-screen';
        container.id = 'joinScreen';
        
        container.innerHTML = `
            <div class="bg-effects">
                <div class="bg-glow-1"></div>
                <div class="bg-glow-2"></div>
                <div class="bg-gradient-line"></div>
                <div class="bg-grid"></div>
            </div>
            
            <div class="join-left">
                <div class="brand-logo">
                    <div class="brand-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span class="brand-text">ROOTS<span style="color: var(--emerald-400);">.</span></span>
                </div>
                
                <div class="hero-content">
                    <div class="hero-badge" id="heroBadge">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Peer-to-Peer Encrypted</span>
                    </div>
                    
                    <h1 class="hero-title" id="heroTitle">
                        Connect with<br>
                        <span class="hero-highlight">Cinematic Quality</span>
                    </h1>
                    
                    <p class="hero-description" id="heroDescription">
                        Experience crystal-clear video meetings with zero latency. 
                        Built on WebRTC technology for secure, direct connections between participants.
                    </p>
                    
                    <div class="features-grid">
                        <div class="feature-item" id="feature1">
                            <div class="feature-icon-wrapper">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <span class="feature-title">End-to-End Encrypted</span>
                            <span class="feature-desc">Your data stays private</span>
                        </div>
                        
                        <div class="feature-item" id="feature2">
                            <div class="feature-icon-wrapper">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <span class="feature-title">Lightning Fast</span>
                            <span class="feature-desc">Zero-latency connections</span>
                        </div>
                        
                        <div class="feature-item" id="feature3">
                            <div class="feature-icon-wrapper">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span class="feature-title">HD Video</span>
                            <span class="feature-desc">Crystal clear quality</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="join-right">
                <div class="form-panel" id="formPanel">
                    <div class="form-glow"></div>
                    <h2 class="form-title">Join a Meeting</h2>
                    
                    <div class="form-group">
                        <label class="form-label">Your Name</label>
                        <div class="input-wrapper">
                            <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <input type="text" class="form-input" id="userNameInput" placeholder="Enter your name" autocomplete="off">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Room ID (Optional)</label>
                        <div class="input-wrapper">
                            <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            <input type="text" class="form-input tracking-wide" id="roomIdInput" placeholder="Enter room ID or leave blank" autocomplete="off" style="text-transform: uppercase; letter-spacing: 0.05em;">
                        </div>
                    </div>
                    
                    <button class="btn-create" id="btnCreateRoom" disabled>
                        Create New Room
                    </button>
                    
                    <div class="divider">
                        <div class="divider-line"></div>
                        <span class="divider-text">OR</span>
                    </div>
                    
                    <button class="btn-join secondary" id="btnJoinRoom" disabled>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Join Existing Room
                    </button>
                </div>
            </div>
        `;
        
        this.element = container;
        this.attachEventListeners();
        return container;
    },
    
    attachEventListeners: function() {
        const userNameInput = document.getElementById('userNameInput');
        const roomIdInput = document.getElementById('roomIdInput');
        const btnCreateRoom = document.getElementById('btnCreateRoom');
        const btnJoinRoom = document.getElementById('btnJoinRoom');
        
        // Validate inputs
        const validateInputs = () => {
            const nameValid = userNameInput.value.trim().length >= 2;
            const roomIdValue = roomIdInput.value.trim().toUpperCase();
            const roomIdValid = roomIdValue.length === 0 || helpers.isValidRoomId(roomIdValue);
            
            btnCreateRoom.disabled = !nameValid;
            btnJoinRoom.disabled = !(nameValid && roomIdValid && roomIdValue.length > 0);
        };
        
        userNameInput.addEventListener('input', validateInputs);
        roomIdInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
            validateInputs();
        });
        
        // Create room button
        btnCreateRoom.addEventListener('click', () => {
            const name = userNameInput.value.trim();
            if (!name) return;
            
            state.userName = name;
            state.roomId = helpers.generateRoomId();
            state.isHost = true;
            
            app.showPreJoinScreen();
        });
        
        // Join room button
        btnJoinRoom.addEventListener('click', () => {
            const name = userNameInput.value.trim();
            const roomId = roomIdInput.value.trim().toUpperCase();
            
            if (!name || !roomId) return;
            
            state.userName = name;
            state.roomId = roomId;
            state.isHost = false;
            
            app.showPreJoinScreen();
        });
    },
    
    animate: function() {
        return new Promise((resolve) => {
            const elements = [
                { id: 'heroBadge', delay: 100 },
                { id: 'heroTitle', delay: 200 },
                { id: 'heroDescription', delay: 300 },
                { id: 'feature1', delay: 400 },
                { id: 'feature2', delay: 500 },
                { id: 'feature3', delay: 600 },
                { id: 'formPanel', delay: 700 }
            ];
            
            elements.forEach(({ id, delay }) => {
                setTimeout(() => {
                    const el = document.getElementById(id);
                    if (el) el.classList.add('animate');
                }, delay);
            });
            
            setTimeout(resolve, 1000);
        });
    }
};
