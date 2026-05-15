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

      <button className="bg-blue-500 px-4 py-2 rounded-lg text-white font-medium hover:bg-blue-600 transition">
        Start
      </button>
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