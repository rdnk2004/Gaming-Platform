/**
 * Advanced Bubbles Visual Engine
 * Creates interactive bubbles that React to cursor movement and pop over time or interaction.
 */

class BubbleEngine {
    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'bubble-container';
        document.body.prepend(this.container); // Prepend to sit behind content if z-index is managed

        this.bubbles = [];
        this.active = true;
        this.lastSpawn = 0;
        this.spawnRate = 50; // ms between spawns on move

        this.mouseX = 0;
        this.mouseY = 0;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        this.initToggle();
        this.bindEvents();
        this.loop();
    }

    initToggle() {
        this.toggleBtn = document.createElement('button');
        this.toggleBtn.id = 'bubble-toggle';
        this.toggleBtn.title = 'Toggle Bubbles';
        this.toggleBtn.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM11 7h2v2h-2V7zm0 4h2v6h-2v-6z"/>
            </svg>
        `; // Simple icon, can be replaced
        this.toggleBtn.onclick = () => this.toggle();
        document.body.appendChild(this.toggleBtn);

        // Load preference
        const saved = localStorage.getItem('bubblesActive');
        if (saved === 'false') this.toggle();
    }

    toggle() {
        this.active = !this.active;
        this.toggleBtn.classList.toggle('disabled', !this.active);
        localStorage.setItem('bubblesActive', this.active);

        if (!this.active) {
            // Pop all existing
            this.bubbles.forEach(b => this.popBubble(b));
        }
    }

    bindEvents() {
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;

            if (!this.active) return;

            const now = Date.now();
            const dist = Math.hypot(this.mouseX - this.lastMouseX, this.mouseY - this.lastMouseY);

            // Spawn burst if moving fast, or steady stream if moving
            if (now - this.lastSpawn > this.spawnRate && dist > 5) {
                this.spawnBubble(this.mouseX, this.mouseY, dist);
                this.lastSpawn = now;
                this.lastMouseX = this.mouseX;
                this.lastMouseY = this.mouseY;
            }
        });
    }

    spawnBubble(x, y, intensity) {
        const b = document.createElement('div');
        b.className = 'bubble';

        // Randomize size based on movement intensity (faster = bigger/more chaos)
        const size = Math.random() * 20 + 10 + Math.min(intensity * 0.5, 20);
        b.style.width = `${size}px`;
        b.style.height = `${size}px`;

        // Initial position (slightly randomized around cursor)
        const offsetX = (Math.random() - 0.5) * 20;
        const offsetY = (Math.random() - 0.5) * 20;
        b.style.left = `${x + offsetX}px`;
        b.style.top = `${y + offsetY}px`;

        // Physics properties
        b.vx = (Math.random() - 0.5) * 2 + (this.mouseX - this.lastMouseX) * 0.1;
        b.vy = (Math.random() - 0.5) * 2 - Math.random() * 2; // Tendency to float up
        b.life = 100 + Math.random() * 100; // Frames to live

        this.container.appendChild(b);
        this.bubbles.push(b);
    }

    popBubble(b) {
        if (b.popped) return;
        b.popped = true;
        b.classList.add('pop');
        setTimeout(() => {
            if (b.parentNode === this.container) {
                this.container.removeChild(b);
            }
            const index = this.bubbles.indexOf(b);
            if (index > -1) this.bubbles.splice(index, 1);
        }, 300); // Match CSS animation duration
    }

    loop() {
        if (this.active) {
            for (let i = this.bubbles.length - 1; i >= 0; i--) {
                const b = this.bubbles[i];
                if (b.popped) continue;

                // Physics update
                const rect = b.getBoundingClientRect();
                let newX = rect.left + b.vx;
                let newY = rect.top + b.vy;

                // Float up over time
                b.vy -= 0.05;
                // Friction
                b.vx *= 0.95;
                b.vy *= 0.95;

                b.style.left = `${newX}px`;
                b.style.top = `${newY}px`;

                // Life cycle
                b.life--;

                // Pop if life ends or hits top
                if (b.life <= 0 || newY < -50) {
                    this.popBubble(b);
                }
            }
        }
        requestAnimationFrame(() => this.loop());
    }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    window.bubbleEngine = new BubbleEngine();
});
