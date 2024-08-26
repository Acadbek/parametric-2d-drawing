import React, { useRef, useState, useEffect } from 'react';
import { IoMdDownload } from "react-icons/io";
import { Arrow, Circle, Layer, Line, Rect, Stage, Transformer } from "react-konva";
import { v4 as uuidv4 } from "uuid";
import { ACTIONS } from "./constants";
import { drawRectangle } from './scripts';
import LineShape from './components/Line'

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
  const [isDrawing, setIsDrawing] = useState(false);
  const [curve, setCurve] = useState({
    points: [],
    controlPoints: []
  });

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
        setIsDrawing(false)
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
        setIsDrawing(false)
        setCircles((circles) => [
          ...circles,
          {
            id,
            x,
            y,
            radius: 20,
          },
        ]);
        break;
      case ACTIONS.SCRIBBLE:
        setIsDrawing(false)
        setScribbles((scribbles) => [
          ...scribbles,
          {
            id,
            points: [x, y],
          },
        ]);
        break;
      case ACTIONS.LINE:
        setIsDrawing(true)
        break;
    }
    saveState();
  };

  const onPointerMove = () => {
    if (action === ACTIONS.SELECT || !isPaining.current) return

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

  const addControlPoint = (x, y) => {
    setCurve(prev => {
      const newPoints = [...prev.controlPoints, { x, y }];
      const updatedPoints = newPoints.flatMap(p => [p.x, p.y]);
      return { ...prev, points: updatedPoints, controlPoints: newPoints };
    });
  };

  const handleDragMove = (index) => (e) => {
    const newPoints = [...curve.controlPoints];
    newPoints[index] = { x: e.target.x(), y: e.target.y() };

    const updatedPoints = newPoints.flatMap(p => [p.x, p.y]);

    setCurve({
      ...curve,
      points: updatedPoints,
      controlPoints: newPoints
    });
  };

  const handleStageClick = (e) => {
    if (!isDrawing) return;
    const { x, y } = e.target.getStage().getPointerPosition();

    if (curve.points.length > 0) {
      const tolerance = 10;
      let minDist = Infinity;
      let segmentIndex = -1;
      let newPoint = null;

      for (let i = 0; i < curve.points.length - 2; i += 2) {
        const x1 = curve.points[i];
        const y1 = curve.points[i + 1];
        const x2 = curve.points[i + 2];
        const y2 = curve.points[i + 3];

        const dist = distanceToSegment(x1, y1, x2, y2, x, y);
        if (dist < tolerance && dist < minDist) {
          minDist = dist;
          segmentIndex = i;
          newPoint = { x, y };
        }
      }

      if (segmentIndex >= 0 && newPoint) {
        const newPoints = [
          ...curve.points.slice(0, segmentIndex + 2),
          newPoint.x, newPoint.y,
          ...curve.points.slice(segmentIndex + 2)
        ];
        const newControlPoints = [
          ...curve.controlPoints.slice(0, segmentIndex / 2 + 1),
          newPoint,
          ...curve.controlPoints.slice(segmentIndex / 2 + 1)
        ];

        setCurve({
          points: newPoints,
          controlPoints: newControlPoints
        });
      } else {
        addControlPoint(x, y);
      }
    } else {
      addControlPoint(x, y);
    }
  };

  const distanceToSegment = (x1, y1, x2, y2, x, y) => {
    const length2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (length2 === 0) return Math.hypot(x - x1, y - y1);
    const t = Math.max(0, Math.min(1, ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / length2));
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    return Math.hypot(x - projX, y - projY);
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
            {/* {JSON.stringify(rectangles)} */}
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
            onClick={handleStageClick}
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

              <Line
                points={curve.points}
                stroke="black"
                strokeWidth={4}
                lineCap="round"
                lineJoin="round"
                tension={0} // Adjust tension for the desired curve shape
                closed={false} // Set to true if you want to close the curve
              />
              {/* Draw control points */}
              {curve.controlPoints.map((point, i) => (
                <Circle
                  key={i}
                  x={point.x}
                  y={point.y}
                  radius={6}
                  fill="red"
                  draggable
                  onDragMove={handleDragMove(i)}
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
