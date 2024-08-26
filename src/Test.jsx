import React, { useState } from 'react';
import { Stage, Layer, Line, Circle } from 'react-konva';

const DrawingApp = () => {
  const [curve, setCurve] = useState({
    points: [],
    controlPoints: []
  });

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
    const { x, y } = e.target.getStage().getPointerPosition();
    
    // Check if the click is close to any segment
    if (curve.points.length > 0) {
      const tolerance = 10; // Distance tolerance to detect clicks close to line segments
      let minDist = Infinity;
      let segmentIndex = -1;
      let newPoint = null;
      
      // Loop through all line segments
      for (let i = 0; i < curve.points.length - 2; i += 2) {
        const x1 = curve.points[i];
        const y1 = curve.points[i + 1];
        const x2 = curve.points[i + 2];
        const y2 = curve.points[i + 3];
        
        // Calculate distance from the click to the segment
        const dist = distanceToSegment(x1, y1, x2, y2, x, y);
        if (dist < tolerance && dist < minDist) {
          minDist = dist;
          segmentIndex = i;
          newPoint = { x, y };
        }
      }
      
      if (segmentIndex >= 0 && newPoint) {
        // Insert the new point into the points array
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

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      onClick={handleStageClick}
    >
      <Layer>
        {/* Draw the curve */}
        <Line
          points={curve.points}
          stroke="black"
          strokeWidth={2}
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
            radius={5}
            fill="red"
            draggable
            onDragMove={handleDragMove(i)}
          />
        ))}
      </Layer>
    </Stage>
  );
};

export default DrawingApp;
