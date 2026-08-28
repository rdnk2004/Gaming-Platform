/**
 * CYBERARCADE - NEON PONG CANVAS RENDERER
 * Pure 60fps rendering layer: motion trail shaders, cyber table grids, and neon paddles.
 */

import { BallState, PaddleState, PONG_CONFIG } from './pongEngine'
import { ParticleEngine } from '../core/ParticleEngine'

export class PongRenderer {
  /**
   * Draw cyber court table background and center net
   */
  public static drawCourt(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) {
    // Court floor
    ctx.fillStyle = PONG_CONFIG.colors.court
    ctx.fillRect(0, 0, width, height)

    // Court border glow
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.25)'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, width, height)

    // Segmented center net
    ctx.strokeStyle = PONG_CONFIG.colors.net
    ctx.lineWidth = 2
    ctx.setLineDash([8, 8])
    ctx.beginPath()
    ctx.moveTo(width / 2, 0)
    ctx.lineTo(width / 2, height)
    ctx.stroke()
    ctx.setLineDash([]) // Reset
  }

  /**
   * Draw paddle with neon glow & bevel
   */
  public static drawPaddle(
    ctx: CanvasRenderingContext2D,
    paddle: PaddleState
  ) {
    const { x, y, color } = paddle
    const w = PONG_CONFIG.paddleWidth
    const h = PONG_CONFIG.paddleHeight

    ctx.save()
    ctx.shadowColor = color
    ctx.shadowBlur = 15
    ctx.fillStyle = color

    // Rounded rectangle paddle
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, 6)
    ctx.fill()

    // Inner highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.fillRect(x + 2, y + 4, w - 4, 3)
    ctx.restore()
  }

  /**
   * Draw ball with speed motion trail and outer glow
   */
  public static drawBall(
    ctx: CanvasRenderingContext2D,
    ball: BallState
  ) {
    const size = PONG_CONFIG.ballSize
    const halfSize = size / 2

    // 1. Draw Motion Trail
    for (let i = 0; i < ball.trail.length; i++) {
      const pos = ball.trail[i]
      const alpha = (i + 1) / ball.trail.length * 0.4
      const trailSize = halfSize * (i / ball.trail.length)

      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = PONG_CONFIG.colors.ball
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, trailSize, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    // 2. Draw Active Ball
    ctx.save()
    ctx.shadowColor = PONG_CONFIG.colors.ball
    ctx.shadowBlur = 16
    ctx.fillStyle = PONG_CONFIG.colors.ball
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, halfSize, 0, Math.PI * 2)
    ctx.fill()

    // Inner core highlight
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(ball.x - 2, ball.y - 2, 2.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  /**
   * Full composite scene render
   */
  public static renderScene(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    ball: BallState,
    p1: PaddleState,
    p2: PaddleState,
    particleEngine: ParticleEngine
  ) {
    ctx.clearRect(0, 0, width, height)

    // 1. Court Table
    this.drawCourt(ctx, width, height)

    // 2. Paddles
    this.drawPaddle(ctx, p1)
    this.drawPaddle(ctx, p2)

    // 3. Ball
    this.drawBall(ctx, ball)

    // 4. Particle FX
    particleEngine.render(ctx)
  }
}
