/** HYPER SNAKE ENGINE */
const CONFIG = {
    baseSpeed: 3.5, sprintSpeed: 6.5, turnSpeed: 0.12, segmentDist: 10, startLength: 15, growthPerFood: 5,
    colors: { p1: { main: '#00f260', dark: '#008f39', glow: 'rgba(0, 242, 96, 0.4)' }, food: '#ff0055', grid: 'rgba(255,255,255,0.03)' }
};
const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
const rand = (min, max) => Math.random() * (max - min) + min;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });
let width, height, animationId, lastTime = 0, isPaused = true, isGameOver = false;
const keys = {};
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; const angle = Math.random() * Math.PI * 2; const speed = rand(1, 4);
        this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
        this.life = 1.0; this.decay = rand(0.02, 0.05); this.color = color; this.size = rand(2, 5);
    }
    update() { this.x += this.vx; this.y += this.vy; this.vx *= 0.95; this.vy *= 0.95; this.life -= this.decay; }
    draw(ctx) { ctx.globalAlpha = this.life; ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
}

class Food {
    constructor() { this.respawn(); this.pulse = 0; }
    respawn() { const margin = 50; this.x = rand(margin, width - margin); this.y = rand(margin, height - margin); this.color = CONFIG.colors.food; }
    update(time) { this.pulse = Math.sin(time * 0.005) * 3; }
    draw(ctx) { ctx.shadowBlur = 20; ctx.shadowColor = this.color; ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, 8 + this.pulse, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(this.x, this.y, 12 - this.pulse, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0; }
}

class Snake {
    constructor(id, startX, startY, colorProfile) {
        this.id = id; this.alive = true; this.score = 0; this.color = colorProfile;
        this.angle = Math.PI; this.targetAngle = this.angle; this.speed = CONFIG.baseSpeed;
        this.head = { x: startX, y: startY }; this.segments = [];
        for (let i = 0; i < CONFIG.startLength; i++) this.segments.push({ x: startX + i * 10, y: startY });
        this.width = 16;
    }
    update(dt) {
        if (!this.alive) return;
        let turn = 0; let boost = false;
        if (keys['arrowup']) this.targetAngle = -Math.PI / 2;
        else if (keys['arrowdown']) this.targetAngle = Math.PI / 2;
        else if (keys['arrowleft']) this.targetAngle = Math.PI;
        else if (keys['arrowright']) this.targetAngle = 0;
        if (keys['shift']) boost = true;

        let diff = this.targetAngle - this.angle;
        while (diff <= -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.angle += diff * CONFIG.turnSpeed;

        const currentSpeed = boost ? CONFIG.sprintSpeed : CONFIG.baseSpeed;
        this.head.x += Math.cos(this.angle) * currentSpeed;
        this.head.y += Math.sin(this.angle) * currentSpeed;

        if (this.head.x < 0 || this.head.x > width || this.head.y < 0 || this.head.y > height) this.die();
        this.dragSegment(0, this.head.x, this.head.y);
        for (let i = 1; i < this.segments.length; i++) this.dragSegment(i, this.segments[i - 1].x, this.segments[i - 1].y);
        for (let i = 4; i < this.segments.length; i++) {
            if (dist(this.head.x, this.head.y, this.segments[i].x, this.segments[i].y) < this.width / 1.5) this.die();
        }
    }
    dragSegment(i, tx, ty) {
        const seg = this.segments[i]; const angle = Math.atan2(ty - seg.y, tx - seg.x);
        seg.x = tx - Math.cos(angle) * CONFIG.segmentDist; seg.y = ty - Math.sin(angle) * CONFIG.segmentDist;
    }
    grow() {
        const last = this.segments[this.segments.length - 1];
        for (let i = 0; i < CONFIG.growthPerFood; i++) this.segments.push({ x: last.x, y: last.y });
        this.score += 10;
        const card = document.getElementById('p1Card'); const scoreVal = document.getElementById('scoreP1');
        scoreVal.innerText = this.score; card.classList.remove('pulse'); void card.offsetWidth; card.classList.add('pulse');
    }
    die() {
        this.alive = false; createExplosion(this.head.x, this.head.y, this.color.main, 20);
        canvas.style.transform = `translate(${rand(-5, 5)}px, ${rand(-5, 5)}px)`;
        setTimeout(() => canvas.style.transform = 'none', 50);
    }
    draw(ctx, time) {
        if (!this.alive) return;
        ctx.lineWidth = this.width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.shadowBlur = 15; ctx.shadowColor = this.color.glow;
        ctx.beginPath(); ctx.moveTo(this.segments[0].x, this.segments[0].y);
        for (let i = 1; i < this.segments.length - 1; i++) {
            const xc = (this.segments[i].x + this.segments[i + 1].x) / 2; const yc = (this.segments[i].y + this.segments[i + 1].y) / 2;
            ctx.quadraticCurveTo(this.segments[i].x, this.segments[i].y, xc, yc);
        }
        if (this.segments.length > 1) { let last = this.segments[this.segments.length - 1]; ctx.lineTo(last.x, last.y); }
        ctx.strokeStyle = this.color.main; ctx.stroke();
        ctx.lineWidth = 4; ctx.strokeStyle = this.color.dark; ctx.stroke(); ctx.shadowBlur = 0;
        this.drawHead(ctx, time);
    }
    drawHead(ctx, time) {
        ctx.save(); ctx.translate(this.head.x, this.head.y); ctx.rotate(this.angle);
        ctx.fillStyle = this.color.main; ctx.beginPath(); ctx.ellipse(0, 0, 14, 11, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(6, -5, 4, 0, Math.PI * 2); ctx.arc(6, 5, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(7, -5, 2, 0, Math.PI * 2); ctx.arc(7, 5, 2, 0, Math.PI * 2); ctx.fill();
        if (Math.floor(time / 200) % 10 === 0) {
            ctx.strokeStyle = '#ff4d4d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(20, 0); ctx.lineTo(24, -3); ctx.moveTo(20, 0); ctx.lineTo(24, 3); ctx.stroke();
        }
        ctx.restore();
    }
}

let snakes = []; let food; let particles = []; let unlockedAchievements = new Set();
function init() { resize(); window.addEventListener('resize', resize); }
function resize() { width = window.innerWidth; height = window.innerHeight; canvas.width = width * window.devicePixelRatio; canvas.height = height * window.devicePixelRatio; canvas.style.width = width + 'px'; canvas.style.height = height + 'px'; ctx.scale(window.devicePixelRatio, window.devicePixelRatio); }
function createExplosion(x, y, color, count) { for (let i = 0; i < count; i++) particles.push(new Particle(x, y, color)); }
function loop(timestamp) {
    if (isPaused) return; animationId = requestAnimationFrame(loop);
    const dt = timestamp - lastTime; lastTime = timestamp;
    ctx.clearRect(0, 0, width, height);
    // Grid
    ctx.strokeStyle = CONFIG.colors.grid; ctx.lineWidth = 1; const shiftX = Math.sin(timestamp * 0.0005) * 20; const shiftY = Math.cos(timestamp * 0.0005) * 20;
    ctx.beginPath(); for (let x = (shiftX % 40); x < width; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, height); } for (let y = (shiftY % 40); y < height; y += 40) { ctx.moveTo(0, y); ctx.lineTo(width, y); } ctx.stroke();

    if (food) { food.update(timestamp); food.draw(ctx); }
    snakes.forEach(snake => {
        snake.update(dt);
        if (snake.alive && food && dist(snake.head.x, snake.head.y, food.x, food.y) < snake.width + 10) {
            snake.grow(); createExplosion(food.x, food.y, CONFIG.colors.food, 12); food.respawn();
        }
        snake.draw(ctx, timestamp);
    });
    particles = particles.filter(p => p.life > 0); particles.forEach(p => { p.update(); p.draw(ctx); });
    if (snakes.every(s => !s.alive) && !isGameOver) endGame();
}
function startGame() {
    snakes = []; particles = []; isGameOver = false; isPaused = false;
    document.getElementById('menuOverlay').classList.add('hidden'); document.getElementById('scoreP1').innerText = '0';
    snakes.push(new Snake(1, width * 0.5, height / 2, CONFIG.colors.p1));
    food = new Food(); lastTime = performance.now(); loop(lastTime);
}
document.getElementById('startBtn').addEventListener('click', startGame);
init();