import React from 'react';
import { Text, Circle, Layer, Group, Line, Rect, Stage, Transformer, Arc, Ellipse } from "react-konva";
import { v4 as uuidv4 } from "uuid";
import { ACTIONS } from "./constants";
import { drawCircle, drawRectangle, handleMouseEnter, handleMouseLeave, updateLinePoints, updateScribblePoints, drawArc } from './scripts'
import { Tools } from './components/Tools';
import { Html } from 'react-konva-utils';
import TextComponent from './components/Text';
import img from '/hatch.png'

const GUIDELINE_OFFSET = 5;

const App = () => {
  const stageRef = React.useRef();
  const isPainting = React.useRef();
  const layerRef = React.useRef(null);
  const transformerRef = React.useRef();
  const currentShapeId = React.useRef();
  const inputRef = React.useRef(null); // HTML input elementiga referens
  const lineRef = React.useRef(null)
  const lineGroupRef = React.useRef(null)

  // text
  const [texts, setTexts] = React.useState([]); // Sahifadagi matnlar ro'yxati
  const [isAddingText, setIsAddingText] = React.useState(false); // Matn qo'shish rejimi
  const [selectedTextId, setSelectedTextId] = React.useState(null); // Tanlangan matn IDsi
  const [newText, setNewText] = React.useState(""); // Foydalanuvchi kiritadigan yangi matn
  const [currentLine, setCurrentLine] = React.useState({ points: [], controlPoints: [] }); // Track the current line
  const [editingTextId, setEditingTextId] = React.useState(null); // Tahrirlanayotgan matn IDsi
  const [showFinishButton, setShowFinishButton] = React.useState(false)
  // text end

  const [lines, setLines] = React.useState([]);
  const [arrows, setArrows] = React.useState([]);
  const [close, setClose] = React.useState(false)
  const [circles, setCircles] = React.useState([]);
  const [scribbles, setScribbles] = React.useState([]);
  const [ellipses, setEllipses] = React.useState([]);
  const [rectangles, setRectangles] = React.useState([]);
  const [tanlanganShape, setTanlanganShape] = React.useState(null)
  const [arcs, setArcs] = React.useState([]);
  const [historyStep, setHistoryStep] = React.useState(0);
  const [splines, setSplines] = React.useState([]);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [action, setAction] = React.useState(ACTIONS.SELECT);
  const [selectedShapes, setSelectedShapes] = React.useState([]);
  const [hoveradShapeId, setHoveradShapeId] = React.useState(null);
  const [curve, setCurve] = React.useState({ points: [], controlPoints: [] });
  const [transformedPoints, setTransformedPoints] = React.useState(curve.points);
  const [stageSize, setStageSize] = React.useState({ width: window.innerWidth, height: window.innerHeight });
  const [history, setHistory] = React.useState([{
    rectangles: [],
    circles: [],
    arrows: [],
    scribbles: [],
  }]);
  const [showParams, setShowParams] = React.useState(false)
  const [allShapes, setAllShapes] = React.useState([])
  const [openRightSideContent, setOpenRightSideContent] = React.useState(false)
  const [showControlPoints, setShowControlPoints] = React.useState(true)
  const [isFilled, setIsFilled] = React.useState(false)
  const [bgColor, setBgColor] = React.useState('transparent')

  const saveState = () => {
    console.log('saved');

    setHistory((prevHistory) => {
      const newHistory = prevHistory.slice(0, historyStep + 1);
      newHistory.push({ rectangles, circles, arrows, scribbles });
      return newHistory;
    });
    setHistoryStep((prevStep) => prevStep + 1);
  };

  const handleUndo = () => {
    console.log('hello');

    if (historyStep === 0) return;
    setHistoryStep((prevStep) => prevStep - 1);
    const previousState = history[historyStep - 1];
    setRectangles(previousState.rectangles);
    setCircles(previousState.circles);
    setArrows(previousState.arrows);
    setScribbles(previousState.scribbles);
  };

  const handleRedo = () => {
    if (historyStep >= history.length - 1) return;
    setHistoryStep((prevStep) => prevStep + 1);
    const nextState = history[historyStep + 1];
    setRectangles(nextState.rectangles);
    setCircles(nextState.circles);
    setArrows(nextState.arrows);
    setScribbles(nextState.scribbles);
  };

  const distanceToSegment = (x1, y1, x2, y2, x, y) => {
    const length2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (length2 === 0) return Math.hypot(x - x1, y - y1);
    const t = Math.max(
      0,
      Math.min(1, ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / length2)
    );
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    return Math.hypot(x - projX, y - projY);
  };

  const addControlPoint = (setCurve, x, y) => {
    setCurve((prev) => {
      const newPoints = [...prev.controlPoints, { x, y }];
      const updatedPoints = newPoints.flatMap((p) => [p.x, p.y]);
      return { ...prev, points: updatedPoints, controlPoints: newPoints };
    });
  };

  const handleStageClick = (e) => {
    if (!isDrawing) return;
    const { x, y } = e.target.getStage().getPointerPosition();

    // Get the line object (assuming you have a reference to it)
    const line = lineRef.current;

    // Invert the line's transform to convert the absolute click position
    // to a position relative to the line's origin
    const relativeClickPos = line.getAbsoluteTransform().copy().invert().point({ x, y });

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

        const dist = distanceToSegment(x1, y1, x2, y2, relativeClickPos.x, relativeClickPos.y);
        if (dist < tolerance && dist < minDist) {
          minDist = dist;
          segmentIndex = i;
          newPoint = relativeClickPos; // Use the relative position here
        }
      }

      if (segmentIndex >= 0 && newPoint) {
        const newPoints = [
          ...curve.points.slice(0, segmentIndex + 2),
          newPoint.x,
          newPoint.y,
          ...curve.points.slice(segmentIndex + 2),
        ];
        const newControlPoints = [
          ...curve.controlPoints.slice(0, segmentIndex / 2 + 1),
          newPoint,
          ...curve.controlPoints.slice(segmentIndex / 2 + 1),
        ];

        setCurve({
          points: newPoints,
          controlPoints: newControlPoints,
        });
      } else {
        addControlPoint(setCurve, relativeClickPos.x, relativeClickPos.y);
      }
    } else {
      addControlPoint(setCurve, relativeClickPos.x, relativeClickPos.y);
    }
  };

  React.useEffect(() => {
    if (transformerRef.current) {
      transformerRef.current.nodes([lineRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, []);

  const updateCircles = () => {
    const transform = lineRef.current.getAbsoluteTransform();
    const updatedPoints = curve.controlPoints.map((point) => {
      const transformedPoint = transform.point(point);
      return { x: transformedPoint.x, y: transformedPoint.y };
    });
    setTransformedPoints(updatedPoints);
  };

  // const handleTransformNew = () => {
  //   updateCircles();
  // };

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
    // setTanlanganShape(e.target.attrs.type)
    handleTransformNew()
    setTanlanganShape(e.target.attrs)
    // const { x, y, width, height } = e.target.attrs;
    // setTanlanganShape((prev) => ({
    //   ...prev,
    //   x,
    //   y,
    //   width, height
    // }));

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
    const pos = e.target.getStage().getPointerPosition();
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
        setCurrentLine({
          points: [x, y],
          controlPoints: [{ x, y }],
        });
        break;
      case ACTIONS.ARC:
        setArcs([
          ...arcs,
          {
            name: `arc-${id}`,
            closed: false,
            type: 'arc',
            points: [
              {
                x: pos.x,
                y: pos.y,
                formulas: {
                  y: {
                    datatype: "IamFormula",
                    place: pos.y,
                    KEYID: id,
                  },
                  x: {
                    datatype: "IamFormula",
                    place: pos.x,
                    KEYID: id,
                  },
                },
              },
            ],
            id,
            height: 20,
            width: 20,
            innerRadius: 10,
            outerRadius: 10,
            angle: 90,
            rotation: 180,
          },
        ]);
        break;
      case ACTIONS.ELLIPSE:
        setIsDrawing(true);
        setEllipses((ellipses) => [
          ...ellipses,
          {
            name: `polygon-${id}`,
            closed: false,
            type: 'ellipse',
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
            radiusX: 0,
            radiusY: 0,
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
    saveState();
  };

  const onPointerMove = (e) => {
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
          updateLinePoints(lines, currentShapeId.current, x, y),
        );
        setCurrentLine((prevCurve) => ({
          points: [...prevCurve.points, x, y],
          controlPoints: [...prevCurve.controlPoints, { x, y }],
        }));
        setAction(ACTIONS.LINE)
        break;
      case ACTIONS.ARC:
        setArcs((prevArcs) => {
          const updatedArcs = [...prevArcs];
          const lastArc = updatedArcs[updatedArcs.length - 1];
          const dx = x - lastArc.points[0].x;
          const dy = y - lastArc.points[0].y;
          const radius = Math.sqrt(dx * dx + dy * dy);

          updatedArcs[updatedArcs.length - 1] = {
            ...lastArc,
            type: 'arc',
            outerRadius: Math.max(radius, 0),
            innerRadius: Math.max(radius - 0, 70),
            angle: (Math.atan2(dy, dx) * (180 / Math.PI) + 360) % 360,
          };

          return updatedArcs;
        });
        break;
      case ACTIONS.ELLIPSE:
        setIsDrawing(false)
        setEllipses((prevEllipses) =>
          prevEllipses.map((ellipse) =>
            ellipse.id === currentShapeId.current
              ? {
                ...ellipse,
                radiusX: Math.abs(ellipse.points[0].x - x),
                radiusY: Math.abs(ellipse.points[0].y - y),
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
    setAction(ACTIONS.SELECT)
    isPainting.current = false;
  };

  const handleDragMoveCircle = (index) => (e) => {
    // Get the circle's absolute position
    const circleAbsPos = e.target.getAbsolutePosition();

    // Get a copy of the line's absolute transform (important to avoid modifying the original)
    const lineTransform = lineRef.current.getAbsoluteTransform().copy();

    // Invert the line transform to map the point back to the line's local space
    const newLinePoint = lineTransform.invert().point(circleAbsPos);

    // Update the corresponding point in the line's points array
    const updatedPoints = [...curve.points];
    updatedPoints[index * 2] = newLinePoint.x;
    updatedPoints[index * 2 + 1] = newLinePoint.y;

    setCurve({
      ...curve,
      points: updatedPoints,
    });
  };


  // click qilganda select bolganiligini bildirib turuvchi border qoshadi
  const setSelectedBorder = (e) => {
    const target = e.currentTarget;
    transformerRef.current.nodes([target]);
  }

  const onClick = (e) => {
    const shapes = stageRef.current.find(".object")
    // console.log(shapes);
    setAllShapes(shapes)

    setTanlanganShape(e.target.attrs)
    console.log(e.target.attrs.className);

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

  const handleShowParametrs = (e) => {
    setShowParams(e.target.checked)
  }

  const deleteShape = () => {
    if (!tanlanganShape || !tanlanganShape.id) {
      return;
    }
    const shapeId = tanlanganShape.id;
    console.log(shapeId, 'shape id');

    const shapeToDelete = stageRef.current.findOne(`#${shapeId}`);
    if (shapeToDelete) {
      console.log('deleted');

      shapeToDelete.destroy();
      stageRef.current.draw();
      setAllShapes(stageRef.current.find(".object"))
      transformerRef.current.nodes([]);
    } else {
      alert('Select one shape')
    }
  };

  const copyShape = () => {
    if (!tanlanganShape || !tanlanganShape.id) {
      alert('Select a shape to copy');
      return;
    }

    const shapeId = tanlanganShape.id;
    const shapeToCopy = stageRef.current.findOne(`#${shapeId}`);
    const layer = layerRef.current;

    // setSelectedBorder(shapeId)

    if (shapeToCopy) {
      console.log('copied', shapeToCopy);

      // Clone the shape with initial properties
      const clonedShape = shapeToCopy.clone({
        x: shapeToCopy.x() + 10, // Slight offset to differentiate the clone visually
        y: shapeToCopy.y() + 10,
        id: uuidv4(), // Assign a new unique ID
        draggable: true, // Make the cloned shape draggable
        name: 'object',
        width: shapeToCopy.width(),
        height: shapeToCopy.height(),
        fill: 'transparent', // or the same as the original
      });

      clonedShape.setAttrs({})

      clonedShape.on('mouseenter', () => {
        clonedShape.stroke('#00000044'); // Update stroke on hover
        clonedShape.strokeWidth(10); // Update stroke width on hover
        layer.batchDraw(); // Redraw the layer to show changes
      });

      clonedShape.on('mouseleave', () => {
        clonedShape.stroke('black'); // Revert stroke on mouse leave
        clonedShape.strokeWidth(4); // Revert stroke width on mouse leave
        layer.batchDraw(); // Redraw the layer to show changes
      });

      // Add event handlers to the cloned shape
      clonedShape.on('click', onClick);
      clonedShape.on('dragmove', handleDragMove);
      clonedShape.on('dragend', (e) => handleDragEnd(clonedShape.id(), 'position', e));
      clonedShape.on('mouseenter', () => handleMouseEnter(action, setHoveradShapeId, clonedShape.id()));
      clonedShape.on('mouseleave', () => handleMouseLeave(action, setHoveradShapeId, clonedShape.id()));
      clonedShape.on('mouseup', (e) => setSelectedBorder(e));

      // Add the cloned shape to the layer
      // setSelectedBorder(clonedShape)
      layer.add(clonedShape);
      layer.batchDraw(); // Redraw layer for performance

      // Update the list of all shapes
      setAllShapes(stageRef.current.find('.object'));
    } else {
      alert('Select a shape to copy');
    }
  };

  const filledShape2 = () => {
    const selectedRectId = tanlanganShape.id; // Get the ID of the selected rectangle (implementation details may vary depending on your selection logic)
    const shapes = stageRef.current.find(".object");

    shapes.forEach((shape) => {
      if (shape.getClassName() === 'Rect') {
        if (shape.attrs.id === selectedRectId) {
          shape.cornerRadius(0); // Set the corner radius to 10
          shape.getLayer().batchDraw(); // Redraw the layer for changes to take effect
        }
      }
    });
  };

  const filledShape = () => {
    const selectedRectId = tanlanganShape.id; // Get the ID of the selected rectangle (implementation details may vary depending on your selection logic)
    const shapes = stageRef.current.find(".object");

    shapes.forEach((shape) => {
      if (shape.getClassName() === 'Rect') {
        if (shape.attrs.id === selectedRectId) {
          shape.cornerRadius(10); // Set the corner radius to 10
          shape.getLayer().batchDraw(); // Redraw the layer for changes to take effect
        }
      }
    });
  };

  const positionCircles = () => {
    const line = lineRef.current;
    const circles = layerRef.current.find(".circle");

    for (let i = 0; i < line.points().length; i += 2) {
      const point = { x: line.points()[i], y: line.points()[i + 1] };
      const transformedPoint = line.getAbsoluteTransform().point(point);

      circles[i / 2].absolutePosition(transformedPoint);
    }
  };

  const handleTransformNew = () => {
    positionCircles();
  };

  const handleBgColor = (e) => {
    const selectedRectId = tanlanganShape.id; // Get the selected shape's ID
    const shapes = stageRef.current.find(".object"); // Find all shapes

    shapes.forEach((shape) => {
      if (shape.attrs.id === selectedRectId) {
        const color = e.target.dataset.color;

        if (color === 'transparent') {
          shape.fill('transparent');
          shape.fillEnabled(false); // Disable the fill
        } else {
          shape.fill(color);
          shape.fillEnabled(true); // Enable the fill for any other color
        }

        shape.getLayer().batchDraw(); // Redraw the layer to apply changes
      }
    });
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
          <div className='p-2 border rounded-xl shadow-xl w-[220px] h-[700px] z-10 absolute top-1/2 right-5 transform -translate-y-1/2'>
            <p className='capitalize text-[12px] text-gray-500'>Background</p>
            <div className='flex items-center gap-1 pt-2 pl-2'>
              <button onClick={(e) => handleBgColor(e)} data-color="#f0f4f8" className='w-[25px] h-[25px] bg-[#f0f4f8] rounded-sm'></button>
              <button onClick={(e) => handleBgColor(e)} data-color="#f8a5c2" className='w-[25px] h-[25px] bg-[#f8a5c2] rounded-sm'></button>
              <button onClick={(e) => handleBgColor(e)} data-color="#00b894" className='w-[25px] h-[25px] bg-[#00b894] rounded-sm'></button>
              <button onClick={(e) => handleBgColor(e)} data-color="#3498db" className='w-[25px] h-[25px] bg-[#3498db] rounded-sm'></button>
              <button onClick={(e) => handleBgColor(e)} data-color="#fbc531" className='w-[25px] h-[25px] bg-[#fbc531] rounded-sm'></button>
              <button onClick={(e) => handleBgColor(e)} data-color="#d1c4b8" className='w-[25px] h-[25px] bg-[#d1c4b8] rounded-sm'></button>
              <button onClick={(e) => handleBgColor(e)} data-color="transparent" className='w-[25px] h-[25px] border rounded-sm'></button>
            </div>
            <div className='controlls flex flex-col gap-2 '>
              {Object.keys(tanlanganShape).filter((pr, idx) => pr === 'width' || pr === 'height' || pr === 'radius' || pr === 'x' || pr === 'y' || pr === 'strokeWidth' || pr === 'radiusX' || pr === 'radiusY').map((property) => (
                <div className='flex flex-col' key={property}>
                  <p className='capitalize text-[12px] text-gray-500'>{property}:</p>
                  <input
                    key={tanlanganShape.id + '-' + property}
                    max={1000}
                    min={1}
                    onChange={(e) => handleControlInput(property, e)}
                    defaultValue={tanlanganShape[property]}
                    type="number"
                    className='border p-1 w-full rounded-md'
                    placeholder={property}
                  />
                </div>
              ))}
              <div className='flex items-center gap-2 my-1'>
                <label className="switch">
                  <input
                    type="checkbox" onChange={handleShowParametrs} />
                  <span className="slider round"></span>
                </label>
                <span>Show parametres</span>
              </div>
              <p className='capitalize text-[12px] text-gray-500'>Edges</p>
              <div className='flex gap-2'>
                <button className='border p-2 rounded-md' onClick={filledShape2}>
                  <svg width={20} aria-hidden="true" focusable="false" role="img" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><svg strokeWidth="1.5"><path d="M3.33334 9.99998V6.66665C3.33334 6.04326 3.33403 4.9332 3.33539 3.33646C4.95233 3.33436 6.06276 3.33331 6.66668 3.33331H10"></path><path d="M13.3333 3.33331V3.34331"></path><path d="M16.6667 3.33331V3.34331"></path><path d="M16.6667 6.66669V6.67669"></path><path d="M16.6667 10V10.01"></path><path d="M3.33334 13.3333V13.3433"></path><path d="M16.6667 13.3333V13.3433"></path><path d="M3.33334 16.6667V16.6767"></path><path d="M6.66666 16.6667V16.6767"></path><path d="M10 16.6667V16.6767"></path><path d="M13.3333 16.6667V16.6767"></path><path d="M16.6667 16.6667V16.6767"></path></svg></svg>
                </button>
                <button className='border p-2 rounded-md' onClick={filledShape}>
                  <svg width={20} aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><g strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 12v-4a4 4 0 0 1 4 -4h4"></path><line x1="16" y1="4" x2="16" y2="4.01"></line><line x1="20" y1="4" x2="20" y2="4.01"></line><line x1="20" y1="8" x2="20" y2="8.01"></line><line x1="20" y1="12" x2="20" y2="12.01"></line><line x1="4" y1="16" x2="4" y2="16.01"></line><line x1="20" y1="16" x2="20" y2="16.01"></line><line x1="4" y1="20" x2="4" y2="20.01"></line><line x1="8" y1="20" x2="8" y2="20.01"></line><line x1="12" y1="20" x2="12" y2="20.01"></line><line x1="16" y1="20" x2="16" y2="20.01"></line><line x1="20" y1="20" x2="20" y2="20.01"></line></g></svg>
                </button>
              </div>
              {tanlanganShape.className === 'haligi-line' &&
                <div>
                  <p className='capitalize text-[12px] text-gray-500'>Line actions</p>
                  <div className='flex itsm-center gap-2 mt-2'>
                    <button className='border p-1 rounded-md'>Stop Line</button>
                    <button className='border p-2 rounded-md' onClick={() => setShowControlPoints(!showControlPoints)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" viewBox="0 0 24 24"><path fill="currentColor" d="M12 6h2V4h-2zm-7 8h2v-2H5zm12 6h2v-2h-2zm-2 0v-.5L8 16H5q-.825 0-1.412-.587T3 14v-2q0-.825.588-1.412T5 10h2.3L10 6.9V4q0-.825.588-1.412T12 2h2q.825 0 1.413.588T16 4v2q0 .825-.587 1.413T14 8h-2.3L9 11.1v3.15l6.125 3.05q.2-.575.713-.937T17 16h2q.825 0 1.413.588T21 18v2q0 .825-.587 1.413T19 22h-2q-.825 0-1.412-.587T15 20" /></svg>
                    </button>
                  </div>
                </div>
              }
              <p className='capitalize text-[12px] text-gray-500'>Actions</p>
              <div className='flex gap-2'>
                <button className='p-2 border border rounded-md' onClick={deleteShape}>
                  <svg width={20} aria-hidden="true" focusable="false" role="img" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path strokeWidth="1.25" d="M3.333 5.833h13.334M8.333 9.167v5M11.667 9.167v5M4.167 5.833l.833 10c0 .92.746 1.667 1.667 1.667h6.666c.92 0 1.667-.746 1.667-1.667l.833-10M7.5 5.833v-2.5c0-.46.373-.833.833-.833h3.334c.46 0 .833.373.833.833v2.5"></path></svg>
                </button>
                <button className='border p-2 border rounded-md' onClick={copyShape}>
                  <svg width={20} aria-hidden="true" focusable="false" role="img" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><g strokeWidth="1.25"><path d="M14.375 6.458H8.958a2.5 2.5 0 0 0-2.5 2.5v5.417a2.5 2.5 0 0 0 2.5 2.5h5.417a2.5 2.5 0 0 0 2.5-2.5V8.958a2.5 2.5 0 0 0-2.5-2.5Z"></path><path clipRule="evenodd" d="M11.667 3.125c.517 0 .986.21 1.325.55.34.338.55.807.55 1.325v1.458H8.333c-.485 0-.927.185-1.26.487-.343.312-.57.75-.609 1.24l-.005 5.357H5a1.87 1.87 0 0 1-1.326-.55 1.87 1.87 0 0 1-.549-1.325V5c0-.518.21-.987.55-1.326.338-.34.807-.549 1.325-.549h6.667Z"></path></g></svg>
                </button>
              </div>
            </div>
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
            onMouseDown={handleSelectShape}
            onMouseUp={onPointerUp}
            onClick={(e) => handleStageClick(e, isDrawing, curve, setCurve)}
          >
            <Layer ref={layerRef}>
              <Text zIndex={100} text="undo" x={200} onClick={handleUndo} />
              <Text zIndex={100} text="redo" x={400} onClick={handleRedo} />
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
                  fillPatternImage={img}
                  fillPatternX={0}
                  fillPatternY={0}
                  type="rectangle"
                  key={rectangle.id}
                  id={rectangle.id}
                  x={rectangle.points[0].x}
                  y={rectangle.points[0].y}
                  // fillPatternImage={image}
                  // fillPatternRepeat="repeat"
                  strokeWidth={4}
                  height={rectangle.height}
                  width={rectangle.width}
                  draggable={action === ACTIONS.SELECT}
                  // cornerRadius={10}
                  onClick={onClick}
                  onDragMove={handleDragMove}
                  onDragEnd={(e) => handleDragEnd(rectangle.id, 'position', e)}
                  // onTap={handleSelectShape}
                  name='object'
                  fillEnabled={false} // hatch qoshish un ochirish kerak
                  fill={bgColor} // hatch qoshish un ochirish kerak
                  stroke={hoveradShapeId === rectangle.id ? '#00000044' : 'black'}
                  onMouseEnter={() => handleMouseEnter(action, setHoveradShapeId, rectangle.id)}
                  onMouseLeave={() => handleMouseLeave(action, setHoveradShapeId, rectangle.id)}
                  onMouseUp={(e) => {
                    console.log('------------', e);
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
                  strokeWidth={4}
                  onMouseUp={(e) => {
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
                  onClick={onClick}
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
                  id={arc.id}
                  key={arc.id}
                  x={arc.points[0].x}
                  y={arc.points[0].y}
                  innerRadius={arc.innerRadius}
                  outerRadius={arc.outerRadius}
                  angle={arc.angle}
                  rotation={arc.rotation}
                  strokeWidth={4}
                  fill="transparent"
                  draggable={action === ACTIONS.SELECT}
                  onClick={onClick}
                  onDragMove={handleDragMove}
                  onDragEnd={(e) => handleDragEnd(arc.id, 'position', e)}
                  onTap={handleSelectShape}
                  name='object'
                  stroke={hoveradShapeId === arc.id ? '#00000044' : 'black'}
                  onMouseEnter={() => handleMouseEnter(action, setHoveradShapeId, arc.id)}
                  onMouseLeave={() => handleMouseLeave(action, setHoveradShapeId, arc.id)}
                  onMouseUp={(e) => {
                    setAction(ACTIONS.SELECT)
                    setSelectedBorder(e)
                  }
                  }
                />
              ))}
              <Group draggable>
                <Line
                  ref={lineRef}
                  className="haligi-line"
                  points={curve.points}
                  lineCap="round"
                  name="object"
                  lineJoin="round"
                  tension={0}
                  closed={close}
                  fill={null}
                  stroke={hoveradShapeId === curve.id ? '#00000044' : 'black'}
                  strokeWidth={hoveradShapeId === curve.id ? 10 : 4}
                  onClick={onClick}
                  fillEnabled={false}
                  onDragMove={handleDragMove}
                  onTransform={handleTransformNew}
                  onMouseEnter={() => handleMouseEnter(action, setHoveradShapeId, curve.id)}
                  onMouseLeave={() => handleMouseLeave(action, setHoveradShapeId, curve.id)}
                  onMouseUp={(e) => setSelectedBorder(e)
                  }
                />
                {showControlPoints &&
                  curve.controlPoints.map((point, i) => (
                    <Circle
                      key={i}
                      x={point.x}
                      y={point.y}
                      radius={hoveradShapeId === i ? 11 : 9}
                      name="circle"
                      fill="red"
                      draggable
                      onDragMove={handleDragMoveCircle(i)}
                      onMouseEnter={() => handleMouseEnter(action, setHoveradShapeId, i)}
                      onMouseLeave={() => handleMouseLeave(action, setHoveradShapeId, i)}
                    />
                  ))}
              </Group>
              {ellipses.map((ellipse) => (
                <Ellipse
                  type="ellipse"
                  key={ellipse.id}
                  id={ellipse.id}
                  x={ellipse.points[0].x}
                  y={ellipse.points[0].y}
                  radiusX={ellipse.radiusX}
                  radiusY={ellipse.radiusY}
                  fillEnabled={false}
                  strokeWidth={4}
                  draggable
                  name='object'
                  onDragMove={handleDragMove}
                  onDragEnd={(e) => handleDragEnd(ellipse.id, null, e)}
                  onClick={onClick}
                  fill="transparent"
                  stroke={hoveradShapeId === ellipse.id ? '#00000044' : 'black'}
                  onMouseEnter={() => handleMouseEnter(action, setHoveradShapeId, ellipse.id)}
                  onMouseLeave={() => handleMouseLeave(action, setHoveradShapeId, ellipse.id)}
                  onMouseUp={(e) => {
                    setAction(ACTIONS.SELECT)
                    setSelectedBorder(e)
                  }
                  }
                />
              ))}
              {texts.map((text) => (
                <React.Fragment key={text.id}>
                  <Text key={text.id}
                    x={text.x}
                    y={text.y}
                    text={text.text}
                    fontSize={24}
                    fontFamily="Arial"
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
                          fontFamily: "Arial",
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
              <Transformer
                anchorCornerRadius={3}
                padding={20}
                // shouldOverdrawWholeArea={true} 
                ref={transformerRef} />
              {showParams && <TextComponent shapes={allShapes} />}
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
