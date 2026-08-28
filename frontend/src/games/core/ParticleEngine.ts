/**
 * CYBERARCADE - HIGH PERFORMANCE PARTICLE ENGINE
 * Reusable canvas particle & visual FX system for arcade games.
 * Supports burst explosions, spark showers, trail lines, and floating score popups.
 */

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  decay: number
  alpha: number
  text?: string
}

export class ParticleEngine {
  private particles: Particle[] = []
  private maxParticles: number = 250

  constructor(maxParticles: number = 250) {
    this.maxParticles = maxParticles
  }

  /**
   * Spawn radial explosion particles (e.g. food eat, line clear, wall impact)
   */
  public emitExplosion(x: number, y: number, color: string, count: number = 20, speed: number = 4) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) {
        this.particles.shift()
      }

      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
      const velocity = (Math.random() * 0.7 + 0.3) * speed

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 1.0,
        maxLife: 1.0,
        color,
        size: Math.random() * 3 + 2,
        decay: Math.random() * 0.02 + 0.02,
        alpha: 1.0
      })
    }
  }

  /**
   * Spawn spark shower (e.g. paddle bounce, hard drop)
   */
  public emitSparks(x: number, y: number, color: string, count: number = 10, dirX: number = 0, dirY: number = 0) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) {
        this.particles.shift()
      }

      const spread = (Math.random() - 0.5) * Math.PI
      const angle = Math.atan2(dirY, dirX) + spread
      const speed = Math.random() * 4 + 1.5

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 1.0,
        color,
        size: Math.random() * 2 + 1,
        decay: Math.random() * 0.03 + 0.03,
        alpha: 1.0
      })
    }
  }

  /**
   * Spawn floating text particle (e.g. "+100", "COMBO x2", "TETRIS!")
   */
  public emitFloatingText(x: number, y: number, text: string, color: string = '#00f0ff') {
    if (this.particles.length >= this.maxParticles) {
      this.particles.shift()
    }

    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -1.5,
      life: 1.0,
      maxLife: 1.0,
      color,
      size: 14,
      decay: 0.02,
      alpha: 1.0,
      text
    })
  }

  /**
   * Update particle positions, decay, and life cycle
   */
  public update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx
      p.y += p.vy
      p.life -= p.decay
      p.alpha = Math.max(0, p.life / p.maxLife)

      // Slight gravity/friction for sparks
      if (!p.text) {
        p.vx *= 0.96
        p.vy *= 0.96
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }

  /**
   * Render all active particles to target canvas context
   */
  public render(ctx: CanvasRenderingContext2D) {
    if (this.particles.length === 0) return

    ctx.save()
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]

      if (p.text) {
        ctx.save()
        ctx.globalAlpha = p.alpha
        ctx.font = `bold ${p.size}px "Rajdhani", sans-serif`
        ctx.fillStyle = p.color
        ctx.shadowColor = p.color
        ctx.shadowBlur = 8
        ctx.textAlign = 'center'
        ctx.fillText(p.text, p.x, p.y)
        ctx.restore()
      } else {
        ctx.globalAlpha = p.alpha
        ctx.fillStyle = p.color
        ctx.shadowColor = p.color
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * p.alpha, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.restore()
  }

  /**
   * Clear all active particles
   */
  public clear() {
    this.particles = []
  }

  public getCount(): number {
    return this.particles.length
  }
}
