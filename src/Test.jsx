import React, { useRef, useState, useEffect } from 'react';
import { IoMdDownload } from "react-icons/io";
import { Circle, Layer, Line, Rect, Stage, Transformer } from "react-konva";
import { v4 as uuidv4 } from "uuid";
import { ACTIONS } from "./constants";

const App = () => {
  const stageRef = useRef();
  const transformerRef = useRef();
  const layerRef = useRef(); // Added layerRef
  const [action, setAction] = useState(ACTIONS.SELECT);
  const [rectangles, setRectangles] = useState([]);
  const [circles, setCircles] = useState([]);
  const [scribbles, setScribbles] = useState([]);
  const [stageSize, setStageSize] = useState({ width: window.innerWidth - 600, height: window.innerHeight });
  const [attrs, setAttrs] = useState({ width: 0, height: 0 });
  const [selectedShapeId, setSelectedShapeId] = useState(null);

  const strokeColor = "#000";
  const isPainting = useRef(false); // Corrected typo from 'isPaining' to 'isPainting'
  const currentShapeId = useRef();

  // History stacks
  const [history, setHistory] = useState([{
    rectangles: [],
    circles: [],
    scribbles: [],
  }]);
  const [historyStep, setHistoryStep] = useState(0);

  const GUIDELINE_OFFSET = 5; // Defined GUIDELINE_OFFSET

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

  // Utility functions for alignment guides
  const getLineGuideStops = (skipShape) => {
    const stage = stageRef.current;
    const vertical = [0, stage.width() / 2, stage.width()];
    const horizontal = [0, stage.height() / 2, stage.height()];

    stage.find('.object').forEach((guideItem) => {
      if (guideItem === skipShape) {
        return;
      }
      const box = guideItem.getClientRect();
      vertical.push([box.x, box.x + box.width, box.x + box.width / 2]);
      horizontal.push([box.y, box.y + box.height, box.y + box.height / 2]);
    });

    return {
      vertical: vertical.flat(),
      horizontal: horizontal.flat(),
    };
  };

  const getObjectSnappingEdges = (node) => {
    const box = node.getClientRect();
    const absPos = node.absolutePosition();

    return {
      vertical: [
        { guide: Math.round(box.x), offset: Math.round(absPos.x - box.x), snap: 'start' },
        { guide: Math.round(box.x + box.width / 2), offset: Math.round(absPos.x - box.x - box.width / 2), snap: 'center' },
        { guide: Math.round(box.x + box.width), offset: Math.round(absPos.x - box.x - box.width), snap: 'end' },
      ],
      horizontal: [
        { guide: Math.round(box.y), offset: Math.round(absPos.y - box.y), snap: 'start' },
        { guide: Math.round(box.y + box.height / 2), offset: Math.round(absPos.y - box.y - box.height / 2), snap: 'center' },
        { guide: Math.round(box.y + box.height), offset: Math.round(absPos.y - box.y - box.height), snap: 'end' },
      ],
    };
  };

  const getGuides = (lineGuideStops, itemBounds) => {
    const resultV = [];
    const resultH = [];

    lineGuideStops.vertical.forEach((lineGuide) => {
      itemBounds.vertical.forEach((itemBound) => {
        const diff = Math.abs(lineGuide - itemBound.guide);
        if (diff < GUIDELINE_OFFSET) {
          resultV.push({ lineGuide, diff, snap: itemBound.snap, offset: itemBound.offset });
        }
      });
    });

    lineGuideStops.horizontal.forEach((lineGuide) => {
      itemBounds.horizontal.forEach((itemBound) => {
        const diff = Math.abs(lineGuide - itemBound.guide);
        if (diff < GUIDELINE_OFFSET) {
          resultH.push({ lineGuide, diff, snap: itemBound.snap, offset: itemBound.offset });
        }
      });
    });

    const guides = [];
    const minV = resultV.sort((a, b) => a.diff - b.diff)[0];
    const minH = resultH.sort((a, b) => a.diff - b.diff)[0];
    if (minV) {
      guides.push({ lineGuide: minV.lineGuide, offset: minV.offset, orientation: 'V', snap: minV.snap });
    }
    if (minH) {
      guides.push({ lineGuide: minH.lineGuide, offset: minH.offset, orientation: 'H', snap: minH.snap });
    }
    return guides;
  };

  const drawGuides = (guides) => {
    const layer = layerRef.current;
    guides.forEach((lg) => {
      if (lg.orientation === 'H') {
        const line = new window.Konva.Line({
          points: [-6000, 0, 6000, 0],
          stroke: 'rgb(0, 161, 255)',
          strokeWidth: 1,
          name: 'guid-line',
          dash: [4, 6],
        });
        layer.add(line);
        line.absolutePosition({ x: 0, y: lg.lineGuide });
      } else if (lg.orientation === 'V') {
        const line = new window.Konva.Line({
          points: [0, -6000, 0, 6000],
          stroke: 'rgb(0, 161, 255)',
          strokeWidth: 1,
          name: 'guid-line',
          dash: [4, 6],
        });
        layer.add(line);
        line.absolutePosition({ x: lg.lineGuide, y: 0 });
      }
    });
  };

  const handleUndo = () => {
    if (historyStep === 0) return;
    const newHistoryStep = historyStep - 1;
    const previousState = history[newHistoryStep];
    setRectangles(previousState.rectangles);
    setCircles(previousState.circles);
    setScribbles(previousState.scribbles);
    setHistoryStep(newHistoryStep);
  };

  const handleRedo = () => {
    if (historyStep === history.length - 1) return;
    const newHistoryStep = historyStep + 1;
    const nextState = history[newHistoryStep];
    setRectangles(nextState.rectangles);
    setCircles(nextState.circles);
    setScribbles(nextState.scribbles);
    setHistoryStep(newHistoryStep);
  };

  const saveState = () => {
    const currentState = {
      rectangles,
      circles,
      scribbles,
    };
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(currentState);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handlePointerDown = (event) => {
    if (event.target !== stageRef.current) return;
    if (action === ACTIONS.DRAW_RECT) {
      const { x, y } = event.target.getStage().getPointerPosition();
      const id = uuidv4();
      setRectangles((prev) => [...prev, { x, y, width: 0, height: 0, id, strokeColor, isSelected: true }]);
      currentShapeId.current = id;
    } else if (action === ACTIONS.DRAW_CIRCLE) {
      const { x, y } = event.target.getStage().getPointerPosition();
      const id = uuidv4();
      setCircles((prev) => [...prev, { x, y, radius: 0, id, strokeColor, isSelected: true }]);
      currentShapeId.current = id;
    } else if (action === ACTIONS.SCRIBBLE) {
      const { x, y } = event.target.getStage().getPointerPosition();
      const id = uuidv4();
      setScribbles((prev) => [...prev, { points: [x, y], id, strokeColor }]);
      currentShapeId.current = id;
    }
  };

  const handlePointerMove = (event) => {
    if (action !== ACTIONS.SCRIBBLE && !currentShapeId.current) return;
    const { x, y } = event.target.getStage().getPointerPosition();
    if (action === ACTIONS.DRAW_RECT) {
      setRectangles((prev) =>
        prev.map((rect) =>
          rect.id === currentShapeId.current ? { ...rect, width: x - rect.x, height: y - rect.y } : rect
        )
      );
    } else if (action === ACTIONS.DRAW_CIRCLE) {
      setCircles((prev) =>
        prev.map((circle) =>
          circle.id === currentShapeId.current ? { ...circle, radius: Math.sqrt((x - circle.x) ** 2 + (y - circle.y) ** 2) } : circle
        )
      );
    } else if (action === ACTIONS.SCRIBBLE) {
      setScribbles((prev) =>
        prev.map((scribble) =>
          scribble.id === currentShapeId.current ? { ...scribble, points: [...scribble.points, x, y] } : scribble
        )
      );
    }
  };

  const handlePointerUp = () => {
    if (currentShapeId.current) {
      saveState();
      currentShapeId.current = null;
    }
  };

  const handleDragEnd = (event) => {
    const shape = event.target;
    const guides = getGuides(getLineGuideStops(shape), getObjectSnappingEdges(shape));
    if (guides.length > 0) {
      drawGuides(guides);
    }
    saveState();
  };

  const selectShape = (id) => {
    setSelectedShapeId(id);
    transformerRef.current.nodes([stageRef.current.findOne(`#${id}`)]);
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

  return (
    <div>
      <div>
       
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
      </div>
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ border: "1px solid grey", cursor: action === ACTIONS.SELECT ? "pointer" : "crosshair" }}
      >
        <Layer ref={layerRef}>
          {rectangles.map((rect, index) => (
            <Rect
              key={rect.id}
              id={rect.id}
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              stroke={rect.strokeColor}
              strokeWidth={2}
              draggable
              onDragEnd={handleDragEnd}
              onClick={() => selectShape(rect.id)}
              onTransformEnd={() => {
                const node = transformerRef.current.getNode();
                const newAttrs = node.getAttrs();
                const updatedRect = { ...rect, ...newAttrs };
                const updatedRectangles = rectangles.slice();
                updatedRectangles[index] = updatedRect;
                setRectangles(updatedRectangles);
                saveState();
              }}
            />
          ))}
          {circles.map((circle, index) => (
            <Circle
              key={circle.id}
              id={circle.id}
              x={circle.x}
              y={circle.y}
              radius={circle.radius}
              stroke={circle.strokeColor}
              strokeWidth={2}
              draggable
              onDragEnd={handleDragEnd}
              onClick={() => selectShape(circle.id)}
              onTransformEnd={() => {
                const node = transformerRef.current.getNode();
                const newAttrs = node.getAttrs();
                const updatedCircle = { ...circle, ...newAttrs };
                const updatedCircles = circles.slice();
                updatedCircles[index] = updatedCircle;
                setCircles(updatedCircles);
                saveState();
              }}
            />
          ))}
          {scribbles.map((scribble, index) => (
            <Line
              key={scribble.id}
              id={scribble.id}
              points={scribble.points}
              stroke={scribble.strokeColor}
              strokeWidth={2}
              draggable
              onDragEnd={handleDragEnd}
              onClick={() => selectShape(scribble.id)}
            />
          ))}
          <Transformer ref={transformerRef} />
        </Layer>
      </Stage>
    </div>
  );
};

export default App;
