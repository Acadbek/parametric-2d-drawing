import React, { useRef, useState, useEffect } from 'react';
import { IoMdDownload } from "react-icons/io";
import { Arrow, Circle, Layer, Line, Rect, Stage, Transformer } from "react-konva";
import { v4 as uuidv4 } from "uuid";
import { ACTIONS } from "./constants";
import { drawRectangle } from './scripts';

const App = () => {
  const stageRef = useRef();
  const transformerRef = useRef();
  const [action, setAction] = useState(ACTIONS.SELECT);
  const [rectangles, setRectangles] = useState([]);
  const [circles, setCircles] = useState([]);
  const [arrows, setArrows] = useState([]);
  const [scribbles, setScribbles] = useState([]);
  const [stageSize, setStageSize] = useState({ width: window.innerWidth - 600, height: window.innerHeight });
  const [attrs, setAttrs] = React.useState({ width: 0, height: 0 })
  const [lines, setLines] = useState([]);

  const strokeColor = "#000";
  const isPaining = useRef();
  const currentShapeId = useRef();

  // History stacks
  const [history, setHistory] = useState([{
    rectangles: [],
    circles: [],
    arrows: [],
    scribbles: [],
  }]);
  const [historyStep, setHistoryStep] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: window.innerWidth - 600,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleUndo = () => {
    if (historyStep === 0) return;
    const newHistoryStep = historyStep - 1;
    const previousState = history[newHistoryStep];
    setRectangles(previousState.rectangles);
    setCircles(previousState.circles);
    setArrows(previousState.arrows);
    setScribbles(previousState.scribbles);
    setHistoryStep(newHistoryStep);
  };

  const handleRedo = () => {
    if (historyStep === history.length - 1) return;
    const newHistoryStep = historyStep + 1;
    const nextState = history[newHistoryStep];
    setRectangles(nextState.rectangles);
    setCircles(nextState.circles);
    setArrows(nextState.arrows);
    setScribbles(nextState.scribbles);
    setHistoryStep(newHistoryStep);
  };

  const saveState = () => {
    const currentState = {
      rectangles,
      circles,
      arrows,
      scribbles,
    };
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(currentState);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const onPointerDown = () => {
    if (action === ACTIONS.SELECT) return;

    const stage = stageRef.current;
    const { x, y } = stage.getPointerPosition();
    const id = uuidv4();

    currentShapeId.current = id;
    isPaining.current = true;

    switch (action) {
      case ACTIONS.RECTANGLE:
        setRectangles((rectangles) => [
          ...rectangles,
          {
            name: `polygon-${currentShapeId.current}`,
            closed: false,
            points: [
              {
                x,
                y,
                formulas: {
                  y: {
                    datatype: "IamFormula",
                    place: y,
                    KEYID: id
                  },
                  x: {
                    datatype: "IamFormula",
                    place: y,
                    KEYID: id
                  }
                }
              },
            ],
            id,
            height: 20,
            width: 20,
          },
        ]);
        break;
      case ACTIONS.CIRCLE:
        setCircles((circles) => [
          ...circles,
          {
            id,
            x,
            y,
            radius: 90,
          },
        ]);
        break;
      case ACTIONS.SCRIBBLE:
        setScribbles((scribbles) => [
          ...scribbles,
          {
            id,
            points: [x, y],
          },
        ]);
        break;
      case ACTIONS.LINE:
        setLines((lines) => [
          ...lines,
          {
            id,
            points: [x, y, x, y], // Initialize with starting point
          },
        ]);
        break;
    }

    saveState();
  };

  const onPointerMove = () => {
    if (action === ACTIONS.SELECT || !isPaining.current) return;

    const stage = stageRef.current;
    const { x, y } = stage.getPointerPosition();

    switch (action) {
      case ACTIONS.RECTANGLE:
        drawRectangle(rectangles, currentShapeId.current, x, y, setRectangles);
        break;
      case ACTIONS.CIRCLE:
        setCircles((circles) =>
          circles.map((circle) => {
            if (circle.id === currentShapeId.current) {
              return {
                ...circle,
                radius: ((y - circle.y) ** 2 + (x - circle.x) ** 2) ** 0.5,
              };
            }
            return circle;
          })
        );
        break;
      case ACTIONS.SCRIBBLE:
        setScribbles((scribbles) =>
          scribbles.map((scribble) => {
            if (scribble.id === currentShapeId.current) {
              return {
                ...scribble,
                points: [...scribble.points, x, y],
              };
            }
            return scribble;
          })
        );
        break;
      case ACTIONS.LINE:
        setLines((lines) =>
          lines.map((line) => {
            if (line.id === currentShapeId.current) {
              return {
                ...line,
                points: [line.points[0], line.points[1], x, y],
              };
            }
            return line;
          })
        );
        break;
    }
  };

  const onPointerUp = () => {
    isPaining.current = false;
  };

  const handleExport = () => {
    const uri = stageRef.current.toDataURL();
    const link = document.createElement("a");
    link.download = "image.png";
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleInputChange = (e, attr) => {
    const value = Number(e.target.value);
    setAttrs({ ...attrs, [attr]: value });

    setRectangles((rectangles) =>
      rectangles.map((rectangle) =>
        rectangle.id === selectedShapeId
          ? { ...rectangle, [attr]: value }
          : rectangle
      )
    );
  };

  const onClick = (e) => {
    console.log(e);
    setAttrs({ width: e.currentTarget.attrs.width, height: e.currentTarget.attrs.height })
    if (action !== ACTIONS.SELECT) return;
    const target = e.currentTarget;
    transformerRef.current.nodes([target]);
  };

  return (
    <>
      <div className="grid grid-cols-10 w-full h-screen overflow-hidden">
        {/* Controls */}
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
              className={action === ACTIONS.LINE ? "bg-violet-300 p-1 rounded" : "p-1 hover:bg-violet-100 rounded"}
              onClick={() => setAction(ACTIONS.LINE)}
            >
              Line
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
            {JSON.stringify(rectangles)}
          </div>
        </div>
        {/* Canvas */}
        <div className="border col-span-6">
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <Layer>
              <Rect
                x={0}
                y={0}
                height={window.innerHeight}
                width={window.innerWidth}
                id="bg"
                onClick={() => transformerRef.current.nodes([])}
              />

              {rectangles.map((rectangle) => (
                <Rect
                  key={rectangle.id}
                  x={rectangle.points[0].x}
                  y={rectangle.points[0].y}
                  stroke={strokeColor}
                  strokeWidth={2}
                  height={rectangle.height}
                  width={rectangle.width}
                  draggable={action === ACTIONS.SELECT}
                  onClick={onClick}
                  onDragMove={onClick}
                />
              ))}

              {circles.map((circle) => (
                <Circle
                  key={circle.id}
                  radius={circle.radius}
                  x={circle.x}
                  y={circle.y}
                  stroke={strokeColor}
                  strokeWidth={2}
                  draggable={action === ACTIONS.SELECT}
                  onDragMove={onClick}
                />
              ))}
              {scribbles.map((scribble) => (
                <Line
                  key={scribble.id}
                  lineCap="round"
                  lineJoin="round"
                  points={scribble.points}
                  stroke={strokeColor}
                  strokeWidth={2}
                  fill={scribble.fillColor}
                  draggable={action === ACTIONS.SELECT}
                  onClick={onClick}
                  onDragMove={onClick}
                />
              ))}

              {lines.map((line) => (
                <Line
                  key={line.id}
                  lineCap="butt"
                  lineJoin="bevel"
                  points={line.points}
                  stroke={strokeColor}
                  strokeWidth={4}
                  draggable={action === ACTIONS.SELECT}
                  onClick={onClick}
                  onDragMove={onClick}
                />
              ))}


              <Transformer ref={transformerRef} />
            </Layer>
          </Stage>
        </div>
        <div className='flex flex-col px-1 gap-2 py-4 col-span-2'>
          <label htmlFor="width">Width</label>
          <input
            onChange={(e) => handleInputChange(e, 'width')}
            value={attrs.width}
            className='border'
            type="text"
            placeholder='width'
          />
          <label htmlFor="height">Height</label>
          <input
            onChange={(e) => handleInputChange(e, 'height')}
            value={attrs.height}
            className='border'
            type="text"
            placeholder='height'
          />
        </div>
      </div>
    </>
  );
};

export default App;
