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

export const handleStageClick = (e, lineRef) => {
  if (!isDrawing) return;
  const { x, y } = e.target.getStage().getPointerPosition();

  // Get the line object (assuming you have a reference to it)
  const line = lineRef.current;

  // Invert the line's transform to convert the absolute click position
  // to a position relative to the line's origin
  const relativeClickPos = line
    .getAbsoluteTransform()
    .copy()
    .invert()
    .point({ x, y });

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

      const dist = distanceToSegment(
        x1,
        y1,
        x2,
        y2,
        relativeClickPos.x,
        relativeClickPos.y
      );
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