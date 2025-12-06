/**
 * HYPER SNAKE ENGINE
 * Vector-based movement, particle systems, and organic procedural animation.
 */

// --- Configuration ---
const CONFIG = {
    baseSpeed: 3.5,
    sprintSpeed: 6.5,
    turnSpeed: 0.12, // Radians per frame
    segmentDist: 10,  // Distance between body nodes
    startLength: 15,
    growthPerFood: 5,
    wallsEnabled: true,
    colors: {
        p1: { main: '#00f260', dark: '#008f39', glow: 'rgba(0, 242, 96, 0.4)' },
        p2: { main: '#0575e6', dark: '#021b79', glow: 'rgba(5, 117, 230, 0.4)' },
        food: '#ff0055',
        bubble: '#00d2ff',
        grid: 'rgba(255,255,255,0.03)'
    }
};

// --- Utils ---
const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
const rand = (min, max) => Math.random() * (max - min) + min;
const lerp = (a, b, t) => a + (b - a) * t;

// --- Game State ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false }); // Optimize
let width, height;
let animationId;
let lastTime = 0;
let isPaused = true;
let isGameOver = false;
let mode = 1; // 1 or 2 players

// --- Input Handling ---
const keys = {};
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// --- Classes ---

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = rand(1, 4);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = rand(0.02, 0.05);
        this.color = color;
        this.size = rand(2, 5);
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95; this.vy *= 0.95;
        this.life -= this.decay;
    }
    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class Food {
    constructor() {
        this.respawn();
        this.pulse = 0;
    }
    respawn() {
        const margin = 50;
        this.x = rand(margin, width - margin);
        this.y = rand(margin, height - margin);
        this.color = CONFIG.colors.food;
    }
    update(time) {
        this.pulse = Math.sin(time * 0.005) * 3;
    }
    draw(ctx) {
        // Glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;

        // Core
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 8 + this.pulse, 0, Math.PI * 2);
        ctx.fill();

        // Ring
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 12 - this.pulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.shadowBlur = 0;
    }
}

