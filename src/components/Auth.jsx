import { useState, useEffect } from "react"
import { auth } from "../firebase"

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth"

function Auth({ wallpaper }) {

  const [isLogin, setIsLogin] = useState(true)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [time, setTime] = useState(
    new Date()
  )

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState("")


  useEffect(() => {

    const interval = setInterval(() => {

      setTime(new Date())

    }, 1000)

    return () => clearInterval(interval)

  }, [])

  return (

    <div
      className="
      fixed
      inset-0
      overflow-hidden
      text-white
      "
    >

      {/* WALLPAPER */}
      <div
        className="
        absolute
        inset-0
        bg-cover
        bg-center
        scale-105
        "
        style={{
          backgroundImage:
            `url(${wallpaper})`,
        }}
      />

      {/* OVERLAY */}
      <div className="
      absolute
      inset-0
      bg-black/35
      backdrop-blur-md
      " />

      {/* CONTENT */}
      <div className="
      relative
      z-10
      h-full
      ">

        {/* CLOCK */}
        <div className="
        absolute
        top-8
        md:top-10
        left-1/2
        -translate-x-1/2
        text-center
        z-20
        ">

          <h1 className="
          text-6xl
          md:text-7xl
          lg:text-8xl
          font-light
          tracking-tight
          ">
            {
              time.toLocaleTimeString(
                [],
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )
            }
          </h1>

          <p className="
          text-xl
          text-white/80
          mt-2
          ">
            Welcome to CloudNova
          </p>

        </div>

        {/* LOGIN AREA */}
        <div className="
        h-full
        flex
        items-center
        justify-center
        pt-40
        ">

          {/* LOGIN CARD */}
          <div className="
          w-[420px]
          rounded-[32px]
          bg-white/10
          backdrop-blur-2xl
          border
          border-white/10
          shadow-[0_10px_50px_rgba(0,0,0,0.35)]
          p-10
          ">

            <div className="text-center mb-8">

              <h2 className="
              text-4xl
              font-semibold
              ">
                CloudNova
              </h2>

              <p className="
              text-white/70
              mt-2
              ">
                {
                  isLogin
                    ? "Sign in to continue"
                    : "Create your CloudNova account"
                }
              </p>

            </div>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }

              className="
              w-full
              mb-4
              px-4
              py-3
              rounded-2xl

              bg-white/10
              text-white

              outline-none

              border
              border-white/10

              placeholder:text-white/40

              focus:border-blue-400
              transition
              "
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }

              className="
              w-full
              mb-6
              px-4
              py-3
              rounded-2xl

              bg-white/10
              text-white

              outline-none

              border
              border-white/10

              placeholder:text-white/40

              focus:border-blue-400
              transition
              "
            />

            <button
              disabled={loading}
              onClick={async () => {

                try {

                  setLoading(true)

                  setError("")

                  if (isLogin) {

                    await signInWithEmailAndPassword(
                      auth,
                      email,
                      password
                    )

                  } else {

                    await createUserWithEmailAndPassword(
                      auth,
                      email,
                      password
                    )

                    await auth.signOut()

                    alert(
  "Account created successfully! Please login."
)

                    setIsLogin(true)

                    setEmail("")
                    setPassword("")
                  }

                } catch (err) {

                  if (
                    err.code ===
                    "auth/invalid-credential"
                  ) {

                    setError(
                      "Invalid email or password"
                    )

                  } else if (
                    err.code ===
                    "auth/email-already-in-use"
                  ) {

                    setError(
                      "Account already exists"
                    )

                  } else if (
                    err.code ===
                    "auth/weak-password"
                  ) {

                    setError(
                      "Password should be at least 6 characters"
                    )

                  } else {

                    setError(
                      "Something went wrong"
                    )

                  }

                } finally {

                  setLoading(false)

                }

              }}

              className="
              w-full

              bg-blue-500/90
              hover:bg-blue-500
              active:scale-[0.98]

              transition-all
              duration-200

              text-white
              py-3

              rounded-2xl
              font-semibold

              disabled:opacity-60
              disabled:cursor-not-allowed
              "
            >

              {
                loading
                  ? "Please wait..."
                  : isLogin
                  ? "Login"
                  : "Sign Up"
              }

            </button>

            {/* ERROR */}
            {
              error && (
                <p className="
                text-red-300
                text-sm
                mt-4
                text-center
                ">
                  {error}
                </p>
              )
            }

            

            {/* SWITCH BUTTON */}
            <button
              onClick={() => {

                setIsLogin(!isLogin)

                setEmail("")
                setPassword("")

                setError("")
                

              }}

              className="
              mt-5
              text-white/60
              hover:text-white
              transition
              w-full
              "
            >

              {
                isLogin
                  ? "Create new account"
                  : "Already have an account?"
              }

            </button>

          </div>

        </div>
setSuccess("")
      </div>

    </div>
  )
}

export default Auth