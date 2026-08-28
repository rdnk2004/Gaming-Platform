/**
 * CYBERARCADE - NEON VIPER (SNAKE) ENGINE
 * Pure simulation logic: vector mathematics, IK segment tracking,
 * food/bubble/power-up lifecycles, and multi-snake collision detection.
 */

export const SNAKE_CONFIG = {
  baseSpeed: 3.5,
  sprintSpeed: 6.5,
  turnSpeed: 0.12,
  segmentDist: 10,
  startLength: 15,
  growthPerFood: 5,
  colors: {
    p1: { main: '#00f260', dark: '#008f39', glow: 'rgba(0, 242, 96, 0.4)' },
    p2: { main: '#0575e6', dark: '#021b79', glow: 'rgba(5, 117, 230, 0.4)' },
    food: '#ff0055',
    bubble: '#00d2ff',
    grid: 'rgba(255,255,255,0.03)'
  }
}

export const dist = (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1)
export const rand = (min: number, max: number) => Math.random() * (max - min) + min

export interface Segment {
  x: number
  y: number
}

export interface ColorProfile {
  main: string
  dark: string
  glow: string
}

export class FoodItem {
  public x: number = 0
  public y: number = 0
  public pulse: number = 0
  public color: string = SNAKE_CONFIG.colors.food

  constructor(width: number, height: number) {
    this.respawn(width, height)
  }

  public respawn(width: number, height: number) {
    const margin = 50
    this.x = rand(margin, Math.max(margin + 50, width - margin))
    this.y = rand(margin, Math.max(margin + 50, height - margin))
  }

  public update(time: number) {
    this.pulse = Math.sin(time * 0.005) * 3
  }
}

export class BigBubbleItem {
  public x: number
  public y: number
  public size: number = 20
  public life: number = 600
  public maxLife: number = 600
  public color: string = SNAKE_CONFIG.colors.bubble

  constructor(width: number, height: number) {
    const margin = 60
    this.x = rand(margin, Math.max(margin + 50, width - margin))
    this.y = rand(margin, Math.max(margin + 50, height - margin))
  }

  public update(): boolean {
    this.life--
    return this.life > 0
  }
}

export type PowerUpType = 'speed' | 'ghost'

export class PowerUpItem {
  public x: number
  public y: number
  public type: PowerUpType
  public size: number = 18
  public life: number = 600
  public color: string
  public icon: string

  constructor(width: number, height: number) {
    const margin = 60
    this.x = rand(margin, Math.max(margin + 50, width - margin))
    this.y = rand(margin, Math.max(margin + 50, height - margin))
    this.type = Math.random() < 0.5 ? 'speed' : 'ghost'
    this.color = this.type === 'speed' ? '#fbbf24' : '#a855f7'
    this.icon = this.type === 'speed' ? '⚡' : '👻'
  }

  public update(): boolean {
    this.life--
    return this.life > 0
  }
}

export class SnakeEntity {
  public id: number
  public alive: boolean = true
  public score: number = 0
  public orbsEaten: number = 0
  public color: ColorProfile
  public controls: 'arrows' | 'wasd'
  public angle: number
  public targetAngle: number
  public speed: number = SNAKE_CONFIG.baseSpeed
  public head: Segment
  public segments: Segment[] = []
  public width: number = 16
  public effects: { speed: number; ghost: number } = { speed: 0, ghost: 0 }

  constructor(
    id: number,
    startX: number,
    startY: number,
    colorProfile: ColorProfile,
    controlScheme: 'arrows' | 'wasd',
    initialAngle?: number
  ) {
    this.id = id
    this.color = colorProfile
    this.controls = controlScheme
    this.angle = initialAngle !== undefined ? initialAngle : controlScheme === 'arrows' ? Math.PI : 0
    this.targetAngle = this.angle
    this.head = { x: startX, y: startY }

    const dirX = Math.cos(this.angle + Math.PI)
    const dirY = Math.sin(this.angle + Math.PI)
    for (let i = 1; i <= SNAKE_CONFIG.startLength; i++) {
      this.segments.push({
        x: startX + dirX * i * SNAKE_CONFIG.segmentDist,
        y: startY + dirY * i * SNAKE_CONFIG.segmentDist
      })
    }
  }

