import type React from "react"
import {
  GROUND_Y,
  MOVE_SPEED,
  JUMP_FORCE,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  type Player,
  type AttackType,
  CANVAS_WIDTH,
} from "./constants"
import type { MapConfig } from "./maps"
import { getAttackProperties } from "./combat"

// Create a new player
export function createPlayer(playerNumber: number): Player {
  return {
    x: playerNumber === 1 ? CANVAS_WIDTH * 0.25 : CANVAS_WIDTH * 0.75, // Adjusted for larger map
    y: GROUND_Y,
    velocityX: 0,
    velocityY: 0,
    isJumping: false,
    direction: playerNumber === 1 ? 1 : -1,
    health: 100,
    isAttacking: false,
    attackType: "punch",
    attackCooldown: 0,
    attackFrame: 0,
    comboCounter: 0,
    lastAttackTime: 0,
    lastKeyPressed: "",
    winner: false,
    hitReaction: 0,
    squash: 0,
    onPlatform: false,
    hasSpeedBoost: false,
    speedBoostTimer: 0,
    hasSuperJump: false,
    superJumpTimer: 0,
    hasGiantMode: false,
    giantModeTimer: 0,
    hasShield: false,
    shieldTimer: 0,
    hasRapidFire: false,
    rapidFireTimer: 0,
    state: "idle",
    stateTimer: 0,
  }
}

// Check platform collisions
export function checkPlatformCollisions(player: Player, platforms: MapConfig["platforms"], frameCount: number) {
  let onPlatform = false
  let newY = player.y
  let platformVelocityX = 0
  let platformId = undefined

  for (const platform of platforms) {
    // Skip broken platforms
    if (platform.broken) continue

    // Calculate platform position if it's moving
    let platformX = platform.x
    let platformY = platform.y

    if (platform.moving && platform.speed) {
      if (platform.range && platform.startX) {
        platformX = platform.startX + (Math.sin(frameCount * 0.02 * platform.speed) * platform.range) / 2
      }
      if (platform.startY) {
        platformY = platform.startY + (Math.sin(frameCount * 0.02 * platform.speed) * (platform.range || 100)) / 2
      }
    }

    // Check if player is above the platform and falling
    if (
      player.velocityY > 0 &&
      player.y < platformY &&
      player.y + player.velocityY >= platformY - 5 &&
      player.x > platformX - PLAYER_WIDTH / 2 &&
      player.x < platformX + platform.width + PLAYER_WIDTH / 2
    ) {
      newY = platformY
      onPlatform = true
      platformId = platform.id

      // If platform is moving, transfer its velocity to the player
      if (platform.moving && platform.speed && platform.range) {
        platformVelocityX = Math.cos(frameCount * 0.02 * platform.speed) * platform.speed * 2
      }

      // If platform is bouncy, bounce the player
      if (platform.bouncy && platform.bounceFactor) {
        player.velocityY = -player.velocityY * platform.bounceFactor
        onPlatform = false
      }

      break
    }
  }

  return { onPlatform, newY, platformVelocityX, platformId }
}

// Check hazard collisions
export function checkHazardCollisions(player: Player, hazards?: MapConfig["hazards"]) {
  if (!hazards) return 0

  let damage = 0

  for (const hazard of hazards) {
    if (!hazard.active && hazard.active !== undefined) continue

    if (
      player.x > hazard.x - PLAYER_WIDTH / 2 &&
      player.x < hazard.x + hazard.width + PLAYER_WIDTH / 2 &&
      player.y > hazard.y - PLAYER_HEIGHT &&
      player.y < hazard.y + hazard.height
    ) {
      damage += hazard.damage
    }
  }

  return damage
}

