import { ACTIONS } from "../constants"
import { Download, UndoIcon, RedoIcon, PencilIcon, CircleIcon, LineIcon, Rectangle, Hand } from '.';
import { handleExport, handleRedo, handleUndo } from "../scripts";

export const Tools = (
  {
    action,
    setAction,
    setClose,
    historyStep,
    history,
    setRectangles,
    setCircles,
    setArrows,
    setScribbles,
    setHistoryStep,
    setIsAddingText
  }
) => {

  const onClick = (action) => {
    setAction(action)
    if (action === 'TEXT') {
      setIsAddingText()
    }
  }

  return (
    <div className="absolute left-0 h-full bg-white top-0 border z-10 py-2">
      <div className="flex flex-col gap-3 py-2 px-3 text-black">
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
        <button onClick={() => onClick(ACTIONS.ARC)} className={action === ACTIONS.ARC ? "bg-violet-300 p-1 rounded" : "p-1 hover:bg-violet-100 rounded"}>Arc</button>
        <button onClick={() => onClick(ACTIONS.ELLIPSE)} className={action === ACTIONS.ELLIPSE ? "bg-violet-300 p-1 rounded" : "p-1 hover:bg-violet-100 rounded"}>elp</button>
        <button onClick={() => onClick(ACTIONS.SPLINE)} className={action === ACTIONS.SPLINE ? "bg-violet-300 p-1 rounded" : "p-1 hover:bg-violet-100 rounded"}>spl</button>
        <button onClick={() => onClick(ACTIONS.TEXT)} className={action === ACTIONS.TEXT ? "bg-violet-300 p-1 rounded" : "p-1 hover:bg-violet-100 rounded"}>text</button>
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
