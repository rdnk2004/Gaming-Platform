/**
 * CYBERARCADE - NEON VIPER (SNAKE) CANVAS RENDERER
 * Pure 60fps rendering layer: grid background, glow shaders, IK snake bodies, and items.
 */

import { FoodItem, BigBubbleItem, PowerUpItem, SnakeEntity, dist } from './snakeEngine'
import { ParticleEngine } from '../core/ParticleEngine'

export interface RenderTheme {
  isLightMode: boolean
  gridColor: string
  bgColor: string
}

export class SnakeRenderer {
  /**
   * Draw cybernetic grid background
   */
  public static drawBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    theme: RenderTheme
  ) {
    ctx.fillStyle = theme.bgColor
    ctx.fillRect(0, 0, width, height)

    ctx.strokeStyle = theme.gridColor
    ctx.lineWidth = 1

    const gridSize = 40
    ctx.beginPath()
    for (let x = 0; x < width; x += gridSize) {
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
    }
    ctx.stroke()
  }

  /**
   * Draw glowing food orb
   */
  public static drawFood(ctx: CanvasRenderingContext2D, food: FoodItem) {
    ctx.save()
    ctx.shadowBlur = 20
    ctx.shadowColor = food.color
    ctx.fillStyle = food.color
    ctx.beginPath()
    ctx.arc(food.x, food.y, 8 + food.pulse, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(food.x, food.y, 12 - food.pulse, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }

  /**
   * Draw Big Bubble power-up
   */
  public static drawBigBubble(ctx: CanvasRenderingContext2D, bubble: BigBubbleItem) {
    ctx.save()
    const alpha = Math.min(1, bubble.life / 100)
    ctx.globalAlpha = alpha
    ctx.shadowBlur = 25
    ctx.shadowColor = bubble.color
    ctx.fillStyle = bubble.color
    ctx.beginPath()
    ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.beginPath()
    ctx.arc(bubble.x - 5, bubble.y - 5, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  /**
   * Draw mystery power-up
   */
  public static drawPowerUp(ctx: CanvasRenderingContext2D, powerUp: PowerUpItem) {
    ctx.save()
    const alpha = Math.min(1, powerUp.life / 100)
    ctx.globalAlpha = alpha
    ctx.shadowBlur = 20
    ctx.shadowColor = powerUp.color
    ctx.fillStyle = powerUp.color
    ctx.beginPath()
    ctx.arc(powerUp.x, powerUp.y, powerUp.size, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.font = '16px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(powerUp.icon, powerUp.x, powerUp.y + 1)
    ctx.restore()
  }

  /**
   * Draw snake body, spine, and animated head
   */
  public static drawSnake(
    ctx: CanvasRenderingContext2D,
    snake: SnakeEntity,
    time: number
  ) {
    if (!snake.alive || snake.segments.length === 0) return

    ctx.save()
    ctx.lineWidth = snake.width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Outer glow
    ctx.shadowBlur = 16
    if (snake.effects.speed > 0) ctx.shadowColor = '#fbbf24'
    else if (snake.effects.ghost > 0) ctx.shadowColor = '#a855f7'
    else ctx.shadowColor = snake.color.glow

    // Draw main body segments
    ctx.beginPath()
    ctx.moveTo(snake.segments[0].x, snake.segments[0].y)
    for (let i = 1; i < snake.segments.length; i++) {
      const prev = snake.segments[i - 1]
      const curr = snake.segments[i]
      if (dist(prev.x, prev.y, curr.x, curr.y) > 80) {
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(curr.x, curr.y)
      } else {
        ctx.lineTo(curr.x, curr.y)
      }
    }
    ctx.strokeStyle = snake.color.main
    ctx.stroke()

    // Inner spine detail
    ctx.lineWidth = 4
    ctx.strokeStyle = snake.color.dark
    ctx.stroke()
    ctx.shadowBlur = 0

    // Draw Head
    ctx.translate(snake.head.x, snake.head.y)
    ctx.rotate(snake.angle)

    ctx.fillStyle = snake.color.main
    ctx.beginPath()
    ctx.ellipse(0, 0, 14, 11, 0, 0, Math.PI * 2)
    ctx.fill()

    // Eyes
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(6, -5, 4, 0, Math.PI * 2)
    ctx.arc(6, 5, 4, 0, Math.PI * 2)
    ctx.fill()

    // Pupils
    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.arc(7, -5, 2, 0, Math.PI * 2)
    ctx.arc(7, 5, 2, 0, Math.PI * 2)
    ctx.fill()

    // Flickering Tongue
    if (Math.floor(time / 200) % 10 === 0) {
      ctx.strokeStyle = '#ff4d4d'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(10, 0)
      ctx.lineTo(20, 0)
      ctx.lineTo(24, -3)
      ctx.moveTo(20, 0)
      ctx.lineTo(24, 3)
      ctx.stroke()
    }

    ctx.restore()
  }

  /**
   * Full frame composition
   */
  public static renderScene(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    theme: RenderTheme,
    snakes: SnakeEntity[],
    food: FoodItem | null,
    bigBubbles: BigBubbleItem[],
    powerUps: PowerUpItem[],
    particleEngine: ParticleEngine,
    time: number
  ) {
    ctx.clearRect(0, 0, width, height)

    // 1. Grid Background
    this.drawBackground(ctx, width, height, theme)

    // 2. Interactive Items
    if (food) this.drawFood(ctx, food)
    bigBubbles.forEach(b => this.drawBigBubble(ctx, b))
    powerUps.forEach(p => this.drawPowerUp(ctx, p))

    // 3. Snakes
    snakes.forEach(s => this.drawSnake(ctx, s, time))

    // 4. Particles & Floating Scores
    particleEngine.render(ctx)
  }
}
