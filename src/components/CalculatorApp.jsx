import { useState } from "react"
import Window from "./Window"

function CalculatorApp(props) {

  const [input, setInput] = useState("")

  const handleButton = (value) => {

    if (value === "=") {
      try {
        setInput(eval(input).toString())
      } catch {
        setInput("Error")
      }

    } else if (value === "C") {
      setInput("")

    } else {
      setInput(input + value)
    }
  }

  const buttons = [
    "7", "8", "9", "/",
    "4", "5", "6", "*",
    "1", "2", "3", "-",
    "0", ".", "=", "+",
    "C"
  ]

  return (
    <Window
      title="Calculator"
      closeWindow={props.closeCalculator}
      minimizeWindow={props.minimizeCalculator}
      isActive={props.isActive}
      focusWindow={props.focusWindow}
      defaultPosition={{
        x: 750,
        y: 120,
      }}
      width="320px"
    >

      <div className="p-4">

        <input
          type="text"
          value={input}
          readOnly
          className="w-full h-14 bg-zinc-900 text-white text-right px-4 rounded-lg mb-4 outline-none"
        />

        <div className="grid grid-cols-4 gap-2">

          {buttons.map((button) => (
            <button
              key={button}
              onClick={() => handleButton(button)}
              className="h-14 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition"
            >
              {button}
            </button>
          ))}

        </div>

      </div>

    </Window>
  )
}

export default CalculatorApp