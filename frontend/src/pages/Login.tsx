import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await login(username, password)
    if (success) {
      navigate('/')
    }
  }

  return (
    <div className="auth-page">
      <motion.div
        className="auth-card card"
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="auth-logo">🤖</div>
        <h2 className="auth-title">SIGN IN</h2>
        <p className="auth-subtitle">Establish grid connection</p>

        {error && (
          <div className="error-alert" onClick={clearError}>
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">Mainframe Identity</label>
            <input
              id="username"
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              autoComplete="username"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Security Code</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-btn"
            disabled={isLoading}
          >
            {isLoading ? 'ESTABLISHING LINK...' : 'INITIATE LOGIN'}
          </button>
        </form>

        <p className="auth-footer">
          New profile request? <Link to="/register" className="auth-link">Create Account</Link>
        </p>
      </motion.div>

      <style>{`
        .auth-page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: calc(100vh - 280px);
          padding: var(--space-md);
        }
        
        .auth-card {
          width: 100%;
          max-width: 420px;
          text-align: center;
          background: rgba(12, 8, 26, 0.82);
          border: 1px solid rgba(139, 92, 246, 0.22);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
          position: relative;
        }

        .auth-logo {
          font-size: 3rem;
          margin-bottom: var(--space-xs);
          filter: drop-shadow(0 0 10px var(--primary-glow));
          animation: logoFloat 4s ease-in-out infinite;
        }

        @keyframes logoFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        .auth-title {
          font-size: 24px;
          letter-spacing: 4px;
          margin-bottom: 2px;
          background: linear-gradient(90deg, #fff, var(--secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .auth-subtitle {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: var(--space-xl);
          letter-spacing: 1px;
        }
        
        .auth-btn {
          width: 100%;
          margin-top: var(--space-md);
          padding: 14px;
          font-size: 1rem;
        }
        
        .auth-footer {
          text-align: center;
          margin-top: var(--space-xl);
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        .auth-link {
          color: var(--secondary);
          font-weight: 700;
          text-decoration: none;
          transition: var(--transition-fast);
          margin-left: 4px;
        }

        .auth-link:hover {
          color: var(--primary);
          text-shadow: 0 0 8px var(--primary-glow);
        }
        
        .error-alert {
          background: rgba(255, 0, 85, 0.08);
          border: 1px solid var(--accent);
          color: var(--accent);
          padding: 12px;
          border-radius: var(--radius-md);
          margin-bottom: var(--space-lg);
          cursor: pointer;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-shadow: 0 0 5px var(--accent-glow);
          transition: all var(--transition-fast);
        }

        .error-alert:hover {
          background: rgba(255, 0, 85, 0.15);
          box-shadow: 0 0 10px rgba(255, 0, 85, 0.25);
        }
      `}</style>
    </div>
  )
}
