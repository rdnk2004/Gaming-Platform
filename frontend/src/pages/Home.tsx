import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const games = [
    {
        id: 1,
        name: 'Snake',
        slug: 'snake',
        description: 'Classic snake game with a neon twist',
        thumbnail: '/games/snake-thumb.jpg',
        isMultiplayer: true,
    },
    {
        id: 2,
        name: 'Tetris',
        slug: 'tetris',
        description: 'Stack blocks in cyberpunk style',
        thumbnail: '/games/tetris-thumb.jpg',
        isMultiplayer: false,
        comingSoon: true,
    },
    {
        id: 3,
        name: 'Pong',
        slug: 'pong',
        description: '1v1 neon battles',
        thumbnail: '/games/pong-thumb.jpg',
        isMultiplayer: true,
        comingSoon: true,
    },
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
                <h1>Welcome to the Arcade</h1>
                <p className="hero-subtitle">
                    Experience retro games reimagined with a <span className="text-cyan">cyberpunk</span> aesthetic
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
                                        <span className="game-icon">🎮</span>
                                    </div>
                                    <div className="game-card-overlay">
                                        <h3 className="game-card-title">{game.name}</h3>
                                        <span className="coming-soon-badge">Coming Soon</span>
                                    </div>
                                </div>
                            ) : (
                                <Link to={`/game/${game.slug}`} className="game-card">
                                    <div className="game-card-placeholder">
                                        <span className="game-icon">🐍</span>
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

            <style>{`
        .hero {
          text-align: center;
          padding: var(--space-2xl) 0;
          margin-bottom: var(--space-2xl);
        }
        
        .hero-subtitle {
          font-size: 1.25rem;
          color: var(--text-secondary);
          max-width: 600px;
          margin: var(--space-lg) auto 0;
        }
        
        .games-section h2 {
          margin-bottom: var(--space-xl);
        }
        
        .games-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--space-xl);
        }
        
        .game-card {
          display: block;
          position: relative;
          aspect-ratio: 4/3;
          border-radius: var(--radius-lg);
          overflow: hidden;
          border: 2px solid rgba(0, 255, 255, 0.2);
          transition: var(--transition-normal);
        }
        
        .game-card:hover {
          border-color: var(--neon-cyan);
          box-shadow: var(--glow-cyan);
          transform: translateY(-4px);
        }
        
        .game-card--disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .game-card--disabled:hover {
          transform: none;
          box-shadow: none;
        }
        
        .game-card-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-card) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .game-icon {
          font-size: 4rem;
          filter: grayscale(0.5);
        }
        
        .game-card:hover .game-icon {
          filter: grayscale(0);
          transform: scale(1.1);
          transition: var(--transition-normal);
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
        }
        
        .game-card-meta {
          font-size: 0.875rem;
          color: var(--neon-cyan);
        }
        
        .coming-soon-badge {
          display: inline-block;
          background: var(--gradient-neon);
          color: var(--bg-primary);
          padding: 4px 12px;
          border-radius: var(--radius-sm);
          font-family: var(--font-display);
          font-size: 0.75rem;
          text-transform: uppercase;
        }
      `}</style>
        </div>
    )
}
