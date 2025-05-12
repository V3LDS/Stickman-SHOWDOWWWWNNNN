import StickmanGame from "@/components/stickman-game"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-900">
      <h1 className="text-4xl font-bold text-white mb-6">Stickman Showdown</h1>
      <div className="w-full max-w-4xl">
        <StickmanGame />
      </div>
    </main>
  )
}
