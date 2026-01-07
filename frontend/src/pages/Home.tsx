import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const games = [
  {
    id: 1,
    name: 'Snake',
    slug: 'snake',
    description: 'Classic snake with vector-based movement',
    isMultiplayer: true,
    icon: '🐍'
  },
  {
    id: 2,
    name: 'Tetris',
    slug: 'tetris',
    description: 'Stack blocks cyberpunk style',
    isMultiplayer: false,
    icon: '🧱'
  },
  {
    id: 3,
    name: 'Pong',
    slug: 'pong',
    description: '1v1 neon battles',
    isMultiplayer: true,
    icon: '🏓',
    comingSoon: true
  }
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function Home() {
  return (
    <div className="container">
      <motion.section
        className="hero"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 style={{ marginBottom: '8px' }}>Ready?</h2>
        <p className="hero-subtitle">
          Select your game and start the chase.
        </p>
      </motion.section>

      <section className="games-section">
        <h2>Select Your Game</h2>
        <motion.div
          className="games-grid"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {games.map((game) => (
            <motion.div key={game.id} variants={item}>
              {game.comingSoon ? (
                <div className="game-card game-card--disabled">
                  <div className="game-card-placeholder">
                    <span className="game-icon">{game.icon}</span>
                  </div>
                  <div className="game-card-overlay">
                    <h3 className="game-card-title">{game.name}</h3>
                    <span className="coming-soon-badge">Coming Soon</span>
                  </div>
                </div>
              ) : (
                <Link to={`/game/${game.slug}`} className="game-card">
                  <div className="game-card-placeholder">
                    <span className="game-icon">{game.icon}</span>
                  </div>
                  <div className="game-card-overlay">
                    <h3 className="game-card-title">{game.name}</h3>
                    <p className="game-card-meta">
                      {game.isMultiplayer ? '🎮 Multiplayer' : '🕹️ Single Player'}
                    </p>
                  </div>
                </Link>
              )}
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="key-hints">
        <div className="key-group">
          <span className="key-title p1-color">Player 1</span>
          <div className="keys">
            <span className="k-box">↑</span>
            <span className="k-box">↓</span>
            <span className="k-box">←</span>
            <span className="k-box">→</span>
            <span className="key-extra">+ <span className="k-box">Shift</span> Sprint</span>
          </div>
        </div>
        <div className="key-group">
          <span className="key-title p2-color">Player 2</span>
          <div className="keys">
            <span className="k-box">W</span>
            <span className="k-box">S</span>
            <span className="k-box">A</span>
            <span className="k-box">D</span>
            <span className="key-extra">+ <span className="k-box">Space</span> Sprint</span>
          </div>
        </div>
      </section>

      <style>{`
        .hero {
          text-align: center;
          padding: var(--space-xl) 0;
          margin-bottom: var(--space-xl);
        }
        
        .hero-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0;
        }
        
        .games-section h2 {
          margin-bottom: var(--space-xl);
        }
        
        .games-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--space-xl);
          margin-bottom: var(--space-2xl);
        }
        
        .game-card {
          display: block;
          position: relative;
          aspect-ratio: 4/3;
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: var(--glass);
          border: 1px solid var(--glass-border);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition: all 0.2s;
          text-decoration: none;
        }
        
        .game-card:hover {
          border-color: var(--primary);
          box-shadow: 0 10px 20px rgba(0, 242, 96, 0.3);
          transform: translateY(-2px);
        }
        
        .game-card--disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .game-card--disabled:hover {
          transform: none;
          box-shadow: none;
          border-color: var(--glass-border);
        }
        
        .game-card-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%);
        }
        
        .game-icon {
          font-size: 4rem;
          filter: grayscale(0.3);
          transition: all 0.2s;
        }
        
        .game-card:hover .game-icon {
          filter: grayscale(0);
          transform: scale(1.1);
        }
        
        .game-card-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: var(--space-lg);
          background: linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 100%);
        }
        
        .game-card-title {
          font-size: 1.25rem;
          margin-bottom: var(--space-xs);
          color: var(--text);
        }
        
        .game-card-meta {
          font-size: 0.875rem;
          color: var(--primary);
          margin: 0;
        }
        
        .coming-soon-badge {
          display: inline-block;
          background: var(--gradient-primary);
          color: #000;
          padding: 4px 12px;
          border-radius: var(--radius-sm);
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        
        .key-hints {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          max-width: 600px;
          margin: 0 auto;
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
        
        .keys {
          display: flex;
          gap: 4px;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .key-extra {
          margin-left: 5px;
          font-size: 12px;
          color: #cbd5e1;
        }
        
        @media (max-width: 600px) {
          .key-hints {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
