import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER1_COLOR,
  PLAYER2_COLOR,
  POWERUP_COLORS,
  type AttackType,
  type Player,
  type PowerUp,
} from "./constants"
import type { MapConfig } from "./maps"

// Update the GROUND_Y constant at the top of the file
const GROUND_Y = 550 // Updated from 300 to match the new GROUND_Y in constants.ts

// Draw a stickman
export const drawStickman = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  direction: number,
  isAttacking: boolean,
  attackType: AttackType,
  isWinner: boolean,
  hitReaction: number,
  squash: number,
  isGiant: boolean,
  hasShield: boolean,
  frameCount: number,
  specialEffects?: {
    burning?: boolean
    frozen?: boolean
    electrified?: boolean
    poisoned?: boolean
    possessed?: boolean
  },
) => {
  ctx.save()

  // Apply squash and stretch effect
  let squashFactor = 1
  let stretchFactor = 1

  if (squash > 0) {
    squashFactor = 1 - (squash / 20) * 0.3
    stretchFactor = 1 + (squash / 20) * 0.3
  }

  // Apply giant mode scaling
  const scale = isGiant ? 1.5 : 1

  ctx.translate(x, y)
  ctx.scale(direction * scale, scale)

  // Apply squash and stretch
  ctx.scale(stretchFactor, squashFactor)

  // Draw shield if active
  if (hasShield) {
    ctx.beginPath()
    ctx.arc(0, -40, 40, 0, Math.PI * 2)
    ctx.fillStyle = "rgba(245, 158, 11, 0.3)" // amber with transparency
    ctx.fill()
    ctx.strokeStyle = "rgba(245, 158, 11, 0.8)"
    ctx.lineWidth = 2
    ctx.stroke()
  }

  // Apply special effects to color
  let bodyColor = color
  if (specialEffects) {
    if (specialEffects.burning) {
      bodyColor = `hsl(${frameCount % 60}, 100%, 50%)`
    } else if (specialEffects.frozen) {
      bodyColor = "#93c5fd" // blue-300
    } else if (specialEffects.electrified) {
      bodyColor = frameCount % 10 < 5 ? "#fbbf24" : "#f59e0b" // amber flashing
    } else if (specialEffects.poisoned) {
      bodyColor = "#84cc16" // lime-500
    } else if (specialEffects.possessed) {
      bodyColor = "#7c3aed" // purple-600
    }
  }

  // Head with hit reaction or winner animation
  ctx.beginPath()
  if (hitReaction > 0) {
    // Dizzy head for hit reaction
    const wobble = Math.sin(hitReaction) * 3
    ctx.arc(wobble, -60 + Math.sin(hitReaction * 2) * 2, 15, 0, Math.PI * 2)
  } else if (isWinner) {
    // Bouncing head for winner
    ctx.arc(0, -60 + Math.sin(frameCount * 0.2) * 3, 15, 0, Math.PI * 2)
  } else {
    ctx.arc(0, -60, 15, 0, Math.PI * 2)
  }
  ctx.fillStyle = bodyColor
  ctx.fill()
  ctx.stroke()

  // Body
  ctx.beginPath()
  ctx.moveTo(0, -45)
  if (isAttacking) {
    // Leaning body during attack
    const leanAmount = attackType === "uppercut" ? 10 : attackType === "slam" ? 15 : attackType === "special" ? 20 : 5
    ctx.lineTo(direction * leanAmount, -10)
  } else if (hitReaction > 0) {
    // Wobbly body during hit reaction
    ctx.lineTo(Math.sin(hitReaction * 0.5) * 5, -10)
  } else {
    ctx.lineTo(0, -10)
  }
  ctx.strokeStyle = bodyColor
  ctx.lineWidth = 3
  ctx.stroke()

  // Arms based on attack type
  if (isAttacking) {
    switch (attackType) {
      case "punch":
        // Regular punch
        ctx.beginPath()
        ctx.moveTo(0, -35)
        ctx.lineTo(-15, -25)
        ctx.stroke()

        // Attacking arm with animation
        ctx.beginPath()
        ctx.moveTo(0, -35)
        const punchExtension = 30 + Math.sin(frameCount * 0.5) * 5
        ctx.lineTo(punchExtension, -20)
        ctx.stroke()
        break

      case "kick":
        // Kick animation
        ctx.beginPath()
        ctx.moveTo(0, -35)
        ctx.lineTo(-15, -25)
        ctx.stroke()

        // Arms up for balance
        ctx.beginPath()
        ctx.moveTo(0, -35)
        ctx.lineTo(15, -45)
        ctx.stroke()

        // Kicking leg
        ctx.beginPath()
        ctx.moveTo(0, -10)
        ctx.lineTo(-15, 0)
        ctx.stroke()

        // Extended kicking leg
        ctx.beginPath()
        ctx.moveTo(0, -10)
        const kickExtension = 35 + Math.sin(frameCount * 0.5) * 5
        ctx.lineTo(kickExtension, -15)
        ctx.stroke()
        break

      case "uppercut":
        // Uppercut animation
        ctx.beginPath()
        ctx.moveTo(0, -35)
        ctx.lineTo(-15, -25)
        ctx.stroke()

        // Uppercut arm
        ctx.beginPath()
        ctx.moveTo(0, -35)
        ctx.lineTo(20, -50 - Math.sin(frameCount * 0.5) * 5)
        ctx.stroke()
        break

      case "slam":
        // Slam animation - both arms raised
        ctx.beginPath()
        ctx.moveTo(0, -35)
        ctx.lineTo(-20, -50)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(0, -35)
        ctx.lineTo(20, -50)
        ctx.stroke()

        // Slam effect
        if (frameCount % 4 < 2) {
          ctx.beginPath()
          ctx.arc(0, 0, 30, 0, Math.PI * 2)
          ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
          ctx.fill()
        }
        break

      case "special":
        // Special move animation - energy gathering
        ctx.beginPath()
        ctx.moveTo(0, -35)
        ctx.lineTo(-25, -40)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(0, -35)
        ctx.lineTo(25, -40)
        ctx.stroke()

        // Energy effect
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + frameCount * 0.1
          const radius = 30 + Math.sin(frameCount * 0.2) * 5
          ctx.beginPath()
          ctx.moveTo(0, -30)
          ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius - 30)
          ctx.strokeStyle = "rgba(255, 255, 255, 0.7)"
          ctx.stroke()
          ctx.strokeStyle = bodyColor
        }
        break

      default:
        // Default attack animation
        ctx.beginPath()
        ctx.moveTo(0, -35)
        ctx.lineTo(-15, -25)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(0, -35)
        ctx.lineTo(30, -20)
        ctx.stroke()
    }
  } else if (hitReaction > 0) {
    // Flailing arms during hit reaction
    ctx.beginPath()
    ctx.moveTo(0, -35)
    ctx.lineTo(-15 + Math.sin(hitReaction) * 5, -25 + Math.cos(hitReaction) * 5)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, -35)
    ctx.lineTo(15 + Math.cos(hitReaction) * 5, -25 + Math.sin(hitReaction) * 5)
    ctx.stroke()
  } else if (isWinner) {
    // Victory arm pumping
    ctx.beginPath()
    ctx.moveTo(0, -35)
    ctx.lineTo(-15, -25)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, -35)
    ctx.lineTo(15, -40 + Math.sin(frameCount * 0.2) * 10)
    ctx.stroke()
  } else {
    // Normal arms with slight swinging animation
    ctx.beginPath()
    ctx.moveTo(0, -35)
    ctx.lineTo(-15 + Math.sin(frameCount * 0.05) * 2, -25 + Math.cos(frameCount * 0.05) * 2)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, -35)
    ctx.lineTo(15 + Math.cos(frameCount * 0.05) * 2, -25 + Math.sin(frameCount * 0.05) * 2)
    ctx.stroke()
  }

  // Legs
  if (isAttacking && attackType === "kick") {
    // Already drawn in the kick animation
  } else if (hitReaction > 0) {
    // Wobbly legs during hit reaction
    ctx.beginPath()
    ctx.moveTo(0, -10)
    ctx.lineTo(-15 + Math.sin(hitReaction * 0.7) * 5, 0)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, -10)
    ctx.lineTo(15 + Math.cos(hitReaction * 0.7) * 5, 0)
    ctx.stroke()
  } else if (isWinner) {
    // Victory dance legs
    ctx.beginPath()
    ctx.moveTo(0, -10)
    ctx.lineTo(-15 + Math.sin(frameCount * 0.2) * 5, 0)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, -10)
    ctx.lineTo(15 + Math.cos(frameCount * 0.2) * 5, 0)
    ctx.stroke()
  } else {
    // Normal legs
    ctx.beginPath()
    ctx.moveTo(0, -10)
    ctx.lineTo(-15, 0)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, -10)
    ctx.lineTo(15, 0)
    ctx.stroke()
  }

  // Winner crown
  if (isWinner) {
    ctx.beginPath()
    ctx.moveTo(-10, -80 + Math.sin(frameCount * 0.2) * 2)
    ctx.lineTo(10, -80 + Math.sin(frameCount * 0.2) * 2)
    ctx.lineTo(15, -75 + Math.sin(frameCount * 0.2) * 2)
    ctx.lineTo(5, -70 + Math.sin(frameCount * 0.2) * 2)
    ctx.lineTo(-5, -70 + Math.sin(frameCount * 0.2) * 2)
    ctx.lineTo(-15, -75 + Math.sin(frameCount * 0.2) * 2)
    ctx.closePath()
    ctx.fillStyle = "#fbbf24" // amber
    ctx.fill()
    ctx.stroke()
  }

  // Face
  if (hitReaction > 0) {
    // Dizzy eyes
    ctx.beginPath()
    ctx.moveTo(-8 * direction, -65)
    ctx.lineTo(-2 * direction, -61)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(-8 * direction, -61)
    ctx.lineTo(-2 * direction, -65)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(8 * direction, -65)
    ctx.lineTo(2 * direction, -61)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(8 * direction, -61)
    ctx.lineTo(2 * direction, -65)
    ctx.stroke()
  } else if (specialEffects?.possessed) {
    // Possessed eyes (glowing)
    ctx.beginPath()
    ctx.arc(-5 * direction, -63, 3, 0, Math.PI * 2)
    ctx.fillStyle = "#f43f5e" // rose-500
    ctx.fill()

    ctx.beginPath()
    ctx.arc(5 * direction, -63, 3, 0, Math.PI * 2)
    ctx.fill()
  } else {
    // Normal eyes
    ctx.beginPath()
    ctx.arc(-5 * direction, -63, 2, 0, Math.PI * 2)
    ctx.fillStyle = "#000"
    ctx.fill()

    ctx.beginPath()
    ctx.arc(5 * direction, -63, 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // Mouth based on state
  if (isWinner) {
    // Happy mouth
    ctx.beginPath()
    ctx.arc(0, -55, 5, 0, Math.PI)
    ctx.stroke()
  } else if (isAttacking) {
    // Different expressions based on attack type
    switch (attackType) {
      case "punch":
        // Angry mouth
        ctx.beginPath()
        ctx.moveTo(-5, -55)
        ctx.lineTo(5, -55)
        ctx.stroke()
        break

      case "kick":
        // Focused mouth
        ctx.beginPath()
        ctx.moveTo(-5, -55)
        ctx.lineTo(5, -55)
        ctx.stroke()

        // Focused eyebrows
        ctx.beginPath()
        ctx.moveTo(-8, -68)
        ctx.lineTo(-2, -66)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(8, -68)
        ctx.lineTo(2, -66)
        ctx.stroke()
        break

      case "uppercut":
        // Determined mouth
        ctx.beginPath()
        ctx.moveTo(-5, -53)
        ctx.lineTo(5, -57)
        ctx.stroke()
        break

      case "slam":
        // Shouting mouth
        ctx.beginPath()
        ctx.arc(0, -55, 4, 0, Math.PI * 2)
        ctx.stroke()
        break

      case "special":
        // Intense expression
        ctx.beginPath()
        ctx.moveTo(-5, -53)
        ctx.lineTo(0, -57)
        ctx.lineTo(5, -53)
        ctx.stroke()
        break

      default:
        // Default angry mouth
        ctx.beginPath()
        ctx.moveTo(-5, -55)
        ctx.lineTo(5, -55)
        ctx.stroke()
    }

    // Angry eyebrows for all attacks
    ctx.beginPath()
    ctx.moveTo(-8, -68)
    ctx.lineTo(-2, -66)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(8, -68)
    ctx.lineTo(2, -66)
    ctx.stroke()
  } else if (hitReaction > 0) {
    // Shocked mouth
    ctx.beginPath()
    ctx.arc(0, -55, 3, 0, Math.PI * 2)
    ctx.stroke()
  } else if (specialEffects?.frozen) {
    // Frozen mouth (straight line)
    ctx.beginPath()
    ctx.moveTo(-5, -55)
    ctx.lineTo(5, -55)
    ctx.stroke()

    // Add ice crystals
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.moveTo(-10 + i * 10, -70)
      ctx.lineTo(-5 + i * 10, -75)
      ctx.lineTo(0 + i * 10, -70)
      ctx.strokeStyle = "#e0f2fe" // sky-100
      ctx.stroke()
      ctx.strokeStyle = bodyColor
    }
  } else if (specialEffects?.burning) {
    // Burning mouth (open in pain)
    ctx.beginPath()
    ctx.arc(0, -55, 4, 0, Math.PI * 2)
    ctx.stroke()

    // Add flame particles
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.moveTo(-10 + i * 5, -70)
      ctx.lineTo(-8 + i * 5, -80 - Math.sin(frameCount * 0.2 + i) * 5)
      ctx.strokeStyle = `hsl(${(frameCount * 5 + i * 20) % 60}, 100%, 50%)`
      ctx.stroke()
      ctx.strokeStyle = bodyColor
    }
  } else {
    // Normal mouth
    ctx.beginPath()
    ctx.moveTo(-5, -55)
    ctx.lineTo(5, -55)
    ctx.stroke()
  }

  // Special effect overlays
  if (specialEffects) {
    if (specialEffects.electrified && frameCount % 10 < 5) {
      // Electric sparks
      for (let i = 0; i < 5; i++) {
        const angle = Math.random() * Math.PI * 2
        const length = 10 + Math.random() * 20
        ctx.beginPath()
        ctx.moveTo(0, -30)
        ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length - 30)
        ctx.strokeStyle = "#fbbf24" // amber-400
        ctx.stroke()
      }
    }

    if (specialEffects.poisoned) {
      // Poison bubbles
      for (let i = 0; i < 3; i++) {
        const offset = (frameCount * 0.1 + i * 2) % 20
        ctx.beginPath()
        ctx.arc(-10 + i * 10, -70 - offset, 3, 0, Math.PI * 2)
        ctx.fillStyle = "#84cc16" // lime-500
        ctx.fill()
      }
    }
  }

  ctx.restore()
}

