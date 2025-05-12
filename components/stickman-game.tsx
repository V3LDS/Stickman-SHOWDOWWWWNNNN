"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CANVAS_WIDTH, CANVAS_HEIGHT, POWERUP_SPAWN_RATE } from "@/components/game/constants"
import { MAPS, type MapConfig } from "@/components/game/maps"
import { type Player, createPlayer, updatePlayer } from "@/components/game/player"
import { type PowerUp, updatePowerUps } from "@/components/game/power-ups"
import { drawGame } from "@/components/game/rendering"
import { handleAttacks, checkCombos, checkCombosP2 } from "@/components/game/combat"

export default function StickmanGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameActive, setGameActive] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<number | null>(null)
  const [powerUps, setPowerUps] = useState<PowerUp[]>([])
  const [selectedMap, setSelectedMap] = useState<MapConfig>(MAPS[0])
  const [bestOf, setBestOf] = useState<number>(1) // Best of 1, 3, 5, etc.
  const [player1Score, setPlayer1Score] = useState(0)
  const [player2Score, setPlayer2Score] = useState(0)
  const [matchOver, setMatchOver] = useState(false)
  const [matchWinner, setMatchWinner] = useState<number | null>(null)
  const [isPaused, setIsPaused] = useState(false)

  const frameCount = useRef(0)
  const comboTextRef = useRef<{ text: string; x: number; y: number; timer: number; player: number }[]>([])
  const mapEffectsRef = useRef<any>({})
  const gameOverFrameCount = useRef(0)

  // Game state
  const [player1, setPlayer1] = useState<Player>(createPlayer(1))
  const [player2, setPlayer2] = useState<Player>(createPlayer(2))

  // Key states
  const keys = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    f: false, // New attack key for player 1
    e: false, // Special move key for player 1
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    "/": false, // New attack key for player 2
    ".": false, // Special move key for player 2
  })

  // Key press history for combo detection
  const keyHistory = useRef({
    player1: [] as { key: string; time: number }[],
    player2: [] as { key: string; time: number }[],
  })

  // Handle map selection
  const handleMapChange = (value: string) => {
    const map = MAPS.find((m) => m.name === value) || MAPS[0]
    setSelectedMap(map)

    // Reset map effects when changing maps
    mapEffectsRef.current = map.initializeMapEffects ? map.initializeMapEffects() : {}
  }

  // Handle best of selection
  const handleBestOfChange = (value: string) => {
    setBestOf(Number.parseInt(value))
  }

  // Toggle pause
  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  // Start game
  const startGame = () => {
    // If match is over, reset scores
    if (matchOver) {
      setPlayer1Score(0)
      setPlayer2Score(0)
      setMatchOver(false)
      setMatchWinner(null)
    }

    setGameActive(true)
    setGameOver(false)
    setWinner(null)
    setPowerUps([])
    comboTextRef.current = []
    frameCount.current = 0
    gameOverFrameCount.current = 0
    setIsPaused(false)

    // Create players with scores
    const p1 = createPlayer(1)
    const p2 = createPlayer(2)

    // Add scores to players
    p1.score = player1Score
    p2.score = player2Score

    setPlayer1(p1)
    setPlayer2(p2)

    // Initialize map effects
    mapEffectsRef.current = selectedMap.initializeMapEffects ? selectedMap.initializeMapEffects() : {}
  }

  // Return to menu
  const returnToMenu = () => {
    setGameActive(false)
    setGameOver(false)
    setIsPaused(false)
  }

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Escape key for pause
      if (e.key === "Escape" && gameActive && !gameOver) {
        e.preventDefault()
        togglePause()
        return
      }

      if (e.key in keys.current) {
        e.preventDefault()
        keys.current[e.key as keyof typeof keys.current] = true

        // Record key press for combo detection
        const currentTime = frameCount.current

        if (["s", "f", "e"].includes(e.key)) {
          keyHistory.current.player1.push({ key: e.key, time: currentTime })
          // Keep only recent key presses
          keyHistory.current.player1 = keyHistory.current.player1.filter((k) => currentTime - k.time < 40)
        }

        if (["ArrowDown", "/", "."].includes(e.key)) {
          keyHistory.current.player2.push({ key: e.key, time: currentTime })
          // Keep only recent key presses
          keyHistory.current.player2 = keyHistory.current.player2.filter((k) => currentTime - k.time < 40)
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key in keys.current) {
        e.preventDefault()
        keys.current[e.key as keyof typeof keys.current] = false
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [gameActive, gameOver, isPaused])

  // Game loop
  useEffect(() => {
    if (!gameActive || isPaused) return

    let animationFrameId: number

    const update = () => {
      frameCount.current += 1

      // If game is over, just continue rendering but don't update game state
      if (gameOver) {
        gameOverFrameCount.current += 1

        // Draw game
        const canvas = canvasRef.current
        if (canvas) {
          const ctx = canvas.getContext("2d")
          if (ctx) {
            drawGame(
              ctx,
              selectedMap,
              player1,
              player2,
              powerUps,
              frameCount.current,
              comboTextRef.current,
              gameOver,
              winner,
              mapEffectsRef.current,
              gameOverFrameCount.current,
            )
          }
        }

        // Continue game loop
        animationFrameId = requestAnimationFrame(update)
        return
      }

      // Check for combos
      const p1Combo = checkCombos(keyHistory.current.player1, frameCount.current)
      const p2Combo = checkCombosP2(keyHistory.current.player2, frameCount.current)

      // Update players
      let newPlayer1 = updatePlayer(
        player1,
        keys.current,
        selectedMap,
        frameCount.current,
        p1Combo,
        comboTextRef,
        keyHistory,
        1,
        mapEffectsRef.current,
      )

      let newPlayer2 = updatePlayer(
        player2,
        keys.current,
        selectedMap,
        frameCount.current,
        p2Combo,
        comboTextRef,
        keyHistory,
        2,
        mapEffectsRef.current,
      )

      // Handle attacks and collisions
      const attackResult = handleAttacks(newPlayer1, newPlayer2, frameCount.current, comboTextRef)

      newPlayer1 = attackResult.player1
      newPlayer2 = attackResult.player2

      // Update map effects
      if (selectedMap.updateMapEffects) {
        mapEffectsRef.current = selectedMap.updateMapEffects(
          mapEffectsRef.current,
          frameCount.current,
          { player1: newPlayer1, player2: newPlayer2 },
          comboTextRef,
        )
      }

      // Update combo text animations
      comboTextRef.current = comboTextRef.current
        .map((text) => {
          return {
            ...text,
            y: text.y - 1,
            timer: text.timer - 1,
          }
        })
        .filter((text) => text.timer > 0)

      // Update power-ups
      const powerUpResult = updatePowerUps(powerUps, newPlayer1, newPlayer2, frameCount.current, POWERUP_SPAWN_RATE)

      setPowerUps(powerUpResult.powerUps)
      newPlayer1 = powerUpResult.player1
      newPlayer2 = powerUpResult.player2

      // Check for game over
      if (newPlayer1.health <= 0 || newPlayer2.health <= 0) {
        // Set winner first, then set game over
        let roundWinner: number

        if (newPlayer1.health <= 0) {
          // Player 2 wins
          newPlayer1.health = 0
          roundWinner = 2
          setWinner(2)
          newPlayer2.winner = true

          // Update score
          const newScore = player2Score + 1
          setPlayer2Score(newScore)
          newPlayer2.score = newScore
          newPlayer1.score = player1Score
        } else {
          // Player 1 wins
          newPlayer2.health = 0
          roundWinner = 1
          setWinner(1)
          newPlayer1.winner = true

          // Update score
          const newScore = player1Score + 1
          setPlayer1Score(newScore)
          newPlayer1.score = newScore
          newPlayer2.score = player2Score
        }

        // Check if match is over (player reached required wins)
        const winsNeeded = Math.ceil(bestOf / 2)
        if (player1Score + 1 >= winsNeeded && roundWinner === 1) {
          setMatchOver(true)
          setMatchWinner(1)
        } else if (player2Score + 1 >= winsNeeded && roundWinner === 2) {
          setMatchOver(true)
          setMatchWinner(2)
        }

        // Update players before setting game over
        setPlayer1(newPlayer1)
        setPlayer2(newPlayer2)

        // Set game over last
        setGameOver(true)
        gameOverFrameCount.current = 0
      } else {
        // Normal update if game is not over
        setPlayer1(newPlayer1)
        setPlayer2(newPlayer2)
      }

      // Draw game
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext("2d")
        if (ctx) {
          drawGame(
            ctx,
            selectedMap,
            player1,
            player2,
            powerUps,
            frameCount.current,
            comboTextRef.current,
            gameOver,
            winner,
            mapEffectsRef.current,
            gameOverFrameCount.current,
          )
        }
      }

      // Continue game loop
      animationFrameId = requestAnimationFrame(update)
    }

    // Start the game loop
    animationFrameId = requestAnimationFrame(update)

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [
    gameActive,
    gameOver,
    isPaused,
    player1,
    player2,
    powerUps,
    selectedMap,
    winner,
    player1Score,
    player2Score,
    bestOf,
  ])

  // Draw pause screen
  useEffect(() => {
    if (isPaused && gameActive && !gameOver) {
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext("2d")
        if (ctx) {
          // Semi-transparent overlay
          ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

          // Pause text
          ctx.font = "bold 48px sans-serif"
          ctx.fillStyle = "#ffffff"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40)

          // Instructions
          ctx.font = "24px sans-serif"
          ctx.fillText("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20)
        }
      }
    }
  }, [isPaused, gameActive, gameOver])

  // Render active power-ups indicators
  const renderPowerUpIndicators = (player: Player, playerNum: number) => {
    const indicators = []
    const baseX = playerNum === 1 ? 50 : CANVAS_WIDTH - 250
    let offsetY = 60

    if (player.hasSpeedBoost) {
      indicators.push(
        <div
          key={`p${playerNum}-speed`}
          className="flex items-center gap-2 mt-1"
          style={{ position: "absolute", left: baseX, top: offsetY }}
        >
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-xs text-white">Speed</span>
        </div>,
      )
      offsetY += 20
    }

    if (player.hasSuperJump) {
      indicators.push(
        <div
          key={`p${playerNum}-jump`}
          className="flex items-center gap-2 mt-1"
          style={{ position: "absolute", left: baseX, top: offsetY }}
        >
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-xs text-white">Jump</span>
        </div>,
      )
      offsetY += 20
    }

    if (player.hasGiantMode) {
      indicators.push(
        <div
          key={`p${playerNum}-giant`}
          className="flex items-center gap-2 mt-1"
          style={{ position: "absolute", left: baseX, top: offsetY }}
        >
          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
          <span className="text-xs text-white">Giant</span>
        </div>,
      )
      offsetY += 20
    }

    if (player.hasShield) {
      indicators.push(
        <div
          key={`p${playerNum}-shield`}
          className="flex items-center gap-2 mt-1"
          style={{ position: "absolute", left: baseX, top: offsetY }}
        >
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span className="text-xs text-white">Shield</span>
        </div>,
      )
      offsetY += 20
    }

    if (player.hasRapidFire) {
      indicators.push(
        <div
          key={`p${playerNum}-rapid`}
          className="flex items-center gap-2 mt-1"
          style={{ position: "absolute", left: baseX, top: offsetY }}
        >
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-xs text-white">Rapid Fire</span>
        </div>,
      )
    }

    return indicators
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 py-8">
      <h1 className="text-4xl font-bold text-white mb-6 tracking-wider">
        <span className="text-blue-500">STICK</span>
        <span className="text-red-500">FIGHT</span>
      </h1>

      {!gameActive ? (
        <Card className="w-full max-w-2xl bg-gray-800 border-gray-700 shadow-xl">
          <CardContent className="p-6">
            <Tabs defaultValue="map" className="w-full">
              <TabsList className="w-full mb-6 bg-gray-700">
                <TabsTrigger value="map" className="text-white data-[state=active]:bg-gray-600">
                  Map Selection
                </TabsTrigger>
                <TabsTrigger value="match" className="text-white data-[state=active]:bg-gray-600">
                  Match Settings
                </TabsTrigger>
                <TabsTrigger value="controls" className="text-white data-[state=active]:bg-gray-600">
                  Controls
                </TabsTrigger>
              </TabsList>

              <TabsContent value="map" className="mt-0">
                <h2 className="text-xl font-bold text-white mb-4">Select Your Battlefield</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {MAPS.map((map) => (
                    <div
                      key={map.name}
                      className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${
                        selectedMap.name === map.name
                          ? "border-blue-500 bg-gray-700"
                          : "border-gray-700 bg-gray-800 hover:bg-gray-700"
                      }`}
                      onClick={() => handleMapChange(map.name)}
                    >
                      <div
                        className="h-24 w-full rounded mb-2"
                        style={{
                          backgroundColor: map.background,
                          borderBottom: `10px solid ${map.ground}`,
                        }}
                      ></div>
                      <h3 className="font-bold text-white">{map.name}</h3>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-300 mt-2 p-3 bg-gray-700 rounded">{selectedMap.description}</p>
              </TabsContent>

              <TabsContent value="match" className="mt-0">
                <h2 className="text-xl font-bold text-white mb-4">Match Format</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[1, 3, 5, 7].map((format) => (
                    <div
                      key={format}
                      className={`p-4 rounded-lg cursor-pointer transition-all border-2 text-center ${
                        bestOf === format
                          ? "border-blue-500 bg-gray-700"
                          : "border-gray-700 bg-gray-800 hover:bg-gray-700"
                      }`}
                      onClick={() => setBestOf(format)}
                    >
                      {format === 1 ? (
                        <span className="text-white font-bold">Single Match</span>
                      ) : (
                        <span className="text-white font-bold">Best of {format}</span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-300 mt-2 p-3 bg-gray-700 rounded">
                  {bestOf > 1
                    ? `First to win ${Math.ceil(bestOf / 2)} rounds wins the match!`
                    : "Single match mode - winner takes all!"}
                </p>
              </TabsContent>

              <TabsContent value="controls" className="mt-0">
                <h2 className="text-xl font-bold text-white mb-4">Game Controls</h2>
                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-blue-900 bg-opacity-30 p-4 rounded-lg border border-blue-700">
                    <h3 className="text-lg font-semibold text-blue-400 mb-3 border-b border-blue-700 pb-2">Player 1</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center">
                        <span className="bg-blue-700 text-white w-8 h-8 flex items-center justify-center rounded mr-2">
                          W
                        </span>
                        <span className="text-white">Jump</span>
                      </div>
                      <div className="flex items-center">
                        <span className="bg-blue-700 text-white w-8 h-8 flex items-center justify-center rounded mr-2">
                          A
                        </span>
                        <span className="text-white">Left</span>
                      </div>
                      <div className="flex items-center">
                        <span className="bg-blue-700 text-white w-8 h-8 flex items-center justify-center rounded mr-2">
                          S
                        </span>
                        <span className="text-white">Punch</span>
                      </div>
                      <div className="flex items-center">
                        <span className="bg-blue-700 text-white w-8 h-8 flex items-center justify-center rounded mr-2">
                          D
                        </span>
                        <span className="text-white">Right</span>
                      </div>
                      <div className="flex items-center">
                        <span className="bg-blue-700 text-white w-8 h-8 flex items-center justify-center rounded mr-2">
                          F
                        </span>
                        <span className="text-white">Kick</span>
                      </div>
                      <div className="flex items-center">
                        <span className="bg-blue-700 text-white w-8 h-8 flex items-center justify-center rounded mr-2">
                          E
                        </span>
                        <span className="text-white">Special</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-900 bg-opacity-30 p-4 rounded-lg border border-red-700">
                    <h3 className="text-lg font-semibold text-red-400 mb-3 border-b border-red-700 pb-2">Player 2</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center">
                        <span className="bg-red-700 text-white w-8 h-8 flex items-center justify-center rounded mr-2">
                          ↑
                        </span>
                        <span className="text-white">Jump</span>
                      </div>
                      <div className="flex items-center">
                        <span className="bg-red-700 text-white w-8 h-8 flex items-center justify-center rounded mr-2">
                          ←
                        </span>
                        <span className="text-white">Left</span>
                      </div>
                      <div className="flex items-center">
                        <span className="bg-red-700 text-white w-8 h-8 flex items-center justify-center rounded mr-2">
                          ↓
                        </span>
                        <span className="text-white">Punch</span>
                      </div>
                      <div className="flex items-center">
                        <span className="bg-red-700 text-white w-8 h-8 flex items-center justify-center rounded mr-2">
                          →
                        </span>
                        <span className="text-white">Right</span>
                      </div>
                      <div className="flex items-center">
                        <span className="bg-red-700 text-white w-8 h-8 flex items-center justify-center rounded mr-2">
                          /
                        </span>
                        <span className="text-white">Kick</span>
                      </div>
                      <div className="flex items-center">
                        <span className="bg-red-700 text-white w-8 h-8 flex items-center justify-center rounded mr-2">
                          .
                        </span>
                        <span className="text-white">Special</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-gray-700 rounded">
                  <p className="text-sm text-gray-300">
                    <span className="font-bold text-white">Tip:</span> Press{" "}
                    <span className="bg-gray-600 px-2 py-1 rounded">ESC</span> during gameplay to pause the game.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex justify-center">
              <Button
                onClick={startGame}
                className="px-8 py-6 text-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg transition-all transform hover:scale-105"
              >
                START GAME
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {gameActive && bestOf > 1 && (
            <div className="absolute top-[-40px] left-0 right-0 flex justify-center items-center gap-4">
              <div
                className={`text-xl font-bold px-4 py-2 rounded ${
                  player1Score > player2Score ? "bg-blue-600" : "bg-gray-700"
                }`}
              >
                Player 1: {player1Score}
              </div>
              <div className="text-lg font-bold text-white">vs</div>
              <div
                className={`text-xl font-bold px-4 py-2 rounded ${
                  player2Score > player1Score ? "bg-red-600" : "bg-gray-700"
                }`}
              >
                Player 2: {player2Score}
              </div>
            </div>
          )}

          <div className="relative">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="border-4 border-gray-700 rounded-lg shadow-2xl"
            />

            {/* Power-up indicators */}
            {gameActive && !gameOver && !isPaused && (
              <>
                {renderPowerUpIndicators(player1, 1)}
                {renderPowerUpIndicators(player2, 2)}
              </>
            )}

            {/* Pause menu */}
            {isPaused && !gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="bg-gray-800 bg-opacity-90 p-6 rounded-lg shadow-lg border border-gray-700 w-64">
                  <h2 className="text-2xl font-bold text-white mb-4 text-center">PAUSED</h2>
                  <div className="space-y-3">
                    <Button onClick={togglePause} className="w-full bg-blue-600 hover:bg-blue-700">
                      Resume Game
                    </Button>
                    <Button onClick={returnToMenu} className="w-full bg-red-600 hover:bg-red-700">
                      Quit to Menu
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-4">
            {!gameOver ? (
              <Button onClick={togglePause} className="px-4 py-2 bg-blue-600 hover:bg-blue-700">
                {isPaused ? "Resume" : "Pause"}
              </Button>
            ) : (
              <Button onClick={startGame} className="px-8 py-4 text-lg bg-green-600 hover:bg-green-700">
                {matchOver ? "New Match" : "Next Round"}
              </Button>
            )}

            {gameActive && (
              <Button onClick={returnToMenu} className="px-4 py-2 bg-gray-600 hover:bg-gray-700">
                Main Menu
              </Button>
            )}
          </div>

          {matchOver && (
            <div className="mt-4 text-2xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-lg shadow-lg">
              Player {matchWinner} wins the match!
            </div>
          )}
        </div>
      )}
    </div>
  )
}
