import { useState } from "react"
import Window from "./Window"

function Terminal(props) {

  const [input, setInput] = useState("")
  const [history, setHistory] = useState([
    "Welcome to CloudNova Terminal",
    "Type 'help' to see commands.",
  ])

const runCommand = () => {

  const command = input.trim().toLowerCase()

  let output = []

  if (command === "open notes") {

    props.openNotes()

    output = ["Opening Notes..."]

  } else if (command === "open calculator") {

    props.openCalculator()

    output = ["Opening Calculator..."]

  } else if (command === "open files") {

    props.openFiles()

    output = ["Opening Files..."]

  } else if (command === "clear") {

    setHistory([])

    setInput("")

    return

  } else if (command === "shutdown") {

      output = ["Shutting down CloudNova..."]

      setTimeout(() => {

        props.shutdownSystem()

      }, 1500)

    }
  else if (commands[command]) {

    output = commands[command]

  } else {

    output = [
      `'${command}' is not recognized.`,
    ]

  }

  setHistory([
    ...history,
    `> ${command}`,
    ...output,
  ])

  setInput("")
}

  return (
    <Window
      title="Terminal"
      closeWindow={props.closeTerminal}
      minimizeWindow={props.minimizeTerminal}
      isActive={props.isActive}
      focusWindow={props.focusWindow}
      defaultPosition={{
        x: 250,
        y: 120,
      }}
      width="700px"
      height="400px"
    >

      <div className="bg-black h-full text-green-400 font-mono p-4 overflow-auto">

        <div className="mb-4 space-y-1">

          {history.map((line, index) => (
            <div key={index}>
              {line}
            </div>
          ))}

        </div>

        <div className="flex items-center gap-2">

          <span>{">"}</span>

          <input
            value={input}
            onChange={(e) =>
              setInput(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                runCommand()
              }
            }}
            autoFocus
            className="bg-transparent outline-none flex-1"
          />

        </div>

      </div>

    </Window>
  )
}

export default Terminal