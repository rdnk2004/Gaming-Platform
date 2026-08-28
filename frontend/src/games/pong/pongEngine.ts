/**
 * CYBERARCADE - NEON PONG ENGINE
 * Pure 2D physics: velocity vectors, paddle collision angles, ball acceleration, and multi-tier AI.
 */

export type PongMode = '1p' | '2p'
export type PongDifficulty = 'easy' | 'medium' | 'hard' | 'insane'

export const PONG_CONFIG = {
  paddleWidth: 14,
  paddleHeight: 90,
  paddleSpeed: 7.5,
  ballSize: 10,
  baseBallSpeed: 6,
  maxBallSpeed: 16,
  speedIncrement: 0.35,
  winScore: 7,
  colors: {
    p1: '#00f260',
    p2: '#0575e6',
    ball: '#ff0055',
    court: '#0a0816',
    net: 'rgba(255, 255, 255, 0.15)'
  }
}

export interface BallState {
  x: number
  y: number
  vx: number
  vy: number
  speed: number
  trail: { x: number; y: number }[]
}

export interface PaddleState {
  x: number
  y: number
  score: number
  color: string
}

export function createInitialBall(width: number, height: number, dir: number = 0): BallState {
  const angle = (Math.random() - 0.5) * (Math.PI / 2.5)
  const direction = dir !== 0 ? dir : Math.random() > 0.5 ? 1 : -1
  const speed = PONG_CONFIG.baseBallSpeed

  return {
    x: width / 2,
    y: height / 2,
    vx: Math.cos(angle) * speed * direction,
    vy: Math.sin(angle) * speed,
    speed,
    trail: []
  }
}

export function createInitialPaddles(width: number, height: number): { p1: PaddleState; p2: PaddleState } {
  return {
    p1: {
      x: 30,
      y: (height - PONG_CONFIG.paddleHeight) / 2,
      score: 0,
      color: PONG_CONFIG.colors.p1
    },
    p2: {
      x: width - 30 - PONG_CONFIG.paddleWidth,
      y: (height - PONG_CONFIG.paddleHeight) / 2,
      score: 0,
      color: PONG_CONFIG.colors.p2
    }
  }
}

export function updateAiPaddle(
  paddle: PaddleState,
  ball: BallState,
  tableHeight: number,
  difficulty: PongDifficulty
) {
  const paddleCenter = paddle.y + PONG_CONFIG.paddleHeight / 2
  let targetY = ball.y

  let speedFactor = 0.8
  let predictionError = 0

  switch (difficulty) {
    case 'easy':
      speedFactor = 0.5
      predictionError = (Math.random() - 0.5) * 60
      break
    case 'medium':
      speedFactor = 0.75
      predictionError = (Math.random() - 0.5) * 30
      break
    case 'hard':
      speedFactor = 0.92
      predictionError = 0
      break
    case 'insane':
      speedFactor = 1.05
      predictionError = 0
      break
  }

  // Only track when ball is moving toward AI or in medium distance
  if (ball.vx > 0 || Math.random() < 0.4) {
    targetY += predictionError
    const diff = targetY - paddleCenter
    const maxMove = PONG_CONFIG.paddleSpeed * speedFactor

    if (Math.abs(diff) > 8) {
      paddle.y += Math.sign(diff) * Math.min(Math.abs(diff), maxMove)
    }
  }

  // Clamp within bounds
  paddle.y = Math.max(10, Math.min(tableHeight - PONG_CONFIG.paddleHeight - 10, paddle.y))
}

export interface CollisionEvent {
  type: 'hit' | 'score'
  paddleIndex?: 1 | 2
  scorer?: 1 | 2
  x: number
  y: number
}

export function updateBallPhysics(
  ball: BallState,
  p1: PaddleState,
  p2: PaddleState,
  tableWidth: number,
  tableHeight: number
): CollisionEvent | null {
  // Update trail
  ball.trail.push({ x: ball.x, y: ball.y })
  if (ball.trail.length > 8) {
    ball.trail.shift()
  }

  ball.x += ball.vx
  ball.y += ball.vy

  const halfSize = PONG_CONFIG.ballSize / 2

  // Top & Bottom boundary bounce
  if (ball.y - halfSize <= 0) {
    ball.y = halfSize
    ball.vy = Math.abs(ball.vy)
  } else if (ball.y + halfSize >= tableHeight) {
    ball.y = tableHeight - halfSize
    ball.vy = -Math.abs(ball.vy)
  }

  // P1 Paddle Collision (Left)
  if (
    ball.x - halfSize <= p1.x + PONG_CONFIG.paddleWidth &&
    ball.x + halfSize >= p1.x &&
    ball.y >= p1.y &&
    ball.y <= p1.y + PONG_CONFIG.paddleHeight &&
    ball.vx < 0
  ) {
    const hitOffset = (ball.y - (p1.y + PONG_CONFIG.paddleHeight / 2)) / (PONG_CONFIG.paddleHeight / 2)
    const maxAngle = Math.PI / 3 // 60 degrees max
    const bounceAngle = hitOffset * maxAngle

    ball.speed = Math.min(PONG_CONFIG.maxBallSpeed, ball.speed + PONG_CONFIG.speedIncrement)
    ball.vx = Math.cos(bounceAngle) * ball.speed
    ball.vy = Math.sin(bounceAngle) * ball.speed
    ball.x = p1.x + PONG_CONFIG.paddleWidth + halfSize

    return { type: 'hit', paddleIndex: 1, x: ball.x, y: ball.y }
  }

  // P2 Paddle Collision (Right)
  if (
    ball.x + halfSize >= p2.x &&
    ball.x - halfSize <= p2.x + PONG_CONFIG.paddleWidth &&
    ball.y >= p2.y &&
    ball.y <= p2.y + PONG_CONFIG.paddleHeight &&
    ball.vx > 0
  ) {
    const hitOffset = (ball.y - (p2.y + PONG_CONFIG.paddleHeight / 2)) / (PONG_CONFIG.paddleHeight / 2)
    const maxAngle = Math.PI / 3 // 60 degrees max
    const bounceAngle = hitOffset * maxAngle

    ball.speed = Math.min(PONG_CONFIG.maxBallSpeed, ball.speed + PONG_CONFIG.speedIncrement)
    ball.vx = -Math.cos(bounceAngle) * ball.speed
    ball.vy = Math.sin(bounceAngle) * ball.speed
    ball.x = p2.x - halfSize

    return { type: 'hit', paddleIndex: 2, x: ball.x, y: ball.y }
  }

  // Score P2 (Ball passed P1 on left)
  if (ball.x + halfSize < 0) {
    p2.score++
    return { type: 'score', scorer: 2, x: 0, y: ball.y }
  }

  // Score P1 (Ball passed P2 on right)
  if (ball.x - halfSize > tableWidth) {
    p1.score++
    return { type: 'score', scorer: 1, x: tableWidth, y: ball.y }
  }

  return null
}
