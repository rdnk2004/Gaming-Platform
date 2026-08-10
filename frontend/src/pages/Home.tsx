import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { soundFx } from '../services/soundFx'

const games = [
  {
    id: 1,
    name: 'Snake',
    slug: 'snake',
    description: 'Classic snake with vector-based movement, particle physics, and organic procedural animations.',
    isMultiplayer: true,
    icon: '🐍',
    color: '#00f260',
    glow: 'rgba(0, 242, 96, 0.45)',
    bgGradient: 'radial-gradient(circle at 50% 50%, #06260f 0%, #020b05 100%)'
  },
  {
    id: 2,
    name: 'Tetris',
    slug: 'tetris',
    description: 'Stack blocks cyberpunk style with customizable classic/ultra modes, combo multipliers, and glitch animations.',
    isMultiplayer: false,
    icon: '🧱',
    color: '#00d4ff',
    glow: 'rgba(0, 212, 255, 0.45)',
    bgGradient: 'radial-gradient(circle at 50% 50%, #072535 0%, #030e14 100%)'
  },
  {
    id: 3,
    name: 'Pong',
    slug: 'pong',
    description: '1v1 high-speed neon battles. Face off against an adaptive AI engine or challenge a local opponent.',
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
    transition: { staggerChildren: 0.15 }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
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

        ctx.fillStyle = idx % 2 === 0 ? 'rgba(0, 240, 255, ' + p.alpha + ')' : 'rgba(139, 92, 246, ' + p.alpha + ')'
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      // Connect close particles with subtle lines
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
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <canvas ref={canvasRef} className="hero-particle-canvas" />
        <div className="hero-glow"></div>
        <h2 className="hero-title">READY PLAYER ONE?</h2>
        <p className="hero-subtitle">
          Welcome to the retro-futuristic arcade block. Choose your grid and dominate the leaderboard.
        </p>

        {/* User Profile Stats HUD Card */}
        {user ? (
          <motion.div 
            className="user-xp-hud"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
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
                <span>XP PROGRESS</span>
                <span className="hud-xp-val">{user.xp} XP total ({currentXpInLevel}/1000 to next level)</span>
              </div>
              <div className="hud-xp-track">
                <div className="hud-xp-fill" style={{ width: `${xpPercentage}%` }}></div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="guest-cta-banner">
            <span>⚡ Connect profile to track XP, level up, and post high scores to the global hall of fame.</span>
            <Link to="/register" className="btn btn-secondary btn-sm" onClick={() => soundFx.playClick()}>JOIN MAINFRAME</Link>
          </div>
        )}

        {/* Live Arena Ticker */}
        <div className="arena-ticker">
          <div className="ticker-item">
            <span className="beacon-dot"></span>
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
          <span className="section-decorator"></span>
        </div>

        <motion.div
          className="games-grid"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {games.map((game) => (
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

      <style>{`
        .home-page {
          max-width: 1200px;
        }

        .hero {
          text-align: center;
          padding: var(--space-2xl) 0;
          margin-bottom: var(--space-xl);
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .hero-glow {
          position: absolute;
          width: 350px;
          height: 120px;
          background: radial-gradient(ellipse, rgba(139, 92, 246, 0.22) 0%, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: -1;
          filter: blur(20px);
        }

        .hero-title {
          font-family: var(--font-display);
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 900;
          letter-spacing: 5px;
          margin-bottom: var(--space-md);
          background: linear-gradient(90deg, #fff 10%, var(--primary) 60%, var(--secondary) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 15px rgba(139, 92, 246, 0.4));
        }
        
        .hero-particle-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
          opacity: 0.6;
        }

        .user-xp-hud {
          margin-top: var(--space-xl);
          width: 100%;
          max-width: 650px;
          background: rgba(13, 9, 28, 0.75);
          border: 1px solid rgba(139, 92, 246, 0.25);
          border-radius: var(--radius-lg);
          padding: 16px 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          backdrop-filter: blur(12px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          position: relative;
          z-index: 1;
        }

        .hud-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .hud-avatar {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          color: var(--bg-primary);
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 12px rgba(0, 240, 255, 0.3);
        }

        .hud-identity {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .hud-name {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 1rem;
          color: #fff;
        }

        .hud-level-badge {
          font-size: 10px;
          color: var(--secondary);
          letter-spacing: 1px;
          font-weight: 700;
        }

        .hud-xp-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .hud-xp-label {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-secondary);
          font-family: var(--font-display);
          letter-spacing: 1px;
        }

        .hud-xp-val {
          color: var(--secondary);
        }

        .hud-xp-track {
          height: 8px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-full);
          overflow: hidden;
          border: 1px solid rgba(139, 92, 246, 0.2);
        }

        .hud-xp-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--primary), var(--secondary));
          border-radius: var(--radius-full);
          transition: width 0.5s ease-out;
          box-shadow: 0 0 8px var(--secondary-glow);
        }

        .guest-cta-banner {
          margin-top: var(--space-lg);
          padding: 12px 24px;
          background: rgba(139, 92, 246, 0.08);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          gap: 15px;
          font-size: 13px;
          color: var(--text-secondary);
          position: relative;
          z-index: 1;
        }

        .btn-sm {
          padding: 6px 14px;
          font-size: 0.75rem;
          white-space: nowrap;
        }

        .arena-ticker {
          display: flex;
          gap: 30px;
          margin-top: var(--space-xl);
          position: relative;
          z-index: 1;
          flex-wrap: wrap;
          justify-content: center;
        }

        .ticker-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-display);
          font-size: 11px;
          letter-spacing: 1.5px;
          color: var(--text-muted);
        }

        .beacon-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #00f260;
          box-shadow: 0 0 10px #00f260;
          animation: beaconPulse 1.5s infinite;
        }

        @keyframes beaconPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.5; }
        }

        .games-section {
          margin-bottom: var(--space-2xl);
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: var(--space-xl);
        }

        .section-title {
          margin: 0;
          font-family: var(--font-display);
          font-size: 20px;
          letter-spacing: 2px;
          color: var(--text);
        }

        .section-decorator {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, rgba(0, 240, 255, 0.3) 0%, transparent 100%);
        }
        
        .games-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: var(--space-xl);
        }

        .card-wrapper {
          height: 100%;
        }
        
        .game-card {
          display: flex;
          flex-direction: column;
          height: 100%;
          text-decoration: none;
          background: rgba(13, 9, 28, 0.7);
          border: 1px solid rgba(139, 92, 246, 0.15);
          border-radius: var(--radius-lg);
          overflow: hidden;
          transition: all var(--transition-normal);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: var(--glass-shadow);
        }
        
        .game-card:hover {
          border-color: var(--game-color);
          box-shadow: 0 12px 30px var(--game-glow);
          transform: translateY(-2px);
        }
        
        .game-card-display {
          width: 100%;
          aspect-ratio: 16/9;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-gradient);
          position: relative;
          border-bottom: 1px solid rgba(139, 92, 246, 0.1);
          overflow: hidden;
        }

        .game-card:hover .game-card-display {
          border-bottom-color: rgba(255,255,255,0.05);
        }
        
        .game-icon {
          font-size: 4.5rem;
          transition: transform var(--transition-slow);
          filter: drop-shadow(0 0 12px var(--game-glow));
        }
        
        .game-card:hover .game-icon {
          transform: scale(1.15) rotate(5deg);
        }

        .launch-indicator {
          position: absolute;
          inset: 0;
          background: rgba(4, 3, 8, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity var(--transition-normal);
        }

        .game-card:hover .launch-indicator {
          opacity: 1;
        }

        .launch-text {
          font-family: var(--font-display);
          font-size: 0.95rem;
          font-weight: 900;
          letter-spacing: 3px;
          color: var(--game-color);
          border: 1px solid var(--game-color);
          padding: 10px 24px;
          border-radius: var(--radius-md);
          box-shadow: 0 0 15px var(--game-glow);
          background: rgba(0, 0, 0, 0.5);
          transform: translateY(10px);
          transition: transform var(--transition-normal);
        }

        .game-card:hover .launch-text {
          transform: translateY(0);
        }
        
        .game-card-content {
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .card-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-sm);
        }
        
        .game-card-title {
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: 1.5px;
          color: #fff;
          margin: 0;
        }

        .game-badge {
          font-family: var(--font-display);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .game-card:hover .game-badge {
          background: rgba(139, 92, 246, 0.1);
          color: var(--game-color);
          border-color: hsla(var(--primary-hue), 90%, 65%, 0.25);
        }
        
        .game-card-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }

        .key-hints-container {
          background: rgba(13, 9, 28, 0.45);
          border: 1px solid rgba(139, 92, 246, 0.1);
          border-radius: var(--radius-lg);
          padding: var(--space-xl);
          margin-top: var(--space-xl);
        }

        .hints-title {
          text-align: center;
          margin-bottom: var(--space-lg);
          font-size: 16px;
          letter-spacing: 3px;
          color: var(--text-secondary);
        }
        
        .key-hints {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }
        
        .key-group {
          background: rgba(4, 3, 8, 0.5);
          padding: var(--space-lg);
          border-radius: var(--radius-lg);
          border: 1px solid rgba(255, 255, 255, 0.02);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .key-title {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .p1-color {
          color: var(--secondary);
          text-shadow: 0 0 5px var(--secondary-glow);
        }

        .p2-color {
          color: var(--primary);
          text-shadow: 0 0 5px var(--primary-glow);
        }
        
        .keys-layout {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--space-md);
        }

        .keys {
          display: flex;
          gap: 6px;
        }
        
        .key-extra {
          font-size: 12px;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        @media (max-width: 768px) {
          .key-hints {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }
      `}</style>
    </div>
  )
}
