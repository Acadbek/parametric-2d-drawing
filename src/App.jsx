import React from 'react';
import { IoMdDownload } from "react-icons/io";
import { Circle, Layer, Line, Rect, Stage, Transformer } from "react-konva";
import { v4 as uuidv4 } from "uuid";
import { ACTIONS } from "./constants";
import { handleRedo, handleUndo, saveState, drawCircle, drawRectangle, handleExport, handleMouseEnter, handleMouseLeave, handleStageClick, updateLinePoints, updateScribblePoints } from './scripts'

const GUIDELINE_OFFSET = 5;

const App = () => {
  const stageRef = React.useRef();
  const isPaining = React.useRef();
  const layerRef = React.useRef(null);
  const transformerRef = React.useRef();
  const currentShapeId = React.useRef();

  const [, setLines] = React.useState([]);
  const [, setShapeInfo] = React.useState(null)
  const [arrows, setArrows] = React.useState([]);
  const [close, setClose] = React.useState(false)
  const [circles, setCircles] = React.useState([]);
  const [scribbles, setScribbles] = React.useState([]);
  const [rectangles, setRectangles] = React.useState([]);
  const [historyStep, setHistoryStep] = React.useState(0);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [action, setAction] = React.useState(ACTIONS.SELECT);
  const [, setAttrs] = React.useState({ width: 0, height: 0 })
  const [selectedShapes, setSelectedShapes] = React.useState([]);
  const [hoveradShapeId, setHoveradShapeId] = React.useState(null);
  const [curve, setCurve] = React.useState({ points: [], controlPoints: [] });
  const [stageSize, setStageSize] = React.useState({ width: window.innerWidth - 600, height: window.innerHeight });
  const [history, setHistory] = React.useState([{
    rectangles: [],
    circles: [],
    arrows: [],
    scribbles: [],
  }]);

  const handleSelectShape = (e) => {
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

  React.useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: window.innerWidth - 600,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // snap -----------------------------------------
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
  // end of snap -------------------------------

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
    // console.log('tugadi');

    const layer = layerRef.current;
    layer.find('.guid-line').forEach((l) => l.destroy());

    const newPosition = e.target.position();
    handlePropertyChange(id, 'x', newPosition.x);
    handlePropertyChange(id, 'y', newPosition.y);
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
    saveState(
      rectangles,
      circles,
      arrows,
      scribbles,
      setHistory,
      setHistoryStep,
      historyStep
    );
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
          drawCircle(circles, currentShapeId.current, x, y)
        );
        break;
      case ACTIONS.SCRIBBLE:
        setScribbles((scribbles) =>
          updateScribblePoints(scribbles, currentShapeId.current, x, y)
        );
        break;
      case ACTIONS.LINE:
        setLines((lines) =>
          updateLinePoints(lines, currentShapeId.current, x, y)
        );
        break;
    }
  };

  const onPointerUp = () => {
    isPaining.current = false;
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

  const setSelectedBorder = (e) => {
    const target = e.currentTarget;
    transformerRef.current.nodes([target]);
  }

  const onClick = (e) => {
    setAttrs({ width: e.currentTarget.attrs.width, height: e.currentTarget.attrs.height })
    if (action !== ACTIONS.SELECT) return;
    setSelectedBorder(e)
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
            <button onClick={() => handleUndo(historyStep, history, setRectangles, setCircles, setArrows, setScribbles, setHistoryStep)}>Undo</button>
            <button onClick={() => handleRedo(historyStep, history, setRectangles, setCircles, setArrows, setScribbles, setHistoryStep)}>Redo</button>
            <button onClick={() => handleExport(stageRef)}>
              <IoMdDownload size={"1.5rem"} />
            </button>
            <button onClick={() => (setClose(true))}>close</button>
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
            onClick={(e) => handleStageClick(e, isDrawing, curve, setCurve)}
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
                  onMouseEnter={() => handleMouseEnter(action, setHoveradShapeId, rectangle.id)}
                  onMouseLeave={() => handleMouseLeave(action, setHoveradShapeId, rectangle.id)}
                  onMouseUp={(e) => {
                    setAction(ACTIONS.SELECT)
                    setSelectedBorder(e)
                  }
                  }
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
                  fillEnabled={false}
                  onMouseEnter={() => handleMouseEnter(action, setHoveradShapeId, circle.id)}
                  onMouseLeave={() => handleMouseLeave(action, setHoveradShapeId, circle.id)}
                  strokeWidth={hoveradShapeId === circle.id ? 10 : 4}
                  onMouseUp={(e) => {
                    setAction(ACTIONS.SELECT)
                    setSelectedBorder(e)
                  }
                  }
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
                  fillEnabled={false}
                  onMouseEnter={() => handleMouseEnter(action, setHoveradShapeId, scribble.id)}
                  onMouseLeave={() => handleMouseLeave(action, setHoveradShapeId, scribble.id)}
                  strokeWidth={hoveradShapeId === scribble.id ? 10 : 4}
                  onMouseUp={(e) => {
                    setAction(ACTIONS.SELECT)
                    setSelectedBorder(e)
                  }
                  }
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
          <input type="text" placeholder='width' onChange={(e) => handleShapeSizeWithInput(e, Number(e.target.value))} />
          {
            isDrawing && !close && <button onClick={() => setClose(true)} className='border'>close</button>
          }
        </div>
      </div>
    </>
  );
};

export default App;
