import { useParams } from 'react-router-dom'
import SnakeGame from '../games/snake/SnakeGame'

export default function GamePage() {
    const { slug } = useParams<{ slug: string }>()

    const renderGame = () => {
        switch (slug) {
            case 'snake':
                return <SnakeGame />
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
        <div className="game-page container">
            {renderGame()}

            <style>{`
        .game-page {
          display: flex;
          flex-direction: column;
          align-items: center;
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
