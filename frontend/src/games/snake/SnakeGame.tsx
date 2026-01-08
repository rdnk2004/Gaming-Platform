import { useEffect, useRef, useState } from 'react'

/**
 * HYPER SNAKE ENGINE - Complete Replica of snake_pg.html
 * Vector-based movement, particle systems, power-ups, achievements, 1/2 player modes
 */

// Configuration matching original exactly
const CONFIG = {
    baseSpeed: 3.5,
    sprintSpeed: 6.5,
    turnSpeed: 0.12,
    segmentDist: 10,
    startLength: 15,
    growthPerFood: 5,
    colors: {
        p1: { main: '#00f260', dark: '#008f39', glow: 'rgba(0, 242, 96, 0.4)' },
        p2: { main: '#0575e6', dark: '#021b79', glow: 'rgba(5, 117, 230, 0.4)' },
        food: '#ff0055',
        bubble: '#00d2ff',
        grid: 'rgba(255,255,255,0.03)'
    }
}

const dist = (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1)
const rand = (min: number, max: number) => Math.random() * (max - min) + min

interface Segment { x: number; y: number }
interface ColorProfile { main: string; dark: string; glow: string }

// Particle class
class Particle {
    x: number; y: number; vx: number; vy: number
    life: number; decay: number; color: string; size: number

    constructor(x: number, y: number, color: string) {
        this.x = x; this.y = y
        const angle = Math.random() * Math.PI * 2
        const speed = rand(1, 4)
        this.vx = Math.cos(angle) * speed
        this.vy = Math.sin(angle) * speed
        this.life = 1.0
        this.decay = rand(0.02, 0.05)
        this.color = color
        this.size = rand(2, 5)
    }

    update() {
        this.x += this.vx; this.y += this.vy
        this.vx *= 0.95; this.vy *= 0.95
        this.life -= this.decay
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.globalAlpha = this.life
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
    }
}

// Food class
class Food {
    x: number = 0
    y: number = 0
    pulse: number = 0
    color: string = CONFIG.colors.food

    constructor(width: number, height: number) {
        this.respawn(width, height)
    }

    respawn(width: number, height: number) {
        const margin = 50
        this.x = rand(margin, width - margin)
        this.y = rand(margin, height - margin)
    }

    update(time: number) {
        this.pulse = Math.sin(time * 0.005) * 3
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.shadowBlur = 20
        ctx.shadowColor = this.color
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, 8 + this.pulse, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(this.x, this.y, 12 - this.pulse, 0, Math.PI * 2)
        ctx.stroke()
        ctx.shadowBlur = 0
    }
}

// BigBubble class
class BigBubble {
    x: number; y: number; size: number; life: number; maxLife: number; color: string

    constructor(width: number, height: number) {
        const margin = 60
        this.x = rand(margin, width - margin)
        this.y = rand(margin, height - margin)
        this.size = 20
        this.life = 600
        this.maxLife = 600
        this.color = CONFIG.colors.bubble
    }

    update() { this.life-- }

    draw(ctx: CanvasRenderingContext2D) {
        const alpha = this.life / 100
        ctx.globalAlpha = Math.min(1, alpha)
        ctx.shadowBlur = 25
        ctx.shadowColor = this.color
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.4)'
        ctx.beginPath()
        ctx.arc(this.x - 5, this.y - 5, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
    }
}

// PowerUp class
class PowerUp {
    x: number; y: number; type: 'speed' | 'ghost'; size: number; life: number; color: string; icon: string

    constructor(width: number, height: number) {
        const margin = 60
        this.x = rand(margin, width - margin)
        this.y = rand(margin, height - margin)
        this.type = Math.random() < 0.5 ? 'speed' : 'ghost'
        this.size = 18
        this.life = 600
        this.color = this.type === 'speed' ? '#fbbf24' : '#a855f7'
        this.icon = this.type === 'speed' ? '⚡' : '👻'
    }

    update() { this.life-- }

