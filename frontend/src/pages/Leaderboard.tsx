import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_URL } from '../store/authStore'

interface LeaderboardEntry {
    rank: number
    username: string
    avatar_url: string
    score: number
    level: number
}


export default function Leaderboard() {
    const [selectedGame, setSelectedGame] = useState<'snake' | 'tetris' | 'pong'>('snake')
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true)
            setError(null)
            try {
                const response = await fetch(`${API_URL}/leaderboard/${selectedGame}?limit=20`)
                if (!response.ok) throw new Error('Failed to fetch leaderboard')
                const data = await response.json()
                setLeaderboard(data)
            } catch (err) {
                setError((err as Error).message)
            } finally {
                setLoading(false)
            }
        }

        fetchLeaderboard()
    }, [selectedGame])

    // Partition top 3 podium entries vs remaining rows
    const topThree = leaderboard.slice(0, 3)
    const tableEntries = leaderboard.slice(3)

    // Rearrange podium so Silver is on left, Gold in middle, Bronze on right
    const podiumOrder = () => {
        const order = []
        if (topThree[1]) order.push({ ...topThree[1], medal: '🥈', class: 'silver', height: '140px', delay: 0.1 })
        if (topThree[0]) order.push({ ...topThree[0], medal: '🥇', class: 'gold', height: '170px', delay: 0 })
        if (topThree[2]) order.push({ ...topThree[2], medal: '🥉', class: 'bronze', height: '120px', delay: 0.2 })
        return order
    }


    return (
        <div className="container leaderboard-page">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="leaderboard-header">
                    <h2 className="title">GLOBAL HALL OF FAME</h2>
                    
                    <div className="game-tabs">
                        <button 
                            className={`tab-btn ${selectedGame === 'snake' ? 'active' : ''}`}
                            onClick={() => setSelectedGame('snake')}
                        >
                            <span className="tab-icon">🐍</span> Snake
                        </button>
                        <button 
                            className={`tab-btn ${selectedGame === 'tetris' ? 'active' : ''}`}
                            onClick={() => setSelectedGame('tetris')}
                        >
                            <span className="tab-icon">🧱</span> Tetris
                        </button>
                        <button 
                            className={`tab-btn ${selectedGame === 'pong' ? 'active' : ''}`}
                            onClick={() => setSelectedGame('pong')}
                        >
                            <span className="tab-icon">🏓</span> Pong
                        </button>
                    </div>
                </div>

                {loading && <div className="loader">INITIALIZING RETRIEVAL SEQUENCE...</div>}

                {error && <div className="error-card">{error}</div>}

                {!loading && !error && leaderboard.length === 0 && (
                    <div className="empty-state card">
                        <span className="empty-icon">📂</span>
                        <p>No grid records found in mainframe. Be the first to deploy!</p>
                    </div>
                )}

                {!loading && leaderboard.length > 0 && (
                    <div className="leaderboard-content">
                        {/* TOP 3 PODIUM DISPLAY */}
                        {topThree.length > 0 && (
                            <div className="podium-section">
                                {podiumOrder().map((entry) => (
                                    <motion.div
                                        key={entry.username}
                                        className={`podium-card podium-${entry.class}`}
                                        initial={{ opacity: 0, scale: 0.8, y: 30 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: entry.delay, type: 'spring' }}
                                        style={{ '--podium-height': entry.height } as React.CSSProperties}
                                    >
                                        <div className="podium-medal-glow">{entry.medal}</div>
                                        <div className="podium-details">
                                            <div className="podium-avatar">
                                                {entry.username.charAt(0).toUpperCase()}
                                            </div>
                                            <h4 className="podium-username">{entry.username}</h4>
                                            <span className="podium-score">{entry.score.toLocaleString()}</span>
                                            <span className="podium-level">LVL {entry.level}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* LIST TABLE FOR OTHER RANKS */}
                        {tableEntries.length > 0 && (
                            <div className="leaderboard-table card">
                                <div className="table-header">
                                    <span className="col-rank">Rank</span>
                                    <span className="col-player">Player</span>
                                    <span className="col-score">Score</span>
                                    <span className="col-level">Level</span>
                                </div>

                                <div className="table-rows">
                                    <AnimatePresence>
                                        {tableEntries.map((entry, index) => (
                                            <motion.div
                                                key={entry.username}
                                                className="table-row"
                                                initial={{ opacity: 0, x: -25 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.04 }}
                                            >
                                                <span className="col-rank">#{entry.rank}</span>
                                                <span className="col-player">{entry.username}</span>
                                                <span className="col-score">{entry.score.toLocaleString()}</span>
                                                <span className="col-level">LVL {entry.level}</span>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>

            <style>{`
                .leaderboard-page {
                  max-width: 850px;
                  margin: 0 auto;
                }

                .leaderboard-header {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  gap: var(--space-md);
                  margin-bottom: var(--space-2xl);
                  text-align: center;
                }

                .title {
                  font-size: clamp(1.5rem, 4vw, 2.2rem);
                  letter-spacing: 4px;
                  background: linear-gradient(90deg, #fff, var(--secondary), var(--primary));
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  background-clip: text;
                  filter: drop-shadow(0 0 10px rgba(0, 240, 255, 0.2));
                }

                .game-tabs {
                  display: flex;
                  gap: 12px;
                  background: rgba(13, 9, 28, 0.6);
                  border: 1px solid rgba(139, 92, 246, 0.15);
                  padding: 6px;
                  border-radius: var(--radius-lg);
                  backdrop-filter: blur(8px);
                }

                .tab-btn {
                  background: transparent;
                  border: none;
                  color: var(--text-secondary);
                  padding: 10px 22px;
                  border-radius: var(--radius-md);
                  cursor: pointer;
                  font-family: var(--font-display);
                  font-weight: 700;
                  text-transform: uppercase;
                  letter-spacing: 1.5px;
                  font-size: 0.85rem;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  transition: all var(--transition-fast);
                }

                .tab-btn:hover {
                  color: var(--secondary);
                }

                .tab-btn.active {
                  background: var(--gradient-primary);
                  color: var(--bg-primary);
                  box-shadow: 0 4px 15px rgba(0, 240, 255, 0.35);
                  font-weight: 800;
                }

                .tab-icon {
                  font-size: 1rem;
                }

                .loader {
                  text-align: center;
                  padding: var(--space-2xl);
                  color: var(--secondary);
                  font-family: var(--font-display);
                  letter-spacing: 2px;
                  text-shadow: 0 0 8px var(--secondary-glow);
                }

                .error-card {
                  background: rgba(255, 0, 85, 0.08);
                  border: 1px solid var(--neon-pink);
                  color: var(--neon-pink);
                  padding: var(--space-md);
                  border-radius: var(--radius-md);
                  text-shadow: 0 0 5px var(--accent-glow);
                  text-align: center;
                }

                .empty-state {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  gap: var(--space-md);
                  padding: var(--space-2xl);
                  text-align: center;
                  color: var(--text-secondary);
                }

                .empty-icon {
                  font-size: 3rem;
                  opacity: 0.7;
                }

                /* PODIUM STYLING */
                .podium-section {
                  display: flex;
                  justify-content: center;
                  align-items: flex-end;
                  gap: var(--space-lg);
                  margin-bottom: var(--space-2xl);
                  padding-top: var(--space-xl);
                }

                .podium-card {
                  flex: 1;
                  max-width: 200px;
                  height: var(--podium-height);
                  background: rgba(13, 9, 28, 0.85);
                  border: 1px solid rgba(139, 92, 246, 0.2);
                  border-radius: var(--radius-lg);
                  position: relative;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: flex-end;
                  padding: var(--space-md) var(--space-sm);
                  box-shadow: var(--glass-shadow);
                  backdrop-filter: blur(10px);
                }

                /* Podium custom colors & highlights */
                .podium-gold {
                  border-color: #ffd700;
                  box-shadow: 0 10px 25px rgba(255, 215, 0, 0.25);
                }
                .podium-silver {
                  border-color: #c0c0c0;
                  box-shadow: 0 8px 20px rgba(192, 192, 192, 0.15);
                }
                .podium-bronze {
                  border-color: #cd7f32;
                  box-shadow: 0 8px 20px rgba(205, 127, 50, 0.15);
                }

                .podium-medal-glow {
                  font-size: 2.2rem;
                  position: absolute;
                  top: -24px;
                  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.25));
                }

                .podium-details {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  width: 100%;
                }

                .podium-avatar {
                  width: 48px;
                  height: 48px;
                  border-radius: var(--radius-full);
                  background: linear-gradient(135deg, var(--primary), var(--secondary));
                  color: var(--bg-primary);
                  font-family: var(--font-display);
                  font-size: 1.25rem;
                  font-weight: 900;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin-bottom: var(--space-sm);
                  box-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
                }

                .podium-gold .podium-avatar {
                  background: linear-gradient(135deg, #ffd700, #ffae00);
                  box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);
                }

                .podium-username {
                  font-size: 0.9rem;
                  font-weight: 700;
                  margin-bottom: 2px;
                  color: #fff;
                  max-width: 90%;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                  text-transform: none;
                }

                .podium-score {
                  font-family: var(--font-display);
                  font-weight: 800;
                  font-size: 1.2rem;
                  color: var(--secondary);
                  text-shadow: 0 0 5px var(--secondary-glow);
                  margin-bottom: 4px;
                }

                .podium-level {
                  font-size: 0.7rem;
                  background: rgba(255, 255, 255, 0.05);
                  padding: 2px 8px;
                  border-radius: var(--radius-sm);
                  color: var(--text-secondary);
                  border: 1px solid rgba(255, 255, 255, 0.1);
                  font-weight: 700;
                }

                /* SCROLLING TABLE LIST */
                .leaderboard-table {
                  background: rgba(13, 9, 28, 0.65);
                  border: 1px solid rgba(139, 92, 246, 0.15);
                  border-radius: var(--radius-lg);
                  overflow: hidden;
                  margin-top: var(--space-lg);
                }

                .table-header {
                  display: grid;
                  grid-template-columns: 80px 1fr 140px 100px;
                  padding: 14px var(--space-xl);
                  background: rgba(18, 14, 38, 0.85);
                  font-family: var(--font-display);
                  font-size: 0.78rem;
                  text-transform: uppercase;
                  letter-spacing: 2.5px;
                  color: var(--text-secondary);
                  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
                }

                .table-rows {
                  max-height: 400px;
                  overflow-y: auto;
                }

                .table-row {
                  display: grid;
                  grid-template-columns: 80px 1fr 140px 100px;
                  padding: 16px var(--space-xl);
                  border-bottom: 1px solid rgba(139, 92, 246, 0.08);
                  transition: all var(--transition-fast);
                  align-items: center;
                }

                .table-row:last-child {
                  border-bottom: none;
                }

                .table-row:hover {
                  background: rgba(139, 92, 246, 0.05);
                  border-bottom-color: rgba(139, 92, 246, 0.2);
                }

                .col-rank {
                  font-family: var(--font-display);
                  font-weight: 700;
                  color: var(--text-muted);
                }

                .col-player {
                  font-weight: 600;
                  color: #fff;
                }

                .col-score {
                  font-family: var(--font-display);
                  font-weight: 800;
                  color: var(--secondary);
                  text-shadow: 0 0 8px var(--secondary-glow);
                }

                .col-level {
                  font-size: 0.8rem;
                  font-weight: 700;
                  color: var(--text-secondary);
                }

                @media (max-width: 600px) {
                  .podium-section {
                    flex-direction: column;
                    align-items: center;
                    gap: 35px;
                  }
                  .podium-card {
                    width: 100%;
                    height: 130px !important;
                  }
                  .table-header, .table-row {
                    grid-template-columns: 60px 1fr 100px;
                    padding: 12px var(--space-md);
                  }
                  .col-level {
                    display: none;
                  }
                }
            `}</style>
        </div>
    )
}
