import Window from "./Window"

function Notes(props) {
  return (
    <Window
      title="Notes"
      closeWindow={props.closeNotes}
      minimizeWindow={props.minimizeNotes}
      isActive={props.isActive}
      focusWindow={props.focusWindow}
      defaultPosition={{
        x: 160,
        y: 80,
      }}
      width="500px"
      height="350px"
    >

      <textarea
        placeholder="Write something..."
        className="w-full h-full bg-zinc-800 text-white p-4 outline-none resize-none"
      />

    </Window>
  )
}

export default Notes