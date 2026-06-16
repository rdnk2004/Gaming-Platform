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
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="brand-container"
              >
                <h1 className="brand-title">Cyberarcade</h1>
                <span className="brand-subtitle">RETRO REIMAGINED</span>
              </motion.div>
            </Link>

            <div className="nav-links">
              <Link to="/" className="nav-link">
                <span className="nav-icon">🕹️</span> Games
              </Link>
              <Link to="/leaderboard" className="nav-link">
                <span className="nav-icon">🏆</span> Leaderboard
              </Link>
              {user ? (
                <div className="user-profile-menu">
                  <span className="user-info">
                    <span className="text-secondary user-name">{user.username}</span>
                    <span className="user-level">LVL {user.level}</span>
                  </span>
                  <button onClick={logout} className="btn btn-secondary btn-logout">
                    Logout
                  </button>
                </div>
              ) : (
                <div className="auth-buttons">
                  <Link to="/login" className="btn btn-secondary btn-login">Login</Link>
                  <Link to="/register" className="btn btn-primary btn-signup">Sign Up</Link>
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

      <style>{`
        .layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(10, 8, 22, 0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(139, 92, 246, 0.15);
          padding: var(--space-md) 0;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
        }
        
        .nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .brand {
          text-decoration: none;
          display: block;
        }

        .brand-container {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        
        .brand-title {
          margin: 0;
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 28px;
          text-transform: uppercase;
          letter-spacing: 3px;
          background: linear-gradient(90deg, var(--secondary) 0%, var(--primary) 50%, var(--accent) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.3));
          line-height: 1.1;
        }
        
        .brand-subtitle {
          font-family: var(--font-display);
          font-size: 10px;
          color: var(--text-muted);
          letter-spacing: 2.5px;
          font-weight: 700;
          margin-top: 2px;
        }
        
        .nav-links {
          display: flex;
          align-items: center;
          gap: var(--space-xl);
        }
        
        .nav-link {
          font-family: var(--font-display);
          font-size: 0.9rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: var(--text-secondary);
          text-decoration: none;
          transition: var(--transition-fast);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .nav-link:hover {
          color: var(--secondary);
          text-shadow: 0 0 10px var(--secondary-glow);
          transform: translateY(-1px);
        }

        .nav-icon {
          font-size: 1.1rem;
        }

        .user-profile-menu {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }
        
        .user-info {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          background: rgba(139, 92, 246, 0.08);
          border: 1px solid rgba(139, 92, 246, 0.2);
          padding: 6px 14px;
          border-radius: var(--radius-md);
        }

        .user-name {
          font-weight: 600;
          font-size: 0.9rem;
        }
        
        .user-level {
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          color: var(--bg-primary);
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          font-size: 0.7rem;
          font-family: var(--font-display);
          font-weight: 900;
          letter-spacing: 0.5px;
          box-shadow: 0 0 10px rgba(0, 240, 255, 0.25);
        }

        .btn-logout {
          padding: 8px 16px;
          font-size: 0.8rem;
          border-radius: var(--radius-md);
        }

        .auth-buttons {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .btn-login {
          padding: 8px 16px;
          font-size: 0.8rem;
          border-radius: var(--radius-md);
        }

        .btn-signup {
          padding: 8px 20px;
          font-size: 0.8rem;
          border-radius: var(--radius-md);
        }
        
        .main {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: var(--space-2xl) 0;
        }
        
        .footer {
          padding: var(--space-xl) 0;
          border-top: 1px solid rgba(139, 92, 246, 0.1);
          background: rgba(4, 3, 8, 0.5);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        
        .footer-hint {
          font-size: 11px;
          color: var(--text-muted);
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: var(--space-xs);
        }

        .copyright {
          font-size: 10px;
          color: var(--text-muted);
          opacity: 0.7;
        }
        
        @media (max-width: 768px) {
          .nav-links {
            gap: var(--space-md);
          }
          .nav-link {
            display: none;
          }
          .brand-title {
            font-size: 22px;
          }
        }
      `}</style>
    </div>
  )
}
