import Window from "./Window"

function Settings({
  closeSettings,
  minimizeSettings,
  isActive,
  focusWindow,
  setIsAnyWindowMaximized,
  wallpaper,
setWallpaper,
}) {

  return (

    <Window
      title="Settings"
      closeWindow={closeSettings}
      minimizeWindow={minimizeSettings}
      isActive={isActive}
      focusWindow={focusWindow}
      width="70vw"
      height="75vh"
      setIsAnyWindowMaximized={setIsAnyWindowMaximized}
    >

      <div className="
      h-full
      bg-zinc-900
      text-white
      p-8
      ">

        <h1 className="
        text-4xl
        font-bold
        mb-8
        ">
          Settings
        </h1>

        <div className="
        grid
        grid-cols-2
        gap-6
        ">

          <div className="
bg-white/5
rounded-3xl
p-6
">

  <div className="space-y-4">

    <h2 className="text-2xl font-semibold">
      Wallpaper
    </h2>

    <div className="flex gap-4">

      <button
        onClick={() =>
          setWallpaper(
            "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1600&auto=format&fit=crop"
          )
        }

        className="
        w-24
        h-24
        rounded-2xl
        bg-cover
        bg-center
        border
        border-white/10
        "

        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1600&auto=format&fit=crop)"
        }}
      />

      <button
        onClick={() =>
          setWallpaper(
            "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=1600&auto=format&fit=crop"
          )
        }

        className="
        w-24
        h-24
        rounded-2xl
        bg-cover
        bg-center
        border
        border-white/10
        "

        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=1600&auto=format&fit=crop)"
        }}
      />

    </div>

  </div>

</div>

          <div className="
          bg-white/5
          rounded-3xl
          p-6
          ">
            Appearance
          </div>

          <div className="
          bg-white/5
          rounded-3xl
          p-6
          ">
            Dock
          </div>

          <div className="
          bg-white/5
          rounded-3xl
          p-6
          ">
            System
          </div>

        </div>

      </div>

    </Window>
  )
}

export default Settings