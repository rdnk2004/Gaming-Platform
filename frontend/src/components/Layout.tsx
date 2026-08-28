import { useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { soundFx } from '../services/soundFx'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMuted, setIsMuted] = useState(() => soundFx.getIsMuted())

  const handleToggleSound = () => {
    const muted = soundFx.toggleMute()
    setIsMuted(muted)
    if (!muted) soundFx.playClick()
  }

  return (
    <div className="layout">
      <header className="header">
        <div className="container">
          <nav className="nav">
            <Link to="/" className="brand" onClick={() => { soundFx.playClick(); setMobileMenuOpen(false); }}>
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="brand-container"
              >
                <h1 className="brand-title">Cyberarcade</h1>
                <span className="brand-subtitle">RETRO REIMAGINED</span>
              </motion.div>
            </Link>

            <div className="nav-actions">
              <button 
                className="sound-toggle-btn"
                onClick={handleToggleSound}
                title={isMuted ? "Unmute Arcade Audio" : "Mute Arcade Audio"}
              >
                {isMuted ? '🔇 Muted' : '🔊 Sound ON'}
              </button>

              <button 
                className="mobile-menu-toggle"
                onClick={() => { soundFx.playClick(); setMobileMenuOpen(!mobileMenuOpen); }}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>

            <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
              <Link to="/" className="nav-link" onClick={() => { soundFx.playClick(); setMobileMenuOpen(false); }}>
                <span className="nav-icon">🕹️</span> Games
              </Link>
              <Link to="/leaderboard" className="nav-link" onClick={() => { soundFx.playClick(); setMobileMenuOpen(false); }}>
                <span className="nav-icon">🏆</span> Leaderboard
              </Link>
              {user ? (
                <div className="user-profile-menu">
                  <span className="user-info">
                    <span className="text-secondary user-name">{user.username}</span>
                    <span className="user-level">LVL {user.level}</span>
                  </span>
                  <button onClick={() => { soundFx.playClick(); logout(); setMobileMenuOpen(false); }} className="btn btn-secondary btn-logout">
                    Logout
                  </button>
                </div>
              ) : (
                <div className="auth-buttons">
                  <Link to="/login" className="btn btn-secondary btn-login" onClick={() => { soundFx.playClick(); setMobileMenuOpen(false); }}>Login</Link>
                  <Link to="/register" className="btn btn-primary btn-signup" onClick={() => { soundFx.playClick(); setMobileMenuOpen(false); }}>Sign Up</Link>
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
        <div className="container text-center">
          <p className="footer-hint">
            Avoid walls • Eat glowing orbs • Don't hit yourself
          </p>
          <p className="copyright">&copy; 2026 CYBERARCADE. Evolve your play.</p>
        </div>
      </footer>
    </div>
  )
}
