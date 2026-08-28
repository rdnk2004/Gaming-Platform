import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { soundFx } from '../services/soundFx'
import { GameInfo } from '../types/game'

const GAMES: GameInfo[] = [
  {
    id: 1,
    name: 'Neon Viper',
    slug: 'snake',
    description: 'Vector-based movement, particle physics, big bubbles, speed power-ups, and 2-player versus mode.',
    isMultiplayer: true,
    icon: '🐍',
    color: '#00f260',
    glow: 'rgba(0, 242, 96, 0.45)',
    bgGradient: 'radial-gradient(circle at 50% 50%, #06260f 0%, #020b05 100%)'
  },
  {
    id: 2,
    name: 'Cyber Tetris',
    slug: 'tetris',
    description: 'Quantum block matrix with SRS wall-kicks, ghost projection, hold queues, and ultra combo multipliers.',
    isMultiplayer: false,
    icon: '🧱',
    color: '#00d4ff',
    glow: 'rgba(0, 212, 255, 0.45)',
    bgGradient: 'radial-gradient(circle at 50% 50%, #072535 0%, #030e14 100%)'
  },
  {
    id: 3,
    name: 'Neon Pong',
    slug: 'pong',
    description: '1v1 high-speed laser ball combat. Face off against an adaptive AI engine or challenge a local opponent.',
    isMultiplayer: true,
    icon: '🏓',
    color: '#ff0055',
    glow: 'rgba(255, 0, 85, 0.45)',
    bgGradient: 'radial-gradient(circle at 50% 50%, #2f0012 0%, #0d0006 100%)'
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 25 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 15 }
  }
}

export default function Home() {
  const { user } = useAuthStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Animated background cyber particle mesh
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    const particles: Array<{ x: number; y: number; vx: number; vy: number; radius: number; alpha: number }> = []

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth
      canvas.height = 320
    }
    resize()

    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.2
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p, idx) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1

        ctx.fillStyle = idx % 2 === 0 ? `rgba(0, 240, 255, ${p.alpha})` : `rgba(139, 92, 246, ${p.alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      // Connect close particles with subtle cyber links
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const d = Math.hypot(dx, dy)
          if (d < 110) {
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.15 * (1 - d / 110)})`
            ctx.lineWidth = 0.8
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
      animationId = requestAnimationFrame(draw)
    }
    draw()

    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  // XP Progress calculation
  const currentXpInLevel = user ? user.xp % 1000 : 0
  const xpPercentage = Math.min(100, Math.max(0, Math.floor((currentXpInLevel / 1000) * 100)))

  return (
    <div className="container home-page">
      <motion.section
        className="hero"
        initial={{ opacity: 0, y: -25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <canvas ref={canvasRef} className="hero-particle-canvas" />
        <div className="hero-glow" />
        <h2 className="hero-title">READY PLAYER ONE?</h2>
        <p className="hero-subtitle">
          Welcome to the retro-futuristic arcade grid. Choose your battle arena and claim the global leaderboard.
        </p>

        {/* User Profile Stats HUD Card */}
        {user ? (
          <motion.div
            className="user-xp-hud"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="hud-left">
              <span className="hud-avatar">{user.username.charAt(0).toUpperCase()}</span>
              <div className="hud-identity">
                <span className="hud-name">{user.username}</span>
                <span className="hud-level-badge">LEVEL {user.level} ARENA OPERATIVE</span>
              </div>
            </div>
            <div className="hud-xp-section">
              <div className="hud-xp-label">
                <span>XP PROGRESSION</span>
                <span className="hud-xp-val">{user.xp} XP total ({currentXpInLevel}/1000 to next level)</span>
              </div>
              <div className="hud-xp-track">
                <div className="hud-xp-fill" style={{ width: `${xpPercentage}%` }} />
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="guest-cta-banner">
            <span>⚡ Connect profile to track XP, level up, and post high scores to the global hall of fame.</span>
            <Link to="/register" className="btn btn-secondary btn-sm" onClick={() => soundFx.playClick()}>
              JOIN MAINFRAME
            </Link>
          </div>
        )}

        {/* Live Arena Ticker */}
        <div className="arena-ticker">
          <div className="ticker-item">
            <span className="beacon-dot" />
            <span className="ticker-text">ARENA ONLINE</span>
          </div>
          <div className="ticker-item">
            <span className="ticker-icon">🎮</span>
            <span className="ticker-text">3 HYPER ARENAS READY</span>
          </div>
          <div className="ticker-item">
            <span className="ticker-icon">⚡</span>
            <span className="ticker-text">REAL-TIME LEADERBOARDS</span>
          </div>
        </div>
      </motion.section>

      <section className="games-section">
        <div className="section-header">
          <h2 className="section-title">Select Arena</h2>
          <span className="section-decorator" />
        </div>

        <motion.div
          className="games-grid"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {GAMES.map((game) => (
            <motion.div
              key={game.id}
              variants={cardVariants}
              whileHover={{ y: -6 }}
              className="card-wrapper"
            >
              <Link
                to={`/game/${game.slug}`}
                className="game-card"
                onClick={() => soundFx.playClick()}
                style={{
                  '--game-color': game.color,
                  '--game-glow': game.glow,
                  '--bg-gradient': game.bgGradient
                } as React.CSSProperties}
              >
                <div className="game-card-display">
                  <span className="game-icon">{game.icon}</span>
                  <div className="launch-indicator">
                    <span className="launch-text">LOAD MISSION</span>
                  </div>
                </div>
                <div className="game-card-content">
                  <div className="card-top-row">
                    <h3 className="game-card-title">{game.name}</h3>
                    <span className="game-badge">
                      {game.isMultiplayer ? 'MULTIPLAYER' : 'SINGLEPLAYER'}
                    </span>
                  </div>
                  <p className="game-card-desc">{game.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="key-hints-container">
        <h3 className="hints-title">Arcade Key Bindings</h3>
        <div className="key-hints">
          <div className="key-group">
            <span className="key-title p1-color">Player 1 Controls</span>
            <div className="keys-layout">
              <div className="keys">
                <span className="k-box">↑</span>
                <span className="k-box">↓</span>
                <span className="k-box">←</span>
                <span className="k-box">→</span>
              </div>
              <span className="key-extra">
                + <span className="k-box">Shift</span> Boost / Sprint
              </span>
            </div>
          </div>
          <div className="key-group">
            <span className="key-title p2-color">Player 2 Controls</span>
            <div className="keys-layout">
              <div className="keys">
                <span className="k-box">W</span>
                <span className="k-box">S</span>
                <span className="k-box">A</span>
                <span className="k-box">D</span>
              </div>
              <span className="key-extra">
                + <span className="k-box">Space</span> Boost / Sprint
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
