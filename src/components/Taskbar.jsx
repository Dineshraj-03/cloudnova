import { useEffect, useState } from "react"

function Taskbar({
  isFilesOpen,
  openFiles,
  isNotesOpen,
  isCalculatorOpen,
  openNotes,
  openCalculator,
}) {
  const [time, setTime] = useState("")
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false)

  useEffect(() => {
    const updateTime = () => {
      const currentTime = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })

      setTime(currentTime)
    }

    updateTime()

    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute bottom-0 w-full h-14 bg-zinc-800 border-t border-zinc-700 flex items-center justify-between px-4 z-50">

      <button
  onClick={() =>
    setIsStartMenuOpen(!isStartMenuOpen)
  }
  className="bg-blue-500 px-4 py-2 rounded-lg text-white font-medium hover:bg-blue-600 transition"
>
  Start
</button>
    {isStartMenuOpen && (
      <div className="absolute bottom-16 left-4 w-64 bg-zinc-800 border border-zinc-700 rounded-2xl shadow-2xl p-4">

        <h2 className="text-white text-lg font-semibold mb-4">
          CloudNova
        </h2>

        <div className="flex flex-col gap-2">

          <button
            onClick={() => {
              openNotes()
              setIsStartMenuOpen(false)
            }}
            className="bg-zinc-700 hover:bg-zinc-600 transition text-white px-4 py-3 rounded-xl text-left"
          >
            📝 Notes
          </button>

          <button
            onClick={() => {
              openCalculator()
              setIsStartMenuOpen(false)
            }}
            className="bg-zinc-700 hover:bg-zinc-600 transition text-white px-4 py-3 rounded-xl text-left"
          >
            🧮 Calculator
          </button>

          <button
            onClick={() => {
              openFiles()
              setIsStartMenuOpen(false)
            }}
            className="bg-zinc-700 hover:bg-zinc-600 transition text-white px-4 py-3 rounded-xl text-left"
          >
            📁 Files
          </button>

        </div>

      </div>
    )}
      <div className="flex gap-2">

  {isNotesOpen && (
    <button
  onClick={openNotes}
  className="bg-zinc-700 px-3 py-1 rounded text-white"
>
  Notes
</button>
  )}

  {isCalculatorOpen && (
    <button
  onClick={openCalculator}
  className="bg-zinc-700 px-3 py-1 rounded text-white"
>
  Calculator
</button>
  )}

{isFilesOpen && (
  <button
    onClick={openFiles}
    className="bg-zinc-700 px-3 py-1 rounded text-white"
  >
    Files
  </button>
)}

</div>

      <div className="text-white font-medium">
        {time}
      </div>

    </div>
  )
}

export default Taskbar