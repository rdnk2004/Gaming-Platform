import { useState } from 'react'
import { Link } from 'react-router-dom'
import { soundFx } from '../services/soundFx'
import { GameSlug } from '../types/game'

interface GameHeaderBarProps {
  slug: GameSlug
  title: string
  accentColor?: string
  onToggleFullscreen?: () => void
  isFullscreen?: boolean
}

export default function GameHeaderBar({
  slug,
  title,
  accentColor = 'var(--secondary)',
  onToggleFullscreen,
  isFullscreen = false
}: GameHeaderBarProps) {
  const [isMuted, setIsMuted] = useState(() => soundFx.getIsMuted())

  const handleToggleSound = () => {
    const muted = soundFx.toggleMute()
    setIsMuted(muted)
    if (!muted) soundFx.playClick()
  }

  return (
    <div className="game-top-bar">
      <div className="game-bar-left">
        <Link
          to="/"
          className="btn-back-home"
          onClick={() => soundFx.playClick()}
          title="Return to Main Arena"
        >
          <span className="back-arrow">←</span>
          <span className="back-label">ARENAS</span>
        </Link>

        <div className="game-badge-indicator" style={{ borderColor: accentColor }}>
          <span className="beacon-dot" style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }} />
          <span className="game-active-title" style={{ color: accentColor }}>{title}</span>
        </div>
      </div>

      <div className="game-bar-right">
        <Link
          to={`/leaderboard?game=${slug}`}
          className="game-bar-btn"
          onClick={() => soundFx.playClick()}
          title={`View ${title} Rankings`}
        >
          🏆 <span className="hide-on-mobile">RANKINGS</span>
        </Link>

        {onToggleFullscreen && (
          <button
            className="game-bar-btn"
            onClick={() => {
              soundFx.playClick()
              onToggleFullscreen()
            }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? '🗗 EXIT FULL' : '⛶ FULLSCREEN'}
          </button>
        )}

        <button
          className="game-bar-btn sound-btn"
          onClick={handleToggleSound}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? '🔇 MUTED' : '🔊 SOUND'}
        </button>
      </div>
    </div>
  )
}
