import { useEffect, useState } from "react"

import Auth from "./components/Auth"
import Desktop from "./components/Desktop"

import { auth } from "./firebase"
import { onAuthStateChanged } from "firebase/auth"

function App() {

  const [user, setUser] = useState(null)

  const [isBooting, setIsBooting] = useState(true)

  const [bootMessages, setBootMessages] = useState([])
  const [isShutdown, setIsShutdown] = useState(false)

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser)
      }
    )

    return () => unsubscribe()

  }, [])

  useEffect(() => {

    const messages = [
      "[ OK ] Booting CloudNova",
      "[ OK ] Initializing kernel",
      "[ OK ] Loading desktop environment",
      "[ OK ] Connecting Firebase",
      "[ OK ] Starting CloudNova services",
      "[ OK ] System Ready",
    ]

    messages.forEach((message, index) => {

      setTimeout(() => {

        setBootMessages((prev) => [
          ...prev,
          message,
        ])

      }, index * 500)

    })

    setTimeout(() => {

      setIsBooting(false)

    }, 4000)

  }, [])
  if (isShutdown) {

  setTimeout(() => {

    setIsShutdown(false)

    setIsBooting(true)

    setBootMessages([])

    setTimeout(() => {

      const messages = [
        "[ OK ] Booting CloudNova",
        "[ OK ] Initializing kernel",
        "[ OK ] Loading desktop environment",
        "[ OK ] Connecting Firebase",
        "[ OK ] Starting CloudNova services",
        "[ OK ] System Ready",
      ]

      messages.forEach((message, index) => {

        setTimeout(() => {

          setBootMessages((prev) => [
            ...prev,
            message,
          ])

        }, index * 500)

      })

      setTimeout(() => {

        setIsBooting(false)

      }, 4000)

    }, 100)

  }, 3000)

  return (

    <div className="h-screen bg-black flex items-center justify-center text-zinc-500 text-3xl font-mono">

      CloudNova is shutting down...

    </div>

  )
}

  if (isBooting) {

    return (

      <div className="h-screen bg-black text-green-400 font-mono text-2xl flex flex-col justify-center px-16">

        <div className="space-y-4">

          {bootMessages.map((message, index) => (

            <p
              key={index}
              className="drop-shadow-[0_0_8px_#00ff88]"
            >
              {message}
            </p>

          ))}

          <p className="animate-pulse mt-8 text-3xl">
            █
          </p>

        </div>

      </div>

    )
  }

  return (
    <>
      {user
  ? <Desktop shutdownSystem={() => setIsShutdown(true)} />
  : <Auth />
}
    </>
  )
}

export default App