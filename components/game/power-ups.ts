import { type PowerUp, type Player, POWERUP_DURATION, CANVAS_WIDTH, GROUND_Y } from "./constants"

// Process power-up collection
export const processPowerUpCollection = (player: Player, powerUp: PowerUp): Player => {
  const newPlayer = { ...player }

  switch (powerUp.type) {
    case "speed":
      newPlayer.hasSpeedBoost = true
      newPlayer.speedBoostTimer = POWERUP_DURATION
      break
    case "jump":
      newPlayer.hasSuperJump = true
      newPlayer.superJumpTimer = POWERUP_DURATION
      break
    case "giant":
      newPlayer.hasGiantMode = true
      newPlayer.giantModeTimer = POWERUP_DURATION
      break
    case "shield":
      newPlayer.hasShield = true
      newPlayer.shieldTimer = POWERUP_DURATION
      break
    case "rapidFire":
      newPlayer.hasRapidFire = true
      newPlayer.rapidFireTimer = POWERUP_DURATION
      break
  }

  return newPlayer
}

// Update power-up timers
export const updatePowerUpTimers = (player: Player): Player => {
  const newPlayer = { ...player }

  if (newPlayer.hasSpeedBoost) {
    newPlayer.speedBoostTimer--
    if (newPlayer.speedBoostTimer <= 0) {
      newPlayer.hasSpeedBoost = false
    }
  }

  if (newPlayer.hasSuperJump) {
    newPlayer.superJumpTimer--
    if (newPlayer.superJumpTimer <= 0) {
      newPlayer.hasSuperJump = false
    }
  }

  if (newPlayer.hasGiantMode) {
    newPlayer.giantModeTimer--
    if (newPlayer.giantModeTimer <= 0) {
      newPlayer.hasGiantMode = false
    }
  }

  if (newPlayer.hasShield) {
    newPlayer.shieldTimer--
    if (newPlayer.shieldTimer <= 0) {
      newPlayer.hasShield = false
    }
  }

  if (newPlayer.hasRapidFire) {
    newPlayer.rapidFireTimer--
    if (newPlayer.rapidFireTimer <= 0) {
      newPlayer.hasRapidFire = false
    }
  }

  return newPlayer
}

// Generate a random power-up
export const generateRandomPowerUp = (canvasWidth: number, groundY: number): PowerUp => {
  const types: ("speed" | "jump" | "giant" | "shield" | "rapidFire")[] = [
    "speed",
    "jump",
    "giant",
    "shield",
    "rapidFire",
  ]
  const randomType = types[Math.floor(Math.random() * types.length)]
  const randomX = Math.random() * (canvasWidth - 100) + 50

  return {
    x: randomX,
    y: groundY - 30,
    type: randomType,
    active: true,
    collectAnimation: 0,
  }
}

// Update power-ups (spawn, collect, update timers)
export const updatePowerUps = (
  powerUps: PowerUp[],
  player1: Player,
  player2: Player,
  frameCount: number,
  spawnRate: number,
): { powerUps: PowerUp[]; player1: Player; player2: Player } => {
  let newPowerUps = [...powerUps]
  let newPlayer1 = { ...player1 }
  let newPlayer2 = { ...player2 }

  // Spawn new power-ups randomly
  if (Math.random() < spawnRate) {
    newPowerUps.push(generateRandomPowerUp(CANVAS_WIDTH, GROUND_Y))
  }

  // Check for power-up collections and update active power-ups
  newPowerUps = newPowerUps.filter((powerUp) => {
    // Skip inactive power-ups
    if (!powerUp.active) return false

    // Check if player 1 collected the power-up
    const player1Distance = Math.sqrt(Math.pow(newPlayer1.x - powerUp.x, 2) + Math.pow(newPlayer1.y - powerUp.y, 2))
    if (player1Distance < 30) {
      newPlayer1 = processPowerUpCollection(newPlayer1, powerUp)
      return false // Remove the power-up
    }

    // Check if player 2 collected the power-up
    const player2Distance = Math.sqrt(Math.pow(newPlayer2.x - powerUp.x, 2) + Math.pow(newPlayer2.y - powerUp.y, 2))
    if (player2Distance < 30) {
      newPlayer2 = processPowerUpCollection(newPlayer2, powerUp)
      return false // Remove the power-up
    }

    // Keep active power-ups
    return true
  })

  // Update power-up timers for both players
  newPlayer1 = updatePowerUpTimers(newPlayer1)
  newPlayer2 = updatePowerUpTimers(newPlayer2)

  return { powerUps: newPowerUps, player1: newPlayer1, player2: newPlayer2 }
}
