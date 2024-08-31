import React from 'react';
import { Text, Circle, Layer, Image, Line, Rect, Stage, Transformer, Arc, Ellipse } from "react-konva";
import { v4 as uuidv4 } from "uuid";
import { ACTIONS } from "./constants";
import { saveState, drawCircle, drawRectangle, handleMouseEnter, handleMouseLeave, handleStageClick, updateLinePoints, updateScribblePoints, drawArc } from './scripts'
import { Tools } from './components/Tools';
import { Html } from 'react-konva-utils';
// import hatchImg from '/hatch.jpg'
// import useImage from 'use-image';
const GUIDELINE_OFFSET = 5;


const App = () => {
  const stageRef = React.useRef();
  const isPainting = React.useRef();
  const layerRef = React.useRef(null);
  const transformerRef = React.useRef();
  const currentShapeId = React.useRef();

  // text
  const [texts, setTexts] = React.useState([]); // Sahifadagi matnlar ro'yxati
  const [isAddingText, setIsAddingText] = React.useState(false); // Matn qo'shish rejimi
  const [selectedTextId, setSelectedTextId] = React.useState(null); // Tanlangan matn IDsi
  const [newText, setNewText] = React.useState(""); // Foydalanuvchi kiritadigan yangi matn
  const [editingTextId, setEditingTextId] = React.useState(null); // Tahrirlanayotgan matn IDsi
  const inputRef = React.useRef(null); // HTML input elementiga referens

  // text end

  const [, setLines] = React.useState([]);
  const [arrows, setArrows] = React.useState([]);
  const [close, setClose] = React.useState(false)
  const [circles, setCircles] = React.useState([]);
  const [scribbles, setScribbles] = React.useState([]);
  const [ellipses, setEllipses] = React.useState([{
    x: 150,
    y: 100,
    radiusX: 0,
    radiusY: 0,
  }]);
  const [rectangles, setRectangles] = React.useState(
    [
      {
        name: 'asd',
        points: [
          {
            x: 100,
            y: 100,
            formulas: {
              y: {
                "datatype": "IamFormula",
                "place": "y",
                "KEYID": "1afnw5r7n5MQRHSGQG1R"
              },
              x: {
                "datatype": "IamFormula",
                "place": "y",
                "KEYID": "1afnw5r7n5MQRHSGQG1R"
              }
            }
          },
        ]
      }
    ]
  );
  const [tanlanganShape, setTanlanganShape] = React.useState(null)
  const [arcs, setArcs] = React.useState([]);
  const [historyStep, setHistoryStep] = React.useState(0);
  const [splines, setSplines] = React.useState([]);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [action, setAction] = React.useState(ACTIONS.SELECT);
  const [selectedShapes, setSelectedShapes] = React.useState([]);
  const [hoveradShapeId, setHoveradShapeId] = React.useState(null);
  const [curve, setCurve] = React.useState({ points: [], controlPoints: [] });
  const [stageSize, setStageSize] = React.useState({ width: window.innerWidth, height: window.innerHeight });
  const [history, setHistory] = React.useState([{
    rectangles: [],
    circles: [],
    arrows: [],
    scribbles: [],
  }]);

  // const [image] = useImage('/hatch.jpg'); // Image path

  const handleTextClick = (e) => {
    if (isAddingText) {
      // Agar matn qo'shish rejimi yoqilgan bo'lsa
      const stage = e.target.getStage();
      const pointerPosition = stage.getPointerPosition();

      // Yangi matn qo'shish
      const id = texts.length + 1;
      setTexts([
        ...texts,
        {
          id,
          x: pointerPosition.x,
          y: pointerPosition.y,
          text: "Matn",
          isEditing: false,
        },
      ]);

      setIsAddingText(false); // Matn qo'shish rejimini o'chirish
    } else if (editingTextId !== null) {
      // Agar matn tahrirlanayotgan bo'lsa, tahrirni saqlash
      handleTextBlur(editingId);
    }
  };

  const handleTextDblClick = (id) => {
    const textNode = texts.find((text) => text.id === id);
    if (textNode) {
      setNewText(textNode.text);
      setEditingTextId(id);
      textNode.isEditing = true;
      setTexts([...texts]);
      // Fokus input elementiga o'tadi
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleTextChange = (e) => {
    setNewText(e.target.value);
  };

  const handleTextBlur = (id) => {
    const textNode = texts.find((text) => text.id === id);
    if (textNode) {
      textNode.text = newText;
      textNode.isEditing = false;
      setTexts([...texts]);
      setSelectedTextId(null);
      setEditingTextId(null);
    }
  };

  const handleTextKeyDown = (e, id) => {
    const inputElement = inputRef.current;

    if (!inputElement) return;

    const { selectionStart, selectionEnd } = inputElement;
    const selectedText = newText.substring(selectionStart, selectionEnd);

    if (e.key === "Enter" && !e.shiftKey) {
      // Enter tugmasi bosilganda matnni saqlash, shift + enter holatini tekshirish
      handleTextBlur(id);
      e.preventDefault(); // Enter tugmasi standart harakatlarini to'xtatish
    } else if (e.key === "Backspace") {
      if (selectionStart === selectionEnd) {
        // Backspace tugmasi bosilganda tanlangan matnni o'chirish yoki oldingi belgini o'chirish
        setNewText((prev) => prev.slice(0, selectionStart - 1) + prev.slice(selectionStart));
        inputElement.setSelectionRange(selectionStart - 1, selectionStart - 1); // Kursorni oldinga surish
      } else {
        // Tanlangan matnni o'chirish
        setNewText((prev) => prev.slice(0, selectionStart) + prev.slice(selectionEnd));
        inputElement.setSelectionRange(selectionStart, selectionStart); // Kursorni tanlangan joyga surish
      }
      e.preventDefault(); // Backspace tugmasining standart harakatlarini to'xtatish
    } else if (e.key === "Delete") {
      if (selectionStart === selectionEnd) {
        // Delete tugmasi bosilganda tanlangan matnni o'chirish yoki keyingi belgini o'chirish
        setNewText((prev) => prev.slice(0, selectionStart) + prev.slice(selectionStart + 1));
        inputElement.setSelectionRange(selectionStart, selectionStart); // Kursorni keyingi joyga surish
      } else {
        // Tanlangan matnni o'chirish
        setNewText((prev) => prev.slice(0, selectionStart) + prev.slice(selectionEnd));
        inputElement.setSelectionRange(selectionStart, selectionStart); // Kursorni tanlangan joyga surish
      }
      e.preventDefault(); // Delete tugmasining standart harakatlarini to'xtatish
    }
  };

  // Matn tahrirlanayotgan paytda sahifada har qanday bosish matnni saqlash uchun
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (inputRef.current && !inputRef.current.contains(e.target)) {
        if (editingId !== null) {
          handleTextBlur(editingId);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editingTextId]);

  React.useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSelectShape = (e) => {
    const shapeId = e.target.id();
    const isSelected = selectedShapes.includes(shapeId);
    handleTextClick(e)

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
    console.log('drag move');
    const { x, y, width, height } = e.target.attrs;
    setTanlanganShape((prev) => ({
      ...prev,
      x,
      y,
      width, height
    }));

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

    if (action !== ACTIONS.SELECT) return;
    const target = e.currentTarget;
    transformerRef.current.nodes([target]);
  };

  const handleDragEnd = (id, cor, e) => {
    // console.log('drag end');

    const layer = layerRef.current;
    layer.find('.guid-line').forEach((l) => l.destroy());

    const newPosition = e.target.position();
    handlePropertyChange(id, 'x', newPosition.x);
    handlePropertyChange(id, 'y', newPosition.y);
  };

  const onPointerDown = (e) => {
    console.log('is drawing', isPainting);

    const stage = stageRef.current;

    if (action === ACTIONS.SELECT) return;

    const { x, y } = stage.getPointerPosition();
    const id = uuidv4();

    currentShapeId.current = id;
    isPainting.current = true;

    switch (action) {
      case ACTIONS.RECTANGLE:
        setIsDrawing(false)
        setRectangles((rectangles) => [
          ...rectangles,
          {
            name: `polygon-${currentShapeId.current}`,
            closed: false,
            type: 'rectangle',
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
            type: 'circle',
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
            type: 'scribble',
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
      case ACTIONS.ARC:
        setArcs((arc) => [
          ...arc,
          {
            name: `arc-${currentShapeId.current}`,
            closed: false,
            type: 'arc',
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
      case ACTIONS.ELLIPSE:
        setIsDrawing(true);
        setEllipses((ellipses) => [
          ...ellipses,
          {
            id,
            x,
            y,
            radiusX: 0,
            radiusY: 0,
            fill: 'yellow',
            stroke: 'black',
            strokeWidth: 2,
          },
        ]);
        break
      case ACTIONS.SPLINE:
      case ACTIONS.SPLINE:
        setIsDrawing(true);
        setSplines((splines) => [
          ...splines,
          {
            id,
            points: [x, y]
          },
        ]);
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
    console.log('pointer move');

    if (action === ACTIONS.SELECT || !isPainting.current) return

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
      case ACTIONS.ARC:
        drawArc(arcs, currentShapeId.current, x, y, setArcs)
        break;
      case ACTIONS.ELLIPSE:
        setIsDrawing(false)
        setEllipses((prevEllipses) =>
          prevEllipses.map((ellipse) =>
            ellipse.id === currentShapeId.current
              ? {
                ...ellipse,
                radiusX: Math.abs(ellipse.x - x),
                radiusY: Math.abs(ellipse.y - y),
              }
              : ellipse
          )
        );
        break;
      case ACTIONS.SPLINE:
        setIsDrawing(false)
        setSplines((prevSplines) =>
          prevSplines.map((spline) =>
            spline.id === currentShapeId.current
              ? {
                ...spline,
                points: [...spline.points, x, y],
              }
              : spline
          )
        );
    }
  };

  const onPointerUp = () => {
    isPainting.current = false;
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

  // click qilganda select bolganiligini bildirib turuvchi border qoshadi
  const setSelectedBorder = (e) => {
    const target = e.currentTarget;
    transformerRef.current.nodes([target]);
  }

  const onClick = (e) => {
    setTanlanganShape(e.target.attrs)
    if (action !== ACTIONS.SELECT) return;
    setSelectedBorder(e)
  };

  const handleControlInput = (property, e) => {
    const numberValue = parseFloat(e.target.value); // Use parseFloat for all cases

    if (!isNaN(numberValue)) {
      // Update for rectangles and circles
      if (tanlanganShape.type === 'circle') {
        // Update for circles
        setCircles(prevCircles =>
          prevCircles.map(circle =>
            circle.id === tanlanganShape.id
              ? {
                ...circle,
                [property]: numberValue,
                points: circle.type === 'circle' && (property === 'x' || property === 'y')
                  ? circle.points.map(point => ({ ...point, [property]: numberValue }))
                  : circle.points
              }
              : circle
          )
        );
      } else if (tanlanganShape.type === 'rectangle') {
        // Update for rectangles
        setRectangles(prevRectangles =>
          prevRectangles.map(rect =>
            rect.id === tanlanganShape.id
              ? {
                ...rect,
                [property]: numberValue,
                points: rect.type === 'rectangle' && (property === 'x' || property === 'y')
                  ? rect.points.map(point => ({ ...point, [property]: numberValue }))
                  : rect.points
              }
              : rect
          )
        );
      }
    } else {
      console.error("Incorrect value");
    }
  };

  return (
    <>
      <marquee className="text-red-500" behavior="" direction="left">This website is currently under construction.</marquee>
      {/* <button className='absolute top-5 right-5 z-50' onClick={() => setIsAddingText(true)}>Text</button> */}

      <div className="w-full h-screen overflow-hidden">
        {/* Controls */}
        <Tools
          historyStep={historyStep}
          history={history}
          setRectangles={setRectangles}
          setCircles={setCircles}
          setArrows={setArrows}
          setScribbles={setScribbles}
          setHistoryStep={setHistoryStep}
          action={action}
          setAction={setAction}
          setClose={setClose}
          setIsAddingText={() => setIsAddingText(true)}
        />
        {tanlanganShape && (
          <div className='controlls flex flex-col p-2 gap-2 border rounded-xl shadow-xl w-[220px] h-[700px] z-10 absolute top-1/2 right-5 transform -translate-y-1/2'>
            {Object.keys(tanlanganShape).filter((pr) => pr === 'width' || pr === 'height' || pr === 'radius' || pr === 'x' || pr === 'y' || pr === 'strokeWidth').map((property) => (
              <div className='flex' key={property}>
                <p>{property}:</p>
                <input
                  key={tanlanganShape.id + '-' + property}
                  max={1000}
                  min={1}
                  onChange={(e) => handleControlInput(property, e)}
                  defaultValue={tanlanganShape[property]}
                  type="number"
                  className='border p-1 w-[60px]'
                  placeholder={property}
                />
              </div>
            ))}
          </div>
        )}

        {/* Canvas */}
        <div className="border">
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onClick={(e) => handleStageClick(e, isDrawing, curve, setCurve)}
            onMouseDown={handleSelectShape}

          // onTouchStart={handleSelectShape}
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
              {/* <LionImage /> */}
              {rectangles.map((rectangle) => (
                <Rect
                  type="rectangle"
                  key={rectangle.id}
                  id={rectangle.id}
                  x={rectangle.points[0].x}
                  y={rectangle.points[0].y}
                  // fillPatternImage={image}
                  // fillPatternRepeat="repeat"
                  cornerRadius={10}
                  strokeWidth={hoveradShapeId === rectangle.id ? 10 : 4}
                  height={rectangle.height}
                  width={rectangle.width}
                  draggable={action === ACTIONS.SELECT}
                  onClick={onClick}
                  onDragMove={handleDragMove}
                  onDragEnd={(e) => handleDragEnd(rectangle.id, 'position', e)}
                  onTap={handleSelectShape}
                  name='object'
                  fillEnabled={false} // hatch qoshish un ochirish kerak
                  fill="transparent" // hatch qoshish un ochirish kerak
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
                  type="circle"
                  key={circle.id}
                  id={circle.id}
                  radius={circle.radius}
                  x={circle.points[0].x}
                  y={circle.points[0].y}
                  draggable={action === ACTIONS.SELECT}
                  onDragMove={handleDragMove}
                  name='object'
                  onClick={onClick}
                  stroke={hoveradShapeId === circle.id ? '#00000044' : 'black'}
                  onDragEnd={(e) => handleDragEnd(circle.id, 'position', e)}
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
              {arcs.map((arc, i) => (
                <Arc
                  type="arc"
                  key={arc.id}
                  id={arc.id}
                  x={arc.points[0].x}
                  y={arc.points[0].y}
                  strokeWidth={hoveradShapeId === arc.id ? 10 : 4}
                  height={arc.height}
                  angle={90}
                  innerRadius={100}
                  outerRadius={200}
                  width={arc.width}
                  draggable={action === ACTIONS.SELECT}
                  onClick={onClick}
                  onDragMove={handleDragMove}
                  onDragEnd={(e) => handleDragEnd(arc.id, 'position', e)}
                  onTap={handleSelectShape}
                  name='object'
                  fill="transparent"
                  stroke={hoveradShapeId === arc.id ? '#00000044' : 'black'}
                  onMouseEnter={() => handleMouseEnter(action, setHoveradShapeId, arc.id)}
                  onMouseLeave={() => handleMouseLeave(action, setHoveradShapeId, arc.id)}
                  onMouseUp={(e) => {
                    setAction(ACTIONS.SELECT)
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
              {ellipses.map((ellipse) => (
                <Ellipse
                  key={ellipse.id}
                  id={ellipse.id}
                  x={ellipse.x}
                  y={ellipse.y}
                  radiusX={ellipse.radiusX}
                  radiusY={ellipse.radiusY}
                  fillEnabled={false}
                  strokeWidth={hoveradShapeId === ellipse.id ? 10 : 4}
                  draggable
                  onDragMove={handleDragMove}
                  onDragEnd={(e) => handleDragEnd(ellipse.id, null, e)}
                  onClick={handleSelectShape}
                  fill="transparent"
                  stroke={hoveradShapeId === ellipse.id ? '#00000044' : 'black'}
                  onMouseEnter={() => handleMouseEnter(action, setHoveradShapeId, ellipse.id)}
                  onMouseLeave={() => handleMouseLeave(action, setHoveradShapeId, ellipse.id)}
                  onMouseUp={(e) => {
                    setAction(ACTIONS.SELECT)
                  }
                  }
                />
              ))}
              {splines.map((spline) => (
                <Line
                  key={spline.id}
                  points={spline.points}
                  lineCap="round"
                  lineJoin="round"
                  tension={0.5}  // Controls the smoothness of the curve
                  closed={false}
                  fillEnabled={false}
                  strokeWidth={hoveradShapeId === spline.id ? 10 : 4}
                  draggable
                  onDragMove={handleDragMove}
                  onDragEnd={(e) => handleDragEnd(spline.id, null, e)}
                  onClick={handleSelectShape}
                  fill="transparent"
                  stroke={hoveradShapeId === spline.id ? '#00000044' : 'black'}
                  onMouseEnter={() => handleMouseEnter(action, setHoveradShapeId, spline.id)}
                  onMouseLeave={() => handleMouseLeave(action, setHoveradShapeId, spline.id)}
                  onMouseUp={(e) => {
                    setAction(ACTIONS.SELECT)
                  }
                  }
                />
              ))}
              {texts.map((text) => (
                <React.Fragment key={text.id}>
                  <Text
                    x={text.x}
                    y={text.y}
                    text={text.text}
                    fontSize={24}
                    fontFamily="Calibri"
                    fill="black"
                    draggable
                    onDblClick={() => handleTextDblClick(text.id)}
                    onClick={() => setSelectedTextId(text.id)}
                    onDragEnd={(e) => {
                      const updatedTexts = texts.map((t) =>
                        t.id === text.id
                          ? { ...t, x: e.target.x(), y: e.target.y() }
                          : t
                      );
                      setTexts(updatedTexts);
                    }}
                  />
                  {/* Matnni tahrirlash uchun HTML textarea elementi */}
                  {text.isEditing && (
                    <Html>
                      <textarea
                        value={newText}
                        onChange={handleTextChange}
                        onBlur={() => handleTextBlur(text.id)}
                        onKeyDown={(e) => handleTextKeyDown(e, text.id)}
                        ref={inputRef}
                        style={{
                          position: "absolute",
                          top: text.y,
                          left: text.x,
                          fontSize: 24,
                          fontFamily: "Calibri",
                          background: "white", // Orqa fon rangini ko'rinmas qilish
                          border: "none", // Chiziqni olib tashlash
                          outline: "none", // Fokus chiziqlarini olib tashlash
                          caretColor: "black", // Foydalanuvchi imlovchini ko'radi
                          width: `${Math.max(newText.length + 10, 1)}ch`, // Textarea kengligini matnga moslashtirish
                          height: `${Math.max(newText.split('\n').length, 1) * 30}px`, // Textarea balandligini matnga moslashtirish
                          padding: 0, // Foydalanuvchi yozayotgan paytda matn yaqin bo'lishi uchun paddingni olib tashlash
                          resize: "none", // Textarea o'lchamini foydalanuvchi o'zgartirishiga yo'l qo'ymaydi
                        }}
                        autoFocus
                      />
                    </Html>
                  )}
                </React.Fragment>
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
