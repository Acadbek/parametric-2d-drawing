
<div className="col-span-2 border z-10 w-full py-2">
<div className="flex flex-col gap-3 py-2 px-3">
  <button
    className={action === ACTIONS.SELECT ? "bg-violet-300 p-1 rounded" : "p-1 hover:bg-violet-100 rounded"}
    onClick={() => setAction(ACTIONS.SELECT)}
  >
    Select
  </button>
  <button
    className={action === ACTIONS.RECTANGLE ? "bg-violet-300 p-1 rounded" : "p-1 hover:bg-violet-100 rounded"}
    onClick={() => setAction(ACTIONS.RECTANGLE)}
  >
    Rectangle
  </button>
  <button
    className={action === ACTIONS.CIRCLE ? "bg-violet-300 p-1 rounded" : "p-1 hover:bg-violet-100 rounded"}
    onClick={() => setAction(ACTIONS.CIRCLE)}
  >
    Circle
  </button>
  <button
    className={action === ACTIONS.SCRIBBLE ? "bg-violet-300 p-1 rounded" : "p-1 hover:bg-violet-100 rounded"}
    onClick={() => setAction(ACTIONS.SCRIBBLE)}
  >
    Pencil
  </button>
  <button onClick={handleUndo}>Undo</button>
  <button onClick={handleRedo}>Redo</button>
  <button onClick={handleExport}>
    <IoMdDownload size={"1.5rem"} />
  </button>
</div>
</div>