// Update player state
export function updatePlayer(
  player: Player,
  keys: Record<string, boolean>,
  selectedMap: MapConfig,
  frameCount: number,
  combo: AttackType | null,
  comboTextRef: React.MutableRefObject<{ text: string; x: number; y: number; timer: number; player: number }[]>,
  keyHistory: React.MutableRefObject<{
    player1: { key: string; time: number }[]
    player2: { key: string; time: number }[]
  }>,
  playerNumber: number,
  mapEffects: any,
): Player {
  let newPlayer = { ...player }

  // Handle victory state
  if (player.winner) {
    // Victory pose/animation logic
    if (player.stateTimer && player.stateTimer > 0) {
      newPlayer.stateTimer = player.stateTimer - 1
    }

    // Don't allow movement during victory animation
    return {
      ...newPlayer,
      velocityX: 0,
    }
  }

  // Apply friction
  newPlayer.velocityX *= selectedMap.friction

  // Movement with speed boost
  const playerSpeed = newPlayer.hasSpeedBoost ? MOVE_SPEED * 1.7 : MOVE_SPEED

  if (playerNumber === 1) {
    // Player 1 controls
    if (keys.a) {
      newPlayer.velocityX = -playerSpeed
      newPlayer.direction = -1
      newPlayer.lastKeyPressed = "a"
    }
    if (keys.d) {
      newPlayer.velocityX = playerSpeed
      newPlayer.direction = 1
      newPlayer.lastKeyPressed = "d"
    }

    // Jump with super jump
    const jumpForce = (newPlayer.hasSuperJump ? JUMP_FORCE * 1.5 : JUMP_FORCE) * (selectedMap.jumpMultiplier || 1.0)
    if (keys.w && !newPlayer.isJumping) {
      newPlayer.velocityY = -jumpForce
      newPlayer.isJumping = true
      newPlayer.onPlatform = false
      newPlayer.squash = 10 // Start squash animation
      newPlayer.lastKeyPressed = "w"
    }

    // Attack with rapid fire and combo system
    if (!newPlayer.isAttacking && newPlayer.attackCooldown <= 0) {
      if (combo) {
        // Perform combo attack
        newPlayer.isAttacking = true
        newPlayer.attackType = combo
        const attackProps = getAttackProperties(combo)
        newPlayer.attackFrame = 15
        newPlayer.attackCooldown = attackProps.cooldown
        newPlayer.comboCounter++

        // Add combo text
        comboTextRef.current.push({
          text: `${combo.toUpperCase()}!`,
          x: newPlayer.x,
          y: newPlayer.y - 100,
          timer: 45,
          player: 1,
        })

        // Clear used combo keys
        keyHistory.current.player1 = []
      } else if (keys.s) {
        // Regular punch
        newPlayer.isAttacking = true
        newPlayer.attackType = "punch"
        newPlayer.attackFrame = 10
        newPlayer.attackCooldown = newPlayer.hasRapidFire ? 10 : 20
        newPlayer.lastKeyPressed = "s"
        newPlayer.lastAttackTime = frameCount
      } else if (keys.f) {
        // Secondary attack key (can be used in combos)
        newPlayer.isAttacking = true
        newPlayer.attackType = "kick"
        newPlayer.attackFrame = 12
        newPlayer.attackCooldown = newPlayer.hasRapidFire ? 12 : 25
        newPlayer.lastKeyPressed = "f"
        newPlayer.lastAttackTime = frameCount
      }
    }
  } else {
    // Player 2 controls
    if (keys.ArrowLeft) {
      newPlayer.velocityX = -playerSpeed
      newPlayer.direction = -1
      newPlayer.lastKeyPressed = "ArrowLeft"
    }
    if (keys.ArrowRight) {
      newPlayer.velocityX = playerSpeed
      newPlayer.direction = 1
      newPlayer.lastKeyPressed = "ArrowRight"
    }

    // Jump with super jump
    const jumpForce = (newPlayer.hasSuperJump ? JUMP_FORCE * 1.5 : JUMP_FORCE) * (selectedMap.jumpMultiplier || 1.0)
    if (keys.ArrowUp && !newPlayer.isJumping) {
      newPlayer.velocityY = -jumpForce
      newPlayer.isJumping = true
      newPlayer.onPlatform = false
      newPlayer.squash = 10 // Start squash animation
      newPlayer.lastKeyPressed = "ArrowUp"
    }

    // Attack with rapid fire and combo system
    if (!newPlayer.isAttacking && newPlayer.attackCooldown <= 0) {
      if (combo) {
        // Perform combo attack
        newPlayer.isAttacking = true
        newPlayer.attackType = combo
        const attackProps = getAttackProperties(combo)
        newPlayer.attackFrame = 15
        newPlayer.attackCooldown = attackProps.cooldown
        newPlayer.comboCounter++

        // Add combo text
        comboTextRef.current.push({
          text: `${combo.toUpperCase()}!`,
          x: newPlayer.x,
          y: newPlayer.y - 100,
          timer: 45,
          player: 2,
        })

        // Clear used combo keys
        keyHistory.current.player2 = []
      } else if (keys.ArrowDown) {
        // Regular punch
        newPlayer.isAttacking = true
        newPlayer.attackType = "punch"
        newPlayer.attackFrame = 10
        newPlayer.attackCooldown = newPlayer.hasRapidFire ? 10 : 20
        newPlayer.lastKeyPressed = "ArrowDown"
        newPlayer.lastAttackTime = frameCount
      } else if (keys["/"]) {
        // Secondary attack key (can be used in combos)
        newPlayer.isAttacking = true
        newPlayer.attackType = "kick"
        newPlayer.attackFrame = 12
        newPlayer.attackCooldown = newPlayer.hasRapidFire ? 12 : 25
        newPlayer.lastKeyPressed = "/"
        newPlayer.lastAttackTime = frameCount
      }
    }
  }

  // Apply gravity and update positions
  newPlayer.velocityY += selectedMap.gravity
  newPlayer.y += newPlayer.velocityY
  newPlayer.x += newPlayer.velocityX

  // Check platform collisions
  const platformCollision = checkPlatformCollisions(newPlayer, selectedMap.platforms, frameCount)

  // Apply platform collisions
  if (platformCollision.onPlatform) {
    newPlayer.y = platformCollision.newY
    newPlayer.velocityY = 0
    newPlayer.isJumping = false
    newPlayer.onPlatform = true
    newPlayer.platformId = platformCollision.platformId
    newPlayer.velocityX += platformCollision.platformVelocityX // Apply platform movement
    if (newPlayer.squash <= 0) {
      newPlayer.squash = 5 // Landing squash
    }
  }

  // Ground collision
  if (newPlayer.y >= GROUND_Y) {
    newPlayer.y = GROUND_Y
    newPlayer.velocityY = 0
    newPlayer.isJumping = false
    if (newPlayer.squash <= 0) {
      newPlayer.squash = 5 // Landing squash
    }
  }

  // Check hazard collisions
  const hazardDamage = checkHazardCollisions(newPlayer, selectedMap.hazards)
  if (hazardDamage > 0 && frameCount % 30 === 0) {
    newPlayer.health -= hazardDamage
    newPlayer.hitReaction = 5
  }

  // Apply map-specific effects
  if (selectedMap.applyMapEffects) {
    newPlayer = selectedMap.applyMapEffects(newPlayer, frameCount, mapEffects)
  }

  // Update squash animation
  if (newPlayer.squash > 0) {
    newPlayer.squash -= 1
  }

  // Canvas boundaries
  newPlayer.x = Math.max(PLAYER_WIDTH / 2, Math.min(newPlayer.x, CANVAS_WIDTH - PLAYER_WIDTH / 2))

  // Update attack frames
  if (newPlayer.isAttacking && newPlayer.attackFrame > 0) {
    newPlayer.attackFrame--
    if (newPlayer.attackFrame === 0) {
      newPlayer.isAttacking = false
    }
  }

  // Update hit reaction
  if (newPlayer.hitReaction > 0) {
    newPlayer.hitReaction--
  }

  // Update cooldowns
  if (newPlayer.attackCooldown > 0) {
    newPlayer.attackCooldown--
  }

  // Combo decay - if no hit lands within the combo window, reset the combo
  if (newPlayer.comboCounter > 0 && frameCount - newPlayer.lastAttackTime > 120) {
    newPlayer.comboCounter = 0
  }

  // Update special state timers
  if (newPlayer.frozen && newPlayer.frozen > 0) {
    newPlayer.frozen--
  }

  if (newPlayer.burning && newPlayer.burning > 0) {
    newPlayer.burning--
    // Burning causes damage over time
    if (frameCount % 30 === 0) {
      newPlayer.health -= 1
    }
  }

  if (newPlayer.stunned && newPlayer.stunned > 0) {
    newPlayer.stunned--
  }

  return newPlayer
}
