import { ACTIONS } from "../constants"
import { Download, UndoIcon, RedoIcon, PencilIcon, CircleIcon, LineIcon, Rectangle, Hand } from '.';
import { handleExport, handleRedo, handleUndo } from "../scripts";

export const Tools = (
  { action,
    setAction,
    setClose,
    historyStep,
    history,
    setRectangles,
    setCircles,
    setArrows,
    setScribbles,
    setHistoryStep,
    setSelectedShape
  }
) => {

  const onClick = (action) => {
    if (action === ACTIONS.SELECT || action == ACTIONS) {
      setSelectedShape(null)
    }
    setAction(action)
    setSelectedShape(true)
  }

  return (
    <div className="absolute left-0 h-full bg-white top-0 border z-10 py-2">
      <div className="flex flex-col gap-3 py-2 px-3">
        <button
          className={action === ACTIONS.SELECT ? "bg-violet-300 p-1 rounded" : "p-1 hover:bg-violet-100 rounded"}
          // onClick={() => setAction(ACTIONS.SELECT)}
          onClick={() => onClick(ACTIONS.SELECT)}
        >
          <Hand />
        </button>
        <button
          className={action === ACTIONS.RECTANGLE ? "bg-violet-300 p-1 rounded" : "p-1 hover:bg-violet-100 rounded"}
          onClick={() => onClick(ACTIONS.RECTANGLE)}
        >
          <Rectangle />
        </button>
        <button
          className={action === ACTIONS.LINE ? "bg-violet-300 p-1 rounded" : "p-1 hover:bg-violet-100 rounded"}
          onClick={() => onClick(ACTIONS.LINE)}
        >
          <LineIcon />
        </button>
        <button
          className={action === ACTIONS.CIRCLE ? "bg-violet-300 p-1 rounded" : "p-1 hover:bg-violet-100 rounded"}
          onClick={() => onClick(ACTIONS.CIRCLE)}
        >
          <CircleIcon />
        </button>
        <button
          className={action === ACTIONS.SCRIBBLE ? "bg-violet-300 p-1 rounded" : "p-1 hover:bg-violet-100 rounded"}
          onClick={() => onClick(ACTIONS.SCRIBBLE)}
        >
          <PencilIcon />
        </button>
        <button onClick={() => handleUndo(historyStep, history, setRectangles, setCircles, setArrows, setScribbles, setHistoryStep)}>
          <RedoIcon />
        </button>
        <button onClick={() => handleRedo(historyStep, history, setRectangles, setCircles, setArrows, setScribbles, setHistoryStep)}>
          <UndoIcon />
        </button>
        <button onClick={() => handleExport(stageRef)}>
          <Download />
        </button>
        <button onClick={() => (setClose(true))}>close</button>
      </div>
    </div>
  )
}
