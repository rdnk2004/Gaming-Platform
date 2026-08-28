import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { soundFx } from '../services/soundFx'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMuted, setIsMuted] = useState(() => soundFx.getIsMuted())
  const location = useLocation()

  const handleToggleSound = () => {
    const muted = soundFx.toggleMute()
    setIsMuted(muted)
    if (!muted) soundFx.playClick()
  }

  const isCurrentPath = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="layout">
      <header className="header">
        <div className="container">
          <nav className="nav">
            <Link
              to="/"
              className="brand"
              onClick={() => {
                soundFx.playClick()
                setMobileMenuOpen(false)
              }}
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="brand-container"
              >
                <div className="brand-logo-icon">🕹️</div>
                <div className="brand-text">
                  <h1 className="brand-title">CYBERARCADE</h1>
                  <span className="brand-subtitle">RETRO REIMAGINED</span>
                </div>
              </motion.div>
            </Link>

            <div className="nav-actions">
              <button
                className="sound-toggle-btn"
                onClick={handleToggleSound}
                title={isMuted ? 'Unmute Arcade Audio' : 'Mute Arcade Audio'}
              >
                {isMuted ? '🔇 Muted' : '🔊 Sound ON'}
              </button>

              <button
                className="mobile-menu-toggle"
                onClick={() => {
                  soundFx.playClick()
                  setMobileMenuOpen(!mobileMenuOpen)
                }}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>

            <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
              <Link
                to="/"
                className={`nav-link ${isCurrentPath('/') && !location.pathname.startsWith('/leaderboard') && !location.pathname.startsWith('/login') && !location.pathname.startsWith('/register') ? 'active' : ''}`}
                onClick={() => {
                  soundFx.playClick()
                  setMobileMenuOpen(false)
                }}
              >
                <span className="nav-icon">🕹️</span> Arenas
              </Link>

              <Link
                to="/leaderboard"
                className={`nav-link ${isCurrentPath('/leaderboard') ? 'active' : ''}`}
                onClick={() => {
                  soundFx.playClick()
                  setMobileMenuOpen(false)
                }}
              >
                <span className="nav-icon">🏆</span> Leaderboard
              </Link>

              {user ? (
                <div className="user-profile-menu">
                  <span className="user-info">
                    <span className="user-avatar-badge">{user.username.charAt(0).toUpperCase()}</span>
                    <span className="text-secondary user-name">{user.username}</span>
                    <span className="user-level">LVL {user.level}</span>
                  </span>
                  <button
                    onClick={() => {
                      soundFx.playClick()
                      logout()
                      setMobileMenuOpen(false)
                    }}
                    className="btn btn-secondary btn-logout"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="auth-buttons">
                  <Link
                    to="/login"
                    className="btn btn-secondary btn-login"
                    onClick={() => {
                      soundFx.playClick()
                      setMobileMenuOpen(false)
                    }}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-primary btn-signup"
                    onClick={() => {
                      soundFx.playClick()
                      setMobileMenuOpen(false)
                    }}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container footer-content">
          <div className="footer-status-beacon">
            <span className="beacon-indicator" />
            <span className="beacon-text">MAINFRAME STATUS: ONLINE • ULTRA LOW LATENCY • ENGINE v2.6.0</span>
          </div>
          <div className="footer-links">
            <Link to="/" className="footer-link">Arenas</Link>
            <span className="footer-divider">•</span>
            <Link to="/leaderboard" className="footer-link">Rankings</Link>
            <span className="footer-divider">•</span>
            <span className="copyright">&copy; 2026 CYBERARCADE. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
