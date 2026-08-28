import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { gameApi } from '../api/gameApi'
import { soundFx } from '../services/soundFx'
import { GameSlug } from '../types/game'
import { LeaderboardEntry, UserRankResponse } from '../types/leaderboard'

const GAME_TABS: { slug: GameSlug; name: string; icon: string }[] = [
  { slug: 'snake', name: 'Neon Viper', icon: '🐍' },
  { slug: 'tetris', name: 'Cyber Tetris', icon: '🧱' },
  { slug: 'pong', name: 'Neon Pong', icon: '🏓' }
]

export default function Leaderboard() {
  const { user, token } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()

  const queryGame = searchParams.get('game') as GameSlug | null
  const initialGame: GameSlug = (queryGame === 'tetris' || queryGame === 'pong' || queryGame === 'snake') ? queryGame : 'snake'

  const [selectedGame, setSelectedGame] = useState<GameSlug>(initialGame)
  const [searchQuery, setSearchQuery] = useState('')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [myRank, setMyRank] = useState<UserRankResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleSelectGame = (slug: GameSlug) => {
    soundFx.playClick()
    setSelectedGame(slug)
    setSearchParams({ game: slug }, { replace: true })
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await gameApi.getLeaderboard(selectedGame, 50)
      setLeaderboard(data)

      if (token) {
        try {
          const rankData = await gameApi.getMyRank(selectedGame, token)
          setMyRank(rankData)
        } catch {
          setMyRank(null)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve leaderboard records')
    } finally {
      setLoading(false)
    }
  }, [selectedGame, token])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filter entries
  const filteredLeaderboard = leaderboard.filter(entry =>
    entry.username.toLowerCase().includes(searchQuery.trim().toLowerCase())
  )

  const topThree = filteredLeaderboard.slice(0, 3)
  const tableEntries = filteredLeaderboard.slice(3)

  // Re-arrange podium: Silver (left), Gold (center), Bronze (right)
  const podiumOrder = () => {
    const order = []
    if (topThree[1]) order.push({ ...topThree[1], medal: '🥈', class: 'silver', height: '145px', delay: 0.1 })
    if (topThree[0]) order.push({ ...topThree[0], medal: '🥇', class: 'gold', height: '180px', delay: 0 })
    if (topThree[2]) order.push({ ...topThree[2], medal: '🥉', class: 'bronze', height: '125px', delay: 0.2 })
    return order
  }

  return (
    <div className="container leaderboard-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="leaderboard-header">
          <h2 className="title">GLOBAL HALL OF FAME</h2>

          {/* Arena Tabs */}
          <div className="game-tabs">
            {GAME_TABS.map((tab) => (
              <button
                key={tab.slug}
                className={`tab-btn ${selectedGame === tab.slug ? 'active' : ''}`}
                onClick={() => handleSelectGame(tab.slug)}
              >
                <span className="tab-icon">{tab.icon}</span> {tab.name}
              </button>
            ))}
          </div>

          {/* Search Bar */}
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

        {/* User's Current Operative Status Banner */}
        {user && myRank && myRank.rank && (
          <motion.div
            className="my-rank-banner card"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 24px',
              marginBottom: 'var(--space-xl)',
              background: 'rgba(0, 240, 255, 0.06)',
              borderColor: 'var(--secondary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.4rem' }}>🎖️</span>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Your Operative Record
                </div>
                <div style={{ fontWeight: 700, color: '#ffffff' }}>
                  {user.username} <span style={{ color: 'var(--secondary)', marginLeft: '8px' }}>LVL {user.level}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Rank</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, color: 'var(--secondary)', fontSize: '1.2rem' }}>
                  #{myRank.rank}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>High Score</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: '#00f260', fontSize: '1.2rem' }}>
                  {myRank.best_score.toLocaleString()}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {loading && <div className="loader">TRANSMITTING TELEMETRY FROM MAINFRAME...</div>}

        {error && <div className="error-card">{error}</div>}

        {!loading && !error && leaderboard.length === 0 && (
          <div className="empty-state card">
            <span className="empty-icon">📂</span>
            <p>No grid records found in mainframe for this arena. Be the first to deploy!</p>
            <Link to={`/game/${selectedGame}`} className="btn btn-primary" style={{ marginTop: '12px' }}>
              DEPLOY MISSION NOW
            </Link>
          </div>
        )}

        {!loading && leaderboard.length > 0 && (
          <div className="leaderboard-content">
            {/* Top 3 Podium Display */}
            {topThree.length > 0 && (
              <div className="podium-section">
                {podiumOrder().map((entry) => {
                  const isCurrentUser = user && user.username.toLowerCase() === entry.username.toLowerCase()
                  return (
                    <motion.div
                      key={`${entry.username}-${entry.rank}`}
                      className={`podium-card podium-${entry.class}`}
                      initial={{ opacity: 0, scale: 0.8, y: 30 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: entry.delay, type: 'spring' }}
                      style={{
                        '--podium-height': entry.height,
                        borderColor: isCurrentUser ? 'var(--secondary)' : undefined,
                        boxShadow: isCurrentUser ? '0 0 20px rgba(0, 240, 255, 0.4)' : undefined
                      } as React.CSSProperties}
                    >
                      <div className="podium-medal-glow">{entry.medal}</div>
                      <div className="podium-details">
                        <div className="podium-avatar">
                          {entry.username.charAt(0).toUpperCase()}
                        </div>
                        <h4 className="podium-username">
                          {entry.username} {isCurrentUser && <span style={{ color: 'var(--secondary)', fontSize: '0.75rem' }}>(YOU)</span>}
                        </h4>
                        <span className="podium-score">{entry.score.toLocaleString()}</span>
                        <span className="podium-level">LVL {entry.level}</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* List Table For Remaining Ranks */}
            {tableEntries.length > 0 && (
              <div className="leaderboard-table card">
                <div className="table-header">
                  <span className="col-rank">Rank</span>
                  <span className="col-player">Operative</span>
                  <span className="col-score">High Score</span>
                  <span className="col-level">Level</span>
                </div>

                <div className="table-rows">
                  <AnimatePresence>
                    {tableEntries.map((entry, index) => {
                      const isCurrentUser = user && user.username.toLowerCase() === entry.username.toLowerCase()
                      return (
                        <motion.div
                          key={`${entry.username}-${entry.rank}`}
                          className="table-row"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          style={{
                            background: isCurrentUser ? 'rgba(0, 240, 255, 0.08)' : undefined,
                            borderColor: isCurrentUser ? 'rgba(0, 240, 255, 0.3)' : undefined
                          }}
                        >
                          <span className="col-rank" style={{ color: isCurrentUser ? 'var(--secondary)' : undefined }}>
                            #{entry.rank}
                          </span>
                          <span className="col-player" style={{ color: isCurrentUser ? 'var(--secondary)' : '#ffffff' }}>
                            {entry.username} {isCurrentUser && <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>(YOU)</span>}
                          </span>
                          <span className="col-score">{entry.score.toLocaleString()}</span>
                          <span className="col-level">LVL {entry.level}</span>
                        </motion.div>
                      )
                    })}
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
