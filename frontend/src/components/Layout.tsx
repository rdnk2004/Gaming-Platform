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
                        <Link to="/" className="logo">
                            <motion.span
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="logo-text"
                            >
                                CYBER<span className="text-magenta">ARCADE</span>
                            </motion.span>
                        </Link>

                        <div className="nav-links">
                            <Link to="/">Games</Link>
                            <Link to="/leaderboard">Leaderboard</Link>
                            {user ? (
                                <>
                                    <span className="user-info">
                                        <span className="text-cyan">{user.username}</span>
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
                    <p className="text-muted">
                        © 2026 CYBERARCADE • Retro games with a cyberpunk twist
                    </p>
                </div>
            </footer>

            <style>{`
        .header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(10, 10, 15, 0.9);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(0, 255, 255, 0.1);
          padding: var(--space-md) 0;
        }
        
        .nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .logo-text {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 900;
          color: var(--neon-cyan);
          letter-spacing: 0.1em;
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
          letter-spacing: 0.05em;
        }
        
        .user-info {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }
        
        .user-level {
          background: var(--gradient-neon);
          color: var(--bg-primary);
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
          border-top: 1px solid rgba(0, 255, 255, 0.1);
        }
        
        @media (max-width: 768px) {
          .nav-links {
            gap: var(--space-md);
          }
          .nav-links a:not(.btn) {
            display: none;
          }
        }
      `}</style>
        </div>
    )
}
