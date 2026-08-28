import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { soundFx } from '../../services/soundFx'
import { GameStatus } from '../../types/game'

export interface StatItem {
  label: string
  value: string | number
}

interface GameOverlayProps {
  status: GameStatus
  title: string
  subtitle?: string
  score?: number
  highScore?: number
  isNewRecord?: boolean
  stats?: StatItem[]
  xpEarned?: number
  onStart: () => void
  onResume?: () => void
  onRestart?: () => void
  children?: React.ReactNode
  startBtnText?: string
  accentColor?: string
}

export function GameOverlay({
  status,
  title,
  subtitle,
  score,
  highScore,
  isNewRecord = false,
  stats = [],
  xpEarned,
  onStart,
  onResume,
  onRestart,
  children,
  startBtnText = 'START MISSION',
  accentColor = 'var(--secondary)'
}: GameOverlayProps) {
  if (status === 'playing') return null

  const isGameOver = status === 'gameover'
  const isPaused = status === 'paused'

  const handleStart = () => {
    soundFx.playClick()
    onStart()
  }

  const handleResume = () => {
    soundFx.playClick()
    if (onResume) onResume()
  }

  const handleRestart = () => {
    soundFx.playClick()
    if (onRestart) onRestart()
  }

  return (
    <AnimatePresence>
      <motion.div
        className={`overlay ${isGameOver ? 'gameover' : ''} ${isPaused ? 'paused' : ''}`}
        initial={{ opacity: 0, scale: 0.92, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: -10 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <h2 style={{ color: isGameOver ? 'var(--accent)' : accentColor }}>
          {isGameOver ? 'SYSTEM CRASH' : isPaused ? 'SIMULATION PAUSED' : title}
        </h2>

        {subtitle && !isPaused && !isGameOver && (
          <div className="subtitle" style={{ color: accentColor }}>{subtitle}</div>
        )}

        {isPaused && (
          <p>Simulation temporarily suspended. Press ESC or RESUME to continue.</p>
        )}

        {isGameOver && (
          <>
            <p>Final Score: <strong style={{ color: accentColor, fontSize: '1.2rem' }}>{score ?? 0}</strong></p>
            {isNewRecord && <p className="new-record">🏆 NEW HIGH SCORE!</p>}
            {typeof highScore === 'number' && !isNewRecord && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>High Score: {highScore}</p>
            )}
            {typeof xpEarned === 'number' && xpEarned > 0 && (
              <div style={{
                background: 'rgba(0, 240, 255, 0.1)',
                border: '1px solid var(--secondary)',
                borderRadius: 'var(--radius-md)',
                padding: '6px 12px',
                margin: '10px 0',
                color: 'var(--secondary)',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}>
                +{xpEarned} XP TRANSMITTED
              </div>
            )}
          </>
        )}

        {stats.length > 0 && isGameOver && (
          <div className="final-stats">
            {stats.map((stat, idx) => (
              <div key={idx} className="stat-row">
                <span>{stat.label}</span>
                <span style={{ color: accentColor }}>{stat.value}</span>
              </div>
            ))}
          </div>
        )}

        {children}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '18px' }}>
          {isPaused && onResume && (
            <button className="btn-start" onClick={handleResume} style={{ background: accentColor }}>
              RESUME
            </button>
          )}

          {isPaused && onRestart && (
            <button className="btn-secondary" onClick={handleRestart} style={{ padding: '12px 24px', borderRadius: '50px' }}>
              RESTART
            </button>
          )}

          {!isPaused && (
            <button
              className="btn-start"
              onClick={handleStart}
              style={{
                background: isGameOver
                  ? 'linear-gradient(135deg, #ff0055, #ff5e3a)'
                  : undefined
              }}
            >
              {isGameOver ? 'REBOOT SIMULATION' : startBtnText}
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
