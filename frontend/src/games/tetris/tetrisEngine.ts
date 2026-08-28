/**
 * CYBERARCADE - CYBER TETRIS ENGINE
 * Pure matrix mechanics: SRS (Super Rotation System), 7-bag randomizer,
 * ghost projection, wall kick offsets, and combo/score calculations.
 */

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'
export type TetrisEdition = 'classic' | 'ultra'

export interface TetrisConfig {
  width: number
  height: number
  cellSize: number
}

export const TETRIS_EDITIONS: Record<TetrisEdition, TetrisConfig> = {
  classic: { width: 10, height: 20, cellSize: 28 },
  ultra: { width: 12, height: 24, cellSize: 24 }
}

export const TETROMINOES: Record<TetrominoType, { shape: number[][]; color: string }> = {
  I: { shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], color: '#00d4ff' },
  O: { shape: [[1, 1], [1, 1]], color: '#fbbf24' },
  T: { shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], color: '#a855f7' },
  S: { shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], color: '#00f260' },
  Z: { shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], color: '#ff0055' },
  J: { shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], color: '#0575e6' },
  L: { shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]], color: '#ff6b35' }
}

export const WALL_KICKS: Record<string, number[][]> = {
  '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]
}

export const I_WALL_KICKS: Record<string, number[][]> = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]]
}

export interface ActivePiece {
  type: TetrominoType
  shape: number[][]
  color: string
  x: number
  y: number
  rotation: number
}

export function createEmptyBoard(rows: number, cols: number): (string | null)[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(null))
}

export function create7Bag(): TetrominoType[] {
  const pieces: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']
  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = pieces[i]
    pieces[i] = pieces[j]
    pieces[j] = temp
  }
  return pieces
}

export function rotateMatrix(matrix: number[][]): number[][] {
  const n = matrix.length
  const rotated: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      rotated[x][n - 1 - y] = matrix[y][x]
    }
  }
  return rotated
}

export function isValidPosition(
  board: (string | null)[][],
  shape: number[][],
  posX: number,
  posY: number,
  boardWidth: number,
  boardHeight: number
): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] !== 0) {
        const boardX = posX + c
        const boardY = posY + r

        if (boardX < 0 || boardX >= boardWidth || boardY >= boardHeight) {
          return false
        }

        if (boardY >= 0 && board[boardY][boardX] !== null) {
          return false
        }
      }
    }
  }
  return true
}

export function calculateGhostPosition(
  board: (string | null)[][],
  piece: ActivePiece,
  boardWidth: number,
  boardHeight: number
): number {
  let ghostY = piece.y
  while (isValidPosition(board, piece.shape, piece.x, ghostY + 1, boardWidth, boardHeight)) {
    ghostY++
  }
  return ghostY
}

export function spawnPiece(type: TetrominoType, boardWidth: number): ActivePiece {
  const info = TETROMINOES[type]
  const shape = info.shape
  const startX = Math.floor((boardWidth - shape[0].length) / 2)
  return {
    type,
    shape,
    color: info.color,
    x: startX,
    y: 0,
    rotation: 0
  }
}

export interface LineClearResult {
  linesCleared: number
  pointsEarned: number
  isTetris: boolean
  clearedRowIndices: number[]
}

export function clearCompletedLines(
  board: (string | null)[][],
  level: number,
  comboCount: number
): LineClearResult {
  const rows = board.length
  const cols = board[0].length
  const clearedRowIndices: number[] = []

  for (let r = rows - 1; r >= 0; r--) {
    let complete = true
    for (let c = 0; c < cols; c++) {
      if (board[r][c] === null) {
        complete = false
        break
      }
    }
    if (complete) {
      clearedRowIndices.push(r)
    }
  }

  const linesCleared = clearedRowIndices.length
  if (linesCleared === 0) {
    return { linesCleared: 0, pointsEarned: 0, isTetris: false, clearedRowIndices: [] }
  }

  // Remove lines and insert new empty rows at top
  for (const rowIndex of clearedRowIndices) {
    board.splice(rowIndex, 1)
    board.unshift(Array(cols).fill(null))
  }

  // Scoring standard
  const baseScores = [0, 100, 300, 500, 800]
  const base = baseScores[linesCleared] || 800
  const comboBonus = comboCount > 1 ? comboCount * 50 * level : 0
  const pointsEarned = base * level + comboBonus

  return {
    linesCleared,
    pointsEarned,
    isTetris: linesCleared === 4,
    clearedRowIndices
  }
}

export function getDropInterval(level: number): number {
  return Math.max(80, Math.floor(1000 * Math.pow(0.85 - (level - 1) * 0.005, level - 1)))
}
