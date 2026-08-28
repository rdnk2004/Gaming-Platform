import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuthStore } from '../../store/authStore'
import { gameApi } from '../../api/gameApi'
import { soundFx } from '../../services/soundFx'
import { GameStatus } from '../../types/game'
import { GameOverlay } from '../core/GameOverlay'
import { ParticleEngine } from '../core/ParticleEngine'
import { useGameInput } from '../core/useGameInput'
import {
  PongMode,
  PongDifficulty,
  PONG_CONFIG,
  BallState,
  PaddleState,
  createInitialBall,
  createInitialPaddles,
  updateAiPaddle,
  updateBallPhysics
} from './pongEngine'
import { PongRenderer } from './pongRenderer'

const TABLE_WIDTH = 800
const TABLE_HEIGHT = 500

export default function PongGame() {
  const { token, updateUserXp } = useAuthStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // React Game State
  const [gameState, setGameState] = useState<GameStatus>('menu')
  const [mode, setMode] = useState<PongMode>('1p')
  const [difficulty, setDifficulty] = useState<PongDifficulty>('medium')
  const [scores, setScores] = useState({ p1: 0, p2: 0 })
  const [winner, setWinner] = useState<string>('')
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('pongHighScore') || '0', 10))
  const [isNewRecord, setIsNewRecord] = useState(false)
  const [xpEarned, setXpEarned] = useState<number | undefined>(undefined)

  // Engine Refs
  const modeRef = useRef(mode)
  const difficultyRef = useRef(difficulty)
  const gameStateRef = useRef(gameState)
  const highScoreRef = useRef(highScore)
  const pressedKeysRef = useRef<Record<string, boolean>>({})
  const particleEngineRef = useRef<ParticleEngine>(new ParticleEngine(120))
  const startTimeRef = useRef<number>(0)
  const gameDurationRef = useRef<number>(0)
  const volleysRef = useRef<number>(0)

  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { difficultyRef.current = difficulty }, [difficulty])
  useEffect(() => { gameStateRef.current = gameState }, [gameState])
  useEffect(() => { highScoreRef.current = highScore }, [highScore])

  // Simulation State in Ref
  const simRef = useRef<{
    ball: BallState
    p1: PaddleState
    p2: PaddleState
  }>({
    ball: createInitialBall(TABLE_WIDTH, TABLE_HEIGHT),
    ...createInitialPaddles(TABLE_WIDTH, TABLE_HEIGHT)
  })

  // Keyboard input management
  useGameInput({
    onKeyDown: (key) => {
      const lower = key.toLowerCase()
      pressedKeysRef.current[lower] = true

      if (key === 'Escape') {
        if (gameStateRef.current === 'playing') setGameState('paused')
        else if (gameStateRef.current === 'paused') setGameState('playing')
      }
    },
    onKeyUp: (key) => {
      const lower = key.toLowerCase()
      pressedKeysRef.current[lower] = false
    }
  }, gameState === 'playing' || gameState === 'paused')

  const handleGameOver = useCallback(async (winnerName: string, winningScore: number) => {
    soundFx.playGameOver()
    setWinner(winnerName)
    setGameState('gameover')

    const durationSeconds = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000))
    gameDurationRef.current = durationSeconds

    if (winningScore > highScoreRef.current) {
      setHighScore(winningScore)
      setIsNewRecord(true)
      localStorage.setItem('pongHighScore', winningScore.toString())
    } else {
      setIsNewRecord(false)
    }

    if (token && winningScore > 0) {
      try {
        const res = await gameApi.submitScore({
          game_slug: 'pong',
          score: winningScore,
          duration_seconds: durationSeconds
        }, token)

        setXpEarned(res.xp_earned)
        updateUserXp(res.total_xp, res.level)
      } catch (err) {
        console.warn('Failed to transmit score to mainframe:', err)
      }
    }
  }, [token, updateUserXp])

  const initGame = useCallback(() => {
    simRef.current = {
      ball: createInitialBall(TABLE_WIDTH, TABLE_HEIGHT),
      ...createInitialPaddles(TABLE_WIDTH, TABLE_HEIGHT)
    }

    particleEngineRef.current.clear()
    setScores({ p1: 0, p2: 0 })
    setWinner('')
    setXpEarned(undefined)
    volleysRef.current = 0
    startTimeRef.current = Date.now()
    setGameState('playing')
  }, [])

  // 60FPS Game loop
  useEffect(() => {
    let animId: number

    const gameLoop = () => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      const sim = simRef.current
      const particles = particleEngineRef.current
      const keys = pressedKeysRef.current

      if (canvas && ctx) {
        if (gameStateRef.current === 'playing') {
          // 1. Move Player 1 Paddle (W / S)
          if (keys['w'] && sim.p1.y > 10) {
            sim.p1.y -= PONG_CONFIG.paddleSpeed
          }
          if (keys['s'] && sim.p1.y < TABLE_HEIGHT - PONG_CONFIG.paddleHeight - 10) {
            sim.p1.y += PONG_CONFIG.paddleSpeed
          }

          // 2. Move Player 2 Paddle (AI or Arrow keys)
          if (modeRef.current === '1p') {
            updateAiPaddle(sim.p2, sim.ball, TABLE_HEIGHT, difficultyRef.current)
          } else {
            if (keys['arrowup'] && sim.p2.y > 10) {
              sim.p2.y -= PONG_CONFIG.paddleSpeed
            }
            if (keys['arrowdown'] && sim.p2.y < TABLE_HEIGHT - PONG_CONFIG.paddleHeight - 10) {
              sim.p2.y += PONG_CONFIG.paddleSpeed
            }
          }

          // 3. Update Ball Physics & Collisions
          const collision = updateBallPhysics(sim.ball, sim.p1, sim.p2, TABLE_WIDTH, TABLE_HEIGHT)

          if (collision) {
            if (collision.type === 'hit') {
              volleysRef.current++
              soundFx.playImpact()
              particles.emitSparks(collision.x, collision.y, collision.paddleIndex === 1 ? sim.p1.color : sim.p2.color, 12)
            } else if (collision.type === 'score') {
              soundFx.playExplosion()
              particles.emitExplosion(collision.x, collision.y, '#ff0055', 35, 6)

              setScores({ p1: sim.p1.score, p2: sim.p2.score })

              // Check for Match Winner
              if (sim.p1.score >= PONG_CONFIG.winScore) {
                const finalScore = sim.p1.score * 100 + volleysRef.current * 10
                handleGameOver(modeRef.current === '1p' ? 'PLAYER 1 WINS' : 'PLAYER 1 TRIUMPHS', finalScore)
                return
              } else if (sim.p2.score >= PONG_CONFIG.winScore) {
                const finalScore = sim.p2.score * 100 + volleysRef.current * 10
                handleGameOver(modeRef.current === '1p' ? 'AI MAINFRAME WINS' : 'PLAYER 2 TRIUMPHS', finalScore)
                return
              }

              // Reset Ball toward scorer
              sim.ball = createInitialBall(TABLE_WIDTH, TABLE_HEIGHT, collision.scorer === 1 ? -1 : 1)
            }
          }

          particles.update()
        }

        // 4. Render Frame
        PongRenderer.renderScene(
          ctx,
          TABLE_WIDTH,
          TABLE_HEIGHT,
          sim.ball,
          sim.p1,
          sim.p2,
          particles
        )
      }

      animId = requestAnimationFrame(gameLoop)
    }

    animId = requestAnimationFrame(gameLoop)
    return () => cancelAnimationFrame(animId)
  }, [handleGameOver])

  return (
    <div className="pong-container">
      {/* Floating HUD Scores */}
      {gameState === 'playing' && (
        <div className="score-container" style={{ top: '16px' }}>
          <div className="score-card">
            <label>PLAYER 1</label>
            <span className="value p1-color">{scores.p1}</span>
          </div>
          <div className="score-card">
            <label>{mode === '1p' ? 'AI OPPONENT' : 'PLAYER 2'}</label>
            <span className="value p2-color">{scores.p2}</span>
          </div>
        </div>
      )}

      {/* Main Canvas Viewport */}
      <canvas
        ref={canvasRef}
        width={TABLE_WIDTH}
        height={TABLE_HEIGHT}
        className="game-canvas"
      />

      {/* Standardized Glassmorphic Overlay */}
      <GameOverlay
        status={gameState}
        title={winner || 'NEON PONG'}
        subtitle="HYPERKINETIC TABLE ARENA"
        score={Math.max(scores.p1, scores.p2) * 100 + volleysRef.current * 10}
        highScore={highScore}
        isNewRecord={isNewRecord}
        xpEarned={xpEarned}
        stats={[
          { label: 'Player 1 Score', value: scores.p1 },
          { label: 'Player 2 Score', value: scores.p2 },
          { label: 'Total Volleys', value: volleysRef.current },
          { label: 'Match Duration', value: `${gameDurationRef.current}s` }
        ]}
        onStart={initGame}
        onResume={() => setGameState('playing')}
        onRestart={initGame}
        startBtnText={gameState === 'menu' ? 'START MATCH' : 'REMATCH'}
        accentColor="#ff0055"
      >
        {gameState === 'menu' && (
          <>
            <div className="mode-select">
              <button
                className={`mode-btn ${mode === '1p' ? 'active' : ''}`}
                onClick={() => setMode('1p')}
              >
                1 PLAYER (VS AI)
              </button>
              <button
                className={`mode-btn ${mode === '2p' ? 'active' : ''}`}
                onClick={() => setMode('2p')}
              >
                2 PLAYERS (LOCAL)
              </button>
            </div>

            {mode === '1p' && (
              <div className="option-row">
                {(['easy', 'medium', 'hard', 'insane'] as PongDifficulty[]).map((d) => (
                  <button
                    key={d}
                    className={`mode-btn ${difficulty === d ? 'active' : ''}`}
                    onClick={() => setDifficulty(d)}
                    style={{ textTransform: 'uppercase', fontSize: '0.8rem', padding: '6px 14px' }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}

            <div className="key-hint" style={{ marginTop: '16px' }}>
              <div className="key-group">
                <span className="key-title p1-color">P1 CONTROLS</span>
                <div className="keys">
                  <span className="k-box">W</span>
                  <span className="k-box">S</span>
                </div>
              </div>

              {mode === '2p' && (
                <div className="key-group">
                  <span className="key-title p2-color">P2 CONTROLS</span>
                  <div className="keys">
                    <span className="k-box">↑</span>
                    <span className="k-box">↓</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </GameOverlay>
    </div>
  )
}
