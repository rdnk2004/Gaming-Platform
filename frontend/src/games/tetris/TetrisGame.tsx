import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * CYBER TETRIS - Cyberarcade Edition
 * Classic Tetris with cyberpunk aesthetics
 */

// Tetromino shapes (standard 7-piece Tetris)
const TETROMINOES = {
    I: { shape: [[1, 1, 1, 1]], color: '#00d4ff' },
    O: { shape: [[1, 1], [1, 1]], color: '#fbbf24' },
    T: { shape: [[0, 1, 0], [1, 1, 1]], color: '#a855f7' },
    S: { shape: [[0, 1, 1], [1, 1, 0]], color: '#00f260' },
    Z: { shape: [[1, 1, 0], [0, 1, 1]], color: '#ff0055' },
    J: { shape: [[1, 0, 0], [1, 1, 1]], color: '#0575e6' },
    L: { shape: [[0, 0, 1], [1, 1, 1]], color: '#ff6b35' }
}

type TetrominoKey = keyof typeof TETROMINOES

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const CELL_SIZE = 30

// Create empty board
const createBoard = (): (string | null)[][] =>
    Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null))

// Random tetromino
const randomTetromino = (): TetrominoKey => {
    const keys = Object.keys(TETROMINOES) as TetrominoKey[]
    return keys[Math.floor(Math.random() * keys.length)]
}

// Rotate matrix 90 degrees clockwise
const rotate = (matrix: number[][]): number[][] => {
    const rows = matrix.length
    const cols = matrix[0].length
    const rotated: number[][] = []
    for (let c = 0; c < cols; c++) {
        rotated[c] = []
        for (let r = rows - 1; r >= 0; r--) {
            rotated[c].push(matrix[r][c])
        }
    }
    return rotated
}

interface Piece {
    shape: number[][]
    color: string
    x: number
    y: number
}

