import { useParams } from 'react-router-dom'
import SnakeGame from '../games/snake/SnakeGame'
import TetrisGame from '../games/tetris/TetrisGame'
import PongGame from '../games/pong/PongGame'

export default function GamePage() {
  const { slug } = useParams<{ slug: string }>()

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
          <div className="game-not-found">
            <h2>Game Not Found</h2>
            <p>The game you're looking for doesn't exist yet.</p>
          </div>
        )
    }
  }

  return (
    <div className="game-page">
      {renderGame()}

      <style>{`
        .game-page {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          position: fixed;
          top: 0;
          left: 0;
        }
        
        .game-not-found {
          text-align: center;
          padding: var(--space-2xl);
        }
        
        .game-not-found h2 {
          margin-bottom: var(--space-md);
        }
        
        .game-not-found p {
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  )
}