    draw(ctx: CanvasRenderingContext2D) {
        const alpha = this.life / 100
        ctx.globalAlpha = Math.min(1, alpha)
        ctx.shadowBlur = 20
        ctx.shadowColor = this.color
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.font = '16px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(this.icon, this.x, this.y + 2)
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
    }
}

// Snake class - matching original exactly
class Snake {
    id: number
    alive: boolean
    score: number
    orbsEaten: number
    color: ColorProfile
    controls: 'arrows' | 'wasd'
    angle: number
    targetAngle: number
    speed: number
    head: Segment
    segments: Segment[]
    width: number
    effects: { speed: number; ghost: number }

    constructor(id: number, startX: number, startY: number, colorProfile: ColorProfile, controlScheme: 'arrows' | 'wasd', initialAngle?: number) {
        this.id = id
        this.alive = true
        this.score = 0
        this.orbsEaten = 0
        this.color = colorProfile
        this.controls = controlScheme
        // Use provided angle or default based on controls
        this.angle = initialAngle !== undefined ? initialAngle : (controlScheme === 'arrows' ? Math.PI : 0)
        this.targetAngle = this.angle
        this.speed = CONFIG.baseSpeed
        this.head = { x: startX, y: startY }
        this.segments = []
        this.width = 16
        this.effects = { speed: 0, ghost: 0 }

        // Initialize body behind head based on starting angle
        const dirX = Math.cos(this.angle + Math.PI)
        const dirY = Math.sin(this.angle + Math.PI)
        for (let i = 1; i <= CONFIG.startLength; i++) {
            this.segments.push({
                x: startX + dirX * i * CONFIG.segmentDist,
                y: startY + dirY * i * CONFIG.segmentDist
            })
        }
    }

    update(dt: number, keys: Record<string, boolean>, width: number, height: number, wallsEnabled: boolean, enemySnake?: Snake): boolean {
        if (!this.alive) return false

        // Handle input
        let boost = false
        if (this.controls === 'arrows') {
            if (keys['arrowup']) this.targetAngle = -Math.PI / 2
            else if (keys['arrowdown']) this.targetAngle = Math.PI / 2
            else if (keys['arrowleft']) this.targetAngle = Math.PI
            else if (keys['arrowright']) this.targetAngle = 0
            if (keys['shift']) boost = true
        } else {
            if (keys['w']) this.targetAngle = -Math.PI / 2
            else if (keys['s']) this.targetAngle = Math.PI / 2
            else if (keys['a']) this.targetAngle = Math.PI
            else if (keys['d']) this.targetAngle = 0
            if (keys[' ']) boost = true
        }

        // Normalize angles for shortest rotation
        let diff = this.targetAngle - this.angle
        while (diff <= -Math.PI) diff += Math.PI * 2
        while (diff > Math.PI) diff -= Math.PI * 2
        this.angle += diff * CONFIG.turnSpeed

        // Speed handling
        let base = CONFIG.baseSpeed
        if (this.effects.speed > 0) base = CONFIG.sprintSpeed + 2
        const currentSpeed = boost ? CONFIG.sprintSpeed : base

        // Update effects
        if (this.effects.speed > 0) this.effects.speed--
        if (this.effects.ghost > 0) this.effects.ghost--

        // Move head (normalized to 60fps)
        const fps = 60
        const moveDist = currentSpeed * (dt / (1000 / fps))
        this.head.x += Math.cos(this.angle) * moveDist
        this.head.y += Math.sin(this.angle) * moveDist

        // Wall collision
        if (wallsEnabled && this.effects.ghost <= 0) {
            if (this.head.x < 0 || this.head.x > width || this.head.y < 0 || this.head.y > height) {
                this.die()
                return true
            }
        } else {
            // Wrap around
            if (this.head.x < 0) this.head.x = width
            if (this.head.x > width) this.head.x = 0
            if (this.head.y < 0) this.head.y = height
            if (this.head.y > height) this.head.y = 0
        }

        // Update body segments (IK follow the leader)
        this.dragSegment(0, this.head.x, this.head.y)
        for (let i = 1; i < this.segments.length; i++) {
            this.dragSegment(i, this.segments[i - 1].x, this.segments[i - 1].y)
        }

        // Self collision (start at segment 4 to avoid neck)
        if (this.effects.ghost <= 0) {
            for (let i = 4; i < this.segments.length; i++) {
                if (dist(this.head.x, this.head.y, this.segments[i].x, this.segments[i].y) < this.width / 1.5) {
                    this.die()
                    return true
                }
            }
        }

        // Enemy collision
        if (enemySnake && enemySnake.alive && this.effects.ghost <= 0) {
            for (const seg of enemySnake.segments) {
                if (dist(this.head.x, this.head.y, seg.x, seg.y) < this.width) {
                    this.die()
                    return true
                }
            }
            if (dist(this.head.x, this.head.y, enemySnake.head.x, enemySnake.head.y) < this.width * 1.5) {
                if (this.segments.length <= enemySnake.segments.length) {
                    this.die()
                    return true
                }
            }
        }

        return false
    }

