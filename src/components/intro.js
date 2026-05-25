// ROOTS PROJECT - Intro Screen Component

window.introComponent = {
    element: null,
    
    create: function() {
        const container = document.createElement('div');
        container.className = 'intro-screen';
        container.id = 'introScreen';
        
        container.innerHTML = `
            <div class="intro-glow">
                <div class="intro-glow-circle"></div>
            </div>
            <div class="intro-content">
                <div class="intro-line-top" id="introLineTop"></div>
                <div class="intro-title-container">
                    <h1 class="intro-title" id="introTitle">ROOTS</h1>
                </div>
                <div class="intro-line-bottom" id="introLineBottom"></div>
                <p class="intro-presents" id="introPresents">GURNOOR PROJECTS Presents</p>
            </div>
        `;
        
        this.element = container;
        // Append to DOM immediately
        document.getElementById('app').appendChild(container);
        return container;
    },
    
    animate: function() {
        return new Promise((resolve) => {
            const lineTop = this.element.querySelector('#introLineTop');
            const lineBottom = this.element.querySelector('#introLineBottom');
            const title = this.element.querySelector('#introTitle');
            const presents = this.element.querySelector('#introPresents');
            
            // Animate lines
            setTimeout(() => {
                lineTop.classList.add('animate');
            }, 300);
            
            setTimeout(() => {
                lineBottom.classList.add('animate');
            }, 500);
            
            // Animate title
            setTimeout(() => {
                title.classList.add('animate');
            }, 700);
            
            // Animate presents text
            setTimeout(() => {
                presents.classList.add('animate');
            }, 1400);
            
            // Start hiding after delay
            setTimeout(() => {
                this.hide().then(resolve);
            }, 2800);
        });
    },
    
    hide: function() {
        return new Promise((resolve) => {
            if (!this.element) {
                resolve();
                return;
            }
            
            this.element.classList.add('hiding');
            
            setTimeout(() => {
                this.element.remove();
                this.element = null;
                resolve();
            }, 800);
        });
    }
};