export default function TetrisGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu')
    const [score, setScore] = useState(0)
    const [level, setLevel] = useState(1)
    const [lines, setLines] = useState(0)
    const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('tetrisHighScore') || '0'))

    const gameRef = useRef<{
        board: (string | null)[][]
        currentPiece: Piece | null
        nextPiece: TetrominoKey
        dropCounter: number
        dropInterval: number
        lastTime: number
        animationId: number
        keys: Record<string, boolean>
        keyRepeat: Record<string, number>
    }>({
        board: createBoard(),
        currentPiece: null,
        nextPiece: randomTetromino(),
        dropCounter: 0,
        dropInterval: 1000,
        lastTime: 0,
        animationId: 0,
        keys: {},
        keyRepeat: {}
    })

    const spawnPiece = useCallback(() => {
        const game = gameRef.current
        const type = game.nextPiece
        const tetromino = TETROMINOES[type]
        game.currentPiece = {
            shape: tetromino.shape.map(row => [...row]),
            color: tetromino.color,
            x: Math.floor(BOARD_WIDTH / 2) - Math.floor(tetromino.shape[0].length / 2),
            y: 0
        }
        game.nextPiece = randomTetromino()

        // Check game over
        if (!isValidPosition(game.currentPiece, game.board)) {
            return false
        }
        return true
    }, [])

    const isValidPosition = (piece: Piece, board: (string | null)[][]): boolean => {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const boardX = piece.x + x
                    const boardY = piece.y + y
                    if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) return false
                    if (boardY >= 0 && board[boardY][boardX]) return false
                }
            }
        }
        return true
    }

    const mergePiece = useCallback(() => {
        const game = gameRef.current
        if (!game.currentPiece) return

        for (let y = 0; y < game.currentPiece.shape.length; y++) {
            for (let x = 0; x < game.currentPiece.shape[y].length; x++) {
                if (game.currentPiece.shape[y][x]) {
                    const boardY = game.currentPiece.y + y
                    const boardX = game.currentPiece.x + x
                    if (boardY >= 0) {
                        game.board[boardY][boardX] = game.currentPiece.color
                    }
                }
            }
        }
    }, [])

    const clearLines = useCallback(() => {
        const game = gameRef.current
        let linesCleared = 0

        for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
            if (game.board[y].every(cell => cell !== null)) {
                game.board.splice(y, 1)
                game.board.unshift(Array(BOARD_WIDTH).fill(null))
                linesCleared++
                y++ // Check same row again
            }
        }

        if (linesCleared > 0) {
            const points = [0, 100, 300, 500, 800][linesCleared] * level
            setScore(prev => prev + points)
            setLines(prev => {
                const newLines = prev + linesCleared
                const newLevel = Math.floor(newLines / 10) + 1
                if (newLevel > level) {
                    setLevel(newLevel)
                    game.dropInterval = Math.max(100, 1000 - (newLevel - 1) * 100)
                }
                return newLines
            })
        }
    }, [level])

    const movePiece = useCallback((dx: number, dy: number): boolean => {
        const game = gameRef.current
        if (!game.currentPiece) return false

        const newPiece = { ...game.currentPiece, x: game.currentPiece.x + dx, y: game.currentPiece.y + dy }
        if (isValidPosition(newPiece, game.board)) {
            game.currentPiece = newPiece
            return true
        }
        return false
    }, [])

    const rotatePiece = useCallback(() => {
        const game = gameRef.current
        if (!game.currentPiece) return

        const rotated = rotate(game.currentPiece.shape)
        const newPiece = { ...game.currentPiece, shape: rotated }

        // Wall kick - try offsets
        const offsets = [0, -1, 1, -2, 2]
        for (const offset of offsets) {
            const testPiece = { ...newPiece, x: newPiece.x + offset }
            if (isValidPosition(testPiece, game.board)) {
                game.currentPiece = testPiece
                return
            }
        }
    }, [])

    const hardDrop = useCallback(() => {
        const game = gameRef.current
        if (!game.currentPiece) return

        let dropDistance = 0
        while (movePiece(0, 1)) {
            dropDistance++
        }
        setScore(prev => prev + dropDistance * 2)
        mergePiece()
        clearLines()
        if (!spawnPiece()) {
            endGame()
        }
    }, [movePiece, mergePiece, clearLines, spawnPiece])

    const endGame = useCallback(() => {
        const game = gameRef.current
        cancelAnimationFrame(game.animationId)

        if (score > highScore) {
            setHighScore(score)
            localStorage.setItem('tetrisHighScore', score.toString())
        }
        setGameState('gameover')
    }, [score, highScore])

    const drawGame = useCallback((ctx: CanvasRenderingContext2D) => {
        const game = gameRef.current
        const width = BOARD_WIDTH * CELL_SIZE
        const height = BOARD_HEIGHT * CELL_SIZE

        // Clear
        ctx.fillStyle = '#0a0a0f'
        ctx.fillRect(0, 0, width + 150, height)

        // Draw board background
        ctx.fillStyle = '#0f172a'
        ctx.fillRect(0, 0, width, height)

        // Draw grid
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)'
        ctx.lineWidth = 1
        for (let x = 0; x <= BOARD_WIDTH; x++) {
            ctx.beginPath()
            ctx.moveTo(x * CELL_SIZE, 0)
            ctx.lineTo(x * CELL_SIZE, height)
            ctx.stroke()
        }
        for (let y = 0; y <= BOARD_HEIGHT; y++) {
            ctx.beginPath()
            ctx.moveTo(0, y * CELL_SIZE)
            ctx.lineTo(width, y * CELL_SIZE)
            ctx.stroke()
        }

        // Draw placed blocks
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                if (game.board[y][x]) {
                    drawBlock(ctx, x * CELL_SIZE, y * CELL_SIZE, game.board[y][x]!)
                }
            }
        }

        // Draw ghost piece
        if (game.currentPiece) {
            const ghostPiece = { ...game.currentPiece }
            while (isValidPosition({ ...ghostPiece, y: ghostPiece.y + 1 }, game.board)) {
                ghostPiece.y++
            }
            ctx.globalAlpha = 0.3
            for (let y = 0; y < ghostPiece.shape.length; y++) {
                for (let x = 0; x < ghostPiece.shape[y].length; x++) {
                    if (ghostPiece.shape[y][x]) {
                        drawBlock(ctx, (ghostPiece.x + x) * CELL_SIZE, (ghostPiece.y + y) * CELL_SIZE, ghostPiece.color)
                    }
                }
            }
            ctx.globalAlpha = 1

            // Draw current piece
            for (let y = 0; y < game.currentPiece.shape.length; y++) {
                for (let x = 0; x < game.currentPiece.shape[y].length; x++) {
                    if (game.currentPiece.shape[y][x]) {
                        drawBlock(ctx, (game.currentPiece.x + x) * CELL_SIZE, (game.currentPiece.y + y) * CELL_SIZE, game.currentPiece.color)
                    }
                }
            }
        }

        // Draw next piece preview
        ctx.fillStyle = '#1e293b'
        ctx.fillRect(width + 10, 10, 130, 100)
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)'
        ctx.strokeRect(width + 10, 10, 130, 100)
        ctx.fillStyle = '#94a3b8'
        ctx.font = '12px Rajdhani'
        ctx.fillText('NEXT', width + 60, 30)

        const nextTetromino = TETROMINOES[game.nextPiece]
        const offsetX = width + 45
        const offsetY = 50
        for (let y = 0; y < nextTetromino.shape.length; y++) {
            for (let x = 0; x < nextTetromino.shape[y].length; x++) {
                if (nextTetromino.shape[y][x]) {
                    drawBlock(ctx, offsetX + x * 20, offsetY + y * 20, nextTetromino.color, 18)
                }
            }
        }

        // Border glow
        ctx.shadowBlur = 15
        ctx.shadowColor = '#00f260'
        ctx.strokeStyle = '#00f260'
        ctx.lineWidth = 2
        ctx.strokeRect(1, 1, width - 2, height - 2)
        ctx.shadowBlur = 0
    }, [])

    const drawBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size: number = CELL_SIZE - 2) => {
        ctx.fillStyle = color
        ctx.shadowBlur = 8
        ctx.shadowColor = color
        ctx.fillRect(x + 1, y + 1, size, size)

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.fillRect(x + 1, y + 1, size, 3)
        ctx.fillRect(x + 1, y + 1, 3, size)

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
        ctx.fillRect(x + size - 2, y + 1, 3, size)
        ctx.fillRect(x + 1, y + size - 2, size, 3)

        ctx.shadowBlur = 0
    }

    const gameLoop = useCallback((time: number) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const game = gameRef.current
        const dt = time - game.lastTime
        game.lastTime = time

        // Handle key repeats for smooth movement
        const repeatDelay = 150
        const repeatRate = 50

        if (game.keys['arrowleft'] || game.keys['a']) {
            if (!game.keyRepeat['left'] || time - game.keyRepeat['left'] > repeatRate) {
                if (!game.keyRepeat['left']) game.keyRepeat['left'] = time + repeatDelay - repeatRate
                else game.keyRepeat['left'] = time
                movePiece(-1, 0)
            }
        } else {
            game.keyRepeat['left'] = 0
        }

        if (game.keys['arrowright'] || game.keys['d']) {
            if (!game.keyRepeat['right'] || time - game.keyRepeat['right'] > repeatRate) {
                if (!game.keyRepeat['right']) game.keyRepeat['right'] = time + repeatDelay - repeatRate
                else game.keyRepeat['right'] = time
                movePiece(1, 0)
            }
        } else {
            game.keyRepeat['right'] = 0
        }

        if (game.keys['arrowdown'] || game.keys['s']) {
            if (!game.keyRepeat['down'] || time - game.keyRepeat['down'] > 30) {
                game.keyRepeat['down'] = time
                if (movePiece(0, 1)) {
                    setScore(prev => prev + 1)
                }
            }
        } else {
            game.keyRepeat['down'] = 0
        }

        // Auto drop
        game.dropCounter += dt
        if (game.dropCounter > game.dropInterval) {
            game.dropCounter = 0
            if (!movePiece(0, 1)) {
                mergePiece()
                clearLines()
                if (!spawnPiece()) {
                    endGame()
                    return
                }
            }
        }

        drawGame(ctx)
        game.animationId = requestAnimationFrame(gameLoop)
    }, [movePiece, mergePiece, clearLines, spawnPiece, drawGame, endGame])

    const startGame = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        canvas.width = BOARD_WIDTH * CELL_SIZE + 150
        canvas.height = BOARD_HEIGHT * CELL_SIZE

        const game = gameRef.current
        game.board = createBoard()
        game.nextPiece = randomTetromino()
        game.dropCounter = 0
        game.dropInterval = 1000
        game.lastTime = performance.now()

        setScore(0)
        setLevel(1)
        setLines(0)
        spawnPiece()
        setGameState('playing')
        game.animationId = requestAnimationFrame(gameLoop)
    }, [spawnPiece, gameLoop])

    // Keyboard handlers
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase()
            gameRef.current.keys[key] = true

            if (gameState === 'playing') {
                if (key === 'arrowup' || key === 'w') {
                    e.preventDefault()
                    rotatePiece()
                }
                if (key === ' ') {
                    e.preventDefault()
                    hardDrop()
                }
                if (key === 'escape' || key === 'p') {
                    cancelAnimationFrame(gameRef.current.animationId)
                    setGameState('paused')
                }
                if (['arrowleft', 'arrowright', 'arrowdown', 'a', 's', 'd'].includes(key)) {
                    e.preventDefault()
                }
            }

            if (gameState === 'paused' && (key === 'escape' || key === 'p')) {
                setGameState('playing')
                gameRef.current.lastTime = performance.now()
                gameRef.current.animationId = requestAnimationFrame(gameLoop)
            }
        }

        const handleKeyUp = (e: KeyboardEvent) => {
            gameRef.current.keys[e.key.toLowerCase()] = false
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
            cancelAnimationFrame(gameRef.current.animationId)
        }
    }, [gameState, rotatePiece, hardDrop, gameLoop])

    return (
        <div className="tetris-container">
            {/* Stats */}
            <div className="stats-panel">
                <div className="stat-card">
                    <label>Score</label>
                    <div className="value">{score.toLocaleString()}</div>
                </div>
                <div className="stat-card">
                    <label>Level</label>
                    <div className="value">{level}</div>
                </div>
                <div className="stat-card">
                    <label>Lines</label>
                    <div className="value">{lines}</div>
                </div>
                <div className="stat-card">
                    <label>High Score</label>
                    <div className="value best">{highScore.toLocaleString()}</div>
                </div>
            </div>

            {/* Game area */}
            <div className="game-area">
                <div className="game-brand">
                    <h1>Cyber Tetris</h1>
                    <span>BLOCK STACKER</span>
                </div>

                <canvas ref={canvasRef} className="game-canvas" />

                {/* Overlays */}
                {gameState === 'menu' && (
                    <div className="overlay">
                        <h2>CYBER TETRIS</h2>
                        <p>Stack blocks. Clear lines. Chase perfection.</p>
                        <div className="key-hint">
                            <div className="keys">
                                <span className="k-box">←</span><span className="k-box">→</span> Move
                                <span className="k-box">↑</span> Rotate
                                <span className="k-box">↓</span> Soft Drop
                                <span className="k-box">Space</span> Hard Drop
                            </div>
                        </div>
                        <button className="btn-start" onClick={startGame}>START GAME</button>
                    </div>
                )}

                {gameState === 'paused' && (
                    <div className="overlay">
                        <h2>PAUSED</h2>
                        <p>Press ESC or P to resume</p>
                        <button className="btn-start" onClick={() => {
                            setGameState('playing')
                            gameRef.current.lastTime = performance.now()
                            gameRef.current.animationId = requestAnimationFrame(gameLoop)
                        }}>RESUME</button>
                    </div>
                )}

                {gameState === 'gameover' && (
                    <div className="overlay">
                        <h2>GAME OVER</h2>
                        <p>Score: {score.toLocaleString()}</p>
                        {score >= highScore && score > 0 && <p className="new-record">🎉 NEW HIGH SCORE!</p>}
                        <button className="btn-start" onClick={startGame}>PLAY AGAIN</button>
                    </div>
                )}
            </div>

            <style>{`
        .tetris-container {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          gap: 40px;
          padding: 40px;
          min-height: 100vh;
          background: radial-gradient(circle at 50% 50%, #1e293b 0%, #000 100%);
        }
        
        .stats-panel {
          display: flex;
          flex-direction: column;
          gap: 15px;
          min-width: 150px;
        }
        
        .stat-card {
          background: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(12px);
          padding: 15px 20px;
          border-radius: 12px;
          text-align: center;
        }
        
        .stat-card label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #94a3b8;
        }
        
        .stat-card .value {
          font-family: 'Rajdhani', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #00f260;
          text-shadow: 0 0 10px rgba(0, 242, 96, 0.3);
        }
        
        .stat-card .value.best {
          color: #fbbf24;
          text-shadow: 0 0 10px rgba(251, 191, 36, 0.3);
        }
        
        .game-area {
          position: relative;
        }
        
        .game-brand {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .game-brand h1 {
          margin: 0;
          font-family: 'Rajdhani', sans-serif;
          font-weight: 700;
          font-size: 28px;
          text-transform: uppercase;
          letter-spacing: 2px;
          background: linear-gradient(90deg, #00f260, #0575e6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 15px rgba(0, 242, 96, 0.4));
        }
        
        .game-brand span {
          font-size: 12px;
          color: #64748b;
          letter-spacing: 1px;
        }
        
        .game-canvas {
          display: block;
          border-radius: 4px;
        }
        
        .overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(10, 10, 12, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px);
          padding: 40px;
          border-radius: 24px;
          text-align: center;
          min-width: 300px;
          z-index: 100;
        }
        
        .overlay h2 {
          margin: 0 0 15px;
          font-family: 'Rajdhani', sans-serif;
          font-size: 28px;
          color: #00f260;
        }
        
        .overlay p {
          color: #94a3b8;
          margin: 0 0 20px;
          font-size: 14px;
        }
        
        .new-record {
          color: #fbbf24 !important;
          font-weight: 700;
        }
        
        .key-hint {
          margin-bottom: 25px;
        }
        
        .keys {
          display: flex;
          gap: 8px;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          font-size: 12px;
          color: #94a3b8;
        }
        
        .k-box {
          background: #334155;
          padding: 4px 8px;
          border-radius: 4px;
          border-bottom: 2px solid #1e293b;
          font-family: monospace;
          color: #cbd5e1;
        }
        
        .btn-start {
          background: linear-gradient(135deg, #00f260, #00c853);
          border: none;
          padding: 14px 35px;
          border-radius: 50px;
          color: #000;
          font-weight: 700;
          font-family: 'Rajdhani', sans-serif;
          font-size: 18px;
          text-transform: uppercase;
          letter-spacing: 2px;
          cursor: pointer;
          box-shadow: 0 10px 20px rgba(0, 242, 96, 0.3);
          transition: all 0.2s;
        }
        
        .btn-start:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(0, 242, 96, 0.4);
        }
      `}</style>
        </div>
    )
}
