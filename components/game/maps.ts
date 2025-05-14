import type React from "react"
import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, GRAVITY, type Player } from "./constants"

// Platform type
export type Platform = {
  id: number
  x: number
  y: number
  width: number
  height: number
  moving?: boolean
  speed?: number
  range?: number
  startX?: number
  startY?: number
  breakable?: boolean
  broken?: boolean
  strength?: number
  visible?: boolean
  teleporter?: boolean
  teleportTarget?: number
  bouncy?: boolean
  bounceFactor?: number
  sticky?: boolean
  stickyFactor?: number
  deadly?: boolean
  damageOnTouch?: number
}

// Hazard type
export type Hazard = {
  x: number
  y: number
  width: number
  height: number
  damage: number
  type: string
  active?: boolean
  timer?: number
  velocity?: { x: number; y: number }
}

// Environmental object type
export type EnvironmentalObject = {
  type: string
  x: number
  y: number
  width: number
  height: number
  active?: boolean
  timer?: number
  interactable?: boolean
  interactionRadius?: number
  interactionEffect?: string
  velocity?: { x: number; y: number }
  swingable?: boolean
  swingRadius?: number
  swingAngle?: number
  swingSpeed?: number
}

// Map configuration type
export type MapConfig = {
  name: string
  background: string
  ground: string
  platforms: Platform[]
  hazards?: Hazard[]
  environmentalObjects?: EnvironmentalObject[]
  specialFeature: string
  gravity: number
  friction: number
  jumpMultiplier: number
  description: string
  applyMapEffects?: (player: Player, frameCount: number, mapEffects: any) => Player
  initializeMapEffects?: () => any
  updateMapEffects?: (
    mapEffects: any,
    frameCount: number,
    players: { player1: Player; player2: Player },
    comboTextRef: React.MutableRefObject<{ text: string; x: number; y: number; timer: number; player: number }[]>,
  ) => any
  drawMapEffects?: (ctx: CanvasRenderingContext2D, frameCount: number, mapEffects: any) => void
}

