import React from "react";
import {
  Circle,
  Layer,
  Group,
  Line,
  Rect,
  Stage,
  Transformer,
} from "react-konva";
import { v4 as uuidv4 } from "uuid";
import { ACTIONS } from "./constants";
import {
  saveState,
  drawCircle,
  drawRectangle,
  handleMouseEnter,
  handleMouseLeave,
  handleStageClick,
  updateLinePoints,
  updateScribblePoints,
} from "./scripts";
import { Tools } from "./components/Tools";
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
  const [close, setClose] = React.useState(false);
  const [circles, setCircles] = React.useState([]);
  const [scribbles, setScribbles] = React.useState([]);
  const [ellipses, setEllipses] = React.useState([
    {
      x: 150,
      y: 100,
      radiusX: 0,
      radiusY: 0,
    },
  ]);
  const [rectangles, setRectangles] = React.useState([
    {
      name: "asd",
      points: [
        {
          x: 100,
          y: 100,
          formulas: {
            y: {
              datatype: "IamFormula",
              place: "y",
              KEYID: "1afnw5r7n5MQRHSGQG1R",
            },
            x: {
              datatype: "IamFormula",
              place: "y",
              KEYID: "1afnw5r7n5MQRHSGQG1R",
            },
          },
        },
      ],
    },
  ]);
  const [tanlanganShape, setTanlanganShape] = React.useState(null);
  const [arcs, setArcs] = React.useState([]);
  const [historyStep, setHistoryStep] = React.useState(0);
  const [splines, setSplines] = React.useState([]);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [action, setAction] = React.useState(ACTIONS.SELECT);
  const [selectedShapes, setSelectedShapes] = React.useState([]);
  const [hoveradShapeId, setHoveradShapeId] = React.useState(null);
  const [curve, setCurve] = React.useState({ points: [], controlPoints: [] });
  const [stageSize, setStageSize] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [history, setHistory] = React.useState([
    {
      rectangles: [],
      circles: [],
      arrows: [],
      scribbles: [],
    },
  ]);
  const [transformedPoints, setTransformedPoints] = React.useState(
    curve.points
  );

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

      setIsAddingText(false);
    } else if (editingTextId !== null) {
      handleTextBlur(editingId);
    }
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
    handleTextClick(e);

    if (isSelected) {
      setSelectedShapes(selectedShapes.filter((id) => id !== shapeId));
    } else {
      setSelectedShapes([...selectedShapes, shapeId]);
    }
  };

  const handlePropertyChange = (id, property, value) => {
    setRectangles((prevRectangles) =>
      prevRectangles.map((rect) =>
        rect.id === id ? { ...rect, [property]: value } : rect
      )
    );

    setCircles((prevCircles) =>
      prevCircles.map((circle) =>
        circle.id === id ? { ...circle, [property]: value } : circle
      )
    );
  };

  // snap -----------------------------------------
  const getLineGuideStops = (skipShape) => {
    const stage = stageRef.current;
    const vertical = [0, stage.width() / 2, stage.width()];
    const horizontal = [0, stage.height() / 2, stage.height()];

    stage.find(".object").forEach((guideItem) => {
      if (guideItem === skipShape) return;
      const box = guideItem.getClientRect();
      vertical.push(box.x, box.x + box.width, box.x + box.width / 2);
      horizontal.push(box.y, box.y + box.height, box.y + box.height / 2);
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
        {
          guide: Math.round(box.x),
          offset: Math.round(absPos.x - box.x),
          snap: "start",
        },
        {
          guide: Math.round(box.x + box.width / 2),
          offset: Math.round(absPos.x - box.x - box.width / 2),
          snap: "center",
        },
        {
          guide: Math.round(box.x + box.width),
          offset: Math.round(absPos.x - box.x - box.width),
          snap: "end",
        },
      ],
      horizontal: [
        {
          guide: Math.round(box.y),
          offset: Math.round(absPos.y - box.y),
          snap: "start",
        },
        {
          guide: Math.round(box.y + box.height / 2),
          offset: Math.round(absPos.y - box.y - box.height / 2),
          snap: "center",
        },
        {
          guide: Math.round(box.y + box.height),
          offset: Math.round(absPos.y - box.y - box.height),
          snap: "end",
        },
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
          resultV.push({
            lineGuide,
            diff,
            snap: itemBound.snap,
            offset: itemBound.offset,
          });
        }
      });
    });

    lineGuideStops.horizontal.forEach((lineGuide) => {
      itemBounds.horizontal.forEach((itemBound) => {
        const diff = Math.abs(lineGuide - itemBound.guide);
        if (diff < GUIDELINE_OFFSET) {
          resultH.push({
            lineGuide,
            diff,
            snap: itemBound.snap,
            offset: itemBound.offset,
          });
        }
      });
    });

    const guides = [];
    const minV = resultV.sort((a, b) => a.diff - b.diff)[0];
    const minH = resultH.sort((a, b) => a.diff - b.diff)[0];
    if (minV) {
      guides.push({
        lineGuide: minV.lineGuide,
        offset: minV.offset,
        orientation: "V",
        snap: minV.snap,
      });
    }
    if (minH) {
      guides.push({
        lineGuide: minH.lineGuide,
        offset: minH.offset,
        orientation: "H",
        snap: minH.snap,
      });
    }
    return guides;
  };

  const drawGuides = (guides) => {
    const layer = layerRef.current;
    guides.forEach((lg) => {
      if (lg.orientation === "H") {
        const line = new Konva.Line({
          points: [-6000, 0, 6000, 0],
          stroke: "rgb(0, 161, 255)",
          strokeWidth: 1,
          name: "guid-line",
          dash: [4, 6],
        });
        layer.add(line);
        line.absolutePosition({ x: 0, y: lg.lineGuide });
      } else if (lg.orientation === "V") {
        const line = new Konva.Line({
          points: [0, -6000, 0, 6000],
          stroke: "rgb(0, 161, 255)",
          strokeWidth: 1,
          name: "guid-line",
          dash: [4, 6],
        });
        layer.add(line);
        line.absolutePosition({ x: lg.lineGuide, y: 0 });
      }
    });
    layer.batchDraw(); // Force immediate update
  };
  // end of snap -------------------------------

  const lineRef = React.useRef(null);

  const updateCircles = () => {
    const line = lineRef.current;
    const transform = line.getAbsoluteTransform().copy();
    transform.invert(); // Transformatsiyani akslantiramiz

    // Nuqtalarni transformatsiya qilamiz
    const updatedPoints = curve.controlPoints.map((point) => {
      const newPoint = transform.point({ x: point.x, y: point.y });
      return { x: newPoint.x, y: newPoint.y };
    });

    setTransformedPoints(updatedPoints);
  };

  // const handleTransform = () => {
  //   updateCircles();
  // };

  const handleTransformEnd = () => {
    handleTransform(); // Transformatsiya tugagandan keyin nuqtalarni yangilaymiz
  };

  const handleTransformNew = () => {
    updateCircles();
  };

  const handleDragMove = (e) => {
    handleTransformNew();
    const { x, y, width, height } = e.target.attrs;
    setTanlanganShape((prev) => ({
      ...prev,
      x,
      y,
      width,
      height,
    }));

    const layer = layerRef.current;
    layer.find(".guid-line").forEach((l) => l.destroy());

    const lineGuideStops = getLineGuideStops(e.target);
    const itemBounds = getObjectSnappingEdges(e.target);

    const guides = getGuides(lineGuideStops, itemBounds);

    if (!guides.length) return;

    drawGuides(guides);

    let absPos = e.target.absolutePosition();
    guides.forEach((lg) => {
      if (lg.orientation === "V") {
        absPos.x = lg.lineGuide + lg.offset;
      } else if (lg.orientation === "H") {
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
    layer.find(".guid-line").forEach((l) => l.destroy());

    const newPosition = e.target.position();
    handlePropertyChange(id, "x", newPosition.x);
    handlePropertyChange(id, "y", newPosition.y);
  };

  const onPointerDown = (e) => {
    if (action === ACTIONS.SELECT) return;
    const id = uuidv4();

    currentShapeId.current = id;
    isPainting.current = true;

    switch (action) {
      case ACTIONS.LINE:
        setIsDrawing(true);
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

  const onPointerMove = (e) => {
    if (action === ACTIONS.SELECT || !isPainting.current) return;

    const stage = stageRef.current;
    const { x, y } = stage.getPointerPosition();

    switch (action) {
      case ACTIONS.LINE:
        setLines((lines) =>
          updateLinePoints(lines, currentShapeId.current, x, y)
        );
        break;
    }
  };

  const onPointerUp = () => {
    isPainting.current = false;
  };

  const handleDragMoveCircle = (index) => (e) => {
    const newPoints = [...curve.controlPoints];
    newPoints[index] = { x: e.target.x(), y: e.target.y() };

    const updatedPoints = newPoints.flatMap((p) => [p.x, p.y]);

    setCurve({
      ...curve,
      points: updatedPoints,
      controlPoints: newPoints,
    });
  };

  // click qilganda select bolganiligini bildirib turuvchi border qoshadi
  const setSelectedBorder = (e) => {
    const target = e.currentTarget;
    transformerRef.current.nodes([target]);
  };

  function handleTransform(curveId) {
    updateCircles();
    const line = stageRef.current.findOne(`.haligi-line[data-id="${curveId}"]`);
    const transform = line.getAbsoluteTransform().invert().copy(); // Transformatsiyani ko'chiramiz

    const updatedControlPoints = curve.controlPoints.map((point) => {
      const newPoint = transform.point({ x: point.x, y: point.y });
      return { x: newPoint.x, y: newPoint.y };
    });

    setCurve((prevCurve) => ({
      ...prevCurve,
      controlPoints: updatedControlPoints,
    }));
  }

  return (
    <>
      {/* <marquee className="text-red-500" behavior="" direction="left">
        This website is currently under construction.
      </marquee> */}
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
            onMouseUp={() => setAction(ACTIONS.SELECT)}
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
              <Group
                draggable={action === ACTIONS.SELECT} // Group draggable if in SELECT mode
                onDragEnd={(e) => handleDragEnd(curve.id, "position", e)} // Handle drag end for the entire group
                onMouseEnter={() =>
                  handleMouseEnter(action, setHoveradShapeId, curve.id)
                }
                onMouseLeave={() =>
                  handleMouseLeave(action, setHoveradShapeId, curve.id)
                }
              // onTransformEnd={() => handleTransform(curve.id)} // Call handleTransform on transformation end
              >
                {/* Line shape */}
                <Line
                  onDragEnd={(e) => handleDragEnd(curve.id, "position", e)} // Handle drag end for the entire group
                  onMouseEnter={() =>
                    handleMouseEnter(action, setHoveradShapeId, curve.id)
                  }
                  onMouseLeave={() =>
                    handleMouseLeave(action, setHoveradShapeId, curve.id)
                  }
                  // onTransformEnd={() => handleTransform(curve.id)}
                  ref={lineRef}
                  className="haligi-line"
                  points={curve.points}
                  lineCap="round"
                  name="object"
                  lineJoin="round"
                  tension={0}
                  closed={close}
                  fill={null}
                  stroke={hoveradShapeId === curve.id ? "#00000044" : "black"}
                  strokeWidth={hoveradShapeId === curve.id ? 10 : 4}
                  fillEnabled={false}
                  onDragMove={handleDragMove}
                  onTransform={handleTransformNew}
                  onMouseUp={(e) => setSelectedBorder(e)}
                  onTransformEnd={handleTransformEnd}
                />

                {/* Draw control points */}
                {curve.controlPoints.map((point, i) => (
                  <Circle
                    key={point.id}
                    x={point.x}
                    y={point.y}
                    radius={9}
                    name="object"
                    fill="red"
                    draggable
                    onDragMove={handleDragMoveCircle(i)}
                  />
                ))}
              </Group>

              <Transformer ref={transformerRef} />
            </Layer>
          </Stage>
        </div>
      </div>
    </>
  );
};

export default App;
