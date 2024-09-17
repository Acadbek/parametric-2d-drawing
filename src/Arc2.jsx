import React from "react";
import { Circle, Group, Layer, Line, Stage, Transformer } from "react-konva";
import { handleStageClick } from "./scripts";
import { v4 as uuidv4 } from "uuid";

const DrawLine = () => {
  const [stageSize, setStageSize] = React.useState({ width: window.innerWidth, height: window.innerHeight });
  const [curve, setCurve] = React.useState({ points: [], controlPoints: [] });
  const [tanlanganShape, setTanlanganShape] = React.useState();
  const [isDrawing, setIsDrawing] = React.useState();
  const [currentLine, setCurrentLine] = React.useState({ points: [], controlPoints: [] });
  const [lines, setLines] = React.useState([]);

  const transformerRef = React.useRef();
  const stageRef = React.useRef();
  const lineRef = React.useRef();
  const currentShapeId = React.useRef();
  const isPainting = React.useRef();
  const layerRef = React.useRef();

  // Utility function to calculate distance from a point to a segment
  const distanceToSegment = (x1, y1, x2, y2, x, y) => {
    const length2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (length2 === 0) return Math.hypot(x - x1, y - y1);
    const t = Math.max(0, Math.min(1, ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / length2));
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    return Math.hypot(x - projX, y - projY);
  };

  // Adds a new control point to the curve
  const addControlPoint = (setCurve, x, y) => {
    setCurve(prev => {
      const newPoints = [...prev.controlPoints, { x, y }];
      const updatedPoints = newPoints.flatMap(p => [p.x, p.y]);
      return { ...prev, points: updatedPoints, controlPoints: newPoints };
    });
  };

  // Handles clicks on the stage, adds new points or adjusts existing ones
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
        addControlPoint(setCurve, x, y);
      }
    } else {
      addControlPoint(setCurve, x, y);
    }
  };


  // Handles pointer down event to start drawing a line
  const onPointerDown = (e) => {
    const pos = e.target.getStage().getPointerPosition();
    const stage = stageRef.current;
    const { x, y } = stage.getPointerPosition();
    const id = uuidv4();

    // Set the current shape ID and mark the painting state
    currentShapeId.current = id;
    isPainting.current = true;

    const action = 'LINE';

    // Start drawing a line if the action is 'LINE'
    switch (action) {
      case "LINE":
        setIsDrawing(true);
        setCurrentLine({
          points: [x, y],
          controlPoints: [{ x, y }],
        });
        break;
    }
  };

  // Updates the points of the line being drawn
  const updateLinePoints = (lines, id, x, y) => {
    return lines.map(line => line.id === id
      ? { ...line, points: [line.points[0], line.points[1], x, y] }
      : line
    );
  };


  // Handles pointer move event to update the line's points
  const onPointerMove = (e) => {
    const stage = stageRef.current;
    const { x, y } = stage.getPointerPosition();

    const action = "LINE";

    // Update line points and current line on pointer move
    switch (action) {
      case "LINE":
        setLines((lines) =>
          updateLinePoints(lines, currentShapeId.current, x, y),
        );
        setCurrentLine((prevCurve) => ({
          points: [...prevCurve.points, x, y],
          controlPoints: [...prevCurve.controlPoints, { x, y }],
        }));
        break;
    }
  };

  // Handles pointer up event to stop drawing
  const onPointerUp = () => {
    isPainting.current = false;
  };

  // Sets the selected shape and highlights it with a transformer
  const setSelectedBorder = (e) => {
    const target = e.currentTarget;
    transformerRef.current.nodes([target]);
  };

  // Handles transformations on a line, updating control points accordingly
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


  // Repositions control point circles to match the line's position
  const positionCircles = () => {
    const line = lineRef.current;
    const points = line.points();
    const circles = layerRef.current.find(".circle");

    for (let i = 0; i < line.points().length; i += 2) {
      const point = { x: line.points()[i], y: line.points()[i + 1] };
      const transformedPoint = line.getAbsoluteTransform().point(point);

      circles[i / 2].absolutePosition(transformedPoint);
    }
  };


  // Triggers the update of control point positions after a transformation
  const handleTransformNew = () => {
    positionCircles();
  };


  // Handles dragging of shapes, updating the position
  const handleDragMove = (e) => {
    handleTransformNew();
    const { x, y, width, height } = e.target.attrs;
    setTanlanganShape((prev) => ({
      ...prev,
      x,
      y,
      width, height
    }));

    const layer = layerRef.current;
    layer.find('.guid-line').forEach((l) => l.destroy());

    // Additional guide logic (commented out) for snapping to grid or guides can be implemented here

    if (action !== ACTIONS.SELECT) return;
    const target = e.currentTarget;
    transformerRef.current.nodes([target]);
  };
  return (
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
        <Group draggable
        // onTransformEnd={() => handleTransform(curve.id)}
        >
          <Line
            ref={lineRef}
            className="haligi-line"
            points={curve.points}
            lineCap="round"
            name="object"
            lineJoin="round"
            tension={0}
            closed={false}
            fill={null}
            stroke={"black"}
            strokeWidth={4}
            fillEnabled={false}
            onDragMove={handleDragMove}
            onTransform={handleTransformNew}
            onMouseUp={(e) => setSelectedBorder(e)}
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
            />
          ))}
        </Group>
        <Transformer ref={transformerRef} />
      </Layer>
    </Stage>
  );
};

export default DrawLine;
