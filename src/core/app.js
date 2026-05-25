// ROOTS PROJECT - Main Application Controller

window.app = {
    currentScreen: null,
    
    init: function() {
        window.appContainer = document.getElementById('app');
        
        // Start with intro screen
        this.showIntro();
    },
    
    showIntro: async function() {
        // Create and show intro screen
        const introEl = introComponent.create();
        appContainer.appendChild(introEl);
        
        // Animate intro
        await introComponent.animate();
        
        // After intro completes, show join screen
        state.showIntro = false;
        this.showJoinScreen();
    },
    
    showJoinScreen: async function() {
        // Clear container
        appContainer.innerHTML = '';
        
        // Create and show join screen
        const joinEl = joinComponent.create();
        appContainer.appendChild(joinEl);
        
        // Animate join screen
        await joinComponent.animate();
        
        this.currentScreen = 'join';
    },
    
    showPreJoinScreen: async function() {
        // Clear container
        appContainer.innerHTML = '';
        
        // Create and show pre-join screen
        const preJoinEl = preJoinComponent.create();
        appContainer.appendChild(preJoinEl);
        
        // Initialize pre-join (get media, setup controls)
        await preJoinComponent.initialize();
        
        // Animate
        await preJoinComponent.animate();
        
        this.currentScreen = 'prejoin';
    },
    
    showRoomScreen: async function() {
        // Clear container
        appContainer.innerHTML = '';
        
        // Create and show room screen
        const roomEl = roomComponent.create();
        appContainer.appendChild(roomEl);
        
        // Initialize room (setup PeerJS, add local video, etc.)
        roomComponent.initialize();
        
        this.currentScreen = 'room';
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
