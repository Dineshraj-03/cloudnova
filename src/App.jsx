import { useEffect, useState } from "react"

import Auth from "./components/Auth"
import Desktop from "./components/Desktop"

import { auth } from "./firebase"
import { onAuthStateChanged } from "firebase/auth"

function App() {

  const [user, setUser] = useState(null)

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser)
      }
    )

    return () => unsubscribe()

  }, [])

  return (
    <>
      {user ? <Desktop /> : <Auth />}
    </>
  )
}

export default App