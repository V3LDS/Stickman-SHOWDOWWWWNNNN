import type React from "react"
import { type AttackType, type Player, ATTACK_DAMAGE, ATTACK_RANGE } from "./constants"

// Get attack properties
export const getAttackProperties = (type: AttackType) => {
  switch (type) {
    case "punch":
      return { damage: ATTACK_DAMAGE, range: ATTACK_RANGE, cooldown: 20, knockback: 20 }
    case "kick":
      return { damage: ATTACK_DAMAGE * 1.5, range: ATTACK_RANGE * 1.2, cooldown: 25, knockback: 30 }
    case "uppercut":
      return { damage: ATTACK_DAMAGE * 1.2, range: ATTACK_RANGE * 0.8, cooldown: 22, knockback: 15 }
    case "slam":
      return { damage: ATTACK_DAMAGE * 2, range: ATTACK_RANGE * 1.5, cooldown: 35, knockback: 40 }
    case "special":
      return { damage: ATTACK_DAMAGE * 2.5, range: ATTACK_RANGE * 2, cooldown: 50, knockback: 50 }
    default:
      return { damage: ATTACK_DAMAGE, range: ATTACK_RANGE, cooldown: 20, knockback: 20 }
  }
}

// Check for combos
export const checkCombos = (playerKeys: { key: string; time: number }[], currentTime: number): AttackType | null => {
  // Filter for recent key presses
  const comboWindow = 20 // Frames to perform a combo
  const recentKeys = playerKeys.filter((k) => currentTime - k.time < comboWindow)

  if (recentKeys.length < 2) return null

  // Get the sequence of keys
  const keySequence = recentKeys.map((k) => k.key).join("")

  // Check for specific combos

  // Triple attack combo (S+S+S)
  if (
    keySequence.endsWith("sss") ||
    (keySequence.endsWith("ss") &&
      playerKeys.filter((k) => k.key === "s" && currentTime - k.time < comboWindow * 3).length >= 3)
  ) {
    return "slam"
  }

  // Double punch becomes kick (S+S)
  if (keySequence.endsWith("ss")) return "kick"

  // Punch + secondary attack (S+F or F+S)
  if (keySequence.endsWith("sf") || keySequence.endsWith("fs")) return "uppercut"

  // Forward + Attack (D+S or A+S) - direction-based attacks
  if (keySequence.endsWith("ds")) return "uppercut"
  if (keySequence.endsWith("as")) return "kick"

  // Jump + Attack (W+S) - aerial attack
  if (keySequence.endsWith("ws")) return "slam"

  // Special key
  if (keySequence.includes("e")) return "special"

  return null
}

// Check for player 2 combos
export const checkCombosP2 = (playerKeys: { key: string; time: number }[], currentTime: number): AttackType | null => {
  // Filter for recent key presses
  const comboWindow = 20 // Frames to perform a combo
  const recentKeys = playerKeys.filter((k) => currentTime - k.time < comboWindow)

  if (recentKeys.length < 2) return null

  // Get the sequence of keys
  const keySequence = recentKeys.map((k) => k.key).join("")

  // Check for specific combos

  // Triple attack combo
  if (
    keySequence.endsWith("ArrowDownArrowDownArrowDown") ||
    (keySequence.endsWith("ArrowDownArrowDown") &&
      playerKeys.filter((k) => k.key === "ArrowDown" && currentTime - k.time < comboWindow * 3).length >= 3)
  ) {
    return "slam"
  }

  // Double punch becomes kick
  if (keySequence.endsWith("ArrowDownArrowDown")) return "kick"

  // Punch + secondary attack
  if (keySequence.endsWith("ArrowDown/") || keySequence.endsWith("/ArrowDown")) return "uppercut"

  // Direction + Attack
  if (keySequence.endsWith("ArrowRightArrowDown")) return "uppercut"
  if (keySequence.endsWith("ArrowLeftArrowDown")) return "kick"

  // Jump + Attack
  if (keySequence.endsWith("ArrowUpArrowDown")) return "slam"

  // Special key
  if (keySequence.includes(".")) return "special"

  return null
}

// Handle attacks between players
export const handleAttacks = (
  player1: Player,
  player2: Player,
  frameCount: number,
  comboTextRef: React.MutableRefObject<{ text: string; x: number; y: number; timer: number; player: number }[]>,
) => {
  let newPlayer1 = { ...player1 }
  let newPlayer2 = { ...player2 }

  // Process player 1 attacking player 2
  if (player1.isAttacking) {
    newPlayer2 = processAttack(player1, player2, frameCount, comboTextRef, 1)
  }

  // Process player 2 attacking player 1
  if (player2.isAttacking) {
    newPlayer1 = processAttack(player2, player1, frameCount, comboTextRef, 2)
  }

  return { player1: newPlayer1, player2: newPlayer2 }
}

// Process attack collision and damage
export const processAttack = (
  attacker: Player,
  defender: Player,
  frameCount: number,
  comboTextRef: React.MutableRefObject<{ text: string; x: number; y: number; timer: number; player: number }[]>,
  attackerNumber: number,
) => {
  if (!attacker.isAttacking || attacker.attackFrame !== 5 || defender.hasShield) {
    return defender
  }

  const newDefender = { ...defender }

  // Get attack properties
  const attackProps = getAttackProperties(attacker.attackType)

  // Improved hit box detection
  const attackerWidth = attacker.hasGiantMode ? 45 : 30
  const defenderWidth = defender.hasGiantMode ? 45 : 30

  // Calculate attack reach based on attack type
  const attackReach = attackProps.range + (attacker.hasGiantMode ? 20 : 0)

  // Calculate horizontal distance between players
  const horizontalDistance = Math.abs(attacker.x - defender.x)

  // Calculate vertical alignment (for uppercut and slam attacks)
  const verticalAlignment = attacker.y - defender.y
  const inVerticalRange =
    (attacker.attackType === "uppercut" && verticalAlignment > -80 && verticalAlignment < 0) ||
    (attacker.attackType === "slam" && Math.abs(verticalAlignment) < 60) ||
    (attacker.attackType !== "uppercut" && attacker.attackType !== "slam")

  // Check if attack connects based on direction and distance
  const facingCorrectDirection =
    (attacker.direction === 1 && attacker.x < defender.x) || (attacker.direction === -1 && attacker.x > defender.x)

  const inRange = horizontalDistance < attackerWidth / 2 + defenderWidth / 2 + attackReach

  if (inRange && facingCorrectDirection && inVerticalRange) {
    const damage = attacker.hasGiantMode ? attackProps.damage * 1.5 : attackProps.damage

    // Apply combo multiplier if player has consecutive hits
    const comboMultiplier = Math.min(1 + attacker.comboCounter * 0.1, 2.0)
    const finalDamage = damage * comboMultiplier

    newDefender.health -= finalDamage

    // Knockback
    newDefender.velocityY = attacker.attackType === "uppercut" ? -8 : -5
    newDefender.velocityX = attacker.direction * attackProps.knockback * 0.2
    newDefender.hitReaction = 15 // Start hit reaction

    // Add hit text
    comboTextRef.current.push({
      text: `-${Math.round(finalDamage)}`,
      x: defender.x,
      y: defender.y - 80,
      timer: 30,
      player: attackerNumber === 1 ? 2 : 1,
    })

    // Add combo counter if combo > 1
    if (attacker.comboCounter > 1) {
      comboTextRef.current.push({
        text: `${attacker.comboCounter}x COMBO!`,
        x: attacker.x,
        y: attacker.y - 100,
        timer: 45,
        player: attackerNumber,
      })
    }
  }

  return newDefender
}
