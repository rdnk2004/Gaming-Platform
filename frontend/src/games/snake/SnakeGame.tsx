import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuthStore } from '../../store/authStore'
import { gameApi } from '../../api/gameApi'
import { soundFx } from '../../services/soundFx'
import { GameStatus } from '../../types/game'
import { GameOverlay } from '../core/GameOverlay'
import { ParticleEngine } from '../core/ParticleEngine'
import { useGameInput } from '../core/useGameInput'
import {
  SNAKE_CONFIG,
  FoodItem,
  BigBubbleItem,
  PowerUpItem,
  SnakeEntity,
  dist
} from './snakeEngine'
import { SnakeRenderer } from './snakeRenderer'

export default function SnakeGame() {
  const { token, updateUserXp } = useAuthStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Game UI State
  const [gameState, setGameState] = useState<GameStatus>('menu')
  const [mode, setMode] = useState<1 | 2>(1)
  const [wallsEnabled, setWallsEnabled] = useState(true)
  const [scores, setScores] = useState({ p1: 0, p2: 0 })
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('snakeHighScore') || '0', 10))
  const [isNewRecord, setIsNewRecord] = useState(false)
  const [xpEarned, setXpEarned] = useState<number | undefined>(undefined)

  // Engine Refs (avoid closure lag during 60fps RAF loop)
  const modeRef = useRef(mode)
  const wallsEnabledRef = useRef(wallsEnabled)
  const gameStateRef = useRef(gameState)
  const highScoreRef = useRef(highScore)
  const pressedKeysRef = useRef<Record<string, boolean>>({})
  const particleEngineRef = useRef<ParticleEngine>(new ParticleEngine(200))
  const gameDurationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { wallsEnabledRef.current = wallsEnabled }, [wallsEnabled])
  useEffect(() => { gameStateRef.current = gameState }, [gameState])
  useEffect(() => { highScoreRef.current = highScore }, [highScore])

  const simulationRef = useRef<{
    snakes: SnakeEntity[]
    food: FoodItem | null
    bigBubbles: BigBubbleItem[]
    powerUps: PowerUpItem[]
    lastSpawn: { bubble: number; powerUp: number }
  }>({
    snakes: [],
    food: null,
    bigBubbles: [],
    powerUps: [],
    lastSpawn: { bubble: 0, powerUp: 0 }
  })

  // Keyboard input management
  useGameInput({
    onKeyDown: (key) => {
      const lower = key.toLowerCase()
      pressedKeysRef.current[lower] = true
      if (key === 'Escape') {
        if (gameStateRef.current === 'playing') {
          setGameState('paused')
        } else if (gameStateRef.current === 'paused') {
          setGameState('playing')
        }
      }
    },
    onKeyUp: (key) => {
      const lower = key.toLowerCase()
      pressedKeysRef.current[lower] = false
    }
  }, gameState === 'playing' || gameState === 'paused')

  const handleGameOver = useCallback(async (finalScore: number) => {
    soundFx.playGameOver()
    setGameState('gameover')

    const durationSeconds = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000))
    gameDurationRef.current = durationSeconds

    if (finalScore > highScoreRef.current) {
      setHighScore(finalScore)
      setIsNewRecord(true)
      localStorage.setItem('snakeHighScore', finalScore.toString())
    } else {
      setIsNewRecord(false)
    }

    if (token && finalScore > 0) {
      try {
        const res = await gameApi.submitScore({
          game_slug: 'snake',
          score: finalScore,
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
    const canvas = canvasRef.current
    if (!canvas) return

    const width = canvas.width
    const height = canvas.height

    const snakes: SnakeEntity[] = []
    if (modeRef.current === 1) {
      snakes.push(new SnakeEntity(1, width / 2, height / 2, SNAKE_CONFIG.colors.p1, 'arrows'))
    } else {
      snakes.push(new SnakeEntity(1, width / 3, height / 2, SNAKE_CONFIG.colors.p1, 'wasd', 0))
      snakes.push(new SnakeEntity(2, (width / 3) * 2, height / 2, SNAKE_CONFIG.colors.p2, 'arrows', Math.PI))
    }

    simulationRef.current = {
      snakes,
      food: new FoodItem(width, height),
      bigBubbles: [],
      powerUps: [],
      lastSpawn: { bubble: Date.now(), powerUp: Date.now() }
    }

    particleEngineRef.current.clear()
    setScores({ p1: 0, p2: 0 })
    setXpEarned(undefined)
    startTimeRef.current = Date.now()
    setGameState('playing')
  }, [])

  // Canvas resize listener
  useEffect(() => {
    const updateCanvasDimensions = () => {
      if (!canvasRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      canvasRef.current.width = rect.width
      canvasRef.current.height = Math.max(500, rect.height)
    }

    updateCanvasDimensions()
    window.addEventListener('resize', updateCanvasDimensions)
    return () => window.removeEventListener('resize', updateCanvasDimensions)
  }, [])

  // 60FPS Game loop
  useEffect(() => {
    let animId: number
    let lastTime = performance.now()

    const gameLoop = (time: number) => {
      const dt = Math.min(32, time - lastTime)
      lastTime = time

      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      const sim = simulationRef.current
      const particles = particleEngineRef.current

      if (canvas && ctx) {
        if (gameStateRef.current === 'playing') {
          const now = Date.now()
          const width = canvas.width
          const height = canvas.height

          // Spawn big bubbles every 15s
          if (now - sim.lastSpawn.bubble > 15000 && sim.bigBubbles.length < 2) {
            sim.bigBubbles.push(new BigBubbleItem(width, height))
            sim.lastSpawn.bubble = now
          }

          // Spawn powerups every 18s
          if (now - sim.lastSpawn.powerUp > 18000 && sim.powerUps.length < 2) {
            sim.powerUps.push(new PowerUpItem(width, height))
            sim.lastSpawn.powerUp = now
          }

          // Update food pulse
          if (sim.food) sim.food.update(time)

          // Update bubble & powerup lifespans
          sim.bigBubbles = sim.bigBubbles.filter(b => b.update())
          sim.powerUps = sim.powerUps.filter(p => p.update())

          // Update snakes
          let anyDied = false
          let winningScore = 0

          sim.snakes.forEach((snake, idx) => {
            const enemy = modeRef.current === 2 ? sim.snakes[idx === 0 ? 1 : 0] : undefined
            const died = snake.update(dt, pressedKeysRef.current, width, height, wallsEnabledRef.current, enemy)

            if (died) {
              anyDied = true
              soundFx.playExplosion()
              particles.emitExplosion(snake.head.x, snake.head.y, snake.color.main, 40, 6)
            }

            // Food collision
            if (sim.food && dist(snake.head.x, snake.head.y, sim.food.x, sim.food.y) < snake.width + 10) {
              snake.grow()
              soundFx.playEat()
              particles.emitExplosion(sim.food.x, sim.food.y, sim.food.color, 18, 3)
              particles.emitFloatingText(sim.food.x, sim.food.y, '+10', snake.color.main)
              sim.food.respawn(width, height)
            }

            // Big bubble collision
            sim.bigBubbles.forEach((bubble, bIdx) => {
              if (dist(snake.head.x, snake.head.y, bubble.x, bubble.y) < snake.width + bubble.size) {
                snake.score += 50
                soundFx.playPowerup()
                particles.emitExplosion(bubble.x, bubble.y, bubble.color, 30, 5)
                particles.emitFloatingText(bubble.x, bubble.y, '+50 BUBBLE', bubble.color)
                sim.bigBubbles.splice(bIdx, 1)
              }
            })

            // Power-up collision
            sim.powerUps.forEach((pup, pIdx) => {
              if (dist(snake.head.x, snake.head.y, pup.x, pup.y) < snake.width + pup.size) {
                soundFx.playPowerup()
                if (pup.type === 'speed') snake.effects.speed = 300
                if (pup.type === 'ghost') snake.effects.ghost = 300
                particles.emitExplosion(pup.x, pup.y, pup.color, 25, 4)
                particles.emitFloatingText(pup.x, pup.y, pup.type.toUpperCase(), pup.color)
                sim.powerUps.splice(pIdx, 1)
              }
            })

            winningScore = Math.max(winningScore, snake.score)
          })

          setScores({
            p1: sim.snakes[0]?.score || 0,
            p2: sim.snakes[1]?.score || 0
          })

          if (anyDied) {
            handleGameOver(winningScore)
          }

          particles.update()
        }

        // Render Frame
        SnakeRenderer.renderScene(
          ctx,
          canvas.width,
          canvas.height,
          {
            isLightMode: false,
            gridColor: 'rgba(255, 255, 255, 0.035)',
            bgColor: '#080612'
          },
          sim.snakes,
          sim.food,
          sim.bigBubbles,
          sim.powerUps,
          particles,
          time
        )
      }

      animId = requestAnimationFrame(gameLoop)
    }

    animId = requestAnimationFrame(gameLoop)
    return () => cancelAnimationFrame(animId)
  }, [handleGameOver])

  return (
    <div className="snake-game-container" ref={containerRef}>
      <canvas ref={canvasRef} className="game-canvas" />

      {/* Floating HUD Scores */}
      {gameState === 'playing' && (
        <div className="score-container">
          <div className="score-card">
            <label>P1 SCORE</label>
            <span className="value p1-color">{scores.p1}</span>
          </div>
          {mode === 2 && (
            <div className="score-card">
              <label>P2 SCORE</label>
              <span className="value p2-color">{scores.p2}</span>
            </div>
          )}
        </div>
      )}

      {/* Standardized Glassmorphic Overlay */}
      <GameOverlay
        status={gameState}
        title="NEON VIPER"
        subtitle="HYPERKINETIC ARCADE ARENA"
        score={mode === 1 ? scores.p1 : Math.max(scores.p1, scores.p2)}
        highScore={highScore}
        isNewRecord={isNewRecord}
        xpEarned={xpEarned}
        stats={[
          { label: 'Player 1 Orbs', value: scores.p1 },
          ...(mode === 2 ? [{ label: 'Player 2 Orbs', value: scores.p2 }] : []),
          { label: 'Battle Duration', value: `${gameDurationRef.current}s` }
        ]}
        onStart={initGame}
        onResume={() => setGameState('playing')}
        onRestart={initGame}
        startBtnText={gameState === 'menu' ? 'ENTER ARENA' : 'PLAY AGAIN'}
        accentColor="#00f0ff"
      >
        {gameState === 'menu' && (
          <>
            <div className="mode-select">
              <button
                className={`mode-btn ${mode === 1 ? 'active' : ''}`}
                onClick={() => setMode(1)}
              >
                1 PLAYER
              </button>
              <button
                className={`mode-btn ${mode === 2 ? 'active' : ''}`}
                onClick={() => setMode(2)}
              >
                2 PLAYERS (VS)
              </button>
            </div>

            <div className="option-row">
              <button
                className={`mode-btn ${wallsEnabled ? 'active' : ''}`}
                onClick={() => setWallsEnabled(!wallsEnabled)}
              >
                {wallsEnabled ? 'WALLS: SOLID' : 'WALLS: PORTAL'}
              </button>
            </div>

            <div className="key-hint">
              <div className="key-group">
                <span className="key-title p1-color">P1 CONTROLS</span>
                <div className="keys">
                  <span className="k-box">{mode === 1 ? 'ARROWS' : 'W A S D'}</span>
                  <span className="key-extra">{mode === 1 ? 'SHIFT (BOOST)' : 'SPACE (BOOST)'}</span>
                </div>
              </div>
              {mode === 2 && (
                <div className="key-group">
                  <span className="key-title p2-color">P2 CONTROLS</span>
                  <div className="keys">
                    <span className="k-box">ARROWS</span>
                    <span className="key-extra">SHIFT (BOOST)</span>
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