    dragSegment(i: number, tx: number, ty: number) {
        const seg = this.segments[i]
        const d = dist(seg.x, seg.y, tx, ty)
        if (d === 0) return
        if (d > 100) { seg.x = tx; seg.y = ty; return }
        const angle = Math.atan2(ty - seg.y, tx - seg.x)
        seg.x = tx - Math.cos(angle) * CONFIG.segmentDist
        seg.y = ty - Math.sin(angle) * CONFIG.segmentDist
    }

    grow() {
        const last = this.segments[this.segments.length - 1]
        for (let i = 0; i < CONFIG.growthPerFood; i++) {
            this.segments.push({ x: last.x, y: last.y })
        }
        this.score += 10
        this.orbsEaten++
    }

    die() {
        this.alive = false
    }

    draw(ctx: CanvasRenderingContext2D, time: number) {
        if (!this.alive) return

        ctx.lineWidth = this.width
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        // Outer glow
        ctx.shadowBlur = 15
        if (this.effects.speed > 0) ctx.shadowColor = '#fbbf24'
        else if (this.effects.ghost > 0) ctx.shadowColor = '#a855f7'
        else ctx.shadowColor = this.color.glow

        // Main body path with bezier curves for smoothness
        ctx.beginPath()
        ctx.moveTo(this.segments[0].x, this.segments[0].y)
        for (let i = 1; i < this.segments.length - 1; i++) {
            const xc = (this.segments[i].x + this.segments[i + 1].x) / 2
            const yc = (this.segments[i].y + this.segments[i + 1].y) / 2
            ctx.quadraticCurveTo(this.segments[i].x, this.segments[i].y, xc, yc)
        }
        if (this.segments.length > 1) {
            const last = this.segments[this.segments.length - 1]
            ctx.lineTo(last.x, last.y)
        }
        ctx.strokeStyle = this.color.main
        ctx.stroke()

        // Inner spine (detail)
        ctx.lineWidth = 4
        ctx.strokeStyle = this.color.dark
        ctx.stroke()
        ctx.shadowBlur = 0

        // Draw head
        this.drawHead(ctx, time)
    }

    drawHead(ctx: CanvasRenderingContext2D, time: number) {
        ctx.save()
        ctx.translate(this.head.x, this.head.y)
        ctx.rotate(this.angle)

        // Head shape
        ctx.fillStyle = this.color.main
        ctx.beginPath()
        ctx.ellipse(0, 0, 14, 11, 0, 0, Math.PI * 2)
        ctx.fill()

        // Eyes
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(6, -5, 4, 0, Math.PI * 2)
        ctx.arc(6, 5, 4, 0, Math.PI * 2)
        ctx.fill()

        // Pupils
        ctx.fillStyle = '#000'
        ctx.beginPath()
        ctx.arc(7, -5, 2, 0, Math.PI * 2)
        ctx.arc(7, 5, 2, 0, Math.PI * 2)
        ctx.fill()

        // Tongue flicker
        if (Math.floor(time / 200) % 10 === 0) {
            ctx.strokeStyle = '#ff4d4d'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(10, 0)
            ctx.lineTo(20, 0)
            ctx.lineTo(24, -3)
            ctx.moveTo(20, 0)
            ctx.lineTo(24, 3)
            ctx.stroke()
        }

        ctx.restore()
    }
}

