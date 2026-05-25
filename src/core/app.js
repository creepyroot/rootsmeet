// ROOTS PROJECT - Main Application Controller

window.app = {
    currentScreen: null,
    
    init: function() {
        this.appContainer = document.getElementById('app');
        
        // Start with intro screen
        this.showIntro();
    },
    
    showIntro: async function() {
        // Create and show intro screen
        const introEl = introComponent.create();
        // introComponent already appends to DOM
        
        // Animate intro
        await introComponent.animate();
        
        // After intro completes, show join screen
        state.showIntro = false;
        this.showJoinScreen();
    },
    
    showJoinScreen: async function() {
        // Clear container (but keep existing elements that might be there)
        while (this.appContainer.firstChild) {
            this.appContainer.removeChild(this.appContainer.firstChild);
        }
        
        // Create and show join screen (already appends itself)
        const joinEl = joinComponent.create();
        
        // Show the join screen
        joinEl.style.display = 'flex';
        
        // Animate join screen
        await joinComponent.animate();
        
        this.currentScreen = 'join';
    },
    
    showPreJoinScreen: async function() {
        // Clear container
        while (this.appContainer.firstChild) {
            this.appContainer.removeChild(this.appContainer.firstChild);
        }
        
        // Create and show pre-join screen (already appends itself)
        const preJoinEl = preJoinComponent.create();
        
        // Initialize pre-join (get media, setup controls)
        await preJoinComponent.initialize();
        
        // Show and animate
        preJoinEl.style.display = 'flex';
        await preJoinComponent.animate();
        
        this.currentScreen = 'prejoin';
    },
    
    showRoomScreen: async function() {
        // Clear container
        while (this.appContainer.firstChild) {
            this.appContainer.removeChild(this.appContainer.firstChild);
        }
        
        // Create and show room screen (already appends itself)
        const roomEl = roomComponent.create();
        
        // Show the room screen
        roomEl.style.display = 'block';
        
        // Initialize room (setup PeerJS, add local video, etc.)
        roomComponent.initialize();
        
        this.currentScreen = 'room';
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
