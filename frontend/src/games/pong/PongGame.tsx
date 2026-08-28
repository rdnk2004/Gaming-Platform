import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuthStore, API_URL } from '../../store/authStore'
import { soundFx } from '../../services/soundFx'

/**
 * CYBER PONG - Cyberarcade Edition
 * Classic Pong with cyberpunk neon aesthetics
 */

const CONFIG = {
    paddleWidth: 15,
    paddleHeight: 100,
    paddleSpeed: 8,
    ballSize: 12,
    ballSpeed: 6,
    maxBallSpeed: 15,
    winScore: 11,
    colors: {
        p1: '#00f260',
        p2: '#0575e6',
        ball: '#ff0055',
        court: '#0f172a'
    }
}

interface Ball {
    x: number
    y: number
    vx: number
    vy: number
    speed: number
}

interface Paddle {
    x: number
    y: number
    score: number
}

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    life: number
    color: string
    size: number
}

const rand = (min: number, max: number) => Math.random() * (max - min) + min

export default function PongGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu')
    const [mode, setMode] = useState<'1p' | '2p'>('2p')
    const [scores, setScores] = useState({ p1: 0, p2: 0 })
    const [winner, setWinner] = useState<string>('')
    const [isFullscreen, setIsFullscreen] = useState(false)

    const toggleFullscreen = () => {
        const container = containerRef.current
        if (!container) return
        if (!document.fullscreenElement) {
            container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => { })
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => { })
        }
    }

    // Fullscreen change listener
    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement)
        document.addEventListener('fullscreenchange', handler)
        return () => document.removeEventListener('fullscreenchange', handler)
    }, [])

    const gameRef = useRef<{
        ball: Ball
        p1: Paddle
        p2: Paddle
        particles: Particle[]
        keys: Record<string, boolean>
        animationId: number
        lastTime: number
        width: number
        height: number
        aiReactionTime: number
        aiTargetY: number
        gameStartTime: number
    }>({
        ball: { x: 0, y: 0, vx: 0, vy: 0, speed: CONFIG.ballSpeed },
        p1: { x: 0, y: 0, score: 0 },
        p2: { x: 0, y: 0, score: 0 },
        particles: [],
        keys: {},
        animationId: 0,
        lastTime: 0,
        width: 800,
        height: 500,
        aiReactionTime: 0,
        aiTargetY: 250,
        gameStartTime: 0
    })

    const createParticles = useCallback((x: number, y: number, color: string, count: number) => {
        const game = gameRef.current
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2
            const speed = rand(2, 6)
            game.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color,
                size: rand(2, 5)
            })
        }
    }, [])

    const resetBall = useCallback((direction: number = 0) => {
        const game = gameRef.current
        game.ball.x = game.width / 2
        game.ball.y = game.height / 2
        game.ball.speed = CONFIG.ballSpeed

        // Random angle between -45 and 45 degrees
        const angle = (Math.random() - 0.5) * Math.PI / 2
        const dir = direction !== 0 ? direction : (Math.random() > 0.5 ? 1 : -1)
        game.ball.vx = Math.cos(angle) * game.ball.speed * dir
        game.ball.vy = Math.sin(angle) * game.ball.speed
    }, [])

    const drawGame = useCallback((ctx: CanvasRenderingContext2D) => {
        const game = gameRef.current
        const { width, height } = game

        // Clear
        ctx.fillStyle = CONFIG.colors.court
        ctx.fillRect(0, 0, width, height)

        // Center line
        ctx.setLineDash([10, 10])
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(width / 2, 0)
        ctx.lineTo(width / 2, height)
        ctx.stroke()
        ctx.setLineDash([])

        // Draw paddles with glow
        // P1 (left)
        ctx.shadowBlur = 20
        ctx.shadowColor = CONFIG.colors.p1
        ctx.fillStyle = CONFIG.colors.p1
        ctx.fillRect(game.p1.x, game.p1.y, CONFIG.paddleWidth, CONFIG.paddleHeight)

        // P2 (right)
        ctx.shadowColor = CONFIG.colors.p2
        ctx.fillStyle = CONFIG.colors.p2
        ctx.fillRect(game.p2.x, game.p2.y, CONFIG.paddleWidth, CONFIG.paddleHeight)
        ctx.shadowBlur = 0

        // Draw ball with glow
        ctx.shadowBlur = 15
        ctx.shadowColor = CONFIG.colors.ball
        ctx.fillStyle = CONFIG.colors.ball
        ctx.beginPath()
        ctx.arc(game.ball.x, game.ball.y, CONFIG.ballSize, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0

        // Ball trail
        ctx.globalAlpha = 0.3
        ctx.fillStyle = CONFIG.colors.ball
        ctx.beginPath()
        ctx.arc(game.ball.x - game.ball.vx * 2, game.ball.y - game.ball.vy * 2, CONFIG.ballSize * 0.8, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1

        // Draw particles
        game.particles.forEach(p => {
            ctx.globalAlpha = p.life
            ctx.fillStyle = p.color
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
            ctx.fill()
        })
        ctx.globalAlpha = 1

        // Score display
        ctx.font = '48px Rajdhani'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = CONFIG.colors.p1
        ctx.fillText(game.p1.score.toString(), width / 4, 20)
        ctx.fillStyle = CONFIG.colors.p2
        ctx.fillText(game.p2.score.toString(), (width / 4) * 3, 20)

        // Border
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)'
        ctx.lineWidth = 2
        ctx.strokeRect(1, 1, width - 2, height - 2)
    }, [])

    const submitPongScore = useCallback((score: number) => {
        if (mode !== '1p') return
        const token = useAuthStore.getState().token
        if (token) {
            const duration = Math.floor((performance.now() - gameRef.current.gameStartTime) / 1000)
            fetch(`${API_URL}/leaderboard/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    game_slug: 'pong',
                    score: score,
                    duration_seconds: duration > 0 ? duration : 1
                })
            }).catch(err => console.error('Failed to submit score:', err))
        }
    }, [mode])

    const gameLoop = useCallback((timestamp: number) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const game = gameRef.current
        const dt = Math.min((timestamp - game.lastTime) / 16.67, 2) // Normalize to ~60fps
        game.lastTime = timestamp

        // P1 controls (W/S in 2P mode, W/S or Up/Down in 1P mode)
        const p1Up = game.keys['w'] || (mode === '1p' && game.keys['arrowup'])
        const p1Down = game.keys['s'] || (mode === '1p' && game.keys['arrowdown'])
        if (p1Up) {
            game.p1.y = Math.max(0, game.p1.y - CONFIG.paddleSpeed * dt)
        }
        if (p1Down) {
            game.p1.y = Math.min(game.height - CONFIG.paddleHeight, game.p1.y + CONFIG.paddleSpeed * dt)
        }

        // P2 controls (Up/Down for 2P, AI for 1P)
        if (mode === '2p') {
            if (game.keys['arrowup']) {
                game.p2.y = Math.max(0, game.p2.y - CONFIG.paddleSpeed * dt)
            }
            if (game.keys['arrowdown']) {
                game.p2.y = Math.min(game.height - CONFIG.paddleHeight, game.p2.y + CONFIG.paddleSpeed * dt)
            }
        } else {
            // AI
            game.aiReactionTime -= dt
            if (game.aiReactionTime <= 0) {
                game.aiReactionTime = rand(5, 15)
                // Predict where ball will be
                if (game.ball.vx > 0) {
                    const timeToReach = (game.p2.x - game.ball.x) / game.ball.vx
                    game.aiTargetY = game.ball.y + game.ball.vy * timeToReach
                    // Add some imperfection
                    game.aiTargetY += rand(-30, 30)
                }
            }

            const paddleCenter = game.p2.y + CONFIG.paddleHeight / 2
            const diff = game.aiTargetY - paddleCenter
            const aiSpeed = CONFIG.paddleSpeed * 0.8

            if (Math.abs(diff) > 10) {
                if (diff < 0) {
                    game.p2.y = Math.max(0, game.p2.y - aiSpeed * dt)
                } else {
                    game.p2.y = Math.min(game.height - CONFIG.paddleHeight, game.p2.y + aiSpeed * dt)
                }
            }
        }

        // Ball movement
        game.ball.x += game.ball.vx * dt
        game.ball.y += game.ball.vy * dt

        // Top/bottom wall collision
        if (game.ball.y - CONFIG.ballSize <= 0 || game.ball.y + CONFIG.ballSize >= game.height) {
            game.ball.vy *= -1
            game.ball.y = Math.max(CONFIG.ballSize, Math.min(game.height - CONFIG.ballSize, game.ball.y))
            createParticles(game.ball.x, game.ball.y, '#ffffff', 5)
            soundFx.playImpact()
        }

        // Paddle collision - P1
        if (
            game.ball.x - CONFIG.ballSize <= game.p1.x + CONFIG.paddleWidth &&
            game.ball.x + CONFIG.ballSize >= game.p1.x &&
            game.ball.y >= game.p1.y &&
            game.ball.y <= game.p1.y + CONFIG.paddleHeight &&
            game.ball.vx < 0
        ) {
            const hitPos = (game.ball.y - game.p1.y) / CONFIG.paddleHeight
            const angle = (hitPos - 0.5) * Math.PI * 0.7
            game.ball.speed = Math.min(game.ball.speed + 0.3, CONFIG.maxBallSpeed)
            game.ball.vx = Math.cos(angle) * game.ball.speed
            game.ball.vy = Math.sin(angle) * game.ball.speed
            game.ball.x = game.p1.x + CONFIG.paddleWidth + CONFIG.ballSize
            createParticles(game.ball.x, game.ball.y, CONFIG.colors.p1, 10)
            soundFx.playImpact()
        }

        // Paddle collision - P2
        if (
            game.ball.x + CONFIG.ballSize >= game.p2.x &&
            game.ball.x - CONFIG.ballSize <= game.p2.x + CONFIG.paddleWidth &&
            game.ball.y >= game.p2.y &&
            game.ball.y <= game.p2.y + CONFIG.paddleHeight &&
            game.ball.vx > 0
        ) {
            const hitPos = (game.ball.y - game.p2.y) / CONFIG.paddleHeight
            const angle = (hitPos - 0.5) * Math.PI * 0.7
            game.ball.speed = Math.min(game.ball.speed + 0.3, CONFIG.maxBallSpeed)
            game.ball.vx = -Math.cos(angle) * game.ball.speed
            game.ball.vy = Math.sin(angle) * game.ball.speed
            game.ball.x = game.p2.x - CONFIG.ballSize
            createParticles(game.ball.x, game.ball.y, CONFIG.colors.p2, 10)
            soundFx.playImpact()
        }

        // Scoring
        if (game.ball.x < 0) {
            game.p2.score++
            setScores({ p1: game.p1.score, p2: game.p2.score })
            createParticles(50, game.height / 2, CONFIG.colors.p2, 20)
            if (game.p2.score >= CONFIG.winScore) {
                setWinner(mode === '1p' ? 'CPU Wins!' : 'Player 2 Wins!')
                setGameState('gameover')
                soundFx.playFanfare()
                submitPongScore(game.p1.score)
                return
            }
            soundFx.playEat()
            resetBall(1)
        }
        if (game.ball.x > game.width) {
            game.p1.score++
            setScores({ p1: game.p1.score, p2: game.p2.score })
            createParticles(game.width - 50, game.height / 2, CONFIG.colors.p1, 20)
            if (game.p1.score >= CONFIG.winScore) {
                setWinner('Player 1 Wins!')
                setGameState('gameover')
                soundFx.playFanfare()
                submitPongScore(game.p1.score)
                return
            }
            soundFx.playEat()
            resetBall(-1)
        }

        // Update particles
        game.particles = game.particles.filter(p => p.life > 0)
        game.particles.forEach(p => {
            p.x += p.vx
            p.y += p.vy
            p.vx *= 0.95
            p.vy *= 0.95
            p.life -= 0.03
        })

        drawGame(ctx)
        game.animationId = requestAnimationFrame(gameLoop)
    }, [mode, createParticles, resetBall, drawGame, submitPongScore])

    const startGame = useCallback(() => {
        const container = containerRef.current
        const canvas = canvasRef.current
        if (!container || !canvas) return

        const width = 800
        const height = 500
        canvas.width = width
        canvas.height = height

        const game = gameRef.current
        game.width = width
        game.height = height
        game.particles = []

        // Reset paddles
        game.p1 = { x: 30, y: height / 2 - CONFIG.paddleHeight / 2, score: 0 }
        game.p2 = { x: width - 30 - CONFIG.paddleWidth, y: height / 2 - CONFIG.paddleHeight / 2, score: 0 }

        resetBall()
        setScores({ p1: 0, p2: 0 })
        setGameState('playing')
        game.lastTime = performance.now()
        game.gameStartTime = game.lastTime
        game.animationId = requestAnimationFrame(gameLoop)
    }, [resetBall, gameLoop])

    // Keyboard handlers
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase()
            gameRef.current.keys[key] = true

            if (['w', 's', 'arrowup', 'arrowdown'].includes(key)) {
                e.preventDefault()
            }

            if ((key === 'escape' || key === 'p') && gameState === 'playing') {
                cancelAnimationFrame(gameRef.current.animationId)
                setGameState('paused')
            }
            if ((key === 'escape' || key === 'p') && gameState === 'paused') {
                gameRef.current.lastTime = performance.now()
                gameRef.current.animationId = requestAnimationFrame(gameLoop)
                setGameState('playing')
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
    }, [gameState, gameLoop])

    return (
        <div ref={containerRef} className="pong-container">
            <div className="game-brand">
                <h1>Cyber Pong</h1>
                <span>NEON BATTLES</span>
            </div>

            <canvas ref={canvasRef} className="game-canvas" />

            {/* Menu */}
            {gameState === 'menu' && (
                <div className="overlay">
                    <h2>CYBER PONG</h2>
                    <p>First to {CONFIG.winScore} wins!</p>

                    <div className="mode-select">
                        <button className={`mode-btn ${mode === '1p' ? 'active' : ''}`} onClick={() => setMode('1p')}>
                            vs CPU
                        </button>
                        <button className={`mode-btn ${mode === '2p' ? 'active' : ''}`} onClick={() => setMode('2p')}>
                            2 Players
                        </button>
                    </div>

                    <div className="key-hint">
                        <div className="key-group">
                            <span className="key-title p1-color">Player 1</span>
                            <div className="keys">
                                <span className="k-box">W</span><span className="k-box">S</span> or
                                <span className="k-box">↑</span><span className="k-box">↓</span>
                            </div>
                        </div>
                        {mode === '2p' && (
                            <div className="key-group">
                                <span className="key-title p2-color">Player 2</span>
                                <div className="keys">
                                    <span className="k-box">↑</span><span className="k-box">↓</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <button className="btn-start" onClick={startGame}>START GAME</button>
                    
                    <div style={{ marginTop: '15px' }}>
                        <button className="mode-btn" onClick={toggleFullscreen}>
                            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                        </button>
                    </div>
                </div>
            )}

            {/* Paused */}
            {gameState === 'paused' && (
                <div className="overlay">
                    <h2>PAUSED</h2>
                    <button className="btn-start" onClick={() => {
                        gameRef.current.lastTime = performance.now()
                        gameRef.current.animationId = requestAnimationFrame(gameLoop)
                        setGameState('playing')
                    }}>RESUME</button>
                </div>
            )}

            {/* Game Over */}
            {gameState === 'gameover' && (
                <div className="overlay">
                    <h2>{winner}</h2>
                    <p>Score: {scores.p1} - {scores.p2}</p>
                    <button className="btn-start" onClick={startGame}>PLAY AGAIN</button>
                </div>
            )}
        </div>
    )
}
