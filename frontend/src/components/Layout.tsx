import { Outlet, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'

export default function Layout() {
  const { user, logout } = useAuthStore()

  return (
    <div className="layout">
      <header className="header">
        <div className="container">
          <nav className="nav">
            <Link to="/" className="brand">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="brand-title">Hyper Snake</h1>
                <span className="brand-subtitle">ARENA EVOLVED</span>
              </motion.div>
            </Link>

            <div className="nav-links">
              <Link to="/">Games</Link>
              <Link to="/leaderboard">Leaderboard</Link>
              {user ? (
                <>
                  <span className="user-info">
                    <span className="text-primary">{user.username}</span>
                    <span className="user-level">LVL {user.level}</span>
                  </span>
                  <button onClick={logout} className="btn btn-secondary">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-secondary">Login</Link>
                  <Link to="/register" className="btn btn-primary">Sign Up</Link>
                </>
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
        </div>
      </footer>

      <style>{`
        .header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--glass);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--glass-border);
          padding: var(--space-md) 0;
        }
        
        .nav {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        
        .brand {
          text-decoration: none;
        }
        
        .brand-title {
          margin: 0;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 32px;
          text-transform: uppercase;
          letter-spacing: 2px;
          background: linear-gradient(90deg, #00f260, #0575e6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 15px rgba(0, 242, 96, 0.4));
        }
        
        .brand-subtitle {
          font-size: 12px;
          color: #64748b;
          letter-spacing: 1px;
          font-weight: 600;
        }
        
        .nav-links {
          display: flex;
          align-items: center;
          gap: var(--space-lg);
        }
        
        .nav-links a:not(.btn) {
          font-family: var(--font-display);
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text-secondary);
          transition: var(--transition-fast);
        }
        
        .nav-links a:not(.btn):hover {
          color: var(--primary);
        }
        
        .user-info {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }
        
        .user-level {
          background: var(--gradient-primary);
          color: #000;
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 700;
        }
        
        .main {
          min-height: calc(100vh - 200px);
          padding: var(--space-2xl) 0;
        }
        
        .footer {
          padding: var(--space-xl) 0;
          border-top: 1px solid var(--glass-border);
        }
        
        .footer-hint {
          font-size: 12px;
          color: #475569;
        }
        
        @media (max-width: 768px) {
          .nav-links {
            gap: var(--space-md);
          }
          .nav-links a:not(.btn) {
            display: none;
          }
          .brand-title {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  )
}
