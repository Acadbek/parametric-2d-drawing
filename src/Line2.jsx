import React from "react";
import { Circle, Group, Layer, Line, Stage, Transformer } from "react-konva";
import { v4 as uuidv4 } from "uuid";

const DrawLine = () => {
  const [stageSize, setStageSize] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [curve, setCurve] = React.useState({ points: [], controlPoints: [] });
  const [tanlanganShape, setTanlanganShape] = React.useState();
  const [isDrawing, setIsDrawing] = React.useState();
  const [currentLine, setCurrentLine] = React.useState({
    points: [],
    controlPoints: [],
  });
  const [lines, setLines] = React.useState([{ id: 1, points: [234, 565] }]);

  const transformerRef = React.useRef();
  const stageRef = React.useRef();
  const lineRef = React.useRef();
  const currentShapeId = React.useRef();
  const isPainting = React.useRef();
  const layerRef = React.useRef();

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

  const updateLinePoints = (lines, currentShapeId, x, y) => {
    return lines.map((line) => {
      if (line.id === currentShapeId) {
        return {
          ...line,
          points: [line.points[0], line.points[1], x, y],
        };
      }
      return line;
    });
  };


  const onPointerDown = (e) => {
    const { x, y } = e.target.getStage().getPointerPosition();

    setIsDrawing(true)
    setCurrentLine({
      points: [x, y],
      controlPoints: [{ x, y }],
    });
  };

  const onPointerMove = (e) => {
    const { x, y } = e.target.getStage().getPointerPosition();

    setLines((lines) =>
      updateLinePoints(lines, currentShapeId.current, x, y),
    );
    setCurrentLine((prevCurve) => ({
      points: [...prevCurve.points, x, y],
      controlPoints: [...prevCurve.controlPoints, { x, y }],
    }));
  };

  const onPointerUp = () => {
    isPainting.current = false;
  };

  const setSelectedBorder = (e) => {
    const target = e.currentTarget;
    transformerRef.current.nodes([target]);
  };

  const handleTransform = () => {
    const line = stageRef.current.findOne(".haligi-line");
    const lineTransform = line.getAbsoluteTransform().copy().invert();

    const updatedControlPoints = curve.controlPoints.map((point) => {
      const absolutePoint = { x: point.x, y: point.y };
      const transformedPoint = lineTransform.point(absolutePoint);

      return {
        x: transformedPoint.x,
        y: transformedPoint.y,
      };
    });

    setCurve((prevCurve) => ({
      ...prevCurve,
      controlPoints: updatedControlPoints,
    }));

    positionCircles();
  };

  const positionCircles = () => {
    const points = lineRef.current.points();
    const circles = layerRef.current.find(".circle");

    for (let i = 0; i < points.length; i += 2) {
      const point = { x: points[i], y: points[i + 1] };
      const newPoint = lineRef.current.getAbsoluteTransform().point(point);
      circles[i / 2].absolutePosition({
        x: newPoint.x,
        y: newPoint.y,
      });
    }
  };

  const handleTransformNew = () => {
    positionCircles();
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

    // const lineGuideStops = getLineGuideStops(e.target);
    // const itemBounds = getObjectSnappingEdges(e.target);

    // const guides = getGuides(lineGuideStops, itemBounds);

    // if (!guides.length) return;

    // drawGuides(guides);

    // let absPos = e.target.absolutePosition();
    // guides.forEach((lg) => {
    //   if (lg.orientation === 'V') {
    //     absPos.x = lg.lineGuide + lg.offset;
    //   } else if (lg.orientation === 'H') {
    //     absPos.y = lg.lineGuide + lg.offset;
    //   }
    // });
    // e.target.absolutePosition(absPos);

    if (action !== ACTIONS.SELECT) return;
    const target = e.currentTarget;
    transformerRef.current.nodes([target]);
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

  return (
    <>
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={(e) => handleStageClick(e, isDrawing, curve, setCurve)}
      >
        <Layer ref={layerRef}>
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
              stroke='black'
              strokeWidth={4}
              fillEnabled={false}
              onDragMove={handleDragMove}
              onTransform={handleTransformNew}
              onMouseEnter={() => handleMouseEnter(action, setHoveradShapeId, curve.id)}
              onMouseLeave={() => handleMouseLeave(action, setHoveradShapeId, curve.id)}
              onMouseUp={(e) => setSelectedBorder(e)
              }
            />
            {curve.controlPoints.map((point, i) => (
              <Circle
                key={i}
                x={point.x}
                y={point.y}
                radius={9}
                name="circle"
                fill="red"
                draggable
                onDragMove={handleDragMoveCircle(i)}
                onMouseEnter={() => handleMouseEnter(action, setHoveradShapeId, i)}
                onMouseLeave={() => handleMouseLeave(action, setHoveradShapeId, i)}
              />
            ))}
          </Group>

          <Transformer ref={transformerRef} />
        </Layer>
      </Stage>
    </>

  );
};

export default DrawLine;