class BigBubble {
    constructor() {
        const margin = 60;
        this.x = rand(margin, width - margin);
        this.y = rand(margin, height - margin);
        this.size = 20;
        this.life = 600; // Frames (~10 seconds)
        this.maxLife = 600;
        this.color = CONFIG.colors.bubble;
    }
    update() {
        this.life--;
    }
    draw(ctx) {
        const alpha = this.life / 100; // Fade out near end
        ctx.globalAlpha = Math.min(1, alpha);

        ctx.shadowBlur = 25;
        ctx.shadowColor = this.color;

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Shine
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 5, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

class PowerUp {
    constructor() {
        const margin = 60;
        this.x = rand(margin, width - margin);
        this.y = rand(margin, height - margin);
        this.type = Math.random() < 0.5 ? 'speed' : 'ghost';
        this.size = 18;
        this.life = 600;
        this.color = this.type === 'speed' ? '#fbbf24' : '#a855f7'; // Yellow or Purple
        this.icon = this.type === 'speed' ? '⚡' : '👻';
    }
    update() {
        this.life--;
    }
    draw(ctx) {
        const alpha = this.life / 100;
        ctx.globalAlpha = Math.min(1, alpha);

        // Glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;

        // Base
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Icon
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, this.x, this.y + 2);

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

class Snake {
    constructor(id, startX, startY, colorProfile, controlScheme) {
        this.id = id;
        this.alive = true;
        this.score = 0;
        this.orbsEaten = 0;
        this.color = colorProfile;
        this.controls = controlScheme; // 'arrows' or 'wasd'

        // Physics
        this.angle = this.controls === 'arrows' ? Math.PI : 0;
        this.targetAngle = this.angle;
        this.speed = CONFIG.baseSpeed;

        // Body (Array of Vectors)
        this.head = { x: startX, y: startY };
        this.segments = [];

        // Initialize body behind the head based on starting angle
        const dirX = Math.cos(this.angle + Math.PI);
        const dirY = Math.sin(this.angle + Math.PI);

        for (let i = 1; i <= CONFIG.startLength; i++) {
            this.segments.push({
                x: startX + dirX * i * CONFIG.segmentDist,
                y: startY + dirY * i * CONFIG.segmentDist
            });
        }

        // Visuals
        this.width = 16;
        this.tongueTimer = 0;
        this.effects = { speed: 0, ghost: 0 };
    }

    update(dt, enemySnake) {
        if (!this.alive) return;

        // 1. Handle Input (Smooth Turning)
        let turn = 0;
        let boost = false;

        if (this.controls === 'arrows') {
            if (keys['arrowleft']) turn = -1;
            if (keys['arrowright']) turn = 1;
            if (keys['arrowup']) this.targetAngle = -Math.PI / 2;
            else if (keys['arrowdown']) this.targetAngle = Math.PI / 2;
            else if (keys['arrowleft']) this.targetAngle = Math.PI;
            else if (keys['arrowright']) this.targetAngle = 0;

            if (keys['shift']) boost = true;
        }
        else if (this.controls === 'wasd') {
            if (keys['w']) this.targetAngle = -Math.PI / 2;
            else if (keys['s']) this.targetAngle = Math.PI / 2;
            else if (keys['a']) this.targetAngle = Math.PI;
            else if (keys['d']) this.targetAngle = 0;

            if (keys[' ']) boost = true;
        }

        // Normalize angles for shortest rotation
        let diff = this.targetAngle - this.angle;
        while (diff <= -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        // Smoothly rotate current angle towards target
        this.angle += diff * CONFIG.turnSpeed;

        // Speed handling
        let base = CONFIG.baseSpeed;
        if (this.effects.speed > 0) base = CONFIG.sprintSpeed + 2;
        const currentSpeed = boost ? CONFIG.sprintSpeed : base;

        // Update Effects
        if (this.effects.speed > 0) this.effects.speed--;
        if (this.effects.ghost > 0) this.effects.ghost--;

        // 2. Move Head
        // Calculate move distance based on time (normalize to 60fps)
        const fps = 60;
        const moveDist = currentSpeed * (dt / (1000 / fps));

        const velocityX = Math.cos(this.angle) * moveDist;
        const velocityY = Math.sin(this.angle) * moveDist;

        // Store previous head pos for constraints
        const prevHead = { ...this.head };

        this.head.x += velocityX;
        this.head.y += velocityY;

        // 3. Wall Collision
        if (CONFIG.wallsEnabled && this.effects.ghost <= 0) {
            if (this.head.x < 0 || this.head.x > width || this.head.y < 0 || this.head.y > height) {
                console.log(`Snake ${this.id} died: Wall collision at ${this.head.x}, ${this.head.y}`);
                this.die();
            }
        } else {
            // Wrap around
            if (this.head.x < 0) this.head.x = width;
            if (this.head.x > width) this.head.x = 0;
            if (this.head.y < 0) this.head.y = height;
            if (this.head.y > height) this.head.y = 0;
        }

        // 4. Update Body Segments (Inverse Kinematics / Follow the Leader)
        // The first segment follows the head
        this.dragSegment(0, this.head.x, this.head.y);
        // The rest follow the previous segment
        for (let i = 1; i < this.segments.length; i++) {
            this.dragSegment(i, this.segments[i - 1].x, this.segments[i - 1].y);
        }

        // 5. Self Collision (Start checking from segment 4 to avoid head hitting neck)
        if (this.effects.ghost <= 0) {
            for (let i = 4; i < this.segments.length; i++) {
                if (dist(this.head.x, this.head.y, this.segments[i].x, this.segments[i].y) < this.width / 1.5) {
                    console.log(`Snake ${this.id} died: Self collision at segment ${i}`);
                    this.die();
                }
            }
        }

        // 6. Enemy Collision
        if (enemySnake && enemySnake.alive && this.effects.ghost <= 0) {
            // Head to Body
            for (let seg of enemySnake.segments) {
                if (dist(this.head.x, this.head.y, seg.x, seg.y) < this.width) {
                    this.die();
                    unlockAchievement('hunter');
                }
            }

            // Head to Head
            if (dist(this.head.x, this.head.y, enemySnake.head.x, enemySnake.head.y) < this.width * 1.5) {
                if (this.segments.length < enemySnake.segments.length) {
                    this.die();
                    unlockAchievement('hunter'); // Enemy wins
                } else if (this.segments.length > enemySnake.segments.length) {
                    enemySnake.die();
                    unlockAchievement('hunter'); // I win
                } else {
                    this.die();
                    enemySnake.die();
                }
            }
        }
    }

    dragSegment(i, tx, ty) {
        const seg = this.segments[i];
        const d = dist(seg.x, seg.y, tx, ty);
        if (d === 0) return; // Prevent division by zero or weird jumps

        // Fix for wrap-around visual glitch: if distance is huge, snap to target
        if (d > 100) {
            seg.x = tx;
            seg.y = ty;
        }
        const angle = Math.atan2(ty - seg.y, tx - seg.x);
        seg.x = tx - Math.cos(angle) * CONFIG.segmentDist;
        seg.y = ty - Math.sin(angle) * CONFIG.segmentDist;
    }

    grow() {
        // Add segments to the tail at the same position as the last segment
        const last = this.segments[this.segments.length - 1];
        for (let i = 0; i < CONFIG.growthPerFood; i++) {
            this.segments.push({ x: last.x, y: last.y });
        }
        this.score += 10;
        this.orbsEaten++;

        if (this.orbsEaten === 1) unlockAchievement('first_blood');
        if (this.orbsEaten === 50) unlockAchievement('big_eater');

        // Spawn Big Bubbles every 5 orbs
        if (this.orbsEaten % 5 === 0) {
            for (let i = 0; i < 5; i++) bigBubbles.push(new BigBubble());
        }

        // Update UI
        const card = document.getElementById(this.id === 1 ? 'p1Card' : 'p2Card');
        const scoreVal = document.getElementById(this.id === 1 ? 'scoreP1' : 'scoreP2');
        scoreVal.innerText = this.score;

        // UI Animation
        card.classList.remove('pulse');
        void card.offsetWidth; // trigger reflow
        card.classList.add('pulse');
    }

    die() {
        this.alive = false;
        createExplosion(this.head.x, this.head.y, this.color.main, 20);
        // Shake screen effect?
        canvas.style.transform = `translate(${rand(-5, 5)}px, ${rand(-5, 5)}px)`;
        setTimeout(() => canvas.style.transform = 'none', 50);
    }

    draw(ctx, time) {
        if (!this.alive) return;

        // Draw Body
        ctx.lineWidth = this.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Outer glow
        ctx.shadowBlur = 15;
        if (this.effects.speed > 0) ctx.shadowColor = '#fbbf24';
        else if (this.effects.ghost > 0) ctx.shadowColor = '#a855f7';
        else ctx.shadowColor = this.color.glow;

        // Main Body Path - draw as a continuous line for smoothness
        ctx.beginPath();
        ctx.moveTo(this.segments[0].x, this.segments[0].y);
        // Quadratic bezier curves between points for ultra smoothness
        for (let i = 1; i < this.segments.length - 1; i++) {
            const xc = (this.segments[i].x + this.segments[i + 1].x) / 2;
            const yc = (this.segments[i].y + this.segments[i + 1].y) / 2;
            ctx.quadraticCurveTo(this.segments[i].x, this.segments[i].y, xc, yc);
        }
        // Connect to last point
        if (this.segments.length > 1) {
            let last = this.segments[this.segments.length - 1];
            ctx.lineTo(last.x, last.y);
        }

        ctx.strokeStyle = this.color.main;
        ctx.stroke();

        // Inner spine (detail)
        ctx.lineWidth = 4;
        ctx.strokeStyle = this.color.dark;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw Head
        this.drawHead(ctx, time);
    }

    drawHead(ctx, time) {
        ctx.save();
        ctx.translate(this.head.x, this.head.y);
        ctx.rotate(this.angle);

        // Head Shape
        ctx.fillStyle = this.color.main;
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 11, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(6, -5, 4, 0, Math.PI * 2); // Right eye
        ctx.arc(6, 5, 4, 0, Math.PI * 2);  // Left eye
        ctx.fill();

        // Pupils (Look slightly forward)
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(7, -5, 2, 0, Math.PI * 2);
        ctx.arc(7, 5, 2, 0, Math.PI * 2);
        ctx.fill();

        // Tongue (Flicker animation)
        if (Math.floor(time / 200) % 10 === 0) {
            ctx.strokeStyle = '#ff4d4d';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(20, 0);
            ctx.lineTo(24, -3);
            ctx.moveTo(20, 0);
            ctx.lineTo(24, 3);
            ctx.stroke();
        }

        ctx.restore();
    }
}

// --- Globals ---
let snakes = [];
let food;
let particles = [];
let bigBubbles = [];
let powerUps = [];

let gameStartTime = 0;
let highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;

// --- Setup ---
function init() {
    resize();
    window.addEventListener('resize', resize);
}

function resize() {
    // High DPI Canvas
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

function createExplosion(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function drawGrid(offsetTime) {
    ctx.strokeStyle = CONFIG.colors.grid;
    ctx.lineWidth = 1;
    const gridSize = 40;
    // Subtle parallax shift
    const shiftX = Math.sin(offsetTime * 0.0005) * 20;
    const shiftY = Math.cos(offsetTime * 0.0005) * 20;

    ctx.beginPath();
    for (let x = (shiftX % gridSize); x < width; x += gridSize) {
        ctx.moveTo(x, 0); ctx.lineTo(x, height);
    }
    for (let y = (shiftY % gridSize); y < height; y += gridSize) {
        ctx.moveTo(0, y); ctx.lineTo(width, y);
    }
    ctx.stroke();
}

function loop(timestamp) {
    if (isPaused) return;
    animationId = requestAnimationFrame(loop);

    const dt = Math.min(timestamp - lastTime, 100); // Cap dt to prevent huge jumps
    lastTime = timestamp;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Background
    drawGrid(timestamp);

    // Update & Draw Food
    if (food) {
        food.update(timestamp);
        food.draw(ctx);
    }

    // Update & Draw Snakes
    snakes.forEach((snake, index) => {
        // Determine enemy
        const enemy = mode === 2 ? snakes[index === 0 ? 1 : 0] : null;
        snake.update(dt, enemy);

        // Check Food Collision
        if (snake.alive && food && dist(snake.head.x, snake.head.y, food.x, food.y) < snake.width + 10) {
            snake.grow();
            createExplosion(food.x, food.y, CONFIG.colors.food, 12);
            food.respawn();
        }

        snake.draw(ctx, timestamp);
    });

    // Update & Draw PowerUps
    if (Math.random() < 0.002 && powerUps.length < 3) { // Rare spawn
        powerUps.push(new PowerUp());
    }
    powerUps = powerUps.filter(p => p.life > 0);
    powerUps.forEach(p => {
        p.update();
        p.draw(ctx);
        snakes.forEach(snake => {
            if (snake.alive && dist(snake.head.x, snake.head.y, p.x, p.y) < snake.width + p.size) {
                p.life = 0;
                if (p.type === 'speed') snake.effects.speed = 300; // 5 seconds
                if (p.type === 'ghost') snake.effects.ghost = 300;
                createExplosion(p.x, p.y, p.color, 10);
            }
        });
    });

    // Update & Draw Big Bubbles
    bigBubbles = bigBubbles.filter(b => b.life > 0);
    bigBubbles.forEach(bubble => {
        bubble.update();
        bubble.draw(ctx);
        snakes.forEach(snake => {
            if (snake.alive && dist(snake.head.x, snake.head.y, bubble.x, bubble.y) < snake.width + bubble.size / 2) {
                createExplosion(bubble.x, bubble.y, bubble.color, 15);
                bubble.life = 0; // Pop the bubble
                snake.score += 50; // Bonus score

                // Update UI
                const scoreVal = document.getElementById(snake.id === 1 ? 'scoreP1' : 'scoreP2');
                scoreVal.innerText = snake.score;

                unlockAchievement('bubble_popper');
            }
        });
    });

    // Particles
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => { p.update(); p.draw(ctx); });

    // Game Over Check
    if (snakes.every(s => !s.alive) && !isGameOver) {
        endGame();
    }

    // Survivor Achievement (2 minutes = 120000ms)
    if (!isGameOver && timestamp - gameStartTime > 120000) {
        unlockAchievement('survivor');
    }
}

// --- UI Logic ---
function setMode(m) {
    mode = m;
    // UI updates handled in HTML script for Tailwind classes
    const p2Card = document.getElementById('p2Card');
    if (m === 2) {
        p2Card.style.display = 'block';
        setTimeout(() => p2Card.style.opacity = '1', 10);
    } else {
        p2Card.style.opacity = '0';
        setTimeout(() => p2Card.style.display = 'none', 300);
    }
}

function togglePause() {
    if (isGameOver) return; // Cannot pause game over screen

    isPaused = !isPaused;
    const overlay = document.getElementById('menuOverlay');
    const title = document.getElementById('menuTitle');
    const sub = document.getElementById('menuSubtitle');
    const startBtn = document.getElementById('startBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const modeSelect = document.getElementById('modeSelect');

    if (isPaused) {
        // Show Menu (Pause State)
        overlay.classList.remove('hidden');
        // If the game hasn't started yet (time = 0), it's the Start Menu
        if (gameStartTime === 0) {
            // Logic handled by init/start, but here we cover the "Back to Menu" case
            title.innerText = "READY?";
            sub.innerText = "Select protocol and initiate deployment.";
            startBtn.classList.remove('hidden');
            resumeBtn.classList.add('hidden');
            modeSelect.classList.remove('hidden'); // Allow changing mode
        } else {
            // Pause Menu
            title.innerText = "PAUSED";
            sub.innerText = "System suspended. Awaiting input.";
            startBtn.classList.add('hidden'); // Hide "Deploy"
            resumeBtn.classList.remove('hidden'); // Show "Resume"
            modeSelect.classList.add('hidden'); // No mode changing mid-game
        }
    } else {
        // Hide Menu (Resume)
        overlay.classList.add('hidden');
        lastTime = performance.now();
        loop(lastTime);
    }
}

// Global Key Handler for Pause
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') togglePause();
});

function startGame() {
    snakes = [];
    particles = [];
    bigBubbles = [];
    powerUps = [];
    isGameOver = false;
    isPaused = false;
    gameStartTime = performance.now(); // Set start time

    document.getElementById('menuOverlay').classList.add('hidden');
    document.getElementById('scoreP1').innerText = '0';
    document.getElementById('scoreP2').innerText = '0';

    // Spawn Player 1
    snakes.push(new Snake(1, width * 0.75, height / 2, CONFIG.colors.p1, 'arrows'));

    // Spawn Player 2
    if (mode === 2) {
        snakes.push(new Snake(2, width * 0.25, height / 2, CONFIG.colors.p2, 'wasd'));
        snakes[1].angle = 0;
        snakes[1].targetAngle = 0;
    }

    food = new Food();
    lastTime = performance.now();
    loop(lastTime);
}

function endGame() {
    isGameOver = true;
    isPaused = true;
    cancelAnimationFrame(animationId);

    const overlay = document.getElementById('menuOverlay');
    const title = document.getElementById('menuTitle');
    const sub = document.getElementById('menuSubtitle');
    const startBtn = document.getElementById('startBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const modeSelect = document.getElementById('modeSelect');

    overlay.classList.remove('hidden');
    title.innerText = "MISSION FAILED"; // Or Completed

    // Find winner logic...
    let msg = "";
    if (mode === 1) {
        if (snakes[0].score > highScore) {
            highScore = snakes[0].score;
            localStorage.setItem('snakeHighScore', highScore);
            msg = `NEW RECORD: ${snakes[0].score}`;
            title.innerText = "RECORD BROKEN";
            title.classList.add('text-primary'); // Add color
        } else {
            msg = `Final Score: ${snakes[0].score} / Best: ${highScore}`;
        }
    } else {
        title.innerText = "MATCH COMPLETE";
        if (snakes[0].score > snakes[1].score) msg = "Player 1 Wins!";
        else if (snakes[1].score > snakes[0].score) msg = "Player 2 Wins!";
        else msg = "Draw!";
    }

    sub.innerText = msg;

    // Reset Buttons for Replay
    startBtn.innerText = "REDEPLOY";
    startBtn.classList.remove('hidden');
    resumeBtn.classList.add('hidden');
    modeSelect.classList.remove('hidden');
}

document.getElementById('startBtn').addEventListener('click', startGame);

// --- Achievements System ---
const ACHIEVEMENTS = [
    { id: 'first_blood', title: 'First Blood', desc: 'Eat your first orb', icon: '🍎' },
    { id: 'big_eater', title: 'Big Eater', desc: 'Eat 50 orbs in one game', icon: '🍽️' },
    { id: 'hunter', title: 'Hunter', desc: 'Eliminate another snake', icon: '⚔️' },
    { id: 'survivor', title: 'Survivor', desc: 'Survive for 2 minutes', icon: '⏱️' },
    { id: 'bubble_popper', title: 'Bubble Popper', desc: 'Pop a Big Bubble', icon: '🫧' }
];
let unlockedAchievements = new Set(JSON.parse(localStorage.getItem('snakeAchievements')) || []);

function unlockAchievement(id) {
    if (unlockedAchievements.has(id)) return;
    unlockedAchievements.add(id);
    localStorage.setItem('snakeAchievements', JSON.stringify([...unlockedAchievements]));
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (ach) showAchievement(ach);
}

function showAchievement(ach) {
    const div = document.createElement('div');
    // Tailwind classes for notification
    div.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-800/90 border border-primary text-white px-6 py-4 rounded-xl flex items-center gap-4 shadow-2xl z-50 transform translate-y-20 opacity-0 transition-all duration-500';
    div.innerHTML = `
        <div class="text-3xl">${ach.icon}</div>
        <div>
            <div class="font-bold text-primary text-sm uppercase tracking-wider">Achievement Unlocked</div>
            <div class="font-bold text-lg leading-none">${ach.title}</div>
            <div class="text-xs text-slate-400 mt-1">${ach.desc}</div>
        </div>
    `;
    document.body.appendChild(div);

    // Animation trigger
    requestAnimationFrame(() => {
        div.classList.remove('translate-y-20', 'opacity-0');
    });

    setTimeout(() => {
        div.classList.add('translate-y-20', 'opacity-0');
        setTimeout(() => div.remove(), 500);
    }, 4000); // 4 seconds
}

function toggleWalls() {
    CONFIG.wallsEnabled = !CONFIG.wallsEnabled;
    const btn = document.getElementById('wallBtn');
    btn.innerText = CONFIG.wallsEnabled ? "Walls: ON" : "Walls: OFF";
    btn.className = CONFIG.wallsEnabled
        ? "px-4 py-2 rounded-lg border border-primary/50 text-primary bg-primary/10 hover:bg-primary/20 transition-all"
        : "px-4 py-2 rounded-lg border border-slate-700 text-slate-500 hover:text-slate-300 transition-all";
}

function toggleTheme() {
    document.body.classList.toggle('light-mode'); // Tailwind dark mode is default here, can implement light later
    // Just toggle button text for now as we enforced dark
    // const btn = document.getElementById('themeBtn');
    // btn.innerText = "Theme: Dark (Locked)";
}

// Init
init();
