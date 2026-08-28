import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuthStore } from '../../store/authStore'
import { gameApi } from '../../api/gameApi'
import { soundFx } from '../../services/soundFx'
import { GameStatus } from '../../types/game'
import { GameOverlay } from '../core/GameOverlay'
import { ParticleEngine } from '../core/ParticleEngine'
import { useGameInput } from '../core/useGameInput'
import {
  TetrominoType,
  TetrisEdition,
  TETRIS_EDITIONS,
  ActivePiece,
  WALL_KICKS,
  I_WALL_KICKS,
  createEmptyBoard,
  create7Bag,
  rotateMatrix,
  isValidPosition,
  calculateGhostPosition,
  spawnPiece,
  clearCompletedLines,
  getDropInterval
} from './tetrisEngine'
import { TetrisRenderer } from './tetrisRenderer'
import { TetrisPiecePreview } from './TetrisPiecePreview'

export default function TetrisGame() {
  const { token, updateUserXp } = useAuthStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // React State
  const [gameState, setGameState] = useState<GameStatus>('menu')
  const [edition, setEdition] = useState<TetrisEdition>('classic')
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [lines, setLines] = useState(0)
  const [combo, setCombo] = useState(0)
  const [holdPiece, setHoldPiece] = useState<TetrominoType | null>(null)
  const [nextPiece, setNextPiece] = useState<TetrominoType | null>(null)
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('tetrisHighScore') || '0', 10))
  const [isNewRecord, setIsNewRecord] = useState(false)
  const [xpEarned, setXpEarned] = useState<number | undefined>(undefined)

  // Engine Refs
  const editionRef = useRef(edition)
  const gameStateRef = useRef(gameState)
  const scoreRef = useRef(score)
  const levelRef = useRef(level)
  const linesRef = useRef(lines)
  const comboRef = useRef(combo)
  const highScoreRef = useRef(highScore)
  const particleEngineRef = useRef<ParticleEngine>(new ParticleEngine(150))
  const startTimeRef = useRef<number>(0)
  const gameDurationRef = useRef<number>(0)
  const screenShakeRef = useRef<number>(0)

  useEffect(() => { editionRef.current = edition }, [edition])
  useEffect(() => { gameStateRef.current = gameState }, [gameState])
  useEffect(() => { scoreRef.current = score }, [score])
  useEffect(() => { levelRef.current = level }, [level])
  useEffect(() => { linesRef.current = lines }, [lines])
  useEffect(() => { comboRef.current = combo }, [combo])
  useEffect(() => { highScoreRef.current = highScore }, [highScore])

  // Simulation State in Ref
  const simRef = useRef<{
    board: (string | null)[][]
    currentPiece: ActivePiece | null
    hold: TetrominoType | null
    canHold: boolean
    bag: TetrominoType[]
    nextQueue: TetrominoType[]
    dropCounter: number
    dropInterval: number
    lastDropTime: number
  }>({
    board: [],
    currentPiece: null,
    hold: null,
    canHold: true,
    bag: [],
    nextQueue: [],
    dropCounter: 0,
    dropInterval: 1000,
    lastDropTime: 0
  })

  const getNextPieceFromBag = useCallback((): TetrominoType => {
    const sim = simRef.current
    if (sim.bag.length === 0) {
      sim.bag = create7Bag()
    }
    const next = sim.bag.pop()!

    // Refill queue
    if (sim.nextQueue.length < 3) {
      if (sim.bag.length === 0) sim.bag = create7Bag()
      sim.nextQueue.push(sim.bag.pop()!)
    }

    return next
  }, [])

  const handleGameOver = useCallback(async (finalScore: number) => {
    soundFx.playGameOver()
    setGameState('gameover')

    const durationSeconds = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000))
    gameDurationRef.current = durationSeconds

    if (finalScore > highScoreRef.current) {
      setHighScore(finalScore)
      setIsNewRecord(true)
      localStorage.setItem('tetrisHighScore', finalScore.toString())
    } else {
      setIsNewRecord(false)
    }

    if (token && finalScore > 0) {
      try {
        const res = await gameApi.submitScore({
          game_slug: 'tetris',
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

  const lockPiece = useCallback(() => {
    const sim = simRef.current
    const piece = sim.currentPiece
    const config = TETRIS_EDITIONS[editionRef.current]

    if (!piece) return

    // Stamp piece into board
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c] !== 0) {
          const boardY = piece.y + r
          const boardX = piece.x + c
          if (boardY >= 0 && boardY < config.height && boardX >= 0 && boardX < config.width) {
            sim.board[boardY][boardX] = piece.color
          }
        }
      }
    }

    soundFx.playImpact()

    // Clear Lines
    const clearResult = clearCompletedLines(sim.board, levelRef.current, comboRef.current)
    if (clearResult.linesCleared > 0) {
      const newScore = scoreRef.current + clearResult.pointsEarned
      const newLines = linesRef.current + clearResult.linesCleared
      const newLevel = Math.floor(newLines / 10) + 1
      const newCombo = comboRef.current + 1

      setScore(newScore)
      setLines(newLines)
      setLevel(newLevel)
      setCombo(newCombo)

      sim.dropInterval = getDropInterval(newLevel)
      screenShakeRef.current = clearResult.isTetris ? 12 : 5

      soundFx.playLineClear()

      // Spawn line clear particles
      for (const rowIdx of clearResult.clearedRowIndices) {
        particleEngineRef.current.emitExplosion(
          (config.width * config.cellSize) / 2,
          rowIdx * config.cellSize,
          '#00f260',
          30,
          5
        )
      }
    } else {
      setCombo(0)
    }

    // Spawn Next Piece
    const nextType = sim.nextQueue.shift() || getNextPieceFromBag()
    setNextPiece(sim.nextQueue[0] || null)

    const newPiece = spawnPiece(nextType, config.width)
    if (!isValidPosition(sim.board, newPiece.shape, newPiece.x, newPiece.y, config.width, config.height)) {
      handleGameOver(scoreRef.current)
      return
    }

    sim.currentPiece = newPiece
    sim.canHold = true
  }, [getNextPieceFromBag, handleGameOver])

  const moveHorizontal = useCallback((dir: -1 | 1) => {
    const sim = simRef.current
    const piece = sim.currentPiece
    const config = TETRIS_EDITIONS[editionRef.current]
    if (!piece || gameStateRef.current !== 'playing') return

    if (isValidPosition(sim.board, piece.shape, piece.x + dir, piece.y, config.width, config.height)) {
      piece.x += dir
      soundFx.playClick()
    }
  }, [])

  const rotatePiece = useCallback((clockwise: boolean = true) => {
    const sim = simRef.current
    const piece = sim.currentPiece
    const config = TETRIS_EDITIONS[editionRef.current]
    if (!piece || gameStateRef.current !== 'playing') return

    const originalShape = piece.shape
    const rotated = rotateMatrix(originalShape)
    const newRot = (piece.rotation + (clockwise ? 1 : 3)) % 4
    const kickKey = `${piece.rotation}>${newRot}`
    const kickTable = piece.type === 'I' ? I_WALL_KICKS[kickKey] : WALL_KICKS[kickKey]

    if (kickTable) {
      for (const [kx, ky] of kickTable) {
        if (isValidPosition(sim.board, rotated, piece.x + kx, piece.y - ky, config.width, config.height)) {
          piece.shape = rotated
          piece.x += kx
          piece.y -= ky
          piece.rotation = newRot
          soundFx.playRotate()
          return
        }
      }
    }

    if (isValidPosition(sim.board, rotated, piece.x, piece.y, config.width, config.height)) {
      piece.shape = rotated
      piece.rotation = newRot
      soundFx.playRotate()
    }
  }, [])

  const softDrop = useCallback(() => {
    const sim = simRef.current
    const piece = sim.currentPiece
    const config = TETRIS_EDITIONS[editionRef.current]
    if (!piece || gameStateRef.current !== 'playing') return

    if (isValidPosition(sim.board, piece.shape, piece.x, piece.y + 1, config.width, config.height)) {
      piece.y += 1
      setScore(s => s + 1)
    } else {
      lockPiece()
    }
  }, [lockPiece])

  const hardDrop = useCallback(() => {
    const sim = simRef.current
    const piece = sim.currentPiece
    const config = TETRIS_EDITIONS[editionRef.current]
    if (!piece || gameStateRef.current !== 'playing') return

    const ghostY = calculateGhostPosition(sim.board, piece, config.width, config.height)
    const dropDistance = ghostY - piece.y
    piece.y = ghostY
    setScore(s => s + dropDistance * 2)

    particleEngineRef.current.emitSparks(
      piece.x * config.cellSize + (piece.shape[0].length * config.cellSize) / 2,
      ghostY * config.cellSize + (piece.shape.length * config.cellSize),
      piece.color,
      16
    )

    lockPiece()
  }, [lockPiece])

  const holdCurrentPiece = useCallback(() => {
    const sim = simRef.current
    const piece = sim.currentPiece
    const config = TETRIS_EDITIONS[editionRef.current]
    if (!piece || !sim.canHold || gameStateRef.current !== 'playing') return

    soundFx.playRotate()
    const currentType = piece.type

    if (sim.hold === null) {
      sim.hold = currentType
      const nextType = sim.nextQueue.shift() || getNextPieceFromBag()
      sim.currentPiece = spawnPiece(nextType, config.width)
      setNextPiece(sim.nextQueue[0] || null)
    } else {
      const prevHold = sim.hold
      sim.hold = currentType
      sim.currentPiece = spawnPiece(prevHold, config.width)
    }

    setHoldPiece(sim.hold)
    sim.canHold = false
  }, [getNextPieceFromBag])

  // Keyboard input
  useGameInput({
    onKeyDown: (key) => {
      if (gameStateRef.current === 'menu' || gameStateRef.current === 'gameover') return

      if (key === 'Escape') {
        if (gameStateRef.current === 'playing') setGameState('paused')
        else if (gameStateRef.current === 'paused') setGameState('playing')
        return
      }

      if (gameStateRef.current !== 'playing') return

      if (key === 'ArrowLeft' || key === 'a' || key === 'A') moveHorizontal(-1)
      else if (key === 'ArrowRight' || key === 'd' || key === 'D') moveHorizontal(1)
      else if (key === 'ArrowDown' || key === 's' || key === 'S') softDrop()
      else if (key === ' ' || key === 'Space') hardDrop()
      else if (key === 'ArrowUp' || key === 'w' || key === 'W' || key === 'x' || key === 'X') rotatePiece(true)
      else if (key === 'z' || key === 'Z' || key === 'Control') rotatePiece(false)
      else if (key === 'c' || key === 'C' || key === 'Shift') holdCurrentPiece()
    }
  }, gameState === 'playing' || gameState === 'paused')

  const initGame = useCallback(() => {
    const config = TETRIS_EDITIONS[editionRef.current]
    const initialBag = create7Bag()
    const firstPieceType = initialBag.pop()!
    const queue = [initialBag.pop()!, initialBag.pop()!, initialBag.pop()!]

    simRef.current = {
      board: createEmptyBoard(config.height, config.width),
      currentPiece: spawnPiece(firstPieceType, config.width),
      hold: null,
      canHold: true,
      bag: initialBag,
      nextQueue: queue,
      dropCounter: 0,
      dropInterval: getDropInterval(1),
      lastDropTime: performance.now()
    }

    particleEngineRef.current.clear()
    setScore(0)
    setLevel(1)
    setLines(0)
    setCombo(0)
    setHoldPiece(null)
    setNextPiece(queue[0])
    setXpEarned(undefined)
    startTimeRef.current = Date.now()
    setGameState('playing')
  }, [])

  // 60FPS Game Loop
  useEffect(() => {
    let animId: number
    let lastTime = performance.now()

    const gameLoop = (time: number) => {
      const dt = time - lastTime
      lastTime = time

      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      const sim = simRef.current
      const config = TETRIS_EDITIONS[editionRef.current]

      if (canvas && ctx) {
        if (gameStateRef.current === 'playing' && sim.currentPiece) {
          sim.dropCounter += dt

          if (sim.dropCounter >= sim.dropInterval) {
            sim.dropCounter = 0
            if (isValidPosition(sim.board, sim.currentPiece.shape, sim.currentPiece.x, sim.currentPiece.y + 1, config.width, config.height)) {
              sim.currentPiece.y += 1
            } else {
              lockPiece()
            }
          }

          if (screenShakeRef.current > 0) {
            screenShakeRef.current *= 0.9
            if (screenShakeRef.current < 0.2) screenShakeRef.current = 0
          }

          particleEngineRef.current.update()
        }

        // Calculate Ghost Position
        const ghostY = sim.currentPiece
          ? calculateGhostPosition(sim.board, sim.currentPiece, config.width, config.height)
          : 0

        // Render Frame
        TetrisRenderer.renderScene(
          ctx,
          sim.board,
          sim.currentPiece,
          ghostY,
          config,
          particleEngineRef.current,
          screenShakeRef.current
        )
      }

      animId = requestAnimationFrame(gameLoop)
    }

    animId = requestAnimationFrame(gameLoop)
    return () => cancelAnimationFrame(animId)
  }, [lockPiece])

  const config = TETRIS_EDITIONS[edition]

  return (
    <div className="tetris-container">
      <div className="tetris-layout-grid">
        {/* Left Side: Hold Queue & Controls */}
        <div className="tetris-hud-panel">
          <TetrisPiecePreview type={holdPiece} label="HOLD" />

          <div className="tetris-stat-card">
            <span className="tetris-stat-label">LINES</span>
            <span className="tetris-stat-value">{lines}</span>
          </div>

          <div className="tetris-stat-card">
            <span className="tetris-stat-label">LEVEL</span>
            <span className="tetris-stat-value" style={{ color: 'var(--neon-pink)' }}>{level}</span>
          </div>
        </div>

        {/* Center: Main Matrix Canvas */}
        <div className="tetris-matrix-wrapper">
          <canvas
            ref={canvasRef}
            width={config.width * config.cellSize}
            height={config.height * config.cellSize}
            className="game-canvas"
          />

          {/* Standardized Glassmorphic Overlay */}
          <GameOverlay
            status={gameState}
            title="CYBER TETRIS"
            subtitle="QUANTUM MATRIX SIMULATOR"
            score={score}
            highScore={highScore}
            isNewRecord={isNewRecord}
            xpEarned={xpEarned}
            stats={[
              { label: 'Total Lines Cleared', value: lines },
              { label: 'Highest Matrix Level', value: level },
              { label: 'Max Combo Streak', value: `x${combo}` },
              { label: 'Simulation Time', value: `${gameDurationRef.current}s` }
            ]}
            onStart={initGame}
            onResume={() => setGameState('playing')}
            onRestart={initGame}
            startBtnText={gameState === 'menu' ? 'START MATRIX' : 'RETRY MATRIX'}
            accentColor="#00f260"
          >
            {gameState === 'menu' && (
              <>
                <div className="edition-select">
                  <button
                    className={`edition-btn ${edition === 'classic' ? 'active' : ''}`}
                    onClick={() => setEdition('classic')}
                  >
                    CLASSIC (10x20)
                  </button>
                  <button
                    className={`edition-btn ${edition === 'ultra' ? 'active' : ''}`}
                    onClick={() => setEdition('ultra')}
                  >
                    ULTRA (12x24)
                  </button>
                </div>

                <div className="controls-grid" style={{ marginTop: '14px' }}>
                  <div className="control-row"><span className="k-box">← / →</span><span>Move</span></div>
                  <div className="control-row"><span className="k-box">↑ / X</span><span>Rotate</span></div>
                  <div className="control-row"><span className="k-box">SPACE</span><span>Hard Drop</span></div>
                  <div className="control-row"><span className="k-box">C / SHIFT</span><span>Hold Piece</span></div>
                  <div className="control-row"><span className="k-box">↓</span><span>Soft Drop</span></div>
                  <div className="control-row"><span className="k-box">ESC</span><span>Pause</span></div>
                </div>
              </>
            )}
          </GameOverlay>
        </div>

        {/* Right Side: Next Queue & Score */}
        <div className="tetris-hud-panel">
          <TetrisPiecePreview type={nextPiece} label="NEXT" />

          <div className="tetris-stat-card">
            <span className="tetris-stat-label">SCORE</span>
            <span className="tetris-stat-value">{score}</span>
          </div>

          {combo > 1 && (
            <div className="tetris-stat-card" style={{ borderColor: '#fbbf24' }}>
              <span className="tetris-stat-label" style={{ color: '#fbbf24' }}>COMBO</span>
              <span className="tetris-stat-value" style={{ color: '#fbbf24' }}>x{combo}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
