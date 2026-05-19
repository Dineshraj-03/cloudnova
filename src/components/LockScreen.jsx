function LockScreen({
  wallpaper,
  unlock,
}) {

  const currentTime =
    new Date().toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    )

  return (

    <div
      className="
      fixed
      inset-0
      bg-cover
      bg-center
      flex
      flex-col
      items-center
      justify-center
      text-white
      "
      style={{
        backgroundImage:
          `url(${wallpaper})`,
      }}
    >

      <div className="
      absolute
      inset-0
      bg-black/40
      backdrop-blur-md
      " />

      <div className="
      relative
      z-10
      flex
      flex-col
      items-center
      ">

        <h1 className="
        text-8xl
        font-light
        tracking-tight
        ">
          {currentTime}
        </h1>

        <p className="
        text-xl
        mt-3
        text-white/80
        ">
          Welcome to CloudNova
        </p>

        <button
          onClick={unlock}

          className="
          mt-12
          px-8
          py-4
          rounded-2xl

          bg-white/10
          hover:bg-white/20

          backdrop-blur-xl

          border
          border-white/10

          text-lg
          font-medium

          transition-all
          duration-300
          "
        >
          Enter CloudNova
        </button>

      </div>

    </div>
  )
}

export default LockScreen