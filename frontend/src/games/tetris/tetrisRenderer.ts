/**
 * CYBERARCADE - CYBER TETRIS CANVAS RENDERER
 * Pure 60fps rendering layer: neon block bevels, ghost projections, matrix grids, and particle FX.
 */

import { ActivePiece } from './tetrisEngine'
import { ParticleEngine } from '../core/ParticleEngine'

export interface TetrisRenderConfig {
  width: number
  height: number
  cellSize: number
}

export class TetrisRenderer {
  /**
   * Draw cyber block with neon glow & bevel
   */
  public static drawBlock(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    isGhost: boolean = false
  ) {
    const pad = 1
    const blockSize = size - pad * 2
    const drawX = x * size + pad
    const drawY = y * size + pad

    if (isGhost) {
      ctx.save()
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.shadowColor = color
      ctx.shadowBlur = 6
      ctx.fillStyle = `${color}15`
      ctx.fillRect(drawX, drawY, blockSize, blockSize)
      ctx.strokeRect(drawX, drawY, blockSize, blockSize)
      ctx.restore()
      return
    }

    ctx.save()
    // Outer Glow
    ctx.shadowColor = color
    ctx.shadowBlur = 10
    ctx.fillStyle = color
    ctx.fillRect(drawX, drawY, blockSize, blockSize)

    // Inner bevel highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
    ctx.fillRect(drawX, drawY, blockSize, 3)
    ctx.fillRect(drawX, drawY, 3, blockSize)

    // Inner shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
    ctx.fillRect(drawX, drawY + blockSize - 3, blockSize, 3)
    ctx.fillRect(drawX + blockSize - 3, drawY, 3, blockSize)
    ctx.restore()
  }

  /**
   * Draw entire matrix background and placed blocks
   */
  public static drawMatrix(
    ctx: CanvasRenderingContext2D,
    board: (string | null)[][],
    config: TetrisRenderConfig
  ) {
    const { width, height, cellSize } = config
    const matrixW = width * cellSize
    const matrixH = height * cellSize

    // Matrix background
    ctx.fillStyle = 'rgba(10, 8, 22, 0.95)'
    ctx.fillRect(0, 0, matrixW, matrixH)

    // Glowing boundary
    ctx.strokeStyle = 'rgba(0, 242, 96, 0.3)'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, matrixW, matrixH)

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let c = 0; c <= width; c++) {
      ctx.moveTo(c * cellSize, 0)
      ctx.lineTo(c * cellSize, matrixH)
    }
    for (let r = 0; r <= height; r++) {
      ctx.moveTo(0, r * cellSize)
      ctx.lineTo(matrixW, r * cellSize)
    }
    ctx.stroke()

    // Draw placed blocks
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const color = board[r][c]
        if (color) {
          this.drawBlock(ctx, c, r, cellSize, color)
        }
      }
    }
  }

  /**
   * Draw active falling piece and ghost outline
   */
  public static drawPiece(
    ctx: CanvasRenderingContext2D,
    piece: ActivePiece,
    ghostY: number,
    cellSize: number
  ) {
    const { shape, color, x, y } = piece

    // 1. Draw Ghost Piece
    if (ghostY > y) {
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c] !== 0) {
            this.drawBlock(ctx, x + c, ghostY + r, cellSize, color, true)
          }
        }
      }
    }

    // 2. Draw Active Piece
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          this.drawBlock(ctx, x + c, y + r, cellSize, color, false)
        }
      }
    }
  }

  /**
   * Full composite render frame
   */
  public static renderScene(
    ctx: CanvasRenderingContext2D,
    board: (string | null)[][],
    currentPiece: ActivePiece | null,
    ghostY: number,
    config: TetrisRenderConfig,
    particleEngine: ParticleEngine,
    screenShake: number = 0
  ) {
    const { width, height, cellSize } = config

    ctx.save()

    // Screen Shake translation
    if (screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * screenShake * 2
      const shakeY = (Math.random() - 0.5) * screenShake * 2
      ctx.translate(shakeX, shakeY)
    }

    ctx.clearRect(0, 0, width * cellSize, height * cellSize)

    // 1. Draw Matrix & Placed Blocks
    this.drawMatrix(ctx, board, config)

    // 2. Draw Active Piece & Ghost Projection
    if (currentPiece) {
      this.drawPiece(ctx, currentPiece, ghostY, cellSize)
    }

    // 3. Draw Particles
    particleEngine.render(ctx)

    ctx.restore()
  }
}