  public update(
    dt: number,
    keys: Record<string, boolean>,
    width: number,
    height: number,
    wallsEnabled: boolean,
    enemySnake?: SnakeEntity
  ): boolean {
    if (!this.alive) return false

    // Input steering
    let boost = false
    if (this.controls === 'arrows') {
      if (keys['arrowup']) this.targetAngle = -Math.PI / 2
      else if (keys['arrowdown']) this.targetAngle = Math.PI / 2
      else if (keys['arrowleft']) this.targetAngle = Math.PI
      else if (keys['arrowright']) this.targetAngle = 0
      if (keys['shift']) boost = true
    } else {
      if (keys['w']) this.targetAngle = -Math.PI / 2
      else if (keys['s']) this.targetAngle = Math.PI / 2
      else if (keys['a']) this.targetAngle = Math.PI
      else if (keys['d']) this.targetAngle = 0
      if (keys[' ']) boost = true
    }

    // Shortest angular turn interpolation
    let diff = this.targetAngle - this.angle
    while (diff <= -Math.PI) diff += Math.PI * 2
    while (diff > Math.PI) diff -= Math.PI * 2
    this.angle += diff * SNAKE_CONFIG.turnSpeed

    let base = SNAKE_CONFIG.baseSpeed
    if (this.effects.speed > 0) base = SNAKE_CONFIG.sprintSpeed + 2
    const currentSpeed = boost ? SNAKE_CONFIG.sprintSpeed : base

    if (this.effects.speed > 0) this.effects.speed--
    if (this.effects.ghost > 0) this.effects.ghost--

    // Move head
    const fps = 60
    const moveDist = currentSpeed * (dt / (1000 / fps))
    this.head.x += Math.cos(this.angle) * moveDist
    this.head.y += Math.sin(this.angle) * moveDist

    // Wall collision
    if (wallsEnabled && this.effects.ghost <= 0) {
      if (this.head.x < 0 || this.head.x > width || this.head.y < 0 || this.head.y > height) {
        this.die()
        return true
      }
    } else {
      if (this.head.x < 0) this.head.x = width
      if (this.head.x > width) this.head.x = 0
      if (this.head.y < 0) this.head.y = height
      if (this.head.y > height) this.head.y = 0
    }

    // Body follow inverse kinematics
    this.dragSegment(0, this.head.x, this.head.y)
    for (let i = 1; i < this.segments.length; i++) {
      this.dragSegment(i, this.segments[i - 1].x, this.segments[i - 1].y)
    }

    // Self collision
    if (this.effects.ghost <= 0) {
      for (let i = 4; i < this.segments.length; i++) {
        if (dist(this.head.x, this.head.y, this.segments[i].x, this.segments[i].y) < this.width / 1.5) {
          this.die()
          return true
        }
      }
    }

    // Enemy collision
    if (enemySnake && enemySnake.alive && this.effects.ghost <= 0) {
      for (const seg of enemySnake.segments) {
        if (dist(this.head.x, this.head.y, seg.x, seg.y) < this.width) {
          this.die()
          return true
        }
      }
      if (dist(this.head.x, this.head.y, enemySnake.head.x, enemySnake.head.y) < this.width * 1.5) {
        if (this.segments.length <= enemySnake.segments.length) {
          this.die()
          return true
        }
      }
    }

    return false
  }

  private dragSegment(i: number, tx: number, ty: number) {
    const seg = this.segments[i]
    const d = dist(seg.x, seg.y, tx, ty)
    if (d === 0) return
    if (d > 100) {
      seg.x = tx
      seg.y = ty
      return
    }
    const angle = Math.atan2(ty - seg.y, tx - seg.x)
    seg.x = tx - Math.cos(angle) * SNAKE_CONFIG.segmentDist
    seg.y = ty - Math.sin(angle) * SNAKE_CONFIG.segmentDist
  }

  public grow() {
    const last = this.segments[this.segments.length - 1]
    for (let i = 0; i < SNAKE_CONFIG.growthPerFood; i++) {
      this.segments.push({ x: last.x, y: last.y })
    }
    this.score += 10
    this.orbsEaten++
  }

  public die() {
    this.alive = false
  }
}
