import Window from "./Window"

function Settings({
  closeSettings,
  minimizeSettings,
  isActive,
  focusWindow,
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
            Wallpaper
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