// Add this function to draw victory banners
function drawVictoryBanner(ctx: CanvasRenderingContext2D, winner: number | null, gameOverFrameCount = 0) {
  if (winner === null) return

  // Make the banner pulse/animate
  const pulseScale = 1 + Math.sin(gameOverFrameCount * 0.1) * 0.05

  const bannerWidth = 500 * pulseScale
  const bannerHeight = 120 * pulseScale
  const bannerX = (CANVAS_WIDTH - bannerWidth) / 2
  const bannerY = 50

  // Draw banner background with glow effect
  ctx.shadowColor = winner === 1 ? "#0066ff" : "#ff3333"
  ctx.shadowBlur = 15 + Math.sin(gameOverFrameCount * 0.2) * 5
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0

  // Draw banner background
  ctx.fillStyle = winner === 1 ? "rgba(0, 100, 255, 0.8)" : "rgba(255, 50, 50, 0.8)"
  ctx.fillRect(bannerX, bannerY, bannerWidth, bannerHeight)

  // Draw banner border
  ctx.strokeStyle = winner === 1 ? "#00ffff" : "#ffcc00"
  ctx.lineWidth = 5
  ctx.strokeRect(bannerX, bannerY, bannerWidth, bannerHeight)

  // Reset shadow
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0

  // Draw victory text with pulsing effect
  const textSize = 48 + Math.sin(gameOverFrameCount * 0.2) * 4
  ctx.font = `bold ${textSize}px Arial`
  ctx.fillStyle = "#ffffff"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(`PLAYER ${winner} WINS!`, CANVAS_WIDTH / 2, bannerY + bannerHeight / 2)

  // Draw stars or decorations
  const starCount = 5
  const starRadius = 15 + Math.sin(gameOverFrameCount * 0.15) * 2
  ctx.fillStyle = "#ffff00"

  for (let i = 0; i < starCount; i++) {
    const starX = bannerX + (bannerWidth / (starCount + 1)) * (i + 1)
    const starY = bannerY - 20
    drawStar(ctx, starX, starY, 5, starRadius, starRadius / 2)

    const bottomStarY = bannerY + bannerHeight + 20
    drawStar(ctx, starX, bottomStarY, 5, starRadius, starRadius / 2)
  }
}

