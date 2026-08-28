import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_URL } from '../store/authStore'
import { soundFx } from '../services/soundFx'

interface LeaderboardEntry {
    rank: number
    username: string
    avatar_url: string
    score: number
    level: number
}


export default function Leaderboard() {
    const [selectedGame, setSelectedGame] = useState<'snake' | 'tetris' | 'pong'>('snake')
    const [searchQuery, setSearchQuery] = useState('')
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

    // Filter leaderboard by search query
    const filteredLeaderboard = leaderboard.filter(entry => 
        entry.username.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Partition top 3 podium entries vs remaining rows
    const topThree = filteredLeaderboard.slice(0, 3)
    const tableEntries = filteredLeaderboard.slice(3)

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
                            onClick={() => { soundFx.playClick(); setSelectedGame('snake'); }}
                        >
                            <span className="tab-icon">🐍</span> Snake
                        </button>
                        <button 
                            className={`tab-btn ${selectedGame === 'tetris' ? 'active' : ''}`}
                            onClick={() => { soundFx.playClick(); setSelectedGame('tetris'); }}
                        >
                            <span className="tab-icon">🧱</span> Tetris
                        </button>
                        <button 
                            className={`tab-btn ${selectedGame === 'pong' ? 'active' : ''}`}
                            onClick={() => { soundFx.playClick(); setSelectedGame('pong'); }}
                        >
                            <span className="tab-icon">🏓</span> Pong
                        </button>
                    </div>

                    <div className="search-bar-container">
                        <input
                            type="text"
                            className="input search-input"
                            placeholder="🔍 Search operative username..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
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
                                        key={`${entry.username}-${entry.rank}`}
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
                                                key={`${entry.username}-${entry.rank}`}
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
        </div>
    )
}