// Maps configuration
export const MAPS: MapConfig[] = [
  {
    name: "Space Station",
    background: "#0f172a", // slate-900
    ground: "#334155", // slate-700
    platforms: [
      { id: 1, x: 200, y: 300, width: 200, height: 20 },
      { id: 2, x: 500, y: 200, width: 200, height: 20 },
      { id: 3, x: 800, y: 300, width: 200, height: 20 },
      { id: 4, x: 350, y: 400, width: 150, height: 20 },
      { id: 5, x: 650, y: 400, width: 150, height: 20 },
      { id: 6, x: 1000, y: 400, width: 150, height: 20 },
    ],
    specialFeature: "zeroGravity",
    gravity: GRAVITY * 0.2, // Very low gravity
    friction: 0.98,
    jumpMultiplier: 0.7, // Lower jumps but they go higher due to low gravity
    description: "Zero gravity zones allow players to float freely. Push off walls to gain momentum!",

    initializeMapEffects: () => {
      return {
        gravityZones: [
          { x: 150, y: 100, width: 250, height: 150, strength: 0 },
          { x: 500, y: 100, width: 250, height: 150, strength: 0 },
          { x: 850, y: 100, width: 250, height: 150, strength: 0 },
        ],
        asteroids: [],
        nextAsteroid: 120,
      }
    },

    updateMapEffects: (mapEffects, frameCount, players, comboTextRef) => {
      const { gravityZones, asteroids, nextAsteroid } = mapEffects

      // Update gravity zones - they pulse between zero and low gravity
      gravityZones.forEach((zone: any) => {
        zone.strength = Math.sin(frameCount * 0.01) * 0.2
      })

      // Spawn asteroids periodically
      let newNextAsteroid = nextAsteroid - 1
      let newAsteroids = [...asteroids]

      if (newNextAsteroid <= 0) {
        // Spawn a new asteroid
        const side = Math.random() > 0.5 ? 1 : -1
        newAsteroids.push({
          x: side > 0 ? -30 : CANVAS_WIDTH + 30,
          y: 100 + Math.random() * 300,
          size: 15 + Math.random() * 20,
          velocityX: side * (1 + Math.random() * 2),
          velocityY: -1 + Math.random() * 2,
          rotation: 0,
          rotationSpeed: 0.01 + Math.random() * 0.05,
        })
        newNextAsteroid = 60 + Math.floor(Math.random() * 120)
      }

      // Update asteroids
      newAsteroids = newAsteroids.filter((asteroid: any) => {
        // Move asteroid
        asteroid.x += asteroid.velocityX
        asteroid.y += asteroid.velocityY
        asteroid.rotation += asteroid.rotationSpeed

        // Check if asteroid is off screen
        if (asteroid.x < -50 || asteroid.x > CANVAS_WIDTH + 50 || asteroid.y < -50 || asteroid.y > CANVAS_HEIGHT + 50) {
          return false
        }

        // Check for collisions with players
        const checkPlayerCollision = (player: Player) => {
          const dx = player.x - asteroid.x
          const dy = player.y - asteroid.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < asteroid.size + 20) {
            // Collision! Damage player and bounce asteroid
            if (!player.hasShield && frameCount % 10 === 0) {
              player.health -= 5
              player.hitReaction = 10

              comboTextRef.current.push({
                text: "-5",
                x: player.x,
                y: player.y - 50,
                timer: 30,
                player: player === players.player1 ? 1 : 2,
              })
            }

            // Bounce asteroid
            asteroid.velocityX = -asteroid.velocityX * 0.8
            asteroid.velocityY = -asteroid.velocityY * 0.8

            // Push player
            player.velocityX += asteroid.velocityX * 0.5
            player.velocityY += asteroid.velocityY * 0.5
          }
        }

        checkPlayerCollision(players.player1)
        checkPlayerCollision(players.player2)

        return true
      })

      return {
        gravityZones,
        asteroids: newAsteroids,
        nextAsteroid: newNextAsteroid,
      }
    },

    applyMapEffects: (player, frameCount, mapEffects) => {
      const newPlayer = { ...player }

      // Check if player is in a zero gravity zone
      mapEffects.gravityZones.forEach((zone: any) => {
        if (
          newPlayer.x > zone.x &&
          newPlayer.x < zone.x + zone.width &&
          newPlayer.y > zone.y &&
          newPlayer.y < zone.y + zone.height
        ) {
          // In zero gravity zone
          newPlayer.velocityY += zone.strength // Can be negative for reverse gravity
          newPlayer.floating = true
        }
      })

      return newPlayer
    },

    drawMapEffects: (ctx, frameCount, mapEffects) => {
      const { gravityZones, asteroids } = mapEffects

      // Draw space background with stars
      for (let i = 0; i < 200; i++) {
        const x = Math.sin(i * 0.1 + frameCount * 0.001) * CANVAS_WIDTH + CANVAS_WIDTH / 2
        const y = Math.cos(i * 0.1 + frameCount * 0.001) * CANVAS_HEIGHT + CANVAS_HEIGHT / 2

        if (x > 0 && x < CANVAS_WIDTH && y > 0 && y < CANVAS_HEIGHT) {
          const size = 0.5 + Math.random() * 1.5
          const brightness = 0.5 + Math.sin(frameCount * 0.01 + i) * 0.5
          ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`
          ctx.beginPath()
          ctx.arc(x, y, size, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Draw distant planets
      // Planet 1
      const planet1X = 200
      const planet1Y = 150
      const planet1Radius = 40
      const planet1Color = "#60a5fa" // blue-400

      ctx.fillStyle = planet1Color
      ctx.beginPath()
      ctx.arc(planet1X, planet1Y, planet1Radius, 0, Math.PI * 2)
      ctx.fill()

      // Planet 1 details
      ctx.fillStyle = "#93c5fd" // blue-300
      ctx.beginPath()
      ctx.arc(planet1X - 15, planet1Y - 10, 10, 0, Math.PI * 2)
      ctx.fill()

      // Planet 2
      const planet2X = CANVAS_WIDTH - 200
      const planet2Y = 200
      const planet2Radius = 60
      const planet2Color = "#f97316" // orange-500

      ctx.fillStyle = planet2Color
      ctx.beginPath()
      ctx.arc(planet2X, planet2Y, planet2Radius, 0, Math.PI * 2)
      ctx.fill()

      // Planet 2 ring
      ctx.strokeStyle = "#fdba74" // orange-300
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.ellipse(planet2X, planet2Y, planet2Radius + 15, 10, Math.PI / 6, 0, Math.PI * 2)
      ctx.stroke()

      // Draw gravity zones
      gravityZones.forEach((zone: any) => {
        // Draw with pulsing transparency
        const alpha = 0.1 + Math.abs(Math.sin(frameCount * 0.01)) * 0.1
        ctx.fillStyle = `rgba(59, 130, 246, ${alpha})` // blue-500 with transparency
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height)

        // Draw particles inside gravity zone
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
        for (let i = 0; i < 10; i++) {
          const particleX = zone.x + Math.random() * zone.width
          const particleY = zone.y + Math.random() * zone.height
          const particleSize = 1 + Math.random() * 2
          ctx.beginPath()
          ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      // Draw asteroids
      asteroids.forEach((asteroid: any) => {
        ctx.save()
        ctx.translate(asteroid.x, asteroid.y)
        ctx.rotate(asteroid.rotation)

        // Draw asteroid body
        ctx.fillStyle = "#6b7280" // gray-500
        ctx.beginPath()
        ctx.arc(0, 0, asteroid.size, 0, Math.PI * 2)
        ctx.fill()

        // Draw asteroid details
        ctx.fillStyle = "#4b5563" // gray-600
        ctx.beginPath()
        ctx.arc(asteroid.size * 0.3, asteroid.size * 0.3, asteroid.size * 0.3, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()
      })

      // Draw space station elements
      // Main station body
      ctx.fillStyle = "#64748b" // slate-500
      ctx.fillRect(CANVAS_WIDTH / 2 - 100, 50, 200, 40)

      // Solar panels
      ctx.fillStyle = "#3b82f6" // blue-500
      ctx.fillRect(CANVAS_WIDTH / 2 - 150, 60, 40, 20)
      ctx.fillRect(CANVAS_WIDTH / 2 + 110, 60, 40, 20)

      // Antenna
      ctx.strokeStyle = "#94a3b8" // slate-400
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(CANVAS_WIDTH / 2, 50)
      ctx.lineTo(CANVAS_WIDTH / 2, 20)
      ctx.stroke()

      // Blinking lights
      if (frameCount % 30 < 15) {
        ctx.fillStyle = "#ef4444" // red-500
      } else {
        ctx.fillStyle = "#22c55e" // green-500
      }
      ctx.beginPath()
      ctx.arc(CANVAS_WIDTH / 2 - 80, 70, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(CANVAS_WIDTH / 2 + 80, 70, 3, 0, Math.PI * 2)
      ctx.fill()
    },
  },
  {
    name: "Ice Cave",
    background: "#1e3a8a", // blue-900
    ground: "#e0f2fe", // sky-100
    platforms: [
      { id: 1, x: 150, y: 375, width: 150, height: 20, breakable: true, strength: 3 },
      { id: 2, x: 400, y: 300, width: 150, height: 20, breakable: true, strength: 3 },
      { id: 3, x: 650, y: 375, width: 150, height: 20, breakable: true, strength: 3 },
      { id: 4, x: 900, y: 300, width: 150, height: 20, breakable: true, strength: 3 },
      { id: 5, x: 1050, y: 375, width: 150, height: 20, breakable: true, strength: 3 },
    ],
    hazards: [
      { x: 250, y: 100, width: 20, height: 100, damage: 5, type: "icicle", active: true, timer: 0 },
      { x: 450, y: 120, width: 20, height: 80, damage: 5, type: "icicle", active: true, timer: 0 },
      { x: 650, y: 110, width: 20, height: 90, damage: 5, type: "icicle", active: true, timer: 0 },
      { x: 850, y: 100, width: 20, height: 100, damage: 5, type: "icicle", active: true, timer: 0 },
      { x: 1050, y: 120, width: 20, height: 80, damage: 5, type: "icicle", active: true, timer: 0 },
    ],
    specialFeature: "icy",
    gravity: GRAVITY,
    friction: 0.99, // Very slippery
    jumpMultiplier: 0.9, // Slightly lower jumps
    description: "Extremely slippery surface and breaking ice platforms. Watch out for falling icicles!",

    initializeMapEffects: () => {
      return {
        fallingIcicles: [],
        nextIcicle: 60,
        snowParticles: Array.from({ length: 100 }, () => ({
          x: Math.random() * CANVAS_WIDTH,
          y: Math.random() * CANVAS_HEIGHT,
          size: 1 + Math.random() * 2,
          speed: 0.5 + Math.random() * 1.5,
        })),
        iceCrystals: Array.from({ length: 20 }, (_, i) => ({
          x: i * (CANVAS_WIDTH / 20),
          y: 100 + Math.sin(i * 0.5) * 50,
          size: 10 + Math.random() * 15,
          angle: Math.random() * Math.PI * 2,
          pulseSpeed: 0.01 + Math.random() * 0.02,
        })),
      }
    },

    updateMapEffects: (mapEffects, frameCount, players, comboTextRef) => {
      const { fallingIcicles, nextIcicle, snowParticles, iceCrystals } = mapEffects

      // Update snow particles
      snowParticles.forEach((particle: any) => {
        particle.y += particle.speed
        particle.x += Math.sin(frameCount * 0.01 + particle.y * 0.1) * 0.5

        if (particle.y > CANVAS_HEIGHT) {
          particle.y = 0
          particle.x = Math.random() * CANVAS_WIDTH
        }
      })

      // Update ice crystals
      iceCrystals.forEach((crystal: any) => {
        crystal.angle += crystal.pulseSpeed
      })

      // Spawn falling icicles
      let newNextIcicle = nextIcicle - 1
      let newFallingIcicles = [...fallingIcicles]

      if (newNextIcicle <= 0) {
        // Spawn a new icicle
        const x = 100 + Math.random() * (CANVAS_WIDTH - 200)
        newFallingIcicles.push({
          x,
          y: 0,
          width: 10 + Math.random() * 10,
          height: 20 + Math.random() * 30,
          velocityY: 1 + Math.random() * 2,
          rotation: -0.1 + Math.random() * 0.2,
          warning: true,
          warningTime: 30,
        })
        newNextIcicle = 60 + Math.floor(Math.random() * 120)
      }

      // Update falling icicles
      newFallingIcicles = newFallingIcicles.filter((icicle: any) => {
        if (icicle.warning) {
          icicle.warningTime--
          if (icicle.warningTime <= 0) {
            icicle.warning = false
          }
          return true
        }

        icicle.y += icicle.velocityY

        // Check if icicle hit ground
        if (icicle.y > CANVAS_HEIGHT) {
          return false
        }

        // Check for collisions with players
        const checkPlayerCollision = (player: Player) => {
          if (
            player.x > icicle.x - 20 &&
            player.x < icicle.x + 20 &&
            player.y > icicle.y - 10 &&
            player.y < icicle.y + icicle.height
          ) {
            // Collision! Damage player
            if (!player.hasShield) {
              player.health -= 10
              player.hitReaction = 10
              player.frozen = 60 // Freeze player for 1 second

              comboTextRef.current.push({
                text: "-10 FROZEN!",
                x: player.x,
                y: player.y - 50,
                timer: 30,
                player: player === players.player1 ? 1 : 2,
              })
            }

            return false // Remove icicle
          }
          return true
        }

        if (!checkPlayerCollision(players.player1) || !checkPlayerCollision(players.player2)) {
          return false
        }

        return true
      })

      // Check for breaking platforms
      const platforms =
        players.player1.platformId || players.player2.platformId
          ? [players.player1.platformId, players.player2.platformId]
          : []

      return {
        fallingIcicles: newFallingIcicles,
        nextIcicle: newNextIcicle,
        snowParticles,
        iceCrystals,
        breakingPlatforms: platforms,
      }
    },

    drawMapEffects: (ctx, frameCount, mapEffects) => {
      const { fallingIcicles, snowParticles, iceCrystals } = mapEffects

      // Draw ice cave background elements
      // Distant ice formations
      for (let i = 0; i < 10; i++) {
        const x = i * (CANVAS_WIDTH / 10)
        const height = 100 + Math.sin(i * 0.5) * 50

        ctx.fillStyle = "#bfdbfe" // blue-200
        ctx.beginPath()
        ctx.moveTo(x, CANVAS_HEIGHT)
        ctx.lineTo(x, CANVAS_HEIGHT - height)
        ctx.lineTo(x + CANVAS_WIDTH / 20, CANVAS_HEIGHT - height - 30)
        ctx.lineTo(x + CANVAS_WIDTH / 10, CANVAS_HEIGHT - height)
        ctx.lineTo(x + CANVAS_WIDTH / 10, CANVAS_HEIGHT)
        ctx.closePath()
        ctx.fill()

        // Ice highlights
        ctx.fillStyle = "#dbeafe" // blue-100
        ctx.beginPath()
        ctx.moveTo(x + 10, CANVAS_HEIGHT)
        ctx.lineTo(x + 10, CANVAS_HEIGHT - height + 20)
        ctx.lineTo(x + 20, CANVAS_HEIGHT - height + 10)
        ctx.lineTo(x + 30, CANVAS_HEIGHT - height + 20)
        ctx.lineTo(x + 30, CANVAS_HEIGHT)
        ctx.closePath()
        ctx.fill()
      }

      // Draw snow particles
      ctx.fillStyle = "#f8fafc" // slate-50
      snowParticles.forEach((particle: any) => {
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw ice crystals
      iceCrystals.forEach((crystal: any) => {
        const pulseSize = crystal.size * (0.8 + Math.sin(crystal.angle) * 0.2)

        ctx.fillStyle = `rgba(224, 242, 254, ${0.3 + Math.sin(crystal.angle) * 0.2})` // sky-100 with pulsing opacity
        ctx.beginPath()
        ctx.moveTo(crystal.x, crystal.y)
        ctx.lineTo(crystal.x + pulseSize, crystal.y - pulseSize)
        ctx.lineTo(crystal.x + pulseSize * 2, crystal.y)
        ctx.lineTo(crystal.x + pulseSize, crystal.y + pulseSize)
        ctx.closePath()
        ctx.fill()

        // Crystal highlight
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
        ctx.beginPath()
        ctx.moveTo(crystal.x + pulseSize * 0.3, crystal.y)
        ctx.lineTo(crystal.x + pulseSize * 0.6, crystal.y - pulseSize * 0.3)
        ctx.lineTo(crystal.x + pulseSize * 0.9, crystal.y)
        ctx.closePath()
        ctx.fill()
      })

      // Draw falling icicles
      fallingIcicles.forEach((icicle: any) => {
        if (icicle.warning) {
          // Draw warning indicator
          ctx.fillStyle = `rgba(239, 68, 68, ${Math.sin(frameCount * 0.2) * 0.5 + 0.5})` // red-500 pulsing
          ctx.beginPath()
          ctx.moveTo(icicle.x - 10, 10)
          ctx.lineTo(icicle.x + 10, 10)
          ctx.lineTo(icicle.x, 25)
          ctx.closePath()
          ctx.fill()
        } else {
          // Draw icicle
          ctx.save()
          ctx.translate(icicle.x, icicle.y)
          ctx.rotate(icicle.rotation)

          // Icicle body
          ctx.fillStyle = "#e0f2fe" // sky-100
          ctx.beginPath()
          ctx.moveTo(-icicle.width / 2, 0)
          ctx.lineTo(icicle.width / 2, 0)
          ctx.lineTo(0, icicle.height)
          ctx.closePath()
          ctx.fill()

          // Icicle shine
          ctx.fillStyle = "#f8fafc" // slate-50
          ctx.beginPath()
          ctx.moveTo(-icicle.width / 4, 0)
          ctx.lineTo(-icicle.width / 8, 0)
          ctx.lineTo(-icicle.width / 6, icicle.height * 0.8)
          ctx.closePath()
          ctx.fill()

          ctx.restore()
        }
      })

      // Draw frozen mist effect
      ctx.fillStyle = "rgba(241, 245, 249, 0.05)" // slate-100 with low opacity
      for (let i = 0; i < 5; i++) {
        const x = Math.random() * CANVAS_WIDTH
        const y = Math.random() * CANVAS_HEIGHT
        const radius = 50 + Math.random() * 100

        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
      }
    },

    applyMapEffects: (player, frameCount, mapEffects) => {
      const newPlayer = { ...player }

      // Apply extreme slipperiness on ground
      if (newPlayer.y >= GROUND_Y - 5) {
        // Reduce friction even more when on ground
        newPlayer.velocityX *= 0.99

        // Random slipping
        if (Math.random() < 0.02) {
          newPlayer.velocityX += (Math.random() - 0.5) * 2
        }
      }

      // Apply frozen effect
      if (newPlayer.frozen && newPlayer.frozen > 0) {
        // Slow down movement when frozen
        newPlayer.velocityX *= 0.8
        newPlayer.velocityY *= 0.8

        // Can't attack when frozen
        if (newPlayer.isAttacking) {
          newPlayer.isAttacking = false
          newPlayer.attackFrame = 0
        }

        // Add frozen visual effect
        newPlayer.specialEffects = { ...newPlayer.specialEffects, frozen: true }
      } else {
        // Remove frozen effect
        if (newPlayer.specialEffects?.frozen) {
          const { frozen, ...rest } = newPlayer.specialEffects
          newPlayer.specialEffects = rest
        }
      }

      // Check for breaking platforms
      if (mapEffects.breakingPlatforms && mapEffects.breakingPlatforms.includes(newPlayer.platformId)) {
        // Platform is breaking - add some shake
        if (frameCount % 4 < 2) {
          newPlayer.velocityX += 0.2
        } else {
          newPlayer.velocityX -= 0.2
        }
      }

      return newPlayer
    },
  },
  {
    name: "Volcano Arena",
    background: "#7f1d1d", // red-900
    ground: "#b91c1c", // red-700
    platforms: [
      { id: 1, x: 150, y: 375, width: 160, height: 20 },
      { id: 2, x: 400, y: 300, width: 160, height: 20 },
      { id: 3, x: 650, y: 375, width: 160, height: 20 },
      { id: 4, x: 900, y: 300, width: 160, height: 20 },
      { id: 5, x: 1050, y: 375, width: 160, height: 20 },
    ],
    hazards: [
      { x: 0, y: CANVAS_HEIGHT - 20, width: CANVAS_WIDTH, height: 20, damage: 2, type: "lava", active: true },
      { x: 300, y: 450, width: 200, height: 20, damage: 2, type: "lava", active: true },
      { x: 700, y: 450, width: 200, height: 20, damage: 2, type: "lava", active: true },
    ],
    environmentalObjects: [
      { type: "rock", x: 100, y: 150, width: 40, height: 40 },
      { type: "rock", x: 300, y: 200, width: 50, height: 50 },
      { type: "rock", x: 600, y: 150, width: 40, height: 40 },
      { type: "rock", x: 900, y: 200, width: 50, height: 50 },
      { type: "rock", x: 1100, y: 150, width: 40, height: 40 },
    ],
    specialFeature: "volcanic",
    gravity: GRAVITY,
    friction: 0.95,
    jumpMultiplier: 1.0,
    description: "A dangerous volcanic arena with rising lava and falling meteors. The ground is literally lava!",

    initializeMapEffects: () => {
      return {
        lavaParticles: Array.from({ length: 80 }, () => ({
          x: Math.random() * CANVAS_WIDTH,
          y: CANVAS_HEIGHT - Math.random() * 30,
          size: 2 + Math.random() * 3,
          speed: 1 + Math.random() * 2,
          lifetime: 30 + Math.random() * 60,
        })),
        meteors: [],
        nextMeteor: 120,
        lavaSurge: false,
        lavaSurgeTimer: 300,
        lavaSurgeHeight: 0,
        volcanoes: [
          { x: 200, y: GROUND_Y, width: 100, height: 80, nextEruption: 180 + Math.random() * 120 },
          { x: CANVAS_WIDTH - 300, y: GROUND_Y, width: 100, height: 80, nextEruption: 240 + Math.random() * 120 },
        ],
      }
    },

    updateMapEffects: (mapEffects, frameCount, players, comboTextRef) => {
      const { lavaParticles, meteors, nextMeteor, lavaSurge, lavaSurgeTimer, lavaSurgeHeight, volcanoes } = mapEffects

      // Update lava particles
      lavaParticles.forEach((particle: any) => {
        particle.y -= particle.speed
        particle.lifetime--

        if (particle.lifetime <= 0 || particle.y < CANVAS_HEIGHT - 100) {
          // Reset particle
          particle.x = Math.random() * CANVAS_WIDTH
          particle.y = CANVAS_HEIGHT - Math.random() * 20
          particle.lifetime = 30 + Math.random() * 60
          particle.speed = 1 + Math.random() * 2
        }
      })

      // Update volcanoes
      volcanoes.forEach((volcano: any) => {
        volcano.nextEruption--

        if (volcano.nextEruption <= 0) {
          // Eruption!
          volcano.erupting = true
          volcano.eruptionTime = 90 // 1.5 seconds
          volcano.nextEruption = 300 + Math.random() * 300 // 5-10 seconds

          // Warning message
          comboTextRef.current.push({
            text: "VOLCANO ERUPTING!",
            x: volcano.x,
            y: volcano.y - 100,
            timer: 60,
            player: 0, // Neutral message
          })

          // Spawn lava particles
          for (let i = 0; i < 20; i++) {
            lavaParticles.push({
              x: volcano.x + volcano.width / 2 + (Math.random() - 0.5) * 30,
              y: volcano.y,
              size: 3 + Math.random() * 4,
              speed: 3 + Math.random() * 4,
              lifetime: 60 + Math.random() * 30,
            })
          }

          // Spawn meteors from volcano
          for (let i = 0; i < 3; i++) {
            meteors.push({
              x: volcano.x + volcano.width / 2,
              y: volcano.y,
              size: 15 + Math.random() * 15,
              velocityY: -10 - Math.random() * 5, // Initial upward velocity
              velocityX: -5 + Math.random() * 10,
              rotation: 0,
              rotationSpeed: 0.05 + Math.random() * 0.1,
              gravity: 0.2 + Math.random() * 0.1,
            })
          }
        }

        if (volcano.erupting) {
          volcano.eruptionTime--

          if (volcano.eruptionTime <= 0) {
            volcano.erupting = false
          } else if (frameCount % 5 === 0) {
            // Continue spawning particles during eruption
            lavaParticles.push({
              x: volcano.x + volcano.width / 2 + (Math.random() - 0.5) * 30,
              y: volcano.y,
              size: 2 + Math.random() * 3,
              speed: 2 + Math.random() * 3,
              lifetime: 40 + Math.random() * 20,
            })
          }
        }
      })

      // Handle lava surge
      let newLavaSurge = lavaSurge
      let newLavaSurgeTimer = lavaSurgeTimer
      let newLavaSurgeHeight = lavaSurgeHeight

      if (!lavaSurge) {
        newLavaSurgeTimer--
        if (newLavaSurgeTimer <= 0) {
          newLavaSurge = true
          newLavaSurgeTimer = 180 // Duration of surge

          // Warning message
          comboTextRef.current.push({
            text: "LAVA SURGE INCOMING!",
            x: CANVAS_WIDTH / 2 - 100,
            y: CANVAS_HEIGHT / 2,
            timer: 90,
            player: 0, // Neutral message
          })
        }
      } else {
        newLavaSurgeTimer--

        // Increase lava height during first half of surge
        if (newLavaSurgeTimer > 90) {
          newLavaSurgeHeight = 80 * (1 - (newLavaSurgeTimer - 90) / 90)
        }
        // Decrease lava height during second half
        else {
          newLavaSurgeHeight = 80 * (newLavaSurgeTimer / 90)
        }

        // Check if players are touching lava
        const lavaY = CANVAS_HEIGHT - 20 - newLavaSurgeHeight

        // Player 1 lava damage
        if (players.player1.y > lavaY && frameCount % 15 === 0 && !players.player1.hasShield) {
          players.player1.health -= 5
          players.player1.burning = 60

          comboTextRef.current.push({
            text: "-5 BURNING!",
            x: players.player1.x,
            y: players.player1.y - 50,
            timer: 30,
            player: 1,
          })
        }

        // Player 2 lava damage
        if (players.player2.y > lavaY && frameCount % 15 === 0 && !players.player2.hasShield) {
          players.player2.health -= 5
          players.player2.burning = 60

          comboTextRef.current.push({
            text: "-5 BURNING!",
            x: players.player2.x,
            y: players.player2.y - 50,
            timer: 30,
            player: 2,
          })
        }

        // End surge
        if (newLavaSurgeTimer <= 0) {
          newLavaSurge = false
          newLavaSurgeTimer = 300 + Math.floor(Math.random() * 300) // Random time until next surge
          newLavaSurgeHeight = 0
        }
      }

      // Spawn meteors
      let newNextMeteor = nextMeteor - 1
      let newMeteors = [...meteors]

      if (newNextMeteor <= 0) {
        // Spawn a new meteor
        const x = 100 + Math.random() * (CANVAS_WIDTH - 200)
        newMeteors.push({
          x,
          y: -30,
          size: 15 + Math.random() * 15,
          velocityY: 3 + Math.random() * 3,
          velocityX: -2 + Math.random() * 4,
          rotation: 0,
          rotationSpeed: 0.05 + Math.random() * 0.1,
          warning: true,
          warningTime: 30,
          gravity: 0,
        })
        newNextMeteor = 90 + Math.floor(Math.random() * 120)
      }

      // Update meteors
      newMeteors = newMeteors.filter((meteor: any) => {
        if (meteor.warning && meteor.warning === true) {
          meteor.warningTime--
          if (meteor.warningTime <= 0) {
            meteor.warning = false
          }
          return true
        }

        // Apply gravity to meteors from volcano
        if (meteor.gravity) {
          meteor.velocityY += meteor.gravity
        }

        meteor.y += meteor.velocityY
        meteor.x += meteor.velocityX
        meteor.rotation += meteor.rotationSpeed

        // Check if meteor hit ground
        if (meteor.y > CANVAS_HEIGHT) {
          // Create explosion effect
          for (let i = 0; i < 10; i++) {
            lavaParticles.push({
              x: meteor.x + (Math.random() - 0.5) * 40,
              y: CANVAS_HEIGHT - 20,
              size: 3 + Math.random() * 4,
              speed: 2 + Math.random() * 3,
              lifetime: 40 + Math.random() * 20,
            })
          }
          return false
        }

        // Check for collisions with players
        const checkPlayerCollision = (player: Player) => {
          const dx = player.x - meteor.x
          const dy = player.y - meteor.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < meteor.size + 20) {
            // Collision! Damage player
            if (!player.hasShield) {
              player.health -= 15
              player.hitReaction = 15
              player.burning = 90 // Set player on fire

              comboTextRef.current.push({
                text: "-15 BURNING!",
                x: player.x,
                y: player.y - 50,
                timer: 30,
                player: player === players.player1 ? 1 : 2,
              })
            }

            // Create explosion effect
            for (let i = 0; i < 8; i++) {
              lavaParticles.push({
                x: meteor.x + (Math.random() - 0.5) * 30,
                y: meteor.y + (Math.random() - 0.5) * 30,
                size: 3 + Math.random() * 3,
                speed: 2 + Math.random() * 2,
                lifetime: 30 + Math.random() * 20,
              })
            }

            return false // Remove meteor
          }
          return true
        }

        if (!checkPlayerCollision(players.player1) || !checkPlayerCollision(players.player2)) {
          return false
        }

        return true
      })

      return {
        lavaParticles,
        meteors: newMeteors,
        nextMeteor: newNextMeteor,
        lavaSurge: newLavaSurge,
        lavaSurgeTimer: newLavaSurgeTimer,
        lavaSurgeHeight: newLavaSurgeHeight,
        volcanoes,
      }
    },

    applyMapEffects: (player, frameCount, mapEffects) => {
      const newPlayer = { ...player }

      // Apply burning effect
      if (newPlayer.burning && newPlayer.burning > 0) {
        // Burning causes damage over time
        if (frameCount % 30 === 0) {
          newPlayer.health -= 1
        }

        // Add burning visual effect
        newPlayer.specialEffects = { ...newPlayer.specialEffects, burning: true }
      } else {
        // Remove burning effect
        if (newPlayer.specialEffects?.burning) {
          const { burning, ...rest } = newPlayer.specialEffects
          newPlayer.specialEffects = rest
        }
      }

      return newPlayer
    },

    drawMapEffects: (ctx, frameCount, mapEffects) => {
      const { lavaParticles, meteors, lavaSurge, lavaSurgeHeight, volcanoes } = mapEffects

      // Draw distant volcano background
      // Main volcano
      ctx.fillStyle = "#7f1d1d" // red-900
      ctx.beginPath()
      ctx.moveTo(0, CANVAS_HEIGHT)
      ctx.lineTo(CANVAS_WIDTH / 2 - 200, CANVAS_HEIGHT)
      ctx.lineTo(CANVAS_WIDTH / 2, 100)
      ctx.lineTo(CANVAS_WIDTH / 2 + 200, CANVAS_HEIGHT)
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.fill()

      // Volcano crater
      ctx.fillStyle = "#ef4444" // red-500
      ctx.beginPath()
      ctx.arc(CANVAS_WIDTH / 2, 120, 40, 0, Math.PI * 2)
      ctx.fill()

      // Lava streams
      ctx.strokeStyle = "#f97316" // orange-500
      ctx.lineWidth = 5

      // Left stream
      ctx.beginPath()
      ctx.moveTo(CANVAS_WIDTH / 2 - 20, 140)
      ctx.lineTo(CANVAS_WIDTH / 2 - 100, 300)
      ctx.lineTo(CANVAS_WIDTH / 2 - 150, 400)
      ctx.stroke()

      // Right stream
      ctx.beginPath()
      ctx.moveTo(CANVAS_WIDTH / 2 + 20, 140)
      ctx.lineTo(CANVAS_WIDTH / 2 + 80, 250)
      ctx.lineTo(CANVAS_WIDTH / 2 + 180, 400)
      ctx.stroke()

      // Draw lava glow at bottom
      const gradient = ctx.createLinearGradient(0, CANVAS_HEIGHT - 100, 0, CANVAS_HEIGHT)
      gradient.addColorStop(0, "rgba(239, 68, 68, 0)")
      gradient.addColorStop(1, "rgba(239, 68, 68, 0.3)")
      ctx.fillStyle = gradient
      ctx.fillRect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100)

      // Draw volcanoes
      volcanoes.forEach((volcano: any) => {
        // Volcano body
        ctx.fillStyle = "#b91c1c" // red-700
        ctx.beginPath()
        ctx.moveTo(volcano.x, volcano.y)
        ctx.lineTo(volcano.x + volcano.width, volcano.y)
        ctx.lineTo(volcano.x + volcano.width / 2, volcano.y - volcano.height)
        ctx.closePath()
        ctx.fill()

        // Volcano crater
        ctx.fillStyle = "#ef4444" // red-500
        ctx.beginPath()
        ctx.arc(volcano.x + volcano.width / 2, volcano.y - volcano.height + 10, 15, 0, Math.PI)
        ctx.fill()

        // Eruption effect
        if (volcano.erupting) {
          // Lava fountain
          ctx.fillStyle = "#f97316" // orange-500
          ctx.beginPath()
          ctx.arc(volcano.x + volcano.width / 2, volcano.y - volcano.height, 20, 0, Math.PI * 2)
          ctx.fill()

          // Smoke
          for (let i = 0; i < 5; i++) {
            const smokeX = volcano.x + volcano.width / 2 + (Math.random() - 0.5) * 30
            const smokeY = volcano.y - volcano.height - 20 - i * 10
            const smokeSize = 10 + i * 5 + Math.random() * 10

            ctx.fillStyle = `rgba(100, 100, 100, ${0.7 - i * 0.1})`
            ctx.beginPath()
            ctx.arc(smokeX, smokeY, smokeSize, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      })

      // Draw lava surge
      if (lavaSurge && lavaSurgeHeight > 0) {
        ctx.fillStyle = "#ef4444" // red-500
        ctx.fillRect(0, CANVAS_HEIGHT - 20 - lavaSurgeHeight, CANVAS_WIDTH, lavaSurgeHeight + 20)

        // Add lava wave effect
        ctx.beginPath()
        ctx.moveTo(0, CANVAS_HEIGHT - 20 - lavaSurgeHeight)

        for (let x = 0; x < CANVAS_WIDTH; x += 20) {
          const waveHeight = Math.sin(x * 0.05 + frameCount * 0.1) * 5
          ctx.lineTo(x, CANVAS_HEIGHT - 20 - lavaSurgeHeight + waveHeight)
        }

        ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 20 - lavaSurgeHeight)
        ctx.closePath()
        ctx.fillStyle = "#f97316" // orange-500
        ctx.fill()
      }

      // Draw lava particles
      lavaParticles.forEach((particle: any) => {
        const alpha = particle.lifetime / 60
        ctx.fillStyle = `rgba(249, 115, 22, ${alpha})` // orange-500 with fading alpha
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw meteors
      meteors.forEach((meteor: any) => {
        if (meteor.warning) {
          // Draw warning indicator
          ctx.fillStyle = `rgba(239, 68, 68, ${Math.sin(frameCount * 0.2) * 0.5 + 0.5})` // red-500 pulsing
          ctx.beginPath()
          ctx.moveTo(meteor.x - 10, 30)
          ctx.lineTo(meteor.x + 10, 30)
          ctx.lineTo(meteor.x, 45)
          ctx.closePath()
          ctx.fill()
        } else {
          // Draw meteor
          ctx.save()
          ctx.translate(meteor.x, meteor.y)
          ctx.rotate(meteor.rotation)

          // Meteor body
          ctx.fillStyle = "#78716c" // stone-500
          ctx.beginPath()
          ctx.arc(0, 0, meteor.size, 0, Math.PI * 2)
          ctx.fill()

          // Meteor details
          ctx.fillStyle = "#ef4444" // red-500
          ctx.beginPath()
          ctx.arc(meteor.size * 0.3, -meteor.size * 0.2, meteor.size * 0.3, 0, Math.PI * 2)
          ctx.fill()

          // Meteor trail
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(-meteor.velocityX * 5, -meteor.velocityY * 5)
          ctx.lineTo(-meteor.velocityX * 10, -meteor.velocityY * 10)
          ctx.strokeStyle = "#f97316" // orange-500
          ctx.lineWidth = 3
          ctx.stroke()

          ctx.restore()
        }
      })

      // Draw heat distortion effect
      if (frameCount % 3 === 0) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.03)"
        for (let i = 0; i < 8; i++) {
          const x = Math.random() * CANVAS_WIDTH
          const y = CANVAS_HEIGHT - 100 + Math.random() * 100
          const width = 30 + Math.random() * 100
          const height = 5 + Math.random() * 15
          ctx.beginPath()
          ctx.ellipse(x, y, width, height, 0, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    },
  },
  {
    name: "Neon City",
    background: "#18181b", // zinc-900
    ground: "#3f3f46", // zinc-700
    platforms: [
      { id: 1, x: 150, y: 375, width: 133, height: 20 },
      { id: 2, x: 400, y: 300, width: 133, height: 20 },
      { id: 3, x: 650, y: 375, width: 133, height: 20 },
      { id: 4, x: 900, y: 300, width: 133, height: 20 },
      { id: 5, x: 1050, y: 375, width: 133, height: 20 },
      { id: 6, x: 300, y: 225, width: 106, height: 15, moving: true, speed: 1, range: 200, startX: 300 },
      { id: 7, x: 800, y: 225, width: 106, height: 15, moving: true, speed: 1, range: 200, startX: 800 },
    ],
    environmentalObjects: [
      { type: "billboard", x: 50, y: 100, width: 80, height: 40 },
      { type: "billboard", x: 350, y: 150, width: 100, height: 50 },
      { type: "billboard", x: 670, y: 100, width: 80, height: 40 },
      { type: "billboard", x: 950, y: 150, width: 100, height: 50 },
      { type: "antenna", x: 200, y: 50, width: 10, height: 100 },
      { type: "antenna", x: 600, y: 50, width: 10, height: 100 },
      { type: "antenna", x: 1000, y: 50, width: 10, height: 100 },
    ],
    specialFeature: "cyberpunk",
    gravity: GRAVITY,
    friction: 0.9,
    jumpMultiplier: 1.1,
    description: "A futuristic cyberpunk arena with neon lights, moving platforms, and electric hazards.",

    initializeMapEffects: () => {
      return {
        neonLights: [
          { x: 100, y: 100, width: 50, height: 5, color: "#ec4899", blinkRate: 0.02 }, // pink-500
          { x: 300, y: 150, width: 70, height: 5, color: "#3b82f6", blinkRate: 0.03 }, // blue-500
          { x: 500, y: 100, width: 50, height: 5, color: "#10b981", blinkRate: 0.04 }, // emerald-500
          { x: 700, y: 150, width: 70, height: 5, color: "#f59e0b", blinkRate: 0.025 }, // amber-500
          { x: 900, y: 100, width: 50, height: 5, color: "#ec4899", blinkRate: 0.02 }, // pink-500
          { x: 1100, y: 150, width: 70, height: 5, color: "#3b82f6", blinkRate: 0.03 }, // blue-500

          // Vertical neon lights
          { x: 200, y: 50, width: 5, height: 100, color: "#10b981", blinkRate: 0.04 }, // emerald-500
          { x: 400, y: 70, width: 5, height: 80, color: "#f59e0b", blinkRate: 0.025 }, // amber-500
          { x: 600, y: 50, width: 5, height: 100, color: "#ec4899", blinkRate: 0.02 }, // pink-500
          { x: 800, y: 70, width: 5, height: 80, color: "#3b82f6", blinkRate: 0.03 }, // blue-500
          { x: 1000, y: 50, width: 5, height: 100, color: "#10b981", blinkRate: 0.04 }, // emerald-500
        ],
        electricArcs: [],
        nextArc: 60,
        raindrops: Array.from({ length: 200 }, () => ({
          x: Math.random() * CANVAS_WIDTH,
          y: Math.random() * CANVAS_HEIGHT,
          length: 10 + Math.random() * 15,
          speed: 10 + Math.random() * 10,
        })),
        drones: Array.from({ length: 5 }, () => ({
          x: Math.random() * CANVAS_WIDTH,
          y: 100 + Math.random() * 200,
          size: 15 + Math.random() * 10,
          velocityX: -1 + Math.random() * 2,
          velocityY: -0.5 + Math.random(),
          lightColor: Math.random() > 0.5 ? "#ef4444" : "#3b82f6", // red or blue
          blinkRate: 0.1 + Math.random() * 0.1,
        })),
      }
    },

    updateMapEffects: (mapEffects, frameCount, players, comboTextRef) => {
      const { neonLights, electricArcs, nextArc, raindrops, drones } = mapEffects

      // Update neon lights blinking
      neonLights.forEach((light: any) => {
        light.on = Math.sin(frameCount * light.blinkRate) > 0.7
      })

      // Update raindrops
      raindrops.forEach((drop: any) => {
        drop.y += drop.speed
        if (drop.y > CANVAS_HEIGHT) {
          drop.y = -drop.length
          drop.x = Math.random() * CANVAS_WIDTH
        }
      })

      // Update drones
      drones.forEach((drone: any) => {
        // Move drone
        drone.x += drone.velocityX
        drone.y += drone.velocityY

        // Bounce off edges
        if (drone.x < 50 || drone.x > CANVAS_WIDTH - 50) {
          drone.velocityX *= -1
        }

        if (drone.y < 50 || drone.y > CANVAS_HEIGHT - 200) {
          drone.velocityY *= -1
        }

        // Random direction changes
        if (Math.random() < 0.01) {
          drone.velocityX = -1 + Math.random() * 2
          drone.velocityY = -0.5 + Math.random()
        }

        // Drone light blinking
        drone.lightOn = Math.sin(frameCount * drone.blinkRate) > 0

        // Occasionally fire at players
        if (Math.random() < 0.005 && drone.lightOn) {
          // Target nearest player
          const dist1 = Math.sqrt(Math.pow(drone.x - players.player1.x, 2) + Math.pow(drone.y - players.player1.y, 2))
          const dist2 = Math.sqrt(Math.pow(drone.x - players.player2.x, 2) + Math.pow(drone.y - players.player2.y, 2))

          const targetPlayer = dist1 < dist2 ? players.player1 : players.player2

          // Create electric arc to player
          electricArcs.push({
            startX: drone.x,
            startY: drone.y,
            endX: targetPlayer.x,
            endY: targetPlayer.y,
            segments: 5 + Math.floor(Math.random() * 5),
            lifetime: 20 + Math.random() * 20,
            width: 2 + Math.random() * 2,
            color: drone.lightColor,
            warning: false,
          })
        }
      })

      // Spawn electric arcs
      let newNextArc = nextArc - 1
      let newElectricArcs = [...electricArcs]

      if (newNextArc <= 0) {
        // Spawn a new electric arc
        const startX = 100 + Math.random() * (CANVAS_WIDTH - 200)
        const startY = 100 + Math.random() * 150

        newElectricArcs.push({
          startX,
          startY,
          endX: startX + (-50 + Math.random() * 100),
          endY: startY + 50 + Math.random() * 50,
          segments: 5 + Math.floor(Math.random() * 5),
          lifetime: 20 + Math.random() * 20,
          width: 2 + Math.random() * 2,
          color: Math.random() > 0.5 ? "#3b82f6" : "#ec4899", // blue or pink
          warning: true,
          warningTime: 30,
        })

        newNextArc = 120 + Math.floor(Math.random() * 180)
      }

      // Update electric arcs
      newElectricArcs = newElectricArcs.filter((arc: any) => {
        if (arc.warning) {
          arc.warningTime--
          if (arc.warningTime <= 0) {
            arc.warning = false
          }
          return true
        }

        arc.lifetime--

        // Check for player collisions with arc
        if (arc.lifetime > 10) {
          // Only damage during main part of arc lifetime
          const checkPlayerCollision = (player: Player) => {
            // Simple line-point distance check
            const lineLength = Math.sqrt(Math.pow(arc.endX - arc.startX, 2) + Math.pow(arc.endY - arc.startY, 2))
            const t = Math.max(
              0,
              Math.min(
                1,
                ((player.x - arc.startX) * (arc.endX - arc.startX) +
                  (player.y - arc.startY) * (arc.endY - arc.startY)) /
                  (lineLength * lineLength),
              ),
            )

            const nearestX = arc.startX + t * (arc.endX - arc.startX)
            const nearestY = arc.startY + t * (arc.endY - arc.startY)

            const distance = Math.sqrt(Math.pow(player.x - nearestX, 2) + Math.pow(player.y - nearestY, 2))

            if (distance < 30 && !player.hasShield && frameCount % 10 === 0) {
              player.health -= 8
              player.hitReaction = 10
              player.stunned = 30 // Stun player briefly

              comboTextRef.current.push({
                text: "-8 SHOCKED!",
                x: player.x,
                y: player.y - 50,
                timer: 30,
                player: player === players.player1 ? 1 : 2,
              })
            }
          }

          checkPlayerCollision(players.player1)
          checkPlayerCollision(players.player2)
        }

        return arc.lifetime > 0
      })

      return {
        neonLights,
        electricArcs: newElectricArcs,
        nextArc: newNextArc,
        raindrops,
        drones,
      }
    },

    applyMapEffects: (player, frameCount, mapEffects) => {
      const newPlayer = { ...player }

      // Apply stunned effect
      if (newPlayer.stunned && newPlayer.stunned > 0) {
        // Slow down movement when stunned
        newPlayer.velocityX *= 0.7

        // Can't attack when stunned
        if (newPlayer.isAttacking) {
          newPlayer.isAttacking = false
          newPlayer.attackFrame = 0
        }

        // Add electrified visual effect
        newPlayer.specialEffects = { ...newPlayer.specialEffects, electrified: true }
      } else {
        // Remove electrified effect
        if (newPlayer.specialEffects?.electrified) {
          const { electrified, ...rest } = newPlayer.specialEffects
          newPlayer.specialEffects = rest
        }
      }

      return newPlayer
    },

    drawMapEffects: (ctx, frameCount, mapEffects) => {
      const { neonLights, electricArcs, raindrops, drones } = mapEffects

      // Draw cyberpunk city background
      // Distant buildings
      for (let i = 0; i < 20; i++) {
        const x = i * 60
        const height = 100 + (i % 3) * 50
        ctx.fillStyle = "#27272a" // zinc-800
        ctx.fillRect(x, CANVAS_HEIGHT - height - 50, 40, height)

        // Building windows
        ctx.fillStyle = "#52525b" // zinc-600
        for (let j = 0; j < height; j += 15) {
          for (let k = 0; k < 30; k += 10) {
            if (Math.random() > 0.5) {
              ctx.fillRect(x + 5 + k, CANVAS_HEIGHT - height - 50 + j, 5, 10)
            }
          }
        }
      }

      // Draw rain
      ctx.strokeStyle = "rgba(148, 163, 184, 0.5)" // slate-400 with transparency
      ctx.lineWidth = 1
      raindrops.forEach((drop: any) => {
        ctx.beginPath()
        ctx.moveTo(drop.x, drop.y)
        ctx.lineTo(drop.x - 1, drop.y + drop.length)
        ctx.stroke()
      })

      // Draw neon lights
      neonLights.forEach((light: any) => {
        if (light.on) {
          // Glow effect
          ctx.shadowColor = light.color
          ctx.shadowBlur = 15
          ctx.fillStyle = light.color
          ctx.fillRect(light.x, light.y, light.width, light.height)

          // Reset shadow
          ctx.shadowBlur = 0
        } else {
          // Dimmed light
          ctx.fillStyle = "#71717a" // zinc-500
          ctx.fillRect(light.x, light.y, light.width, light.height)
        }
      })

      // Draw drones
      drones.forEach((drone: any) => {
        // Drone body
        ctx.fillStyle = "#52525b" // zinc-600
        ctx.beginPath()
        ctx.arc(drone.x, drone.y, drone.size, 0, Math.PI * 2)
        ctx.fill()

        // Drone details
        ctx.fillStyle = "#27272a" // zinc-800
        ctx.beginPath()
        ctx.arc(drone.x, drone.y, drone.size * 0.7, 0, Math.PI * 2)
        ctx.fill()

        // Drone light
        if (drone.lightOn) {
          ctx.fillStyle = drone.lightColor
          ctx.beginPath()
          ctx.arc(drone.x, drone.y, drone.size * 0.3, 0, Math.PI * 2)
          ctx.fill()

          // Light beam
          ctx.strokeStyle = drone.lightColor
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(drone.x, drone.y)
          ctx.lineTo(drone.x, drone.y + 100)
          ctx.stroke()
        }

        // Drone propellers
        ctx.strokeStyle = "#94a3b8" // slate-400
        ctx.lineWidth = 1

        // Left propeller
        ctx.beginPath()
        ctx.moveTo(drone.x - drone.size, drone.y)
        ctx.lineTo(drone.x - drone.size - 10, drone.y - 5)
        ctx.stroke()

        // Right propeller
        ctx.beginPath()
        ctx.moveTo(drone.x + drone.size, drone.y)
        ctx.lineTo(drone.x + drone.size + 10, drone.y - 5)
        ctx.stroke()
      })

      // Draw electric arcs
      electricArcs.forEach((arc: any) => {
        if (arc.warning) {
          // Draw warning indicator
          ctx.fillStyle = `rgba(236, 72, 153, ${Math.sin(frameCount * 0.2) * 0.5 + 0.5})` // pink-500 pulsing
          ctx.beginPath()
          ctx.arc(arc.startX, arc.startY, 10, 0, Math.PI * 2)
          ctx.fill()
        } else {
          // Draw lightning arc
          ctx.strokeStyle = arc.color
          ctx.lineWidth = arc.width * (arc.lifetime / 30) // Fade out by reducing width

          // Create jagged lightning effect
          ctx.beginPath()
          ctx.moveTo(arc.startX, arc.startY)

          const segmentLength = 1 / arc.segments

          for (let i = 1; i < arc.segments; i++) {
            const t = i * segmentLength
            const x = arc.startX + (arc.endX - arc.startX) * t
            const y = arc.startY + (arc.endY - arc.startY) * t

            // Add randomness to each segment
            const jitterAmount = 20 * Math.sin(frameCount * 0.5 + i)
            ctx.lineTo(x + jitterAmount, y + jitterAmount * 0.5)
          }

          ctx.lineTo(arc.endX, arc.endY)
          ctx.stroke()

          // Add glow effect
          ctx.shadowColor = arc.color
          ctx.shadowBlur = 10
          ctx.stroke()
          ctx.shadowBlur = 0
        }
      })

      // Draw holographic billboards
      // Billboard 1
      const billboard1X = 200
      const billboard1Y = 150

      ctx.fillStyle = "rgba(59, 130, 246, 0.3)" // blue-500 with transparency
      ctx.fillRect(billboard1X, billboard1Y, 150, 80)

      // Billboard content
      ctx.font = "20px sans-serif"
      ctx.fillStyle = "#ffffff"
      ctx.fillText("CYBER", billboard1X + 40, billboard1Y + 30)
      ctx.fillText("ARENA", billboard1X + 40, billboard1Y + 60)

      // Billboard 2
      const billboard2X = 800
      const billboard2Y = 180

      ctx.fillStyle = "rgba(236, 72, 153, 0.3)" // pink-500 with transparency
      ctx.fillRect(billboard2X, billboard2Y, 150, 80)

      // Billboard content
      ctx.font = "20px sans-serif"
      ctx.fillStyle = "#ffffff"
      ctx.fillText("FIGHT!", billboard2X + 40, billboard2Y + 45)
    },
  },
  {
    name: "Underwater Reef",
    background: "#0c4a6e", // sky-900
    ground: "#0e7490", // cyan-700
    platforms: [
      { id: 1, x: 150, y: 375, width: 133, height: 20 },
      { id: 2, x: 400, y: 300, width: 133, height: 20 },
      { id: 3, x: 650, y: 375, width: 133, height: 20 },
      { id: 4, x: 900, y: 300, width: 133, height: 20 },
      { id: 5, x: 1050, y: 375, width: 133, height: 20 },
      { id: 6, x: 300, y: 450, width: 200, height: 20 },
      { id: 7, x: 700, y: 450, width: 200, height: 20 },
    ],
    environmentalObjects: [
      { type: "coral", x: 100, y: 300, width: 50, height: 50 },
      { type: "coral", x: 300, y: 350, width: 60, height: 60 },
      { type: "coral", x: 500, y: 300, width: 50, height: 50 },
      { type: "coral", x: 700, y: 350, width: 60, height: 60 },
      { type: "coral", x: 900, y: 300, width: 50, height: 50 },
      { type: "coral", x: 1100, y: 350, width: 60, height: 60 },
      { type: "bubble", x: 200, y: 350, width: 20, height: 20 },
      { type: "bubble", x: 400, y: 350, width: 15, height: 15 },
      { type: "bubble", x: 600, y: 350, width: 25, height: 25 },
      { type: "bubble", x: 800, y: 350, width: 20, height: 20 },
      { type: "bubble", x: 1000, y: 350, width: 15, height: 15 },
    ],
    specialFeature: "underwater",
    gravity: GRAVITY * 0.6, // Reduced gravity underwater
    friction: 0.95, // Water resistance
    jumpMultiplier: 0.8, // Lower jumps due to water resistance
    description:
      "An underwater arena with reduced gravity, water currents, and limited oxygen. Watch out for sea creatures!",

    initializeMapEffects: () => {
      return {
        bubbles: Array.from({ length: 50 }, () => ({
          x: Math.random() * CANVAS_WIDTH,
          y: CANVAS_HEIGHT - Math.random() * 50,
          size: 3 + Math.random() * 8,
          speed: 1 + Math.random() * 2,
        })),
        waterCurrents: [
          { x: 0, y: 150, width: CANVAS_WIDTH / 3, height: 100, direction: 1, strength: 0.5 },
          { x: CANVAS_WIDTH / 3, y: 250, width: CANVAS_WIDTH / 3, height: 100, direction: -1, strength: 0.5 },
          { x: (CANVAS_WIDTH / 3) * 2, y: 150, width: CANVAS_WIDTH / 3, height: 100, direction: 1, strength: 0.5 },
        ],
        jellyfish: [],
        nextJellyfish: 120,
        seaweed: Array.from({ length: 15 }, (_, i) => ({
          x: i * 80 + 20,
          y: CANVAS_HEIGHT,
          height: 70 + Math.random() * 30,
          segments: 5 + Math.floor(Math.random() * 3),
          waveSpeed: 0.02 + Math.random() * 0.03,
          waveAmplitude: 10 + Math.random() * 10,
        })),
        fish: Array.from({ length: 10 }, () => ({
          x: Math.random() * CANVAS_WIDTH,
          y: 100 + Math.random() * 300,
          size: 15 + Math.random() * 10,
          velocityX: 1 + Math.random() * 2,
          color: Math.random() > 0.5 ? "#f59e0b" : "#3b82f6", // amber or blue
          tailSpeed: 0.1 + Math.random() * 0.1,
          tailPhase: Math.random() * Math.PI * 2,
        })),
      }
    },

    updateMapEffects: (mapEffects, frameCount, players, comboTextRef) => {
      const { bubbles, waterCurrents, jellyfish, nextJellyfish, seaweed, fish } = mapEffects

      // Update bubbles
      bubbles.forEach((bubble: any) => {
        bubble.y -= bubble.speed
        bubble.x += Math.sin(frameCount * 0.05 + bubble.y * 0.1) * 0.5

        if (bubble.y < 0) {
          bubble.y = CANVAS_HEIGHT
          bubble.x = Math.random() * CANVAS_WIDTH
        }
      })

      // Update seaweed
      seaweed.forEach((plant: any) => {
        plant.phase = frameCount * plant.waveSpeed
      })

      // Update fish
      fish.forEach((fish: any) => {
        // Move fish
        fish.x += fish.velocityX

        // Wrap around screen
        if (fish.x > CANVAS_WIDTH + 50) {
          fish.x = -50
          fish.y = 100 + Math.random() * 300
        }

        // Update tail animation
        fish.tailPhase += fish.tailSpeed
      })

      // Spawn jellyfish
      let newNextJellyfish = nextJellyfish - 1
      let newJellyfish = [...jellyfish]

      if (newNextJellyfish <= 0) {
        // Spawn a new jellyfish
        const side = Math.random() > 0.5 ? 1 : -1
        newJellyfish.push({
          x: side > 0 ? -30 : CANVAS_WIDTH + 30,
          y: 100 + Math.random() * 200,
          size: 20 + Math.random() * 15,
          velocityX: side * (0.5 + Math.random()),
          velocityY: Math.sin(frameCount * 0.01) * 0.5,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.05 + Math.random() * 0.05,
          color: Math.random() > 0.5 ? "#ec4899" : "#8b5cf6", // pink or purple
        })
        newNextJellyfish = 180 + Math.floor(Math.random() * 120)
      }

      // Update jellyfish
      newJellyfish = newJellyfish.filter((jelly: any) => {
        // Move jellyfish
        jelly.x += jelly.velocityX
        jelly.y += Math.sin(frameCount * 0.02) * 0.5 // Gentle up/down movement
        jelly.pulsePhase += jelly.pulseSpeed

        // Check if jellyfish is off screen
        if (jelly.x < -50 || jelly.x > CANVAS_WIDTH + 50) {
          return false
        }

        // Check for collisions with players
        const checkPlayerCollision = (player: Player) => {
          const dx = player.x - jelly.x
          const dy = player.y - jelly.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < jelly.size + 20) {
            // Collision! Poison player
            if (!player.hasShield && frameCount % 30 === 0) {
              player.health -= 5
              player.poisoned = 120 // Poison effect lasts 2 seconds

              comboTextRef.current.push({
                text: "-5 POISONED!",
                x: player.x,
                y: player.y - 50,
                timer: 30,
                player: player === players.player1 ? 1 : 2,
              })
            }
          }
        }

        checkPlayerCollision(players.player1)
        checkPlayerCollision(players.player2)

        return true
      })

      // Apply water currents to players
      waterCurrents.forEach((current: any) => {
        // Player 1 in current
        if (
          players.player1.x > current.x &&
          players.player1.x < current.x + current.width &&
          players.player1.y > current.y &&
          players.player1.y < current.y + current.height
        ) {
          players.player1.velocityX += current.direction * current.strength
        }

        // Player 2 in current
        if (
          players.player2.x > current.x &&
          players.player2.x < current.x + current.width &&
          players.player2.y > current.y &&
          players.player2.y < current.y + current.height
        ) {
          players.player2.velocityX += current.direction * current.strength
        }
      })

      // Update oxygen levels for players
      // Player 1 oxygen
      if (!players.player1.oxygen) {
        players.player1.oxygen = 600 // 10 seconds of oxygen
      } else {
        players.player1.oxygen--

        // Low oxygen warning
        if (players.player1.oxygen === 180) {
          // 3 seconds left
          comboTextRef.current.push({
            text: "LOW OXYGEN!",
            x: players.player1.x,
            y: players.player1.y - 70,
            timer: 60,
            player: 1,
          })
        }

        // Damage when out of oxygen
        if (players.player1.oxygen <= 0) {
          players.player1.oxygen = 0
          if (frameCount % 30 === 0) {
            players.player1.health -= 5
            comboTextRef.current.push({
              text: "-5 NO OXYGEN!",
              x: players.player1.x,
              y: players.player1.y - 50,
              timer: 30,
              player: 1,
            })
          }
        }
      }

      // Player 2 oxygen
      if (!players.player2.oxygen) {
        players.player2.oxygen = 600 // 10 seconds of oxygen
      } else {
        players.player2.oxygen--

        // Low oxygen warning
        if (players.player2.oxygen === 180) {
          // 3 seconds left
          comboTextRef.current.push({
            text: "LOW OXYGEN!",
            x: players.player2.x,
            y: players.player2.y - 70,
            timer: 60,
            player: 2,
          })
        }

        // Damage when out of oxygen
        if (players.player2.oxygen <= 0) {
          players.player2.oxygen = 0
          if (frameCount % 30 === 0) {
            players.player2.health -= 5
            comboTextRef.current.push({
              text: "-5 NO OXYGEN!",
              x: players.player2.x,
              y: players.player2.y - 50,
              timer: 30,
              player: 2,
            })
          }
        }
      }

      return {
        bubbles,
        waterCurrents,
        jellyfish: newJellyfish,
        nextJellyfish: newNextJellyfish,
        seaweed,
        fish,
      }
    },

    applyMapEffects: (player, frameCount, mapEffects) => {
      const newPlayer = { ...player }

      // Apply water resistance to movement
      newPlayer.velocityX *= 0.95
      newPlayer.velocityY *= 0.95

      // Apply poisoned effect
      if (newPlayer.poisoned && newPlayer.poisoned > 0) {
        // Poisoned causes damage over time
        if (frameCount % 60 === 0) {
          // Every second
          newPlayer.health -= 1
        }

        // Add poisoned visual effect
        newPlayer.specialEffects = { ...newPlayer.specialEffects, poisoned: true }
      } else {
        // Remove poisoned effect
        if (newPlayer.specialEffects?.poisoned) {
          const { poisoned, ...rest } = newPlayer.specialEffects
          newPlayer.specialEffects = rest
        }
      }

      return newPlayer
    },

    drawMapEffects: (ctx, frameCount, mapEffects) => {
      const { bubbles, waterCurrents, jellyfish, seaweed, fish } = mapEffects

      // Draw underwater background
      // Distant coral reef
      for (let i = 0; i < 10; i++) {
        const x = i * (CANVAS_WIDTH / 10)
        const height = 80 + Math.sin(i * 0.5) * 30

        // Base coral
        ctx.fillStyle = "#be185d" // pink-800
        ctx.beginPath()
        ctx.moveTo(x, CANVAS_HEIGHT)
        ctx.lineTo(x, CANVAS_HEIGHT - height)
        ctx.lineTo(x + CANVAS_WIDTH / 20, CANVAS_HEIGHT - height + 20)
        ctx.lineTo(x + CANVAS_WIDTH / 10, CANVAS_HEIGHT - height)
        ctx.lineTo(x + CANVAS_WIDTH / 10, CANVAS_HEIGHT)
        ctx.closePath()
        ctx.fill()

        // Coral details
        ctx.fillStyle = "#db2777" // pink-600
        ctx.beginPath()
        ctx.arc(x + CANVAS_WIDTH / 20, CANVAS_HEIGHT - height + 10, 15, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw water effect overlay
      ctx.fillStyle = "rgba(14, 165, 233, 0.1)" // sky-500 with transparency
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Draw water currents
      waterCurrents.forEach((current: any) => {
        // Draw subtle current indicators
        ctx.fillStyle = "rgba(56, 189, 248, 0.2)" // sky-400 with transparency
        ctx.fillRect(current.x, current.y, current.width, current.height)

        // Draw direction arrows
        const arrowSpacing = 80
        const arrowSize = 10

        ctx.fillStyle = "rgba(186, 230, 253, 0.4)" // sky-200 with transparency

        for (let x = current.x + 40; x < current.x + current.width; x += arrowSpacing) {
          for (let y = current.y + 20; y < current.y + current.height; y += 40) {
            ctx.beginPath()
            if (current.direction > 0) {
              // Right-pointing arrow
              ctx.moveTo(x, y)
              ctx.lineTo(x + arrowSize, y + arrowSize / 2)
              ctx.lineTo(x, y + arrowSize)
            } else {
              // Left-pointing arrow
              ctx.moveTo(x, y)
              ctx.lineTo(x - arrowSize, y + arrowSize / 2)
              ctx.lineTo(x, y + arrowSize)
            }
            ctx.closePath()
            ctx.fill()
          }
        }
      })

      // Draw fish
      fish.forEach((fish: any) => {
        ctx.save()
        ctx.translate(fish.x, fish.y)

        // Fish body
        ctx.fillStyle = fish.color
        ctx.beginPath()
        ctx.ellipse(0, 0, fish.size, fish.size / 2, 0, 0, Math.PI * 2)
        ctx.fill()

        // Fish tail
        const tailWag = (Math.sin(fish.tailPhase) * fish.size) / 2

        ctx.beginPath()
        ctx.moveTo(-fish.size + 5, 0)
        ctx.lineTo(-fish.size - fish.size / 2, -fish.size / 3 + tailWag)
        ctx.lineTo(-fish.size - fish.size / 2, fish.size / 3 + tailWag)
        ctx.closePath()
        ctx.fill()

        // Fish eye
        ctx.fillStyle = "#ffffff"
        ctx.beginPath()
        ctx.arc(fish.size / 2, -fish.size / 4, fish.size / 6, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = "#000000"
        ctx.beginPath()
        ctx.arc(fish.size / 2 + 2, -fish.size / 4, fish.size / 10, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()
      })

      // Draw seaweed
      ctx.strokeStyle = "#15803d" // green-700
      ctx.lineWidth = 3

      seaweed.forEach((plant: any) => {
        ctx.beginPath()
        ctx.moveTo(plant.x, plant.y)

        const segmentHeight = plant.height / plant.segments

        for (let i = 1; i <= plant.segments; i++) {
          const t = i / plant.segments
          const waveOffset = Math.sin(plant.phase + t * Math.PI) * plant.waveAmplitude
          const x = plant.x + waveOffset
          const y = plant.y - t * plant.height

          ctx.lineTo(x, y)
        }

        ctx.stroke()
      })

      // Draw jellyfish
      jellyfish.forEach((jelly: any) => {
        // Pulse animation
        const pulseScale = 0.8 + Math.sin(jelly.pulsePhase) * 0.2

        // Draw bell
        ctx.fillStyle = jelly.color
        ctx.beginPath()
        ctx.arc(jelly.x, jelly.y, jelly.size * pulseScale, 0, Math.PI)
        ctx.fill()

        // Draw tentacles
        ctx.strokeStyle = jelly.color
        ctx.lineWidth = 2

        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI + Math.PI
          const tentacleLength = jelly.size * (1.5 + Math.sin(jelly.pulsePhase + i) * 0.5)

          ctx.beginPath()
          ctx.moveTo(jelly.x + Math.cos(angle) * jelly.size * 0.9, jelly.y + Math.sin(angle) * jelly.size * 0.9)

          // Wavy tentacle
          for (let j = 1; j <= 3; j++) {
            const t = j / 3
            const waveOffset = Math.sin(frameCount * 0.1 + i + j) * 5
            const x = jelly.x + Math.cos(angle) * jelly.size * 0.9 + waveOffset
            const y = jelly.y + Math.sin(angle) * jelly.size * 0.9 + tentacleLength * t

            ctx.lineTo(x, y)
          }

          ctx.stroke()
        }

        // Glow effect
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)"
        ctx.beginPath()
        ctx.arc(jelly.x, jelly.y - jelly.size * 0.3, jelly.size * 0.4, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw bubbles
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)"
      ctx.lineWidth = 1

      bubbles.forEach((bubble: any) => {
        ctx.beginPath()
        ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2)
        ctx.stroke()

        // Highlight
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)"
        ctx.beginPath()
        ctx.arc(bubble.x - bubble.size * 0.3, bubble.y - bubble.size * 0.3, bubble.size * 0.3, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw light rays
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)"

      for (let i = 0; i < 8; i++) {
        const x = 100 + i * 150
        const width = 30 + Math.sin(frameCount * 0.02) * 10

        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x + width, CANVAS_HEIGHT)
        ctx.lineTo(x - width, CANVAS_HEIGHT)
        ctx.closePath()
        ctx.fill()
      }

      // Draw oxygen indicators for players
      if (players.player1.oxygen !== undefined) {
        const oxygenPercentage = Math.max(0, players.player1.oxygen / 600)

        // Player 1 oxygen bar
        ctx.fillStyle = "#6b7280" // gray-500
        ctx.fillRect(50, 60, 200, 10)

        // Oxygen level with color based on amount
        const oxygenColor =
          oxygenPercentage > 0.6
            ? "#22c55e"
            : // green-500
              oxygenPercentage > 0.3
              ? "#f59e0b"
              : // amber-500
                "#ef4444" // red-500

        ctx.fillStyle = oxygenColor
        ctx.fillRect(50, 60, 200 * oxygenPercentage, 10)
        ctx.strokeStyle = "#000"
        ctx.strokeRect(50, 60, 200, 10)

        // Oxygen label
        ctx.fillStyle = "#fff"
        ctx.font = "12px sans-serif"
        ctx.fillText("O₂", 30, 68)
      }

      if (players.player2.oxygen !== undefined) {
        const oxygenPercentage = Math.max(0, players.player2.oxygen / 600)

        // Player 2 oxygen bar
        ctx.fillStyle = "#6b7280" // gray-500
        ctx.fillRect(CANVAS_WIDTH - 250, 60, 200, 10)

        // Oxygen level with color based on amount
        const oxygenColor =
          oxygenPercentage > 0.6
            ? "#22c55e"
            : // green-500
              oxygenPercentage > 0.3
              ? "#f59e0b"
              : // amber-500
                "#ef4444" // red-500

        ctx.fillStyle = oxygenColor
        ctx.fillRect(CANVAS_WIDTH - 250, 60, 200 * oxygenPercentage, 10)
        ctx.strokeStyle = "#000"
        ctx.strokeRect(CANVAS_WIDTH - 250, 60, 200, 10)

        // Oxygen label
        ctx.fillStyle = "#fff"
        ctx.font = "12px sans-serif"
        ctx.fillText("O₂", CANVAS_WIDTH - 270, 68)
      }
    },
  },
  {
    name: "Haunted Mansion",
    background: "#1e1b4b", // indigo-950
    ground: "#312e81", // indigo-900
    platforms: [
      { id: 1, x: 150, y: 375, width: 133, height: 20 },
      { id: 2, x: 400, y: 300, width: 133, height: 20 },
      { id: 3, x: 650, y: 375, width: 133, height: 20 },
      { id: 4, x: 900, y: 300, width: 133, height: 20 },
      { id: 5, x: 1050, y: 375, width: 133, height: 20 },
      { id: 6, x: 275, y: 450, width: 133, height: 20 },
      { id: 7, x: 775, y: 450, width: 133, height: 20 },
    ],
    environmentalObjects: [
      { type: "ghost", x: 100, y: 150, width: 40, height: 60 },
      { type: "ghost", x: 400, y: 100, width: 40, height: 60 },
      { type: "ghost", x: 700, y: 150, width: 40, height: 60 },
      { type: "ghost", x: 1000, y: 100, width: 40, height: 60 },
    ],
    specialFeature: "haunted",
    gravity: GRAVITY,
    friction: 0.9,
    jumpMultiplier: 1.0,
    description: "A spooky mansion with disappearing platforms, ghostly apparitions, and possession mechanics.",

    initializeMapEffects: () => {
      return {
        ghosts: Array.from({ length: 5 }, () => ({
          x: Math.random() * CANVAS_WIDTH,
          y: 100 + Math.random() * 200,
          velocityX: -1 + Math.random() * 2,
          velocityY: -1 + Math.random() * 2,
          size: 30 + Math.random() * 20,
          opacity: 0.1 + Math.random() * 0.4,
          active: true,
          targetPlayer: Math.random() > 0.5 ? 1 : 2,
          possessionTimer: 0,
        })),
        fogParticles: Array.from({ length: 80 }, () => ({
          x: Math.random() * CANVAS_WIDTH,
          y: Math.random() * CANVAS_HEIGHT,
          size: 30 + Math.random() * 70,
          speed: 0.2 + Math.random() * 0.5,
          opacity: 0.05 + Math.random() * 0.1,
        })),
        flickeringLights: [
          { x: 100, y: 100, radius: 100, intensity: 0.8, flickerSpeed: 0.05 },
          { x: 400, y: 150, radius: 120, intensity: 0.7, flickerSpeed: 0.03 },
          { x: 700, y: 100, radius: 100, intensity: 0.8, flickerSpeed: 0.04 },
          { x: 1000, y: 150, radius: 120, intensity: 0.7, flickerSpeed: 0.03 },
        ],
        platformVisibility: [true, true, true, true, true, true, true],
        nextPlatformToggle: 180,
        hauntedPortraits: [
          { x: 200, y: 100, width: 60, height: 80, nextAnimation: 180 + Math.random() * 120 },
          { x: 600, y: 120, width: 60, height: 80, nextAnimation: 240 + Math.random() * 120 },
          { x: 900, y: 100, width: 60, height: 80, nextAnimation: 300 + Math.random() * 120 },
        ],
      }
    },

    updateMapEffects: (mapEffects, frameCount, players, comboTextRef) => {
      const { ghosts, fogParticles, flickeringLights, platformVisibility, nextPlatformToggle, hauntedPortraits } =
        mapEffects

      // Update fog particles
      fogParticles.forEach((particle: any) => {
        particle.x += particle.speed * Math.sin(frameCount * 0.01 + particle.y * 0.01)

        if (particle.x > CANVAS_WIDTH + 100) {
          particle.x = -100
        } else if (particle.x < -100) {
          particle.x = CANVAS_WIDTH + 100
        }
      })

      // Update flickering lights
      flickeringLights.forEach((light: any) => {
        light.currentIntensity = light.intensity * (0.7 + Math.random() * 0.3)
      })

      // Update haunted portraits
      hauntedPortraits.forEach((portrait: any) => {
        portrait.nextAnimation--

        if (portrait.nextAnimation <= 0) {
          // Start animation
          portrait.animating = true
          portrait.animationTime = 90 // 1.5 seconds
          portrait.nextAnimation = 300 + Math.random() * 300 // 5-10 seconds

          // Random animation type
          portrait.animationType = Math.floor(Math.random() * 3) // 0: eyes, 1: scream, 2: transform
        }

        if (portrait.animating) {
          portrait.animationTime--

          if (portrait.animationTime <= 0) {
            portrait.animating = false
          }
        }
      })

      // Toggle platform visibility
      const newPlatformVisibility = [...platformVisibility]
      let newNextPlatformToggle = nextPlatformToggle - 1

      if (newNextPlatformToggle <= 0) {
        // Randomly toggle 1-2 platforms
        const numToToggle = 1 + Math.floor(Math.random() * 2)

        for (let i = 0; i < numToToggle; i++) {
          const platformIndex = Math.floor(Math.random() * platformVisibility.length)
          newPlatformVisibility[platformIndex] = !newPlatformVisibility[platformIndex]

          // If a platform is disappearing and a player is on it, warn them
          if (!newPlatformVisibility[platformIndex]) {
            if (players.player1.platformId === platformIndex + 1) {
              comboTextRef.current.push({
                text: "PLATFORM VANISHING!",
                x: players.player1.x,
                y: players.player1.y - 50,
                timer: 45,
                player: 1,
              })
            }

            if (players.player2.platformId === platformIndex + 1) {
              comboTextRef.current.push({
                text: "PLATFORM VANISHING!",
                x: players.player2.x,
                y: players.player2.y - 50,
                timer: 45,
                player: 2,
              })
            }
          }
        }

        newNextPlatformToggle = 180 + Math.floor(Math.random() * 120)
      }

      // Update ghosts
      ghosts.forEach((ghost: any) => {
        if (!ghost.active) {
          // Ghost is currently possessing a player
          ghost.possessionTimer--

          if (ghost.possessionTimer <= 0) {
            ghost.active = true

            // Release the possessed player
            if (ghost.targetPlayer === 1) {
              players.player1.possessed = false
            } else {
              players.player2.possessed = false
            }
          }
          return
        }

        // Move ghost
        ghost.x += ghost.velocityX
        ghost.y += ghost.velocityY

        // Bounce off edges
        if (ghost.x < 0 || ghost.x > CANVAS_WIDTH) {
          ghost.velocityX *= -1
        }

        if (ghost.y < 0 || ghost.y > CANVAS_HEIGHT) {
          ghost.velocityY *= -1
        }

        // Randomly change direction occasionally
        if (Math.random() < 0.01) {
          ghost.velocityX = -1 + Math.random() * 2
          ghost.velocityY = -1 + Math.random() * 2
        }

        // Target a player
        const targetPlayer = ghost.targetPlayer === 1 ? players.player1 : players.player2

        // Move toward target player occasionally
        if (Math.random() < 0.05) {
          const dx = targetPlayer.x - ghost.x
          const dy = targetPlayer.y - ghost.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist > 0) {
            ghost.velocityX = (dx / dist) * (0.5 + Math.random())
            ghost.velocityY = (dy / dist) * (0.5 + Math.random())
          }
        }

        // Check for collision with target player
        const dx = targetPlayer.x - ghost.x
        const dy = targetPlayer.y - ghost.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < ghost.size / 2 + 20 && !targetPlayer.hasShield) {
          // Possess the player!
          ghost.active = false
          ghost.possessionTimer = 180 // 3 seconds of possession

          if (ghost.targetPlayer === 1) {
            players.player1.possessed = true

            comboTextRef.current.push({
              text: "POSSESSED!",
              x: players.player1.x,
              y: players.player1.y - 50,
              timer: 60,
              player: 1,
            })
          } else {
            players.player2.possessed = true

            comboTextRef.current.push({
              text: "POSSESSED!",
              x: players.player2.x,
              y: players.player2.y - 50,
              timer: 60,
              player: 2,
            })
          }
        }
      })

      return {
        ghosts,
        fogParticles,
        flickeringLights,
        platformVisibility: newPlatformVisibility,
        nextPlatformToggle: newNextPlatformToggle,
        hauntedPortraits,
      }
    },

    applyMapEffects: (player, frameCount, mapEffects) => {
      const newPlayer = { ...player }

      // Apply possession effect
      if (newPlayer.possessed) {
        // Possessed players move erratically
        if (Math.random() < 0.1) {
          newPlayer.velocityX = -5 + Math.random() * 10
        }

        if (Math.random() < 0.05 && !newPlayer.isJumping) {
          newPlayer.velocityY = -10 // Random jumps
        }

        // Random attacks
        if (Math.random() < 0.05 && !newPlayer.isAttacking && newPlayer.attackCooldown <= 0) {
          newPlayer.isAttacking = true
          newPlayer.attackType = "punch"
          newPlayer.attackFrame = 10
          newPlayer.attackCooldown = 20
        }

        // Add possessed visual effect
        newPlayer.specialEffects = { ...newPlayer.specialEffects, possessed: true }
      } else {
        // Remove possessed effect
        if (newPlayer.specialEffects?.possessed) {
          const { possessed, ...rest } = newPlayer.specialEffects
          newPlayer.specialEffects = rest
        }
      }

      return newPlayer
    },

    drawMapEffects: (ctx, frameCount, mapEffects) => {
      const { ghosts, fogParticles, flickeringLights, hauntedPortraits } = mapEffects

      // Draw haunted mansion background
      // Main mansion structure
      ctx.fillStyle = "#1e1b4b" // indigo-950
      ctx.fillRect(0, 50, CANVAS_WIDTH, 150)

      // Mansion roof
      ctx.fillStyle = "#312e81" // indigo-900
      ctx.beginPath()
      ctx.moveTo(0, 50)
      ctx.lineTo(CANVAS_WIDTH / 2, 0)
      ctx.lineTo(CANVAS_WIDTH, 50)
      ctx.closePath()
      ctx.fill()

      // Windows
      for (let i = 0; i < 8; i++) {
        const x = 100 + i * 150
        const y = 80
        const width = 60
        const height = 80

        // Window frame
        ctx.fillStyle = "#4c1d95" // purple-900
        ctx.fillRect(x, y, width, height)

        // Window panes
        const glowIntensity = 0.3 + Math.sin(frameCount * 0.02 + i) * 0.2
        ctx.fillStyle = `rgba(100, 100, 200, ${glowIntensity})`
        ctx.fillRect(x + 5, y + 5, width - 10, height - 10)

        // Window dividers
        ctx.strokeStyle = "#4c1d95"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x + width / 2, y)
        ctx.lineTo(x + width / 2, y + height)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(x, y + height / 2)
        ctx.lineTo(x + width, y + height / 2)
        ctx.stroke()
      }

      // Draw flickering lights
      flickeringLights.forEach((light: any) => {
        const gradient = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, light.radius)

        gradient.addColorStop(0, `rgba(255, 255, 200, ${light.currentIntensity})`)
        gradient.addColorStop(1, "rgba(255, 255, 200, 0)")

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw haunted portraits
      hauntedPortraits.forEach((portrait: any) => {
        // Portrait frame
        ctx.fillStyle = "#78350f" // amber-900
        ctx.fillRect(portrait.x - 5, portrait.y - 5, portrait.width + 10, portrait.height + 10)

        // Portrait background
        ctx.fillStyle = "#1f2937" // gray-800
        ctx.fillRect(portrait.x, portrait.y, portrait.width, portrait.height)

        if (portrait.animating) {
          // Animate based on type
          switch (portrait.animationType) {
            case 0: // Glowing eyes
              // Face outline
              ctx.strokeStyle = "#94a3b8" // slate-400
              ctx.beginPath()
              ctx.arc(
                portrait.x + portrait.width / 2,
                portrait.y + portrait.height / 2,
                portrait.width / 3,
                0,
                Math.PI * 2,
              )
              ctx.stroke()

              // Glowing eyes
              const eyeGlow = Math.sin(frameCount * 0.2) * 0.5 + 0.5
              ctx.fillStyle = `rgba(239, 68, 68, ${eyeGlow})` // red-500
              ctx.beginPath()
              ctx.arc(portrait.x + portrait.width / 2 - 10, portrait.y + portrait.height / 2 - 5, 5, 0, Math.PI * 2)
              ctx.fill()
              ctx.beginPath()
              ctx.arc(portrait.x + portrait.width / 2 + 10, portrait.y + portrait.height / 2 - 5, 5, 0, Math.PI * 2)
              ctx.fill()
              break

            case 1: // Screaming face
              // Face outline
              ctx.strokeStyle = "#94a3b8" // slate-400
              ctx.beginPath()
              ctx.arc(
                portrait.x + portrait.width / 2,
                portrait.y + portrait.height / 2,
                portrait.width / 3,
                0,
                Math.PI * 2,
              )
              ctx.stroke()

              // Eyes
              ctx.fillStyle = "#000000"
              ctx.beginPath()
              ctx.arc(portrait.x + portrait.width / 2 - 10, portrait.y + portrait.height / 2 - 5, 5, 0, Math.PI * 2)
              ctx.fill()
              ctx.beginPath()
              ctx.arc(portrait.x + portrait.width / 2 + 10, portrait.y + portrait.height / 2 - 5, 5, 0, Math.PI * 2)
              ctx.fill()

              // Screaming mouth
              ctx.fillStyle = "#000000"
              ctx.beginPath()
              ctx.arc(portrait.x + portrait.width / 2, portrait.y + portrait.height / 2 + 10, 10, 0, Math.PI * 2)
              ctx.fill()
              break

            case 2: // Transforming face
              // Distorted face
              ctx.strokeStyle = "#94a3b8" // slate-400
              ctx.beginPath()
              ctx.arc(
                portrait.x + portrait.width / 2 + Math.sin(frameCount * 0.2) * 5,
                portrait.y + portrait.height / 2 + Math.cos(frameCount * 0.2) * 5,
                portrait.width / 3 + Math.sin(frameCount * 0.3) * 5,
                0,
                Math.PI * 2,
              )
              ctx.stroke()

              // Distorted eyes
              ctx.fillStyle = "#ef4444" // red-500
              ctx.beginPath()
              ctx.arc(
                portrait.x + portrait.width / 2 - 10 + Math.sin(frameCount * 0.3) * 3,
                portrait.y + portrait.height / 2 - 5 + Math.cos(frameCount * 0.3) * 3,
                5 + Math.sin(frameCount * 0.4) * 2,
                0,
                Math.PI * 2,
              )
              ctx.fill()

              ctx.beginPath()
              ctx.arc(
                portrait.x + portrait.width / 2 + 10 + Math.sin(frameCount * 0.3 + 1) * 3,
                portrait.y + portrait.height / 2 - 5 + Math.cos(frameCount * 0.3 + 1) * 3,
                5 + Math.sin(frameCount * 0.4 + 1) * 2,
                0,
                Math.PI * 2,
              )
              ctx.fill()
              break
          }
        } else {
          // Normal portrait - just a face
          ctx.strokeStyle = "#94a3b8" // slate-400
          ctx.beginPath()
          ctx.arc(portrait.x + portrait.width / 2, portrait.y + portrait.height / 2, portrait.width / 3, 0, Math.PI * 2)
          ctx.stroke()

          // Eyes
          ctx.fillStyle = "#000000"
          ctx.beginPath()
          ctx.arc(portrait.x + portrait.width / 2 - 10, portrait.y + portrait.height / 2 - 5, 3, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(portrait.x + portrait.width / 2 + 10, portrait.y + portrait.height / 2 - 5, 3, 0, Math.PI * 2)
          ctx.fill()

          // Mouth
          ctx.beginPath()
          ctx.moveTo(portrait.x + portrait.width / 2 - 10, portrait.y + portrait.height / 2 + 10)
          ctx.lineTo(portrait.x + portrait.width / 2 + 10, portrait.y + portrait.height / 2 + 10)
          ctx.stroke()
        }
      })

      // Draw fog particles
      fogParticles.forEach((particle: any) => {
        ctx.fillStyle = `rgba(200, 200, 255, ${particle.opacity})`
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw active ghosts
      ghosts.forEach((ghost: any) => {
        if (!ghost.active) return

        // Pulsing opacity
        const opacity = ghost.opacity * (0.7 + Math.sin(frameCount * 0.1) * 0.3)

        // Ghost body
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
        ctx.beginPath()
        ctx.arc(ghost.x, ghost.y - ghost.size * 0.3, ghost.size * 0.5, Math.PI, 0)
        ctx.lineTo(ghost.x + ghost.size * 0.5, ghost.y + ghost.size * 0.3)
        ctx.lineTo(ghost.x + ghost.size * 0.3, ghost.y + ghost.size * 0.2)
        ctx.lineTo(ghost.x, ghost.y + ghost.size * 0.4)
        ctx.lineTo(ghost.x - ghost.size * 0.3, ghost.y + ghost.size * 0.2)
        ctx.lineTo(ghost.x - ghost.size * 0.5, ghost.y + ghost.size * 0.3)
        ctx.closePath()
        ctx.fill()

        // Ghost eyes
        ctx.fillStyle = `rgba(0, 0, 0, ${opacity * 1.5})`
        ctx.beginPath()
        ctx.arc(ghost.x - ghost.size * 0.2, ghost.y - ghost.size * 0.4, ghost.size * 0.08, 0, Math.PI * 2)
        ctx.fill()

        ctx.beginPath()
        ctx.arc(ghost.x + ghost.size * 0.2, ghost.y - ghost.size * 0.4, ghost.size * 0.08, 0, Math.PI * 2)
        ctx.fill()

        // Ghost mouth
        ctx.beginPath()
        ctx.arc(ghost.x, ghost.y - ghost.size * 0.25, ghost.size * 0.1, 0, Math.PI)
        ctx.stroke()
      })

      // Occasional lightning flash
      if (frameCount % 200 < 3) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)"
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      }
    },
  },
]
