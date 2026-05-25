// ROOTS PROJECT - Helper Utilities

window.helpers = {
    // Generate random room ID
    generateRoomId: function() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    },

    // Generate random name
    generateName: function() {
        const adjectives = ['Swift', 'Calm', 'Bold', 'Wise', 'Bright', 'Keen', 'Sharp', 'Quick'];
        const nouns = ['Eagle', 'Tiger', 'Wolf', 'Hawk', 'Lion', 'Bear', 'Fox', 'Owl'];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        return `${adj}${noun}${Math.floor(Math.random() * 100)}`;
    },

    // Format time
    formatTime: function(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },

    // Check if valid room ID
    isValidRoomId: function(id) {
        return id && id.length >= 4 && id.length <= 10;
    },

    // Copy to clipboard
    copyToClipboard: async function(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        }
    },

    // Create element with classes and content
    createElement: function(tag, className = '', content = '') {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (content) el.textContent = content;
        return el;
    },

    // Show toast notification
    showToast: function(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('toast-show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Play sound effect
    playSound: function(type) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        if (type === 'join') {
            oscillator.frequency.value = 523.25; // C5
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } else if (type === 'message') {
            oscillator.frequency.value = 880; // A5
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
        } else if (type === 'reaction') {
            oscillator.frequency.value = 659.25; // E5
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        }
    },

    // Debounce function
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Get initials from name
    getInitials: function(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    },

    // Get color from string
    getColorFromString: function(str) {
        const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444', '#14B8A6', '#6366F1'];
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }
};
