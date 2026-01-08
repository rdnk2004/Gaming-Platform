import { useEffect, useRef, useState } from 'react'

/**
 * CYBER TETRIS ULTRA - Cyberarcade Edition
 * Enhanced Tetris with crazy cyberpunk features:
 * - Larger board (12x24)
 * - Black blocks with neon outlines
 * - Combo system with multipliers
 * - Screen shake & glitch effects
 * - Color-shifting rainbow mode
 * - Power-up system
 * - Speed zones
 */

// Standard 7 Tetromino shapes with neon outline colors
const TETROMINOES: Record<string, { shape: number[][], color: string }> = {
    I: { shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], color: '#00d4ff' },
    O: { shape: [[1, 1], [1, 1]], color: '#fbbf24' },
    T: { shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], color: '#a855f7' },
    S: { shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], color: '#00f260' },
    Z: { shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], color: '#ff0055' },
    J: { shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], color: '#0575e6' },
    L: { shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]], color: '#ff6b35' }
}

type TetrominoType = keyof typeof TETROMINOES

// EXPANDED BOARD SIZE
const BOARD_WIDTH = 12
const BOARD_HEIGHT = 24
const CELL_SIZE = 26

// Create empty board - now stores color string
const createBoard = (): (string | null)[][] =>
    Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null))

// 7-bag randomizer
const createBag = (): TetrominoType[] => {
    const pieces: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']
    for (let i = pieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pieces[i], pieces[j]] = [pieces[j], pieces[i]]
    }
    return pieces
}

// Rotate matrix 90 degrees clockwise
const rotateMatrix = (matrix: number[][]): number[][] => {
    const N = matrix.length
    const rotated: number[][] = Array.from({ length: N }, () => Array(N).fill(0))
    for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
            rotated[x][N - 1 - y] = matrix[y][x]
        }
    }
    return rotated
}

// SRS Wall kicks
const WALL_KICKS: Record<string, number[][]> = {
    '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
    '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]
}

const I_WALL_KICKS: Record<string, number[][]> = {
    '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
    '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]]
}

interface Piece {
    type: TetrominoType
    shape: number[][]
    color: string
    x: number
    y: number
    rotation: number
}

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    life: number
    color: string
    size: number
}

