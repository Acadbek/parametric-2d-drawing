import React, { useRef, useState, useEffect } from 'react';
import { IoMdDownload } from "react-icons/io";
import { Circle, Layer, Line, Rect, Stage, Transformer } from "react-konva";
import { v4 as uuidv4 } from "uuid";
import { ACTIONS } from "./constants";
import { drawRectangle } from './scripts'

const GUIDELINE_OFFSET = 5;

const App = () => {
  const stageRef = useRef();
  const layerRef = useRef(null);
  const transformerRef = useRef();
  const [action, setAction] = useState(ACTIONS.SELECT);
  const [rectangles, setRectangles] = useState([]);
  const [circles, setCircles] = useState([]);
  const [arrows, setArrows] = useState([]);
  const [scribbles, setScribbles] = useState([]);
  const [stageSize, setStageSize] = useState({ width: window.innerWidth - 600, height: window.innerHeight });
  const [attrs, setAttrs] = React.useState({ width: 0, height: 0 })
  const [_, setLines] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [curve, setCurve] = useState({
    points: [],
    controlPoints: []
  });
  const [close, setClose] = useState(false)
  const [shapeInfo, setShapeInfo] = useState(null)
  const [selectedShapes, setSelectedShapes] = useState([]);
  const [hoveradShapeId, setHoveradShapeId] = useState(null);

  const handleMouseEnter = (rectId) => {
    if(action === ACTIONS.SELECT) {
      setHoveradShapeId(rectId);
      // Change the cursor to a pointer
      document.body.style.cursor = 'pointer';
    }
  };

  // Function to handle mouse leave
  const handleMouseLeave = () => {
    if(action === ACTIONS.SELECT) {
      setHoveradShapeId(null);
      // Reset the cursor to default
      document.body.style.cursor = 'default';
    }
  };

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

  const handleSelectShape = (e) => {
    // console.log('eeee', e);

    const shapeId = e.target.id();
    const isSelected = selectedShapes.includes(shapeId);

    if (isSelected) {
      setSelectedShapes(selectedShapes.filter(id => id !== shapeId));
    } else {
      setSelectedShapes([...selectedShapes, shapeId]);
    }
  };

  const handlePropertyChange = (id, property, value) => {
    setRectangles(prevRectangles =>
      prevRectangles.map(rect =>
        rect.id === id ? { ...rect, [property]: value } : rect
      )
    );

    setCircles(prevCircles =>
      prevCircles.map(circle =>
        circle.id === id ? { ...circle, [property]: value } : circle
      )
    );
  };


  const renderInputFields = () => {
    return selectedShapes.map(shapeId => {
      const shape = rectangles.find(r => r.id === shapeId) || circles.find(c => c.id === shapeId);

      if (!shape) return null; // No shape found, return nothing

      return (
        <div key={shapeId} className='flex flex-col gap-4'>
          <h3>{shape?.type}: {shapeId}</h3>
          {Object.keys(shape).map(key =>
            (key !== 'id' && key !== 'type') && (
              <label key={key}>
                {key.charAt(0).toUpperCase() + key.slice(1)}:
                <input
                  className='border'
                  type="number"
                  value={shape[key]}
                  onChange={(e) => handlePropertyChange(shapeId, key, parseInt(e.target.value))}
                />
              </label>
            )
          )}
        </div>
      );
    });
  };

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

  // snap 
  const getLineGuideStops = (skipShape) => {
    const stage = stageRef.current;
    const vertical = [0, stage.width() / 2, stage.width()];
    const horizontal = [0, stage.height() / 2, stage.height()];

    stage.find('.object').forEach((guideItem) => {
      if (guideItem === skipShape) return;
      const box = guideItem.getClientRect();
      vertical.push(box.x, box.x + box.width, box.x + box.width / 2);
      horizontal.push(box.y, box.y + box.height, box.y + box.height / 2);
    });

    return {
      vertical: vertical.flat(),
      horizontal: horizontal.flat(),
    };
  }

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
  }

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
        const line = new Konva.Line({
          points: [-6000, 0, 6000, 0],
          stroke: 'rgb(0, 161, 255)',
          strokeWidth: 1,
          name: 'guid-line',
          dash: [4, 6],
        });
        layer.add(line);
        line.absolutePosition({ x: 0, y: lg.lineGuide });
      } else if (lg.orientation === 'V') {
        const line = new Konva.Line({
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
    layer.batchDraw(); // Force immediate update
  };

  const handleDragMove = (e) => {
    const layer = layerRef.current;
    layer.find('.guid-line').forEach((l) => l.destroy());

    const lineGuideStops = getLineGuideStops(e.target);
    const itemBounds = getObjectSnappingEdges(e.target);

    const guides = getGuides(lineGuideStops, itemBounds);

    if (!guides.length) return;

    drawGuides(guides);

    let absPos = e.target.absolutePosition();
    guides.forEach((lg) => {
      if (lg.orientation === 'V') {
        absPos.x = lg.lineGuide + lg.offset;
      } else if (lg.orientation === 'H') {
        absPos.y = lg.lineGuide + lg.offset;
      }
    });
    e.target.absolutePosition(absPos);

    setAttrs({ width: e.currentTarget.attrs.width, height: e.currentTarget.attrs.height })
    if (action !== ACTIONS.SELECT) return;
    const target = e.currentTarget;
    transformerRef.current.nodes([target]);
  };

  const handleDragEnd = (id, cor, e) => {
    const layer = layerRef.current;
    layer.find('.guid-line').forEach((l) => l.destroy());

    const newPosition = e.target.position();
    handlePropertyChange(id, 'x', newPosition.x);
    handlePropertyChange(id, 'y', newPosition.y);
  };

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
            name: `polygon-${id}`,
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
            radius: 20,
          },
        ]);
        break;
      case ACTIONS.SCRIBBLE:
        setIsDrawing(false)
        setScribbles((scribbles) => [
          ...scribbles,
          {
            name: `polygon-${id}`,
            closed: false,
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
                radius: ((y - circle.points[0].y) ** 2 + (x - circle.points[0].x) ** 2) ** 0.5,
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

  const handleDragMoveCircle = (index) => (e) => {
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
    setShapeInfo(e)
    handleSelectShape(e)
  };
  return (
    <>
      <marquee className="text-red-500" behavior="" direction="left">This website is currently under construction.</marquee>

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
            <button onClick={() => (setClose(true))}>close</button>
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
            onMouseDown={handleSelectShape}
            onTouchStart={handleSelectShape}
          >
            <Layer ref={layerRef}>
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
                  id={rectangle.id}
                  x={rectangle.points[0].x}
                  y={rectangle.points[0].y}
                  strokeWidth={hoveradShapeId === rectangle.id ? 10 : 4}
                  height={rectangle.height}
                  width={rectangle.width}
                  draggable={action === ACTIONS.SELECT}
                  onClick={onClick}
                  onDragMove={handleDragMove}
                  onDragEnd={(e) => handleDragEnd(rectangle.id, 'position', e)}
                  onTap={handleSelectShape}
                  name='object'
                  fillEnabled={false}
                  fill="transparent"
                  stroke={hoveradShapeId === rectangle.id ? '#00000044' : 'black'}
                  onMouseEnter={() => handleMouseEnter(rectangle.id)}
                  onMouseLeave={handleMouseLeave}
                />
              ))}

              {circles.map((circle) => (
                <Circle
                  key={circle.id}
                  id={circle.id}
                  radius={circle.radius}
                  x={circle.points[0].x}
                  y={circle.points[0].y}
                  draggable={action === ACTIONS.SELECT}
                  onDragMove={handleDragMove}
                  onDragEnd={(e) => handleDragEnd(circle.id, 'position', e)}
                  name='object'
                  stroke={hoveradShapeId === circle.id ? '#00000044' : 'black'}
                  onMouseLeave={handleMouseLeave}
                  fillEnabled={false}
                  onMouseEnter={() => handleMouseEnter(circle.id)}
                  strokeWidth={hoveradShapeId === circle.id ? 10 : 4}
                />
              ))}
              {scribbles.map((scribble) => (
                <Line
                  key={scribble.id}
                  id={scribble.id}
                  lineCap="round"
                  lineJoin="round"
                  points={scribble.points}
                  fill={scribble.fillColor}
                  draggable={action === ACTIONS.SELECT}
                  name='object'
                  onDragMove={handleDragMove}
                  onDragEnd={(e) => handleDragEnd(scribble.id, 'position', e)}
                  stroke={hoveradShapeId === scribble.id ? '#00000044' : 'black'}
                  onMouseLeave={handleMouseLeave}
                  fillEnabled={false}
                  onMouseEnter={() => handleMouseEnter(scribble.id)}
                  strokeWidth={hoveradShapeId === scribble.id ? 10 : 4}
                />
              ))}

              <Line
                className="haligi-line"
                points={curve.points}
                stroke="black"
                strokeWidth={4}
                lineCap="round"
                name='object'
                lineJoin="round"
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
                tension={0}
                closed={close}
                fill={null}
                fillEnabled={false}
              />
              {/* Draw control points */}
              {curve.controlPoints.map((point, i) => (
                <Circle
                  key={i}
                  x={point.x}
                  y={point.y}
                  radius={9}
                  name='object'
                  fill="red"
                  draggable
                  onDragMove={handleDragMoveCircle(i)}
                />
              ))}
              <Transformer ref={transformerRef} />
            </Layer>
          </Stage>
        </div>
        <div className='flex flex-col px-1 gap-2 py-4 col-span-2'>
          {renderInputFields()}
          {
            isDrawing && !close && <button onClick={() => setClose(true)} className='border'>close</button>
          }
        </div>
      </div>
    </>
  );
};

export default App;
