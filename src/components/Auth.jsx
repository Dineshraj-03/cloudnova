import { useState } from "react"
import { auth } from "../firebase"

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth"

function Auth() {

  const [isLogin, setIsLogin] = useState(true)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  return (
    <div className="h-screen bg-zinc-900 flex items-center justify-center">

      <div className="w-[400px] bg-zinc-800 p-8 rounded-2xl border border-zinc-700 shadow-2xl">

        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          CloudNova
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-4 py-3 rounded-xl bg-zinc-900 text-white outline-none border border-zinc-700"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 px-4 py-3 rounded-xl bg-zinc-900 text-white outline-none border border-zinc-700"
        />

        <button
          onClick={async () => {

            if (isLogin) {

              await signInWithEmailAndPassword(
                auth,
                email,
                password
              )

              alert("Logged in!")

            } else {

              await createUserWithEmailAndPassword(
                auth,
                email,
                password
              )

              alert("Account created!")
            }

          }}
          className="w-full bg-blue-500 hover:bg-blue-600 transition text-white py-3 rounded-xl font-semibold"
        >
          {isLogin ? "Login" : "Sign Up"}
        </button>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="mt-4 text-zinc-400 hover:text-white transition w-full"
        >
          {isLogin
            ? "Create new account"
            : "Already have an account?"
          }
        </button>

      </div>

    </div>
  )
}

export default Auth