// Helper function to draw a star
function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number,
) {
  let rot = (Math.PI / 2) * 3
  let x = cx
  let y = cy
  const step = Math.PI / spikes

  ctx.beginPath()
  ctx.moveTo(cx, cy - outerRadius)

  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius
    y = cy + Math.sin(rot) * outerRadius
    ctx.lineTo(x, y)
    rot += step

    x = cx + Math.cos(rot) * innerRadius
    y = cy + Math.sin(rot) * innerRadius
    ctx.lineTo(x, y)
    rot += step
  }

  ctx.lineTo(cx, cy - outerRadius)
  ctx.closePath()
  ctx.fill()
}

// Draw the game
export const drawGame = (
  ctx: CanvasRenderingContext2D,
  selectedMap: MapConfig,
  player1: Player,
  player2: Player,
  powerUps: PowerUp[],
  frameCount: number,
  comboTextRef: { text: string; x: number; y: number; timer: number; player: number }[],
  gameOver: boolean,
  winner: number | null,
  mapEffects: any,
  gameOverFrameCount = 0,
) => {
  // Clear canvas
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Draw background
  ctx.fillStyle = selectedMap.background
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Draw map-specific background effects
  if (selectedMap.drawMapEffects) {
    selectedMap.drawMapEffects(ctx, frameCount, mapEffects)
  }

  // Draw platforms
  ctx.fillStyle = "#6b7280"
  for (const platform of selectedMap.platforms) {
    // For haunted mansion, make platforms appear and disappear
    if (selectedMap.specialFeature === "haunted") {
      // Each platform has its own cycle
      const platformIndex = selectedMap.platforms.indexOf(platform)
      const cycleOffset = platformIndex * 60
      const isVisible = (frameCount + cycleOffset) % 180 < 120

      if (!isVisible) continue

      // Fade in/out effect
      const cyclePosition = (frameCount + cycleOffset) % 180
      let alpha = 1

      if (cyclePosition < 20) {
        // Fade in
        alpha = cyclePosition / 20
      } else if (cyclePosition >= 100 && cyclePosition < 120) {
        // Fade out
        alpha = 1 - (cyclePosition - 100) / 20
      }

      ctx.globalAlpha = alpha
    }

    // For moving platforms, calculate position
    let platformX = platform.x
    if (platform.moving && platform.speed && platform.range && platform.startX) {
      platformX = platform.startX + (Math.sin(frameCount * 0.02 * platform.speed) * platform.range) / 2
    }

    ctx.fillRect(platformX, platform.y, platform.width, platform.height)

    // Platform shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)"
    ctx.fillRect(platformX, platform.y + platform.height, platform.width, 5)
    ctx.fillStyle = "#6b7280"

    // Reset alpha
    ctx.globalAlpha = 1
  }

  // Draw environmental objects
  if (selectedMap.environmentalObjects) {
    for (const obj of selectedMap.environmentalObjects) {
      switch (obj.type) {
        case "billboard":
          ctx.fillStyle = "#64748b" // slate-500
          ctx.fillRect(obj.x, obj.y, obj.width, obj.height)
          // Add details
          ctx.fillStyle = "#94a3b8" // slate-400
          ctx.fillRect(obj.x + 5, obj.y + 5, obj.width - 10, obj.height - 10)
          break

        case "antenna":
          ctx.strokeStyle = "#94a3b8" // slate-400
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(obj.x, obj.y + obj.height)
          ctx.lineTo(obj.x, obj.y)
          ctx.stroke()
          // Add antenna details
          ctx.beginPath()
          ctx.moveTo(obj.x, obj.y + 20)
          ctx.lineTo(obj.x + 10, obj.y + 10)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(obj.x, obj.y + 40)
          ctx.lineTo(obj.x - 10, obj.y + 30)
          ctx.stroke()
          break

        case "palm":
          // Tree trunk
          ctx.fillStyle = "#92400e" // amber-800
          ctx.fillRect(obj.x + obj.width / 2 - 5, obj.y, 10, obj.height)
          // Palm leaves
          ctx.fillStyle = "#16a34a" // green-600
          ctx.beginPath()
          ctx.ellipse(obj.x + obj.width / 2, obj.y, obj.width / 2, 20, 0, 0, Math.PI * 2)
          ctx.fill()
          break

        case "satellite":
          // Main body
          ctx.fillStyle = "#94a3b8" // slate-400
          ctx.fillRect(obj.x, obj.y, obj.width, obj.height)
          // Solar panels
          ctx.fillStyle = "#3b82f6" // blue-500
          ctx.fillRect(obj.x - 20, obj.y + 10, 15, 20)
          ctx.fillRect(obj.x + obj.width + 5, obj.y + 10, 15, 20)
          break

        case "asteroid":
          ctx.fillStyle = "#6b7280" // gray-500
          ctx.beginPath()
          ctx.arc(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width / 2, 0, Math.PI * 2)
          ctx.fill()
          // Crater details
          ctx.fillStyle = "#4b5563" // gray-600
          ctx.beginPath()
          ctx.arc(obj.x + obj.width / 3, obj.y + obj.height / 3, obj.width / 6, 0, Math.PI * 2)
          ctx.fill()
          break

        case "gear":
          ctx.fillStyle = "#78716c" // stone-500
          ctx.beginPath()
          ctx.arc(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width / 2, 0, Math.PI * 2)
          ctx.fill()
          // Gear teeth
          ctx.fillStyle = "#57534e" // stone-600
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + frameCount * 0.01
            const x = obj.x + obj.width / 2 + Math.cos(angle) * (obj.width / 2 + 5)
            const y = obj.y + obj.height / 2 + Math.sin(angle) * (obj.height / 2 + 5)
            ctx.beginPath()
            ctx.arc(x, y, 5, 0, Math.PI * 2)
            ctx.fill()
          }
          break

        case "ghost":
          // Only show ghost sometimes for spooky effect
          if (frameCount % 180 < 90) {
            const alpha = Math.sin(((frameCount % 90) / 90) * Math.PI) * 0.7
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
            // Ghost body
            ctx.beginPath()
            ctx.arc(obj.x + obj.width / 2, obj.y + obj.height / 3, obj.width / 2, Math.PI, 0)
            ctx.lineTo(obj.x + obj.width, obj.y + obj.height)
            ctx.lineTo(obj.x + obj.width * 0.7, obj.y + obj.height * 0.8)
            ctx.lineTo(obj.x + obj.width * 0.3, obj.y + obj.height * 0.8)
            ctx.lineTo(obj.x, obj.y + obj.height)
            ctx.closePath()
            ctx.fill()
            // Ghost eyes
            ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`
            ctx.lineTo(obj.x, obj.y + obj.height)
            ctx.closePath()
            ctx.fill()
            // Ghost eyes
            ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`
            ctx.beginPath()
            ctx.arc(obj.x + obj.width / 3, obj.y + obj.height / 3, 3, 0, Math.PI * 2)
            ctx.fill()
            ctx.beginPath()
            ctx.arc(obj.x + (obj.width * 2) / 3, obj.y + obj.height / 3, 3, 0, Math.PI * 2)
            ctx.fill()
          }
          break

        case "coral":
          ctx.fillStyle = "#ec4899" // pink-500
          // Draw coral branches
          ctx.beginPath()
          ctx.moveTo(obj.x + obj.width / 2, obj.y + obj.height)
          ctx.lineTo(obj.x + obj.width / 2, obj.y + obj.height / 2)
          ctx.lineTo(obj.x + obj.width, obj.y)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(obj.x + obj.width / 2, obj.y + obj.height / 2)
          ctx.lineTo(obj.x, obj.y)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(obj.x + obj.width / 2, obj.y + obj.height / 2)
          ctx.lineTo(obj.x + obj.width / 2, obj.y)
          ctx.stroke()
          break

        case "bubble":
          // Animated bubbles that float up
          const bubbleY = obj.y - ((frameCount % 200) / 200) * 100
          if (bubbleY > 0) {
            ctx.strokeStyle = "#e0f2fe" // sky-100
            ctx.beginPath()
            ctx.arc(obj.x + Math.sin(frameCount * 0.05) * 10, bubbleY, obj.width / 2, 0, Math.PI * 2)
            ctx.stroke()
          }
          break

        case "vine":
          ctx.strokeStyle = "#16a34a" // green-600
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(obj.x, obj.y)
          // Wavy vine
          for (let i = 0; i < obj.height; i += 20) {
            const waveX = Math.sin((i / 20 + frameCount * 0.01) * Math.PI) * 5
            ctx.lineTo(obj.x + waveX, obj.y + i)
          }
          ctx.stroke()
          break

        case "tree":
          // Tree trunk
          ctx.fillStyle = "#92400e" // amber-800
          ctx.fillRect(obj.x + obj.width / 2 - 10, obj.y, 20, obj.height)
          // Tree foliage
          ctx.fillStyle = "#15803d" // green-700
          ctx.beginPath()
          ctx.arc(obj.x + obj.width / 2, obj.y, obj.width / 2, 0, Math.PI * 2)
          ctx.fill()
          break
      }
    }
  }

  // Draw hazards with improved visuals
  if (selectedMap.hazards) {
    for (const hazard of selectedMap.hazards) {
      switch (hazard.type) {
        case "spikes":
          ctx.fillStyle = "#71717a" // zinc-500
          ctx.fillRect(hazard.x, hazard.y, hazard.width, hazard.height)

          // Draw spike points
          ctx.fillStyle = "#52525b" // zinc-600
          const spikeWidth = 10
          const numSpikes = Math.floor(hazard.width / spikeWidth)
          for (let i = 0; i < numSpikes; i++) {
            ctx.beginPath()
            ctx.moveTo(hazard.x + i * spikeWidth, hazard.y)
            ctx.lineTo(hazard.x + i * spikeWidth + spikeWidth / 2, hazard.y - 10)
            ctx.lineTo(hazard.x + i * spikeWidth + spikeWidth, hazard.y)
            ctx.fill()
          }
          break

        case "lava":
          ctx.fillStyle = "#ef4444" // red-500
          ctx.fillRect(hazard.x, hazard.y, hazard.width, hazard.height)

          // Lava bubbles animation
          ctx.fillStyle = "#f97316" // orange-500
          for (let i = 0; i < 3; i++) {
            const bubbleX = hazard.x + (Math.sin(frameCount * 0.1 + i) * hazard.width) / 2
            const bubbleY = hazard.y + hazard.height - (((frameCount % 30) + i * 10) / 30) * hazard.height
            ctx.beginPath()
            ctx.arc(bubbleX, bubbleY, 5, 0, Math.PI * 2)
            ctx.fill()
          }
          break
      }
    }
  }

  // Draw ground
  ctx.fillStyle = selectedMap.ground
  ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y)

  // Draw players
  drawStickman(
    ctx,
    player1.x,
    player1.y,
    PLAYER1_COLOR,
    player1.direction,
    player1.isAttacking,
    player1.attackType,
    player1.winner,
    player1.hitReaction,
    player1.squash,
    player1.hasGiantMode,
    player1.hasShield,
    frameCount,
    {
      burning: player1.burning ? true : false,
      frozen: player1.frozen ? true : false,
      electrified: false,
      poisoned: player1.poisoned ? true : false,
      possessed: player1.possessed,
    },
  )

  drawStickman(
    ctx,
    player2.x,
    player2.y,
    PLAYER2_COLOR,
    player2.direction,
    player2.isAttacking,
    player2.attackType,
    player2.winner,
    player2.hitReaction,
    player2.squash,
    player2.hasGiantMode,
    player2.hasShield,
    frameCount,
    {
      burning: player2.burning ? true : false,
      frozen: player2.frozen ? true : false,
      electrified: false,
      poisoned: player2.poisoned ? true : false,
      possessed: player2.possessed,
    },
  )

  // Draw power-ups
  for (const powerUp of powerUps) {
    if (!powerUp.active) continue

    ctx.fillStyle = POWERUP_COLORS[powerUp.type] || "#fff"
    ctx.beginPath()
    ctx.arc(powerUp.x, powerUp.y, 10, 0, Math.PI * 2)
    ctx.fill()

    // Add glow effect
    ctx.beginPath()
    ctx.arc(powerUp.x, powerUp.y, 12 + Math.sin(frameCount * 0.1) * 2, 0, Math.PI * 2)
    ctx.strokeStyle = POWERUP_COLORS[powerUp.type] || "#fff"
    ctx.globalAlpha = 0.5
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  // Draw combo text
  comboTextRef.forEach((combo, index) => {
    ctx.font = "24px sans-serif"
    ctx.fillStyle = combo.player === 1 ? PLAYER1_COLOR : PLAYER2_COLOR
    ctx.fillText(combo.text, combo.x, combo.y)
  })

  // Draw health bars
  ctx.fillStyle = "#6b7280" // gray-500
  ctx.fillRect(50, 30, 200, 20)
  ctx.fillStyle = "#2563eb" // blue-600
  // If game is over and player 1 lost, show empty health bar
  const player1HealthPercentage = gameOver && winner === 2 ? 0 : player1.health / 100
  ctx.fillRect(50, 30, player1HealthPercentage * 200, 20)
  ctx.strokeStyle = "#000"
  ctx.strokeRect(50, 30, 200, 20)

  // Player 2 health bar
  ctx.fillStyle = "#6b7280" // gray-500
  ctx.fillRect(CANVAS_WIDTH - 250, 30, 200, 20)
  ctx.fillStyle = "#dc2626" // red-600
  // If game is over and player 2 lost, show empty health bar
  const player2HealthPercentage = gameOver && winner === 1 ? 0 : player2.health / 100
  ctx.fillRect(CANVAS_WIDTH - 250, 30, player2HealthPercentage * 200, 20)
  ctx.strokeStyle = "#000"
  ctx.strokeRect(CANVAS_WIDTH - 250, 30, 200, 20)

  // Draw player labels
  ctx.font = "16px sans-serif"
  ctx.fillStyle = "#fff"
  ctx.textAlign = "left"
  ctx.fillText("Player 1", 50, 20)
  ctx.textAlign = "right"
  ctx.fillText("Player 2", CANVAS_WIDTH - 50, 20)

  // Draw game over message and victory banner
  if (gameOver) {
    // Semi-transparent overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw victory banner (only keep this one)
    drawVictoryBanner(ctx, winner, gameOverFrameCount)

    // Display round score if playing multiple rounds
    if (player1.score !== undefined && player2.score !== undefined) {
      ctx.font = "bold 32px sans-serif"
      ctx.fillStyle = "#ffffff"
      ctx.textAlign = "center"
      ctx.fillText(`Score: ${player1.score} - ${player2.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50)

      // Subtitle
      ctx.font = "24px sans-serif"
      ctx.fillStyle = "#fff"
      ctx.fillText("Press 'Play Again' for next round", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90)
    } else {
      // Subtitle
      ctx.font = "24px sans-serif"
      ctx.fillStyle = "#fff"
      ctx.textAlign = "center"
      ctx.fillText("Press 'Play Again' to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90)
    }
  }
}
