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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="auth-title">Login</h1>
        <p className="auth-subtitle">Enter the cyber realm</p>

        {error && (
          <div className="error-message" onClick={clearError}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Connecting...' : 'Login'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>
      </motion.div>

      <style>{`
        .auth-page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: calc(100vh - 300px);
        }
        
        .auth-card {
          width: 100%;
          max-width: 400px;
        }
        
        .auth-title {
          text-align: center;
          margin-bottom: var(--space-xs);
        }
        
        .auth-subtitle {
          text-align: center;
          color: var(--text-secondary);
          margin-bottom: var(--space-xl);
        }
        
        .auth-btn {
          width: 100%;
          margin-top: var(--space-md);
        }
        
        .auth-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .auth-footer {
          text-align: center;
          margin-top: var(--space-xl);
          color: var(--text-secondary);
        }
        
        .error-message {
          background: rgba(255, 0, 80, 0.1);
          border: 1px solid var(--neon-pink);
          color: var(--neon-pink);
          padding: var(--space-md);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-lg);
          cursor: pointer;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  )
}
