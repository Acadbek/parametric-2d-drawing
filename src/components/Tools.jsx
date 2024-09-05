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
        <button title="Select"
          className={action === ACTIONS.SELECT ? "bg-violet-300 p-1 rounded" : "p-1 hover:bg-violet-100 rounded"}
          // onClick={() => setAction(ACTIONS.SELECT)}
          onClick={() => onClick(ACTIONS.SELECT)}
        >
          <Hand />
        </button>
        <button title="Rectangle"
          className={action === ACTIONS.RECTANGLE ? "bg-violet-300 p-1 rounded" : "p-1 hover:bg-violet-100 rounded"}
          onClick={() => onClick(ACTIONS.RECTANGLE)}
        >
          <Rectangle />
        </button>
        <button title="Line"
          className={action === ACTIONS.LINE ? "bg-violet-300 p-1 rounded" : "p-1 hover:bg-violet-100 rounded"}
          onClick={() => onClick(ACTIONS.LINE)}
        >
          <LineIcon />
        </button>
        <button title="Circle"
          className={action === ACTIONS.CIRCLE ? "bg-violet-300 p-1 rounded" : "p-1 hover:bg-violet-100 rounded"}
          onClick={() => onClick(ACTIONS.CIRCLE)}
        >
          <CircleIcon />
        </button>
        <button title="Scribble"
          className={action === ACTIONS.SCRIBBLE ? "bg-violet-300 p-1 rounded" : "p-1 hover:bg-violet-100 rounded"}
          onClick={() => onClick(ACTIONS.SCRIBBLE)}
        >
          <PencilIcon />
        </button>
        <button className="w-24" title="Arc" onClick={() => onClick(ACTIONS.ARC)} className={action === ACTIONS.ARC ? "bg-violet-300 p-1 rounded" : "p-1 hover:bg-violet-100 rounded"}>
          <svg className="mt-1" width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M 50,50 m -40,0 a 40,40 0 1,1 80,0" stroke="black" stroke-width="4" fill="none" />
          </svg>
        </button>
        <button title="Ellipse" onClick={() => onClick(ACTIONS.ELLIPSE)} className={action === ACTIONS.ELLIPSE ? "bg-violet-300 p-1 rounded" : "p-1 hover:bg-violet-100 rounded"}>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
            <ellipse
              cx="12"
              cy="12"
              rx="10"
              ry="6"
              fill="none"
              stroke="black"
              strokeWidth="1"
            />
          </svg>
        </button>
        <button title="Spline" onClick={() => onClick(ACTIONS.SPLINE)} className={action === ACTIONS.SPLINE ? "bg-violet-300 p-1 rounded" : "p-1 hover:bg-violet-100 rounded"}>spl</button>
        <button title="Text" onClick={() => onClick(ACTIONS.TEXT)} className={action === ACTIONS.TEXT ? "bg-violet-300 p-1 rounded" : "p-1 hover:bg-violet-100 rounded"}>text</button>
        <button title="Undo" onClick={() => handleUndo(historyStep, history, setRectangles, setCircles, setArrows, setScribbles, setHistoryStep)}>
          <RedoIcon />
        </button>
        <button title="Redo" onClick={() => handleRedo(historyStep, history, setRectangles, setCircles, setArrows, setScribbles, setHistoryStep)}>
          <UndoIcon />
        </button>
        <button title="Export" onClick={() => handleExport(stageRef)}>
          <Download />
        </button>
        <button title="Close" onClick={() => (setClose(true))}>close</button>
      </div>
    </div>
  )
}