export default function TetrisGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu')
    const [score, setScore] = useState(0)
    const [level, setLevel] = useState(1)
    const [lines, setLines] = useState(0)
    const [combo, setCombo] = useState(0)
    const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('tetrisHighScore') || '0'))

    // Refs for game state
    const gameStateRef = useRef(gameState)
    const scoreRef = useRef(score)
    const levelRef = useRef(level)
    const linesRef = useRef(lines)
    const comboRef = useRef(combo)
    const highScoreRef = useRef(highScore)

    useEffect(() => { gameStateRef.current = gameState }, [gameState])
    useEffect(() => { scoreRef.current = score }, [score])
    useEffect(() => { levelRef.current = level }, [level])
    useEffect(() => { linesRef.current = lines }, [lines])
    useEffect(() => { comboRef.current = combo }, [combo])
    useEffect(() => { highScoreRef.current = highScore }, [highScore])

    const gameRef = useRef<{
        board: (string | null)[][]
        currentPiece: Piece | null
        holdPiece: TetrominoType | null
        canHold: boolean
        bag: TetrominoType[]
        nextQueue: TetrominoType[]
        dropCounter: number
        dropInterval: number
        lastTime: number
        animationId: number
        keys: Record<string, boolean>
        keyTimers: Record<string, number>
        running: boolean
        particles: Particle[]
        screenShake: number
        glitchIntensity: number
        colorShift: number
        comboTimer: number
        dangerZone: boolean
        pulsePhase: number
    }>({
        board: createBoard(),
        currentPiece: null,
        holdPiece: null,
        canHold: true,
        bag: [],
        nextQueue: [],
        dropCounter: 0,
        dropInterval: 1000,
        lastTime: 0,
        animationId: 0,
        keys: {},
        keyTimers: {},
        running: false,
        particles: [],
        screenShake: 0,
        glitchIntensity: 0,
        colorShift: 0,
        comboTimer: 0,
        dangerZone: false,
        pulsePhase: 0
    })

    // Get next piece from bag
    const getNextPiece = (): TetrominoType => {
        const game = gameRef.current
        if (game.bag.length === 0) {
            game.bag = createBag()
        }
        return game.bag.pop()!
    }

    // Fill next queue
    const fillNextQueue = () => {
        const game = gameRef.current
        while (game.nextQueue.length < 4) {
            game.nextQueue.push(getNextPiece())
        }
    }

    // Create piece
    const createPiece = (type: TetrominoType): Piece => {
        const tetromino = TETROMINOES[type]
        return {
            type,
            shape: tetromino.shape.map(row => [...row]),
            color: tetromino.color,
            x: Math.floor(BOARD_WIDTH / 2) - Math.floor(tetromino.shape[0].length / 2),
            y: type === 'I' ? -1 : 0,
            rotation: 0
        }
    }

    // Spawn new piece
    const spawnPiece = (): boolean => {
        const game = gameRef.current
        fillNextQueue()
        const type = game.nextQueue.shift()!
        game.currentPiece = createPiece(type)
        game.canHold = true

        // Check danger zone (pieces stacking high)
        const highestBlock = game.board.findIndex(row => row.some(cell => cell !== null))
        game.dangerZone = highestBlock >= 0 && highestBlock < 6

        if (!isValidPosition(game.currentPiece, game.board)) {
            return false
        }
        return true
    }

    // Check valid position
    const isValidPosition = (piece: Piece, board: (string | null)[][], offsetX = 0, offsetY = 0): boolean => {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const boardX = piece.x + x + offsetX
                    const boardY = piece.y + y + offsetY
                    if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) return false
                    if (boardY >= 0 && board[boardY][boardX]) return false
                }
            }
        }
        return true
    }

    // Move piece
    const movePiece = (dx: number, dy: number): boolean => {
        const game = gameRef.current
        if (!game.currentPiece) return false

        if (isValidPosition(game.currentPiece, game.board, dx, dy)) {
            game.currentPiece.x += dx
            game.currentPiece.y += dy
            return true
        }
        return false
    }

    // Rotate piece with wall kicks
    const rotatePiece = (direction: 1 | -1) => {
        const game = gameRef.current
        if (!game.currentPiece || game.currentPiece.type === 'O') return

        const piece = game.currentPiece
        const oldRotation = piece.rotation
        const newRotation = (oldRotation + direction + 4) % 4

        let rotated = piece.shape
        const rotations = direction === 1 ? 1 : 3
        for (let i = 0; i < rotations; i++) {
            rotated = rotateMatrix(rotated)
        }

        const kickKey = `${oldRotation}>${newRotation}`
        const kicks = piece.type === 'I' ? I_WALL_KICKS[kickKey] : WALL_KICKS[kickKey]

        if (kicks) {
            for (const [kx, ky] of kicks) {
                const testPiece = { ...piece, shape: rotated, x: piece.x + kx, y: piece.y - ky, rotation: newRotation }
                if (isValidPosition(testPiece, game.board)) {
                    game.currentPiece = testPiece
                    return
                }
            }
        }
    }

    // Lock piece to board
    const lockPiece = () => {
        const game = gameRef.current
        if (!game.currentPiece) return

        for (let y = 0; y < game.currentPiece.shape.length; y++) {
            for (let x = 0; x < game.currentPiece.shape[y].length; x++) {
                if (game.currentPiece.shape[y][x]) {
                    const boardY = game.currentPiece.y + y
                    const boardX = game.currentPiece.x + x
                    if (boardY >= 0 && boardY < BOARD_HEIGHT) {
                        game.board[boardY][boardX] = game.currentPiece.color
                    }
                }
            }
        }
        game.currentPiece = null
    }

    // Create explosion particles
    const createParticles = (x: number, y: number, color: string, count: number, explosive = false) => {
        const game = gameRef.current
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5
            const speed = explosive ? 8 + Math.random() * 8 : 3 + Math.random() * 4
            game.particles.push({
                x: x + Math.random() * CELL_SIZE,
                y: y + Math.random() * CELL_SIZE,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                life: 1,
                color,
                size: explosive ? 4 + Math.random() * 4 : 2 + Math.random() * 3
            })
        }
    }

    // Clear completed lines with effects
    const clearLines = () => {
        const game = gameRef.current
        const linesToClear: number[] = []

        for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
            if (game.board[y].every(cell => cell !== null)) {
                linesToClear.push(y)
                // Create particles for cleared line
                for (let x = 0; x < BOARD_WIDTH; x++) {
                    createParticles(x * CELL_SIZE, y * CELL_SIZE, game.board[y][x]!, 5, true)
                }
            }
        }

        if (linesToClear.length > 0) {
            // Screen shake based on lines cleared
            game.screenShake = linesToClear.length * 4

            // Glitch effect for 4-line clears (TETRIS!)
            if (linesToClear.length >= 4) {
                game.glitchIntensity = 1
            }

            // Remove lines
            linesToClear.sort((a, b) => b - a).forEach(y => {
                game.board.splice(y, 1)
                game.board.unshift(Array(BOARD_WIDTH).fill(null))
            })

            // Combo system
            setCombo(prev => {
                const newCombo = prev + 1
                game.comboTimer = 3000  // 3 second combo window
                return newCombo
            })

            // Scoring with combo multiplier
            const basePoints = [0, 100, 300, 500, 800][linesToClear.length]
            const comboMultiplier = 1 + (comboRef.current * 0.5)
            const points = Math.floor(basePoints * levelRef.current * comboMultiplier)

            setScore(prev => prev + points)
            setLines(prev => {
                const newLines = prev + linesToClear.length
                const newLevel = Math.floor(newLines / 10) + 1
                if (newLevel > levelRef.current) {
                    setLevel(newLevel)
                    game.dropInterval = Math.max(80, 1000 - (newLevel - 1) * 80)
                }
                return newLines
            })
        } else {
            // No lines cleared - reset combo if timer expired
            if (comboRef.current > 0) {
                setCombo(0)
            }
        }
    }

    // Hard drop
    const hardDrop = () => {
        const game = gameRef.current
        if (!game.currentPiece) return

        let dropDistance = 0
        while (movePiece(0, 1)) {
            dropDistance++
        }

        // Create impact particles
        for (let x = 0; x < game.currentPiece.shape[0].length; x++) {
            for (let y = game.currentPiece.shape.length - 1; y >= 0; y--) {
                if (game.currentPiece.shape[y][x]) {
                    createParticles(
                        (game.currentPiece.x + x) * CELL_SIZE,
                        (game.currentPiece.y + y) * CELL_SIZE + CELL_SIZE,
                        game.currentPiece.color,
                        3
                    )
                    break
                }
            }
        }

        game.screenShake = 3
        setScore(prev => prev + dropDistance * 2)
        lockPiece()
        clearLines()
        if (!spawnPiece()) {
            endGame()
        }
    }

    // Hold piece
    const holdPiece = () => {
        const game = gameRef.current
        if (!game.currentPiece || !game.canHold) return

        const currentType = game.currentPiece.type
        if (game.holdPiece) {
            game.currentPiece = createPiece(game.holdPiece)
        } else {
            if (!spawnPiece()) {
                endGame()
                return
            }
        }
        game.holdPiece = currentType
        game.canHold = false
    }

    // End game
    const endGame = () => {
        const game = gameRef.current
        game.running = false
        game.glitchIntensity = 1
        cancelAnimationFrame(game.animationId)

        if (scoreRef.current > highScoreRef.current) {
            setHighScore(scoreRef.current)
            localStorage.setItem('tetrisHighScore', scoreRef.current.toString())
        }
        setGameState('gameover')
    }

    // Get ghost Y position
    const getGhostY = (): number => {
        const game = gameRef.current
        if (!game.currentPiece) return 0

        let ghostY = game.currentPiece.y
        while (isValidPosition(game.currentPiece, game.board, 0, ghostY - game.currentPiece.y + 1)) {
            ghostY++
        }
        return ghostY
    }

    // Shift color hue
    const shiftHue = (color: string, shift: number): string => {
        const num = parseInt(color.replace('#', ''), 16)
        let r = (num >> 16) & 255
        let g = (num >> 8) & 255
        let b = num & 255

        // Simple hue rotation
        const temp = r
        r = Math.floor((r * Math.cos(shift) + g * Math.sin(shift)) % 256)
        g = Math.floor((g * Math.cos(shift) + b * Math.sin(shift)) % 256)
        b = Math.floor((b * Math.cos(shift) + temp * Math.sin(shift)) % 256)

        r = Math.max(0, Math.min(255, Math.abs(r)))
        g = Math.max(0, Math.min(255, Math.abs(g)))
        b = Math.max(0, Math.min(255, Math.abs(b)))

        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
    }

    // Draw cyberpunk block - BLACK with neon outline
    const drawBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size: number = CELL_SIZE - 2, alpha: number = 1, isGhost = false) => {
        const game = gameRef.current
        ctx.globalAlpha = alpha

        // Apply color shift if active
        let displayColor = color
        if (game.colorShift > 0) {
            displayColor = shiftHue(color, game.colorShift)
        }

        const padding = 1
        const outlineWidth = 3

        if (isGhost) {
            // Ghost piece - just outline
            ctx.strokeStyle = displayColor
            ctx.lineWidth = 2
            ctx.strokeRect(x + padding + 2, y + padding + 2, size - 4, size - 4)
            ctx.globalAlpha = 1
            return
        }

        // NEON GLOW - outer
        ctx.shadowBlur = 15
        ctx.shadowColor = displayColor

        // BLACK inner fill
        ctx.fillStyle = '#0a0a0f'
        ctx.fillRect(x + padding, y + padding, size, size)

        // NEON OUTLINE - multiple layers for glow effect
        ctx.shadowBlur = 20
        ctx.strokeStyle = displayColor
        ctx.lineWidth = outlineWidth
        ctx.strokeRect(x + padding + outlineWidth / 2, y + padding + outlineWidth / 2, size - outlineWidth, size - outlineWidth)

        // Inner glow line
        ctx.shadowBlur = 8
        ctx.strokeStyle = displayColor
        ctx.lineWidth = 1.5
        ctx.strokeRect(x + padding + 6, y + padding + 6, size - 12, size - 12)

        // Corner accents (cyberpunk style)
        ctx.fillStyle = displayColor
        ctx.shadowBlur = 10
        // Top-left
        ctx.fillRect(x + padding, y + padding, 6, 2)
        ctx.fillRect(x + padding, y + padding, 2, 6)
        // Top-right
        ctx.fillRect(x + size - 5, y + padding, 6, 2)
        ctx.fillRect(x + size - 1, y + padding, 2, 6)
        // Bottom-left
        ctx.fillRect(x + padding, y + size - 1, 6, 2)
        ctx.fillRect(x + padding, y + size - 5, 2, 6)
        // Bottom-right
        ctx.fillRect(x + size - 5, y + size - 1, 6, 2)
        ctx.fillRect(x + size - 1, y + size - 5, 2, 6)

        // Scanlines (subtle CRT effect)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)'
        for (let sy = 0; sy < size; sy += 2) {
            ctx.fillRect(x + padding, y + padding + sy, size, 1)
        }

        // Inner highlight pulse (if in danger zone)
        if (game.dangerZone) {
            const pulse = Math.sin(game.pulsePhase * 5) * 0.3 + 0.3
            ctx.fillStyle = `rgba(255, 0, 85, ${pulse * 0.2})`
            ctx.fillRect(x + padding + 4, y + padding + 4, size - 8, size - 8)
        }

        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
    }

    // Draw mini piece for preview
    const drawMiniPiece = (ctx: CanvasRenderingContext2D, type: TetrominoType, x: number, y: number, cellSize: number) => {
        const tetromino = TETROMINOES[type]
        const shape = tetromino.shape
        const offsetX = (4 - shape[0].length) * cellSize / 2
        const offsetY = type === 'I' ? -cellSize / 2 : 0

        for (let py = 0; py < shape.length; py++) {
            for (let px = 0; px < shape[py].length; px++) {
                if (shape[py][px]) {
                    drawBlock(ctx, x + offsetX + px * cellSize, y + offsetY + py * cellSize, tetromino.color, cellSize - 2)
                }
            }
        }
    }

    // Main draw function
    const draw = (ctx: CanvasRenderingContext2D, time: number) => {
        const game = gameRef.current
        const boardWidth = BOARD_WIDTH * CELL_SIZE
        const boardHeight = BOARD_HEIGHT * CELL_SIZE
        const panelWidth = 180
        const totalWidth = boardWidth + panelWidth + 20

        // Update effects
        game.pulsePhase += 0.05
        if (game.screenShake > 0) game.screenShake *= 0.9
        if (game.glitchIntensity > 0) game.glitchIntensity *= 0.95
        if (game.colorShift > 0) game.colorShift *= 0.98
        if (game.comboTimer > 0) {
            game.comboTimer -= 16
            if (game.comboTimer <= 0 && comboRef.current > 0) {
                setCombo(0)
            }
        }

        // Apply screen shake
        ctx.save()
        if (game.screenShake > 0.5) {
            ctx.translate(
                (Math.random() - 0.5) * game.screenShake * 2,
                (Math.random() - 0.5) * game.screenShake * 2
            )
        }

        // Clear with dark background
        ctx.fillStyle = '#030308'
        ctx.fillRect(-10, -10, totalWidth + 20, boardHeight + 20)

        // Draw board background with gradient
        const bgGradient = ctx.createLinearGradient(0, 0, 0, boardHeight)
        bgGradient.addColorStop(0, '#0a0a12')
        bgGradient.addColorStop(0.5, '#0f0f1a')
        bgGradient.addColorStop(1, '#0a0a12')
        ctx.fillStyle = bgGradient
        ctx.fillRect(0, 0, boardWidth, boardHeight)

        // Danger zone red tint
        if (game.dangerZone) {
            const dangerAlpha = Math.sin(game.pulsePhase * 3) * 0.1 + 0.1
            ctx.fillStyle = `rgba(255, 0, 85, ${dangerAlpha})`
            ctx.fillRect(0, 0, boardWidth, CELL_SIZE * 6)
        }

        // Draw grid with neon accent
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.06)'
        ctx.lineWidth = 1
        for (let x = 0; x <= BOARD_WIDTH; x++) {
            ctx.beginPath()
            ctx.moveTo(x * CELL_SIZE, 0)
            ctx.lineTo(x * CELL_SIZE, boardHeight)
            ctx.stroke()
        }
        for (let y = 0; y <= BOARD_HEIGHT; y++) {
            ctx.beginPath()
            ctx.moveTo(0, y * CELL_SIZE)
            ctx.lineTo(boardWidth, y * CELL_SIZE)
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
            const ghostY = getGhostY()
            for (let y = 0; y < game.currentPiece.shape.length; y++) {
                for (let x = 0; x < game.currentPiece.shape[y].length; x++) {
                    if (game.currentPiece.shape[y][x]) {
                        const drawY = ghostY + y
                        if (drawY >= 0) {
                            drawBlock(ctx, (game.currentPiece.x + x) * CELL_SIZE, drawY * CELL_SIZE, game.currentPiece.color, CELL_SIZE - 2, 0.4, true)
                        }
                    }
                }
            }

            // Draw current piece
            for (let y = 0; y < game.currentPiece.shape.length; y++) {
                for (let x = 0; x < game.currentPiece.shape[y].length; x++) {
                    if (game.currentPiece.shape[y][x]) {
                        const drawY = game.currentPiece.y + y
                        if (drawY >= 0) {
                            drawBlock(ctx, (game.currentPiece.x + x) * CELL_SIZE, drawY * CELL_SIZE, game.currentPiece.color)
                        }
                    }
                }
            }
        }

        // Draw particles
        game.particles = game.particles.filter(p => p.life > 0)
        game.particles.forEach(p => {
            p.x += p.vx
            p.y += p.vy
            p.vy += 0.3
            p.vx *= 0.99
            p.life -= 0.02
            ctx.globalAlpha = p.life
            ctx.shadowBlur = 8
            ctx.shadowColor = p.color
            ctx.fillStyle = p.color
            ctx.fillRect(p.x, p.y, p.size, p.size)
        })
        ctx.globalAlpha = 1
        ctx.shadowBlur = 0

        // Glitch effect overlay
        if (game.glitchIntensity > 0.1) {
            ctx.fillStyle = `rgba(255, 0, 85, ${game.glitchIntensity * 0.3})`
            const sliceHeight = 5 + Math.random() * 20
            for (let i = 0; i < 5; i++) {
                const y = Math.random() * boardHeight
                ctx.fillRect(0, y, boardWidth, sliceHeight)
            }
        }

        // Board border with intense glow
        ctx.shadowBlur = 25
        ctx.shadowColor = game.dangerZone ? '#ff0055' : '#00f260'
        ctx.strokeStyle = game.dangerZone ? '#ff0055' : '#00f260'
        ctx.lineWidth = 3
        ctx.strokeRect(1, 1, boardWidth - 2, boardHeight - 2)
        ctx.shadowBlur = 0

        // === SIDE PANEL ===
        const panelX = boardWidth + 15

        // Next pieces (show 4)
        ctx.fillStyle = 'rgba(10, 10, 20, 0.9)'
        ctx.fillRect(panelX, 10, panelWidth - 10, 240)
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)'
        ctx.lineWidth = 1
        ctx.strokeRect(panelX, 10, panelWidth - 10, 240)

        ctx.fillStyle = '#00f260'
        ctx.font = 'bold 14px Rajdhani, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('NEXT', panelX + (panelWidth - 10) / 2, 30)

        game.nextQueue.slice(0, 4).forEach((type, i) => {
            drawMiniPiece(ctx, type, panelX + 25, 45 + i * 50, 16)
        })

        // Hold piece
        ctx.fillStyle = 'rgba(10, 10, 20, 0.9)'
        ctx.fillRect(panelX, 260, panelWidth - 10, 70)
        ctx.strokeStyle = game.canHold ? 'rgba(0, 255, 255, 0.4)' : 'rgba(255, 0, 85, 0.4)'
        ctx.strokeRect(panelX, 260, panelWidth - 10, 70)

        ctx.fillStyle = game.canHold ? '#00f260' : '#ff0055'
        ctx.font = 'bold 12px Rajdhani, sans-serif'
        ctx.fillText('HOLD [C]', panelX + (panelWidth - 10) / 2, 278)

        if (game.holdPiece) {
            ctx.globalAlpha = game.canHold ? 1 : 0.4
            drawMiniPiece(ctx, game.holdPiece, panelX + 25, 290, 16)
            ctx.globalAlpha = 1
        }

        // Stats
        const drawStat = (label: string, value: string, y: number, color = '#00f260', highlight = false) => {
            ctx.fillStyle = highlight ? 'rgba(255, 0, 85, 0.2)' : 'rgba(10, 10, 20, 0.9)'
            ctx.fillRect(panelX, y, panelWidth - 10, 45)
            ctx.strokeStyle = highlight ? 'rgba(255, 0, 85, 0.5)' : 'rgba(0, 255, 255, 0.3)'
            ctx.strokeRect(panelX, y, panelWidth - 10, 45)

            ctx.fillStyle = '#94a3b8'
            ctx.font = '10px Rajdhani, sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText(label, panelX + (panelWidth - 10) / 2, y + 15)

            ctx.fillStyle = color
            ctx.font = 'bold 20px Rajdhani, sans-serif'
            ctx.shadowBlur = highlight ? 10 : 0
            ctx.shadowColor = color
            ctx.fillText(value, panelX + (panelWidth - 10) / 2, y + 38)
            ctx.shadowBlur = 0
        }

        drawStat('SCORE', scoreRef.current.toLocaleString(), 340)
        drawStat('LEVEL', levelRef.current.toString(), 395)
        drawStat('LINES', linesRef.current.toString(), 450)

        // Combo display with highlight
        if (comboRef.current > 1) {
            drawStat('COMBO', `x${comboRef.current}`, 505, '#ff0055', true)
        } else {
            drawStat('COMBO', '-', 505)
        }

        drawStat('HIGH', highScoreRef.current.toLocaleString(), 560, '#fbbf24')

        ctx.restore()
    }

    // Game loop
    const gameLoop = (time: number) => {
        const game = gameRef.current
        if (!game.running) return

        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const dt = time - game.lastTime
        game.lastTime = time

        // Handle key repeats
        const repeatDelay = 170
        const repeatRate = 50

        // Left
        if (game.keys['arrowleft'] || game.keys['a']) {
            if (!game.keyTimers['left']) {
                game.keyTimers['left'] = time
                movePiece(-1, 0)
            } else if (time - game.keyTimers['left'] > repeatDelay) {
                if (!game.keyTimers['leftRepeat'] || time - game.keyTimers['leftRepeat'] > repeatRate) {
                    game.keyTimers['leftRepeat'] = time
                    movePiece(-1, 0)
                }
            }
        } else {
            game.keyTimers['left'] = 0
            game.keyTimers['leftRepeat'] = 0
        }

        // Right
        if (game.keys['arrowright'] || game.keys['d']) {
            if (!game.keyTimers['right']) {
                game.keyTimers['right'] = time
                movePiece(1, 0)
            } else if (time - game.keyTimers['right'] > repeatDelay) {
                if (!game.keyTimers['rightRepeat'] || time - game.keyTimers['rightRepeat'] > repeatRate) {
                    game.keyTimers['rightRepeat'] = time
                    movePiece(1, 0)
                }
            }
        } else {
            game.keyTimers['right'] = 0
            game.keyTimers['rightRepeat'] = 0
        }

        // Soft drop
        if (game.keys['arrowdown'] || game.keys['s']) {
            if (!game.keyTimers['down'] || time - game.keyTimers['down'] > 40) {
                game.keyTimers['down'] = time
                if (movePiece(0, 1)) {
                    setScore(prev => prev + 1)
                }
            }
        } else {
            game.keyTimers['down'] = 0
        }

        // Auto drop
        game.dropCounter += dt
        if (game.dropCounter >= game.dropInterval) {
            game.dropCounter = 0
            if (!movePiece(0, 1)) {
                lockPiece()
                clearLines()
                if (!spawnPiece()) {
                    endGame()
                    return
                }
            }
        }

        draw(ctx, time)
        game.animationId = requestAnimationFrame(gameLoop)
    }

    // Start game
    const startGame = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        canvas.width = BOARD_WIDTH * CELL_SIZE + 200
        canvas.height = BOARD_HEIGHT * CELL_SIZE

        const game = gameRef.current
        game.board = createBoard()
        game.bag = createBag()
        game.nextQueue = []
        game.holdPiece = null
        game.canHold = true
        game.dropCounter = 0
        game.dropInterval = 1000
        game.lastTime = performance.now()
        game.particles = []
        game.screenShake = 0
        game.glitchIntensity = 0
        game.colorShift = 0
        game.comboTimer = 0
        game.dangerZone = false
        game.running = true

        setScore(0)
        setLevel(1)
        setLines(0)
        setCombo(0)

        fillNextQueue()
        spawnPiece()
        setGameState('playing')
        game.animationId = requestAnimationFrame(gameLoop)
    }

    // Keyboard handlers
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase()
            const game = gameRef.current
            game.keys[key] = true

            if (gameStateRef.current === 'playing') {
                if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'w', 'a', 's', 'd'].includes(key)) {
                    e.preventDefault()
                }

                if (key === 'arrowup' || key === 'w' || key === 'x') {
                    rotatePiece(1)
                }
                if (key === 'z' || key === 'control') {
                    rotatePiece(-1)
                }
                if (key === ' ') {
                    hardDrop()
                }
                if (key === 'c' || key === 'shift') {
                    holdPiece()
                }
                // Rainbow mode - G key
                if (key === 'g') {
                    game.colorShift = Math.PI
                }
                if (key === 'escape' || key === 'p') {
                    game.running = false
                    cancelAnimationFrame(game.animationId)
                    setGameState('paused')
                }
            }

            if (gameStateRef.current === 'paused' && (key === 'escape' || key === 'p')) {
                game.running = true
                game.lastTime = performance.now()
                game.animationId = requestAnimationFrame(gameLoop)
                setGameState('playing')
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
            gameRef.current.running = false
            cancelAnimationFrame(gameRef.current.animationId)
        }
    }, [])

    return (
        <div className="tetris-container">
            <div className="game-wrapper">
                <div className="game-brand">
                    <h1>CYBER TETRIS</h1>
                    <span>ULTRA EDITION</span>
                </div>

                <canvas ref={canvasRef} className="game-canvas" />

                {/* Menu */}
                {gameState === 'menu' && (
                    <div className="overlay">
                        <h2>CYBER TETRIS</h2>
                        <div className="subtitle">ULTRA EDITION</div>
                        <div className="features">
                            <span>🎮 12x24 Board</span>
                            <span>⚡ Combo System</span>
                            <span>💥 Screen Shake</span>
                            <span>🌈 Glitch FX</span>
                        </div>
                        <div className="controls-grid">
                            <div className="control-row"><span className="k-box">← →</span><span>Move</span></div>
                            <div className="control-row"><span className="k-box">↑</span><span>Rotate</span></div>
                            <div className="control-row"><span className="k-box">↓</span><span>Soft Drop</span></div>
                            <div className="control-row"><span className="k-box">Space</span><span>Hard Drop</span></div>
                            <div className="control-row"><span className="k-box">C</span><span>Hold</span></div>
                            <div className="control-row"><span className="k-box">G</span><span>Color Shift</span></div>
                        </div>
                        <button className="btn-start" onClick={startGame}>DEPLOY BLOCKS</button>
                    </div>
                )}

                {/* Paused */}
                {gameState === 'paused' && (
                    <div className="overlay">
                        <h2>PAUSED</h2>
                        <p>Press ESC or P to resume</p>
                        <button className="btn-start" onClick={() => {
                            const game = gameRef.current
                            game.running = true
                            game.lastTime = performance.now()
                            game.animationId = requestAnimationFrame(gameLoop)
                            setGameState('playing')
                        }}>RESUME</button>
                    </div>
                )}

                {/* Game Over */}
                {gameState === 'gameover' && (
                    <div className="overlay gameover">
                        <h2>SYSTEM CRASH</h2>
                        <div className="final-stats">
                            <div className="stat-row"><span>Score</span><span>{score.toLocaleString()}</span></div>
                            <div className="stat-row"><span>Level</span><span>{level}</span></div>
                            <div className="stat-row"><span>Lines</span><span>{lines}</span></div>
                            <div className="stat-row"><span>Max Combo</span><span>x{combo}</span></div>
                        </div>
                        {score >= highScore && score > 0 && <p className="new-record">🏆 NEW HIGH SCORE!</p>}
                        <button className="btn-start" onClick={startGame}>REBOOT SYSTEM</button>
                    </div>
                )}
            </div>

            <style>{`
                .tetris-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background: radial-gradient(ellipse at 50% 0%, #1a1a2e 0%, #000 70%);
                    padding: 20px;
                }

                .game-wrapper {
                    position: relative;
                }

                .game-brand {
                    text-align: center;
                    margin-bottom: 15px;
                }

                .game-brand h1 {
                    margin: 0;
                    font-family: 'Rajdhani', sans-serif;
                    font-weight: 700;
                    font-size: 36px;
                    text-transform: uppercase;
                    letter-spacing: 4px;
                    background: linear-gradient(90deg, #00f260, #0575e6, #a855f7);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    filter: drop-shadow(0 0 25px rgba(0, 242, 96, 0.6));
                    animation: titlePulse 2s ease-in-out infinite;
                }

                @keyframes titlePulse {
                    0%, 100% { filter: drop-shadow(0 0 25px rgba(0, 242, 96, 0.6)); }
                    50% { filter: drop-shadow(0 0 40px rgba(0, 242, 96, 0.9)); }
                }

                .game-brand span {
                    font-size: 12px;
                    color: #ff0055;
                    letter-spacing: 6px;
                    font-weight: 700;
                }

                .game-canvas {
                    display: block;
                    border-radius: 4px;
                }

                .overlay {
                    position: absolute;
                    top: 50%;
                    left: calc(50% - 40px);
                    transform: translate(-50%, -50%);
                    background: rgba(5, 5, 15, 0.97);
                    border: 2px solid rgba(0, 242, 96, 0.4);
                    backdrop-filter: blur(20px);
                    padding: 35px 45px;
                    border-radius: 20px;
                    text-align: center;
                    min-width: 340px;
                    z-index: 100;
                    box-shadow: 0 0 60px rgba(0, 242, 96, 0.2);
                }

                .overlay.gameover {
                    border-color: rgba(255, 0, 85, 0.5);
                    box-shadow: 0 0 60px rgba(255, 0, 85, 0.3);
                }

                .overlay h2 {
                    margin: 0 0 5px;
                    font-family: 'Rajdhani', sans-serif;
                    font-size: 34px;
                    color: #00f260;
                    text-shadow: 0 0 20px rgba(0, 242, 96, 0.6);
                    letter-spacing: 3px;
                }

                .overlay.gameover h2 {
                    color: #ff0055;
                    text-shadow: 0 0 20px rgba(255, 0, 85, 0.6);
                }

                .subtitle {
                    color: #a855f7;
                    font-size: 14px;
                    letter-spacing: 4px;
                    margin-bottom: 20px;
                    font-weight: 600;
                }

                .features {
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                    flex-wrap: wrap;
                    margin-bottom: 20px;
                }

                .features span {
                    background: rgba(0, 242, 96, 0.1);
                    border: 1px solid rgba(0, 242, 96, 0.3);
                    padding: 5px 12px;
                    border-radius: 20px;
                    font-size: 11px;
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
                    font-size: 18px !important;
                    animation: recordPulse 0.5s ease-in-out infinite alternate;
                }

                @keyframes recordPulse {
                    from { transform: scale(1); }
                    to { transform: scale(1.05); }
                }

                .final-stats {
                    margin: 20px 0;
                }

                .stat-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    font-size: 14px;
                }

                .stat-row span:first-child { color: #94a3b8; }
                .stat-row span:last-child { color: #00f260; font-weight: 700; }

                .controls-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px 15px;
                    margin-bottom: 25px;
                    text-align: left;
                }

                .control-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 12px;
                    color: #94a3b8;
                }

                .k-box {
                    background: linear-gradient(180deg, #1e293b, #0f172a);
                    padding: 5px 10px;
                    border-radius: 4px;
                    border: 1px solid #334155;
                    border-bottom: 3px solid #1e293b;
                    font-family: monospace;
                    font-size: 10px;
                    color: #00f260;
                    min-width: 55px;
                    text-align: center;
                }

                .btn-start {
                    background: linear-gradient(135deg, #00f260, #0575e6);
                    border: none;
                    padding: 14px 40px;
                    border-radius: 50px;
                    color: #000;
                    font-weight: 700;
                    font-family: 'Rajdhani', sans-serif;
                    font-size: 16px;
                    text-transform: uppercase;
                    letter-spacing: 3px;
                    cursor: pointer;
                    box-shadow: 0 10px 30px rgba(0, 242, 96, 0.4);
                    transition: all 0.2s;
                }

                .btn-start:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 15px 40px rgba(0, 242, 96, 0.6);
                }
            `}</style>
        </div>
    )
}
