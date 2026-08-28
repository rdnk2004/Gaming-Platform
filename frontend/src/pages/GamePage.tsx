import { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import SnakeGame from '../games/snake/SnakeGame'
import TetrisGame from '../games/tetris/TetrisGame'
import PongGame from '../games/pong/PongGame'
import GameHeaderBar from '../components/GameHeaderBar'
import { GameSlug } from '../types/game'

const GAME_METADATA: Record<GameSlug, { title: string; color: string }> = {
  snake: { title: 'NEON VIPER', color: '#00f0ff' },
  tetris: { title: 'CYBER TETRIS', color: '#00f260' },
  pong: { title: 'NEON PONG', color: '#ff0055' }
}

export default function GamePage() {
  const { slug } = useParams<{ slug: string }>()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const isValidSlug = slug && (slug === 'snake' || slug === 'tetris' || slug === 'pong')
  const gameSlug = (isValidSlug ? slug : 'snake') as GameSlug
  const meta = isValidSlug ? GAME_METADATA[gameSlug] : null

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch((err) => {
        console.warn('Fullscreen request denied:', err)
      })
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      }).catch((err) => {
        console.warn('Exit fullscreen failed:', err)
      })
    }
  }

  const renderGame = () => {
    switch (slug) {
      case 'snake':
        return <SnakeGame />
      case 'tetris':
        return <TetrisGame />
      case 'pong':
        return <PongGame />
      default:
        return (
          <div className="game-not-found card">
            <h2>⚠️ ARENA NOT FOUND</h2>
            <p>The requested simulation vector does not exist in the mainframe.</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }}>
              RETURN TO ARENA SELECT
            </Link>
          </div>
        )
    }
  }

  return (
    <div className="game-page-wrapper" ref={containerRef}>
      {meta && (
        <GameHeaderBar
          slug={gameSlug}
          title={meta.title}
          accentColor={meta.color}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
        />
      )}
      <div className="game-viewport-card">
        {renderGame()}
      </div>
    </div>
  )
}