// Achievement definitions
const ACHIEVEMENTS = [
    { id: 'first_blood', title: 'First Blood', desc: 'Eat your first orb', icon: '🍎' },
    { id: 'big_eater', title: 'Big Eater', desc: 'Eat 50 orbs in one game', icon: '🍽️' },
    { id: 'hunter', title: 'Hunter', desc: 'Eliminate another snake', icon: '⚔️' },
    { id: 'survivor', title: 'Survivor', desc: 'Survive for 2 minutes', icon: '⏱️' },
    { id: 'bubble_popper', title: 'Bubble Popper', desc: 'Pop a Big Bubble', icon: '🫧' }
]

export default function SnakeGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu')
    const [mode, setMode] = useState<1 | 2>(1)
    const [wallsEnabled, setWallsEnabled] = useState(true)
    const [lightMode, setLightMode] = useState(false)
    const [scores, setScores] = useState({ p1: 0, p2: 0 })
    const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('snakeHighScore') || '0'))
    const [gameOverMessage, setGameOverMessage] = useState('')
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [achievement, setAchievement] = useState<{ title: string; icon: string } | null>(null)

    // Use refs for values needed in game loop to avoid stale closures
    const modeRef = useRef(mode)
    const wallsEnabledRef = useRef(wallsEnabled)
    const lightModeRef = useRef(lightMode)
    const highScoreRef = useRef(highScore)
    const gameStateRef = useRef(gameState)

    // Keep refs in sync with state
    useEffect(() => { modeRef.current = mode }, [mode])
    useEffect(() => { wallsEnabledRef.current = wallsEnabled }, [wallsEnabled])
    useEffect(() => { lightModeRef.current = lightMode }, [lightMode])
    useEffect(() => { highScoreRef.current = highScore }, [highScore])
    useEffect(() => { gameStateRef.current = gameState }, [gameState])

    // Game state stored in ref to avoid re-renders
    const gameRef = useRef<{
        snakes: Snake[]
        food: Food | null
        particles: Particle[]
        bigBubbles: BigBubble[]
        powerUps: PowerUp[]
        keys: Record<string, boolean>
        animationId: number
        lastTime: number
        gameStartTime: number
        width: number
        height: number
        unlockedAchievements: Set<string>
        running: boolean
    }>({
        snakes: [],
        food: null,
        particles: [],
        bigBubbles: [],
        powerUps: [],
        keys: {},
        animationId: 0,
        lastTime: 0,
        gameStartTime: 0,
        width: 0,
        height: 0,
        unlockedAchievements: new Set(JSON.parse(localStorage.getItem('snakeAchievements') || '[]')),
        running: false
    })

    const unlockAchievement = (id: string) => {
        const game = gameRef.current
        if (game.unlockedAchievements.has(id)) return
        game.unlockedAchievements.add(id)
        localStorage.setItem('snakeAchievements', JSON.stringify([...game.unlockedAchievements]))
        const ach = ACHIEVEMENTS.find(a => a.id === id)
        if (ach) {
            setAchievement({ title: ach.title, icon: ach.icon })
            setTimeout(() => setAchievement(null), 3000)
        }
    }

    const createExplosion = (x: number, y: number, color: string, count: number) => {
        const game = gameRef.current
        for (let i = 0; i < count; i++) {
            game.particles.push(new Particle(x, y, color))
        }
    }

    // Draw grid with parallax
    const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, isLight: boolean) => {
        ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.05)' : CONFIG.colors.grid
        ctx.lineWidth = 1
        const gridSize = 40
        const shiftX = Math.sin(time * 0.0005) * 20
        const shiftY = Math.cos(time * 0.0005) * 20
        ctx.beginPath()
        for (let x = (shiftX % gridSize); x < width; x += gridSize) {
            ctx.moveTo(x, 0); ctx.lineTo(x, height)
        }
        for (let y = (shiftY % gridSize); y < height; y += gridSize) {
            ctx.moveTo(0, y); ctx.lineTo(width, y)
        }
        ctx.stroke()
    }

    // Main game loop - defined as a regular function, uses refs
    const gameLoop = (timestamp: number) => {
        const game = gameRef.current

        // Stop if game is no longer running
        if (!game.running) return

        const canvas = canvasRef.current
        if (!canvas) {
            game.animationId = requestAnimationFrame(gameLoop)
            return
        }

        const ctx = canvas.getContext('2d', { alpha: false })
        if (!ctx) {
            game.animationId = requestAnimationFrame(gameLoop)
            return
        }

        const dt = Math.min(timestamp - game.lastTime, 100)
        game.lastTime = timestamp

        const { width, height } = game
        const isLightMode = lightModeRef.current
        const currentMode = modeRef.current
        const currentWallsEnabled = wallsEnabledRef.current

        // Clear canvas
        ctx.fillStyle = isLightMode ? '#f1f5f9' : '#050505'
        ctx.fillRect(0, 0, width, height)

        // Draw grid
        drawGrid(ctx, width, height, timestamp, isLightMode)

        // Draw and update food
        if (game.food) {
            game.food.update(timestamp)
            game.food.draw(ctx)
        }

        // Update and draw snakes
        game.snakes.forEach((snake, idx) => {
            const enemy = currentMode === 2 ? game.snakes[idx === 0 ? 1 : 0] : undefined
            const died = snake.update(dt, game.keys, width, height, currentWallsEnabled, enemy)
            if (died) {
                createExplosion(snake.head.x, snake.head.y, snake.color.main, 20)
            }

            // Food collision
            if (snake.alive && game.food && dist(snake.head.x, snake.head.y, game.food.x, game.food.y) < snake.width + 10) {
                snake.grow()
                createExplosion(game.food.x, game.food.y, CONFIG.colors.food, 12)
                game.food.respawn(width, height)

                if (snake.orbsEaten === 1) unlockAchievement('first_blood')
                if (snake.orbsEaten === 50) unlockAchievement('big_eater')

                // Spawn bubbles every 5 orbs
                if (snake.orbsEaten % 5 === 0) {
                    for (let i = 0; i < 5; i++) {
                        game.bigBubbles.push(new BigBubble(width, height))
                    }
                }

                setScores({ p1: game.snakes[0]?.score || 0, p2: game.snakes[1]?.score || 0 })
            }

            snake.draw(ctx, timestamp)
        })

        // PowerUp spawning and update
        if (Math.random() < 0.002 && game.powerUps.length < 3) {
            game.powerUps.push(new PowerUp(width, height))
        }
        game.powerUps = game.powerUps.filter(p => p.life > 0)
        game.powerUps.forEach(p => {
            p.update()
            p.draw(ctx)
            game.snakes.forEach(snake => {
                if (snake.alive && dist(snake.head.x, snake.head.y, p.x, p.y) < snake.width + p.size) {
                    p.life = 0
                    if (p.type === 'speed') snake.effects.speed = 300
                    if (p.type === 'ghost') snake.effects.ghost = 300
                    createExplosion(p.x, p.y, p.color, 10)
                }
            })
        })

        // Big bubbles update
        game.bigBubbles = game.bigBubbles.filter(b => b.life > 0)
        game.bigBubbles.forEach(bubble => {
            bubble.update()
            bubble.draw(ctx)
            game.snakes.forEach(snake => {
                if (snake.alive && dist(snake.head.x, snake.head.y, bubble.x, bubble.y) < snake.width + bubble.size / 2) {
                    createExplosion(bubble.x, bubble.y, bubble.color, 15)
                    bubble.life = 0
                    snake.score += 50
                    setScores({ p1: game.snakes[0]?.score || 0, p2: game.snakes[1]?.score || 0 })
                    unlockAchievement('bubble_popper')
                }
            })
        })

        // Particles update
        game.particles = game.particles.filter(p => p.life > 0)
        game.particles.forEach(p => {
            p.update()
            p.draw(ctx)
        })

        // Survivor achievement (2 minutes)
        if (timestamp - game.gameStartTime > 120000) {
            unlockAchievement('survivor')
        }

        // Game over check
        if (game.snakes.every(s => !s.alive)) {
            game.running = false
            let msg = ''
            if (currentMode === 1) {
                const score = game.snakes[0]?.score || 0
                const currentHighScore = highScoreRef.current
                if (score > currentHighScore) {
                    setHighScore(score)
                    localStorage.setItem('snakeHighScore', score.toString())
                    msg = `Score: ${score} (New High Score!)`
                } else {
                    msg = `Score: ${score} (High Score: ${currentHighScore})`
                }
            } else {
                const s1 = game.snakes[0]?.score || 0
                const s2 = game.snakes[1]?.score || 0
                if (s1 > s2) msg = 'Player 1 Wins!'
                else if (s2 > s1) msg = 'Player 2 Wins!'
                else msg = "It's a Draw!"
            }
            setGameOverMessage(msg)
            setGameState('gameover')
            return
        }

        game.animationId = requestAnimationFrame(gameLoop)
    }

    const startGame = () => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        // Get real dimensions
        const width = container.clientWidth || window.innerWidth
        const height = container.clientHeight || window.innerHeight

        // High DPI canvas setup
        const dpr = window.devicePixelRatio || 1
        canvas.width = width * dpr
        canvas.height = height * dpr
        canvas.style.width = width + 'px'
        canvas.style.height = height + 'px'

        const ctx = canvas.getContext('2d', { alpha: false })
        if (ctx) ctx.scale(dpr, dpr)

        // Initialize game state
        const game = gameRef.current
        game.width = width
        game.height = height
        game.snakes = []
        game.particles = []
        game.bigBubbles = []
        game.powerUps = []

        // Player 1 (center, facing right for 1P, or on left for 2P)
        if (modeRef.current === 1) {
            // Single player - start in center facing right (angle = 0)
            game.snakes.push(new Snake(1, width * 0.5, height / 2, CONFIG.colors.p1, 'arrows', 0))
        } else {
            // 2 Player mode - P1 on left facing right (angle = 0)
            game.snakes.push(new Snake(1, width * 0.25, height / 2, CONFIG.colors.p1, 'arrows', 0))
            // P2 on right facing left (angle = Math.PI)
            game.snakes.push(new Snake(2, width * 0.75, height / 2, CONFIG.colors.p2, 'wasd', Math.PI))
        }

        // Food
        game.food = new Food(width, height)

        game.lastTime = performance.now()
        game.gameStartTime = game.lastTime
        game.running = true

        setScores({ p1: 0, p2: 0 })
        setGameState('playing')
        game.animationId = requestAnimationFrame(gameLoop)
    }

    const toggleFullscreen = () => {
        const container = containerRef.current
        if (!container) return
        if (!document.fullscreenElement) {
            container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => { })
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => { })
        }
    }

    // Keyboard handlers
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            gameRef.current.keys[e.key.toLowerCase()] = true
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
                e.preventDefault()
            }
            if (e.key === 'Escape' && gameStateRef.current === 'playing') {
                gameRef.current.running = false
                cancelAnimationFrame(gameRef.current.animationId)
                setGameState('menu')
            }
        }
        const handleKeyUp = (e: KeyboardEvent) => {
            gameRef.current.keys[e.key.toLowerCase()] = false
        }
        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
            gameRef.current.running = false
            cancelAnimationFrame(gameRef.current.animationId)
        }
    }, [])

    // Fullscreen listener
    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement)
        document.addEventListener('fullscreenchange', handler)
        return () => document.removeEventListener('fullscreenchange', handler)
    }, [])

    return (
        <div ref={containerRef} className={`snake-game-container ${lightMode ? 'light-mode' : ''}`}>
            {/* Score cards */}
            <div className="score-container">
                <div className="score-card">
                    <label>Player 1</label>
                    <div className="value p1-color">{scores.p1}</div>
                </div>
                {mode === 2 && (
                    <div className="score-card">
                        <label>Player 2</label>
                        <div className="value p2-color">{scores.p2}</div>
                    </div>
                )}
            </div>

            {/* Brand */}
            <div className="game-brand">
                <h1>Hyper Snake</h1>
                <span>ARENA EVOLVED</span>
            </div>

            {/* Canvas */}
            <canvas ref={canvasRef} className="game-canvas" />

            {/* Menu/Gameover Overlay */}
            {(gameState === 'menu' || gameState === 'gameover') && (
                <div className="controls-overlay">
                    <h2>{gameState === 'gameover' ? 'GAME OVER' : 'READY?'}</h2>
                    <p>{gameState === 'gameover' ? gameOverMessage : 'Select mode and start the chase.'}</p>

                    <div className="mode-select">
                        <button className={`mode-btn ${mode === 1 ? 'active' : ''}`} onClick={() => setMode(1)}>1 Player</button>
                        <button className={`mode-btn ${mode === 2 ? 'active' : ''}`} onClick={() => setMode(2)}>2 Players</button>
                    </div>

                    <div className="option-row">
                        <button className={`mode-btn ${!wallsEnabled ? 'active' : ''}`} onClick={() => setWallsEnabled(!wallsEnabled)}>
                            Walls: {wallsEnabled ? 'ON' : 'OFF'}
                        </button>
                        <button className={`mode-btn ${lightMode ? 'active' : ''}`} onClick={() => setLightMode(!lightMode)}>
                            Theme: {lightMode ? 'Light' : 'Dark'}
                        </button>
                        <button className="mode-btn" onClick={toggleFullscreen}>
                            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                        </button>
                    </div>

                    <div className="key-hint">
                        <div className="key-group">
                            <span className="key-title p1-color">Player 1</span>
                            <div className="keys">
                                <span className="k-box">↑</span><span className="k-box">↓</span><span className="k-box">←</span><span className="k-box">→</span>
                                <span className="key-extra">+ <span className="k-box">Shift</span> Sprint</span>
                            </div>
                        </div>
                        <div className={`key-group ${mode === 1 ? 'dimmed' : ''}`}>
                            <span className="key-title p2-color">Player 2</span>
                            <div className="keys">
                                <span className="k-box">W</span><span className="k-box">S</span><span className="k-box">A</span><span className="k-box">D</span>
                                <span className="key-extra">+ <span className="k-box">Space</span> Sprint</span>
                            </div>
                        </div>
                    </div>

                    <button className="btn-start" onClick={startGame}>
                        {gameState === 'gameover' ? 'Replay' : 'Deploy Snake'}
                    </button>
                </div>
            )}

            {/* Achievement popup */}
            {achievement && (
                <div className="achievement-popup">
                    <div className="ach-icon">{achievement.icon}</div>
                    <div className="ach-text">
                        <div className="ach-title">{achievement.title}</div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="footer-hint">
                Avoid walls • Eat glowing orbs • Don't hit yourself • Press ESC to pause
            </div>

            <style>{`
        .snake-game-container {
          position: relative;
          width: 100%;
          height: 100vh;
          background: radial-gradient(circle at 50% 50%, #1e293b 0%, #000 100%);
          overflow: hidden;
        }
        .snake-game-container.light-mode {
          background: radial-gradient(circle at 50% 50%, #e2e8f0 0%, #cbd5e1 100%);
        }
        .game-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        .game-brand {
          position: absolute;
          top: 24px;
          left: 24px;
          z-index: 10;
          pointer-events: none;
        }
        .game-brand h1 {
          margin: 0;
          font-family: 'Rajdhani', sans-serif;
          font-weight: 700;
          font-size: 32px;
          text-transform: uppercase;
          letter-spacing: 2px;
          background: linear-gradient(90deg, #00f260, #0575e6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 15px rgba(0, 242, 96, 0.4));
        }
        .game-brand span {
          font-size: 12px;
          color: #64748b;
          letter-spacing: 1px;
          font-weight: 600;
        }
        .score-container {
          position: absolute;
          top: 24px;
          right: 24px;
          display: flex;
          gap: 20px;
          z-index: 10;
          pointer-events: none;
        }
        .score-card {
          background: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(12px);
          padding: 12px 20px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 100px;
        }
        .score-card label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #94a3b8;
          margin-bottom: 4px;
        }
        .score-card .value {
          font-family: 'Rajdhani', sans-serif;
          font-size: 28px;
          font-weight: 700;
          line-height: 1;
        }
        .p1-color { color: #00f260; text-shadow: 0 0 10px rgba(0, 242, 96, 0.3); }
        .p2-color { color: #0575e6; text-shadow: 0 0 10px rgba(5, 117, 230, 0.3); }
        .controls-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          background: rgba(10, 10, 12, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px);
          padding: 40px;
          border-radius: 24px;
          min-width: 360px;
          z-index: 100;
        }
        .controls-overlay h2 {
          margin: 0 0 10px;
          font-family: 'Rajdhani', sans-serif;
          font-size: 32px;
          color: #e2e8f0;
        }
        .controls-overlay p {
          color: #94a3b8;
          margin: 0 0 24px;
          font-size: 14px;
        }
        .mode-select, .option-row {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .mode-btn {
          background: transparent;
          border: 1px solid #334155;
          color: #64748b;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
          font-family: inherit;
        }
        .mode-btn:hover {
          border-color: #00f260;
          color: #00f260;
        }
        .mode-btn.active {
          background: #1e293b;
          border-color: #00f260;
          color: #00f260;
        }
        .key-hint {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 20px;
          text-align: left;
        }
        .key-group {
          background: rgba(255, 255, 255, 0.03);
          padding: 15px;
          border-radius: 10px;
        }
        .key-group.dimmed { opacity: 0.3; }
        .key-title {
          font-size: 12px;
          text-transform: uppercase;
          margin-bottom: 8px;
          display: block;
          font-weight: 600;
        }
        .keys {
          display: flex;
          gap: 4px;
          align-items: center;
          flex-wrap: wrap;
        }
        .k-box {
          background: #334155;
          padding: 4px 8px;
          border-radius: 4px;
          border-bottom: 2px solid #1e293b;
          font-family: monospace;
          font-size: 12px;
          color: #cbd5e1;
        }
        .key-extra {
          margin-left: 5px;
          font-size: 12px;
          color: #cbd5e1;
        }
        .btn-start {
          background: linear-gradient(135deg, #00f260, #00c853);
          border: none;
          padding: 16px 40px;
          border-radius: 50px;
          color: #000;
          font-weight: 700;
          font-family: 'Rajdhani', sans-serif;
          font-size: 20px;
          text-transform: uppercase;
          letter-spacing: 2px;
          cursor: pointer;
          box-shadow: 0 10px 20px rgba(0, 242, 96, 0.3);
          margin-top: 20px;
          transition: all 0.2s;
        }
        .btn-start:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(0, 242, 96, 0.4);
        }
        .footer-hint {
          position: absolute;
          bottom: 24px;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 12px;
          color: #475569;
          z-index: 10;
          pointer-events: none;
        }
        .achievement-popup {
          position: absolute;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid #00f260;
          padding: 15px 25px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 15px;
          z-index: 200;
          animation: slideIn 0.5s ease;
        }
        @keyframes slideIn {
          from { transform: translateX(-50%) translateY(-50px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        .ach-icon { font-size: 24px; }
        .ach-title {
          font-family: 'Rajdhani', sans-serif;
          font-weight: 700;
          color: #00f260;
          font-size: 18px;
          text-transform: uppercase;
        }
        .light-mode .controls-overlay {
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        .light-mode .controls-overlay h2,
        .light-mode .controls-overlay p {
          color: #1e293b;
        }
        .light-mode .k-box {
          background: #e2e8f0;
          border-bottom: 2px solid #cbd5e1;
          color: #334155;
        }
      `}</style>
        </div>
    )
}
