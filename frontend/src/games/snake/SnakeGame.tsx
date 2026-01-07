import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'

// Configuration
const CONFIG = {
    baseSpeed: 3.5,
    sprintSpeed: 6.5,
    turnSpeed: 0.12,
    segmentDist: 10,
    startLength: 15,
    growthPerFood: 5,
    colors: {
        snake: { main: '#00ffff', glow: 'rgba(0, 255, 255, 0.4)' },
        food: '#ff0080',
        grid: 'rgba(0, 255, 255, 0.03)'
    }
}

// Utility functions
const dist = (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1)
const rand = (min: number, max: number) => Math.random() * (max - min) + min

interface Segment { x: number; y: number }
interface Food { x: number; y: number; pulse: number }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; size: number; color: string }

export default function SnakeGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu')
    const [score, setScore] = useState(0)
    const [highScore, setHighScore] = useState(() => {
        const saved = localStorage.getItem('snake_highscore')
        return saved ? parseInt(saved) : 0
    })

    const { user, token } = useAuthStore()

    // Game state refs (to avoid re-renders during game loop)
    const gameRef = useRef({
        snake: {
            head: { x: 0, y: 0 },
            segments: [] as Segment[],
            angle: 0,
            targetAngle: 0,
            alive: true
        },
        food: { x: 0, y: 0, pulse: 0 } as Food,
        particles: [] as Particle[],
        keys: {} as Record<string, boolean>,
        animationId: 0,
        lastTime: 0,
        score: 0
    })

    // Initialize game
    const initGame = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const width = canvas.width
        const height = canvas.height
        const startX = width / 2
        const startY = height / 2

        const game = gameRef.current
        game.snake = {
            head: { x: startX, y: startY },
            segments: [],
            angle: -Math.PI / 2,
            targetAngle: -Math.PI / 2,
            alive: true
        }

        // Initialize body segments
        for (let i = 1; i <= CONFIG.startLength; i++) {
            game.snake.segments.push({
                x: startX,
                y: startY + i * CONFIG.segmentDist
            })
        }

        // Spawn food
        game.food = {
            x: rand(50, width - 50),
            y: rand(50, height - 50),
            pulse: 0
        }

        game.particles = []
        game.score = 0
        setScore(0)
    }, [])

    // Spawn particles
    const spawnParticles = useCallback((x: number, y: number, color: string) => {
        const game = gameRef.current
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2
            const speed = rand(1, 4)
            game.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                size: rand(2, 5),
                color
            })
        }
    }, [])

    // Game loop
    const gameLoop = useCallback((time: number) => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const game = gameRef.current
        const dt = time - game.lastTime
        game.lastTime = time

        const width = canvas.width
        const height = canvas.height

        // Clear canvas with cyberpunk background
        ctx.fillStyle = '#0a0a0f'
        ctx.fillRect(0, 0, width, height)

        // Draw grid
        ctx.strokeStyle = CONFIG.colors.grid
        ctx.lineWidth = 1
        for (let x = 0; x < width; x += 50) {
            ctx.beginPath()
            ctx.moveTo(x, 0)
            ctx.lineTo(x, height)
            ctx.stroke()
        }
        for (let y = 0; y < height; y += 50) {
            ctx.beginPath()
            ctx.moveTo(0, y)
            ctx.lineTo(width, y)
            ctx.stroke()
        }

        if (game.snake.alive) {
            // Handle input
            const keys = game.keys
            if (keys['arrowup'] || keys['w']) game.snake.targetAngle = -Math.PI / 2
            else if (keys['arrowdown'] || keys['s']) game.snake.targetAngle = Math.PI / 2
            else if (keys['arrowleft'] || keys['a']) game.snake.targetAngle = Math.PI
            else if (keys['arrowright'] || keys['d']) game.snake.targetAngle = 0

            const boost = keys['shift'] || keys[' ']

            // Smooth turning
            let diff = game.snake.targetAngle - game.snake.angle
            while (diff <= -Math.PI) diff += Math.PI * 2
            while (diff > Math.PI) diff -= Math.PI * 2
            game.snake.angle += diff * CONFIG.turnSpeed

            // Move speed
            const speed = boost ? CONFIG.sprintSpeed : CONFIG.baseSpeed
            const moveDist = speed * (dt / (1000 / 60))

            // Move head
            game.snake.head.x += Math.cos(game.snake.angle) * moveDist
            game.snake.head.y += Math.sin(game.snake.angle) * moveDist

            // Wall collision (wrap around)
            if (game.snake.head.x < 0) game.snake.head.x = width
            if (game.snake.head.x > width) game.snake.head.x = 0
            if (game.snake.head.y < 0) game.snake.head.y = height
            if (game.snake.head.y > height) game.snake.head.y = 0

            // Update body segments (follow the leader)
            const dragSegment = (i: number, tx: number, ty: number) => {
                const seg = game.snake.segments[i]
                const d = dist(seg.x, seg.y, tx, ty)
                if (d > 100) { seg.x = tx; seg.y = ty; return }
                if (d === 0) return
                const angle = Math.atan2(ty - seg.y, tx - seg.x)
                seg.x = tx - Math.cos(angle) * CONFIG.segmentDist
                seg.y = ty - Math.sin(angle) * CONFIG.segmentDist
            }

            dragSegment(0, game.snake.head.x, game.snake.head.y)
            for (let i = 1; i < game.snake.segments.length; i++) {
                dragSegment(i, game.snake.segments[i - 1].x, game.snake.segments[i - 1].y)
            }

            // Self collision
            for (let i = 10; i < game.snake.segments.length; i++) {
                if (dist(game.snake.head.x, game.snake.head.y, game.snake.segments[i].x, game.snake.segments[i].y) < 12) {
                    game.snake.alive = false
                    spawnParticles(game.snake.head.x, game.snake.head.y, '#ff0080')
                    setGameState('gameover')

                    // Update high score
                    if (game.score > highScore) {
                        setHighScore(game.score)
                        localStorage.setItem('snake_highscore', game.score.toString())
                    }

                    // Submit score to server
                    if (token) {
                        fetch('http://localhost:8000/leaderboard/submit', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                game_slug: 'snake',
                                score: game.score
                            })
                        }).catch(console.error)
                    }
                }
            }

            // Food collision
            if (dist(game.snake.head.x, game.snake.head.y, game.food.x, game.food.y) < 20) {
                // Eat food
                spawnParticles(game.food.x, game.food.y, CONFIG.colors.food)

                // Grow snake
                const last = game.snake.segments[game.snake.segments.length - 1]
                for (let i = 0; i < CONFIG.growthPerFood; i++) {
                    game.snake.segments.push({ x: last.x, y: last.y })
                }

                // Update score
                game.score += 10
                setScore(game.score)

                // Respawn food
                game.food = {
                    x: rand(50, width - 50),
                    y: rand(50, height - 50),
                    pulse: 0
                }
            }

            // Update food pulse
            game.food.pulse = Math.sin(time * 0.005) * 3
        }

        // Update and draw particles
        game.particles = game.particles.filter(p => p.life > 0)
        game.particles.forEach(p => {
            p.x += p.vx
            p.y += p.vy
            p.vx *= 0.95
            p.vy *= 0.95
            p.life -= 0.02

            ctx.globalAlpha = p.life
            ctx.fillStyle = p.color
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
            ctx.fill()
            ctx.globalAlpha = 1
        })

        // Draw food
        ctx.shadowBlur = 20
        ctx.shadowColor = CONFIG.colors.food
        ctx.fillStyle = CONFIG.colors.food
        ctx.beginPath()
        ctx.arc(game.food.x, game.food.y, 8 + game.food.pulse, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(game.food.x, game.food.y, 12 - game.food.pulse, 0, Math.PI * 2)
        ctx.stroke()
        ctx.shadowBlur = 0

        // Draw snake
        if (game.snake.alive || game.particles.length > 0) {
            // Draw body with gradient
            ctx.shadowBlur = 15
            ctx.shadowColor = CONFIG.colors.snake.glow

            for (let i = game.snake.segments.length - 1; i >= 0; i--) {
                const seg = game.snake.segments[i]
                const progress = 1 - (i / game.snake.segments.length)
                const size = 6 + progress * 8

                ctx.fillStyle = CONFIG.colors.snake.main
                ctx.globalAlpha = 0.3 + progress * 0.7
                ctx.beginPath()
                ctx.arc(seg.x, seg.y, size, 0, Math.PI * 2)
                ctx.fill()
            }

            // Draw head
            ctx.globalAlpha = 1
            ctx.fillStyle = CONFIG.colors.snake.main
            ctx.beginPath()
            ctx.arc(game.snake.head.x, game.snake.head.y, 14, 0, Math.PI * 2)
            ctx.fill()

            // Draw eyes
            const eyeOffset = 5
            const eyeAngle1 = game.snake.angle - 0.5
            const eyeAngle2 = game.snake.angle + 0.5

            ctx.fillStyle = '#0a0a0f'
            ctx.beginPath()
            ctx.arc(
                game.snake.head.x + Math.cos(eyeAngle1) * eyeOffset,
                game.snake.head.y + Math.sin(eyeAngle1) * eyeOffset,
                3, 0, Math.PI * 2
            )
            ctx.fill()
            ctx.beginPath()
            ctx.arc(
                game.snake.head.x + Math.cos(eyeAngle2) * eyeOffset,
                game.snake.head.y + Math.sin(eyeAngle2) * eyeOffset,
                3, 0, Math.PI * 2
            )
            ctx.fill()

            ctx.shadowBlur = 0
        }

        game.animationId = requestAnimationFrame(gameLoop)
    }, [spawnParticles, highScore, token])

    // Start game
    const startGame = useCallback(() => {
        initGame()
        setGameState('playing')
        gameRef.current.lastTime = performance.now()
        gameRef.current.animationId = requestAnimationFrame(gameLoop)
    }, [initGame, gameLoop])

    // Handle keyboard
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            gameRef.current.keys[e.key.toLowerCase()] = true

            // Prevent scrolling with arrow keys
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
                e.preventDefault()
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
            cancelAnimationFrame(gameRef.current.animationId)
        }
    }, [])

    // Handle canvas resize
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const resizeCanvas = () => {
            const container = canvas.parentElement
            if (container) {
                canvas.width = container.clientWidth
                canvas.height = container.clientHeight
            }
        }

        resizeCanvas()
        window.addEventListener('resize', resizeCanvas)
        return () => window.removeEventListener('resize', resizeCanvas)
    }, [])

    return (
        <div className="snake-game">
            <div className="game-header">
                <h2>HYPER SNAKE</h2>
                <div className="score-display">
                    <div className="score-card">
                        <span className="label">Score</span>
                        <span className="value">{score}</span>
                    </div>
                    <div className="score-card">
                        <span className="label">Best</span>
                        <span className="value best">{highScore}</span>
                    </div>
                </div>
            </div>

            <div className="game-container">
                <canvas ref={canvasRef} />

                {gameState === 'menu' && (
                    <motion.div
                        className="overlay"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <h3>READY?</h3>
                        <p>Use arrow keys or WASD to move</p>
                        <p>Hold SHIFT or SPACE to sprint</p>
                        <button onClick={startGame} className="btn btn-primary">
                            START GAME
                        </button>
                    </motion.div>
                )}

                {gameState === 'gameover' && (
                    <motion.div
                        className="overlay"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <h3 className="text-magenta">GAME OVER</h3>
                        <p className="final-score">Score: <span className="text-cyan">{score}</span></p>
                        {score > highScore && <p className="new-record">🎉 NEW RECORD!</p>}
                        {!user && <p className="login-hint">Login to save your scores!</p>}
                        <button onClick={startGame} className="btn btn-primary">
                            PLAY AGAIN
                        </button>
                    </motion.div>
                )}
            </div>

            <style>{`
        .snake-game {
          width: 100%;
          max-width: 900px;
        }
        
        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-lg);
        }
        
        .game-header h2 {
          margin: 0;
        }
        
        .score-display {
          display: flex;
          gap: var(--space-md);
        }
        
        .score-card {
          background: var(--bg-card);
          border: 1px solid rgba(0, 255, 255, 0.2);
          padding: var(--space-sm) var(--space-lg);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 80px;
        }
        
        .score-card .label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: uppercase;
        }
        
        .score-card .value {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--neon-cyan);
        }
        
        .score-card .value.best {
          color: var(--neon-magenta);
        }
        
        .game-container {
          position: relative;
          width: 100%;
          height: 500px;
          border: 2px solid rgba(0, 255, 255, 0.3);
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: var(--bg-primary);
        }
        
        .game-container canvas {
          width: 100%;
          height: 100%;
        }
        
        .overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(10, 10, 15, 0.95);
          border: 1px solid rgba(0, 255, 255, 0.3);
          padding: var(--space-2xl);
          border-radius: var(--radius-lg);
          text-align: center;
          min-width: 300px;
        }
        
        .overlay h3 {
          font-size: 2rem;
          margin-bottom: var(--space-md);
        }
        
        .overlay p {
          color: var(--text-secondary);
          margin-bottom: var(--space-sm);
        }
        
        .overlay .btn {
          margin-top: var(--space-lg);
        }
        
        .final-score {
          font-size: 1.25rem;
          font-family: var(--font-display);
        }
        
        .new-record {
          color: var(--neon-yellow) !important;
          font-size: 1.25rem;
          font-weight: 700;
        }
        
        .login-hint {
          font-size: 0.875rem;
          color: var(--text-muted) !important;
        }
      `}</style>
        </div>
    )
}
