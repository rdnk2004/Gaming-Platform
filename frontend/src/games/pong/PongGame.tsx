import { useEffect, useRef, useState, useCallback } from 'react'

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
        aiTargetY: 250
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

    const gameLoop = useCallback((timestamp: number) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const game = gameRef.current
        const dt = Math.min((timestamp - game.lastTime) / 16.67, 2) // Normalize to ~60fps
        game.lastTime = timestamp

        // P1 controls (W/S)
        if (game.keys['w'] || game.keys['arrowup']) {
            game.p1.y = Math.max(0, game.p1.y - CONFIG.paddleSpeed * dt)
        }
        if (game.keys['s'] || game.keys['arrowdown']) {
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
        }

        // Paddle collision - P1
        if (
            game.ball.x - CONFIG.ballSize <= game.p1.x + CONFIG.paddleWidth &&
            game.ball.x + CONFIG.ballSize >= game.p1.x &&
            game.ball.y >= game.p1.y &&
            game.ball.y <= game.p1.y + CONFIG.paddleHeight &&
            game.ball.vx < 0
        ) {
            // Calculate bounce angle based on where ball hit paddle
            const hitPos = (game.ball.y - game.p1.y) / CONFIG.paddleHeight
            const angle = (hitPos - 0.5) * Math.PI * 0.7
            game.ball.speed = Math.min(game.ball.speed + 0.3, CONFIG.maxBallSpeed)
            game.ball.vx = Math.cos(angle) * game.ball.speed
            game.ball.vy = Math.sin(angle) * game.ball.speed
            game.ball.x = game.p1.x + CONFIG.paddleWidth + CONFIG.ballSize
            createParticles(game.ball.x, game.ball.y, CONFIG.colors.p1, 10)
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
        }

        // Scoring
        if (game.ball.x < 0) {
            game.p2.score++
            setScores({ p1: game.p1.score, p2: game.p2.score })
            createParticles(50, game.height / 2, CONFIG.colors.p2, 20)
            if (game.p2.score >= CONFIG.winScore) {
                setWinner(mode === '1p' ? 'CPU Wins!' : 'Player 2 Wins!')
                setGameState('gameover')
                return
            }
            resetBall(1)
        }
        if (game.ball.x > game.width) {
            game.p1.score++
            setScores({ p1: game.p1.score, p2: game.p2.score })
            createParticles(game.width - 50, game.height / 2, CONFIG.colors.p1, 20)
            if (game.p1.score >= CONFIG.winScore) {
                setWinner('Player 1 Wins!')
                setGameState('gameover')
                return
            }
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
    }, [mode, createParticles, resetBall, drawGame])

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

            <style>{`
        .pong-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 40px;
          background: radial-gradient(circle at 50% 50%, #1e293b 0%, #000 100%);
          position: relative;
        }
        
        .game-brand {
          text-align: center;
          margin-bottom: 20px;
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
        }
        
        .game-canvas {
          border-radius: 8px;
          box-shadow: 0 0 40px rgba(0, 242, 96, 0.2);
        }
        
        .overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(10, 10, 12, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px);
          padding: 40px;
          border-radius: 24px;
          text-align: center;
          min-width: 320px;
          z-index: 100;
        }
        
        .overlay h2 {
          margin: 0 0 15px;
          font-family: 'Rajdhani', sans-serif;
          font-size: 32px;
          color: #00f260;
        }
        
        .overlay p {
          color: #94a3b8;
          margin: 0 0 25px;
          font-size: 16px;
        }
        
        .mode-select {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-bottom: 25px;
        }
        
        .mode-btn {
          background: transparent;
          border: 1px solid #334155;
          color: #64748b;
          padding: 12px 25px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 16px;
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
          display: flex;
          gap: 20px;
          justify-content: center;
          margin-bottom: 25px;
        }
        
        .key-group {
          background: rgba(255, 255, 255, 0.03);
          padding: 15px;
          border-radius: 10px;
        }
        
        .key-title {
          font-size: 12px;
          text-transform: uppercase;
          margin-bottom: 8px;
          display: block;
          font-weight: 600;
        }
        
        .p1-color { color: #00f260; }
        .p2-color { color: #0575e6; }
        
        .keys {
          display: flex;
          gap: 4px;
          align-items: center;
          font-size: 12px;
          color: #94a3b8;
        }
        
        .k-box {
          background: #334155;
          padding: 4px 8px;
          border-radius: 4px;
          border-bottom: 2px solid #1e293b;
          font-family: monospace;
          color: #cbd5e1;
        }
        
        .btn-start {
          background: linear-gradient(135deg, #00f260, #00c853);
          border: none;
          padding: 14px 35px;
          border-radius: 50px;
          color: #000;
          font-weight: 700;
          font-family: 'Rajdhani', sans-serif;
          font-size: 18px;
          text-transform: uppercase;
          letter-spacing: 2px;
          cursor: pointer;
          box-shadow: 0 10px 20px rgba(0, 242, 96, 0.3);
          transition: all 0.2s;
        }
        
        .btn-start:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(0, 242, 96, 0.4);
        }
      `}</style>
        </div>
    )
}
