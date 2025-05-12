// Game dimensions
export const CANVAS_WIDTH = 1200 // Increased from 800
export const CANVAS_HEIGHT = 600 // Increased from 400
export const GROUND_Y = 550 // Increased from 350

// Physics constants
export const GRAVITY = 0.5
export const JUMP_FORCE = 12
export const MOVE_SPEED = 5

// Combat constants
export const ATTACK_RANGE = 60
export const ATTACK_DAMAGE = 10
export const COMBO_WINDOW = 20 // Frames to perform a combo

// Player dimensions
export const PLAYER_WIDTH = 30
export const PLAYER_HEIGHT = 80

// Power-up constants
export const POWERUP_SPAWN_RATE = 0.005 // Chance per frame
export const POWERUP_DURATION = 300 // Frames (5 seconds at 60fps)
export const POWERUP_SIZE = 25

// Player colors
export const PLAYER1_COLOR = "#2563eb" // blue-500
export const PLAYER2_COLOR = "#dc2626" // red-500

// Power-up colors
export const POWERUP_COLORS = {
  speed: "#3b82f6", // blue
  jump: "#10b981", // green
  giant: "#7c3aed", // purple
  shield: "#f59e0b", // amber
  rapidFire: "#ef4444", // red
}

// Attack types
export type AttackType = "punch" | "kick" | "uppercut" | "slam" | "special"

// Player type
export interface Player {
  x: number
  y: number
  velocityX: number
  velocityY: number
  isJumping: boolean
  direction: number
  health: number
  isAttacking: boolean
  attackType: AttackType
  attackCooldown: number
  attackFrame: number
  comboCounter: number
  lastAttackTime: number
  lastKeyPressed: string
  winner: boolean
  hitReaction: number
  squash: number
  onPlatform: boolean
  platformId?: string
  hasSpeedBoost: boolean
  speedBoostTimer: number
  hasSuperJump: boolean
  superJumpTimer: number
  hasGiantMode: boolean
  giantModeTimer: number
  hasShield: boolean
  shieldTimer: number
  hasRapidFire: boolean
  rapidFireTimer: number
  burning?: number
  frozen?: number
  stunned?: number
  poisoned?: boolean
  possessed?: boolean
  state?: string
  stateTimer?: number
  score?: number
}

// Power-up type
export type PowerUp = {
  x: number
  y: number
  type: "speed" | "jump" | "giant" | "shield" | "rapidFire"
  active: boolean
  collectAnimation: number
}
