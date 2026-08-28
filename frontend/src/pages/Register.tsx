import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { soundFx } from '../services/soundFx'

export default function Register() {
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [localError, setLocalError] = useState('')

    const { register, isLoading, error, clearError } = useAuthStore()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        soundFx.playClick()
        setLocalError('')

        if (password !== confirmPassword) {
            soundFx.playExplosion()
            setLocalError('Passwords do not match')
            return
        }

        if (password.length < 6) {
            soundFx.playExplosion()
            setLocalError('Password must be at least 6 characters')
            return
        }

        const success = await register(username, email, password)
        if (success) {
            soundFx.playFanfare()
            navigate('/login')
        } else {
            soundFx.playExplosion()
        }
    }

    const displayError = localError || error

    return (
        <div className="auth-page">
            <motion.div
                className="auth-card card"
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            >
                <div className="auth-logo">🕹️</div>
                <h2 className="auth-title">CREATE PROFILE</h2>
                <p className="auth-subtitle">Initialize new arena profile</p>

                {displayError && (
                    <div className="error-alert" onClick={() => { clearError(); setLocalError('') }}>
                        <span className="error-icon">⚠️</span>
                        <span className="error-text">{displayError}</span>
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
                            placeholder="Choose a username"
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="email">Comms Channel (Email)</label>
                        <input
                            id="email"
                            type="email"
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Security Code</label>
                        <div className="password-input-wrapper">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                className="input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Create a password"
                                autoComplete="new-password"
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirmPassword">Verify Security Code</label>
                        <div className="password-input-wrapper">
                            <input
                                id="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                className="input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your password"
                                autoComplete="new-password"
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary auth-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? 'CONFIGURING MAIN DATA...' : 'REGISTER ACCOUNT'}
                    </button>
                </form>

                <p className="auth-footer">
                    Mainframe profile exists? <Link to="/login" className="auth-link">Login</Link>
                </p>
            </motion.div>
        </div>
    )
}
