import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface LeaderboardEntry {
    rank: number
    username: string
    avatar_url: string
    score: number
    level: number
}

export default function Leaderboard() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await fetch('http://localhost:8000/leaderboard/snake?limit=20')
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
    }, [])

    return (
        <div className="container leaderboard-page">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <h1>Leaderboard</h1>
                <p className="subtitle">Top Snake Players</p>

                {loading && <div className="loading">Loading...</div>}

                {error && <div className="error-message">{error}</div>}

                {!loading && !error && leaderboard.length === 0 && (
                    <div className="empty-state">
                        <p>No scores yet. Be the first to play!</p>
                    </div>
                )}

                {!loading && leaderboard.length > 0 && (
                    <div className="leaderboard-table">
                        <div className="table-header">
                            <span className="col-rank">Rank</span>
                            <span className="col-player">Player</span>
                            <span className="col-score">Score</span>
                            <span className="col-level">Level</span>
                        </div>

                        {leaderboard.map((entry, index) => (
                            <motion.div
                                key={entry.username}
                                className={`table-row ${index < 3 ? 'top-three' : ''}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <span className="col-rank">
                                    {index === 0 && '🥇'}
                                    {index === 1 && '🥈'}
                                    {index === 2 && '🥉'}
                                    {index > 2 && `#${entry.rank}`}
                                </span>
                                <span className="col-player">{entry.username}</span>
                                <span className="col-score">{entry.score.toLocaleString()}</span>
                                <span className="col-level">LVL {entry.level}</span>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>

            <style>{`
        .leaderboard-page {
          max-width: 700px;
          margin: 0 auto;
        }
        
        .leaderboard-page h1 {
          text-align: center;
          margin-bottom: var(--space-xs);
        }
        
        .subtitle {
          text-align: center;
          color: var(--text-secondary);
          margin-bottom: var(--space-2xl);
        }
        
        .loading, .empty-state {
          text-align: center;
          padding: var(--space-2xl);
          color: var(--text-secondary);
        }
        
        .error-message {
          background: rgba(255, 0, 80, 0.1);
          border: 1px solid var(--neon-pink);
          color: var(--neon-pink);
          padding: var(--space-md);
          border-radius: var(--radius-md);
          text-align: center;
        }
        
        .leaderboard-table {
          background: var(--bg-card);
          border: 1px solid rgba(0, 255, 255, 0.2);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        
        .table-header {
          display: grid;
          grid-template-columns: 80px 1fr 120px 80px;
          padding: var(--space-md) var(--space-lg);
          background: var(--bg-secondary);
          font-family: var(--font-display);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
        }
        
        .table-row {
          display: grid;
          grid-template-columns: 80px 1fr 120px 80px;
          padding: var(--space-md) var(--space-lg);
          border-bottom: 1px solid rgba(0, 255, 255, 0.1);
          transition: var(--transition-fast);
        }
        
        .table-row:last-child {
          border-bottom: none;
        }
        
        .table-row:hover {
          background: var(--bg-card-hover);
        }
        
        .table-row.top-three {
          background: rgba(0, 255, 255, 0.05);
        }
        
        .col-rank {
          font-family: var(--font-display);
          font-weight: 700;
        }
        
        .col-player {
          color: var(--neon-cyan);
        }
        
        .col-score {
          font-family: var(--font-display);
          font-weight: 700;
          color: var(--text-primary);
        }
        
        .col-level {
          font-size: 0.875rem;
          color: var(--neon-magenta);
        }
        
        @media (max-width: 600px) {
          .table-header, .table-row {
            grid-template-columns: 60px 1fr 80px;
          }
          .col-level {
            display: none;
          }
        }
      `}</style>
        </div>
    )
}
